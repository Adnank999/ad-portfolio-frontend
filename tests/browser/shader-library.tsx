import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { ActiveShaderProvider } from '../../src/components/shaders/ActiveShaderProvider'
import { VisualRenderer } from '../../src/components/visuals/VisualRenderer'
import { publishedShaderDefinitions } from '../../src/components/shaders/registry'
import type { ShaderVisual } from '../../src/components/shaders/types'

const results: string[] = []
const errors: string[] = []
window.addEventListener('error', event => errors.push(event.message))
window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)))
const contexts = new Set<WebGL2RenderingContext>()
const draws = new Map<HTMLCanvasElement, number>()
const samples = new Map<HTMLCanvasElement, Set<string>>()
let initializations = 0
const wait = (duration: number) => new Promise(resolve => setTimeout(resolve, duration))
const check = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message)
  results.push(`PASS: ${message}`)
  document.getElementById('result')!.textContent = results.join('\n')
}
async function until(condition: () => boolean, message: string) {
  const deadline = Date.now() + 6500
  while (!condition() && !errors.length && Date.now() < deadline) await wait(50)
  check(condition() && !errors.length, `${message}${errors.length ? `: ${errors.join('; ')}` : ''}`)
}

const getContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function (kind: string, options?: unknown) {
  const context = getContext.call(this, kind as '2d', options as CanvasRenderingContext2DSettings) as unknown as WebGL2RenderingContext | null
  if (kind !== 'webgl2' || !context || contexts.has(context)) return context
  initializations++
  contexts.add(context)
  const renderer = context.getExtension('WEBGL_debug_renderer_info')
  document.body.dataset.renderer = renderer ? context.getParameter(renderer.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER)
  const canvas = this
  const record = () => {
    draws.set(canvas, (draws.get(canvas) ?? 0) + 1)
    const error = context.getError()
    if (error && error !== context.CONTEXT_LOST_WEBGL) errors.push(`WebGL ${error}`)
    if (context.getParameter(context.FRAMEBUFFER_BINDING) === null && canvas.width && canvas.height && (samples.get(canvas)?.size ?? 0) < 2) {
      const width = Math.min(80, canvas.width)
      const height = Math.min(80, canvas.height)
      const pixels = new Uint8Array(width * height * 4)
      context.readPixels(Math.floor((canvas.width - width) / 2), Math.floor((canvas.height - height) / 2), width, height, context.RGBA, context.UNSIGNED_BYTE, pixels)
      const colors = samples.get(canvas) ?? new Set<string>()
      for (let index = 0; index < pixels.length && colors.size < 2; index += 4) {
        colors.add(Array.from(pixels.subarray(index, index + 4)).join(','))
      }
      samples.set(canvas, colors)
    }
  }
  const drawArrays = context.drawArrays.bind(context)
  context.drawArrays = (...parameters) => { drawArrays(...parameters); record() }
  const drawElements = context.drawElements.bind(context)
  context.drawElements = (...parameters) => { drawElements(...parameters); record() }
  const drawArraysInstanced = context.drawArraysInstanced.bind(context)
  context.drawArraysInstanced = (...parameters) => { drawArraysInstanced(...parameters); record() }
  const drawElementsInstanced = context.drawElementsInstanced.bind(context)
  context.drawElementsInstanced = (...parameters) => { drawElementsInstanced(...parameters); record() }
  const extension = context.getExtension.bind(context)
  context.getExtension = (name: string) => {
    const result = extension(name)
    if (name === 'WEBGL_lose_context' && result) {
      const lose = result.loseContext.bind(result)
      result.loseContext = () => { contexts.delete(context); lose() }
    }
    return result
  }
  return context
} as typeof HTMLCanvasElement.prototype.getContext

let root = createRoot(document.getElementById('app')!, { onCaughtError: error => errors.push(String(error)) })
const mount = (visual: ShaderVisual) => flushSync(() => root.render(<StrictMode><ActiveShaderProvider><section><VisualRenderer visual={visual} className="fixture-visual" /></section></ActiveShaderProvider></StrictMode>))
const unmount = () => {
  flushSync(() => root.unmount())
  root = createRoot(document.getElementById('app')!, { onCaughtError: error => errors.push(String(error)) })
}

async function run() {
  for (const definition of Object.values(publishedShaderDefinitions).filter(entry => entry.status === 'draft')) {
    const visual: ShaderVisual = { type: 'shader', shader: definition.id, version: definition.version, props: structuredClone(definition.defaults), alt: definition.name }
    const before = initializations
    mount(visual)
    await until(() => (draws.get(document.querySelector('canvas')!) ?? 0) >= 3, `${definition.name} draws real frames`)
    check(initializations >= before + 2 && contexts.size === 1, `${definition.name} survives Strict Mode with one context`)
    const canvas = document.querySelector<HTMLCanvasElement>('canvas')!
    await until(() => (samples.get(canvas)?.size ?? 0) > 1, `${definition.name} produces nonuniform pixels`)
    const control = definition.controls.find(entry => entry.kind === 'slider')!
    if (control.kind !== 'slider') throw new Error('Expected a slider')
    const previous = Number(visual.props[control.key])
    const value = previous + control.step <= control.max ? previous + control.step : previous - control.step
    const beforeUpdate = draws.get(canvas) ?? 0
    mount({ ...visual, props: { ...visual.props, [control.key]: value } })
    await until(() => (draws.get(canvas) ?? 0) > beforeUpdate + 1, `${definition.name} responds to live controls`)
    check(document.querySelector('canvas') === canvas, `${definition.name} retains its canvas during edits`)
    unmount()
    await until(() => contexts.size === 0 && !document.querySelector('canvas'), `${definition.name} releases its context on navigation`)
  }
  check(!performance.getEntriesByType('resource').some(entry => new URL(entry.name).origin !== location.origin), 'Installed effects do not fetch remote images, fonts or code')
  check(!errors.length, 'Installed effects draw without WebGL or React errors')
  document.getElementById('result')!.textContent = `${results.join('\n')}\n${results.length} installed shader browser checks passed`
  document.body.dataset.status = 'passed'
}

run().catch(error => {
  document.getElementById('result')!.textContent = `${results.join('\n')}\nFAIL: ${error.stack ?? error}`
  document.body.dataset.status = 'failed'
})
