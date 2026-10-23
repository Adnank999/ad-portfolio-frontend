import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { LoaderCircle, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import { Textarea } from '@/components/admin/ui/textarea'
import { useAIContentGeneration } from '@/queries/ai/useAIContentGeneration'
import { emptyField, existingAIFields, fieldsFor, requestFields, type AIContext, type AIField, type AIProposal, type AIRequest, type AIUsage } from '@/lib/ai-content/contracts'
import { validateAIRequest } from '@/lib/ai-content/validation'
import type { ContentKind, ContentWrite } from '@/server/portfolio-content'
import { AIAdvancedContext, blankContext, splitItems } from './AIAdvancedContext'
import { AIGenerationPreview } from './AIGenerationPreview'
import { AIGenerationUsage } from './AIGenerationUsage'

type Props = {
  kind: ContentKind; isEditing: boolean; disabled?: boolean; getSnapshot: () => ContentWrite
  onApply: (proposals: AIProposal[], selected: AIField[], fillOnly: boolean) => { applied: AIField[]; conflicts: AIField[] }
}

export function AIContentGeneratorModal({ kind, isEditing, disabled, getSnapshot, onApply }: Props) {
  const prefix = useId()
  const type = kind === 'services' ? 'service' : kind === 'blogs' ? 'blog' : kind === 'case-studies' ? 'case_study' : 'project'
  const [open, setOpen] = useState(false)
  const [context, setContext] = useState('')
  const [instructions, setInstructions] = useState('')
  const [tone, setTone] = useState<AIRequest['tone']>('professional')
  const [audience, setAudience] = useState<AIRequest['audience']>('general_readers')
  const [length, setLength] = useState<AIRequest['length']>('medium')
  const [language, setLanguage] = useState('English')
  const [keywords, setKeywords] = useState('')
  const [scope, setScope] = useState<'all' | 'main' | 'seo' | 'selected'>('all')
  const [targets, setTargets] = useState<AIField[]>(['title', 'description', kind === 'services' ? 'fields.pageContent' : 'editorContent'])
  const [details, setDetails] = useState<AIContext>(() => blankContext(type))
  const [fillOnly, setFillOnly] = useState(false)
  const [proposals, setProposals] = useState<AIProposal[]>([])
  const [selected, setSelected] = useState<AIField[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [generations, setGenerations] = useState<(AIUsage | null)[]>([])
  const [skipped, setSkipped] = useState<{ field: AIField; reason: string }[]>([])
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [running, setRunning] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const sequence = useRef(0)
  const generation = useAIContentGeneration()
  const specs = fieldsFor(kind)
  const replacements = proposals.filter((proposal) => selected.includes(proposal.field) && !emptyField(proposal.baseline) && !fillOnly).length

  useEffect(() => () => { sequence.current++; controller.current?.abort() }, [])

  function changeOpen(next: boolean) {
    if (!next) {
      sequence.current++
      controller.current?.abort()
      setRunning(false); generation.reset(); setProposals([]); setSelected([]); setWarnings([]); setSkipped([]); setError(''); setConfirmed(false); setGenerations([])
    } else {
      const snapshot = getSnapshot()
      if (details.type !== 'blog') setDetails({ ...details,
        name: details.name || snapshot.title,
        projectType: details.projectType || String(snapshot.fields.category ?? ''),
        technologies: details.technologies.length ? details.technologies : (snapshot.fields.technologies as string[] ?? []),
        problem: details.problem || String(snapshot.fields.problem ?? ''), solution: details.solution || String(snapshot.fields.solution ?? ''),
        features: details.features.length ? details.features : (snapshot.fields.features as string[] ?? []), challenges: details.challenges || String(snapshot.fields.challenges ?? ''), outcomes: details.outcomes || String(snapshot.fields.results ?? ''),
      })
    }
    setOpen(next)
  }

  async function generate(override?: AIField[]) {
    if (running) return
    setError('')
    const snapshot = structuredClone(getSnapshot())
    const targetFields = override ?? requestFields(kind, scope, targets, fillOnly, snapshot)
    const contentContext = structuredClone(details)
    contentContext.technologies = contentContext.technologies.map((item) => item.trim()).filter(Boolean)
    if (contentContext.type !== 'blog') contentContext.features = contentContext.features.map((item) => item.trim()).filter(Boolean)
    if (contentContext.type === 'case_study') {
      contentContext.architecture = [contentContext.architecture, `Study type: ${String(snapshot.fields.studyType)}. Industry: ${String(snapshot.fields.industry)}.`, `Approach: ${JSON.stringify(snapshot.fields.steps ?? [])}`, `Evidence and outcomes: ${JSON.stringify(snapshot.fields.outcomes ?? [])}`].filter(Boolean).join('\n')
    }
    const request: AIRequest = {
      contentType: type, mode: fillOnly ? 'fill_missing' : isEditing || proposals.length ? 'regenerate' : 'create',
      context, additionalInstructions: instructions, tone, audience, length, language, seoKeywords: splitItems(keywords),
      targetFields, existingFields: existingAIFields(snapshot, kind), contentContext,
    }
    try { validateAIRequest(request) } catch (failure) { setError(failure instanceof Error ? failure.message : 'Check the generation settings.'); return }
    const current = ++sequence.current
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    setRunning(true)
    try {
      const response = await generation.mutateAsync({ request, signal: abort.signal })
      if (sequence.current !== current || abort.signal.aborted) return
      setGenerations((previous) => [...previous, response.usage ?? null])
      const incoming = Object.entries(response.generatedFields).map(([field, value]) => ({ field: field as AIField, value: value!, baseline: request.existingFields[field] ?? null }))
      setProposals((previous) => [...previous.filter((proposal) => !targetFields.includes(proposal.field)), ...incoming])
      setSelected((previous) => [...previous.filter((field) => !targetFields.includes(field)), ...incoming.map((proposal) => proposal.field)])
      setWarnings(response.warnings); setSkipped(response.skippedFields); setConfirmed(false)
    } catch (failure) {
      if (sequence.current === current && !abort.signal.aborted) setError(failure instanceof Error ? failure.message : 'Generation failed. Please try again.')
    } finally { if (sequence.current === current) setRunning(false) }
  }

  function submit(event: FormEvent) { event.preventDefault(); event.stopPropagation(); void generate() }
  function apply() {
    if (running || !selected.length || replacements > 0 && !confirmed) return
    const result = onApply(proposals, selected, fillOnly)
    if (result.conflicts.length) {
      setProposals((previous) => previous.filter((proposal) => !result.applied.includes(proposal.field)))
      setSelected((previous) => previous.filter((field) => !result.applied.includes(field)))
      setError(`These fields changed since generation or exceed the FAQ limit: ${result.conflicts.map((field) => specs.find((spec) => spec.key === field)?.label ?? field).join(', ')}. Review the latest values and regenerate those fields.`)
    } else if (!result.applied.length) setError('No selected fields are empty. Change the selection or turn off empty-only application.')
    else changeOpen(false)
  }

  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <Dialog.Trigger asChild><Button type="button" variant="secondary" disabled={disabled} className="border-accent-400/25 text-accent-200 hover:bg-accent-500/10"><Sparkles size={15} /> <span className="accent-text">Generate with AI</span></Button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[min(96vw,1080px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#111115] text-zinc-100 shadow-2xl focus:outline-none" onInteractOutside={(event) => event.preventDefault()}>
        <header className="shrink-0 border-b border-white/10 px-5 py-5 sm:px-7"><div className="flex items-start justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[.18em] text-accent-300"><Sparkles size={13} /> <span className="accent-text">Writing assistant</span></p><Dialog.Title className="text-4xl">Generate {kind === 'services' ? 'Service' : kind === 'blogs' ? 'Blog' : kind === 'case-studies' ? 'Case study' : 'Project'} with AI</Dialog.Title><Dialog.Description className="mt-2 text-xs leading-6 text-zinc-400">{kind === 'services' ? 'Describe your service, scope, deliverables and audience to prepare editable page sections.' : kind === 'blogs' ? 'Describe your article and let AI prepare a structured draft.' : 'Share your project details and generate a polished case study.'}</Dialog.Description></div><Dialog.Close asChild><Button type="button" variant="ghost" size="icon" aria-label="Close AI generator"><X size={18} /></Button></Dialog.Close></div></header>
        <div className="space-y-7 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
          <form id={`${prefix}-form`} onSubmit={submit} className="space-y-5">
            <div className="space-y-2"><Label htmlFor={`${prefix}-context`}>Context / description *</Label><Textarea id={`${prefix}-context`} value={context} onChange={(event) => setContext(event.target.value)} required minLength={20} maxLength={20_000} rows={5} disabled={running} placeholder={kind === 'services' ? 'Describe the service you offer, who it helps, its scope, deliverables and your approach.' : kind === 'blogs' ? 'Describe the article, what readers should learn, and the facts or examples to use.' : 'Describe what you built, why, the tools actually used, and the outcomes you can confirm.'} /><p className="text-[10px] text-zinc-500">Use facts you can verify. At least 20 characters.</p></div>
            <div className="space-y-2"><Label htmlFor={`${prefix}-instructions`}>Additional instructions</Label><Textarea id={`${prefix}-instructions`} value={instructions} onChange={(event) => setInstructions(event.target.value)} maxLength={4000} rows={2} disabled={running} placeholder="For example: emphasize architectural decisions and avoid marketing language." /></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select id={`${prefix}-tone`} label="Writing tone" value={tone} disabled={running} onChange={(value) => setTone(value as AIRequest['tone'])} options={['professional', 'technical', 'conversational', 'storytelling', 'educational', 'case_study']} />
              <Select id={`${prefix}-audience`} label="Target audience" value={audience} disabled={running} onChange={(value) => setAudience(value as AIRequest['audience'])} options={['general_readers', 'software_developers', 'senior_engineers', 'technical_recruiters', 'business_owners', 'potential_clients']} />
              <Select id={`${prefix}-length`} label="Content depth" value={length} disabled={running} onChange={(value) => setLength(value as AIRequest['length'])} options={['short', 'medium', 'long', 'in_depth']} />
              <div className="space-y-2"><Label htmlFor={`${prefix}-language`}>Language</Label><Input id={`${prefix}-language`} value={language} onChange={(event) => setLanguage(event.target.value)} required maxLength={80} disabled={running} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor={`${prefix}-keywords`}>SEO keywords (comma-separated)</Label><Input id={`${prefix}-keywords`} value={keywords} onChange={(event) => setKeywords(event.target.value)} maxLength={2000} disabled={running} /></div>
            </div>
            <AIAdvancedContext value={details} onChange={setDetails} prefix={prefix} disabled={running} />
            <div className="grid gap-4 sm:grid-cols-2"><Select id={`${prefix}-scope`} label="Generation scope" value={scope} disabled={running} onChange={(value) => setScope(value as typeof scope)} options={['all', 'main', 'seo', 'selected']} labels={{ all: 'All supported fields', main: 'Main content only', seo: 'SEO metadata only', selected: 'Selected individual fields' }} /><label className="flex min-h-11 items-center gap-3 self-end text-xs text-zinc-300"><input type="checkbox" checked={fillOnly} onChange={(event) => { setFillOnly(event.target.checked); setConfirmed(false) }} disabled={running} className="size-4 accent-accent-500" />Fill empty fields only</label></div>
            {scope === 'selected' && <fieldset className="grid gap-2 rounded-xl border border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-3"><legend className="px-1 text-xs text-zinc-400">Fields to generate</legend>{specs.map((field) => <label key={field.key} className="flex min-h-9 items-center gap-2 text-[11px] text-zinc-300"><input type="checkbox" checked={targets.includes(field.key)} disabled={running} onChange={(event) => setTargets((previous) => event.target.checked ? [...previous, field.key] : previous.filter((key) => key !== field.key))} className="accent-accent-500" />{field.label}</label>)}</fieldset>}
          </form>
          {running && <p role="status" className="flex items-center gap-3 rounded-xl border border-accent-400/20 bg-accent-500/10 p-4 text-xs text-accent-100"><LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" /><span className="accent-text">Generating your content. Waiting for the AI response...</span></p>}
          {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-xs leading-6 text-red-200">{error}</p>}
          <AIGenerationUsage generations={generations} />
          {warnings.length > 0 && <aside aria-label="Generation warnings" className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-6 text-amber-100"><p className="mb-2 font-semibold">Review notes</p><ul className="list-disc space-y-1 pl-5">{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></aside>}
          {skipped.length > 0 && <details className="rounded-xl border border-white/10 p-4 text-xs text-zinc-400"><summary className="cursor-pointer">{skipped.length} fields omitted or preserved</summary><ul className="mt-3 space-y-2">{skipped.map((entry) => <li key={entry.field}><span className="text-zinc-200">{specs.find((field) => field.key === entry.field)?.label ?? entry.field}:</span> {entry.reason}</li>)}</ul></details>}
          {proposals.length > 0 && <AIGenerationPreview kind={kind} proposals={proposals} selected={selected} onSelect={(fields) => { setSelected(fields); setConfirmed(false) }} pending={running} onRegenerate={(fields) => void generate(fields)} />}
          {replacements > 0 && <label className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-6 text-amber-100"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={running} className="mt-1 size-4 shrink-0 accent-accent-500" />I reviewed the proposals and agree to update {replacements} populated fields. Existing images and publishing settings will be preserved.</label>}
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#111115] px-5 py-4 sm:px-7"><p className="text-[10px] text-zinc-500">Apply updates the unsaved form. Save Changes persists it.</p><div className="flex flex-wrap gap-2"><Dialog.Close asChild><Button type="button" variant="secondary">{running ? 'Cancel generation' : 'Cancel'}</Button></Dialog.Close><Button type="submit" form={`${prefix}-form`} variant={proposals.length ? 'secondary' : 'default'} disabled={running || context.trim().length < 20 || !language.trim()}><Sparkles size={14} />{running ? 'Generating...' : proposals.length ? 'Regenerate scope' : 'Generate Content'}</Button>{proposals.length > 0 && <Button type="button" disabled={running || !selected.length || replacements > 0 && !confirmed} onClick={apply}>Apply Selected ({selected.length})</Button>}</div></footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}

function Select({ id, label, value, options, onChange, disabled, labels }: { id: string; label: string; value: string; options: string[]; onChange: (value: string) => void; disabled: boolean; labels?: Record<string, string> }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="h-11 w-full rounded-lg border border-white/12 bg-[#0e0e12] px-3 text-xs capitalize text-white outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:opacity-50">{options.map((option) => <option key={option} value={option}>{labels?.[option] ?? option.replaceAll('_', ' ')}</option>)}</select></div>
}
