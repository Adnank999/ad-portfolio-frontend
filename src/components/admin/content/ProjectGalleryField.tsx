import { useId, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import { maxProjectGalleryImages, projectImageTypes, type ProjectGalleryImage } from '@/lib/project-gallery'
import { useProjectGalleryUpload } from '@/queries/assets/useProjectGalleryUpload'
import { ImageUploadStatus } from './ImageUploadStatus'

export function ProjectGalleryField({ images, onChange, onBusyChange, disabled, label = 'Project', featuredImageUrl, onFeaturedChange }: {
  label?: string
  images: ProjectGalleryImage[]
  onChange: (update: (current: ProjectGalleryImage[]) => ProjectGalleryImage[]) => void
  onBusyChange: (busy: boolean) => void
  disabled: boolean
  featuredImageUrl?: string
  onFeaturedChange?: (url: string) => void
}) {
  const prefix = useId()
  const upload = useProjectGalleryUpload()
  const [errors, setErrors] = useState<string[]>([])
  const retryFiles = useRef<File[]>([])
  const locked = disabled || upload.isPending

  async function select(files: File[]) {
    if (locked || !files.length) return
    setErrors([])
    if (images.length + files.length > maxProjectGalleryImages) {
      setErrors([`The gallery supports ${maxProjectGalleryImages} images. Remove an image or select fewer files.`])
      return
    }
    onBusyChange(true)
    try {
      const result = await upload.mutateAsync(files)
      retryFiles.current = files.filter(file => result.failed.some(failed => failed.name === file.name))
      if (result.uploaded.length) onChange((current) => [...current, ...result.uploaded])
      setErrors(result.failed.map((failure) => `${failure.name}: ${failure.message}`))
    } catch (failure) { retryFiles.current = files; setErrors([failure instanceof Error ? failure.message : 'Image upload failed.']) }
    finally { onBusyChange(false) }
  }

  function update(index: number, field: 'alt' | 'caption', value: string) {
    onChange((current) => current.map((image, position) => position === index ? { ...image, [field]: value } : image))
  }
  function move(index: number, direction: -1 | 1) {
    onChange((current) => {
      const next = [...current]
      const destination = index + direction
      if (destination < 0 || destination >= next.length) return current
      const moved = next[index]
      next[index] = next[destination]
      next[destination] = moved
      return next
    })
  }

  return <section aria-labelledby={`${prefix}-heading`} className="space-y-4 rounded-xl border border-white/10 p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 id={`${prefix}-heading`} className="text-sm font-semibold text-white">{label} gallery <span className="ml-2 text-xs font-normal text-zinc-500">{images.length}/{maxProjectGalleryImages}</span></h3><label className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-accent-400/25 px-3 text-xs text-accent-200 focus-within:ring-2 focus-within:ring-accent-400 ${locked || images.length >= maxProjectGalleryImages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent-500/10'}`}><UploadCloud size={15} /><span className="accent-text">{upload.isPending ? 'Uploading images…' : 'Upload images'}</span><input aria-label={`Upload ${label.toLowerCase()} gallery images`} type="file" multiple accept={projectImageTypes.join(',')} disabled={locked || images.length >= maxProjectGalleryImages} className="sr-only" onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ''; void select(files) }} /></label></div>
    <p className="text-xs leading-6 text-zinc-500">Select still JPEG/PNG/WebP images, up to 20 MiB each. Images become WebP, retain their aspect ratio, and are resized without upscaling. Your primary image stays unchanged.</p>
    <ImageUploadStatus upload={{ ...upload.imageUpload, cancel: upload.cancel }} />
    {errors.length > 0 && retryFiles.current.length > 0 && <Button type="button" variant="secondary" disabled={locked} onClick={() => void select(retryFiles.current)}>Retry failed images</Button>}
    {upload.isPending && <p role="status" className="text-xs text-accent-200"><span className="accent-text">Uploading selected images securely to R2. Wait before saving.</span></p>}
    {errors.length > 0 && <div role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-xs leading-6 text-red-200"><p>Some images could not be uploaded. Successful uploads remain in the gallery.</p><ul className="list-disc pl-4">{errors.map((error, index) => <li key={index}>{error}</li>)}</ul></div>}
    {!images.length && <p className="rounded-lg border border-dashed border-white/10 p-5 text-center text-xs text-zinc-500">No gallery images yet.</p>}
    <ol className="space-y-4">{images.map((image, index) => <li key={image.url} className="space-y-3 rounded-lg border border-white/10 bg-black/10 p-3">
      <div className="flex items-center gap-3"><img src={image.url} alt={image.alt || 'Gallery image awaiting alt text'} className="h-20 w-28 rounded-md bg-white/5 object-contain" loading="lazy" /><span className="min-w-0 flex-1 text-xs text-zinc-400">Image {index + 1}</span><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" disabled={locked || index === 0} aria-label={`Move gallery image ${index + 1} up`} onClick={() => move(index, -1)}><ArrowUp size={14} /></Button><Button type="button" variant="ghost" size="icon" disabled={locked || index === images.length - 1} aria-label={`Move gallery image ${index + 1} down`} onClick={() => move(index, 1)}><ArrowDown size={14} /></Button><Button type="button" variant="ghost" size="icon" disabled={locked} aria-label={`Remove gallery image ${index + 1}`} onClick={() => onChange((current) => current.filter((_, position) => position !== index))}><Trash2 size={14} /></Button></div></div>
      <div className="space-y-2"><Label htmlFor={`${prefix}-alt-${index}`}>Gallery image {index + 1} alt text *</Label><Input id={`${prefix}-alt-${index}`} value={image.alt} onChange={(event) => update(index, 'alt', event.target.value)} maxLength={500} required pattern=".*\S.*" disabled={locked} placeholder="Describe what this screenshot shows" /></div>
      <div className="space-y-2"><Label htmlFor={`${prefix}-caption-${index}`}>Gallery image {index + 1} caption</Label><Input id={`${prefix}-caption-${index}`} value={image.caption} onChange={(event) => update(index, 'caption', event.target.value)} maxLength={1000} disabled={locked} /></div>
      {onFeaturedChange && <label className="flex min-h-11 items-center gap-3 text-xs text-zinc-300"><input type="checkbox" className="accent-accent-500" checked={featuredImageUrl === image.url} disabled={locked} onChange={event => onFeaturedChange(event.target.checked ? image.url : '')} />Use gallery image {index + 1} as featured image</label>}
      <p className="break-all text-[10px] leading-5 text-zinc-600">{image.url}</p>
    </li>)}</ol>
    {images.length > 0 && <p className="text-[10px] leading-5 text-zinc-500">Save changes to persist the gallery. Removing an image here does not delete the uploaded R2 object.</p>}
  </section>
}
