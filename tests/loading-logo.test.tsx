import { afterEach, expect, test } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { Box3, BufferAttribute, BufferGeometry, Group, Mesh, MeshStandardMaterial, Texture, Vector3 } from 'three'
import { LoadingLogo } from '../src/components/feedback/loading-logo/LoadingLogo'
import { cloneLoadingModel, disposeLoadingModel, fitLoadingModel, loaderModelPath, loaderRingRadius, prepareLoadingMaterials, releaseLoadingModelInstance } from '../src/components/feedback/loading-logo/model'
import { createAsyncAssetCache } from '../src/components/feedback/loading-logo/asset-cache'

afterEach(cleanup)

test('startup preload and later loaders share one request and one decoded asset', async () => {
  let requests = 0
  const template = new Group()
  const cached = createAsyncAssetCache(async () => { requests++; return template })
  const [startup, first, second] = await Promise.all([cached('/logo.glb'), cached('/logo.glb'), cached('/logo.glb')])
  expect([startup, first, second]).toEqual([template, template, template])
  expect(await cached('/logo.glb')).toBe(template)
  expect(requests).toBe(1)
})

test('failed background warmup can retry rather than permanently caching a rejection', async () => {
  let requests = 0
  const cached = createAsyncAssetCache(async () => {
    if (++requests === 1) throw new Error('Offline')
    return 'decoded'
  })
  await expect(cached('/logo.glb')).rejects.toThrow('Offline')
  expect(await cached('/logo.glb')).toBe('decoded')
  expect(requests).toBe(2)
})

test('replacing the model version loads a new asset while unchanged versions stay cached', async () => {
  const requests: string[] = []
  const cached = createAsyncAssetCache(async url => {
    requests.push(url)
    return new Group()
  })
  const previousUrl = '/loader/crimson_logo_optimized.glb?v=previous'
  const updatedUrl = '/loader/crimson_logo_optimized.glb?v=updated'
  const previous = await cached(previousUrl)
  const updated = await cached(updatedUrl)
  expect(updated).not.toBe(previous)
  expect(await cached(updatedUrl)).toBe(updated)
  expect(requests).toEqual([previousUrl, updatedUrl])
})

test('loader instances own their materials but retain shared geometry and decoded textures', () => {
  const geometry = new BufferGeometry()
  const texture = new Texture()
  const material = new MeshStandardMaterial({ map: texture })
  const template = new Group()
  template.add(new Mesh(geometry, material))
  const first = cloneLoadingModel(template)
  const second = cloneLoadingModel(template)
  const firstMesh = first.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>
  const secondMesh = second.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>
  expect(firstMesh.geometry).toBe(geometry)
  expect(firstMesh.material).not.toBe(material)
  expect(firstMesh.material).not.toBe(secondMesh.material)
  expect(firstMesh.material.map).toBe(texture)
  let sharedDisposals = 0
  geometry.addEventListener('dispose', () => sharedDisposals++)
  texture.addEventListener('dispose', () => sharedDisposals++)
  releaseLoadingModelInstance(first)
  expect(sharedDisposals).toBe(0)
  expect(secondMesh.material.map).toBe(texture)
  releaseLoadingModelInstance(second)
  disposeLoadingModel(template)
  expect(sharedDisposals).toBe(2)
})

const file = readFileSync(new URL('../public/loader/crimson_logo_optimized.glb', import.meta.url))
const jsonLength = file.readUInt32LE(12)
const document = JSON.parse(file.subarray(20, 20 + jsonLength).toString()) as {
  meshes: { name: string; primitives: { attributes: { POSITION: number }; indices: number }[] }[]
  accessors: { bufferView: number; byteOffset?: number; count: number }[]
  bufferViews: { byteOffset: number }[]
  images: { bufferView: number }[]
  materials: { name: string }[]
}

test('the updated model keeps all seven meshes and its embedded surface textures', () => {
  expect(file.toString('ascii', 0, 4)).toBe('glTF')
  expect(file.readUInt32LE(8)).toBe(file.length)
  expect(file.length).toBeLessThan(2_100_000)
  expect(document.meshes).toHaveLength(7)
  expect(document.images).toHaveLength(2)
  expect(document.meshes.map(mesh => mesh.name)).toContain('CenterOrb')
  expect(document.materials.map(material => material.name)).toContain('Crimson Candy Chrome | Smooth Front')
  expect(loaderModelPath).toBe('loader/crimson_logo_optimized.glb')
})

