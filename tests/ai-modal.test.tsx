import React, { useRef, useState } from 'react'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AIRequest, AIResponse } from '../src/lib/ai-content/contracts'
import type { ContentDetail, ContentWrite } from '../src/server/portfolio-content'
import { readFileSync } from 'node:fs'

const routerExports = { ...await import('@tanstack/react-router') }
const calls: AIRequest[] = []
let respond: (request: AIRequest) => Promise<AIResponse>
let role = 'owner'
const save = mock(async (document: ContentWrite) => ({ ...document, id: 'record-id', version: 2 }))
const uploadAsset = mock(async (file: File) => {
  if (file.name === 'bad.jpg') throw new Error('Storage unavailable')
  return `https://cdn.test/${file.name}`
})
mock.module('@/server/ai-content', () => ({ generateAIContentFn: async ({ data }: { data: AIRequest }) => { calls.push(data); return respond(data) } }))
mock.module('@/queries/content/content', () => ({ useCreateContent: () => ({ mutateAsync: save, isPending: false, error: null }), useUpdateContent: () => ({ mutateAsync: save, isPending: false, error: null }) }))
mock.module('@/queries/assets/upload', () => ({ uploadImage: uploadAsset, uploadServiceMedia: uploadAsset, useImageUpload: () => ({ mutateAsync: mock(), isPending: false, error: null }) }))
mock.module('@tanstack/react-router', () => ({ ...routerExports, Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => <a href={to} {...props}>{children}</a>, useNavigate: () => async () => {}, useRouteContext: () => ({ account: { roles: [role], permissions: ['blogs:write', 'projects:write', 'case-studies:write', 'blogs:publish', 'projects:publish', 'case-studies:publish', 'services:write', 'services:publish'] } }) }))
const { ContentEditor } = await import('../src/components/admin/content/ContentEditor')
const { AIContentGeneratorModal } = await import('../src/components/admin/ai-content-generator/AIContentGeneratorModal')
const { applyProposals } = await import('../src/lib/ai-content/apply')

const richBody = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Generated body ready for editing.' }] }] }
const response = (request: AIRequest, generatedFields: AIResponse['generatedFields']): AIResponse => ({ contentType: request.contentType, generationId: 'b4729009-709d-4b5f-88ad-42cb1a6d03df', generatedFields, warnings: ['Review before saving.'], skippedFields: [] })
const existing: ContentDetail = {
  id: 'record-id', slug: 'manual-article', title: 'Manual article', description: 'Manual summary', status: 'draft', publishedAt: null, updatedAt: '2026-10-16', createdAt: '2026-10-16', version: 1,
  fields: { category: 'insights', cover: '/known.webp', coverAlt: 'Real cover', socialImage: '/known.webp', tags: [], intro: [], sections: [], takeaways: [] },
  editorContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Manual body.' }] }] }, renderedHtml: '<p>Manual body.</p>', seo: { noIndex: true, noFollow: true }, faqs: [],
}
function wrapper(children: React.ReactNode) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{children}</QueryClientProvider> }
async function open() {
  fireEvent.click(screen.getByRole('button', { name: 'Generate with AI' }))
  await screen.findByRole('dialog')
  fireEvent.change(screen.getByLabelText('Context / description *'), { target: { value: 'Explain the Rust service I built with PostgreSQL and Redis.' } })
}
async function generate() { fireEvent.click(screen.getByRole('button', { name: 'Generate Content' })); await screen.findByText('Generated content preview') }
async function confirmAndApply() {
  const confirmation = screen.queryByLabelText(/I reviewed the proposals/)
  if (confirmation) fireEvent.click(confirmation)
  fireEvent.click(screen.getByRole('button', { name: /Apply Selected/ }))
}
beforeEach(() => { calls.length = 0; role = 'owner'; save.mockClear(); respond = async (request) => response(request, { title: 'Generated title', description: 'Generated summary' }) })
afterEach(() => cleanup())

