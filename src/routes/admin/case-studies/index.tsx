import { createFileRoute } from '@tanstack/react-router'
import { ContentListPage } from '@/components/admin/content/ContentListPage'

export const Route = createFileRoute('/admin/case-studies/')({ component: () => <ContentListPage kind="case-studies" /> })
