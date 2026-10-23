import type { ComponentType } from 'react'

declare const TerrainExperience: ComponentType<{
  projectSlug: string | null
  onNavigate: (slug: string | null) => void
  onStateChange: (state: 'loading' | 'ready' | 'error') => void
}>

export default TerrainExperience
