import { useRef, useState, type RefObject } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { getSearchResults } from './search-data'
import './site-search.css'

type SiteSearchProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

export function SiteSearch({ open, onOpenChange, triggerRef }: SiteSearchProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const results = getSearchResults(query)

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="site-search-backdrop" />
      <Dialog.Content id="portfolio-nav-search" className="site-search" data-lenis-prevent
        onOpenAutoFocus={event => { event.preventDefault(); setQuery(''); inputRef.current?.focus() }}
        onCloseAutoFocus={event => { event.preventDefault(); triggerRef.current?.focus() }}>
        <div className="site-search-heading">
          <div><p className="site-search-eyebrow">A little direction</p><Dialog.Title>Find your next discovery.</Dialog.Title></div>
          <Dialog.Close className="site-search-close" aria-label="Close search"><X size={20} aria-hidden="true" /></Dialog.Close>
        </div>
        <Dialog.Description className="site-search-description">Explore pages, projects, and ideas.</Dialog.Description>
        <div className="site-search-field">
          <Search size={21} aria-hidden="true" />
          <input ref={inputRef} type="search" aria-label="Search pages and projects" placeholder="What are you looking for?" autoComplete="off" spellCheck={false} value={query} onChange={event => setQuery(event.target.value)} />
        </div>
        <p role="status" aria-live="polite" className="site-search-count">{query.trim() ? `${results.length} ${results.length === 1 ? 'match' : 'matches'}` : 'Explore the portfolio'}</p>
        <ul className="site-search-results">
          {results.map(item => <li key={item.href}><Link to={item.href} onClick={() => onOpenChange(false)}><span><span className="accent-text">{item.label}</span><small>{item.description}</small></span><ArrowUpRight size={18} aria-hidden="true" /></Link></li>)}
        </ul>
        {results.length === 0 && <p className="site-search-empty">Nothing here yet. Try “About”, “Work”, or a project name.</p>}
        <div className="site-search-footer"><span>Good things start with curiosity.</span><span><kbd>esc</kbd> to close</span></div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
