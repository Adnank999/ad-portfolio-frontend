import { expect, mock, test } from 'bun:test'
import { renderToString } from 'react-dom/server'
import { loadPublishedProjects, projectFromRecord, type ProjectRecord } from '../src/lib/public-projects'
import { toTerrainProjects } from '../src/components/terrain-recreation/project-data'
import { createProjectCatalog } from '../src/components/terrain-recreation/engine/projects.js'
import { createProjectPage } from '../src/components/terrain-recreation/engine/project-page.js'
import { TerrainProjectFallback } from '../src/components/terrain-recreation/TerrainProjectFallback'
import { getSearchResults } from '../src/components/layout/site-search/search-data'
import { TestRouter } from './helpers/TestRouter'

const record: ProjectRecord = {
  id: 'database-id', slug: 'published-database-project', title: 'Published database project', description: 'Real content from the CMS.',
  image: 'https://media.example.test/project.webp', imageAlt: 'Real project cover', category: 'Web', year: '2026', technologies: ['Rust', 'React'],
  githubUrl: '', liveUrl: '', featured: true,
  gallery: [{ url: 'https://media.example.test/detail.webp', alt: 'A real detail', caption: 'Saved caption' }],
  thumbnailUrl: 'https://media.example.test/thumb.webp', featuredImageUrl: 'https://media.example.test/detail.webp',
}

test('public projects load every API page with no seed additions', async () => {
  const paths: string[] = []
  const data = await loadPublishedProjects(async <T,>(path: string): Promise<T> => {
    paths.push(path)
    return { data: [{ ...record, id: path.includes('page=2') ? 'second-db-id' : record.id, slug: path.includes('page=2') ? 'second-db-project' : record.slug }], pagination: { totalPages: 2 } } as T
  })
  expect(paths).toEqual(['/api/v1/projects?perPage=100&sort=newest', '/api/v1/projects?perPage=100&sort=newest&page=2'])
  expect(data.map(project => project.id)).toEqual(['database-id', 'second-db-id'])
  expect(data[0].media).toEqual([{ type: 'image', src: record.gallery![0].url, alt: 'A real detail', caption: 'Saved caption' }])
  expect(data[0].overview).toBe('')
  expect(toTerrainProjects(data)[0].imageUrl).toBe(record.thumbnailUrl)
  expect(toTerrainProjects(data)[0].heroImageUrl).toBe(record.featuredImageUrl)
  expect(data[0].featuredImageAlt).toBe('A real detail')
  expect(projectFromRecord({ ...record, overview: 'Saved overview', features: ['Saved feature'] }).features).toEqual(['Saved feature'])
})

test('empty and failed archives never fall back to dummy projects', async () => {
  expect(await loadPublishedProjects(async <T,>() => ({ data: [], pagination: { totalPages: 0 } }) as T)).toEqual([])
  await expect(loadPublishedProjects(async () => { throw new Error('API unavailable') })).rejects.toThrow('API unavailable')
  const markup = renderToString(<TestRouter><TerrainProjectFallback /></TestRouter>)
  expect(markup).toContain('No projects have been published yet.')
  expect(markup).not.toContain('hotel-booking-platform')
  expect(markup).not.toContain('saas-command-center')
})

test('search and SSR show only the supplied database projects', () => {
  const projects = [projectFromRecord(record)]
  const markup = renderToString(<TestRouter><TerrainProjectFallback projects={projects} /></TestRouter>)
  expect(markup).toContain(record.title)
  expect(markup).toContain(record.description)
  expect(markup).not.toContain('Hotel Booking Platform')
  expect(getSearchResults('Published', projects).map(result => result.href)).toEqual([`/projects/${record.slug}`])
  expect(getSearchResults('Hotel Booking', projects)).toEqual([])
  expect(getSearchResults('Hotel Booking')).toEqual([])
})

test('terrain catalogues are isolated, hydrate saved details and support empty or single project collections', () => {
  const markers = toTerrainProjects([projectFromRecord(record)])
  const catalog = createProjectCatalog(markers)
  const empty = createProjectCatalog([])
  expect(catalog.getProject(record.slug)?.title).toBe(record.title)
  expect(catalog.getNextProject(record.slug)?.id).toBe(record.slug)
  expect(empty.getNextProject('missing')).toBeNull()
  expect(empty.getProject(record.slug)).toBeNull()
  catalog.updateProject(projectFromRecord({ ...record, overview: 'Published full narrative', results: 'Saved results' }))
  expect(catalog.getProject(record.slug)?.summary).toBe('Published full narrative')
  expect(catalog.getProject(record.slug)?.results).toBe('Saved results')
  expect(markers[0].summary).toBe('')
  expect(catalog.projectFromPath('/projects/hotel-booking-platform')).toBeNull()
  expect(catalog.projectFromPath(`/projects/${record.slug}`)?.id).toBe(record.slug)
})

