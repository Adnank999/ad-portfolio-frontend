import type { ShaderDefinition, ShaderManifest } from './types'

export function discoverDefinitions(modules: Record<string, { definition: ShaderDefinition }>) {
  const definitions: Record<string, ShaderDefinition> = Object.create(null)
  for (const { definition } of Object.values(modules)) {
    if (!definition || !/^[a-z][a-z0-9-]*$/.test(definition.id) || definitions[definition.id]) throw new Error('Invalid or duplicate shader definition')
    definitions[definition.id] = definition
  }
  return definitions
}

export function readyDefinitions(definitions: Record<string, ShaderDefinition>) {
  return Object.fromEntries(Object.entries(definitions).filter(([, definition]) => definition.status === 'ready'))
}

export function configuredDefinitions(definitions: Record<string, ShaderDefinition>, manifest: ShaderManifest) {
  return Object.fromEntries(Object.entries(definitions).filter(([id, definition]) => manifest.shaders.some(entry => entry.id === id && entry.version === definition.version)))
}
