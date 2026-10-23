import { getSchema } from '@tiptap/react'
import { contentEditorExtensions } from '@/components/admin/content/editorExtensions'
import type { JsonObject, JsonValue } from '@/server/portfolio-content'
import { fieldsFor, kindFor, type AIField, type AIRequest, type AIResponse } from './contracts'
import { assertServicePageContent } from '@/lib/services/services'

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown, maximum: number): value is string => typeof value === 'string' && !!value.trim() && value.length <= maximum && !value.includes('\0')
const schema = getSchema(contentEditorExtensions())

export function safeUrl(value: unknown): value is string {
  if (!text(value, 2048) || /[\u0000-\u0020\\]/.test(value)) return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password } catch { return false }
}

export function assertGeneratedDocument(value: unknown): asserts value is JsonObject {
  if (!object(value) || value.type !== 'doc' || JSON.stringify(value).length > 200_000) throw new Error('Generated rich content is invalid.')
  let count = 0
  const types = ['doc', 'paragraph', 'heading', 'text', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'codeBlock', 'table', 'tableRow', 'tableCell', 'tableHeader', 'hardBreak', 'horizontalRule']
  function validate(node: unknown, depth: number) {
    count++
    if (!object(node) || typeof node.type !== 'string' || !types.includes(node.type) || depth > 20 || count > 5000) throw new Error('Generated rich content contains unsupported nodes.')
    if (node.type === 'heading' && (!object(node.attrs) || ![2, 3].includes(Number(node.attrs.level)))) throw new Error('Generated heading level is invalid.')
    if (node.text !== undefined && !text(node.text, 20_000)) throw new Error('Generated text is invalid.')
    if (node.marks !== undefined) {
      if (!Array.isArray(node.marks) || node.marks.some((mark) => !object(mark) || !['bold', 'italic', 'code'].includes(String(mark.type)))) throw new Error('Generated formatting is unsupported.')
    }
    if (node.content !== undefined) {
      if (!Array.isArray(node.content)) throw new Error('Generated node content is invalid.')
      node.content.forEach((child) => validate(child, depth + 1))
    }
  }
  validate(value, 0)
  try { schema.nodeFromJSON(value).check() } catch { throw new Error('Generated content does not match the editor schema.') }
}

export function validateAIRequest(input: AIRequest): AIRequest {
  if (!input || !['blog', 'project', 'case_study', 'service'].includes(input.contentType) || input.contentContext?.type !== input.contentType) throw new Error('Choose a supported content type.')
  if (!text(input.context, 20_000) || input.context.trim().length < 20) throw new Error('Add at least 20 characters of factual context.')
  if (!text(input.language, 80)) throw new Error('Enter an output language.')
  if (typeof input.additionalInstructions !== 'string' || input.additionalInstructions.length > 4000) throw new Error('Additional instructions must be 4,000 characters or fewer.')
  if (!['create', 'regenerate', 'fill_missing'].includes(input.mode) || !['professional', 'technical', 'conversational', 'storytelling', 'educational', 'case_study'].includes(input.tone) || !['general_readers', 'software_developers', 'senior_engineers', 'technical_recruiters', 'business_owners', 'potential_clients'].includes(input.audience) || !['short', 'medium', 'long', 'in_depth'].includes(input.length)) throw new Error('Generation options are invalid.')
  const allowed = fieldsFor(kindFor(input.contentType)).map(({ key }) => key)
  if (!Array.isArray(input.targetFields) || !input.targetFields.length || input.targetFields.some((field) => !allowed.includes(field)) || new Set(input.targetFields).size !== input.targetFields.length) throw new Error('Select supported fields to generate.')
  if (!Array.isArray(input.seoKeywords) || input.seoKeywords.length > 20 || input.seoKeywords.some((keyword) => !text(keyword, 100))) throw new Error('Use up to 20 concise SEO keywords.')
  if (!object(input.existingFields) || JSON.stringify(input).length > 256_000) throw new Error('The context is too large for one generation request.')
  return input
}

