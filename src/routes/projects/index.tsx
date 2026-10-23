import { createFileRoute } from '@tanstack/react-router'
import { TerrainProjectFallback } from '@/components/terrain-recreation/TerrainProjectFallback'
import { siteUrl } from '@/lib/siteUrl'

export const Route = createFileRoute('/projects/')({
  head: () => ({
    meta: [
      { title: 'Work — Adnan Hossain Khan' },
      { name: 'description', content: 'Selected full stack projects across Laravel, React, TypeScript, APIs, travel platforms and SaaS products.' },
      { property: 'og:title', content: 'Work — Adnan Hossain Khan' },
    ],
    links: [{ rel: 'canonical', href: siteUrl('/projects') }],
  }),
  component: TerrainProjectFallback,
})
