import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { meOptions } from '@/queries/auth/auth'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    const account = await context.queryClient.ensureQueryData(meOptions())
    if (!account) throw redirect({ to: '/login' })
    if (!account.permissions.includes('content:read')) throw redirect({ to: '/' })
    return { account }
  },
  head: () => ({ meta: [{ title: 'Workspace · Adnan Portfolio' }, { name: 'robots', content: 'noindex,nofollow' }] }),
  component: AdminLayout,
})
