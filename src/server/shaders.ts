import { createServerFn } from '@tanstack/react-start'
import { assertSameOrigin, portfolioApi } from './portfolio-api'
import type { ShaderManifest } from '@/components/shaders/types'

export const shaderCatalogFn = createServerFn({ method: 'GET' }).handler(async () => portfolioApi<ShaderManifest>('/api/v1/admin/shaders', { authenticated: true }))

export type ShaderActivationInput = { id: string; version: number; contract: string; active: boolean }
export const setShaderActivationFn = createServerFn({ method: 'POST' })
  .validator((input: ShaderActivationInput) => {
    if (!input || typeof input.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.id) || input.id.length > 64 || !Number.isSafeInteger(input.version) || input.version < 1 || input.version > 2147483647 || typeof input.contract !== 'string' || !/^[a-f0-9]{64}$/.test(input.contract) || typeof input.active !== 'boolean') throw new Error('Invalid shader activation request')
    return input
  })
  .handler(async ({ data }) => {
    assertSameOrigin()
    return portfolioApi<ShaderManifest>(`/api/v1/admin/shaders/${encodeURIComponent(data.id)}/activation`, {
      method: 'PUT', authenticated: true, body: { version: data.version, contract: data.contract, active: data.active },
    })
  })
