import { createFileRoute } from '@tanstack/react-router'
import { TerrainProjectFallback } from '@/components/terrain-recreation/TerrainProjectFallback'
import { siteUrl } from '@/lib/siteUrl'
import { useSuspenseQuery } from '@tanstack/react-query'
import { projectsOptions } from '@/queries/projects/projects'

export const Route = createFileRoute('/projects/')({
  loader: ({ context }) => context.queryClient.fetchQuery(projectsOptions()),
  preloadStaleTime: 0,
  head: () => ({
    meta: [
      { title: 'Work — Adnan Hossain Khan' },
      { name: 'description', content: 'Selected full stack projects across Laravel, React, TypeScript, APIs, travel platforms and SaaS products.' },
      { property: 'og:title', content: 'Work — Adnan Hossain Khan' },
    ],
    links: [{ rel: 'canonical', href: siteUrl('/projects') }],
  }),
  component: ProjectsIndex,
})

function ProjectsIndex() {
  const { data: projects } = useSuspenseQuery(projectsOptions())
  return <TerrainProjectFallback projects={projects} />
}
