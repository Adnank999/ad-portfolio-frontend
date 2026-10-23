import type { ContentKind, ContentWrite, JsonObject, JsonValue } from '@/server/portfolio-content'

export const aiFields = [
  { key: 'title', label: 'Title', group: 'Core details', type: 'text', max: 200 },
  { key: 'slug', label: 'Slug', group: 'Core details', type: 'text', max: 120 },
  { key: 'description', label: 'Summary', group: 'Core details', type: 'text', max: 1000 },
  { key: 'editorContent', label: 'Rich content', group: 'Rich content', type: 'document', only: ['blogs', 'projects', 'case-studies'], max: 200_000 },
  { key: 'fields.pageContent', label: 'Service page sections', group: 'Service content', type: 'service', only: 'services', max: 200_000 },
  { key: 'fields.navTitle', label: 'Navbar title', group: 'Service content', type: 'text', only: 'services', max: 200 },
  { key: 'fields.navDescription', label: 'Navbar description', group: 'Service content', type: 'text', only: 'services', max: 1000 },
  { key: 'fields.category', label: 'Category', group: 'Details', type: 'text', only: ['blogs', 'projects'], max: 100 },
  { key: 'fields.tags', label: 'Tags', group: 'Details', type: 'list', only: 'blogs', max: 30 },
  { key: 'fields.coverAlt', label: 'Cover image alt', group: 'Details', type: 'text', only: 'blogs', max: 500 },
  { key: 'fields.socialImage', label: 'Social image (known asset only)', group: 'Details', type: 'url', only: 'blogs', max: 2048 },
  { key: 'fields.imageAlt', label: 'Image alt', group: 'Details', type: 'text', only: ['projects', 'case-studies'], max: 500 },
  { key: 'fields.year', label: 'Explicit project year', group: 'Details', type: 'text', only: 'projects', max: 4 },
  { key: 'fields.technologies', label: 'Technologies', group: 'Details', type: 'list', only: ['projects', 'case-studies'], max: 40 },
  { key: 'fields.context', label: 'Context', group: 'Details', type: 'text', only: 'case-studies', max: 20_000 },
  { key: 'fields.lessons', label: 'Lessons', group: 'Details', type: 'list', only: 'case-studies', max: 30 },
  { key: 'fields.overview', label: 'Overview', group: 'Details', type: 'text', only: 'projects', max: 20_000 },
  { key: 'fields.problem', label: 'Problem', group: 'Details', type: 'text', only: ['projects', 'case-studies'], max: 20_000 },
  { key: 'fields.solution', label: 'Solution', group: 'Details', type: 'text', only: ['projects', 'case-studies'], max: 20_000 },
  { key: 'fields.technical', label: 'Technical implementation', group: 'Details', type: 'text', only: 'projects', max: 20_000 },
  { key: 'fields.challenges', label: 'Challenges', group: 'Details', type: 'text', only: 'projects', max: 20_000 },
  { key: 'fields.results', label: 'Results', group: 'Details', type: 'text', only: 'projects', max: 20_000 },
  { key: 'fields.features', label: 'Features', group: 'Details', type: 'list', only: 'projects', max: 100 },
  { key: 'faqs', label: 'FAQs (merged with existing)', group: 'FAQs', type: 'faqs', max: 5 },
  { key: 'seo.metaTitle', label: 'Meta title', group: 'SEO metadata', type: 'text', max: 200 },
  { key: 'seo.metaDescription', label: 'Meta description', group: 'SEO metadata', type: 'text', max: 1000 },
  { key: 'seo.canonicalUrl', label: 'Canonical URL (existing slug only)', group: 'SEO metadata', type: 'url', max: 2048 },
  { key: 'seo.ogTitle', label: 'Open Graph title', group: 'SEO metadata', type: 'text', max: 200 },
  { key: 'seo.ogDescription', label: 'Open Graph description', group: 'SEO metadata', type: 'text', max: 1000 },
  { key: 'seo.ogImage', label: 'Open Graph image (known asset only)', group: 'SEO metadata', type: 'url', max: 2048 },
  { key: 'seo.ogImageAlt', label: 'Open Graph image alt', group: 'SEO metadata', type: 'text', max: 500 },
  { key: 'seo.twitterTitle', label: 'Twitter title', group: 'SEO metadata', type: 'text', max: 200 },
  { key: 'seo.twitterDescription', label: 'Twitter description', group: 'SEO metadata', type: 'text', max: 1000 },
  { key: 'seo.twitterImage', label: 'Twitter image (known asset only)', group: 'SEO metadata', type: 'url', max: 2048 },
] as const

