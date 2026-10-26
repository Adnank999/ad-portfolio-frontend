import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { ActiveShaderProvider } from '../../src/components/shaders/ActiveShaderProvider'
import { VisualRenderer } from '../../src/components/visuals/VisualRenderer'
import { publishedShaderDefinitions } from '../../src/components/shaders/registry'
import type { ShaderVisual } from '../../src/components/shaders/types'

const results: string[] = []
const wait = (duration: number) => new Promise(resolve => setTimeout(resolve, duration))
const check = (condition: unknown, message: string) => { if (!condition) throw new Error(message); results.push(`PASS: ${message}`) }
async function until(condition: () => unknown, message: string) {
  const deadline = Date.now() + 7000
  while (!condition() && Date.now() < deadline) await wait(40)
  check(condition(), message)
}
const getContext = HTMLCanvasElement.prototype.getContext
const live = new Set<WebGL2RenderingContext>()
const rendered = new Map<HTMLCanvasElement, number>()
let initializations = 0
let maxLive = 0
let deletedPrograms = 0
let deletedBuffers = 0
let unsupported = false
let caughtFailures = 0
const caughtErrors: string[] = []
let compilerFailure: 'vertex' | 'fragment' | 'link' | null = null
const graphicsErrors: number[] = []
let reduced = false
let reducedChanges: (() => void)[] = []
const media = window.matchMedia.bind(window)
window.matchMedia = query => query.includes('prefers-reduced-motion') ? {
  get matches() { return reduced }, media: query, onchange: null,
  addEventListener: (_name: string, callback: () => void) => { reducedChanges.push(callback) },
  removeEventListener: (_name: string, callback: () => void) => { reducedChanges = reducedChanges.filter(value => value !== callback) },
} as unknown as MediaQueryList : media(query)
HTMLCanvasElement.prototype.getContext = function (kind: string, options?: unknown) {
  if (kind === 'webgl2' && unsupported) return null
  const context = getContext.call(this, kind as '2d', options as CanvasRenderingContext2DSettings) as unknown as WebGL2RenderingContext | null
  if (kind === 'webgl2' && context && this.isConnected && !live.has(context)) {
    const rendererInfo = context.getExtension('WEBGL_debug_renderer_info')
    document.body.dataset.renderer = rendererInfo ? context.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER)
    initializations++
    live.add(context)
    maxLive = Math.max(maxLive, live.size)
    const canvas = this
    const shaderParameter = context.getShaderParameter.bind(context)
    const shaderLog = context.getShaderInfoLog.bind(context)
    context.getShaderParameter = (shader, parameter) => {
      const stage = shaderParameter(shader, context.SHADER_TYPE) === context.VERTEX_SHADER ? 'vertex' : 'fragment'
      return parameter === context.COMPILE_STATUS && compilerFailure === stage ? false : shaderParameter(shader, parameter)
    }
    context.getShaderInfoLog = shader => compilerFailure ? 'Injected GPU compiler diagnostic' : shaderLog(shader)
    const programParameter = context.getProgramParameter.bind(context)
    const programLog = context.getProgramInfoLog.bind(context)
    context.getProgramParameter = (program, parameter) => parameter === context.LINK_STATUS && compilerFailure === 'link' ? false : programParameter(program, parameter)
    context.getProgramInfoLog = program => compilerFailure === 'link' ? 'Injected GPU linker diagnostic' : programLog(program)
    const draw = context.drawArrays.bind(context)
    context.drawArrays = (...parameters) => {
      draw(...parameters); rendered.set(canvas, (rendered.get(canvas) ?? 0) + 1)
      const error = context.getError()
      if (error !== context.NO_ERROR && error !== context.CONTEXT_LOST_WEBGL) graphicsErrors.push(error)
    }
    const extension = context.getExtension.bind(context)
    context.getExtension = (name: string) => {
      const value = extension(name)
      if (name === 'WEBGL_lose_context' && value) {
        const lose = value.loseContext.bind(value)
        value.loseContext = () => { live.delete(context); lose() }
      }
      return value
    }
    const deleteProgram = context.deleteProgram.bind(context)
    context.deleteProgram = value => { deletedPrograms++; deleteProgram(value) }
    const deleteBuffer = context.deleteBuffer.bind(context)
    context.deleteBuffer = value => { deletedBuffers++; deleteBuffer(value) }
  }
  return context
} as typeof HTMLCanvasElement.prototype.getContext

