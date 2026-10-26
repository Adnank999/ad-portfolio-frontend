import type { ShaderDefinition, ShaderManifest } from './types'
import { configuredDefinitions, discoverDefinitions } from './registry-core'
import manifest from '../../../schemas/shaders.manifest.json'

const modules = import.meta.glob<{ definition: ShaderDefinition }>('./definitions/*.ts', { eager: true })
export const allShaderDefinitions = discoverDefinitions(modules)
export const publishedShaderDefinitions = configuredDefinitions(allShaderDefinitions, manifest)
export const shaderManifest: ShaderManifest = manifest
export function getPublishedShader(id: string): ShaderDefinition | null { return Object.hasOwn(publishedShaderDefinitions, id) ? publishedShaderDefinitions[id] : null }
export function backendHasShader(backend: ShaderManifest | undefined, id: string) {
  const local = shaderManifest.shaders.find(entry => entry.id === id)
  return !!local && backend?.formatVersion === shaderManifest.formatVersion && backend.shaders.some(entry => entry.id === id && entry.version === local.version && entry.contract === local.contract)
}
export function backendSupportsShader(backend: ShaderManifest | undefined, id: string) {
  const entry = backend?.shaders.find(entry => entry.id === id)
  return backendHasShader(backend, id) && (entry?.active ?? entry?.defaultActive ?? true)
}
