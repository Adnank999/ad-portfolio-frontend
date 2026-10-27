import { createServerFn } from '@tanstack/react-start'
import { portfolioApi, PortfolioApiError } from './portfolio-api'
import type { PublishedService, ServiceSummary } from '@/lib/services/services'
import { publicServiceCopy } from '@/lib/services/public-service-copy'

type Archive = { data: ServiceSummary[]; pagination: { totalPages: number } }

export const publicServicesFn = createServerFn({ method: 'GET' }).handler(async (): Promise<ServiceSummary[]> => {
  const first = await portfolioApi<Archive>('/api/v1/services?perPage=100&sort=title')
  if (first.pagination.totalPages > 100) throw new Error('Service collection exceeds the supported archive size')
  const records = [...first.data]
  for (let page = 2; page <= first.pagination.totalPages; page++) records.push(...(await portfolioApi<Archive>(`/api/v1/services?perPage=100&sort=title&page=${page}`)).data)
  return records
})

export const publicServiceFn = createServerFn({ method: 'GET' })
  .validator((input: { slug: string }) => {
    if (typeof input?.slug !== 'string' || input.slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) throw new Error('Invalid service slug')
    return input
  })
  .handler(async ({ data }): Promise<PublishedService | null> => {
    try { return publicServiceCopy(await portfolioApi<PublishedService>(`/api/v1/services/${encodeURIComponent(data.slug)}`)) }
    catch (error) { if (error instanceof PortfolioApiError && error.status === 404) return null; throw error }
  })
