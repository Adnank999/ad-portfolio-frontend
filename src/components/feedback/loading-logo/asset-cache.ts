import { Group, Mesh } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { fitLoadingModel } from './model'

export function createAsyncAssetCache<Asset>(load: (url: string) => Promise<Asset>) {
  const entries = new Map<string, Promise<Asset>>()
  return (url: string) => {
    const existing = entries.get(url)
    if (existing) return existing
    const pending = Promise.resolve().then(() => load(url)).catch(error => {
      if (entries.get(url) === pending) entries.delete(url)
      throw error
    })
    entries.set(url, pending)
    return pending
  }
}

export const getLoadingModelTemplate = createAsyncAssetCache(async (url: string): Promise<Group> => {
  const response = await fetch(url, { cache: 'force-cache' })
  if (!response.ok) throw new Error('Loader model unavailable')
  const data = await response.arrayBuffer()
  const gltf = await new GLTFLoader().parseAsync(data, new URL('.', url).href)
  gltf.scene.traverse(object => {
    if (object instanceof Mesh && !object.geometry.hasAttribute('normal')) object.geometry.computeVertexNormals()
  })
  return fitLoadingModel(gltf.scene)
})
