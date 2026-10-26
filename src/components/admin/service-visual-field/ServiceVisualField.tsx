import { useId, type ReactNode } from 'react'
import { UploadCloud } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { useImageUpload } from '@/queries/assets/upload'
import { ImageUploadStatus } from '../content/ImageUploadStatus'
import { ShaderEditor } from '@/components/shaders/ShaderEditor'
import { backendSupportsShader, publishedShaderDefinitions } from '@/components/shaders/registry'
import type { ServiceVisualSlot, ShaderManifest, VisualConfig } from '@/components/shaders/types'
import type { ServiceMedia } from '@/lib/services/services'

export function ServiceVisualField({ slot, visual, legacy, backend, disabled, onChange, onBusyChange, renderLegacy }: {
  slot: ServiceVisualSlot; visual?: VisualConfig; legacy?: ServiceMedia; backend?: ShaderManifest; disabled: boolean
  onChange: (visual: VisualConfig | null, clearLegacy?: boolean) => void; onBusyChange: (busy: boolean) => void; renderLegacy: () => ReactNode
}) {
  const id = useId()
  const upload = useImageUpload('service_image', { requireVerified: true })
  const title = slot.replace('-', ' ').replace(/^./, letter => letter.toUpperCase())
  const mode = visual?.type ?? (legacy ? 'legacy' : 'illustration')
  const availableShader = Object.values(publishedShaderDefinitions).find(entry => backendSupportsShader(backend, entry.id))
  const setUrl = (url: string) => onChange({ type: 'image', src: url, alt: visual?.alt ?? legacy?.alt ?? '' })
  async function select(file?: File, retry = false) {
    if ((!file && !retry) || disabled) return
    onBusyChange(true)
    try { setUrl(await (retry ? upload.retryLast() : upload.mutateAsync(file!))) } catch {} finally { onBusyChange(false) }
  }
  return <details className="rounded-xl border border-white/10 p-4"><summary className="min-h-11 cursor-pointer text-sm text-white">{title} <span className="text-zinc-500">({mode === 'legacy' ? `existing ${legacy?.kind}` : mode})</span></summary><div className="mt-4 space-y-5">
    <div className="space-y-2"><label htmlFor={id} className="text-xs text-zinc-300">{title} visual</label><select id={id} value={mode} disabled={disabled} className="min-h-11 w-full rounded-lg border border-white/12 bg-[#0e0e12] px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-accent-400" onChange={event => {
      const next = event.target.value
      if (next === 'illustration') { onChange(null, true); return }
      if (next === 'legacy') { onChange(null); return }
      const source = visual?.type === 'image' ? visual.src : visual?.poster || (legacy?.kind === 'image' ? legacy.url : legacy?.poster) || ''
      const alt = visual?.alt ?? legacy?.alt ?? ''
      if (next === 'image') onChange({ type: 'image', src: source, alt })
      else {
        const definition = availableShader
        if (definition) onChange({ type: 'shader', shader: definition.id, version: definition.version, props: structuredClone(definition.defaults), ...(source ? { poster: source } : {}), alt })
      }
    }}><option value="illustration">Default illustration</option><option value="image">Image</option><option value="shader" disabled={!availableShader && mode !== 'shader'}>Shader{!availableShader && mode !== 'shader' ? backend ? ' — activate in shader library' : ' — loading catalog' : ''}</option><option value="legacy">Existing image / video</option></select></div>
    {mode === 'legacy' && renderLegacy()}
    {visual && <>
      {visual.type === 'shader' && <ShaderEditor visual={visual} backend={backend} disabled={disabled} onChange={onChange} />}
      {visual.type === 'image' && <div className="space-y-3 rounded-lg border border-white/10 p-4"><p className="text-sm text-white">Section image</p><p className="text-xs leading-6 text-zinc-400">Upload a still JPEG, PNG or WebP. The browser converts it to WebP using the shared image workflow.</p>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-4 text-xs text-zinc-300"><UploadCloud size={16} />Upload {title.toLowerCase()} image<input type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || upload.isPending} className="sr-only" onChange={event => { void select(event.target.files?.[0]); event.target.value = '' }} /></label>
        <ImageUploadStatus upload={upload} onRetry={disabled ? undefined : () => select(undefined, true)} />
        {visual.src && <img src={visual.src} alt={visual.alt || 'Selected image'} className="max-h-52 w-full rounded-lg object-contain" />}
        <label className="block space-y-2 text-xs text-zinc-300">{title} image description<Input value={visual.alt} required maxLength={500} disabled={disabled} onChange={event => onChange({ ...visual, alt: event.target.value })} /></label>
      </div>}
      {visual.type === 'shader' && <label className="block space-y-2 text-xs text-zinc-300">{title} shader description<Input value={visual.alt} required maxLength={500} disabled={disabled} onChange={event => onChange({ ...visual, alt: event.target.value })} /></label>}
      <Button type="button" variant="secondary" disabled={disabled} onClick={() => onChange(null, true)}>Restore illustration</Button>
    </>}
  </div></details>
}
