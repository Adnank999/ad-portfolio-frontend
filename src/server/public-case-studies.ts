import { createServerFn } from '@tanstack/react-start'
import type { CaseStudy, CaseStudySummary } from '@/data/case-studies/types'
import { portfolioApi, PortfolioApiError } from './portfolio-api'

type Published<T> = Omit<T, 'status'> & { studyType: CaseStudy['status'] }
type Archive = { data: Published<CaseStudySummary>[]; pagination: { totalPages: number } }

export const publicCaseStudiesFn = createServerFn({ method: 'GET' }).handler(async (): Promise<CaseStudySummary[]> => {
  const first = await portfolioApi<Archive>('/api/v1/case-studies?perPage=100&sort=title')
  if (first.pagination.totalPages > 100) throw new Error('Case study collection exceeds the supported archive size')
  const records = [...first.data]
  for (let page = 2; page <= first.pagination.totalPages; page++) {
    const archive = await portfolioApi<Archive>(`/api/v1/case-studies?perPage=100&sort=title&page=${page}`)
    records.push(...archive.data)
  }
  return records.map(record => ({ ...record, status: record.studyType }))
})

export const publicCaseStudyFn = createServerFn({ method: 'GET' })
  .validator((input: { slug: string }) => {
    if (typeof input?.slug !== 'string' || input.slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) throw new Error('Invalid case study slug')
    return input
  })
  .handler(async ({ data }): Promise<CaseStudy | null> => {
    try {
      const record = await portfolioApi<Published<CaseStudy>>(`/api/v1/case-studies/${encodeURIComponent(data.slug)}`)
      return { ...record, status: record.studyType }
    } catch (error) {
      if (error instanceof PortfolioApiError && error.status === 404) return null
      throw error
    }
  })
