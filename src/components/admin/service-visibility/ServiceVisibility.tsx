import { useState } from 'react'
import { useRouteContext } from '@tanstack/react-router'
import { getContentFn, type ContentSummary } from '@/server/portfolio-content'
import { useUpdateContent } from '@/queries/content/content'

export function ServiceVisibility({ item }: { item: ContentSummary }) {
  const { account } = useRouteContext({ from: '/admin' })
  const update = useUpdateContent('services', item.id)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const permitted = account.permissions.includes('services:write') && (item.status === 'draft' || account.permissions.includes('services:publish'))
  async function toggle(name: 'enabled' | 'navEnabled', value: boolean) {
    if (pending || !permitted) return
    setPending(true); setError('')
    try {
      const current = await getContentFn({ data: { kind: 'services', id: item.id } })
      if (current.version !== item.version) throw new Error('This service changed. Refresh the list before toggling visibility.')
      await update.mutateAsync({ slug: current.slug, title: current.title, description: current.description, status: current.status, publishedAt: current.publishedAt, fields: { ...current.fields, [name]: value }, editorContent: current.editorContent, seo: current.seo, faqs: current.faqs, version: current.version })
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not update visibility.') }
    finally { setPending(false) }
  }
  return <div><div className="flex flex-wrap gap-4">{(['enabled', 'navEnabled'] as const).map(name => <label key={name} className="flex min-h-11 items-center gap-2 text-xs text-zinc-300"><input type="checkbox" role="switch" className="accent-accent-500" checked={item[name] === true} disabled={!permitted || pending} aria-label={`${name === 'enabled' ? 'Enable service' : 'Show in navbar'}: ${item.title}`} onChange={event => void toggle(name, event.target.checked)} />{name === 'enabled' ? 'Service on' : 'Navbar on'}</label>)}</div>{error && <p role="alert" className="text-xs text-red-300">{error}</p>}</div>
}
