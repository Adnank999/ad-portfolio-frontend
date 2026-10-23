import { useId, useState } from 'react'
import { Plus, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Textarea } from '@/components/admin/ui/textarea'
import { Label } from '@/components/admin/ui/label'
import { useMutation } from '@tanstack/react-query'
import { uploadServiceMedia } from '@/queries/assets/upload'
import type { JsonObject, JsonValue } from '@/server/portfolio-content'
import schema from '@/lib/services/page-content.schema.json'

type Schema = { type: string; properties?: Record<string, Schema>; items?: Schema }
const label = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, letter => letter.toUpperCase())
const slots = ['hero', 'overview', 'spotlight', 'article-1', 'article-2', 'article-3']

export function ServiceFields({ fields, onChange, onBusyChange, disabled }: { fields: JsonObject; onChange: (name: string, value: JsonValue) => void; onBusyChange: (busy: boolean) => void; disabled: boolean }) {
  const [uploading, setUploading] = useState(false)
  const media = Array.isArray(fields.media) ? fields.media as JsonObject[] : []
  return <fieldset disabled={disabled || uploading} className="space-y-6 disabled:opacity-70">
    <legend className="sr-only">Service settings</legend>
    <div className="space-y-4 rounded-xl border border-white/10 p-5">
      <h3 className="text-lg text-white">Visibility and navigation</h3>
      <p className="text-xs leading-6 text-zinc-400">A published service must be enabled to appear publicly. Navbar visibility is independent: hide a navbar entry while keeping its page available.</p>
      {(['enabled', 'navEnabled', 'navPopular', 'navAi'] as const).map(name => <label key={name} className="flex min-h-11 items-center gap-3 text-xs text-zinc-300"><input type="checkbox" className="accent-accent-500" checked={fields[name] === true} onChange={event => onChange(name, event.target.checked)} />{({ enabled: 'Enable service page', navEnabled: 'Show in navbar', navPopular: 'Show Popular badge', navAi: 'Show AI badge' })[name]}</label>)}
      {['navTitle', 'navDescription', 'navGroup', 'category'].map(name => <div key={name} className="space-y-2"><Label htmlFor={`service-${name}`}>{({ navTitle: 'Navbar title', navDescription: 'Navbar description', navGroup: 'Navbar group', category: 'Page category' })[name]}</Label><Input id={`service-${name}`} value={String(fields[name] ?? '')} onChange={event => onChange(name, event.target.value)} required maxLength={name === 'navDescription' ? 1000 : name === 'navTitle' ? 200 : 100} /></div>)}
      <div className="space-y-2"><Label htmlFor="service-order">Navbar order</Label><Input id="service-order" type="number" min={0} max={10000} step={1} value={Number(fields.navOrder ?? 0)} onChange={event => onChange('navOrder', Number(event.target.value))} /></div>
      {([['artwork', ['web', 'software', 'cloud', 'data', 'automation', 'systems', 'growth']], ['navVisual', ['orbit', 'cube', 'signal', 'device', 'grid']]] as const).map(([name, values]) => <div key={name} className="space-y-2"><Label htmlFor={`service-${name}`}>{name === 'artwork' ? 'Fallback artwork' : 'Navbar illustration'}</Label><select id={`service-${name}`} value={String(fields[name])} onChange={event => onChange(name, event.target.value)} className="h-11 w-full rounded-lg border border-white/12 bg-[#0e0e12] px-3 text-xs text-white">{values.map(value => <option key={value}>{value}</option>)}</select></div>)}
    </div>
    <section className="space-y-4"><h3 className="text-lg text-white">Images and video</h3><p className="text-xs leading-6 text-zinc-400">Replace any illustration with an image (8 MB) or MP4/WebM video (64 MB). Empty slots retain the current illustration. Videos use playback controls.</p>
      {slots.map(slot => <ServiceMediaField key={slot} slot={slot} value={media.find(item => item.slot === slot)} disabled={disabled || uploading} onBusyChange={busy => { setUploading(busy); onBusyChange(busy) }} onChange={value => onChange('media', value ? [...media.filter(item => item.slot !== slot), value] : media.filter(item => item.slot !== slot))} />)}
    </section>
    <section className="space-y-4"><h3 className="text-lg text-white">Page sections</h3><p className="text-xs leading-6 text-zinc-400">The current page content is prefilled below. Edit individual sections or generate a complete draft with AI.</p>
      {Object.entries(schema.properties).map(([name, definition]) => <details key={name} className="rounded-xl border border-white/10 p-4"><summary className="min-h-11 cursor-pointer text-sm text-white">{label(name)}</summary><div className="mt-4"><SectionField name={name} schema={definition as Schema} value={(fields.pageContent as JsonObject)?.[name]} onChange={value => onChange('pageContent', { ...(fields.pageContent as JsonObject), [name]: value })} /></div></details>)}
    </section>
  </fieldset>
}

