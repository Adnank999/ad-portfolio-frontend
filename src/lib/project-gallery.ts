import type { JsonValue } from '@/server/portfolio-content'

export type ProjectGalleryImage = { url: string; alt: string; caption: string }
export const maxProjectGalleryImages = 20
export const projectImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

export function readProjectGallery(value: JsonValue | undefined): ProjectGalleryImage[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((image) => image && typeof image === 'object' && !Array.isArray(image) && typeof image.url === 'string' && typeof image.alt === 'string'
    ? [{ url: image.url, alt: image.alt, caption: typeof image.caption === 'string' ? image.caption : '' }] : [])
}

export async function uploadProjectImages(files: File[], upload: (file: File) => Promise<string>) {
  if (!files.length || files.length > maxProjectGalleryImages) throw new Error('Choose between 1 and 20 images.')
  for (const file of files) {
    if (!projectImageTypes.includes(file.type)) throw new Error(`${file.name}: choose a JPEG, PNG, WebP, GIF, or AVIF image.`)
    if (!file.size || file.size > 8 * 1024 * 1024) throw new Error(`${file.name}: choose a non-empty image of 8 MB or smaller.`)
  }
  const uploaded: ProjectGalleryImage[] = []
  const failed: { name: string; message: string }[] = []
  for (const file of files) {
    try { uploaded.push({ url: await upload(file), alt: '', caption: '' }) }
    catch (failure) { failed.push({ name: file.name, message: failure instanceof Error ? failure.message : 'Image upload failed.' }) }
  }
  return { uploaded, failed }
}
