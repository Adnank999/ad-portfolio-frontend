import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { caseStudiesOptions } from '@/queries/case-studies/case-studies'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { dropdownLabels, industryItems, moreItems, toolItems, type DropdownName, type NavigationItem } from './navigationData'
import { servicesOptions } from '@/queries/services/services'
import { groupServices } from '@/lib/services/services'

function useServiceGroups() {
  const services = useQuery(servicesOptions())
  return { ...services, groups: groupServices(services.data ?? [], true) }
}

function useIndustryItems() {
  const studies = useQuery(caseStudiesOptions())
  return industryItems.map(item => ({ ...item, caseCount: studies.data?.filter(study => item.href?.endsWith(`/${study.industry}`)).length }))
}

function CaseStudyIndustryItems({ onNavigate }: { onNavigate: () => void }) {
  const items = useIndustryItems()
  return <>{items.map(item => <li key={item.label}><NavDestination item={item} onNavigate={onNavigate} className="portfolio-nav-simple-link" /></li>)}</>
}

export function NavDestination({ item, className = '', onNavigate, children }: { item: NavigationItem; className?: string; onNavigate: () => void; children?: ReactNode }) {
  const content = children ?? <><span><span className="accent-text">{item.label}</span>{item.ai && <span className="portfolio-nav-spark" aria-hidden="true">✦</span>}</span>{item.caseCount !== undefined && <span className="portfolio-nav-study-count">{item.caseCount} {item.caseCount === 1 ? 'study' : 'studies'}</span>}{!item.href && <span className="portfolio-nav-unavailable">Unavailable</span>}</>
  return item.href
    ? <Link to={item.href} className={className} onClick={onNavigate}>{content}</Link>
    : <span role="link" aria-disabled="true" className={`${className} portfolio-nav-disabled`} title="No destination is available in this portfolio">{content}</span>
}

export function DropdownContent({ name, onNavigate }: { name: DropdownName; onNavigate: () => void }) {
  if (name === 'services') return <ServicesDropdown onNavigate={onNavigate} />
  return <OtherDropdown name={name} onNavigate={onNavigate} />
}

function ServiceMenuSkeleton() {
  return <div className="portfolio-nav-services-skeleton" role="status">
    <span className="sr-only">Loading services…</span>
    <div className="portfolio-nav-service-grid" aria-hidden="true">
      {Array.from({ length: 4 }, (_, groupIndex) => <section key={groupIndex} className="portfolio-nav-service-column">
        <span className="portfolio-nav-skeleton-line portfolio-nav-skeleton-heading" />
        <ul>{Array.from({ length: 3 }, (_, cardIndex) => <li key={cardIndex}>
          <div className="portfolio-nav-service-card">
            <div className="portfolio-nav-service-copy">
              <span className="portfolio-nav-skeleton-line portfolio-nav-skeleton-title" />
              <span className="portfolio-nav-skeleton-line portfolio-nav-skeleton-description" />
              <span className="portfolio-nav-skeleton-line portfolio-nav-skeleton-description portfolio-nav-skeleton-short" />
            </div>
            <div className="portfolio-nav-skeleton-art" />
          </div>
        </li>)}</ul>
      </section>)}
    </div>
  </div>
}

function ServicesDropdown({ onNavigate }: { onNavigate: () => void }) {
  const services = useServiceGroups()
  const serviceGroups = services.groups
  return <>
    <div className="portfolio-nav-panel-heading"><h3>Services</h3><NavDestination item={{ label: 'All services', href: '/services' }} onNavigate={onNavigate} className="portfolio-nav-all"><span className="accent-text">All services </span><ArrowRight size={16} aria-hidden="true" /></NavDestination></div>
    {services.isPending && <ServiceMenuSkeleton />}
    {services.isError && <p role="alert" className="portfolio-nav-panel-description">Services could not be refreshed. <button type="button" onClick={() => void services.refetch()}>Try again</button></p>}
    {services.isSuccess && !serviceGroups.length && <p className="portfolio-nav-panel-description">No services are currently listed.</p>}
    <div className="portfolio-nav-service-grid">{serviceGroups.map(group => <section key={group.label} className="portfolio-nav-service-column"><h3>{group.label}</h3><ul>{group.items.map(item => <li key={item.label}>
      <NavDestination item={item} onNavigate={onNavigate} className="portfolio-nav-service-card">
        <div className="portfolio-nav-service-copy"><h4>{item.label}{item.ai && <span className="portfolio-nav-spark" aria-hidden="true">✦</span>}</h4><p>{item.description}</p>{!item.href && <span className="portfolio-nav-unavailable">Unavailable</span>}</div>
        <div className={`portfolio-nav-service-art portfolio-nav-art-${item.visual}`} aria-hidden="true"><span /><i />{item.popular && <b>Popular</b>}</div>
      </NavDestination>
    </li>)}</ul></section>)}</div>
  </>
}

function OtherDropdown({ name, onNavigate }: { name: Exclude<DropdownName, 'services'>; onNavigate: () => void }) {
  if (name === 'case-studies') return <>
    <div className="portfolio-nav-panel-heading"><h2>Case studies</h2><Link to="/case-studies" className="portfolio-nav-all" onClick={onNavigate}><span className="accent-text">All case studies </span><ArrowRight size={16} aria-hidden="true" /></Link></div>
    <p className="portfolio-nav-panel-description">Explore the work by industry.</p><h3 className="portfolio-nav-group-title">By industry</h3>
    <ul className="portfolio-nav-industries"><CaseStudyIndustryItems onNavigate={onNavigate} /></ul>
  </>
  return <><div className="portfolio-nav-panel-heading"><h2>{dropdownLabels[name]}</h2></div><ul>{(name === 'tools' ? toolItems : moreItems).map(item => <li key={item.label}><NavDestination item={item} onNavigate={onNavigate} className="portfolio-nav-simple-link" /></li>)}</ul></>
}

export function MobileSubmenu({ name, onNavigate }: { name: 'services' | 'case-studies'; onNavigate: () => void }) {
  if (name === 'case-studies') return <><ul><CaseStudyIndustryItems onNavigate={onNavigate} /></ul><Link to="/case-studies" className="portfolio-nav-all" onClick={onNavigate}><span className="accent-text">All case studies </span><ArrowRight size={16} aria-hidden="true" /></Link></>
  return <MobileServices onNavigate={onNavigate} />
}

function MobileServices({ onNavigate }: { onNavigate: () => void }) {
  const services = useServiceGroups()
  return <>{services.isPending && <ServiceMenuSkeleton />}{services.isError && <p role="alert">Services could not be refreshed. <button type="button" onClick={() => void services.refetch()}>Try again</button></p>}{services.groups.map(group => <section key={group.label}><h3 className="portfolio-nav-group-title">{group.label}</h3><ul>{group.items.map(item => <li key={item.href}><NavDestination item={item} onNavigate={onNavigate} className="portfolio-nav-simple-link"><span><span className="accent-text">{item.label}</span><span className="mt-2 block text-[11px] leading-relaxed text-zinc-400">{item.description}</span></span></NavDestination></li>)}</ul></section>)}</>
}

export function MobileGroup({ label, items, onNavigate }: { label: string; items: NavigationItem[]; onNavigate: () => void }) {
  return <section className="portfolio-nav-mobile-group"><h3>{label}</h3><ul>{items.map(item => <li key={item.label}><NavDestination item={item} onNavigate={onNavigate} className="portfolio-nav-mobile-link" /></li>)}</ul></section>
}
