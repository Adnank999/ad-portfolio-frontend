import { createFileRoute } from '@tanstack/react-router'
import { ContentEditor } from '@/components/admin/content/ContentEditor'

export const Route = createFileRoute('/admin/services/new')({ component: () => <ContentEditor kind="services" /> })
