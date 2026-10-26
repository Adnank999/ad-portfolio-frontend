import { expect, test } from 'bun:test'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { readDefinitions } from '../scripts/shaders/definitions'

test('installer previews, creates draft adapters and fails closed on duplicates or unexpected registry targets', () => {
  const temporary = realpathSync(tmpdir())
  const root = mkdtempSync(join(temporary, 'portfolio-shader-installer-'))
  const scripts = join(root, 'scripts/shaders')
  mkdirSync(scripts, { recursive: true })
  const script = join(scripts, 'add.mjs')
  writeFileSync(script, readFileSync(new URL('../scripts/shaders/add.mjs', import.meta.url)))
  writeFileSync(join(root, 'components.json'), JSON.stringify({ registries: { '@react-bits': 'https://reactbits.dev/r/{name}.json' } }))
  const mock = join(root, 'mock-cli.mjs')
  writeFileSync(mock, `import { mkdirSync, writeFileSync } from 'node:fs'; import path from 'node:path';
const args = process.argv.slice(2);
if (!args.includes('--dry-run')) {
  const name = args.find(value => value.startsWith('@react-bits/')).split('/')[1].replace('-TS-TW', '');
  const destination = path.resolve(name === 'Unexpected' ? 'src/other' : 'src/components/shaders/react-bits');
  mkdirSync(destination, {recursive:true}); writeFileSync(path.join(destination, name + '.tsx'), 'export default function Mock() { return null }');
}
`)
  const executable = join(root, process.platform === 'win32' ? 'npx.cmd' : 'npx')
  writeFileSync(executable, process.platform === 'win32' ? `@echo off\r\n"${process.execPath}" "${mock}" %*\r\n` : `#!/bin/sh\nexec '${process.execPath}' '${mock}' "$@"\n`)
  if (process.platform !== 'win32') chmodSync(executable, 0o755)
  const run = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { cwd: root, env: { ...process.env, PATH: `${root}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}` }, encoding: 'utf8', timeout: 10_000 })
  try {
    expect(run('SafeLines', '--dry-run').status).toBe(0)
    expect(existsSync(join(root, 'src'))).toBe(false)
    expect(run('SafeLines').status).toBe(0)
    const definition = join(root, 'src/components/shaders/definitions/safe-lines.ts')
    expect(readFileSync(definition, 'utf8')).toContain("status: 'draft'")
    expect(readFileSync(definition, 'utf8')).toContain("schema: schema.strictObject({})")
    expect(readFileSync(join(root, 'src/components/shaders/adapters/SafeLinesAdapter.tsx'), 'utf8')).toContain('../react-bits/SafeLines')
    expect(run('SafeLines').status).toBe(1)
    expect(run('Bad;Name').status).toBe(1)
    expect(run('Unexpected').status).toBe(1)
    expect(existsSync(join(root, 'src/components/shaders/definitions/unexpected.ts'))).toBe(false)
    expect(existsSync(join(root, 'src/other/Unexpected.tsx'))).toBe(true)
  } finally {
    if (!resolve(realpathSync(root)).startsWith(`${resolve(temporary)}${sep}portfolio-shader-installer-`)) throw new Error('Unsafe installer fixture cleanup path')
    rmSync(root, { recursive: true, force: true })
  }
}, 30_000)

test('verified visual uploads fail before sending image bytes when direct uploads are disabled', () => {
  const source = `import { uploadImage } from './src/queries/assets/upload';
let requests = 0;
globalThis.fetch = async () => { requests++; return Response.json({enabled:false}) };
try { await uploadImage(new File(['source'], 'image.png', {type:'image/png'}), {requireVerified:true}); process.exit(1) }
catch (error) { if (!error.message.includes('Enable direct R2 uploads') || requests !== 1) throw error }
`
  const result = spawnSync(process.execPath, ['run', '-'], { cwd: new URL('../', import.meta.url), input: source, encoding: 'utf8', timeout: 10_000 })
  expect(result.status).toBe(0)
}, 15_000)

test('configured drafts are exported for admin activation while empty and invalid drafts stay blocked', async () => {
  const temporary = realpathSync(tmpdir())
  const root = mkdtempSync(join(temporary, 'portfolio-shader-definitions-'))
  const original = new URL('../src/components/shaders/definitions/gradient-flow.ts', import.meta.url).href
  const source = `import { definition as original } from ${JSON.stringify(original)};\n`
  try {
    writeFileSync(join(root, 'prepared-draft.ts'), `${source}export const definition = { ...original, id: 'prepared-draft', status: 'draft' };`)
    writeFileSync(join(root, 'empty-draft.ts'), `${source}export const definition = { ...original, id: 'empty-draft', status: 'draft', defaults: {}, controls: [] };`)
    const entries = await readDefinitions(pathToFileURL(`${root}${sep}`))
    expect(entries.map(entry => entry.id)).toEqual(['prepared-draft'])
    expect(entries[0].status).toBe('draft')
    expect(entries[0].schema.safeParse(entries[0].defaults).success).toBe(true)
    writeFileSync(join(root, 'invalid-draft.ts'), `${source}export const definition = { ...original, id: 'invalid-draft', status: 'draft', controls: [] };`)
    await expect(readDefinitions(pathToFileURL(`${root}${sep}`))).rejects.toThrow('strict schema and one control per property')
  } finally {
    if (!resolve(realpathSync(root)).startsWith(`${resolve(temporary)}${sep}portfolio-shader-definitions-`)) throw new Error('Unsafe definition fixture cleanup path')
    rmSync(root, { recursive: true, force: true })
  }
})

test('shader activation bridge validates metadata and enforces the existing same-origin check', () => {
  const source = `import { mock } from 'bun:test';
mock.module('@tanstack/react-start', () => ({ createServerFn: () => {
  let validate = value => value;
  const builder = { validator: fn => { validate = fn; return builder }, handler: fn => async options => fn({data: validate(options?.data)}) };
  return builder;
} }));
let allowed = false;
const requests = [];
mock.module('./src/server/portfolio-api.ts', () => ({ assertSameOrigin: () => { if (!allowed) throw Error('Origin blocked') }, portfolioApi: async (...args) => { requests.push(args); return {formatVersion:1,shaders:[]} } }));
const { setShaderActivationFn } = await import('./src/server/shaders.ts');
const data = {id:'orb',version:1,contract:'a'.repeat(64),active:true};
try { await setShaderActivationFn({data}); throw Error('Expected origin rejection') } catch(error) { if(error.message !== 'Origin blocked') throw error }
if(requests.length) throw Error('Blocked request reached API');
allowed = true;
for (const invalid of [{...data,id:'../users'},{...data,contract:'bad'},{...data,active:'true'},{...data,id:123},{...data,version:0}]) {
  try { await setShaderActivationFn({data:invalid}); throw Error('Expected validation rejection') } catch(error) { if(error.message !== 'Invalid shader activation request') throw error }
}
await setShaderActivationFn({data});
if(requests.length !== 1 || requests[0][0] !== '/api/v1/admin/shaders/orb/activation' || requests[0][1].method !== 'PUT' || !requests[0][1].authenticated || JSON.stringify(requests[0][1].body) !== JSON.stringify({version:1,contract:data.contract,active:true})) throw Error('Incorrect activation bridge');
`
  const result = spawnSync(process.execPath, ['run', '-'], { cwd: new URL('../', import.meta.url), input: source, encoding: 'utf8', timeout: 10_000 })
  expect(result.stderr).toBe('')
  expect(result.status).toBe(0)
}, 15_000)
