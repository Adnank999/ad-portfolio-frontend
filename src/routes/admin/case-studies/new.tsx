import { createFileRoute } from '@tanstack/react-router'
import { ContentEditor } from '@/components/admin/content/ContentEditor'

export const Route = createFileRoute('/admin/case-studies/new')({ component: () => <ContentEditor kind="case-studies" /> })
