import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { imagePurpose, type ImagePurpose, type ImageSlot } from '@/lib/media/image-presets'
import { prepareWebpImage, type PreparedImage } from '@/lib/media/convert-to-webp'
import { ImageUploadError, mediaJson, uploadDirectImage, type CompletedAsset, type UploadStage } from '@/lib/media/direct-upload'
import { useAdminImageUploads } from './ImageUploadContext'

export async function uploadImage(file: File, options: { purpose?: ImagePurpose; requireVerified?: boolean; signal?: AbortSignal; onStage?: (stage: UploadStage) => void; onPrepared?: (image: PreparedImage) => void; onAsset?: (asset: CompletedAsset) => void } = {}): Promise<string> {
  const purpose = options.purpose ?? 'project_gallery'
  const policy = await mediaJson<{ enabled: boolean }>('policy', undefined, options.signal)
  if (policy.enabled) {
    const asset = await uploadDirectImage(file, purpose, options)
    options.onAsset?.(asset)
    return asset.publicUrl
  }
  if (options.requireVerified) throw new Error('Enable direct R2 uploads on both servers to upload verified section images and shader posters. Existing image / video mode remains available for legacy uploads.')
  options.onStage?.('converting')
  const prepared = await prepareWebpImage(file, purpose, options.signal)
  options.onPrepared?.(prepared)
  options.onStage?.('uploading')
  const response = await fetch('/api/admin/media', {
    method: 'POST',
    headers: { 'content-type': 'image/webp' },
    body: prepared.file,
    credentials: 'same-origin',
    signal: options.signal,
  })
  const result = await response.json() as { url?: string; error?: string }
  if (!response.ok || !result.url) throw new Error(result.error ?? 'Image upload failed')
  options.onStage?.('ready')
  return result.url
}

export function useImageUpload(slot: ImageSlot = 'inline', { requireVerified = false }: { requireVerified?: boolean } = {}) {
  const context = useAdminImageUploads()
  const controller = useRef<AbortController | null>(null)
  const lastFile = useRef<File | null>(null)
  const [stage, setStage] = useState<UploadStage>('converting')
  const [prepared, setPrepared] = useState<PreparedImage | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  const mutation = useMutation({
    mutationKey: ['assets', 'image', slot], gcTime: 0, retry: false,
    onMutate: () => context?.begin(),
    onSettled: () => context?.end(),
    mutationFn: async (file: File) => {
      if (controller.current) throw new Error('An image upload is already running')
      lastFile.current = file
      const current = new AbortController()
      controller.current = current
      setPrepared(null)
      setStage('converting')
      try {
        return await uploadImage(file, { purpose: imagePurpose(context?.kind ?? 'blogs', slot), requireVerified, signal: current.signal, onStage: setStage, onPrepared: setPrepared, onAsset: context?.register })
      } catch (error) {
        if (current.signal.aborted) throw new ImageUploadError(0, 'Image upload cancelled. Retry or choose another image.')
        throw error
      } finally { if (controller.current === current) controller.current = null }
    },
  })
  return { ...mutation, stage, prepared, cancel: () => controller.current?.abort(), retryLast: () => lastFile.current ? mutation.mutateAsync(lastFile.current) : Promise.reject(new Error('Choose an image first')) }
}

export async function uploadServiceMedia(file: File): Promise<string> {
  const video = file.type === 'video/mp4' || file.type === 'video/webm'
  if (!video) return uploadImage(file, { purpose: 'service_image' })
  if (file.size > (video ? 64 : 8) * 1024 * 1024) throw new Error(`Choose ${video ? 'a video smaller than 64 MB' : 'an image smaller than 8 MB'}`)
  const response = await fetch('/api/admin/media', { method: 'POST', headers: { 'content-type': file.type }, body: file, credentials: 'same-origin' })
  const result = await response.json() as { url?: string; error?: string }
  if (!response.ok || !result.url) throw new Error(result.error ?? 'Media upload failed')
  return result.url
}
