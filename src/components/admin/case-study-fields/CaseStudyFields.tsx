import { Plus, Trash2 } from 'lucide-react'
import { industries } from '@/data/case-studies/industries'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import { Textarea } from '@/components/admin/ui/textarea'
import type { JsonObject, JsonValue } from '@/server/portfolio-content'

export function CaseStudyFields({ fields, onChange }: { fields: JsonObject; onChange: (name: string, value: JsonValue) => void }) {
  const text = (name: string) => typeof fields[name] === 'string' ? fields[name] as string : ''
  const strings = (name: string) => Array.isArray(fields[name]) ? (fields[name] as JsonValue[]).map(String).join('\n') : ''
  return <div className="space-y-5">
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="study-industry">Industry</Label><select id="study-industry" value={text('industry')} onChange={event => onChange('industry', event.target.value)} className="h-11 w-full rounded-lg border border-white/12 bg-[#0e0e12] px-3 text-xs text-white">{industries.map(industry => <option key={industry.slug} value={industry.slug}>{industry.name}</option>)}</select></div>
      <div className="space-y-2"><Label htmlFor="study-type">Study type</Label><select id="study-type" value={text('studyType')} onChange={event => onChange('studyType', event.target.value)} className="h-11 w-full rounded-lg border border-white/12 bg-[#0e0e12] px-3 text-xs text-white"><option value="portfolio">Portfolio study</option><option value="concept">Concept study</option></select></div>
    </div>
    {(['context', 'problem', 'solution'] as const).map(name => <div key={name} className="space-y-2"><Label htmlFor={`study-${name}`}>{name[0].toUpperCase() + name.slice(1)}</Label><Textarea id={`study-${name}`} value={text(name)} onChange={event => onChange(name, event.target.value)} maxLength={50000} rows={5} /></div>)}
    <div className="space-y-2"><Label htmlFor="study-technologies">Technologies (one per line)</Label><Textarea id="study-technologies" value={strings('technologies')} onChange={event => onChange('technologies', event.target.value.split('\n'))} onBlur={event => onChange('technologies', event.target.value.split('\n').map(line => line.trim()).filter(Boolean))} /></div>
    {(['steps', 'outcomes'] as const).map(name => {
      const items = Array.isArray(fields[name]) ? fields[name] as JsonObject[] : []
      const update = (index: number, key: string, value: string) => onChange(name, items.map((item, position) => position === index ? { ...item, [key]: value } : item))
      return <fieldset key={name} className="space-y-4"><legend className="mb-3 text-sm capitalize text-white">{name}</legend>{items.map((item, index) => <div key={index} className="space-y-3 rounded-lg border border-white/10 p-4"><div className="flex items-center justify-between"><Label htmlFor={`study-${name}-${index}-title`}>{name} {index + 1} title</Label><Button type="button" size="icon" variant="ghost" aria-label={`Remove ${name} ${index + 1}`} onClick={() => onChange(name, items.filter((_, position) => position !== index))}><Trash2 size={14} /></Button></div><Input id={`study-${name}-${index}-title`} value={String(item.title ?? '')} onChange={event => update(index, 'title', event.target.value)} required maxLength={300} /><Label htmlFor={`study-${name}-${index}-text`}>Description</Label><Textarea id={`study-${name}-${index}-text`} value={String(item.text ?? '')} onChange={event => update(index, 'text', event.target.value)} required maxLength={20000} /></div>)}<Button type="button" variant="secondary" disabled={items.length >= 30} onClick={() => onChange(name, [...items, { title: '', text: '' }])}><Plus size={14} /> Add {name === 'steps' ? 'step' : 'outcome'}</Button></fieldset>
    })}
    <div className="space-y-2"><Label htmlFor="study-lessons">Lessons (one per line)</Label><Textarea id="study-lessons" value={strings('lessons')} onChange={event => onChange('lessons', event.target.value.split('\n'))} onBlur={event => onChange('lessons', event.target.value.split('\n').map(line => line.trim()).filter(Boolean))} /></div>
    <div className="space-y-2"><Label htmlFor="study-project">Related project slug (optional)</Label><Input id="study-project" value={text('projectSlug')} onChange={event => onChange('projectSlug', event.target.value)} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></div>
  </div>
}
