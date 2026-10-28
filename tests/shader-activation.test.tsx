import { afterEach, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { ShaderLibrary } from '../src/components/admin/shader-library/ShaderLibrary'
import { ShaderLibraryPage } from '../src/components/admin/shader-library/ShaderLibraryPage'
import { ShaderEditor } from '../src/components/shaders/ShaderEditor'
import { ActiveShaderProvider } from '../src/components/shaders/ActiveShaderProvider'
import { definition as orb } from '../src/components/shaders/definitions/orb'
import { backendSupportsShader, shaderManifest } from '../src/components/shaders/registry'
import type { ShaderManifest } from '../src/components/shaders/types'
import type { ShaderActivationInput } from '../src/server/shaders'
import { shaderCatalogOptions } from '../src/queries/services/shaders'

afterEach(cleanup)

test('shader activation has its own guarded route and sidebar entry, not a service form panel', () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
  const navigation = read('../src/components/admin/AdminLayout.tsx')
  const route = read('../src/routes/admin/shaders.tsx')
  const serviceFields = read('../src/components/admin/service-fields/ServiceFields.tsx')
  expect(navigation).toContain("to: '/admin/shaders', label: 'Shaders'")
  expect(route).toContain("createFileRoute('/admin/shaders')")
  expect(route).toContain("context.account.permissions.includes('services:write')")
  expect(route).toContain('component: ShaderLibraryPage')
  expect(serviceFields).not.toContain('ShaderLibrary')
  expect(serviceFields).toContain('to="/admin/shaders"')
  expect(serviceFields).toContain('<ServiceVisualField')
})

test('standalone shader page shows loading, an actionable catalog error, and a working retry', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  let attempts = 0
  let rejectCatalog: (error: Error) => void = () => {}
  const pending = new Promise<ShaderManifest>((_resolve, reject) => { rejectCatalog = reject })
  const loadCatalog = () => ++attempts === 1 ? pending : Promise.resolve({ ...shaderManifest, canManage: true })
  render(<QueryClientProvider client={client}><ShaderLibraryPage loadCatalog={loadCatalog} /></QueryClientProvider>)
  expect(screen.getByRole('heading', { name: 'Shaders.' })).toBeTruthy()
  expect(screen.getByRole('status').textContent).toContain('Loading shader catalog')
  expect(screen.queryByRole('button', { name: 'Deactivate Orb' })).toBeNull()
  rejectCatalog(new Error('Shader activation is unavailable. Apply pending backend database migrations, restart the API, then retry'))
  expect((await screen.findByRole('alert')).textContent).toContain('Apply pending backend database migrations')
  expect(screen.queryByRole('heading', { name: 'Shader availability' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Retry shader catalog' }))
  await screen.findByRole('heading', { name: 'Shader availability' })
  expect((screen.getByRole('button', { name: 'Deactivate Orb' }) as HTMLButtonElement).disabled).toBe(false)
  expect(screen.queryByRole('alert')).toBeNull()
  expect(attempts).toBe(2)
  expect(screen.getByRole('region', { name: 'Shader availability' }).tagName).toBe('SECTION')
  client.clear()
})

test('standalone shader page disables stale activation controls when a catalog refresh fails', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  client.setQueryData(shaderCatalogOptions().queryKey, { ...shaderManifest, canManage: true })
  const loadCatalog = async () => { throw new Error('Backend unavailable') }
  render(<QueryClientProvider client={client}><ShaderLibraryPage loadCatalog={loadCatalog} /></QueryClientProvider>)
  expect((screen.getByRole('button', { name: 'Deactivate Orb' }) as HTMLButtonElement).disabled).toBe(false)
  await client.invalidateQueries({ queryKey: shaderCatalogOptions().queryKey })
  await screen.findByRole('alert')
  await waitFor(() => expect((screen.getByRole('button', { name: 'Deactivate Orb' }) as HTMLButtonElement).disabled).toBe(true))
  client.clear()
})

test('admin activation updates the shared picker immediately without saving the service', async () => {
  let catalog: ShaderManifest = { ...shaderManifest, canManage: true, shaders: shaderManifest.shaders.map(entry => ({ ...entry, active: false })) }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } })
  const calls: ShaderActivationInput[] = []
  const activate = async ({ data }: { data: ShaderActivationInput }) => {
    calls.push(data)
    catalog = { ...catalog, shaders: catalog.shaders.map(entry => entry.id === data.id ? { ...entry, active: data.active } : entry) }
    return catalog
  }
  function Library() {
    const query = useQuery({ queryKey: shaderCatalogOptions().queryKey, queryFn: async () => catalog, initialData: catalog })
    return <><ShaderLibrary catalog={query.data} disabled={false} activate={activate} /><ActiveShaderProvider><ShaderEditor visual={{ type: 'shader', shader: 'orb', version: 1, props: structuredClone(orb.defaults), poster: '/poster.webp', alt: 'Orb poster' }} backend={query.data} disabled={false} onChange={() => {}} /></ActiveShaderProvider></>
  }
  render(<QueryClientProvider client={client}><Library /></QueryClientProvider>)
  expect(screen.getByRole('option', { name: /Orb — draft/ }).hasAttribute('disabled')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Activate Orb' }))
  await screen.findByRole('button', { name: 'Deactivate Orb' })
  expect(calls).toEqual([{ id: 'orb', version: 1, contract: shaderManifest.shaders.find(entry => entry.id === 'orb')!.contract, active: true }])
  expect(screen.getByRole('option', { name: 'Orb' }).hasAttribute('disabled')).toBe(false)
  expect(backendSupportsShader(client.getQueryData(shaderCatalogOptions().queryKey), 'orb')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Deactivate Orb' }))
  await screen.findByRole('button', { name: 'Activate Orb' })
  await waitFor(() => expect(calls).toHaveLength(2))
  expect(screen.getByRole('option', { name: /Orb — draft/ }).hasAttribute('disabled')).toBe(true)
  client.clear()
})

test('activation fails closed for missing contracts, permissions and API failures', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  let attempts = 0
  const activate = async () => { attempts++; throw new Error('Activation was refused') }
  const catalog = { ...shaderManifest, canManage: true, shaders: shaderManifest.shaders.map(entry => ({ ...entry, active: false })) }
  const view = render(<QueryClientProvider client={client}><ShaderLibrary catalog={{ ...catalog, canManage: false }} disabled={false} activate={activate} /></QueryClientProvider>)
  expect((screen.getByRole('button', { name: 'Activate Orb' }) as HTMLButtonElement).disabled).toBe(true)
  view.rerender(<QueryClientProvider client={client}><ShaderLibrary catalog={{ ...catalog, shaders: [] }} disabled={false} activate={activate} /></QueryClientProvider>)
  expect((screen.getByRole('button', { name: 'Activate Orb' }) as HTMLButtonElement).disabled).toBe(true)
  expect(screen.getAllByText(/Needs setup/).length).toBeGreaterThan(0)
  expect(attempts).toBe(0)
  view.rerender(<QueryClientProvider client={client}><ShaderLibrary catalog={catalog} disabled={false} activate={activate} /></QueryClientProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Activate Orb' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Activation was refused')
  expect(screen.getByRole('button', { name: 'Activate Orb' })).toBeTruthy()
  expect(attempts).toBe(1)
  client.clear()
})
