import type { Project } from '@/data/projects'

const searchablePages = [
  { label: 'Home', href: '/', description: 'From curiosity to creation' },
  { label: 'About', href: '/about', description: 'The story behind the code' },
  { label: 'Blog', href: '/blog', description: 'Field notes on planning, building, and releasing useful software' },
  { label: 'Work', href: '/projects', description: 'Selected work and case studies' },
  { label: 'Experience', href: '/experience', description: 'Learning, building, and evolving' },
  { label: 'Contact', href: '/contact', description: "Let's build something" },
]

export function getSearchResults(query: string, projects: Pick<Project, 'slug' | 'title' | 'category' | 'description'>[] = []) {
  const normalized = query.trim().toLowerCase()
  return [...searchablePages, ...projects.map(project => ({ label: project.title, href: `/projects/${project.slug}`, description: `${project.category} · ${project.description}` }))].filter(item => `${item.label} ${item.description}`.toLowerCase().includes(normalized))
}
