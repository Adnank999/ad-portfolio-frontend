import type { JsonValue } from '@/server/portfolio-content'

export type ProjectGalleryImage = { url: string; alt: string; caption: string }
export const maxProjectGalleryImages = 20
export const projectImageTypes = ['image/jpeg', 'image/png', 'image/webp']

export function assertProjectImages(fields: Record<string, JsonValue>) {
  const thumbnail = typeof fields.thumbnailUrl === 'string' ? fields.thumbnailUrl.trim() : ''
  let valid = thumbnail.startsWith('/') && !thumbnail.startsWith('//')
  try { const url = new URL(thumbnail); valid = ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password } catch {}
  if (!valid || thumbnail.length > 2048 || /[\x00-\x20\\]/.test(thumbnail)) throw new Error('Add a valid terrain thumbnail URL before saving this project.')
  const featured = typeof fields.featuredImageUrl === 'string' && fields.featuredImageUrl ? fields.featuredImageUrl : fields.image
  if (featured !== fields.image && !readProjectGallery(fields.gallery).some(image => image.url === featured)) throw new Error('Choose the featured image from the project cover or gallery.')
}

export function readProjectGallery(value: JsonValue | undefined): ProjectGalleryImage[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((image) => image && typeof image === 'object' && !Array.isArray(image) && typeof image.url === 'string' && typeof image.alt === 'string'
    ? [{ url: image.url, alt: image.alt, caption: typeof image.caption === 'string' ? image.caption : '' }] : [])
}

export async function uploadProjectImages(files: File[], upload: (file: File) => Promise<string>) {
  if (!files.length || files.length > maxProjectGalleryImages) throw new Error('Choose between 1 and 20 images.')
  for (const file of files) {
    if (!projectImageTypes.includes(file.type)) throw new Error(`${file.name}: choose a still JPEG, PNG, or WebP image.`)
    if (!file.size || file.size > 20 * 1024 * 1024) throw new Error(`${file.name}: choose a non-empty image of 20 MiB or smaller.`)
  }
  const uploaded: ProjectGalleryImage[] = []
  const failed: { name: string; message: string }[] = []
  for (const file of files) {
    try { uploaded.push({ url: await upload(file), alt: '', caption: '' }) }
    catch (failure) { failed.push({ name: file.name, message: failure instanceof Error ? failure.message : 'Image upload failed.' }) }
  }
  return { uploaded, failed }
}
