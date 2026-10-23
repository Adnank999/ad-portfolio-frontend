import { createFileRoute } from '@tanstack/react-router'
import { ContentListPage } from '@/components/admin/content/ContentListPage'

export const Route = createFileRoute('/admin/projects/')({ component: () => <ContentListPage kind="projects" /> })
