import type { Project } from '@/data/projects'

export type ProjectRecord = Pick<Project, 'id' | 'slug' | 'title' | 'description' | 'image' | 'category' | 'year' | 'technologies' | 'githubUrl' | 'liveUrl' | 'featured'> & Partial<Project> & {
  imageAlt: string
  gallery?: { url: string; alt: string; caption?: string }[]
  seo?: { title?: string; description?: string; canonicalUrl?: string; socialImage?: string; ogImage?: string; noIndex?: boolean }
}

// The public archive intentionally omits long narrative fields; detail requests supply them.
export function projectFromRecord(record: ProjectRecord): Project {
  return {
    id: record.id, slug: record.slug, title: record.title, description: record.description,
    image: record.image, imageAlt: record.imageAlt, thumbnailUrl: record.thumbnailUrl || record.image,
    featuredImageUrl: record.featuredImageUrl || record.image,
    featuredImageAlt: (record.gallery ?? []).find(image => image.url === record.featuredImageUrl)?.alt || record.imageAlt,
    category: record.category, year: record.year,
    technologies: record.technologies ?? [], githubUrl: record.githubUrl ?? '', liveUrl: record.liveUrl ?? '', featured: record.featured ?? false,
    overview: record.overview ?? '', problem: record.problem ?? '', solution: record.solution ?? '',
    features: record.features ?? [], technical: record.technical ?? '', challenges: record.challenges ?? '', results: record.results ?? '',
    media: (record.gallery ?? []).map(image => ({ type: 'image', src: image.url, alt: image.alt, caption: image.caption })),
  }
}

type Archive = { data: ProjectRecord[]; pagination: { totalPages: number } }
export async function loadPublishedProjects(api: <T>(path: string) => Promise<T>): Promise<Project[]> {
  const path = '/api/v1/projects?perPage=100&sort=newest'
  const first = await api<Archive>(path)
  if (first.pagination.totalPages > 100) throw new Error('Project collection exceeds the supported archive size')
  const records = [...first.data]
  for (let page = 2; page <= first.pagination.totalPages; page++) records.push(...(await api<Archive>(`${path}&page=${page}`)).data)
  return records.map(projectFromRecord)
}
