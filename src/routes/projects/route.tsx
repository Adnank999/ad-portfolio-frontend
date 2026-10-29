import { createFileRoute } from '@tanstack/react-router'
import { TerrainProjectLayout } from '../../components/terrain-recreation/TerrainProjectLayout'
import { projectsOptions } from '@/queries/projects/projects'

export const Route = createFileRoute('/projects')({
  loader: ({ context }) => context.queryClient.fetchQuery(projectsOptions()),
  preloadStaleTime: 0,
  component: TerrainProjectLayout,
})
