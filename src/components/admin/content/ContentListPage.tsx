import { useDeferredValue, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Card } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Badge } from '@/components/admin/ui/badge'
import { contentListOptions, useDeleteContent } from '@/queries/content/content'
import type { ContentKind, ContentStatus, ContentSummary } from '@/server/portfolio-content'
import { PageLoading, PageLoadError } from '@/components/feedback/PageFeedback'
import { ServiceVisibility } from '@/components/admin/service-visibility/ServiceVisibility'

export function ContentListPage({ kind }: { kind: ContentKind }) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<ContentStatus | ''>('')
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<ContentSummary | null>(null)
  const deferredSearch = useDeferredValue(search)
  const list = useQuery(contentListOptions({ kind, page, perPage: 12, status: status || undefined, q: deferredSearch.trim() || undefined }))
  const deletion = useDeleteContent(kind)
  const noun = kind === 'services' ? 'Services' : kind === 'blogs' ? 'Blog' : kind === 'case-studies' ? 'Case studies' : 'Projects'
  const label = kind === 'services' ? 'service' : kind === 'blogs' ? 'article' : kind === 'case-studies' ? 'case study' : 'project'

  async function remove() {
    if (!pendingDelete) return
    try {
      await deletion.mutateAsync({ id: pendingDelete.id, version: pendingDelete.version })
      setPendingDelete(null)
    } catch {}
  }

  if (list.isError && !list.data) return <PageLoadError size="panel" onRetry={() => list.refetch({ throwOnError: true })} />

  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-3 text-[10px] uppercase tracking-[.2em] text-accent-300"><span className="accent-text">Content library</span></p><h1 className="text-5xl leading-none sm:text-6xl">{noun}.</h1><p className="mt-4 text-xs leading-6 text-zinc-400">Manage drafts, publication status, and search metadata.</p></div>
      <Button asChild><Link to={kind === 'services' ? '/admin/services/new' : kind === 'blogs' ? '/admin/blogs/new' : kind === 'case-studies' ? '/admin/case-studies/new' : '/admin/projects/new'}><Plus size={15} /> New {label}</Link></Button>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="relative flex-1"><span className="sr-only">Search {kind}</span><Search size={15} className="pointer-events-none absolute left-3 top-3.5 text-zinc-500" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search content" className="pl-10" /></label>
      <label className="sr-only" htmlFor="content-status">Filter by status</label><select id="content-status" value={status} onChange={(event) => { setStatus(event.target.value as ContentStatus | ''); setPage(1) }} className="h-11 rounded-lg border border-white/12 bg-[#111114] px-3 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-accent-400"><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
    </div>
    {list.isError && <div role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-xs text-red-200">Couldn’t refresh this collection. Your last loaded content is still available. <button type="button" className="min-h-11 px-3 underline focus-visible:outline-2" disabled={list.isFetching} onClick={() => void list.refetch()}>Try again</button></div>}
    <Card className="overflow-hidden">
      <div className="border-b border-white/8 px-5 py-4 text-[10px] uppercase tracking-[.15em] text-zinc-500">{list.data?.pagination.total ?? '...'} items</div>
      {list.isPending ? <PageLoading size="panel" /> : list.data?.data.length === 0 ? <div className="p-10 text-center"><p className="text-sm text-zinc-300">No content found.</p><p className="mt-2 text-xs text-zinc-500">Create your first {label} or change the filters.</p></div> : <ul>{list.data?.data.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-5 last:border-0"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><p className="truncate text-sm font-semibold text-white">{item.title}</p><Badge className={item.status === 'published' ? 'border-emerald-400/20 text-emerald-300' : item.status === 'archived' ? 'text-zinc-500' : 'border-amber-400/20 text-amber-300'}>{item.status}</Badge></div><p className="mt-2 truncate text-[11px] text-zinc-500">/{item.slug} · Updated {new Date(item.updatedAt).toLocaleDateString()}</p>{kind === 'services' && <ServiceVisibility item={item} />}</div><div className="flex items-center gap-2"><Button asChild variant="secondary" size="sm"><Link to={kind === 'services' ? '/admin/services/$id' : kind === 'blogs' ? '/admin/blogs/$id' : kind === 'case-studies' ? '/admin/case-studies/$id' : '/admin/projects/$id'} params={{ id: item.id }}>Edit <ArrowRight size={13} /></Link></Button><Button variant="ghost" size="icon" aria-label={`Delete ${item.title}`} onClick={() => setPendingDelete(item)} disabled={deletion.isPending}><Trash2 size={15} /></Button></div></li>)}</ul>}
    </Card>
    {list.data && list.data.pagination.totalPages > 1 && <div className="flex items-center justify-between text-xs text-zinc-500"><span>Page {page} of {list.data.pagination.totalPages}</span><div className="flex gap-2"><Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button type="button" variant="secondary" size="sm" disabled={page >= list.data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button></div></div>}
    <Dialog.Root open={!!pendingDelete} onOpenChange={(open) => { if (!open && !deletion.isPending) setPendingDelete(null) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,430px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-[#1b1b20] p-7 shadow-2xl focus:outline-none">
          <Dialog.Title className="text-3xl text-white">Delete this {label}?</Dialog.Title>
          <Dialog.Description className="mt-3 text-xs leading-6 text-zinc-400">{pendingDelete?.title} will be permanently removed. This cannot be undone.</Dialog.Description>
          {deletion.error && <p role="alert" className="mt-3 text-xs text-red-300">{deletion.error.message}</p>}
          <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setPendingDelete(null)} disabled={deletion.isPending}>Cancel</Button><Button type="button" variant="destructive" onClick={() => void remove()} disabled={deletion.isPending}>{deletion.isPending ? 'Deleting...' : 'Delete permanently'}</Button></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>
}
