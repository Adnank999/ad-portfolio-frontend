import { createFileRoute } from '@tanstack/react-router'
import { ContentEditor } from '@/components/admin/content/ContentEditor'

export const Route = createFileRoute('/admin/projects/new')({ component: () => <ContentEditor kind="projects" /> })
