import { createFileRoute, Link, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { FileText, FolderKanban, LayoutDashboard, LogOut, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { meOptions, useLogout } from '@/queries/auth/auth'

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

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/blogs', label: 'Blog', icon: FileText },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/case-studies', label: 'Case studies', icon: FileText },
  { to: '/admin/services', label: 'Services', icon: FolderKanban },
] as const

function AdminLayout() {
  const { account } = Route.useRouteContext()
  const navigate = useNavigate()
  const logout = useLogout()
  async function signOut() {
    try { await logout.mutateAsync() } finally { await navigate({ to: '/login' }) }
  }
  return <div className="admin-shell flex min-h-screen flex-col lg:flex-row">
    <aside className="flex shrink-0 flex-col border-b border-white/10 bg-[#111114] px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:px-5 lg:py-7">
      <div className="flex items-center justify-between lg:block">
        <Link to="/admin" className="block text-[11px] font-bold uppercase tracking-[.23em] text-white">Adnan <span className="text-accent-400"><span className="accent-text">/ Workspace</span></span></Link>
        <Link to="/" className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white lg:mt-2">View portfolio <ArrowUpRight size={12} /></Link>
      </div>
      <nav aria-label="Workspace navigation" className="mt-6 flex gap-1 overflow-x-auto lg:mt-12 lg:flex-col">
        {links.map(({ to, label, icon: Icon }) => <Link key={to} to={to} activeOptions={{ exact: true }} className="flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-xs text-zinc-400 transition hover:bg-white/[0.06] hover:text-white [&.active]:bg-accent-500/15 [&.active]:text-accent-200"><Icon size={16} aria-hidden="true" /><span className="accent-text">{label}</span></Link>)}
      </nav>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5 lg:mt-auto">
        <div className="min-w-0"><p className="truncate text-xs text-zinc-200">{account.name}</p><p className="truncate text-[10px] text-zinc-500">{account.roles.join(', ') || 'Account'}</p></div>
        <Button type="button" variant="ghost" size="icon" onClick={() => void signOut()} aria-label="Sign out" disabled={logout.isPending}><LogOut size={16} /></Button>
      </div>
    </aside>
    <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10"><div className="mx-auto max-w-6xl"><Outlet /></div></main>
  </div>
}
