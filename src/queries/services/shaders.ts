import { queryOptions } from '@tanstack/react-query'
import { shaderCatalogFn } from '@/server/shaders'

export const shaderCatalogOptions = () => queryOptions({ queryKey: ['admin-shaders'], queryFn: () => shaderCatalogFn(), staleTime: 60_000, retry: false })
