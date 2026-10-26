import { createFileRoute, redirect } from '@tanstack/react-router'
import { ShaderLibraryPage } from '@/components/admin/shader-library/ShaderLibraryPage'

export const Route = createFileRoute('/admin/shaders')({
  beforeLoad: ({ context }) => {
    if (!context.account.permissions.includes('services:write')) throw redirect({ to: '/admin' })
  },
  head: () => ({ meta: [{ title: 'Shaders · Workspace' }] }),
  component: ShaderLibraryPage,
})
