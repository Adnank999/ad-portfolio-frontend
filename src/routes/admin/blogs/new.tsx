import { createFileRoute } from '@tanstack/react-router'
import { ContentEditor } from '@/components/admin/content/ContentEditor'

export const Route = createFileRoute('/admin/blogs/new')({ component: () => <ContentEditor kind="blogs" /> })
