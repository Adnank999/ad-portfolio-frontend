import type { ContentKind } from '@/server/portfolio-content'

export type ImagePurpose = 'blog_cover' | 'blog_inline' | 'project_cover' | 'project_gallery' | 'project_inline' | 'case_study_cover' | 'case_study_gallery' | 'case_study_inline' | 'service_image'
export type ImageSlot = 'cover' | 'gallery' | 'inline' | 'service_image'
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024
export const MAX_SOURCE_PIXELS = 25_000_000
export const rasterImageTypes = ['image/jpeg', 'image/png', 'image/webp']
export const IMAGE_PRESETS: Record<ImagePurpose, { maxWidth: number; maxHeight: number; cover: boolean; quality: number; maxOutputBytes: number }> = Object.fromEntries(
  ['blog_cover', 'blog_inline', 'project_cover', 'project_gallery', 'project_inline', 'case_study_cover', 'case_study_gallery', 'case_study_inline', 'service_image'].map(purpose => [purpose, {
    maxWidth: purpose.endsWith('_cover') ? 1920 : 1600,
    maxHeight: purpose.endsWith('_cover') ? 1080 : 1600,
    cover: purpose.endsWith('_cover'), quality: 0.82, maxOutputBytes: 2 * 1024 * 1024,
  }]),
) as Record<ImagePurpose, { maxWidth: number; maxHeight: number; cover: boolean; quality: number; maxOutputBytes: number }>

export function imagePurpose(kind: ContentKind, slot: ImageSlot): ImagePurpose {
  if (kind === 'services' || slot === 'service_image') return 'service_image'
  if (kind === 'blogs') return slot === 'cover' ? 'blog_cover' : 'blog_inline'
  return `${kind === 'projects' ? 'project' : 'case_study'}_${slot}` as ImagePurpose
}
