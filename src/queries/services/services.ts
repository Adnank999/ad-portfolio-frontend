import { queryOptions } from '@tanstack/react-query'
import { publicServiceFn, publicServicesFn } from '@/server/public-services'

export const serviceKeys = { all: ['public-services'] as const }
export const servicesOptions = () => queryOptions({ queryKey: [...serviceKeys.all, 'archive'], queryFn: () => publicServicesFn(), staleTime: 0, retry: false })
export const serviceOptions = (slug: string) => queryOptions({ queryKey: [...serviceKeys.all, 'detail', slug], queryFn: () => publicServiceFn({ data: { slug } }), staleTime: 0, retry: false })
