import type { useImageUpload } from '@/queries/assets/upload'
import { Button } from '@/components/admin/ui/button'
import { useEffect, useState } from 'react'

const labels = { converting: 'Preparing WebP image…', signing: 'Authorizing direct upload…', uploading: 'Uploading image…', verifying: 'Verifying and publishing image…', ready: 'Image ready' }

export function ImageUploadStatus({ upload, onRetry }: { upload: ReturnType<typeof useImageUpload>; onRetry?: () => void }) {
  const [preview, setPreview] = useState('')
  useEffect(() => {
    if (!upload.prepared) { setPreview(''); return }
    const url = URL.createObjectURL(upload.prepared.file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [upload.prepared])
  return <div className="space-y-2 text-xs text-zinc-400">
    {upload.isPending && <div className="flex items-center gap-3"><p role="status">{labels[upload.stage] ?? 'Preparing image…'} Do not save yet.</p>{upload.cancel && <Button type="button" variant="ghost" onClick={upload.cancel}>Cancel upload</Button>}</div>}
    {upload.prepared && <p>{(upload.prepared.sourceBytes / 1024).toFixed(0)} KiB → {(upload.prepared.file.size / 1024).toFixed(0)} KiB WebP · {upload.prepared.width} × {upload.prepared.height}</p>}
    {preview && upload.isPending && <img src={preview} alt="Converted WebP preview" className="max-h-36 w-full rounded-lg bg-white/5 object-contain" />}
    {upload.error && !upload.isPending && onRetry && <Button type="button" variant="secondary" onClick={onRetry}>Retry image upload</Button>}
  </div>
}
