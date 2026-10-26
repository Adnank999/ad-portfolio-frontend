import { describe, expect, mock, test } from 'bun:test'
import { projects } from '../src/data/projects'
import { terrainProjects, terrainProjectPath, terrainProjectFromPath } from '../src/components/terrain-recreation/project-data'
import { createProjectPage, getImageScrollReveal } from '../src/components/terrain-recreation/engine/project-page.js'
import { ProjectShowcasePass } from '../src/components/terrain-recreation/engine/project-showcase.js'
import { PROJECT_ARTWORK_DEFAULTS, PROJECT_ARTWORK_GLSL } from '../src/components/terrain-recreation/engine/project-artwork.js'
import { readFileSync } from 'node:fs'
import postcss from 'postcss'

describe('terrain project integration', () => {
  test('composites source-color artwork after the background-only output grade', () => {
    const source = readFileSync(new URL('../src/components/terrain-recreation/engine/scene.js', import.meta.url), 'utf8')
    const output = source.indexOf('composer.addPass(outputPass)')
    const artwork = source.indexOf('composer.addPass(showcasePass)')
    const grain = source.indexOf('composer.addPass(film.grainPass)')
    expect(output).toBeGreaterThan(0)
    expect(artwork).toBeGreaterThan(output)
    expect(grain).toBeGreaterThan(artwork)
    expect(PROJECT_ARTWORK_GLSL).toContain('sRGBTransferOETF')
    expect(PROJECT_ARTWORK_GLSL).not.toContain('color*mask.y*2.')
    const pass = new ProjectShowcasePass()
    const image = document.createElement('img')
    Object.defineProperties(image, { naturalWidth: { value: 1600 }, naturalHeight: { value: 900 } })
    pass.setMediaImage('media:1', image)
    const material = pass.mediaLayer.images.get('media:1')!.mesh.material
    expect(material.fragmentShader).toContain('sRGBTransferOETF')
    expect(material.fragmentShader).not.toContain('image*2.')
    pass.dispose()
  })

  test('expands organic image apertures and responsive frames without changing source cropping', () => {
    expect(PROJECT_ARTWORK_DEFAULTS.maskScale).toBeLessThan(.86)
    expect(PROJECT_ARTWORK_DEFAULTS.edgeFadeX).toBeLessThan(.14)
    expect(PROJECT_ARTWORK_DEFAULTS.edgeFadeY).toBeLessThan(.18)
    expect(PROJECT_ARTWORK_DEFAULTS.circleInner).toBeGreaterThan(.32)
    expect(PROJECT_ARTWORK_DEFAULTS.circleOuter).toBeGreaterThan(.61)
    const css = postcss.parse(readFileSync(new URL('../src/components/terrain-recreation/terrain.css', import.meta.url), 'utf8'))
    const declarations = (selector: string, mobile = false) => {
      const result: Record<string, string> = {}
      css.walkRules(selector, rule => {
        const parent = rule.parent
        const isMobile = parent?.type === 'atrule' && parent.params === '(max-width: 640px)'
        if (isMobile !== mobile) return
        rule.walkDecls(declaration => { result[declaration.prop] = declaration.value })
      })
      return result
    }
    expect(declarations(':where(.terrain-experience) .case-art').width).toBe('92vw')
    expect(declarations(':where(.terrain-experience) .case-art')['max-height']).toBe('84vh')
    expect(declarations(':where(.terrain-experience) .case-art', true).width).toBe('94vw')
    expect(declarations(':where(.terrain-experience) .case-media')['grid-template-columns']).toBe('7fr 3fr')
    expect(declarations(':where(.terrain-experience) .case-media[data-layout="large"]').width).toBe('min(92vw, 1600px)')
    const fallback = declarations(':where(.terrain-experience) .case-media[data-layout="small"] .case-image')
    expect(parseFloat(fallback['mask-size'])).toBeCloseTo(100 / PROJECT_ARTWORK_DEFAULTS.maskScale, 1)
    expect(fallback['mask-position']).toBe('center')
  })

  test('keeps all prototype styling inside its own route or experience scope', () => {
    const css = readFileSync(new URL('../src/components/terrain-recreation/terrain.css', import.meta.url), 'utf8')
    const root = postcss.parse(css)
    root.walkRules(rule => {
      let parent = rule.parent
      while (parent) {
        if (parent.type === 'atrule' && /keyframes$/.test(parent.name)) return
        parent = parent.parent
      }
      for (const selector of rule.selectors) expect(selector).toMatch(/^(?:\.terrain-|:where\(\.terrain-experience\))/)
    })
  })
  test('uses every portfolio project and preserves its content and public URL', () => {
    expect(terrainProjects).toHaveLength(projects.length)
    for (const [index, project] of projects.entries()) {
      const terrain = terrainProjects[index]
      expect(terrain.id).toBe(project.slug)
      expect(terrain.title).toBe(project.title)
      expect(terrain.imageUrl).toBe(project.image)
      expect(terrain.features).toEqual(project.features)
      expect(terrain.summary).toBe(project.overview)
      expect(terrainProjectPath(terrain.id)).toBe(`/projects/${project.slug}`)
      expect(terrainProjectFromPath(`/projects/${project.slug}/`)).toBe(terrain)
      expect(terrainProjectFromPath(`/portfolio/projects/${project.slug}`, '/portfolio/')).toBe(terrain)
    }
    expect(terrainProjectPath(null)).toBe('/projects')
    expect(terrainProjectFromPath('/projects/unknown')).toBeNull()
    expect(terrainProjectFromPath('/projects/%E0%A4%A')).toBeNull()
    expect(terrainProjectFromPath('/projects/hotel-booking-platform/extra')).toBeNull()
    expect(terrainProjectFromPath('/admin/projects/hotel-booking-platform')).toBeNull()
  })

  test('lets TanStack own navigation, history and SEO while reusing one showcase', () => {
    const host = document.createElement('div')
    document.body.append(host)
    document.title = 'Router-owned title'
    const historyState = window.history.state
    const href = window.location.href
    const navigate = mock((_slug: string | null) => {})
    const onActive = mock((_active: boolean) => {})
    let active = false
    const artwork = document.createElement('img')
    artwork.src = '/terrain/assets/bg.webp'; artwork.width = 1600; artwork.height = 900
    const pass = {
      transition: {
        getState: () => ({ active, amount: active ? 1 : 0, phase: active ? 'open' : 'closed' }),
        open: () => { active = true }, close: () => { active = false },
      },
      setLayout: mock(() => {}), setProject: mock(() => {}), resetImages: mock(() => {}),
      revealImage: mock(() => {}), hoverImage: mock(() => {}), pointer: { set: mock(() => {}) },
      setImageVisibility: mock(() => {}), setMediaLayout: mock(() => {}), setMediaImage: mock(() => {}),
    }
    const page = createProjectPage({ host, pass, getArtwork: () => ({ image: artwork }), noise: {},
      imageBase: '/terrain/assets/', reducedMotion: true, onNavigate: navigate, onActive })
    expect(window.history.state).toBe(historyState)
    const first = terrainProjects[0], second = terrainProjects[1]
    page.open(first.id)
    expect(navigate).toHaveBeenLastCalledWith(first.id)
    expect(active).toBe(false)
    page.syncRoute(first.id)
    expect(host.querySelector('h1')?.textContent).toBe(first.title)
    expect(host.textContent).toContain(first.technical)
    expect(host.textContent).toContain(first.results)
    expect(host.textContent).toContain(first.year)
    expect(host.querySelectorAll('.case-features li')).toHaveLength(first.features.length)
    expect(host.querySelector('.case-media')?.getAttribute('data-layout')).toBe('large')
    expect(host.querySelector('.case-art')?.getAttribute('data-image-effect')).toBe('hero')
    expect(host.querySelectorAll('a[href="#"]')).toHaveLength(0)
    expect(document.title).toBe('Router-owned title')
    host.querySelector<HTMLAnchorElement>('.case-next')!.click()
    expect(navigate).toHaveBeenLastCalledWith(second.id)
    page.syncRoute(second.id)
    expect(host.querySelectorAll('.showcase-page')).toHaveLength(1)
    expect(host.querySelector('h1')?.textContent).toBe(second.title)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(navigate).toHaveBeenLastCalledWith(null)
    expect(window.location.href).toBe(href)
    page.syncRoute(null)
    page.update({ phase: 'closed', amount: 0 })
    expect(onActive).toHaveBeenLastCalledWith(false)
    page.dispose()
    expect(host.childElementCount).toBe(0)
    expect(document.title).toBe('Router-owned title')
    host.remove()
  })

  test('reverses image visibility when scrolling back out, with a reduced-motion bypass', () => {
    const revealAt = (top: number) => getImageScrollReveal({ top, height: 500 }, 900)
    expect(revealAt(950)).toBe(0)
    expect(revealAt(400)).toBe(1)
    expect(revealAt(760)).toBeGreaterThan(0)
    expect(revealAt(760)).toBeLessThan(revealAt(400))
    expect(revealAt(-520)).toBe(0)
    expect(getImageScrollReveal({ top: 950, height: 500 }, 900, true)).toBe(1)
    const pass = new ProjectShowcasePass()
    pass.transition.open()
    for (let frame = 0; frame < 25; frame++) pass.update(frame / 10, .1)
    expect(pass.uniforms.uReveal.value.x).toBe(1)
    pass.setImageVisibility('hero', 0)
    for (let frame = 0; frame < 25; frame++) pass.update(frame / 10, .1)
    expect(pass.uniforms.uReveal.value.x).toBe(0)
    pass.setImageVisibility('hero', 1)
    pass.update(6, .1)
    expect(pass.uniforms.uReveal.value.x).toBeGreaterThan(0)
    pass.dispose()
  })

  test('draws only visible small-image planes and releases their textures on project changes', () => {
    const pass = new ProjectShowcasePass({ reducedMotion: true })
    const image = document.createElement('img')
    Object.defineProperties(image, { naturalWidth: { value: 1600 }, naturalHeight: { value: 900 } })
    pass.setMediaImage('media:1', image)
    pass.setMediaImage('media:1', image)
    expect(pass.mediaLayer.images.size).toBe(1)
    const artwork = pass.mediaLayer.images.get('media:1')!
    const disposed = mock(() => {})
    artwork.texture.addEventListener('dispose', disposed)
    pass.setMediaLayout([{ id: 'media:1', rectangle: { left: 0, top: 150, width: 500, height: 500 }, progress: 1, hovered: true }], 1440, 900)
    pass.transition.open(); pass.update(0, .1)
    expect(artwork.mesh.visible).toBe(true)
    expect(artwork.mesh.material.uniforms.uReveal.value).toBe(1)
    expect(artwork.mesh.material.uniforms.uHover.value).toBe(0)
    pass.setMediaLayout([], 1440, 900); pass.update(.1, .1)
    expect(artwork.mesh.visible).toBe(false)
    pass.resetImages()
    expect(pass.mediaLayer.images.size).toBe(0)
    expect(pass.mediaLayer.scene.children).toHaveLength(0)
    expect(disposed).toHaveBeenCalledTimes(1)
    pass.dispose()
  })
})
