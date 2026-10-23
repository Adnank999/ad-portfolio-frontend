import { useMutation } from '@tanstack/react-query'

export async function uploadImage(file: File): Promise<string> {
  if (file.size > 8 * 1024 * 1024) throw new Error('Choose an image smaller than 8 MB')
  const response = await fetch('/api/admin/media', {
    method: 'POST',
    headers: { 'content-type': file.type },
    body: file,
    credentials: 'same-origin',
  })
  const result = await response.json() as { url?: string; error?: string }
  if (!response.ok || !result.url) throw new Error(result.error ?? 'Image upload failed')
  return result.url
}

export function useImageUpload() {
  return useMutation({ mutationFn: uploadImage })
}

export async function uploadServiceMedia(file: File): Promise<string> {
  const video = file.type === 'video/mp4' || file.type === 'video/webm'
  if (file.size > (video ? 64 : 8) * 1024 * 1024) throw new Error(`Choose ${video ? 'a video smaller than 64 MB' : 'an image smaller than 8 MB'}`)
  const response = await fetch('/api/admin/media', { method: 'POST', headers: { 'content-type': file.type }, body: file, credentials: 'same-origin' })
  const result = await response.json() as { url?: string; error?: string }
  if (!response.ok || !result.url) throw new Error(result.error ?? 'Media upload failed')
  return result.url
}