const poster = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="480" height="270"%3E%3Crect width="480" height="270" fill="%237C0A02"/%3E%3C/svg%3E'
const makeVisual = (shader: string): ShaderVisual => ({ type: 'shader', shader, version: 1, props: structuredClone(publishedShaderDefinitions[shader].defaults), poster, alt: `${shader} poster` })
const backgroundOnly = (selector: string) => {
  const slot = document.querySelector<HTMLElement>(`${selector} [data-shader-slot]`)
  return !!slot && getComputedStyle(slot).backgroundColor === 'rgb(21, 21, 21)' && !slot.querySelector('img')
}
const opacity = (selector: string) => {
  const layer = document.querySelector<HTMLElement>(`${selector} [data-shader-layer]`)
  return layer ? Number(getComputedStyle(layer).opacity) : 0
}
const first = makeVisual('orb')
const second = makeVisual('gradient-flow')
const onCaughtError = (error: unknown) => { caughtFailures++; caughtErrors.push(error instanceof Error ? error.message : String(error)) }
let root = createRoot(document.getElementById('app')!, { onCaughtError })
const mount = (visual = first, secondary = second) => flushSync(() => root.render(<StrictMode><ActiveShaderProvider><section id="first"><VisualRenderer visual={visual} className="fixture-visual" /></section><section id="second"><VisualRenderer visual={secondary} className="fixture-visual" /></section></ActiveShaderProvider></StrictMode>))
const unmount = () => { flushSync(() => root.unmount()); root = createRoot(document.getElementById('app')!, { onCaughtError }) }