test('the actual supplied vertices fit inside the ring without rotation or deformation', () => {
  const model = new Group()
  const binaryOffset = 20 + jsonLength + 8
  for (const record of document.meshes) {
    const primitive = record.primitives[0]
    const position = document.accessors[primitive.attributes.POSITION]
    const index = document.accessors[primitive.indices]
    const positions = new Float32Array(file.buffer, file.byteOffset + binaryOffset + document.bufferViews[position.bufferView].byteOffset + (position.byteOffset ?? 0), position.count * 3).slice()
    const indices = new Uint32Array(file.buffer, file.byteOffset + binaryOffset + document.bufferViews[index.bufferView].byteOffset + (index.byteOffset ?? 0), index.count).slice()
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setIndex(new BufferAttribute(indices, 1))
    const mesh = new Mesh(geometry, new MeshStandardMaterial())
    mesh.name = record.name
    model.add(mesh)
  }
  const original = Array.from((model.children[0] as Mesh).geometry.getAttribute('position').array)
  const fitted = fitLoadingModel(model)
  fitted.updateMatrixWorld(true)
  const bounds = new Box3().setFromObject(fitted)
  expect(bounds.getCenter(new Vector3()).length()).toBeLessThan(0.0001)
  expect(bounds.getSize(new Vector3()).y).toBeLessThanOrEqual(2.35001)
  const vertex = new Vector3()
  fitted.traverse(object => {
    if (!(object instanceof Mesh)) return
    expect(object.rotation.toArray().slice(0, 3)).toEqual([0, 0, 0])
    const positions = object.geometry.getAttribute('position')
    for (let index = 0; index < positions.count; index++) {
      vertex.fromBufferAttribute(positions, index).applyMatrix4(object.matrixWorld)
      expect(Math.hypot(vertex.x, vertex.y)).toBeLessThan(loaderRingRadius - 0.1)
    }
  })
  expect(Array.from((model.children[0] as Mesh).geometry.getAttribute('position').array)).toEqual(original)
  disposeLoadingModel(fitted)
})

test('glow preparation preserves supplied textures and disposes shared resources only once', () => {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3))
  const texture = new Texture()
  const material = new MeshStandardMaterial({ map: texture, normalMap: texture, emissiveMap: texture })
  const model = new Group()
  model.add(new Mesh(geometry, material), new Mesh(geometry, material))
  const time = { value: 0 }
  prepareLoadingMaterials(model, time)
  expect(material.map).toBe(texture)
  expect(material.normalMap).toBe(texture)
  expect(material.emissiveMap).toBe(texture)
  expect(geometry.hasAttribute('normal')).toBe(true)
  expect(material.customProgramCacheKey()).toBe('crimson-loader-glow-v1')
  let geometryDisposals = 0
  let materialDisposals = 0
  let textureDisposals = 0
  geometry.addEventListener('dispose', () => geometryDisposals++)
  material.addEventListener('dispose', () => materialDisposals++)
  texture.addEventListener('dispose', () => textureDisposals++)
  disposeLoadingModel(model)
  expect([geometryDisposals, materialDisposals, textureDisposals]).toEqual([1, 1, 1])
})

test('the initial fallback only shows the ring, never a different placeholder emblem', () => {
  const markup = renderToString(<LoadingLogo />)
  expect(markup).toContain('loading-logo-fallback')
  expect(markup).not.toContain('<path')
  const { container } = render(<><LoadingLogo /><LoadingLogo /></>)
  expect(container.querySelectorAll('.loading-logo[aria-hidden="true"]')).toHaveLength(2)
  expect(container.querySelectorAll('.loading-logo-fallback circle')).toHaveLength(4)
})

test('model loading stays lazy, abortable, capped and paused when not needed', () => {
  const source = readFileSync(new URL('../src/components/feedback/loading-logo/renderer.ts', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../src/components/feedback/loading-logo/LoadingLogo.tsx', import.meta.url), 'utf8')
  expect(component).toContain("import('./renderer')")
  expect(component).toContain('createLoadingLogoRenderer(canvasRef.current, loaderModelUrl)')
  const preload = readFileSync(new URL('../src/components/feedback/LoaderPreload.tsx', import.meta.url), 'utf8')
  expect(preload).toContain('prewarmLoadingLogo(loaderModelUrl)')
  expect(component).not.toContain("from 'three'")
  const cache = readFileSync(new URL('../src/components/feedback/loading-logo/asset-cache.ts', import.meta.url), 'utf8')
  expect(cache).toContain('new GLTFLoader().parseAsync')
  expect(source).toContain('getLoadingModelTemplate(url.href)')
  expect(source).toContain('cacheLoadingLogoPoster(canvas.toDataURL')
  expect(component).toContain('useSyncExternalStore')
  for (const limit of ['512', '1.5', '1000 / 30', "powerPreference: 'low-power'"]) expect(source).toContain(limit)
  for (const lifecycle of ['visibilitychange', 'IntersectionObserver', 'prefers-reduced-motion', 'webglcontextlost', 'request.abort()', 'releaseLoadingModelInstance', 'cancelAnimationFrame', 'forceContextLoss']) expect(source).toContain(lifecycle)
})
