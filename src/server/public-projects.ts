import { createServerFn } from '@tanstack/react-start'
import { loadPublishedProjects, projectFromRecord, type ProjectRecord } from '@/lib/public-projects'
import { portfolioApi, PortfolioApiError } from './portfolio-api'

export const publicProjectsFn = createServerFn({ method: 'GET' }).handler(() => loadPublishedProjects(portfolioApi))

export const publicProjectFn = createServerFn({ method: 'GET' })
  .validator((input: { slug: string }) => {
    if (typeof input?.slug !== 'string' || input.slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) throw new Error('Invalid project slug')
    return input
  })
  .handler(async ({ data }) => {
    try {
      const record = await portfolioApi<ProjectRecord>(`/api/v1/projects/${encodeURIComponent(data.slug)}`)
      return { project: projectFromRecord(record), seo: record.seo }
    } catch (error) {
      if (error instanceof PortfolioApiError && error.status === 404) return null
      throw error
    }
  })
