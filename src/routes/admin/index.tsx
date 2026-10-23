import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, FileText, FolderKanban, Plus } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent } from '@/components/admin/ui/card'
import { contentListOptions } from '@/queries/content/content'

export const Route = createFileRoute('/admin/')({ component: Dashboard })

function Dashboard() {
  const blogs = useQuery(contentListOptions({ kind: 'blogs', perPage: 1 }))
  const projects = useQuery(contentListOptions({ kind: 'projects', perPage: 1 }))
  const caseStudies = useQuery(contentListOptions({ kind: 'case-studies', perPage: 1 }))
  return <div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-3 text-[10px] uppercase tracking-[.22em] text-accent-300"><span className="accent-text">Content workspace</span></p><h1 className="text-5xl leading-none sm:text-6xl">Overview.</h1><p className="mt-4 max-w-xl text-xs leading-6 text-zinc-400">Draft, refine, and publish the work you want the world to see.</p></div><Button asChild><Link to="/admin/blogs/new"><Plus size={15} /> New article</Link></Button></div>
    <div className="grid gap-4 sm:grid-cols-3">
      {[{ title: 'Blog posts', count: blogs.data?.pagination.total, icon: FileText, to: '/admin/blogs' as const, error: blogs.error }, { title: 'Projects', count: projects.data?.pagination.total, icon: FolderKanban, to: '/admin/projects' as const, error: projects.error }, { title: 'Case studies', count: caseStudies.data?.pagination.total, icon: FileText, to: '/admin/case-studies' as const, error: caseStudies.error }].map(({ title, count, icon: Icon, to, error }) => <Card key={title}><CardContent className="p-6"><div className="flex items-center justify-between text-zinc-500"><span className="text-[10px] uppercase tracking-[.16em]">{title}</span><Icon size={17} /></div><p className="mt-8 text-5xl text-white">{error ? '—' : count ?? '…'}</p><Link to={to} className="mt-7 inline-flex items-center gap-2 text-xs text-accent-300 hover:text-white"><span className="accent-text">Manage </span><span className="accent-text">{title.toLowerCase()}</span> <ArrowRight size={14} /></Link></CardContent></Card>)}
    </div>
    {(blogs.error || projects.error || caseStudies.error) && <p role="alert" className="text-xs text-red-300">Could not load workspace data. Check that the backend is running and your account has content access.</p>}
  </div>
}
