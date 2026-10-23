import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import './page-not-found.css'

export function RouteNotFound() {
  return <PageNotFound />
}

export function PageNotFound({ collection }: { collection?: 'projects' | 'blog' | 'case-studies' | 'services' }) {
  const destination = collection ? `/${collection}` : '/projects'
  const label = collection === 'services' ? 'Explore services' : collection === 'blog' ? 'Read the journal' : collection === 'case-studies' ? 'Explore case studies' : 'Explore projects'

  return <main className="page-not-found" aria-labelledby="not-found-title">
    <div className="page-not-found-inner">
      <p className="page-not-found-label">A small detour / Page not found</p>
      <div className="page-not-found-number" aria-hidden="true">404<span /></div>
      <h1 id="not-found-title">A little off <em>the map.</em></h1>
      <p className="page-not-found-description">The page you’re looking for may have moved, or the link may be incorrect. Let’s get you somewhere familiar.</p>
      <nav className="page-not-found-actions" aria-label="Find your way">
        <a href="/" className="page-not-found-home"><ArrowLeft size={16} aria-hidden="true" /> Back to home</a>
        <a href={destination}>{label} <ArrowUpRight size={16} aria-hidden="true" /></a>
      </nav>
      <p className="page-not-found-note">Good things are still a click away.</p>
    </div>
  </main>
}
