import type { ComponentType } from 'react'
import type { Project } from '@/data/projects'

declare const TerrainExperience: ComponentType<{
  projects: Project[]
  project: Project | null
  projectSlug: string | null
  onNavigate: (slug: string | null) => void
  onStateChange: (state: 'loading' | 'ready' | 'error') => void
}>

export default TerrainExperience
