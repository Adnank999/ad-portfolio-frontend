import { useCallback, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useRouteContext } from '@tanstack/react-router'
import { ArrowLeft, ExternalLink, Plus, Save, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import { Textarea } from '@/components/admin/ui/textarea'
import { useImageUpload } from '@/queries/assets/upload'
import { AdminImageUploads, useAdminImageUploads } from '@/queries/assets/ImageUploadContext'
import { ImageUploadStatus } from './ImageUploadStatus'
import { useCreateContent, useUpdateContent } from '@/queries/content/content'
import type { ContentDetail, ContentKind, ContentStatus, ContentWrite, JsonValue, SeoFields } from '@/server/portfolio-content'
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor'
import { AIContentGeneratorModal } from '@/components/admin/ai-content-generator/AIContentGeneratorModal'
import { applyProposals } from '@/lib/ai-content/apply'
import type { AIField, AIProposal } from '@/lib/ai-content/contracts'
import { readProjectGallery } from '@/lib/project-gallery'
import { ProjectGalleryField } from './ProjectGalleryField'
import { CaseStudyFields } from '@/components/admin/case-study-fields/CaseStudyFields'
import { ServiceFields } from '@/components/admin/service-fields/ServiceFields'
import { assertServicePageContent, emptyServiceFields } from '@/lib/services/services'
import { assertServiceVisuals } from '@/components/shaders/validation'
import { backendHasShader } from '@/components/shaders/registry'
import { shaderCatalogOptions } from '@/queries/services/shaders'
import { useQueryClient } from '@tanstack/react-query'

function defaults(kind: ContentKind): ContentWrite {
  return {
    slug: '', title: '', description: '', status: 'draft', publishedAt: null,
    fields: kind === 'services' ? emptyServiceFields() : kind === 'blogs' ? {
      category: 'insights', cover: '', coverAlt: '', socialImage: '', intro: [], takeaways: [], sections: [], tags: [],
    } : kind === 'case-studies' ? {
      industry: 'technology-saas', studyType: 'portfolio', image: '', imageAlt: '', gallery: [],
      context: '', problem: '', solution: '', steps: [], technologies: [], outcomes: [], lessons: [], projectSlug: '',
    } : {
      image: '', imageAlt: '', category: '', year: String(new Date().getFullYear()),
      technologies: [], githubUrl: '', liveUrl: '', featured: false, overview: '', problem: '',
      solution: '', features: [], technical: '', challenges: '', results: '', gallery: [],
    },
    editorContent: null, seo: {}, faqs: [],
  }
}

const lines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean)
const text = (value: unknown) => typeof value === 'string' ? value : ''
const list = (value: unknown) => Array.isArray(value) ? value.map(String).join('\n') : ''

export function ContentEditor({ kind, existing }: { kind: ContentKind; existing?: ContentDetail }) {
  return <AdminImageUploads key={`${kind}:${existing?.id ?? 'new'}`} kind={kind} initialAssetIds={existing?.assetIds}><ContentEditorForm kind={kind} existing={existing} /></AdminImageUploads>
}

