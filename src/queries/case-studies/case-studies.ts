import { queryOptions } from '@tanstack/react-query'
import { publicCaseStudiesFn, publicCaseStudyFn } from '@/server/public-case-studies'

export const caseStudyKeys = { all: ['public-case-studies'] as const }
export const caseStudiesOptions = () => queryOptions({ queryKey: [...caseStudyKeys.all, 'archive'], queryFn: () => publicCaseStudiesFn(), staleTime: 30_000, retry: false })
export const caseStudyOptions = (slug: string) => queryOptions({ queryKey: [...caseStudyKeys.all, 'detail', slug], queryFn: () => publicCaseStudyFn({ data: { slug } }), staleTime: 30_000, retry: false })
