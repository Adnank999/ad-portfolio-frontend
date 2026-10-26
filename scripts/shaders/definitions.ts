import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { z as schema } from 'zod'
import type { ShaderDefinition } from '../../src/components/shaders/types'

export async function readDefinitions(directory = new URL('../../src/components/shaders/definitions/', import.meta.url)) {
  const files = (await readdir(directory)).filter(file => file.endsWith('.ts')).sort()
  if (files.length > 64) throw new Error('At most 64 shader definitions are supported')
  const ids = new Set<string>()
  const definitions: ShaderDefinition[] = []
  for (const file of files) {
    const { definition } = await import(fileURLToPath(new URL(file, directory))) as { definition: ShaderDefinition }
    if (!definition || file !== `${definition.id}.ts` || ids.has(definition.id) || !/^[a-z][a-z0-9-]{0,63}$/.test(definition.id)) throw new Error(`${file}: invalid or duplicate ID`)
    ids.add(definition.id)
    if (!['ready', 'draft'].includes(definition.status) || !Number.isSafeInteger(definition.version) || definition.version < 1 || definition.version > 2147483647 || typeof definition.load !== 'function') throw new Error(`${file}: invalid status/version/loader`)
    if (definition.status === 'draft' && !Object.keys(definition.defaults).length && !definition.controls.length) {
      console.log(`${file}: unconfigured draft (needs setup before admin activation)`)
      continue
    }
    if (!definition.schema.safeParse(definition.defaults).success) throw new Error(`${file}: defaults fail schema validation`)
    const jsonSchema = schema.toJSONSchema(definition.schema)
    const properties = jsonSchema.properties ?? {}
    const keys = Object.keys(properties)
    if (!keys.length || keys.length > 32 || jsonSchema.additionalProperties !== false || definition.controls.length !== keys.length || Object.keys(definition.defaults).length !== keys.length) throw new Error(`${file}: configured shaders require a strict schema and one control per property`)
    const controls = new Set<string>()
    for (const control of definition.controls) {
      const property = properties[control.key]
      if (!['slider', 'toggle', 'color', 'color-list', 'select'].includes(control.kind)) throw new Error(`${file}: unsupported control kind`)
      if (!property || !control.label || controls.has(control.key) || /^(?:__proto__|constructor|prototype|style|className|ref|dpr|paused|on[A-Z])/.test(control.key)) throw new Error(`${file}: invalid control ${control.key}`)
      controls.add(control.key)
      if (control.kind === 'slider' && (property.type !== 'number' || property.minimum !== control.min || property.maximum !== control.max || !Number.isFinite(control.step) || control.step <= 0)) throw new Error(`${file}: slider/schema bounds disagree for ${control.key}`)
      if (control.kind === 'toggle' && property.type !== 'boolean') throw new Error(`${file}: toggle must be boolean`)
      if (control.kind === 'color' && (property.type !== 'string' || property.pattern !== '^#[0-9a-fA-F]{6}$')) throw new Error(`${file}: colors must be six-digit hex`)
      if (control.kind === 'color-list' && (property.type !== 'array' || control.minItems < 2 || control.maxItems > 5 || property.minItems !== control.minItems || property.maxItems !== control.maxItems)) throw new Error(`${file}: invalid color-list limits`)
      if (control.kind === 'color-list' && (!property.items || Array.isArray(property.items) || property.items.type !== 'string' || property.items.pattern !== '^#[0-9a-fA-F]{6}$')) throw new Error(`${file}: color-list items must be six-digit hex`)
      if (control.kind === 'select' && JSON.stringify(property.enum) !== JSON.stringify(control.options.map(option => option.value))) throw new Error(`${file}: select choices do not match schema`)
    }
    definitions.push(definition)
  }
  return definitions
}