describe('shared AI generator and real CMS form integration', () => {
  test('service AI edits structured sections and navbar copy and only saves after explicit Save', async () => {
    const seed = JSON.parse(readFileSync(new URL('./fixtures/services.json', import.meta.url), 'utf8'))[0] as ContentWrite
    const page = structuredClone(seed.fields.pageContent) as Record<string, import('../src/server/portfolio-content').JsonValue>
    page.faqTitle = 'AI-generated questions heading'
    respond = async request => response(request, { 'fields.pageContent': page, 'fields.navTitle': 'AI service navigation' })
    render(wrapper(<ContentEditor kind="services" existing={{ ...existing, ...seed, fields: { ...seed.fields, media: [{ slot: 'hero', kind: 'video', url: '/demo.mp4', alt: 'A portal demo', poster: '/poster.webp', caption: '' }] } }} />))
    expect((screen.getByLabelText('Navbar title') as HTMLInputElement).value).toBe(seed.fields.navTitle)
    await open()
    expect(screen.getByRole('heading', { name: 'Generate Service with AI' })).toBeTruthy()
    await generate()
    expect(calls[0].contentType).toBe('service')
    expect(calls[0].targetFields).toContain('fields.pageContent')
    expect(calls[0].targetFields).not.toContain('editorContent')
    expect(calls[0].existingFields['fields.enabled']).toBeUndefined()
    await confirmAndApply()
    expect((screen.getByLabelText('Navbar title') as HTMLInputElement).value).toBe('AI service navigation')
    expect(save).not.toHaveBeenCalled()
    fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!)
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    expect(save.mock.calls[0][0].fields.pageContent).toEqual(page)
    expect(save.mock.calls[0][0].fields.enabled).toBe(true)
    expect(save.mock.calls[0][0].fields.media).toEqual([{ slot: 'hero', kind: 'video', url: '/demo.mp4', alt: 'A portal demo', poster: '/poster.webp', caption: '' }])
  })

  test('prefills the selected case study, edits narrative/photos/FAQs/JSON-LD and keeps publication and untouched values', async () => {
    const fields = { industry: 'technology-saas', studyType: 'concept', image: '/cover.webp', imageAlt: 'Existing cover', gallery: [{ url: '/gallery.webp', alt: 'Existing gallery', caption: 'Original caption' }], context: 'Existing context', problem: 'Existing problem', solution: 'Existing solution', steps: [{ title: 'Research', text: 'Existing approach' }], outcomes: [{ title: 'Outcome', text: 'Existing evidence' }], technologies: ['Rust'], lessons: ['Keep states explicit'], projectSlug: '' }
    const seo = { metaTitle: 'Existing case study SEO', structuredData: { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Existing app' } }
    render(wrapper(<ContentEditor kind="case-studies" existing={{ ...existing, status: 'published', fields, seo, faqs: [{ question: 'Existing question?', answer: 'Existing answer.' }] }} />))
    expect((screen.getByLabelText('Context') as HTMLTextAreaElement).value).toBe('Existing context')
    expect((screen.getByLabelText('Industry') as HTMLSelectElement).value).toBe('technology-saas')
    expect((screen.getByLabelText('Study type') as HTMLSelectElement).value).toBe('concept')
    expect((screen.getByLabelText('steps 1 title') as HTMLInputElement).value).toBe('Research')
    expect((screen.getByLabelText('Meta title') as HTMLInputElement).value).toBe(seo.metaTitle)
    expect((screen.getByLabelText('JSON-LD') as HTMLTextAreaElement).value).toContain('Existing app')
    expect(screen.queryByLabelText('Year')).toBeNull()
    fireEvent.change(screen.getByLabelText('Context'), { target: { value: 'Updated context' } })
    fireEvent.change(screen.getByLabelText('Technologies (one per line)'), { target: { value: 'Rust\nTypeScript\n' } })
    expect((screen.getByLabelText('Technologies (one per line)') as HTMLTextAreaElement).value).toBe('Rust\nTypeScript\n')
    fireEvent.change(screen.getByLabelText('Case study image'), { target: { value: '/uploads/new-cover.webp' } })
    fireEvent.change(screen.getByLabelText('Answer 1'), { target: { value: 'Updated FAQ answer.' } })
    fireEvent.change(screen.getByLabelText('JSON-LD'), { target: { value: JSON.stringify({ ...seo.structuredData, name: 'Updated app' }) } })
    fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!)
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    const saved = save.mock.calls[0][0]
    expect(saved.fields.context).toBe('Updated context')
    expect(saved.fields.technologies).toEqual(['Rust', 'TypeScript'])
    expect(saved.fields.image).toBe('/uploads/new-cover.webp')
    expect(saved.fields.gallery).toEqual(fields.gallery)
    expect(saved.fields.steps).toEqual(fields.steps)
    expect(saved.faqs?.[0].answer).toBe('Updated FAQ answer.')
    expect(saved.seo?.structuredData?.name).toBe('Updated app')
    expect(saved.status).toBe('published')
    expect(saved.version).toBe(1)
  })

  test('case study AI targets its own fields and applies suggestions without saving or replacing photos', async () => {
    respond = async request => response(request, { 'fields.context': 'AI context for review.', 'fields.lessons': ['Review state transitions.'], faqs: [{ question: 'How is it reviewed?', answer: 'With explicit workflow tests.' }] })
    render(wrapper(<ContentEditor kind="case-studies" existing={{ ...existing, fields: { industry: 'technology-saas', studyType: 'concept', image: '/known.webp', imageAlt: 'Known cover', gallery: [], context: '', problem: 'Booking problem', solution: 'Rust service', steps: [], technologies: ['Rust'], outcomes: [], lessons: [], projectSlug: '' } }} />))
    await open()
    expect(screen.getByRole('heading', { name: 'Generate Case study with AI' })).toBeTruthy()
    await generate()
    expect(calls[0].contentType).toBe('case_study')
    expect(calls[0].contentContext.type).toBe('case_study')
    expect(calls[0].targetFields).toContain('fields.context')
    expect(calls[0].targetFields).not.toContain('fields.year')
    expect(calls[0].existingFields['fields.image']).toBe('/known.webp')
    await confirmAndApply()
    expect((screen.getByLabelText('Context') as HTMLTextAreaElement).value).toBe('AI context for review.')
    expect((screen.getByLabelText('Case study image') as HTMLInputElement).value).toBe('/known.webp')
    expect(save).not.toHaveBeenCalled()
  })

  test('invalid JSON-LD prevents saving a case study', async () => {
    render(wrapper(<ContentEditor kind="case-studies" />))
    fireEvent.change(screen.getByLabelText('JSON-LD'), { target: { value: '{broken' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!)
    await screen.findByText(/JSON-LD must be a valid JSON object/)
    expect(save).not.toHaveBeenCalled()
  })

  test('uploads multiple project images, edits alt text and captions, reorders and saves gallery without replacing the cover', async () => {
    uploadAsset.mockClear()
    render(wrapper(<ContentEditor kind="projects" existing={{ ...existing, fields: { image: '/cover.webp', imageAlt: 'Cover', category: 'SaaS', year: '2026', gallery: [] } }} />))
    const files = ['first.jpg', 'bad.jpg', 'last.jpg'].map((name) => new File(['image'], name, { type: 'image/jpeg' }))
    fireEvent.change(screen.getByLabelText('Upload project gallery images'), { target: { files } })
    await screen.findByText(/bad.jpg: Storage unavailable/)
    expect(uploadAsset).toHaveBeenCalledTimes(3)
    expect(save).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Gallery image 1 alt text *'), { target: { value: 'Search results' } })
    fireEvent.change(screen.getByLabelText('Gallery image 1 caption'), { target: { value: 'Search flow' } })
    fireEvent.change(screen.getByLabelText('Gallery image 2 alt text *'), { target: { value: 'Checkout page' } })
    fireEvent.click(screen.getByRole('button', { name: 'Move gallery image 2 up' }))
    expect((screen.getByLabelText('Gallery image 1 alt text *') as HTMLInputElement).value).toBe('Checkout page')
    fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!)
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    expect(save.mock.calls[0][0].fields.image).toBe('/cover.webp')
    expect(save.mock.calls[0][0].fields.gallery).toEqual([{ url: 'https://cdn.test/last.jpg', alt: 'Checkout page', caption: '' }, { url: 'https://cdn.test/first.jpg', alt: 'Search results', caption: 'Search flow' }])
    fireEvent.click(screen.getByRole('button', { name: 'Remove gallery image 1' }))
    expect((screen.getByLabelText('Gallery image 1 alt text *') as HTMLInputElement).value).toBe('Search results')
    expect(save).toHaveBeenCalledTimes(1)
  })
  test('prevents oversized gallery selections and saving during pending uploads', async () => {
    uploadAsset.mockClear()
    render(wrapper(<ContentEditor kind="projects" />))
    const input = screen.getByLabelText('Upload project gallery images')
    fireEvent.change(input, { target: { files: Array.from({ length: 21 }, (_, index) => new File(['image'], `${index}.jpg`, { type: 'image/jpeg' })) } })
    await screen.findByText(/The gallery supports 20 images/)
    expect(uploadAsset).not.toHaveBeenCalled()
    let finish: (url: string) => void = () => {}
    uploadAsset.mockImplementationOnce(() => new Promise<string>((resolve) => { finish = resolve }))
    fireEvent.change(input, { target: { files: [new File(['image'], 'one.jpg', { type: 'image/jpeg' })] } })
    const saveButton = await screen.findByRole('button', { name: 'Uploading images…' })
    expect((saveButton as HTMLButtonElement).disabled).toBe(true)
    fireEvent.submit(saveButton.closest('form')!)
    expect(save).not.toHaveBeenCalled()
    await act(async () => { finish('https://cdn.test/one.jpg') })
    await screen.findByLabelText('Gallery image 1 alt text *')
    await waitFor(() => expect((screen.getByRole('button', { name: 'Save changes' }) as HTMLButtonElement).disabled).toBe(false))
  })
  test('shows actual tokens and cost, accumulates regeneration, and resets usage when closed', async () => {
    respond = async (request) => ({ ...response(request, request.targetFields.includes('description') ? { title: 'Generated title', description: 'Generated summary' } : { title: 'Generated title' }), usage: {
      model: 'gemini-3.5-flash-lite', inputTokens: 1000, outputTokens: 500, thinkingTokens: 100, cachedInputTokens: 200, totalTokens: 1500,
      estimatedCost: { currency: 'USD', inputUsd: 0.000246, outputUsd: 0.00125, totalUsd: 0.001496, inputUsdPerMillion: 0.3, outputUsdPerMillion: 2.5, cachedInputUsdPerMillion: 0.03 },
    } })
    render(wrapper(<ContentEditor kind="blogs" />))
    await open(); await generate()
    const usage = screen.getByRole('region', { name: 'AI generation usage' })
    expect(usage.textContent).toContain('1,000')
    expect(usage.textContent).toContain('500')
    expect(usage.textContent).toContain('100 thinking (included)')
    expect(usage.textContent).toContain('200 cached (included)')
    expect(usage.textContent).toContain('$0.001496')
    expect(save).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate Title' }))
    await waitFor(() => expect(usage.textContent).toContain('2 successful generations'))
    expect(usage.textContent).toContain('3,000 reported tokens')
    expect(usage.textContent).toContain('$0.002992 estimated')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await open()
    expect(screen.queryByRole('region', { name: 'AI generation usage' })).toBeNull()
  })
  test('does not show missing usage or unknown prices as zero dollars', async () => {
    render(wrapper(<ContentEditor kind="projects" />))
    await open(); await generate()
    expect(screen.getByRole('region', { name: 'AI generation usage' }).textContent).toContain('Token usage is unavailable')
    respond = async (request) => ({ ...response(request, { title: 'Generated title' }), usage: { model: 'another-model', inputTokens: 20, outputTokens: 10, thinkingTokens: 0, cachedInputTokens: 0, totalTokens: 30, estimatedCost: null } })
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate Title' }))
    await waitFor(() => expect(screen.getByRole('region', { name: 'AI generation usage' }).textContent).toContain('another-model'))
    expect(screen.getByRole('region', { name: 'AI generation usage' }).textContent).toContain('Unavailable')
    expect(screen.getByRole('region', { name: 'AI generation usage' }).textContent).not.toContain('$0.000000')
  })
  test('opens both editor modes, validates context, and cancels without modifying the form', async () => {
    const view = render(wrapper(<ContentEditor kind="blogs" existing={existing} />))
    fireEvent.click(screen.getByRole('button', { name: 'Generate with AI' }))
    expect(screen.getByRole('button', { name: 'Generate Content' }).disabled).toBe(true)
    expect(screen.getByRole('heading', { name: 'Generate Blog with AI' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Manual article')
    expect(save).not.toHaveBeenCalled()
    view.unmount()
    render(wrapper(<ContentEditor kind="projects" />))
    await open()
    expect(screen.getByRole('heading', { name: 'Generate Project with AI' })).toBeTruthy()
  })
  test('previews selected fields, preserves manual fields, and saves only through Save Changes', async () => {
    render(wrapper(<ContentEditor kind="blogs" existing={existing} />))
    await open(); await generate()
    expect(save).not.toHaveBeenCalled()
    fireEvent.click(within(screen.getByRole('dialog')).getByLabelText('Title'))
    await confirmAndApply()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Manual article')
    expect((screen.getByLabelText('Summary') as HTMLTextAreaElement).value).toBe('Generated summary')
    expect(screen.getByRole('status').textContent).toContain('Review your changes before saving')
    expect(save).not.toHaveBeenCalled()
    fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!)
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    expect(save.mock.calls[0][0].description).toBe('Generated summary')
    expect(save.mock.calls[0][0].seo).toEqual(existing.seo)
    expect(save.mock.calls[0][0].fields.cover).toBe('/known.webp')
  })
  test('updates the actual Tiptap editor and allows subsequent manual editing', async () => {
    respond = async (request) => response(request, { editorContent: richBody })
    render(wrapper(<ContentEditor kind="blogs" />))
    await open(); await generate(); await confirmAndApply()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    const editor = document.querySelector('.tiptap[contenteditable="true"]')!
    await waitFor(() => expect(editor.textContent).toContain('Generated body ready for editing.'))
    await act(async () => { editor.querySelector('p')!.textContent = 'Manually refined after AI.'; fireEvent.input(editor); await new Promise((resolve) => setTimeout(resolve, 30)) })
    expect(editor.textContent).toContain('Manually refined after AI.')
    await open(); await generate()
    expect(JSON.stringify(calls.at(-1)?.existingFields.editorContent)).toContain('Manually refined after AI.')
    expect(save).not.toHaveBeenCalled()
  })
  test('supports settings, missing-only scope, project arrays, FAQs, and SEO mapping', async () => {
    respond = async (request) => response(request, { 'fields.technologies': ['Rust', 'PostgreSQL'], 'fields.features': ['Typed API'], faqs: [{ question: 'What was built?', answer: 'A typed API.' }], 'seo.metaTitle': 'Rust booking API' })
    render(wrapper(<ContentEditor kind="projects" />))
    await open()
    fireEvent.change(screen.getByLabelText('Writing tone'), { target: { value: 'technical' } })
    fireEvent.change(screen.getByLabelText('Target audience'), { target: { value: 'technical_recruiters' } })
    fireEvent.change(screen.getByLabelText('Content depth'), { target: { value: 'in_depth' } })
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'বাংলা' } })
    fireEvent.click(screen.getByLabelText('Fill empty fields only'))
    await generate(); await confirmAndApply()
    expect(calls[0].mode).toBe('fill_missing')
    expect(calls[0].language).toBe('বাংলা')
    expect(calls[0].audience).toBe('technical_recruiters')
    expect(calls[0].targetFields).not.toContain('fields.year')
    expect((screen.getByLabelText('Technologies (one per line)') as HTMLTextAreaElement).value).toBe('Rust\nPostgreSQL')
    expect((screen.getByLabelText('Features (one per line)') as HTMLTextAreaElement).value).toBe('Typed API')
    expect((screen.getByLabelText('Meta title') as HTMLInputElement).value).toBe('Rust booking API')
    expect((screen.getByLabelText('Question 1') as HTMLInputElement).value).toBe('What was built?')
  })
  test('individual-field regeneration keeps unrelated proposals', async () => {
    let count = 0
    respond = async (request) => response(request, ++count === 1 ? { title: 'First title', description: 'Keep this summary' } : { title: 'Revised title' })
    render(wrapper(<ContentEditor kind="blogs" />))
    await open(); await generate()
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate Title', exact: true }))
    await screen.findByText('Revised title')
    expect(screen.getByText('Keep this summary')).toBeTruthy()
    expect(calls[1].targetFields).toEqual(['title'])
    await confirmAndApply()
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Revised title')
    expect((screen.getByLabelText('Summary') as HTMLInputElement).value).toBe('Keep this summary')
  })
  test('loading prevents duplicates and errors preserve context for retry', async () => {
    let reject!: (error: Error) => void
    respond = () => new Promise((_, failure) => { reject = failure })
    render(wrapper(<ContentEditor kind="blogs" />))
    await open()
    fireEvent.click(screen.getByRole('button', { name: 'Generate Content' }))
    await screen.findByText(/Waiting for the AI response/)
    expect(screen.getByRole('button', { name: 'Generating...' }).disabled).toBe(true)
    await act(async () => reject(new Error('AI generation quota exceeded. Please try again later')))
    expect((await screen.findByRole('alert')).textContent).toContain('quota exceeded')
    expect((screen.getByLabelText('Context / description *') as HTMLTextAreaElement).value).toContain('Rust service')
    expect(save).not.toHaveBeenCalled()
  })
  test('cancels obsolete requests without applying results', async () => {
    let resolve!: (value: AIResponse) => void
    respond = () => new Promise((success) => { resolve = success })
    render(wrapper(<ContentEditor kind="blogs" existing={existing} />))
    await open(); fireEvent.click(screen.getByRole('button', { name: 'Generate Content' }))
    await screen.findByText(/Waiting for the AI response/)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel generation' }))
    await act(async () => resolve(response(calls[0], { title: 'Obsolete result' })))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Manual article')
    expect(save).not.toHaveBeenCalled()
  })
  test('detects newer field values before apply and hides the action for non-admins', async () => {
    let latest: ContentWrite = structuredClone(existing)
    function Harness() {
      const [, refresh] = useState(0)
      const state = useRef(latest)
      state.current = latest
      return <AIContentGeneratorModal kind="blogs" isEditing getSnapshot={() => state.current} onApply={(proposals, selected, fillOnly) => { const result = applyProposals(state.current, state.current, proposals, selected, fillOnly); latest = result.document; refresh((value) => value + 1); return result }} />
    }
    const view = render(wrapper(<Harness />))
    await open(); await generate()
    latest = { ...latest, title: 'Newer manual title' }
    view.rerender(wrapper(<Harness />))
    await confirmAndApply()
    expect((await screen.findByRole('alert')).textContent).toContain('changed since generation')
    expect(latest.title).toBe('Newer manual title')
    view.unmount(); role = 'editor'
    render(wrapper(<ContentEditor kind="blogs" existing={existing} />))
    expect(screen.queryByRole('button', { name: 'Generate with AI' })).toBeNull()
  })
})