function empty(schema: Schema): JsonValue {
  if (schema.type === 'string') return ''
  if (schema.type === 'array') return []
  return Object.fromEntries(Object.entries(schema.properties ?? {}).map(([key, schema]) => [key, empty(schema)]))
}

function SectionField({ name, schema, value, onChange }: { name: string; schema: Schema; value: JsonValue | undefined; onChange: (value: JsonValue) => void }) {
  const id = useId()
  if (schema.type === 'string') return <div className="space-y-2"><Label htmlFor={id}>{label(name)}</Label><Textarea id={id} value={String(value ?? '')} onChange={event => onChange(event.target.value)} maxLength={20000} rows={name === 'title' || name === 'faqTitle' ? 2 : 4} /></div>
  if (schema.type === 'array') {
    const items = Array.isArray(value) ? value : []
    const fixed = name === 'process'
    return <div className="space-y-4">{items.map((item, index) => <div key={index} className="space-y-3 rounded-lg border border-white/10 p-4"><div className="flex items-center justify-between text-xs text-zinc-400">{fixed ? ['Discover', 'Diagnose', 'Design', 'Deliver', 'Evolve'][index] : `${label(name)} ${index + 1}`}{!fixed && <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${name} ${index + 1}`} onClick={() => onChange(items.filter((_, position) => position !== index))}><Trash2 size={14} /></Button>}</div><SectionField name={name} schema={schema.items!} value={item} onChange={value => onChange(items.map((item, position) => position === index ? value : item))} /></div>)}{!fixed && <Button type="button" variant="secondary" disabled={items.length >= 30} onClick={() => onChange([...items, empty(schema.items!)])}><Plus size={14} /> Add {label(name).toLowerCase()}</Button>}</div>
  }
  const object = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return <div className="space-y-4">{Object.entries(schema.properties ?? {}).map(([key, schema]) => <SectionField key={key} name={key} schema={schema} value={object[key]} onChange={value => onChange({ ...object, [key]: value })} />)}</div>
}

function ServiceMediaField({ slot, value, onChange, onBusyChange, disabled }: { slot: string; value?: JsonObject; onChange: (value: JsonObject | null) => void; onBusyChange: (busy: boolean) => void; disabled: boolean }) {
  const upload = useMutation({ mutationFn: uploadServiceMedia })
  const update = (key: string, field: JsonValue) => onChange({ slot, kind: 'image', url: '', alt: '', poster: '', caption: '', ...value, [key]: field })
  async function select(file?: File) {
    if (!file || disabled || upload.isPending) return
    onBusyChange(true)
    try { const url = await upload.mutateAsync(file); onChange({ slot, alt: '', poster: '', caption: '', ...value, kind: file.type.startsWith('video/') ? 'video' : 'image', url }) }
    catch {} finally { onBusyChange(false) }
  }
  return <details className="rounded-xl border border-white/10 p-4"><summary className="min-h-11 cursor-pointer text-sm text-white">{label(slot)} {value?.url ? `(${value.kind})` : '(current illustration)'}</summary><div className="mt-4 space-y-4">
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-4 text-xs text-zinc-300"><UploadCloud size={16} />{upload.isPending ? 'Uploading…' : `Upload ${slot} media`}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm" disabled={disabled || upload.isPending} className="sr-only" onChange={event => { void select(event.target.files?.[0]); event.target.value = '' }} /></label>
    {upload.error && <p role="alert" className="text-xs text-red-300">{upload.error.message}</p>}
    {value && <><label className="block space-y-2 text-xs text-zinc-300">Media type<select value={String(value.kind)} onChange={event => update('kind', event.target.value)} className="h-11 w-full rounded-lg border border-white/12 bg-[#0e0e12] px-3"><option value="image">Image</option><option value="video">Video</option></select></label>{['url', 'alt', 'poster', 'caption'].filter(key => key !== 'poster' || value.kind === 'video').map(key => <div key={key} className="space-y-2"><Label htmlFor={`service-${slot}-${key}`}>{({ url: 'Media URL', alt: 'Alt text / video description', poster: 'Video poster image URL (optional)', caption: 'Caption (optional)' })[key]}</Label><Input id={`service-${slot}-${key}`} value={String(value[key] ?? '')} onChange={event => update(key, event.target.value)} required={key === 'url' || key === 'alt'} maxLength={key === 'alt' ? 500 : key === 'caption' ? 1000 : 2048} /></div>)}{value.url && (value.kind === 'video' ? <video src={String(value.url)} poster={String(value.poster || '') || undefined} controls preload="metadata" className="max-h-52 w-full rounded-lg" aria-label={String(value.alt || 'Selected video')} /> : <img src={String(value.url)} alt={String(value.alt || 'Selected image')} className="max-h-52 w-full rounded-lg object-contain" />)}<Button type="button" variant="secondary" onClick={() => onChange(null)}>Restore illustration</Button></>}
    {!value && <Button type="button" variant="secondary" onClick={() => update('url', '')}>Use existing media URL</Button>}
  </div></details>
}
