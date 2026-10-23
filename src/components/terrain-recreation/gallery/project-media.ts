import type { Project, ProjectMedia } from '../../../data/projects'

export function isMediaSource(value: string) {
  return /^(https?:\/\/|\/(?!\/))/.test(value)
}

export function getProjectMedia(project: Pick<Project, 'image' | 'title' | 'media'>): ProjectMedia[] {
  const seen = new Set<string>()
  return [
    { type: 'image' as const, src: project.image, alt: `${project.title} project preview`, caption: project.title },
    ...(project.media ?? []),
  ].filter(item => {
    if (!isMediaSource(item.src) || !['image', 'video'].includes(item.type) || seen.has(item.src)) return false
    seen.add(item.src)
    return true
  }).map(item => ({
    ...item,
    poster: item.poster && isMediaSource(item.poster) ? item.poster : undefined,
    thumbnail: item.thumbnail && isMediaSource(item.thumbnail) ? item.thumbnail : undefined,
  }))
}

export type GalleryLauncherLayout = {
  centerX: number
  centerY: number
  size: number
  width: number
  height: number
  hovered: boolean
}