test('a single database project renders hydrated detail updates without dummy next-project links', () => {
  const host = document.createElement('div')
  document.body.append(host)
  let active = false
  const pass = {
    transition: { getState: () => ({ active }), open: () => { active = true }, close: () => { active = false } },
    setLayout() {}, setProject() {}, resetImages() {}, revealImage() {}, hoverImage() {}, setImageVisibility() {}, setMediaLayout() {}, setMediaImage() {}, pointer: { set() {} },
  }
  const artwork = document.createElement('img')
  artwork.width = 1600; artwork.height = 900
  const page = createProjectPage({ host, pass, projects: toTerrainProjects([projectFromRecord(record)]), getArtwork: () => ({ image: artwork }), noise: {}, imageBase: '/', reducedMotion: true, onNavigate() {} })
  const detail = projectFromRecord({ ...record, overview: 'Saved full overview', features: ['Database feature'] })
  page.syncRoute(record.slug, detail)
  expect(host.querySelector('h1')?.textContent).toBe(record.title)
  expect(host.querySelector('.case-hero-image')?.getAttribute('src')).toBe(record.featuredImageUrl)
  expect(host.querySelector('.case-summary')?.textContent).toBe('Saved full overview')
  expect(host.querySelector('.case-features')?.textContent).toContain('Database feature')
  expect((host.querySelector('.case-next') as HTMLAnchorElement).hidden).toBe(true)
  page.syncRoute(record.slug, { ...detail, overview: 'Edited database overview' })
  expect(host.querySelector('.case-summary')?.textContent).toBe('Edited database overview')
  expect(host.innerHTML).not.toContain('hotel-booking-platform')
  page.dispose(); host.remove()
})

test('late full-image responses cannot replace a newer project hero', async () => {
  const host = document.createElement('div'); document.body.append(host)
  const complete = new Map<string, (texture: unknown) => void>()
  const first = projectFromRecord(record), second = { ...first, slug: 'second-project', title: 'Second project', featuredImageUrl: '/second-hero.webp' }
  let active = false
  const pass = {
    transition: { getState: () => ({ active }), open: () => { active = true }, close: () => { active = false } },
    setLayout() {}, setProject: mock(() => {}), resetImages() {}, revealImage() {}, hoverImage() {}, setImageVisibility() {}, setMediaLayout() {}, setMediaImage() {}, pointer: { set() {} },
  }
  const artwork = { image: { width: 320, height: 180 } }
  const page = createProjectPage({ host, pass, projects: toTerrainProjects([first, second]), getArtwork: () => artwork,
    loadArtwork: (id: string) => new Promise(resolve => complete.set(id, resolve)), noise: {}, imageBase: '/', reducedMotion: true, onNavigate() {} })
  page.syncRoute(first.slug, first)
  page.syncRoute(second.slug, second)
  const full = { image: { width: 1200, height: 900 } }
  complete.get(second.slug)!(full)
  await Promise.resolve()
  expect(pass.setProject.mock.calls.at(-1)?.[0]).toBe(second.slug)
  expect(pass.setProject.mock.calls.at(-1)?.[1]).toBe(full)
  const count = pass.setProject.mock.calls.length
  complete.get(first.slug)!(artwork)
  await Promise.resolve()
  expect(pass.setProject).toHaveBeenCalledTimes(count)
  expect(host.querySelector('.case-hero-image')?.getAttribute('src')).toBe('/second-hero.webp')
  page.dispose(); host.remove()
})

test('failed hero textures keep a readable native image without uploading it into WebGL', async () => {
  const host = document.createElement('div'); document.body.append(host)
  let active = false
  const visibility = mock(() => {})
  const pass = { transition: { getState: () => ({ active }), open: () => { active = true }, close() {} }, setLayout() {}, setProject() {}, resetImages() {}, revealImage() {}, hoverImage() {}, setImageVisibility: visibility, setMediaLayout() {}, setMediaImage() {}, pointer: { set() {} } }
  const artwork = { image: { width: 320, height: 180 } }
  const detail = projectFromRecord(record)
  const page = createProjectPage({ host, pass, projects: toTerrainProjects([detail]), getArtwork: () => artwork, loadArtwork: async () => null, noise: {}, imageBase: '/', reducedMotion: true, onNavigate() {} })
  page.syncRoute(detail.slug, detail)
  await Promise.resolve()
  const image = host.querySelector('.case-hero-image') as HTMLImageElement
  expect(image.crossOrigin).toBe('anonymous')
  image.dispatchEvent(new Event('error'))
  expect(image.hasAttribute('crossorigin')).toBe(false)
  expect(image.src).toBe(record.featuredImageUrl)
  expect(host.querySelector('.case-art')?.getAttribute('data-render-mode')).toBe('native')
  expect(visibility).toHaveBeenCalledWith('hero', 0)
  page.dispose(); host.remove()
})
