import { createServerFn } from '@tanstack/react-start'
import { assertSameOrigin, portfolioApi } from './portfolio-api'

export type ContentKind = 'blogs' | 'projects' | 'case-studies' | 'services'
export type ContentStatus = 'draft' | 'published' | 'archived'
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
export type JsonObject = { [key: string]: JsonValue }
export type ContentListInput = { kind: ContentKind; page?: number; perPage?: number; status?: ContentStatus; q?: string }
export type ContentSummary = { id: string; slug: string; title: string; description: string; category?: string; enabled?: boolean; navEnabled?: boolean; status: ContentStatus; version: number; updatedAt: string; publishedAt: string | null }
export type ContentList = { data: ContentSummary[]; pagination: { page: number; perPage: number; total: number; totalPages: number } }
export type SeoFields = {
  structuredData?: JsonObject | null
  metaTitle?: string | null; metaDescription?: string | null; canonicalUrl?: string | null
  ogTitle?: string | null; ogDescription?: string | null; ogImage?: string | null
  ogImageAlt?: string | null; twitterTitle?: string | null; twitterDescription?: string | null
  twitterImage?: string | null; noIndex?: boolean; noFollow?: boolean
}
export type ContentWrite = {
  slug: string; title: string; description: string; status: ContentStatus
  publishedAt?: string | null; fields: JsonObject
  editorContent?: JsonObject | null; seo?: SeoFields
  faqs?: { question: string; answer: string }[]; version?: number
}
export type ContentDetail = ContentSummary & ContentWrite & { editorContent: JsonObject | null; createdAt: string; renderedHtml: string }

export const listContentFn = createServerFn({ method: 'GET' })
  .validator((input: ContentListInput) => input)
  .handler(async ({ data }) => {
    const query = new URLSearchParams({ page: String(data.page ?? 1), perPage: String(data.perPage ?? 20) })
    if (data.status) query.set('status', data.status)
    if (data.q) query.set('q', data.q)
    return portfolioApi<ContentList>(`/api/v1/admin/${data.kind}?${query}`, { authenticated: true })
  })

export const getContentFn = createServerFn({ method: 'GET' })
  .validator((input: { kind: ContentKind; id: string }) => input)
  .handler(async ({ data }) => portfolioApi<ContentDetail>(`/api/v1/admin/${data.kind}/${encodeURIComponent(data.id)}`, { authenticated: true }))

export const createContentFn = createServerFn({ method: 'POST' })
  .validator((input: { kind: ContentKind; content: ContentWrite }) => input)
  .handler(async ({ data }) => {
    assertSameOrigin()
    return portfolioApi<ContentDetail>(`/api/v1/admin/${data.kind}`, { method: 'POST', body: data.content, authenticated: true })
  })

export const updateContentFn = createServerFn({ method: 'POST' })
  .validator((input: { kind: ContentKind; id: string; content: ContentWrite }) => input)
  .handler(async ({ data }) => {
    assertSameOrigin()
    return portfolioApi<ContentDetail>(`/api/v1/admin/${data.kind}/${encodeURIComponent(data.id)}`, { method: 'PUT', body: data.content, authenticated: true })
  })

export const deleteContentFn = createServerFn({ method: 'POST' })
  .validator((input: { kind: ContentKind; id: string; version: number }) => input)
  .handler(async ({ data }) => {
    assertSameOrigin()
    await portfolioApi(`/api/v1/admin/${data.kind}/${encodeURIComponent(data.id)}?version=${data.version}`, { method: 'DELETE', authenticated: true })
    return { ok: true }
  })
