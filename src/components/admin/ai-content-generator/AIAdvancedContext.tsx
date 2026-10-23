import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import { Textarea } from '@/components/admin/ui/textarea'
import type { AIContext } from '@/lib/ai-content/contracts'

export const splitItems = (text: string) => text.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)

export function blankContext(type: AIContext['type']): AIContext {
  return type === 'blog'
    ? { type, topic: '', argument: '', concepts: '', technologies: [], examples: '', references: '', structure: '', imageDescription: '' }
    : { type, name: '', projectType: '', technologies: [], role: '', problem: '', solution: '', features: [], challenges: '', outcomes: '', architecture: '', year: '', imageDescription: '' }
}

export function AIAdvancedContext({ value, onChange, prefix, disabled }: { value: AIContext; onChange: (context: AIContext) => void; prefix: string; disabled: boolean }) {
  const fields = value.type === 'blog' ? [
    ['topic', 'Blog topic'], ['argument', 'Main argument / takeaway'], ['concepts', 'Technical concepts'],
    ['technologies', 'Technologies (one per line)'], ['examples', 'Practical examples'], ['references', 'Factual notes / references (links are not fetched)'], ['structure', 'Desired structure'],
  ] : value.type === 'service' ? [
    ['name', 'Service name'], ['projectType', 'Service category'], ['technologies', 'Supported tools (one per line)'], ['role', 'Your role and expertise'],
    ['problem', 'Customer problems'], ['solution', 'What you offer'], ['features', 'Deliverables (one per line)'], ['challenges', 'Scope and constraints'], ['outcomes', 'Verified outcomes'], ['architecture', 'Approach and engagement details'],
  ] : [
    ['name', 'Project name'], ['projectType', 'Project type / category'], ['technologies', 'Actual technology stack (one per line)'], ['role', 'Your role'],
    ['problem', 'Problem and constraints'], ['solution', 'Implemented solution'], ['features', 'Confirmed features (one per line)'], ['challenges', 'Actual engineering challenges'], ['outcomes', 'Confirmed results / measurements'], ['architecture', 'Architecture / additional facts'], ['year', 'Explicit project year (optional)'],
  ]
  return <details className="rounded-xl border border-white/10 bg-white/[.02] p-4">
    <summary className="min-h-8 cursor-pointer text-xs font-medium text-zinc-200 focus-visible:outline-2 focus-visible:outline-accent-400">Advanced context (optional)</summary>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {fields.map(([key, label]) => {
        const current = (value as unknown as Record<string, string | string[]>)[key]
        const id = `${prefix}-${key}`
        return <div key={key} className="space-y-2"><Label htmlFor={id}>{label}</Label>{key === 'year' ? <Input id={id} value={String(current)} maxLength={4} inputMode="numeric" pattern="[0-9]{4}" disabled={disabled} onChange={(event) => onChange({ ...value, year: event.target.value } as AIContext)} /> : <Textarea id={id} value={Array.isArray(current) ? current.join('\n') : current} maxLength={5000} disabled={disabled} rows={3} onChange={(event) => onChange({ ...value, [key]: Array.isArray(current) ? event.target.value.split('\n') : event.target.value } as AIContext)} />}</div>
      })}
      <div className="space-y-2 sm:col-span-2"><Label htmlFor={`${prefix}-image-description`}>Trustworthy image description</Label><Textarea id={`${prefix}-image-description`} value={value.imageDescription} maxLength={5000} disabled={disabled} rows={2} placeholder="Describe only what the selected image actually shows. Leave empty to skip generated alt text." onChange={(event) => onChange({ ...value, imageDescription: event.target.value })} /></div>
    </div>
  </details>
}