export type AIField = typeof aiFields[number]['key']
export type AIFieldSpec = typeof aiFields[number]
export type AIPatch = Partial<Record<AIField, JsonValue>>
export type AIContext = {
  type: 'blog'; topic: string; argument: string; concepts: string; technologies: string[]
  examples: string; references: string; structure: string; imageDescription: string
} | {
  type: 'project' | 'case_study' | 'service'; name: string; projectType: string; technologies: string[]; role: string
  problem: string; solution: string; features: string[]; challenges: string; outcomes: string
  architecture: string; year: string; imageDescription: string
}
export type AIRequest = {
  contentType: 'blog' | 'project' | 'case_study' | 'service'
  mode: 'create' | 'regenerate' | 'fill_missing'
  context: string; additionalInstructions: string
  tone: 'professional' | 'technical' | 'conversational' | 'storytelling' | 'educational' | 'case_study'
  audience: 'general_readers' | 'software_developers' | 'senior_engineers' | 'technical_recruiters' | 'business_owners' | 'potential_clients'
  length: 'short' | 'medium' | 'long' | 'in_depth'
  language: string; seoKeywords: string[]; targetFields: AIField[]
  existingFields: Record<string, JsonValue>
  contentContext: AIContext
}
export type AIResponse = {
  contentType: 'blog' | 'project' | 'case_study' | 'service'; generationId: string; generatedFields: AIPatch
  warnings: string[]; skippedFields: { field: AIField; reason: string }[]
  usage?: AIUsage | null
}
export type AICost = {
  currency: 'USD'; inputUsd: number; outputUsd: number; totalUsd: number
  inputUsdPerMillion: number; outputUsdPerMillion: number; cachedInputUsdPerMillion: number
}
export type AIUsage = {
  model: string; inputTokens: number; outputTokens: number; thinkingTokens: number
  cachedInputTokens: number; totalTokens: number; estimatedCost: AICost | null
}
export type AIProposal = { field: AIField; value: JsonValue; baseline: JsonValue }

export const fieldsFor = (kind: ContentKind) => aiFields.filter((field) => !('only' in field) || (Array.isArray(field.only) ? (field.only as readonly string[]).includes(kind) : field.only === kind))
export const kindFor = (contentType: AIRequest['contentType']): ContentKind => contentType === 'service' ? 'services' : contentType === 'blog' ? 'blogs' : contentType === 'case_study' ? 'case-studies' : 'projects'

export function fieldValue(document: ContentWrite, field: string): JsonValue {
  if (field.startsWith('fields.')) return document.fields[field.slice(7)] ?? null
  if (field.startsWith('seo.')) return (document.seo as JsonObject | undefined)?.[field.slice(4)] ?? null
  if (field === 'title' || field === 'slug' || field === 'description' || field === 'editorContent') return document[field] ?? null
  if (field === 'faqs') return document.faqs ?? []
  return null
}

export function emptyField(value: JsonValue | undefined): boolean {
  if (value == null || typeof value === 'string' && !value.trim()) return true
  if (Array.isArray(value)) return value.every(emptyField)
  if (typeof value === 'object' && value.type === 'doc') {
    const populated = (node: JsonValue): boolean => {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return false
      if (node.type === 'image' || typeof node.text === 'string' && !!node.text.trim()) return true
      return Array.isArray(node.content) && node.content.some(populated)
    }
    return !populated(value)
  }
  if (typeof value === 'object') return Object.values(value).every(emptyField)
  return false
}

export function existingAIFields(document: ContentWrite, kind: ContentKind): Record<string, JsonValue> {
  const fields: Record<string, JsonValue> = Object.fromEntries(fieldsFor(kind).map(({ key }) => [key, fieldValue(document, key)]))
  if (kind === 'services') {
    const hero = (document.fields.media as JsonObject[] ?? []).find(media => media.slot === 'hero')
    fields['fields.image'] = hero ? String(hero.kind === 'video' ? hero.poster : hero.url) || null : null
    return fields
  }
  for (const name of kind === 'blogs' ? ['fields.cover'] : kind === 'case-studies' ? ['fields.image'] : ['fields.image', 'fields.liveUrl', 'fields.githubUrl']) fields[name] = fieldValue(document, name)
  return fields
}

export function requestFields(kind: ContentKind, scope: 'all' | 'main' | 'seo' | 'selected', selected: AIField[], fillOnly: boolean, document: ContentWrite) {
  return fieldsFor(kind).filter((field) => scope === 'all' || scope === 'main' && (field.key === 'editorContent' || field.key === 'fields.pageContent') || scope === 'seo' && field.group === 'SEO metadata' || scope === 'selected' && selected.includes(field.key))
    .filter((field) => !fillOnly || emptyField(fieldValue(document, field.key))).map(({ key }) => key)
}
