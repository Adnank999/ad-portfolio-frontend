import { createFileRoute } from '@tanstack/react-router'
import { ContentListPage } from '@/components/admin/content/ContentListPage'

export const Route = createFileRoute('/admin/services/')({ component: () => <ContentListPage kind="services" /> })
