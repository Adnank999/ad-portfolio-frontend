import { serviceCatalog } from '../src/components/services/serviceCatalog'
import { serviceGroups } from '../src/components/layout/navigationData'
import type { ServiceContent } from '../src/components/global/service-page/servicePage.types'

const records = await Promise.all(serviceCatalog.map(async (service, order) => {
  const module = await import(`../src/components/services/${service.slug}/content.ts`)
  const content = Object.values(module)[0] as ServiceContent
  const { slug, title, summary, category, artwork, faqs, ...pageContent } = content
  const group = serviceGroups.find(group => group.items.some(item => item.href === `/services/${slug}`))!
  const navigation = group.items.find(item => item.href === `/services/${slug}`)!
  return {
    slug, title, description: summary, status: 'published',
    fields: {
      category, artwork, enabled: true, navEnabled: true, navTitle: navigation.label,
      navDescription: navigation.description, navGroup: group.label, navOrder: order,
      navVisual: navigation.visual, navPopular: !!navigation.popular, navAi: !!navigation.ai,
      pageContent: { ...pageContent, projectSlugs: pageContent.projectSlugs ?? [] }, media: [],
    },
    seo: { metaTitle: `${title} | Adnan Hossain Khan`, metaDescription: summary },
    faqs: faqs.map(item => ({ question: item.title, answer: item.text })),
  }
}))

function schema(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') return { type: 'string', minLength: 1, maxLength: 20000 }
  if (Array.isArray(value)) return { type: 'array', maxItems: 30, items: schema(value[0] ?? '') }
  const object = value as Record<string, unknown>
  return { type: 'object', additionalProperties: false, required: Object.keys(object), properties: Object.fromEntries(Object.entries(object).map(([key, value]) => [key, schema(value)])) }
}

await Bun.write(new URL('../../Backend/examples/services.json', import.meta.url), `${JSON.stringify(records, null, 2)}\n`)
const contentSchema = schema(records[0].fields.pageContent)
const properties = contentSchema.properties as Record<string, Record<string, unknown>>
properties.process.minItems = 5
properties.process.maxItems = 5
await Bun.write(new URL('../src/lib/services/page-content.schema.json', import.meta.url), `${JSON.stringify(contentSchema, null, 2)}\n`)
await Bun.write(new URL('../../Backend/examples/service-content.schema.json', import.meta.url), `${JSON.stringify(contentSchema, null, 2)}\n`)
console.log(`Exported ${records.length} existing services and their content schema`)
