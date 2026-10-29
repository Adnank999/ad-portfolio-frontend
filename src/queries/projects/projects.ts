import { queryOptions } from '@tanstack/react-query'
import { publicProjectFn, publicProjectsFn } from '@/server/public-projects'

export const projectKeys = { all: ['public-projects'] as const }
export const projectsOptions = () => queryOptions({ queryKey: [...projectKeys.all, 'archive'], queryFn: () => publicProjectsFn(), staleTime: 0, retry: false })
export const projectOptions = (slug: string) => queryOptions({ queryKey: [...projectKeys.all, 'detail', slug], queryFn: () => publicProjectFn({ data: { slug } }), staleTime: 0, retry: false })
