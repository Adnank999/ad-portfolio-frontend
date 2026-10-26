import { useEffect, useId, useState } from 'react'
import { Button } from '@/components/admin/ui/button'
import { allShaderDefinitions, backendHasShader, backendSupportsShader, getPublishedShader } from './registry'
import { VisualRenderer } from '../visuals/VisualRenderer'
import type { ShaderControl, ShaderManifest, ShaderVisual } from './types'
import type { JsonValue } from '@/server/portfolio-content'

const selectClass = 'min-h-11 w-full rounded-lg border border-white/12 bg-[#0e0e12] px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-accent-400'

function Control({ control, value, onChange }: { control: ShaderControl; value: JsonValue; onChange: (value: JsonValue) => void }) {
  const id = useId()
  if (control.kind === 'color-list') {
    const colors = Array.isArray(value) ? value.map(String) : []
    return <fieldset className="space-y-3"><legend className="mb-2 text-xs text-zinc-300">{control.label}</legend><div className="flex flex-wrap gap-3">{colors.map((color, index) => <label key={index} className="space-y-1 text-[10px] text-zinc-400">Color {index + 1}<input aria-label={`${control.label} ${index + 1}`} type="color" value={color} onChange={event => onChange(colors.map((previous, position) => position === index ? event.target.value : previous))} className="block h-11 w-16 cursor-pointer rounded border border-white/15 bg-transparent" /></label>)}</div><div className="flex gap-2"><Button type="button" variant="secondary" disabled={colors.length >= control.maxItems} onClick={() => onChange([...colors, '#ffffff'])}>Add color</Button><Button type="button" variant="secondary" disabled={colors.length <= control.minItems} onClick={() => onChange(colors.slice(0, -1))}>Remove color</Button></div></fieldset>
  }
  if (control.kind === 'toggle') return <label className="flex min-h-11 items-center gap-3 text-xs text-zinc-300"><input type="checkbox" checked={value === true} onChange={event => onChange(event.target.checked)} className="size-4 accent-accent-500" />{control.label}</label>
  return <div className="space-y-2"><label htmlFor={id} className="flex items-center justify-between gap-2 text-xs text-zinc-300">{control.label}{control.kind === 'slider' && <span aria-hidden="true" className="tabular-nums text-zinc-400">{Number(value)}</span>}</label>
    {control.kind === 'slider' ? <input id={id} type="range" min={control.min} max={control.max} step={control.step} value={Number(value)} onChange={event => onChange(Number(event.target.value))} className="h-11 w-full cursor-pointer accent-accent-500" />
      : control.kind === 'select' ? <select id={id} value={String(value)} onChange={event => onChange(event.target.value)} className={selectClass}>{control.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        : <input id={id} type="color" value={String(value)} onChange={event => onChange(event.target.value)} className="h-11 w-full cursor-pointer rounded border border-white/15 bg-transparent" />}
  </div>
}

export function ShaderEditor({ visual, backend, onChange, disabled }: { visual: ShaderVisual; backend?: ShaderManifest; onChange: (visual: ShaderVisual) => void; disabled: boolean }) {
  const id = useId()
  const definition = getPublishedShader(visual.shader)
  const [preview, setPreview] = useState(visual)
  useEffect(() => { const timer = setTimeout(() => setPreview(visual), 150); return () => clearTimeout(timer) }, [visual])
  const parsed = definition?.schema.safeParse(visual.props)
  return <div className="space-y-5">
    <div className="space-y-2"><label htmlFor={id} className="text-xs text-zinc-300">Shader</label><select id={id} value={visual.shader} disabled={disabled} className={selectClass} onChange={event => {
      const next = getPublishedShader(event.target.value)
      if (next && backendSupportsShader(backend, next.id)) onChange({ ...visual, shader: next.id, version: next.version, props: structuredClone(next.defaults) })
    }}>{Object.values(allShaderDefinitions).map(entry => <option key={entry.id} value={entry.id} disabled={!backendSupportsShader(backend, entry.id)}>{entry.name}{!backendHasShader(backend, entry.id) ? ' — needs setup / backend not ready' : !backendSupportsShader(backend, entry.id) ? ' — draft, activate in shader library' : ''}</option>)}</select></div>
    {!backendHasShader(backend, visual.shader) && <p role="alert" className="text-xs leading-6 text-amber-300">This shader is not confirmed by the backend. Deploy matching shader manifests before saving.</p>}
    {backendHasShader(backend, visual.shader) && !backendSupportsShader(backend, visual.shader) && <p className="text-xs leading-6 text-amber-300">This shader is inactive in the library. Existing assignments keep working; activate it before assigning it to a new section.</p>}
    {definition && <fieldset disabled={disabled} className="grid gap-5 rounded-xl border border-white/10 p-4 sm:grid-cols-2">{definition.controls.map(control => <Control key={control.key} control={control} value={visual.props[control.key] ?? definition.defaults[control.key]} onChange={value => onChange({ ...visual, props: { ...visual.props, [control.key]: value } })} />)}<Button type="button" variant="secondary" className="sm:col-span-2" onClick={() => onChange({ ...visual, props: structuredClone(definition.defaults) })}>Reset shader settings</Button></fieldset>}
    {parsed?.success === false && <p role="alert" className="text-xs text-red-300">Invalid shader settings. Reset the settings or correct the controls before saving.</p>}
    <div className="space-y-2"><p className="text-xs text-zinc-400">Live preview · changes are local until Save. Shaders fade over the page background; no fallback image is needed. Reduced motion and unsupported WebGL keep the background still.</p><VisualRenderer visual={preview} /></div>
  </div>
}
