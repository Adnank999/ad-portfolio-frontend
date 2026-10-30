import { TextureLoader } from 'three'
import { createProjectTextureCache } from '../../src/components/terrain-recreation/engine/project-textures.js'
import { createProjectPage } from '../../src/components/terrain-recreation/engine/project-page.js'
import { toTerrainProjects } from '../../src/components/terrain-recreation/project-data'
import type { Project } from '../../src/data/projects'

const results: string[] = []
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const check = (value: unknown, message: string) => { if (!value) throw Error(message); results.push(`PASS: ${message}`) }
async function until(predicate: () => unknown, message: string) {
  const end = Date.now() + 10_000
  while (!predicate() && Date.now() < end) await wait(25)
  check(predicate(), message)
}
const source = (name: string) => { const url = new URL(`/cors-image/${name}.webp`, location.href); url.hostname = 'localhost'; return url.href }
const host = document.getElementById('host')!
const fallback = { image: { width: 320, height: 180 } }
const cache = createProjectTextureCache({ loader: new TextureLoader().setCrossOrigin('anonymous'), fallback, configure() {} })
let active = false
const visibility: Record<string, number> = {}
const pass = { transition: { getState: () => ({ active, amount: 1, phase: 'open' }), open: () => { active = true }, close: () => { active = false } }, setLayout() {}, setProject() {}, resetImages() {}, revealImage() {}, hoverImage() {}, setImageVisibility: (slot: string, value: number) => { visibility[slot] = value }, setMediaLayout() {}, setMediaImage() {}, pointer: { set() {} } }
const project = (slug: string, image: string): Project => ({ id: slug, slug, title: slug, image, featuredImageUrl: image, description: 'Cross-origin project image', category: 'Web', year: '2026', technologies: [], githubUrl: '', liveUrl: '', overview: '', problem: '', solution: '', features: [], technical: '', challenges: '', results: '' })
const allowed = project('allowed-project', source('allowed')), blocked = project('blocked-project', source('blocked'))
const page = createProjectPage({ host, pass, projects: toTerrainProjects([allowed, blocked]), getArtwork: () => fallback,
  loadArtwork: async (_id: string, url: string) => { const texture = await cache.load(url); return cache.peek(url) === texture ? texture : null }, noise: {}, imageBase: '/', reducedMotion: true, onNavigate() {} })
try {
  check(new URL(allowed.image).origin !== location.origin, 'Fixture images are served from a genuinely different origin')
  page.syncRoute(allowed.slug, allowed)
  await until(() => host.querySelector('.case-art')?.getAttribute('data-render-mode') === 'webgl', 'CORS-approved hero enables its shader texture')
  check((host.querySelector('.case-hero-image') as HTMLImageElement).crossOrigin === 'anonymous', 'Hero HTML and Three.js use the same anonymous CORS mode')
  page.syncRoute(blocked.slug, blocked)
  await until(() => { const image = host.querySelector('.case-hero-image') as HTMLImageElement; return image.dataset.nativeOnly && image.complete && image.naturalWidth > 0 }, 'Missing CORS headers still allow a readable ordinary-image fallback')
  check(host.querySelector('.case-art')?.getAttribute('data-render-mode') === 'native', 'Blocked pixels are kept out of the WebGL hero')
  check(visibility.hero === 0, 'The shader placeholder is disabled behind the native fallback')
  check(getComputedStyle(host.querySelector('.case-hero-image')!).opacity === '1', 'Fallback uses the production CSS and stays visible')
  await fetch('/cors-recover', { method: 'POST' })
  page.syncRoute(blocked.slug, blocked)
  await until(() => host.querySelector('.case-art')?.getAttribute('data-render-mode') === 'webgl', 'Reopening the hero retries successfully after CORS recovery')
  document.body.dataset.status = 'passed'
  document.getElementById('result')!.textContent = `${results.join('\n')}\n${results.length} project CORS browser checks passed`
} catch (error) {
  document.body.dataset.status = 'failed'
  document.getElementById('result')!.textContent = `${results.join('\n')}\nFAIL: ${error instanceof Error ? error.stack : error}`
} finally { page.dispose(); cache.dispose() }
