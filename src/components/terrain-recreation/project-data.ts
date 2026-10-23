import { projects } from '../../data/projects'

const anchors = [
  { x: -68, z: 3, color: '#ff4ccc' },
  { x: 4, z: 48, color: '#40eddf' },
  { x: 57, z: -17, color: '#efbb60' },
  { x: 43, z: -70, color: '#9c83ff' },
  { x: -48, z: -52, color: '#66baff' },
  { x: 78, z: 48, color: '#8ce88c' },
]

export const terrainProjects = projects.map((project, index) => ({
  ...project,
  ...anchors[index % anchors.length],
  id: project.slug,
  client: project.category,
  imageUrl: project.image,
  summary: project.overview,
  services: [
    ['The problem', project.problem],
    ['The solution', project.solution],
    ['Technical implementation', project.technical],
    ['Challenges', project.challenges],
    ['Results', project.results],
  ] as [string, string][],
}))

export function terrainProjectPath(slug: string | null, base = '/') {
  const prefix = `/${base.split('/').filter(Boolean).join('/')}`.replace(/\/$/, '')
  return `${prefix}/projects${slug ? `/${encodeURIComponent(slug)}` : ''}`
}

export function terrainProjectFromPath(pathname: string, base = '/') {
  const prefix = `${terrainProjectPath(null, base)}/`
  if (!pathname.startsWith(prefix)) return null
  try {
    const slug = decodeURIComponent(pathname.slice(prefix.length).replace(/\/$/, ''))
    return terrainProjects.find(project => project.id === slug) ?? null
  } catch {
    return null
  }
}
