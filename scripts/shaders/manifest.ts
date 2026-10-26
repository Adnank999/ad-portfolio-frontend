import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { z as schema } from 'zod'
import { readDefinitions } from './definitions'
import { canonicalJson } from './canonical-json'

const definitions = await readDefinitions()
const manifest = {
  formatVersion: 1,
  shaders: definitions.map(definition => {
    const contract = { id: definition.id, name: definition.name, version: definition.version, defaults: definition.defaults, schema: schema.toJSONSchema(definition.schema), controls: definition.controls }
    return { ...contract, contract: createHash('sha256').update(canonicalJson(contract)).digest('hex'), defaultActive: definition.status === 'ready' }
  }),
}
const output = `${JSON.stringify(manifest, null, 2)}\n`
const target = new URL('../../schemas/shaders.manifest.json', import.meta.url)
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== output) throw new Error('Shader manifest is stale. Run bun run shader:manifest and synchronize the backend copy.')
  console.log(`Verified manifest: ${manifest.shaders.length} configured shaders`)
} else {
  await mkdir(new URL('./', target), { recursive: true })
  await writeFile(target, output, 'utf8')
  if (process.argv.includes('--sync-backend')) {
    const backend = new URL('../../../Backend/assets/', import.meta.url)
    await mkdir(backend, { recursive: true })
    await writeFile(new URL('shaders.manifest.json', backend), output, 'utf8')
    console.log('Synchronized Backend/assets/shaders.manifest.json; commit both repositories together')
  }
  console.log(`Generated manifest: ${manifest.shaders.length} configured shaders`)
}
