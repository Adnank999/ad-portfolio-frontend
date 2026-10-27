import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { PageLoading } from '../../src/components/feedback/PageFeedback'

const results: string[] = []
const failures: string[] = []
const wait = (duration: number) => new Promise(resolve => setTimeout(resolve, duration))
const check = (condition: unknown, message: string) => { if (!condition) throw new Error(message); results.push(`PASS: ${message}`) }
const context = HTMLCanvasElement.prototype.getContext
let graphicsContexts = 0
HTMLCanvasElement.prototype.getContext = function (...parameters) { graphicsContexts++; return context.apply(this, parameters as Parameters<typeof context>) } as typeof context

async function run() {
  const app = document.getElementById('app')!
  const tree = <><PageLoading message="Loading your next chapter…" /><PageLoading size="panel" message="Refreshing content…" /></>
  app.innerHTML = renderToString(tree)
  check(app.querySelectorAll('.loading-logo-artwork').length === 2 && !app.querySelector('canvas, img'), 'Both loading sizes include the supplied SVG immediately in server HTML')
  const root = hydrateRoot(app, tree, { onRecoverableError: error => failures.push(String(error)) })
  await wait(300)
  check(!failures.length, 'SVG definition IDs survive hydration without mismatches')
  const identifiers = [...app.querySelectorAll('[id]')].map(element => element.id)
  check(identifiers.length === 8 && new Set(identifiers).size === 8, 'Simultaneous loaders have unique gradient, bloom and grain definitions')
  check(app.querySelectorAll('.loading-logo-mark').length === 2 && !app.innerHTML.includes('M219 268 H299'), 'The emblem has no middle connector in its core, bloom or running highlight')
  check(app.querySelectorAll('.loading-logo-grained').length === 2 && [...app.querySelectorAll('.page-feedback--loading')].every(element => {
    const style = getComputedStyle(element, '::after')
    return style.backgroundImage.includes('data:image/svg+xml') && style.pointerEvents === 'none' && Number(style.opacity) > 0
  }), 'Logo grain and the static scene grain are present without blocking interaction')
  for (const svg of app.querySelectorAll('svg')) {
    for (const element of svg.querySelectorAll('[stroke], [filter]')) {
      for (const name of ['stroke', 'filter']) {
        const reference = element.getAttribute(name)?.match(/^url\(#(.+)\)$/)?.[1]
        if (reference && !svg.querySelector(`[id="${reference}"]`)) throw new Error('An SVG reference escaped its own instance')
      }
    }
  }
  check(app.querySelectorAll('[role="status"][aria-live="polite"]').length === 2 && !app.querySelector('[role="progressbar"]'), 'Accessible status messages remain without fabricated progress')
  const mark = app.querySelector<SVGPathElement>('.loading-logo-mark')!
  const orbit = app.querySelector<SVGGElement>('.loading-logo-orbit')!
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    check(app.getAnimations({ subtree: true }).length === 0, 'Reduced motion stops every loader animation')
    check(getComputedStyle(mark).strokeDashoffset === '0px' && getComputedStyle(mark).opacity === '1', 'Reduced motion retains a fully drawn emblem')
    check(getComputedStyle(app.querySelector('.loading-logo-beam')!).display === 'none', 'Reduced motion removes the running highlight')
  } else {
    const trace = mark.getAnimations()[0]
    check(!!trace, 'The logo retains its CSS stroke animation')
    trace.currentTime = 300
    check(getComputedStyle(mark).strokeDashoffset === '0px', 'The first trace frames have the mark already drawn')
    const before = getComputedStyle(orbit).transform
    await wait(150)
    check(before !== getComputedStyle(orbit).transform, 'The orbit animates using CSS without a graphics context')
  }
  check([...app.querySelectorAll<HTMLElement>('.loading-logo')].every(element => element.getBoundingClientRect().width <= element.parentElement!.getBoundingClientRect().width), 'Page and panel loaders fit their responsive containers')
  check(graphicsContexts === 0 && !performance.getEntriesByType('resource').some(entry => /\.(?:glb|gltf|ktx2)(?:\?|$)|\/loader\//.test(entry.name)), 'No canvas context, model, texture or old loader asset is requested')
  root.unmount()
  check(!app.querySelector('svg, canvas'), 'Unmount removes the artwork without outstanding renderer work')
  HTMLCanvasElement.prototype.getContext = context
  document.getElementById('result')!.textContent = `${results.join('\n')}\n${results.length} SVG loader browser checks passed`
  document.body.dataset.status = 'passed'
}

run().catch(error => { document.getElementById('result')!.textContent = `${results.join('\n')}\nFAIL: ${error.stack ?? error}`; document.body.dataset.status = 'failed' })
