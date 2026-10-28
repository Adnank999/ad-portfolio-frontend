import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { BrandLogo } from '../../src/components/global/brand-logo/BrandLogo'

const results: string[] = []
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const check = (condition: unknown, message: string) => { if (!condition) throw new Error(message); results.push(`PASS: ${message}`) }
async function until(condition: () => unknown, message: string) {
  const deadline = Date.now() + 12000
  while (!condition() && Date.now() < deadline) await wait(30)
  check(condition(), message)
}
let draws = 0
let traces = 0
let largestTrace = 0
let hidden = false
let graphics: WebGL2RenderingContext | undefined
let intersecting: boolean | undefined
const Observer = window.IntersectionObserver
window.IntersectionObserver = class extends Observer {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    super((entries, observer) => { intersecting = entries[0]?.isIntersecting; callback(entries, observer) }, options)
  }
}
const reduced = Object.assign(new EventTarget(), { matches: false, media: '(prefers-reduced-motion: reduce)' })
const matchMedia = window.matchMedia.bind(window)
window.matchMedia = query => query === reduced.media ? reduced as MediaQueryList : matchMedia(query)
Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
const getImageData = CanvasRenderingContext2D.prototype.getImageData
CanvasRenderingContext2D.prototype.getImageData = function (...args: Parameters<typeof getImageData>) {
  traces++; largestTrace = Math.max(largestTrace, this.canvas.width, this.canvas.height)
  return getImageData.apply(this, args)
}
const getContext = HTMLCanvasElement.prototype.getContext
const instrumented = new WeakSet<WebGL2RenderingContext>()
HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof getContext>) {
  const context = getContext.apply(this, args)
  if (args[0] === 'webgl2' && context && !instrumented.has(context as WebGL2RenderingContext)) {
    const gl = context as WebGL2RenderingContext
    graphics = gl
    instrumented.add(gl)
    const draw = gl.drawArrays.bind(gl)
    gl.drawArrays = (...values) => { draws++; draw(...values) }
    const indexed = gl.drawElements.bind(gl)
    gl.drawElements = (...values) => { draws++; indexed(...values) }
    const renderer = gl.getExtension('WEBGL_debug_renderer_info')
    document.body.dataset.renderer = renderer ? gl.getParameter(renderer.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
  }
  return context
} as typeof getContext

async function run() {
  document.getElementById('app')!.style.cssText = 'width:44px;height:44px;margin:20px'
  document.body.style.minHeight = '2400px'
  const root = createRoot(document.getElementById('app')!)
  const ready = () => document.querySelector('[data-logo-ready="true"]')
  const checkMark = (message: string) => {
    const mark = document.querySelector<SVGSVGElement>('.brand-logo-still')!
    const style = getComputedStyle(mark)
    check(mark.tagName.toLowerCase() === 'svg' && !!mark.querySelector('path') && style.opacity === '1' && style.visibility === 'visible' && mark.getBoundingClientRect().width > 0 && getComputedStyle(mark.querySelector('path')!).fill === 'rgb(194, 30, 86)', message)
  }
  let hiddenMark = false
  let monitor: number
  const watchMark = () => {
    const mark = document.querySelector('.brand-logo-still')
    if (mark && getComputedStyle(mark).opacity !== '1') hiddenMark = true
    monitor = requestAnimationFrame(watchMark)
  }
  watchMark()
  const logo = () => <a href="/" aria-label="Home" style={{ display: 'block', width: 44, height: 44 }}><BrandLogo /></a>
  const host = () => document.querySelector<HTMLAnchorElement>('#app > a')!
  const engage = () => host().dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
  flushSync(() => root.render(logo()))
  check(!document.querySelector('canvas') && document.querySelector('.brand-logo-still'), 'First render has the branded SVG mask without starting WebGL')
  checkMark('Initial logo is an inline vector in the accent color')
  await wait(600)
  check(!document.querySelector('canvas'), 'Idle navigation does not initialize a second WebGL renderer')
  engage()
  checkMark('Hover keeps the accent logo visible while the effect is loading')
  host().dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
  await wait(100)
  check(!document.querySelector('canvas'), 'Leaving during deferred loading cancels renderer startup')
  checkMark('Cancelled hover leaves the accent logo visible')
  engage()
  await until(ready, 'Deferred electric overlay becomes ready after a real WebGL frame')
  await until(() => getComputedStyle(document.querySelector('.brand-logo-effect')!).opacity === '1', 'Ready electric effect fades in over the static mark')
  checkMark('The accent logo remains visible underneath the active effect')
  const bounds = host().getBoundingClientRect()
  check(document.querySelector('.brand-logo-effect')!.contains(document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)), 'The electric layer retains pointer interaction inside the home link')
  check(traces === 1 && largestTrace <= 128, 'Logo tracing is bounded to 128 pixels')
  check(document.querySelector('canvas')!.width === 44, 'Navigation canvas stays at DPR 1')
  host().dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
  await until(() => !document.querySelector('canvas'), 'Leaving the mark releases its WebGL renderer')
  checkMark('Leaving hover never removes or fades the accent logo')
  host().focus()
  await until(ready, 'Keyboard focus on the home link activates its electric logo')
  host().blur()
  await until(() => !document.querySelector('canvas'), 'Leaving keyboard focus restores the SVG mark')
  engage()
  await until(ready, 'Hover restores the cached logo after keyboard interaction')
  const start = draws
  const started = performance.now()
  await wait(500)
  check(draws - start <= Math.ceil((performance.now() - started) / 1000 * 31) + 1, `Logo respects the 30 FPS drawing limit (${draws - start} frames)`)
  await until(() => draws > start, 'Logo continues drawing after its first frame')
  hidden = true; document.dispatchEvent(new Event('visibilitychange'))
  const stopped = draws
  graphics!.clearColor(0, 0, 0, 0)
  graphics!.clear(graphics!.COLOR_BUFFER_BIT)
  check(graphics!.getContextAttributes()!.alpha, 'The effect canvas is transparent above the permanent SVG')
  checkMark('A cleared or blank effect frame cannot hide the logo')
  host().style.width = '40px'
  await until(() => document.querySelector('canvas')!.width === 40, 'A paused effect canvas can be resized')
  checkMark('Resize keeps the accent logo visible before another effect frame')
  host().style.width = '44px'
  await until(() => document.querySelector('canvas')!.width === 44, 'The effect restores its original size')
  await wait(180)
  check(draws === stopped, 'Hidden tabs stop logo drawing')
  hidden = false; document.dispatchEvent(new Event('visibilitychange'))
  await until(() => draws > stopped, 'Visible tabs resume logo drawing')
  window.scrollTo(0, 1400)
  await until(() => intersecting === false, 'Navigation leaves the actual viewport')
  const offscreen = draws
  await wait(180)
  check(draws === offscreen, 'Offscreen navigation stops logo drawing')
  window.scrollTo(0, 0)
  await until(() => draws > offscreen, 'Returning to navigation resumes the logo')
  flushSync(() => root.render(null))
  flushSync(() => root.render(logo()))
  engage()
  await until(ready, 'Navigation remount restores the animated logo')
  check(traces === 1, 'Navigation remount reuses the cached traced shape')
  reduced.matches = true; reduced.dispatchEvent(new Event('change'))
  await until(() => !document.querySelector('canvas'), 'Reduced motion keeps the SVG mask without a renderer')
  await until(() => getComputedStyle(document.querySelector('.brand-logo-still')!).opacity === '1', 'Reduced motion retains a visible brand mark')
  reduced.matches = false; reduced.dispatchEvent(new Event('change'))
  await until(ready, 'Changing motion preference can restore animation')
  document.querySelector('canvas')!.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
  await until(() => !document.querySelector('canvas') && !ready(), 'Context loss releases the renderer and restores the SVG mask')
  checkMark('WebGL failure retains the accent logo immediately')
  flushSync(() => root.unmount())
  const unmounted = draws
  await wait(180)
  check(draws === unmounted, 'Unmount leaves no logo drawing loop')
  cancelAnimationFrame(monitor!)
  check(!hiddenMark, 'The base logo never becomes transparent during any loading or interaction frame')
}
run().then(() => {
  document.getElementById('result')!.textContent = [...results, `${results.length} brand logo browser checks passed`].join('\n')
  document.body.dataset.status = 'passed'
}).catch(error => {
  document.getElementById('result')!.textContent = [...results, `FAIL: ${error.stack ?? error}`].join('\n')
  document.body.dataset.status = 'failed'
})