async function run() {
  window.scrollTo(0, 0)
  mount()
  await until(() => (rendered.get(document.querySelector('#first canvas')!) ?? 0) >= 2, 'Orb initializes and draws real WebGL2 frames')
  check(initializations >= 2, 'Orb survives Strict Mode cleanup and reinitialization')
  check(document.querySelectorAll('[data-shader-slot] canvas').length === 1, 'Only one visible shader mounts')
  check(backgroundOnly('#first') && backgroundOnly('#second'), 'All shader slots use the same page-colored background without poster images')
  await until(() => opacity('#first') > 0 && opacity('#first') < 0.99, 'The initialized shader fades in instead of appearing abruptly')
  await until(() => opacity('#first') >= 0.99, 'The shader reaches full opacity after its entrance fade')
  const canvas = document.querySelector('#first canvas')
  mount({ ...first, props: { ...first.props, speed: 1.2, colors: ['#ffffff', '#C21E56', '#7C0A02'] } })
  await wait(100)
  check(document.querySelector('#first canvas') === canvas, 'Live prop updates retain the canvas')
  const beforeGradient = initializations
  document.getElementById('second')!.scrollIntoView()
  await until(() => document.querySelector('#first [data-shader-visible="false"]'), 'Scrolling starts the outgoing shader fade')
  await wait(120)
  check(opacity('#first') > 0 && opacity('#first') < 0.99 && document.querySelector('#first canvas') === canvas && !document.querySelector('#second canvas'), 'The outgoing canvas fades out before disposal without starting a second renderer')
  document.getElementById('first')!.scrollIntoView()
  await until(() => document.querySelector('#first [data-shader-visible="true"]') && opacity('#first') >= 0.99, 'Reversing scroll smoothly restores the current shader')
  check(document.querySelector('#first canvas') === canvas, 'Interrupted fades retain the existing canvas and cancel pending teardown')
  document.getElementById('second')!.scrollIntoView()
  await until(() => (rendered.get(document.querySelector('#second canvas')!) ?? 0) >= 2, 'Scrolling activates Gradient Flow and it draws real frames')
  check(initializations >= beforeGradient + 2, 'Gradient Flow survives Strict Mode cleanup and reinitialization')
  check(!document.querySelector('#first canvas') && live.size === 1 && maxLive === 1, 'Previous renderer is disposed before the next renderer starts')
  check(deletedPrograms > 0 && deletedBuffers > 0, 'Unmount releases programs and buffers')
  const gradientCanvas = document.querySelector<HTMLCanvasElement>('#second canvas')!
  const beforeUpdate = rendered.get(gradientCanvas) ?? 0
  mount(first, { ...second, props: { ...second.props, speed: 1.2, blend: 0.8 } })
  await until(() => (rendered.get(gradientCanvas) ?? 0) > beforeUpdate + 1, 'Gradient Flow keeps drawing after a live prop update')
  check(document.querySelector('#second canvas') === gradientCanvas, 'Gradient Flow prop updates retain the live canvas')
  reduced = true
  reducedChanges.forEach(callback => callback())
  await until(() => live.size === 0 && document.querySelectorAll('[data-shader-slot] canvas').length === 0 && backgroundOnly('#second'), 'Reduced motion keeps only the still background without posters')
  reduced = false
  reducedChanges.forEach(callback => callback())
  await until(() => document.querySelector('#second canvas'), 'Motion preference changes can restore the shader')
  Object.defineProperty(document, 'hidden', { configurable: true, value: true })
  document.dispatchEvent(new Event('visibilitychange'))
  await until(() => live.size === 0, 'Hidden tabs release the active shader')
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  document.dispatchEvent(new Event('visibilitychange'))
  await until(() => document.querySelector('#second canvas'), 'Visible tabs resume one renderer')
  document.querySelector('#second canvas')!.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
  await until(() => !document.querySelector('#second canvas') && live.size === 0 && backgroundOnly('#second'), 'Context loss keeps the plain background and releases resources')
  unmount()
  unsupported = true
  window.scrollTo(0, 0)
  mount()
  await wait(250)
  check(!document.querySelector('canvas') && backgroundOnly('#first'), 'Unsupported WebGL keeps the page-colored background')
  unmount()
  unsupported = false
  mount({ ...first, shader: 'unsupported', version: 99 })
  await wait(100)
  check(!document.querySelector('#first canvas') && backgroundOnly('#first'), 'Unknown shaders and versions keep a plain background without dynamic imports')
  unmount()
  const load = publishedShaderDefinitions.orb.load
  publishedShaderDefinitions.orb.load = async () => { throw new Error('Intentional lazy-load failure') }
  mount()
  await until(() => caughtFailures === 1 && backgroundOnly('#first') && !document.querySelector('#first canvas'), 'Runtime and lazy-import errors are contained by the background boundary')
  unmount()
  publishedShaderDefinitions.orb.load = load
  for (const stage of ['vertex', 'fragment', 'link'] as const) {
    compilerFailure = stage
    mount(second)
    const expected = stage === 'link' ? 'Gradient shader linking failed: Injected GPU linker diagnostic' : `Gradient ${stage} shader compilation failed: Injected GPU compiler diagnostic`
    await until(() => caughtErrors.includes(expected), `${stage} failures preserve the GPU compiler diagnostic`)
    check(backgroundOnly('#first') && !document.querySelector('#first canvas') && live.size === 0, `${stage} failures release the canvas and keep the background`)
    unmount()
  }
  compilerFailure = null
  const ascii = makeVisual('gradient-ascii')
  const beforeAscii = initializations
  mount(ascii)
  await until(() => (rendered.get(document.querySelector('#first canvas')!) ?? 0) >= 10, 'Gradient ASCII initializes and draws its multipass WebGL2 effect')
  check(initializations >= beforeAscii + 2 && live.size === 1, 'Gradient ASCII survives Strict Mode with one active context')
  const asciiCanvas = document.querySelector<HTMLCanvasElement>('#first canvas')!
  const beforeAsciiUpdate = rendered.get(asciiCanvas) ?? 0
  mount({ ...ascii, props: { ...ascii.props, shape: 'eclipse', cellSize: 24, characters: '░▒▓█', colors: ['#ffffff', '#C21E56'] } })
  await until(() => (rendered.get(asciiCanvas) ?? 0) > beforeAsciiUpdate + 5, 'Gradient ASCII keeps drawing after shape, glyph and palette changes')
  check(document.querySelector('#first canvas') === asciiCanvas, 'Gradient ASCII controls update without replacing the canvas')
  reduced = true
  reducedChanges.forEach(callback => callback())
  await until(() => live.size === 0 && backgroundOnly('#first'), 'Gradient ASCII releases its context and keeps a still background for reduced motion')
  unmount()
  reduced = false
  check(live.size === 0 && reducedChanges.length === 0, 'Navigation teardown removes contexts and motion listeners')
  check(graphicsErrors.length === 0, 'All effects draw without WebGL errors')
  document.getElementById('result')!.textContent = `${results.join('\n')}\n${results.length} shader browser checks passed`
  document.body.dataset.status = 'passed'
}
run().catch(error => { document.getElementById('result')!.textContent = `${results.join('\n')}\nFAIL: ${error.stack ?? error}`; document.body.dataset.status = 'failed' })
