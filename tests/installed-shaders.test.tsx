import { expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { renderToString } from 'react-dom/server'
import { readDefinitions } from '../scripts/shaders/definitions'
import { allShaderDefinitions, backendHasShader, backendSupportsShader, shaderManifest } from '../src/components/shaders/registry'
import { ActiveShaderProvider } from '../src/components/shaders/ActiveShaderProvider'
import { VisualRenderer } from '../src/components/visuals/VisualRenderer'

const installed = ["antigravity","aurora","crystalized-ball","dither-veil","dither","flux-lines","ghost-fibers","gradient-waves","grainient","hyperspeed","laser-flow","letter-glitch","light-pillar","light-tunnel","lightfall","prismatic-burst","soft-aurora","web-threads"]

test('all newly installed effects have configured inactive contracts in both repositories', async () => {
  const configured = await readDefinitions()
  const backendManifest = new URL('../../Backend/assets/shaders.manifest.json', import.meta.url)
  if (existsSync(backendManifest)) {
    expect(readFileSync(new URL('../schemas/shaders.manifest.json', import.meta.url), 'utf8')).toBe(readFileSync(backendManifest, 'utf8'))
  }
  for (const id of installed) {
    const definition = allShaderDefinitions[id]
    expect(configured.some(entry => entry.id === id)).toBe(true)
    expect(definition.status).toBe('draft')
    expect(definition.schema.safeParse(definition.defaults).success).toBe(true)
    expect(definition.controls.length).toBeGreaterThan(0)
    expect(backendHasShader(shaderManifest, id)).toBe(true)
    expect(backendSupportsShader(shaderManifest, id)).toBe(false)
    const active = { ...shaderManifest, shaders: shaderManifest.shaders.map(entry => entry.id === id ? { ...entry, active: true } : entry) }
    expect(backendSupportsShader(active, id)).toBe(true)
  }
})

test('every installed admin control has enforced bounds and rejects executable runtime properties', () => {
  for (const id of installed) {
    const definition = allShaderDefinitions[id]
    for (const key of ['onClick', 'ref', 'dpr', 'style', 'className', 'src', 'surfaceRef', 'revealImage', 'onBoostStart']) {
      expect(definition.schema.safeParse({ ...definition.defaults, [key]: 'untrusted' }).success).toBe(false)
    }
    expect(new Set(definition.controls.map(control => control.key)).size).toBe(Object.keys(definition.defaults).length)
    for (const control of definition.controls) {
      let invalid: unknown
      if (control.kind === 'slider') {
        invalid = control.max + control.step
        expect(definition.schema.safeParse({ ...definition.defaults, [control.key]: control.min - control.step }).success).toBe(false)
      } else if (control.kind === 'toggle') invalid = 'true'
      else if (control.kind === 'select') invalid = 'unknown-choice'
      else if (control.kind === 'color') invalid = 'url(javascript:alert(1))'
      else if (control.kind === 'color-list') invalid = Array(control.maxItems + 1).fill('#FFFFFF')
      expect(definition.schema.safeParse({ ...definition.defaults, [control.key]: invalid }).success).toBe(false)
    }
  }
})

test('new effects remain SSR-safe background-only visuals without importing renderers', () => {
  for (const id of installed) {
    const definition = allShaderDefinitions[id]
    const output = renderToString(<ActiveShaderProvider><VisualRenderer visual={{ type: 'shader', shader: id, version: definition.version, props: structuredClone(definition.defaults), alt: definition.name }} /></ActiveShaderProvider>)
    expect(output).toContain('background-color:#151515')
    expect(output).not.toContain('<canvas')
    expect(output).not.toContain('<img')
  }
})
