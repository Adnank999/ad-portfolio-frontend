import { useCallback, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { motionValue } from 'framer-motion'
import CinematicCanvas from '../../src/components/home/CinematicCanvas'
import { useHeroShaderControls } from '../../src/components/home/shaders-glsl/ShaderControls'
import { HeroRebuildFixture } from './hero-rebuild'
import { SceneBoundary } from '../../src/components/home/SceneBoundary'
import '../../src/components/home/shaders-glsl/hero.css'

const results: string[] = []
const wait = (duration: number) => new Promise(resolve => setTimeout(resolve, duration))
const check = (condition: unknown, message: string) => { if (!condition) throw new Error(message); results.push(`PASS: ${message}`) }
async function until(condition: () => unknown, message: string) {
  const deadline = Date.now() + 12000
  while (!condition() && Date.now() < deadline) await wait(40)
  if (!condition()) throw new Error(`${message}: ${JSON.stringify({ scroll: scrollY, hero: document.getElementById('hero')?.getBoundingClientRect().toJSON(), flags: { ...document.querySelector<HTMLElement>('.cinema-webgl')?.dataset }, alpha: alphas.slice(-8), ready, draws })}`)
  results.push(`PASS: ${message}`)
}
let draws = 0
let feedbackDraws = 0
let deletedTextures = 0
let deletedTargets = 0
let contexts = 0
let contextAttempts = 0
let createdPrograms = 0
let captureColor = false
let coloredPixels = 0
let ready = false
let hidden = false
const alphas: number[] = []
const errors: string[] = []
const context = HTMLCanvasElement.prototype.getContext
const instrumented = new WeakSet<WebGL2RenderingContext>()
let graphics: WebGL2RenderingContext | null = null
HTMLCanvasElement.prototype.getContext = function (kind: string, options?: unknown) {
  if (kind === 'webgl2') contextAttempts++
  const gl = context.call(this, kind as 'webgl2', options as WebGLContextAttributes) as WebGL2RenderingContext | null
  if (kind === 'webgl2' && gl && this.isConnected && !instrumented.has(gl)) {
    instrumented.add(gl); contexts++
    graphics = gl
    const program = gl.createProgram.bind(gl)
    gl.createProgram = () => { createdPrograms++; return program() }
    const renderer = gl.getExtension('WEBGL_debug_renderer_info')
    document.body.dataset.renderer = renderer ? gl.getParameter(renderer.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    const locations = new Map<WebGLUniformLocation, string>()
    const uniformPrograms = new Map<WebGLUniformLocation, WebGLProgram>()
    const programAlpha = new Map<WebGLProgram, number>()
    let currentProgram: WebGLProgram | null = null
    const useProgram = gl.useProgram.bind(gl)
    gl.useProgram = value => { currentProgram = value; useProgram(value) }
    const getLocation = gl.getUniformLocation.bind(gl)
    gl.getUniformLocation = (program, name) => { const location = getLocation(program, name); if (location) { locations.set(location, name); uniformPrograms.set(location, program) }; return location }
    const uniform = gl.uniform1f.bind(gl)
    gl.uniform1f = (location, value) => { if (location && locations.get(location) === 'uAlpha') programAlpha.set(uniformPrograms.get(location)!, value); uniform(location, value) }
    const draw = gl.drawElements.bind(gl)
    let boundTarget: WebGLFramebuffer | null = null
    const bind = gl.bindFramebuffer.bind(gl)
    gl.bindFramebuffer = (target, value) => { if (target === gl.FRAMEBUFFER || target === gl.DRAW_FRAMEBUFFER) boundTarget = value; bind(target, value) }
    gl.drawElements = (...args) => {
      draws++
      if (boundTarget) feedbackDraws++
      draw(...args)
      if (!boundTarget && currentProgram && programAlpha.has(currentProgram)) alphas.push(programAlpha.get(currentProgram)!)
      if (captureColor && !boundTarget) {
        const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
        coloredPixels = 0
        for (let index = 0; index < pixels.length; index += 4) {
          if (Math.max(pixels[index], pixels[index + 1], pixels[index + 2]) - Math.min(pixels[index], pixels[index + 1], pixels[index + 2]) > 8) coloredPixels++
        }
        captureColor = false
      }
    }
    const texture = gl.deleteTexture.bind(gl)
    gl.deleteTexture = value => { if (value) deletedTextures++; texture(value) }
    const target = gl.deleteFramebuffer.bind(gl)
    gl.deleteFramebuffer = value => { if (value) deletedTargets++; target(value) }
  }
  return gl
} as typeof HTMLCanvasElement.prototype.getContext
Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
const value = () => motionValue(0)
const time = value()
const props = { time, reveal: value(), reverse: value(), heroProgress: value(), experimentProgress: value(), pointerX: value(), pointerY: value(), burst: value() }
let unavailable = false
const onUnavailable = () => { unavailable = true }
const onReady = (value: boolean) => { ready = value }

function Fixture() {
  const heroRef = useRef<HTMLElement>(null)
  const experimentRef = useRef<HTMLElement>(null)
  const controls = useHeroShaderControls()
  const [paused, setPaused] = useState(false)
  const [heroReady, setHeroReady] = useState(false)
  const reportReady = useCallback((value: boolean) => { onReady(value); setHeroReady(value) }, [])
  return <main className="cinema-home" data-hero-ready={heroReady}><CinematicCanvas {...props} heroRef={heroRef} experimentRef={experimentRef} heroControls={controls} compact still={paused} staticLayout onHeroReady={reportReady} onUnavailable={onUnavailable} /><section id="hero" ref={heroRef} style={{ position: 'relative', zIndex: 1 }}><div className="cinema-hero-fallback" /><button onClick={() => setPaused(value => !value)}>Toggle motion</button></section><div id="gap" /><section id="experiment" ref={experimentRef}><div data-value-particles style={{ width: 240, height: 240 }} /></section></main>
}

async function run() {
  const root = createRoot(document.getElementById('app')!)
  flushSync(() => root.render(<Fixture />))
  await until(() => ready && alphas.some(value => value > .99), 'Homepage shader loads real KTX2 textures and fades in after its first frame')
  check(contextAttempts === 1, 'Homepage initializes one WebGL context without a throwaway capability probe')
  check(!unavailable && alphas.some(value => value === 0), 'Fade-in starts transparent before the first presented shader frame')
  const assetRequests = () => performance.getEntriesByType('resource').filter(entry => entry.name.includes('/home-shader-assets/')).length
  const initialAssets = assetRequests()
  const initialPrograms = createdPrograms
  const canvas = document.querySelector('canvas')!
  const before = draws
  await until(() => draws > before && feedbackDraws > 0, 'Visible hero runs its feedback and blur passes')

  // Leave less than 20% of the hero visible so its fade is observable on screen.
  alphas.length = 0
  window.scrollTo(0, 520)
  await until(() => alphas.some(value => value < .9), 'Scrolling towards the next section fades the hero out')
  const feedbackAtFade = feedbackDraws
  await until(() => deletedTargets >= 4 && !ready, 'Fade-out releases all four feedback targets and clears readiness')
  check(feedbackDraws === feedbackAtFade, 'Feedback and blur calculations stop during fade-out')
  check(alphas.some(value => value > 0 && value < .9) && alphas.at(-1)! < .01, `Fade-out reaches black through intermediate opacity values (${alphas.slice(-8).join(', ')})`)
  check(deletedTextures >= 11, 'Offscreen hero releases source textures and render-target textures')
  const asleep = draws
  const frozenTime = time.get()
  await wait(220)
  check(draws === asleep && time.get() === frozenTime, 'Idle homepage stops GPU draws and shader-clock calculations')

  alphas.length = 0
  window.scrollTo(0, 0)
  await until(() => ready && alphas.some(value => value > .99), 'Returning to the hero recreates its resources and fades back in')
  check(document.querySelector('canvas') === canvas && contexts === 1, 'Scroll re-entry preserves one shared homepage WebGL context')
  check(assetRequests() === initialAssets, 'Returning to the hero reuses decoded source images without reloading assets')
  check(createdPrograms === initialPrograms, 'Returning to the hero reuses compiled shader programs')

  // Reverse before release: the fade should resume without destroying the live resources.
  const targetsBeforeReverse = deletedTargets
  alphas.length = 0
  window.scrollTo(0, 520)
  await until(() => alphas.some(value => value < .95), 'Rapid scrolling begins the exit fade')
  window.scrollTo(0, 0)
  await until(() => alphas.at(-1)! > .99, 'Reversing scroll smoothly restores the current shader')
  check(deletedTargets === targetsBeforeReverse, 'A cancelled fade-out does not dispose live resources')

  hidden = true
  document.dispatchEvent(new Event('visibilitychange'))
  await until(() => !ready && deletedTargets >= targetsBeforeReverse + 4, 'Hidden tabs immediately release hero targets without waiting for a fade')
  await wait(100)
  const hiddenDraws = draws
  const hiddenTime = time.get()
  await wait(180)
  check(draws === hiddenDraws && time.get() === hiddenTime, 'Hidden tabs stop rendering and clock advancement')
  hidden = false
  document.dispatchEvent(new Event('visibilitychange'))
  await until(() => ready, 'Showing the tab restores the visible hero')

  window.scrollTo(0, 1000)
  await until(() => !ready, 'Hero resources are released before reaching the lower particle section')
  window.scrollTo(0, 2400)
  await until(() => document.querySelector('[data-value-particles-ready="true"]'), 'The separate homepage particle effect remains available')
  check(document.querySelector('canvas') === canvas, 'The lower effect uses the same persistent canvas')
  for (let cycle = 1; cycle <= 2; cycle++) {
    alphas.length = 0
    window.scrollTo(0, 0)
    await until(() => ready && alphas.at(-1)! > .99, `Return ${cycle} from the particle section restores hero opacity`)
    check(alphas.some(value => value < .01), `Return ${cycle} presents a transparent first frame before fading in`)
    check(getComputedStyle(document.querySelector('.cinema-hero-fallback')!).display === 'none', `Return ${cycle} removes the opaque hero fallback`)
    captureColor = true
    await until(() => !captureColor && coloredPixels > 10, `Return ${cycle} presents actual colored shader pixels`)
    check(assetRequests() === initialAssets, `Return ${cycle} does not reload or transcode image assets`)
    if (cycle === 1) {
      window.scrollTo(0, 2400)
      await until(() => !ready, 'A second trip below the hero releases its resources')
    }
  }
  document.getElementById('hero')!.style.height = '4000px'
  window.scrollTo(0, 4500)
  await until(() => !ready, 'A tall hero still releases its GPU resources below the fold')
  alphas.length = 0
  window.scrollTo(0, 0)
  await until(() => ready && alphas.at(-1)! > .99, 'A hero taller than five viewports fades back in at the top')
  captureColor = true
  await until(() => !captureColor && coloredPixels > 10 && getComputedStyle(document.querySelector('.cinema-hero-fallback')!).display === 'none', 'A tall hero presents visible shader pixels instead of its fallback')
  const graphicsError = graphics!.getError()
  if (graphicsError !== graphics!.NO_ERROR) errors.push(`WebGL error ${graphicsError}`)
  flushSync(() => root.unmount())
  await until(() => !document.querySelector('canvas') && !ready, 'Route teardown removes the canvas and resets hero readiness')
  check(errors.length === 0, `Real rendering completes without WebGL errors: ${errors.join(', ')}`)
  window.scrollTo(0, 0)
  alphas.length = 0
  const rebuiltRoot = createRoot(document.getElementById('app')!)
  flushSync(() => rebuiltRoot.render(<HeroRebuildFixture onReady={onReady} />))
  await until(() => ready && alphas.at(-1)! > .99, 'A fresh hero is ready for a cached-resource rebuild')
  alphas.length = 0
  const targetsBeforeQuality = deletedTargets
  const feedbackBeforeQuality = feedbackDraws
  document.getElementById('rebuild-hero')!.click()
  await until(() => ready && deletedTargets >= targetsBeforeQuality + 4 && feedbackDraws > feedbackBeforeQuality, 'Quality changes rebuild the feedback targets while keeping the hero ready')
  check(alphas.every(value => value > .99), 'Quality changes never black out an already visible shader')
  captureColor = true
  await until(() => !captureColor && coloredPixels > 10, 'The first rebuilt quality frame presents colored shader pixels')
  check(graphics!.getError() === graphics!.NO_ERROR, 'The rebuilt shader draws without WebGL errors')
  flushSync(() => rebuiltRoot.unmount())
  HTMLCanvasElement.prototype.getContext = function (kind: string, options?: unknown) {
    return kind === 'webgl2' || kind === 'webgl' ? null : context.call(this, kind as '2d', options as CanvasRenderingContext2DSettings)
  } as typeof HTMLCanvasElement.prototype.getContext
  unavailable = false
  const unsupportedRoot = createRoot(document.getElementById('app')!)
  flushSync(() => unsupportedRoot.render(<><p id="static-content">The page remains readable.</p><SceneBoundary onError={onUnavailable}><Fixture /></SceneBoundary></>))
  await until(() => unavailable && !document.querySelector('canvas'), 'An unsupported real renderer reaches the existing scene fallback boundary')
  check(document.getElementById('static-content')?.textContent === 'The page remains readable.', 'Unsupported WebGL preserves content outside the decorative renderer')
  flushSync(() => unsupportedRoot.unmount())
  HTMLCanvasElement.prototype.getContext = context
  document.getElementById('result')!.textContent = `${results.join('\n')}\n${results.length} homepage shader browser checks passed`
  document.body.dataset.status = 'passed'
}
run().catch(error => { document.getElementById('result')!.textContent = `${results.join('\n')}\nFAIL: ${error.stack ?? error}`; document.body.dataset.status = 'failed' })
