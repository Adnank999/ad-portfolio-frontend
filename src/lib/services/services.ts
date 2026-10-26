import type { ServiceContent } from '@/components/global/service-page/servicePage.types'
import type { JsonObject, JsonValue } from '@/server/portfolio-content'
import pageSchema from './page-content.schema.json'
import type { ServiceVisuals } from '@/components/shaders/types'

export type ServiceMedia = { slot: string; kind: 'image' | 'video'; url: string; alt: string; poster: string; caption: string }
export type ServiceSummary = {
  slug: string; title: string; description: string; category: string; artwork: ServiceContent['artwork']
  enabled: boolean; navEnabled: boolean; navTitle: string; navDescription: string; navGroup: string; navOrder: number
  navVisual: 'orbit' | 'cube' | 'signal' | 'device' | 'grid'; navPopular: boolean; navAi: boolean
}
export type PublishedService = ServiceSummary & {
  pageContent: Omit<ServiceContent, 'slug' | 'title' | 'summary' | 'category' | 'artwork' | 'faqs' | 'media' | 'visuals'>
  media: ServiceMedia[]; faqs: { question: string; answer: string }[]
  visuals?: ServiceVisuals
  seo: { metaTitle: string; metaDescription: string; canonicalUrl: string; robots: string; ogTitle: string; ogDescription: string; ogType: string; ogImage: string; ogImageAlt: string; twitterCard: string; twitterTitle: string; twitterDescription: string; twitterImage: string }
  structuredData: JsonObject
}

export function groupServices(services: ServiceSummary[], navigationOnly = false) {
  const groups = new Map<string, ServiceSummary[]>()
  for (const service of [...services].filter(service => service.enabled && (!navigationOnly || service.navEnabled)).sort((left, right) => left.navOrder - right.navOrder || left.slug.localeCompare(right.slug))) {
    const group = groups.get(service.navGroup) ?? []
    group.push(service)
    groups.set(service.navGroup, group)
  }
  return Array.from(groups, ([label, services]) => ({ label, items: services.map(service => ({
    label: service.navTitle, description: service.navDescription, href: `/services/${service.slug}`,
    visual: service.navVisual, popular: service.navPopular, ai: service.navAi,
  })) }))
}

export function assertServicePageContent(value: unknown): asserts value is JsonObject {
  function check(value: unknown, schema: Record<string, unknown>) {
    if (schema.type === 'string') {
      if (typeof value !== 'string' || !value.trim() || value.length > 20000 || value.includes('\0')) throw new Error('Service content contains invalid text.')
    } else if (schema.type === 'array') {
      if (!Array.isArray(value) || value.length > 30) throw new Error('Service content contains an invalid list.')
      value.forEach(item => check(item, schema.items as Record<string, unknown>))
    } else {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Service content contains an invalid section.')
      const fields = schema.properties as Record<string, Record<string, unknown>>
      if (Object.keys(value).length !== Object.keys(fields).length) throw new Error('Service sections do not match the content schema.')
      for (const [key, schema] of Object.entries(fields)) check((value as Record<string, unknown>)[key], schema)
    }
  }
  check(value, pageSchema)
  const content = value as JsonObject
  if (!Array.isArray(content.process) || content.process.length !== 5) throw new Error('Provide all five process phases.')
  for (const name of ['related', 'projectSlugs']) {
    if ((content[name] as JsonValue[]).some(slug => typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) throw new Error('Related services and projects must use valid slugs.')
  }
}

export function emptyServiceFields(): JsonObject {
  function blank(schema: Record<string, unknown>): JsonValue {
    if (schema.type === 'string') return ''
    if (schema.type === 'array') return []
    return Object.fromEntries(Object.entries(schema.properties as Record<string, Record<string, unknown>>).map(([key, schema]) => [key, blank(schema)]))
  }
  const pageContent = blank(pageSchema) as JsonObject
  pageContent.process = ['', '', '', '', '']
  return { category: '', artwork: 'web', enabled: true, navEnabled: true, navTitle: '', navDescription: '', navGroup: 'Software & Product', navOrder: 0, navVisual: 'grid', navPopular: false, navAi: false, pageContent, media: [] }
}