function ContentEditorForm({ kind, existing }: { kind: ContentKind; existing?: ContentDetail }) {
  const queryClient = useQueryClient()
  const imageUploads = useAdminImageUploads()
  const navigate = useNavigate()
  const { account } = useRouteContext({ from: '/admin' })
  const [document, setDocument] = useState<ContentWrite>(() => existing ? {
    slug: existing.slug, title: existing.title, description: existing.description, status: existing.status,
    publishedAt: existing.publishedAt, fields: existing.fields, editorContent: existing.editorContent,
    seo: existing.seo ?? {}, faqs: existing.faqs ?? [], version: existing.version,
  } : defaults(kind))
  const editorRef = useRef<RichTextEditorHandle>(null)
  const documentRef = useRef(document)
  documentRef.current = document
  const getSnapshot = useCallback(() => ({
    ...documentRef.current,
    editorContent: editorRef.current?.getDocument() ?? documentRef.current.editorContent ?? null,
  }), [])
  const [saved, setSaved] = useState('')
  const [structuredDataText, setStructuredDataText] = useState(() => existing?.seo?.structuredData ? JSON.stringify(existing.seo.structuredData, null, 2) : '')
  const [validationError, setValidationError] = useState('')
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [primaryUploading, setPrimaryUploading] = useState(false)
  const [validatingShader, setValidatingShader] = useState(false)
  const create = useCreateContent(kind)
  const update = useUpdateContent(kind, existing?.id ?? '')
  const saving = create.isPending || update.isPending || validatingShader
  const busy = saving || validatingShader || galleryUploading || primaryUploading || !!imageUploads?.busy
  const error = create.error ?? update.error
  const canWrite = account.permissions.includes(`${kind}:write`)
  const canPublish = account.permissions.includes(`${kind}:publish`)
  const canSave = canWrite && (existing?.status !== 'published' || canPublish)
  const canGenerate = canSave && account.roles.some((role) => role === 'owner' || role === 'admin')
  const initialHtml = !existing?.editorContent && existing?.renderedHtml
    ? existing.renderedHtml.split('<section><h2>Frequently asked questions</h2>')[0]
    : undefined

  function field(name: string, value: JsonValue) {
    setDocument((current) => ({ ...current, fields: { ...current.fields, [name]: value } }))
  }
  function seo(name: keyof SeoFields, value: string | boolean) {
    setDocument((current) => ({ ...current, seo: { ...current.seo, [name]: value } }))
  }
  function applyAI(proposals: AIProposal[], selected: AIField[], fillOnly: boolean) {
    if (!canGenerate || busy) return { applied: [] as AIField[], conflicts: selected }
    const result = applyProposals(documentRef.current, getSnapshot(), proposals, selected, fillOnly)
    if (result.applied.length) {
      documentRef.current = result.document
      setDocument(result.document)
      setSaved('AI-generated content applied. Review your changes before saving.')
    }
    return result
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !canSave) return
    setSaved('')
    setValidationError('')
    try {
      if (kind === 'services') {
        assertServicePageContent(document.fields.pageContent)
        assertServiceVisuals(document.fields.visuals)
        const shaders = Object.values(document.fields.visuals ?? {}).filter(visual => visual.type === 'shader')
        if (shaders.length) {
          setValidatingShader(true)
          const catalog = await queryClient.fetchQuery(shaderCatalogOptions())
          if (shaders.some(visual => !backendHasShader(catalog, visual.shader))) throw new Error('Deploy matching frontend/backend shader manifests before saving this service.')
        }
      }
      let structuredData = null
      if (structuredDataText.trim()) {
        try {
          structuredData = JSON.parse(structuredDataText)
          if (!structuredData || typeof structuredData !== 'object' || Array.isArray(structuredData)) throw new Error()
        } catch { setValidationError('JSON-LD must be a valid JSON object. Your changes have not been saved.'); return }
      }
      const seoData = { ...document.seo }
      if (structuredDataText.trim() || document.seo?.structuredData != null) seoData.structuredData = structuredData
      const input = { ...document, assetIds: imageUploads?.getAssetIds() ?? document.assetIds ?? [], seo: seoData, fields: kind === 'case-studies' ? { ...document.fields,
        technologies: Array.isArray(document.fields.technologies) ? document.fields.technologies.map(String).map(value => value.trim()).filter(Boolean) : [],
        lessons: Array.isArray(document.fields.lessons) ? document.fields.lessons.map(String).map(value => value.trim()).filter(Boolean) : [],
      } : document.fields }
      const result = existing ? await update.mutateAsync(input) : await create.mutateAsync(input)
      if (existing) {
        setDocument((current) => ({ ...current, version: result.version, publishedAt: result.publishedAt }))
        setSaved('Changes saved.')
      } else if (kind === 'blogs') {
        await navigate({ to: '/admin/blogs/$id', params: { id: result.id } })
      } else if (kind === 'case-studies') {
        await navigate({ to: '/admin/case-studies/$id', params: { id: result.id } })
      } else if (kind === 'services') {
        await navigate({ to: '/admin/services/$id', params: { id: result.id } })
      } else {
        await navigate({ to: '/admin/projects/$id', params: { id: result.id } })
      }
    } catch (error) { if (error instanceof Error) setValidationError(error.message) }
    finally { setValidatingShader(false) }
  }
  const primaryImage = kind === 'blogs' ? 'cover' : 'image'
  const altField = kind === 'blogs' ? 'coverAlt' : 'imageAlt'
  const linkToPublic = kind === 'blogs' ? `/blog/${document.slug}` : `/${kind}/${document.slug}`
  const contentLabel = kind === 'services' ? 'service' : kind === 'blogs' ? 'article' : kind === 'case-studies' ? 'case study' : 'project'
  const libraryPath = kind === 'services' ? '/admin/services' : kind === 'blogs' ? '/admin/blogs' : kind === 'case-studies' ? '/admin/case-studies' : '/admin/projects'
  return <form onSubmit={(event) => void submit(event)} className="space-y-6 pb-20">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><Link to={libraryPath} className="mb-5 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white"><ArrowLeft size={14} /> Back to {kind}</Link><p className="mb-2 text-[10px] uppercase tracking-[.2em] text-accent-300"><span className="accent-text">{existing ? `Editing ${contentLabel}` : `New ${contentLabel}`}</span></p><h1 className="text-5xl leading-none sm:text-6xl">{existing ? 'Refine the story.' : 'Start something.'}</h1></div><div className="flex flex-wrap gap-2">{existing?.status === 'published' && <a href={linkToPublic} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-xs text-zinc-300 hover:text-white">View live <ExternalLink size={13} /></a>}{canGenerate && <AIContentGeneratorModal kind={kind} isEditing={!!existing} disabled={busy} getSnapshot={getSnapshot} onApply={applyAI} />}<Button type="submit" disabled={busy || !canSave}><Save size={15} /> {saving ? 'Saving…' : (galleryUploading || primaryUploading) ? 'Uploading images…' : 'Save changes'}</Button></div></div>
    {!canSave && <p role="alert" className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-xs text-amber-200">Your role cannot edit this item. Ask an owner for the required permission.</p>}
    {(error || validationError) && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-xs text-red-200">{validationError || error?.message}</p>}
    {saved && <p role="status" className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-xs text-emerald-200">{saved}</p>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>Core details</CardTitle></CardHeader><CardContent className="grid gap-5"><Field label="Title" id="content-title"><Input id="content-title" value={document.title} onChange={(event) => setDocument({ ...document, title: event.target.value })} maxLength={200} required /></Field><Field label="Slug" id="content-slug"><Input id="content-slug" value={document.slug} onChange={(event) => setDocument({ ...document, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} placeholder="a-clear-url" required /></Field><Field label="Summary" id="content-description"><Textarea id="content-description" value={document.description} onChange={(event) => setDocument({ ...document, description: event.target.value })} maxLength={1000} required /></Field></CardContent></Card>
        {kind !== 'services' && <Card><CardHeader><CardTitle>Rich content</CardTitle><p className="text-xs leading-5 text-zinc-500">Format the body, add images with alt text, and build tables. Existing structured content remains in place until you edit here.</p></CardHeader><CardContent><RichTextEditor ref={editorRef} initialDocument={existing?.editorContent ?? null} initialHtml={initialHtml} value={document.editorContent} onChange={(value) => setDocument((current) => ({ ...current, editorContent: value }))} /></CardContent></Card>}
        <Card><CardHeader><CardTitle>{kind === 'services' ? 'Service details' : kind === 'blogs' ? 'Article details' : kind === 'case-studies' ? 'Case study details' : 'Project details'}</CardTitle></CardHeader><CardContent className="space-y-5">
          {kind === 'services' ? <ServiceFields fields={document.fields} onChange={field} onBusyChange={setPrimaryUploading} disabled={saving || !canSave} /> : <>
          <ImageField onBusyChange={setPrimaryUploading} disabled={saving || !canSave} label={kind === 'blogs' ? 'Cover image' : kind === 'case-studies' ? 'Case study image' : 'Project image'} value={text(document.fields[primaryImage])} onChange={(value) => { field(primaryImage, value); if (kind === 'blogs' && !document.fields.socialImage) field('socialImage', value) }} />
          <Field label="Image alt text" id="image-alt"><Input id="image-alt" value={text(document.fields[altField])} onChange={(event) => field(altField, event.target.value)} maxLength={500} required /></Field>
          {kind !== 'blogs' && <ProjectGalleryField label={kind === 'case-studies' ? 'Case study' : 'Project'} images={readProjectGallery(document.fields.gallery)} onChange={(update) => setDocument((current) => ({ ...current, fields: { ...current.fields, gallery: update(readProjectGallery(current.fields.gallery)) } }))} onBusyChange={setGalleryUploading} disabled={create.isPending || update.isPending || !canSave} />}
          {kind === 'case-studies' ? <CaseStudyFields fields={document.fields} onChange={field} /> : <>
          <Field label="Category" id="content-category">{kind === 'blogs' ? <select id="content-category" value={text(document.fields.category)} onChange={(event) => field('category', event.target.value)} className="h-11 w-full rounded-lg border border-white/12 bg-[#0e0e12] px-3 text-xs text-white"><option value="insights">Insights</option><option value="growth">Growth</option><option value="ai">AI</option><option value="news">News</option></select> : <Input id="content-category" value={text(document.fields.category)} onChange={(event) => field('category', event.target.value)} required />}</Field>
          {kind === 'blogs' ? <><Field label="Social image URL" id="social-image"><Input id="social-image" value={text(document.fields.socialImage)} onChange={(event) => field('socialImage', event.target.value)} required /></Field><Field label="Tags (one per line)" id="content-tags"><Textarea id="content-tags" value={list(document.fields.tags)} onChange={(event) => field('tags', lines(event.target.value))} /></Field></> : <>
            <div className="grid gap-5 sm:grid-cols-2"><Field label="Year" id="project-year"><Input id="project-year" value={text(document.fields.year)} onChange={(event) => field('year', event.target.value)} pattern="[0-9]{4}" required /></Field><label className="flex items-center gap-3 pt-7 text-xs text-zinc-300"><input type="checkbox" checked={!!document.fields.featured} onChange={(event) => field('featured', event.target.checked)} className="accent-accent-500" /> Featured project</label></div>
            <Field label="Technologies (one per line)" id="project-technologies"><Textarea id="project-technologies" value={list(document.fields.technologies)} onChange={(event) => field('technologies', lines(event.target.value))} /></Field>
            <div className="grid gap-5 sm:grid-cols-2"><Field label="Live URL" id="project-live"><Input id="project-live" type="url" value={text(document.fields.liveUrl)} onChange={(event) => field('liveUrl', event.target.value)} /></Field><Field label="GitHub URL" id="project-github"><Input id="project-github" type="url" value={text(document.fields.githubUrl)} onChange={(event) => field('githubUrl', event.target.value)} /></Field></div>
            {(['overview', 'problem', 'solution', 'technical', 'challenges', 'results'] as const).map((name) => <Field key={name} label={name} id={`project-${name}`}><Textarea id={`project-${name}`} value={text(document.fields[name])} onChange={(event) => field(name, event.target.value)} /></Field>)}
            <Field label="Features (one per line)" id="project-features"><Textarea id="project-features" value={list(document.fields.features)} onChange={(event) => field('features', lines(event.target.value))} /></Field>
          </>}
          </>}
          </>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>FAQs</CardTitle><p className="text-xs text-zinc-500">Questions also contribute to structured SEO data.</p></CardHeader><CardContent className="space-y-4">{document.faqs?.map((faq, index) => <div key={index} className="space-y-3 rounded-lg border border-white/10 p-4"><div className="flex items-center justify-between text-xs text-zinc-500">Question {index + 1}<Button type="button" variant="ghost" size="icon" aria-label={`Remove question ${index + 1}`} onClick={() => setDocument((current) => ({ ...current, faqs: current.faqs?.filter((_, position) => position !== index) }))}><Trash2 size={14} /></Button></div><Input aria-label={`Question ${index + 1}`} value={faq.question} onChange={(event) => setDocument((current) => ({ ...current, faqs: current.faqs?.map((entry, position) => position === index ? { ...entry, question: event.target.value } : entry) }))} required /><Textarea aria-label={`Answer ${index + 1}`} value={faq.answer} onChange={(event) => setDocument((current) => ({ ...current, faqs: current.faqs?.map((entry, position) => position === index ? { ...entry, answer: event.target.value } : entry) }))} required /></div>)}<Button type="button" variant="secondary" onClick={() => setDocument((current) => ({ ...current, faqs: [...(current.faqs ?? []), { question: '', answer: '' }] }))}><Plus size={14} /> Add question</Button></CardContent></Card>
      </div>
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>Publishing</CardTitle></CardHeader><CardContent className="space-y-5"><Field label="Status" id="content-status"><select id="content-status" value={document.status} onChange={(event) => setDocument({ ...document, status: event.target.value as ContentStatus })} className="h-11 w-full rounded-lg border border-white/12 bg-[#0e0e12] px-3 text-xs text-white"><option value="draft">Draft</option>{canPublish && <option value="published">Published</option>}{canPublish && <option value="archived">Archived</option>}</select></Field><Field label="Publish at (optional)" id="publish-at"><Input id="publish-at" type="datetime-local" value={document.publishedAt ? new Date(document.publishedAt).toISOString().slice(0, 16) : ''} onChange={(event) => setDocument({ ...document, publishedAt: event.target.value ? new Date(event.target.value).toISOString() : null })} /></Field><p className="text-[10px] leading-5 text-zinc-500">Leave the date empty to publish immediately. Future dates schedule visibility.</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Additional structured data</CardTitle><p className="text-xs leading-5 text-zinc-500">Optional schema.org JSON-LD. Article, breadcrumbs and FAQs are generated automatically. Add only verified details.</p></CardHeader><CardContent><Label htmlFor="seo-jsonld">JSON-LD</Label><Textarea id="seo-jsonld" value={structuredDataText} onChange={event => setStructuredDataText(event.target.value)} rows={12} spellCheck={false} maxLength={64000} placeholder={'{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Your application"}'} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Search metadata</CardTitle></CardHeader><CardContent className="space-y-5"><Field label="Meta title" id="seo-title"><Input id="seo-title" value={text(document.seo?.metaTitle)} onChange={(event) => seo('metaTitle', event.target.value)} maxLength={200} /></Field><Field label="Meta description" id="seo-description"><Textarea id="seo-description" value={text(document.seo?.metaDescription)} onChange={(event) => seo('metaDescription', event.target.value)} maxLength={1000} /></Field><Field label="Canonical URL" id="seo-canonical"><Input id="seo-canonical" value={text(document.seo?.canonicalUrl)} onChange={(event) => seo('canonicalUrl', event.target.value)} placeholder="https://…" /></Field><Field label="Open Graph title" id="seo-og-title"><Input id="seo-og-title" value={text(document.seo?.ogTitle)} onChange={(event) => seo('ogTitle', event.target.value)} /></Field><Field label="Open Graph description" id="seo-og-description"><Textarea id="seo-og-description" value={text(document.seo?.ogDescription)} onChange={(event) => seo('ogDescription', event.target.value)} /></Field><Field label="Open Graph image" id="seo-og-image"><Input id="seo-og-image" value={text(document.seo?.ogImage)} onChange={(event) => seo('ogImage', event.target.value)} /></Field><Field label="Open Graph image alt" id="seo-og-alt"><Input id="seo-og-alt" value={text(document.seo?.ogImageAlt)} onChange={(event) => seo('ogImageAlt', event.target.value)} /></Field><Field label="Twitter title" id="seo-twitter-title"><Input id="seo-twitter-title" value={text(document.seo?.twitterTitle)} onChange={(event) => seo('twitterTitle', event.target.value)} /></Field><Field label="Twitter description" id="seo-twitter-description"><Textarea id="seo-twitter-description" value={text(document.seo?.twitterDescription)} onChange={(event) => seo('twitterDescription', event.target.value)} /></Field><Field label="Twitter image" id="seo-twitter-image"><Input id="seo-twitter-image" value={text(document.seo?.twitterImage)} onChange={(event) => seo('twitterImage', event.target.value)} /></Field><label className="flex items-center gap-3 text-xs text-zinc-300"><input type="checkbox" checked={!!document.seo?.noIndex} onChange={(event) => seo('noIndex', event.target.checked)} className="accent-accent-500" /> No index</label><label className="flex items-center gap-3 text-xs text-zinc-300"><input type="checkbox" checked={!!document.seo?.noFollow} onChange={(event) => seo('noFollow', event.target.checked)} className="accent-accent-500" /> No follow</label></CardContent></Card>
      </div>
    </div>
  </form>
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}</div>
}

function ImageField({ label, value, onChange, onBusyChange, disabled }: { label: string; value: string; onChange: (value: string) => void; onBusyChange: (busy: boolean) => void; disabled: boolean }) {
  const upload = useImageUpload('cover')
  async function select(file: File | undefined) {
    if (!file || disabled || upload.isPending) return
    onBusyChange(true)
    try { onChange(await upload.mutateAsync(file)) } catch {}
    finally { onBusyChange(false) }
  }
  async function retry() {
    onBusyChange(true)
    try { onChange(await upload.retryLast()) } catch {} finally { onBusyChange(false) }
  }
  return <div className="space-y-2"><Label htmlFor="main-image">{label}</Label><div className="flex gap-2"><Input id="main-image" disabled={disabled || upload.isPending} value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://… or /images/…" required /><label className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-white/12 px-3 text-xs text-zinc-300 hover:bg-white/[0.06]"><UploadCloud size={15} /> {upload.isPending ? 'Uploading…' : 'Upload'}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { void select(event.target.files?.[0]); event.target.value = '' }} disabled={disabled || upload.isPending} /></label></div><p className="text-xs text-zinc-500">Still JPEG/PNG/WebP, up to 20 MiB. Covers use a centered 16:9 crop without stretching.</p><ImageUploadStatus upload={upload} onRetry={disabled ? undefined : () => void retry()} />{upload.error && <p role="alert" className="text-xs text-red-300">{upload.error.message}</p>}{value && <img src={value} alt="Selected media preview" className="mt-3 h-36 w-full rounded-lg object-cover" />}</div>
}
