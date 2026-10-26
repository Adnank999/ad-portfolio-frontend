import { afterEach, expect, test } from 'bun:test'
import { readdirSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { useState } from 'react'
import { definition as orb } from '../src/components/shaders/definitions/orb'
import { definition as gradient } from '../src/components/shaders/definitions/gradient-flow'
import { definition as ascii } from '../src/components/shaders/definitions/gradient-ascii'
import { allShaderDefinitions, backendHasShader, backendSupportsShader, getPublishedShader, shaderManifest } from '../src/components/shaders/registry'
import { configuredDefinitions, discoverDefinitions, readyDefinitions } from '../src/components/shaders/registry-core'
import { selectActiveShader } from '../src/components/shaders/active-shader-policy'
import { ActiveShaderProvider } from '../src/components/shaders/ActiveShaderProvider'
import { ShaderEditor } from '../src/components/shaders/ShaderEditor'
import { ServiceVisualField } from '../src/components/admin/service-visual-field/ServiceVisualField'
import { VisualRenderer } from '../src/components/visuals/VisualRenderer'
import { assertServiceVisuals } from '../src/components/shaders/validation'
import { ServiceMedia } from '../src/components/global/service-media/ServiceMedia'
import type { ShaderVisual, VisualConfig } from '../src/components/shaders/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ServiceMedia as Media } from '../src/lib/services/services'
import { ServiceFields } from '../src/components/admin/service-fields/ServiceFields'
import { emptyServiceFields } from '../src/lib/services/services'
import { TestRouter } from './helpers/TestRouter'
import { ServicePage } from '../src/components/global/service-page/ServicePage'
import { webDevelopmentContent } from '../src/components/services/web-development/content'

afterEach(cleanup)
const visual: ShaderVisual = { type: 'shader', shader: 'orb', version: 1, props: structuredClone(orb.defaults), poster: '/poster.webp', alt: 'Crimson orb' }

test('shader definitions are discovered without vendor imports and have different strict schemas', () => {
  const definitionIds = readdirSync(new URL('../src/components/shaders/definitions/', import.meta.url))
    .filter(file => file.endsWith('.ts'))
    .map(file => file.slice(0, -3))
    .sort()
  expect(Object.keys(allShaderDefinitions).sort()).toEqual(definitionIds)
  expect(allShaderDefinitions.orb).toBe(orb)
  expect(allShaderDefinitions['gradient-flow']).toBe(gradient)
  for (const definition of Object.values(allShaderDefinitions)) {
    expect(getPublishedShader(definition.id)).toBe(shaderManifest.shaders.some(entry => entry.id === definition.id && entry.version === definition.version) ? definition : null)
  }
  expect(orb.schema.safeParse(orb.defaults).success).toBe(true)
  expect(gradient.schema.safeParse(gradient.defaults).success).toBe(true)
  expect(orb.schema.safeParse(gradient.defaults).success).toBe(false)
  expect(gradient.schema.safeParse({ ...gradient.defaults, onClick: 'alert(1)' }).success).toBe(false)
  expect(gradient.schema.safeParse({ ...gradient.defaults, colorStops: Array(6).fill('#ffffff') }).success).toBe(false)
  expect(() => discoverDefinitions({ first: { definition: orb }, second: { definition: orb } })).toThrow('duplicate')
  expect(backendSupportsShader(shaderManifest, 'orb')).toBe(true)
  expect(backendSupportsShader({ formatVersion: 1, shaders: [] }, 'orb')).toBe(false)
  expect(backendSupportsShader({ ...shaderManifest, shaders: shaderManifest.shaders.map(entry => ({ ...entry, contract: 'stale' })) }, 'orb')).toBe(false)
  expect(getPublishedShader('constructor')).toBeNull()
  const drafts = discoverDefinitions({
    draft: { definition: { ...orb, id: 'new-effect', status: 'draft' } },
    ready: { definition: orb },
    additional: { definition: { ...gradient, id: 'another-effect' } },
  })
  expect(Object.keys(drafts)).toHaveLength(3)
  expect(Object.keys(readyDefinitions(drafts)).sort()).toEqual(['another-effect', 'orb'])
  const configured = configuredDefinitions(drafts, { ...shaderManifest, shaders: [{ ...shaderManifest.shaders[0], id: 'new-effect', version: 1, defaultActive: false }] })
  expect(Object.keys(configured)).toEqual(['new-effect'])
  const inactive = { ...shaderManifest, shaders: shaderManifest.shaders.map(entry => ({ ...entry, active: false })) }
  expect(backendHasShader(inactive, 'orb')).toBe(true)
  expect(backendSupportsShader(inactive, 'orb')).toBe(false)
  const preparedDraft = { ...shaderManifest, shaders: shaderManifest.shaders.map(entry => ({ ...entry, defaultActive: false })) }
  expect(backendSupportsShader(preparedDraft, 'orb')).toBe(false)
  expect(backendSupportsShader({ ...preparedDraft, shaders: preparedDraft.shaders.map(entry => ({ ...entry, active: true })) }, 'orb')).toBe(true)
})

test('Gradient ASCII is ready with validated controls and matching backend metadata', () => {
  expect(ascii.status).toBe('ready')
  expect(getPublishedShader(ascii.id)).toBe(ascii)
  expect(backendSupportsShader(shaderManifest, ascii.id)).toBe(true)
  expect(ascii.schema.safeParse(ascii.defaults).success).toBe(true)
  expect(ascii.controls.map(control => control.key).sort()).toEqual(Object.keys(ascii.defaults).sort())
  for (const props of [{ ...ascii.defaults, cellSize: 100 }, { ...ascii.defaults, characters: '<script>' }, { ...ascii.defaults, fontFamily: 'url(https://example.com)' }, { ...ascii.defaults, onClick: 'alert(1)' }]) {
    expect(ascii.schema.safeParse(props).success).toBe(false)
  }
  let current: ShaderVisual = { ...visual, shader: ascii.id, props: structuredClone(ascii.defaults) }
  render(<ActiveShaderProvider><ShaderEditor visual={current} backend={shaderManifest} disabled={false} onChange={value => { current = value }} /></ActiveShaderProvider>)
  expect(screen.getByRole('option', { name: 'Gradient ASCII' }).hasAttribute('disabled')).toBe(false)
  fireEvent.change(screen.getByRole('slider', { name: 'Cell size' }), { target: { value: '24' } })
  expect(current.props.cellSize).toBe(24)
})

test('all six slots validate shader props, versions, optional legacy posters and tagged image alternatives', () => {
  for (const slot of ['hero', 'overview', 'spotlight', 'article-1', 'article-2', 'article-3']) expect(() => assertServiceVisuals({ [slot]: visual })).not.toThrow()
  const { poster: _poster, ...withoutPoster } = visual
  expect(() => assertServiceVisuals({ hero: withoutPoster })).not.toThrow()
  expect(() => assertServiceVisuals({ hero: { ...visual, poster: '' } })).not.toThrow()
  for (const invalid of [{ ...visual, shader: 'unknown' }, { ...visual, version: 999 }, { ...visual, poster: null }, { ...visual, poster: '//evil.test/image.webp' }, { ...visual, props: { ...visual.props, speed: 10 } }, { ...visual, props: { ...visual.props, style: {} } }]) expect(() => assertServiceVisuals({ hero: invalid })).toThrow()
  expect(() => assertServiceVisuals({ hero: { type: 'image', src: '/image.webp', alt: 'Image' } })).not.toThrow()
  expect(() => assertServiceVisuals({ unknown: visual })).toThrow()
})

test('SSR keeps an accessible page-colored background without images, lazy shader loaders or canvas', () => {
  const markup = renderToString(<ActiveShaderProvider><VisualRenderer visual={visual} /><VisualRenderer visual={{ ...visual, shader: 'unknown', version: 99 }} /></ActiveShaderProvider>)
  expect(markup).not.toContain('/poster.webp')
  expect(markup).toContain('Crimson orb')
  expect(markup).not.toContain('<img')
  expect(markup.match(/background-color:#151515/g)).toHaveLength(2)
  expect(markup).not.toContain('<canvas')
  expect(markup.match(/data-shader-active="false"/g)).toHaveLength(2)
})

test('hero shaders fill the section behind readable content instead of adding a framed media card', () => {
  const markup = renderToString(<TestRouter><ServicePage content={{ ...webDevelopmentContent, visuals: { hero: visual }, media: [{ slot: 'hero', kind: 'image', url: '/old-hero.webp', alt: 'Old hero', caption: '', poster: '' }] }} /></TestRouter>)
  const tree = document.createElement('div')
  tree.innerHTML = markup
  const hero = tree.querySelector('main > section')!
  const background = hero.querySelector('[data-service-hero-shader]')!
  expect(background.classList.contains('absolute')).toBe(true)
  expect(background.classList.contains('inset-0')).toBe(true)
  expect(background.getAttribute('aria-hidden')).toBe('true')
  expect(background.querySelector('[data-shader-slot]')).toBeTruthy()
  expect(background.firstElementChild!.className).toContain('aspect-auto')
  expect(background.firstElementChild!.className).toContain('rounded-none')
  expect(hero.querySelector('[data-service-hero-media]')).toBeNull()
  expect(hero.querySelector('h1')!.textContent).toBe(webDevelopmentContent.title)
  expect(hero.querySelector('a[href="/contact"]')).toBeTruthy()
  expect(markup).not.toContain('/poster.webp')
  expect(markup).not.toContain('/old-hero.webp')
})

test('hero images and legacy media retain their framed eager-loading layout below the text', () => {
  for (const content of [
    { ...webDevelopmentContent, visuals: { hero: { type: 'image' as const, src: '/hero.webp', alt: 'Image hero' } } },
    { ...webDevelopmentContent, media: [{ slot: 'hero', kind: 'image' as const, url: '/hero.webp', alt: 'Image hero', caption: '', poster: '' }] },
  ]) {
    const tree = document.createElement('div')
    tree.innerHTML = renderToString(<TestRouter><ServicePage content={content} /></TestRouter>)
    const hero = tree.querySelector('main > section')!
    expect(hero.querySelector('[data-service-hero-shader]')).toBeNull()
    const card = hero.querySelector('[data-service-hero-media]')!
    expect(card.className).toContain('mt-10 w-full max-w-4xl')
    expect(card.querySelector('img')!.getAttribute('src')).toBe('/hero.webp')
    expect(card.querySelector('img')!.getAttribute('loading')).toBe('eager')
  }
})

test('active shader arbitration has visibility thresholds, stable ties and hysteresis', () => {
  expect(selectActiveShader({ hero: 0.1 }, null)).toBeNull()
  expect(selectActiveShader({ hero: 0.7, overview: 0.8 }, 'hero')).toBe('hero')
  expect(selectActiveShader({ hero: 0.5, overview: 0.8 }, 'hero')).toBe('overview')
  expect(selectActiveShader({ hero: 0, overview: 0.1 }, 'hero')).toBeNull()
  expect(selectActiveShader({ second: 1, first: 1 }, null)).toBe('first')
})

test('shader controls edit only local state and switch to the selected effect defaults', () => {
  let current = structuredClone(visual)
  function Editor() {
    const [value, setValue] = useState(current)
    current = value
    return <ActiveShaderProvider><ShaderEditor visual={value} backend={shaderManifest} disabled={false} onChange={setValue} /></ActiveShaderProvider>
  }
  render(<Editor />)
  fireEvent.change(screen.getByRole('slider', { name: 'Speed' }), { target: { value: '1.2' } })
  expect(current.props.speed).toBe(1.2)
  fireEvent.click(screen.getByLabelText('Rotate on hover'))
  expect(current.props.rotateOnHover).toBe(false)
  fireEvent.change(screen.getByLabelText('Shader'), { target: { value: 'gradient-flow' } })
  expect(current.props).toEqual(gradient.defaults)
  expect(screen.queryByLabelText('Rotate on hover')).toBeNull()
  expect(screen.getByLabelText('Direction')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Direction'), { target: { value: 'vertical' } })
  expect(current.props.direction).toBe('vertical')
  expect(current.poster).toBe('/poster.webp')
  fireEvent.click(screen.getByText('Add color'))
  expect(current.props.colorStops).toHaveLength(4)
})

test('a saved visual overrides legacy media rather than rendering both', () => {
  const old: Media = { slot: 'overview', kind: 'image', url: '/old.webp', alt: 'Old image', caption: '', poster: '' }
  const markup = renderToString(<ActiveShaderProvider><ServiceMedia media={old} visual={visual} artwork="web" className="aspect-[1.4]" /></ActiveShaderProvider>)
  expect(markup).toContain('data-shader-slot=')
  expect(markup).not.toContain('<img')
  expect(markup).not.toContain('/old.webp')
  expect(markup).toContain('aspect-[1.4]')
  expect(markup).not.toContain('aspect-video')
})

test('the section editor reuses the existing image as poster and restores illustrations explicitly', () => {
  let current: VisualConfig | null = null
  let cleared = false
  function Editor() {
    const [value, setValue] = useState<VisualConfig | null>(null)
    current = value
    return <ServiceVisualField slot="hero" visual={value ?? undefined} legacy={{ slot: 'hero', kind: 'image', url: '/existing.webp', alt: 'Existing hero', poster: '', caption: '' }} backend={shaderManifest} disabled={false} onBusyChange={() => {}} onChange={(next, clear) => { setValue(next); cleared = !!clear }} renderLegacy={() => <p>Existing media</p>} />
  }
  render(<QueryClientProvider client={new QueryClient()}><ActiveShaderProvider><Editor /></ActiveShaderProvider></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Hero visual'), { target: { value: 'shader' } })
  expect((current as ShaderVisual | null)?.poster).toBe('/existing.webp')
  expect(screen.queryByText('Fallback poster (required)')).toBeNull()
  expect(screen.queryByText('Upload hero poster')).toBeNull()
  fireEvent.change(screen.getByLabelText('Hero shader description'), { target: { value: 'Updated description' } })
  expect((current as ShaderVisual | null)?.alt).toBe('Updated description')
  const section = screen.getByLabelText('Hero visual').closest('details')!
  fireEvent.click(within(section).getByText('Restore illustration'))
  expect(current).toBeNull()
  expect(cleared).toBe(true)
})

test('a new shader selection does not require a fallback upload or an existing image', () => {
  let current: VisualConfig | null = null
  function Editor() {
    const [value, setValue] = useState<VisualConfig | null>(null)
    current = value
    return <ActiveShaderProvider><ServiceVisualField slot="hero" visual={value ?? undefined} backend={shaderManifest} disabled={false} onBusyChange={() => {}} onChange={next => setValue(next)} renderLegacy={() => <p>Existing media</p>} /></ActiveShaderProvider>
  }
  render(<QueryClientProvider client={new QueryClient()}><Editor /></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Hero visual'), { target: { value: 'shader' } })
  fireEvent.change(screen.getByLabelText('Hero shader description'), { target: { value: 'Crimson background effect' } })
  expect(current).not.toBeNull()
  expect(current!.type).toBe('shader')
  expect(current).not.toHaveProperty('poster')
  expect(() => assertServiceVisuals({ hero: current })).not.toThrow()
  expect(document.querySelector('input[type="file"]')).toBeNull()
})

test('empty slots can still enter the legacy image/video upload flow', () => {
  function Editor() {
    const [fields, setFields] = useState(emptyServiceFields())
    return <ServiceFields fields={fields} disabled={false} onBusyChange={() => {}} onChange={(name, value) => setFields(previous => ({ ...previous, [name]: value }))} />
  }
  render(<TestRouter><QueryClientProvider client={new QueryClient()}><Editor /></QueryClientProvider></TestRouter>)
  expect(screen.getByRole('link', { name: 'Shaders' }).getAttribute('href')).toBe('/admin/shaders')
  expect(screen.queryByRole('heading', { name: 'Shader availability' })).toBeNull()
  fireEvent.change(screen.getByLabelText('Hero visual'), { target: { value: 'legacy' } })
  expect(screen.getByText('Upload hero media')).toBeTruthy()
  expect(screen.getByLabelText('Media type')).toBeTruthy()
})
