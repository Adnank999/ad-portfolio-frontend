import type { Project } from '../../data/projects'

const anchors = [
  { x: -68, z: 3, color: '#ff4ccc' },
  { x: 4, z: 48, color: '#40eddf' },
  { x: 57, z: -17, color: '#efbb60' },
  { x: 43, z: -70, color: '#9c83ff' },
  { x: -48, z: -52, color: '#66baff' },
  { x: 78, z: 48, color: '#8ce88c' },
]

export const toTerrainProject = (project: Project, index = 0) => ({
  ...project,
  ...anchors[index % anchors.length],
  x: anchors[index % anchors.length].x + Math.floor(index / anchors.length) * 12,
  id: project.slug,
  client: project.category,
  imageUrl: project.thumbnailUrl || project.image,
  heroImageUrl: project.featuredImageUrl || project.image,
  heroImageAlt: project.featuredImageAlt || project.imageAlt || `${project.title} project preview`,
  summary: project.overview,
  services: [
    ['The problem', project.problem],
    ['The solution', project.solution],
    ['Technical implementation', project.technical],
    ['Challenges', project.challenges],
    ['Results', project.results],
  ] as [string, string][],
})

export type TerrainProject = ReturnType<typeof toTerrainProject>
export const toTerrainProjects = (projects: Project[]): TerrainProject[] => projects.map(toTerrainProject)

export function terrainProjectPath(slug: string | null, base = '/') {
  const prefix = `/${base.split('/').filter(Boolean).join('/')}`.replace(/\/$/, '')
  return `${prefix}/projects${slug ? `/${encodeURIComponent(slug)}` : ''}`
}

export function terrainProjectFromPath(pathname: string, projects: TerrainProject[], base = '/') {
  const prefix = `${terrainProjectPath(null, base)}/`
  if (!pathname.startsWith(prefix)) return null
  try {
    const slug = decodeURIComponent(pathname.slice(prefix.length).replace(/\/$/, ''))
    return projects.find(project => project.id === slug) ?? null
  } catch {
    return null
  }
}