export function validateAIResponse(value: unknown, request: AIRequest): AIResponse {
  const invalid = () => { throw new Error('The AI response has an invalid structure. Retry generation.') }
  if (!object(value) || Object.keys(value).some((key) => !['contentType', 'generationId', 'generatedFields', 'warnings', 'skippedFields', 'usage'].includes(key))) return invalid()
  if (value.usage != null) {
    const usage = value.usage
    const counts = ['inputTokens', 'outputTokens', 'thinkingTokens', 'cachedInputTokens', 'totalTokens'] as const
    if (!object(usage) || !text(usage.model, 100) || Object.keys(usage).some((key) => !['model', ...counts, 'estimatedCost'].includes(key)) || counts.some((key) => typeof usage[key] !== 'number' || !Number.isSafeInteger(usage[key]) || (usage[key] as number) < 0 || (usage[key] as number) > 4_294_967_295)) return invalid()
    if (Number(usage.thinkingTokens) > Number(usage.outputTokens) || Number(usage.cachedInputTokens) > Number(usage.inputTokens) || Number(usage.totalTokens) < Number(usage.inputTokens) + Number(usage.outputTokens)) return invalid()
    if (usage.estimatedCost !== null) {
      const cost = usage.estimatedCost
      const amounts = ['inputUsd', 'outputUsd', 'totalUsd', 'inputUsdPerMillion', 'outputUsdPerMillion', 'cachedInputUsdPerMillion'] as const
      if (!object(cost) || cost.currency !== 'USD' || Object.keys(cost).some((key) => !['currency', ...amounts].includes(key)) || amounts.some((key) => typeof cost[key] !== 'number' || !Number.isFinite(cost[key]) || Number(cost[key]) < 0)) return invalid()
      const expectedInput = ((Number(usage.inputTokens) - Number(usage.cachedInputTokens)) * Number(cost.inputUsdPerMillion) + Number(usage.cachedInputTokens) * Number(cost.cachedInputUsdPerMillion)) / 1_000_000
      const expectedOutput = Number(usage.outputTokens) * Number(cost.outputUsdPerMillion) / 1_000_000
      if (Number(usage.totalTokens) !== Number(usage.inputTokens) + Number(usage.outputTokens) || Math.abs(Number(cost.inputUsd) - expectedInput) > 1e-9 || Math.abs(Number(cost.outputUsd) - expectedOutput) > 1e-9 || Math.abs(Number(cost.totalUsd) - expectedInput - expectedOutput) > 1e-9) return invalid()
    }
  }
  if (value.contentType !== request.contentType || !text(value.generationId, 36) || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value.generationId)) return invalid()
  if (!object(value.generatedFields) || !Array.isArray(value.warnings) || value.warnings.length > 11 || value.warnings.some((warning) => !text(warning, 500)) || !Array.isArray(value.skippedFields)) return invalid()
  for (const skipped of value.skippedFields) if (!object(skipped) || !request.targetFields.includes(skipped.field as AIField) || !text(skipped.reason, 500)) return invalid()
  const fields = fieldsFor(kindFor(request.contentType))
  for (const [key, generated] of Object.entries(value.generatedFields)) {
    const field = fields.find((entry) => entry.key === key)
    if (!field || !request.targetFields.includes(field.key)) return invalid()
    if (field.type === 'service') assertServicePageContent(generated)
    else if (field.type === 'document') assertGeneratedDocument(generated)
    else if (field.type === 'list') {
      if (!Array.isArray(generated) || generated.length > field.max || generated.some((item) => !text(item, 500))) return invalid()
    } else if (field.type === 'faqs') {
      if (!Array.isArray(generated) || generated.length > field.max || generated.some((faq) => !object(faq) || Object.keys(faq).some((name) => !['question', 'answer'].includes(name)) || !text(faq.question, 300) || !text(faq.answer, 5000))) return invalid()
    } else if (field.type === 'url') {
      if (!safeUrl(generated)) return invalid()
      if (request.existingFields[key]) return invalid()
      if (field.key !== 'seo.canonicalUrl') {
        const known = ['fields.cover', 'fields.image', 'fields.socialImage'].map((name) => request.existingFields[name]).filter(safeUrl)
        const matches = known.some((url) => url === generated || url.startsWith('/') && typeof generated === 'string' && new URL(generated).pathname === url)
        if (!matches) return invalid()
      }
    } else if (!text(generated, field.max)) return invalid()
    if (field.key === 'slug' && (typeof generated !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(generated))) return invalid()
    if (field.key === 'fields.year' && generated !== (request.contentContext.type === 'project' ? request.contentContext.year : '')) return invalid()
    if (field.key === 'fields.category' && request.contentType === 'blog' && !['insights', 'growth', 'ai', 'news'].includes(String(generated))) return invalid()
  }
  return value as unknown as AIResponse
}

export function readableValue(value: JsonValue | undefined): string {
  if (value == null) return 'Empty'
  if (typeof value === 'string') return value || 'Empty'
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? item : object(item) && 'question' in item ? `${item.question}\n${item.answer}` : readableValue(item)).join('\n') || 'Empty'
  if (object(value) && value.type === 'doc') {
    function content(node: unknown): string {
      if (!object(node)) return ''
      if (typeof node.text === 'string') return node.text
      return Array.isArray(node.content) ? node.content.map(content).join(['doc', 'bulletList', 'orderedList', 'table', 'tableRow'].includes(String(node.type)) ? '\n' : '') : ''
    }
    return content(value) || 'Empty'
  }
  return Object.entries(value).map(([key, value]) => `${key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, letter => letter.toUpperCase())}:\n${readableValue(value as JsonValue)}`).join('\n\n')
}
