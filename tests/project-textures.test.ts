import { expect, mock, test } from 'bun:test'
import { createProjectTextureCache } from '../src/components/terrain-recreation/engine/project-textures.js'
import { ProjectShowcasePass } from '../src/components/terrain-recreation/engine/project-showcase.js'
import { assertProjectImages } from '../src/lib/project-gallery'

test('project image settings require a safe thumbnail and a hero from the saved images', () => {
  const fields = { image: '/cover.webp', thumbnailUrl: '/tiny.webp', featuredImageUrl: '/hero.webp', gallery: [{ url: '/hero.webp', alt: 'Hero', caption: '' }] }
  expect(() => assertProjectImages(fields)).not.toThrow()
  for (const thumbnailUrl of ['', '//evil.test/image', 'data:image/png,test', 'javascript:alert(1)', 'https://user:secret@cdn.test/image']) expect(() => assertProjectImages({ ...fields, thumbnailUrl })).toThrow()
  expect(() => assertProjectImages({ ...fields, featuredImageUrl: '/unattached.webp' })).toThrow()
})

test('terrain loads thumbnails once and requests full hero textures only on demand', async () => {
  const callbacks = new Map<string, (value: unknown) => void>()
  const loader = { load: mock((url: string, loaded: (value: unknown) => void) => { callbacks.set(url, loaded) }) }
  const fallback = { dispose: mock(() => {}) }
  const configure = mock(() => {})
  const cache = createProjectTextureCache({ loader, fallback, configure })
  const thumbnail = { image: { width: 320, height: 180 }, dispose: mock(() => {}) }
  const hero = { image: { width: 1920, height: 1080 }, dispose: mock(() => {}) }
  const initial = cache.load('/thumb.webp')
  expect(cache.load('/thumb.webp')).toBe(initial)
  expect(loader.load).toHaveBeenCalledTimes(1)
  expect(cache.peek('/hero.webp')).toBeUndefined()
  callbacks.get('/thumb.webp')!(thumbnail)
  expect(await initial).toBe(thumbnail)
  expect(await cache.load('/thumb.webp')).toBe(thumbnail)
  const detail = cache.load('/hero.webp')
  expect(loader.load).toHaveBeenCalledTimes(2)
  callbacks.get('/hero.webp')!(hero)
  expect(await detail).toBe(hero)
  expect(configure).toHaveBeenCalledTimes(2)
  cache.dispose()
  expect(thumbnail.dispose).toHaveBeenCalledTimes(1)
  expect(hero.dispose).toHaveBeenCalledTimes(1)
  expect(fallback.dispose).not.toHaveBeenCalled()
})

test('disposing a scene settles pending texture work and releases late responses', async () => {
  let complete!: (value: unknown) => void
  const fallback = {}
  const cache = createProjectTextureCache({ loader: { load: (_url: string, loaded: (value: unknown) => void) => { complete = loaded } }, fallback, configure() {} })
  const request = cache.load('/hero.webp')
  cache.dispose()
  expect(await request).toBe(fallback)
  const late = { dispose: mock(() => {}) }
  complete(late)
  expect(late.dispose).toHaveBeenCalledTimes(1)
  expect(await cache.load('/another.webp')).toBe(fallback)
})

test('failed CORS or network responses are not cached as permanent texture successes', async () => {
  let fail!: () => void, complete!: (texture: unknown) => void
  const fallback = {}
  const loader = { load: mock((_url: string, loaded: (texture: unknown) => void, _progress: unknown, error: () => void) => { complete = loaded; fail = error }) }
  const cache = createProjectTextureCache({ loader, fallback, configure() {} })
  const first = cache.load('/hero.webp')
  fail()
  expect(await first).toBe(fallback)
  const second = cache.load('/hero.webp')
  expect(loader.load).toHaveBeenCalledTimes(2)
  const recovered = { dispose() {} }
  complete(recovered)
  expect(await second).toBe(recovered)
  expect(cache.peek('/hero.webp')).toBe(recovered)
  cache.dispose()
})

test('the live showcase can replace a placeholder with the featured image for the same project', () => {
  const pass = new ProjectShowcasePass()
  const thumbnail = { image: { width: 320, height: 180 } }
  const hero = { image: { width: 1200, height: 1000 } }
  pass.setProject('project', thumbnail, thumbnail, {})
  pass.setProject('project', hero, thumbnail, {})
  expect(pass.uniforms.uArtwork.value).toBe(hero)
  expect(pass.uniforms.uArtAspect.value).toBeCloseTo(1.2)
  pass.dispose()
})
