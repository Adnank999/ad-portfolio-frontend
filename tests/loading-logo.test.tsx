import { afterEach, expect, test } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { existsSync, readFileSync } from 'node:fs'
import { LoadingLogo } from '../src/components/feedback/loading-logo/LoadingLogo'

afterEach(cleanup)

test('the supplied angular SVG artwork renders immediately in server HTML without a canvas or image', () => {
  const markup = renderToString(<LoadingLogo />)
  expect(markup).toContain('viewBox="0 0 520 520"')
  expect(markup).toContain('M185 323 248 177 Q259 148 270 177 L335 323')
  expect(markup).not.toContain('M219 268 H299')
  expect(markup).toContain('gradientUnits="userSpaceOnUse"')
  expect(markup).toContain('loading-logo-mark')
  expect(markup).toContain('loading-logo-orbit-reverse')
  expect(markup).not.toContain('<canvas')
  expect(markup).not.toContain('<img')
  expect(markup).not.toContain('<script')
})

test('simultaneous loader instances have unique gradient and filter IDs with valid local references', () => {
  const { container } = render(<><LoadingLogo /><LoadingLogo /></>)
  expect(container.querySelectorAll('.loading-logo[aria-hidden="true"]')).toHaveLength(2)
  const identifiers = [...container.querySelectorAll('[id]')].map(element => element.id)
  expect(identifiers).toHaveLength(8)
  expect(new Set(identifiers).size).toBe(8)
  for (const svg of container.querySelectorAll('svg')) {
    expect(svg.getAttribute('focusable')).toBe('false')
    const local = new Set([...svg.querySelectorAll('[id]')].map(element => element.id))
    for (const element of svg.querySelectorAll('[stroke], [filter]')) {
      for (const attribute of ['stroke', 'filter']) {
        const reference = element.getAttribute(attribute)?.match(/^url\(#(.+)\)$/)?.[1]
        if (reference) expect(local.has(reference)).toBe(true)
      }
    }
  }
})

test('the open emblem has no crossbar in its glow or highlight and grain stays clipped to the logo', () => {
  const { container } = render(<LoadingLogo />)
  expect(container.querySelectorAll('.loading-logo-bloom path')).toHaveLength(1)
  expect(container.querySelectorAll('.loading-logo-mark')).toHaveLength(1)
  expect(container.querySelectorAll('.loading-logo-beam')).toHaveLength(1)
  const filter = container.querySelector('filter[id^="loading-grain-"]')!
  expect(filter.querySelector('feTurbulence')?.getAttribute('numOctaves')).toBe('2')
  expect(filter.querySelector('feComposite')?.getAttribute('in2')).toBe('SourceGraphic')
  expect(filter.querySelector('feComposite')?.getAttribute('operator')).toBe('in')
  expect(container.querySelector('.loading-logo-grained')?.getAttribute('filter')).toBe(`url(#${filter.id})`)
  const css = readFileSync(new URL('../src/components/feedback/page-feedback.css', import.meta.url), 'utf8')
  expect(css).toContain('.page-feedback--loading::after')
  expect(css).toContain('pointer-events: none; opacity: .075;')
  expect(css).toContain('background-size: 160px 160px')
  expect(css).toContain('.page-feedback--loading::after { display: none; }')
})

test('SVG animation is scoped, immediately visible and accessible under reduced motion and forced colors', () => {
  const css = readFileSync(new URL('../src/components/feedback/loading-logo/loading-logo.css', import.meta.url), 'utf8')
  expect(css).toContain('@keyframes loading-logo-trace')
  expect(css).toContain('@keyframes loading-logo-orbit')
  expect(css).toContain('animation-delay: -1.8s')
  expect(css).toContain('prefers-reduced-motion: reduce')
  expect(css).toContain('animation: none !important')
  expect(css).toContain('stroke-dashoffset: 0; opacity: 1')
  expect(css).toContain('forced-colors: active')
  expect(css).toContain('stroke: CanvasText')
  expect(css).not.toContain('canvas')
})

test('loading has no graphics imports, network dependencies, preload hook or old model build requirement', () => {
  const source = readFileSync(new URL('../src/components/feedback/loading-logo/LoadingLogo.tsx', import.meta.url), 'utf8')
  for (const forbidden of ['three', 'useEffect', 'fetch(', 'requestAnimationFrame', 'import(', 'useSyncExternalStore']) expect(source).not.toContain(forbidden)
  for (const removed of ['src/components/feedback/LoaderPreload.tsx', 'src/components/feedback/loading-logo/model.ts', 'src/components/feedback/loading-logo/model-url.ts', 'src/components/feedback/loading-logo/renderer.ts', 'src/components/feedback/loading-logo/asset-cache.ts', 'src/components/feedback/loading-logo/poster.ts', 'public/loader/crimson_logo_optimized.glb']) {
    expect(existsSync(new URL(`../${removed}`, import.meta.url))).toBe(false)
  }
  expect(readFileSync(new URL('../src/routes/__root.tsx', import.meta.url), 'utf8')).not.toContain('LoaderPreload')
  const config = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')
  expect(config).not.toContain('VITE_LOADER_MODEL_VERSION')
  expect(config).not.toContain('reload-loading-logo')
  expect(readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8')).not.toContain('public/loader/')
})
