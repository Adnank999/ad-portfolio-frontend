import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const name = process.argv.slice(2).find(value => value !== '--')
if (!name || !/^[A-Z][A-Za-z0-9]{0,63}$/.test(name)) {
  console.error('Usage: bun run shader:add -- FluxLines')
  process.exit(1)
}
const id = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase()
const vendorRelative = 'src/components/shaders/react-bits'
const vendor = path.join(root, vendorRelative)
const adapter = path.join(root, 'src/components/shaders/adapters', `${name}Adapter.tsx`)
const definition = path.join(root, 'src/components/shaders/definitions', `${id}.ts`)
function findEntry(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? findEntry(path.join(directory, entry.name)) : entry.isFile() && entry.name === `${name}.tsx` ? [path.join(directory, entry.name)] : [])
}
try {
  if (existsSync(adapter) || existsSync(definition) || findEntry(vendor).length || existsSync(path.join(root, 'src/components', `${name}.tsx`))) throw new Error('Shader already exists; review its source and register/version it without overwriting')
  const config = JSON.parse(readFileSync(path.join(root, 'components.json'), 'utf8'))
  if (config.registries?.['@react-bits'] !== 'https://reactbits.dev/r/{name}.json') throw new Error('Configure the @react-bits registry in components.json first')
  const registry = `@react-bits/${name}-TS-TW`
  const run = args => {
    const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', 'shadcn@latest', ...args], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(`shadcn failed (${result.status})`)
  }
  run(['add', registry, '--path', vendorRelative, '--dry-run'])
  if (process.argv.includes('--dry-run')) process.exit(0)
  run(['add', registry, '--path', vendorRelative, '--yes'])
  const entries = findEntry(vendor)
  if (entries.length !== 1) throw new Error(`Expected one ${name}.tsx under ${vendorRelative}; inspect CLI output. Files were not moved or rolled back.`)
  const relative = path.relative(path.dirname(adapter), entries[0]).replaceAll(path.sep, '/').replace(/\.tsx$/, '')
  mkdirSync(path.dirname(adapter), { recursive: true })
  mkdirSync(path.dirname(definition), { recursive: true })
  writeFileSync(adapter, `export { default } from ${JSON.stringify(relative.startsWith('.') ? relative : `./${relative}`)}\n`, { flag: 'wx' })
  writeFileSync(definition, `import { z as schema } from 'zod'\nimport type { ShaderDefinition } from '../types'\n\nexport const definition = {\n  id: '${id}', name: '${name.replace(/([a-z])([A-Z])/g, '$1 $2')}', version: 1, status: 'draft', source: '${registry}',\n  schema: schema.strictObject({}), defaults: {}, controls: [],\n  load: () => import('../adapters/${name}Adapter'),\n} satisfies ShaderDefinition\n`, { flag: 'wx' })
  console.log('Draft installed. Review props, cleanup and adapter; configure schema/defaults/controls and verify browser rendering. Leave status as draft, run shader:sync, shader:check, tests and build, then deploy both repositories and activate from Admin > Services > Shader library.')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  console.error('Inspect git diff; existing dependency/source changes were not rolled back.')
  process.exitCode = 1
}
