import { createRoot } from 'react-dom/client'
import ProjectGallery from '../../src/components/terrain-recreation/gallery/ProjectGallery'
import { createProjectPage } from '../../src/components/terrain-recreation/engine/project-page.js'
import { toTerrainProjects } from '../../src/components/terrain-recreation/project-data'
import type { Project } from '../../src/data/projects'
import type { GalleryOpenRequest } from '../../src/components/terrain-recreation/gallery/project-media'

const results: string[] = []
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const check = (value: unknown, message: string) => { if (!value) throw Error(message); results.push(`PASS: ${message}`) }
async function until(predicate: () => unknown, message: string) {
  const end = Date.now() + 10_000
  while (!predicate() && Date.now() < end) await wait(25)
  check(predicate(), message)
}
// Wait for the runner's exact desktop/phone viewport before checking real CSS layout.
document.body.dataset.fixtureWaiting = 'true'
while (!document.body.dataset.viewportReady) await wait(25)
const project: Project = {
  id: 'layout', slug: 'layout-project', title: 'A thoughtfully built booking platform',
  description: 'Project details with landscape, portrait and square screenshots.', category: 'Travel', year: '2026',
  image: '/layout-image/1600x900.svg', technologies: ['React', 'Rust'], githubUrl: 'https://example.com/source', liveUrl: 'https://example.com/booking',
  overview: 'Designed to make finding the next destination feel effortless.', problem: 'Clearer discovery.', solution: 'A connected booking experience.',
  technical: 'A focused interface and reliable services.', challenges: 'Consistent experiences across devices.', results: 'A simpler way to plan a trip.', features: [],
  media: [
    { type: 'image', src: '/layout-image/900x1600.svg', alt: 'Portrait screenshot', caption: 'The hotel details experience' },
    { type: 'image', src: '/layout-image/1200x1200.svg', alt: 'Square screenshot', caption: 'Search results' },
    { type: 'image', src: '/layout-image/1920x1080.svg', alt: 'Wide screenshot', caption: 'The booking dashboard' },
  ],
}
let active = false
const pass = { transition: { getState: () => ({ active, amount: 1, phase: 'open' }), open: () => { active = true }, close: () => { active = false } }, setLayout() {}, setProject() {}, resetImages() {}, revealImage() {}, hoverImage() {}, setImageVisibility() {}, setMediaLayout() {}, setMediaImage() {}, pointer: { set() {} } }
const page = createProjectPage({ host: document.getElementById('scene')!, pass, projects: toTerrainProjects([project]), getArtwork: () => ({ image: { width: 1600, height: 900 } }), loadArtwork: async () => null, noise: {}, imageBase: '/', reducedMotion: true, onNavigate() {}, onOpenGallery: (projectSlug: string, src: string, trigger: HTMLElement) => showGallery({ projectSlug, src, trigger }) })
page.syncRoute(project.slug)
page.update({ phase: 'open', amount: 1 })
const root = createRoot(document.getElementById('actions')!)
const onActive = (value: boolean) => page.setModalActive(value)
const onLauncherLayout = () => {}
function showGallery(openRequest: GalleryOpenRequest | null = null) {
  root.render(<ProjectGallery project={project} ready openRequest={openRequest} onActive={onActive} onLauncherLayout={onLauncherLayout} />)
}
showGallery()
try {
  await until(() => document.querySelectorAll('.case-media .case-image').length === 4 && !!document.querySelector('.terrain-gallery-launcher'), 'Real project page and gallery controls render')
  const media = [...document.querySelectorAll<HTMLImageElement>('.case-media .case-image')]
  for (const image of media) { image.loading = 'eager' }
  await until(() => media.every(image => image.complete && image.naturalWidth > 0), 'Mixed landscape, portrait and square screenshots load')
  const content = document.querySelector('.case-content')!.getBoundingClientRect()
  const frames = [...document.querySelectorAll('.case-media-art')].map(element => element.getBoundingClientRect())
  check(frames.every(frame => frame.left >= content.left - 1 && frame.right <= content.right + 1), 'Every preview stays inside the project content column')
  check(frames.every(frame => Math.abs(frame.width / frame.height - 1.6) < .02), 'All screenshot frames use one consistent aspect ratio')
  check(Math.max(...frames.map(frame => frame.height)) - Math.min(...frames.map(frame => frame.height)) < 1, 'Different source dimensions cannot change preview heights')
  check(media.every(image => getComputedStyle(image).objectFit === 'cover'), 'Inline previews use a bounded crop')
  check(document.querySelector('.showcase-page')!.scrollWidth <= innerWidth, 'The project has no horizontal overflow')
  check(innerWidth <= 640 ? frames[1].top > frames[0].bottom : Math.abs(frames[0].top - frames[1].top) < 1, 'Previews adapt from two desktop columns to one phone column')
  const live = document.querySelector<HTMLAnchorElement>('.terrain-live-launcher')!
  const launcher = document.querySelector<HTMLButtonElement>('.terrain-gallery-launcher')!
  check(live.href === project.liveUrl && live.target === '_blank' && live.rel.includes('noopener'), 'Right-side live icon opens the saved project URL safely')
  check(live.getBoundingClientRect().right === launcher.getBoundingClientRect().right && live.getBoundingClientRect().bottom < launcher.getBoundingClientRect().top, 'Live and gallery icons form one aligned action rail')
  check(getComputedStyle(live).boxShadow !== 'none' && live.getBoundingClientRect().width >= 44, 'Live icon has a visible glow and accessible touch target')
  check([...document.querySelectorAll('.case-project-links a')].every(link => link.textContent !== 'Live project'), 'The old inline live-project link is removed')
  launcher.click()
  await until(() => !!document.querySelector('[role="dialog"]'), 'Right-side gallery opens the full-image viewer')
  ;(document.querySelector('[aria-label="Next media"]') as HTMLButtonElement).click()
  await until(() => document.querySelector<HTMLImageElement>('.terrain-gallery-slide img')?.naturalHeight === 1600, 'Gallery retains the original portrait image dimensions')
  check(getComputedStyle(document.querySelector('.terrain-gallery-slide img')!).objectFit === 'contain', 'Full gallery shows the entire uncropped image')
  ;(document.querySelector('[aria-label="Close media gallery"]') as HTMLButtonElement).click()
  await until(() => !document.querySelector('[role="dialog"]'), 'Gallery closes back to the project details')
  const previews = [...document.querySelectorAll<HTMLButtonElement>('.case-media-preview')]
  for (const position of [2, 1, 1]) {
    previews[position].querySelector('img')!.click()
    await until(() => document.querySelector<HTMLImageElement>('.terrain-gallery-slide img')?.getAttribute('src') === media[position].getAttribute('src'), `Preview ${position + 1} opens directly at its own original image`)
    check(document.querySelector(`[data-media-index="${position}"]`)?.getAttribute('aria-pressed') === 'true', 'The selected gallery thumbnail matches the clicked preview')
    ;(document.querySelector('[aria-label="Close media gallery"]') as HTMLButtonElement).click()
    await until(() => !document.querySelector('[role="dialog"]') && document.activeElement === previews[position], 'Closing restores keyboard focus to the clicked preview')
    check(!document.querySelector<HTMLElement>('.showcase-page')!.inert, 'The project becomes interactive again after gallery close')
  }
  document.querySelector('.case-media-list')!.scrollIntoView({ block: 'start' })
  document.body.dataset.status = 'passed'
  document.getElementById('result')!.textContent = `${results.join('\n')}\n${results.length} project layout checks passed (${innerWidth}px)`
} catch (error) {
  document.body.dataset.status = 'failed'
  document.getElementById('result')!.textContent = `${results.join('\n')}\nFAIL: ${error instanceof Error ? error.stack : error}`
}
