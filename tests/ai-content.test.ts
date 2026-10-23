import { describe, expect, test } from 'bun:test'
import { applyProposals } from '../src/lib/ai-content/apply'
import { existingAIFields, requestFields, type AIRequest } from '../src/lib/ai-content/contracts'
import { validateAIRequest, validateAIResponse } from '../src/lib/ai-content/validation'
import type { ContentWrite, JsonObject } from '../src/server/portfolio-content'

const document: ContentWrite = {
  title: 'Manual title', slug: 'manual-title', description: '', status: 'published', publishedAt: '2024-06-01T00:00:00Z', version: 7,
  fields: { category: 'insights', cover: '/known.webp', coverAlt: 'Real cover', socialImage: '/known.webp', featured: true, liveUrl: 'https://example.com/real', githubUrl: 'https://github.com/owner/real' },
  editorContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Manual body' }] }, { type: 'image', attrs: { src: '/inline.webp', alt: 'Actual image', title: null } }] },
  seo: { noIndex: true, noFollow: true }, faqs: [{ question: 'Why Rust?', answer: 'An existing answer.' }],
}
const request: AIRequest = {
  contentType: 'blog', mode: 'regenerate', context: 'Explain my actual Rust and PostgreSQL service.', additionalInstructions: '',
  tone: 'technical', audience: 'software_developers', length: 'medium', language: 'English', seoKeywords: [],
  targetFields: ['title', 'description', 'editorContent'], existingFields: existingAIFields(document, 'blogs'),
  contentContext: { type: 'blog', topic: '', argument: '', concepts: '', technologies: [], examples: '', references: '', structure: '', imageDescription: '' },
}

describe('AI content contracts and non-destructive application', () => {
  test('validates context and exact target fields before a request', () => {
    expect(validateAIRequest(request)).toBe(request)
    expect(() => validateAIRequest({ ...request, context: '' })).toThrow()
    expect(() => validateAIRequest({ ...request, targetFields: ['status' as never] })).toThrow()
    expect(requestFields('blogs', 'all', [], true, document)).not.toContain('title')
    expect(requestFields('blogs', 'all', [], true, document)).toContain('description')
    expect(requestFields('blogs', 'seo', [], false, document).every((field) => field.startsWith('seo.'))).toBe(true)
  })
  test('applies only selected fields and preserves all protected values', () => {
    const result = applyProposals(document, document, [{ field: 'description', value: 'Generated summary', baseline: '' }, { field: 'title', value: 'Unselected title', baseline: 'Manual title' }], ['description'], false)
    expect(result.document.description).toBe('Generated summary')
    expect(result.document.title).toBe(document.title)
    for (const key of ['status', 'publishedAt', 'version', 'seo', 'fields', 'editorContent']) expect(result.document[key as keyof ContentWrite]).toEqual(document[key as keyof ContentWrite])
    expect(document.description).toBe('')
  })
  test('rejects stale fields and respects fill-empty-only at apply time', () => {
    const latest = { ...document, title: 'New manual edit', description: 'Written during generation' }
    const proposal = [{ field: 'title' as const, value: 'AI title', baseline: document.title }]
    const result = applyProposals(latest, latest, proposal, ['title'], false)
    expect(result.conflicts).toEqual(['title'])
    expect(result.document.title).toBe('New manual edit')
    const empty = applyProposals(latest, latest, [{ field: 'description', value: 'AI summary', baseline: '' }], ['description'], true)
    expect(empty.applied).toEqual([])
    expect(empty.document.description).toBe(latest.description)
  })
  test('preserves image nodes while replacing rich text and merges FAQs without duplicates', () => {
    const body: JsonObject = { type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Generated architecture' }] }] }
    const result = applyProposals(document, document, [
      { field: 'editorContent', value: body, baseline: document.editorContent! },
      { field: 'faqs', value: [{ question: 'Why Rust?', answer: 'Duplicate' }, { question: 'Why Redis?', answer: 'Caching.' }], baseline: document.faqs! },
    ], ['editorContent', 'faqs'], false)
    expect(JSON.stringify(result.document.editorContent)).toContain('/inline.webp')
    expect(JSON.stringify(result.document.editorContent)).toContain('Generated architecture')
    expect(result.document.faqs).toEqual([...document.faqs!, { question: 'Why Redis?', answer: 'Caching.' }])
  })
  test('frontend rejects unsafe, unexpected, and malformed generated content', () => {
    const response = { contentType: 'blog', generationId: 'b4729009-709d-4b5f-88ad-42cb1a6d03df', generatedFields: { title: 'Good title' }, warnings: [], skippedFields: [] }
    expect(validateAIResponse(response, request).generatedFields.title).toBe('Good title')
    for (const generatedFields of [
      { status: 'published' }, { 'fields.cover': 'https://invented.test/image.png' },
      { editorContent: { type: 'doc', content: [{ type: 'script' }] } },
      { editorContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] } },
      { editorContent: { type: 'doc', content: [{ type: 'image', attrs: { src: 'https://invented.test/image.webp' } }] } },
    ]) expect(() => validateAIResponse({ ...response, generatedFields }, request)).toThrow()
  })
  test('validates provider token accounting and cost estimates without requiring usage on old responses', () => {
    const response = { contentType: 'blog', generationId: 'b4729009-709d-4b5f-88ad-42cb1a6d03df', generatedFields: { title: 'Good title' }, warnings: [], skippedFields: [] }
    const usage = {
      model: 'gemini-3.5-flash-lite', inputTokens: 1000, outputTokens: 500, thinkingTokens: 100, cachedInputTokens: 200, totalTokens: 1500,
      estimatedCost: { currency: 'USD', inputUsd: 0.000246, outputUsd: 0.00125, totalUsd: 0.001496, inputUsdPerMillion: 0.3, outputUsdPerMillion: 2.5, cachedInputUsdPerMillion: 0.03 },
    }
    expect(validateAIResponse({ ...response, usage }, request).usage?.outputTokens).toBe(500)
    expect(validateAIResponse({ ...response, usage: { ...usage, estimatedCost: null } }, request).usage?.estimatedCost).toBeNull()
    expect(validateAIResponse({ ...response, usage: null }, request).usage).toBeNull()
    expect(validateAIResponse(response, request).usage).toBeUndefined()
    for (const invalid of [
      { ...usage, inputTokens: -1 }, { ...usage, outputTokens: 1.5 }, { ...usage, totalTokens: 1400 },
      { ...usage, thinkingTokens: 501 }, { ...usage, cachedInputTokens: 1001 },
      { ...usage, estimatedCost: { ...usage.estimatedCost, totalUsd: 1 } },
      { ...usage, estimatedCost: { ...usage.estimatedCost, outputUsdPerMillion: Infinity } },
      { ...usage, estimatedCost: { ...usage.estimatedCost, currency: 'BDT' } },
    ]) expect(() => validateAIResponse({ ...response, usage: invalid }, request)).toThrow()
  })
})
