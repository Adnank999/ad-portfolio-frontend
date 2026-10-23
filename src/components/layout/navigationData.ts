import { industries } from '@/data/case-studies'

export type NavigationItem = {
  label: string
  href?: string
  description?: string
  ai?: boolean
  popular?: boolean
  caseCount?: number
  visual?: 'orbit' | 'cube' | 'signal' | 'device' | 'grid'
}

export const serviceGroups: { label: string; items: NavigationItem[] }[] = [
  { label: 'Software & Product', items: [
    { label: 'Web Development', href: '/services/web-development', description: 'Websites and portals for enquiries, bookings, and purchases.', popular: true, visual: 'grid' },
    { label: 'Nearshore Software Development', href: '/services/nearshore-software-development', description: 'Direct remote support for your product backlog.', popular: true, visual: 'orbit' },
    { label: 'Custom Software Development', href: '/services/custom-software-development', description: 'Products and internal tools built around your workflow.', visual: 'signal' },
    { label: 'Legacy Modernization', href: '/services/legacy-modernization', description: 'Focused upgrades for the software you already rely on.', visual: 'grid' },
  ] },
  { label: 'Cloud, Data & AI', items: [

    { label: 'Cloud Migration', href: '/services/cloud-migration', description: 'Planned moves with cutover, recovery, and handover checks.', visual: 'orbit' },
    { label: 'Data & Analytics', href: '/services/data-analytics', description: 'Connected data and reporting built around a decision.', visual: 'signal' },

    { label: 'AI Automation', href: '/services/ai-automation', description: 'Document and workflow automation with review controls.', ai: true, visual: 'cube' },
  ] },
  { label: 'Business Systems', items: [
    { label: 'Digital Transformation', href: '/services/digital-transformation', description: 'Turn operational bottlenecks into working improvements.', visual: 'grid' },
    { label: 'ERP Implementation', href: '/services/erp-implementation', description: 'Workflow, data, and integrations for a scoped rollout.', visual: 'cube' },
    { label: 'CRM Implementation', href: '/services/crm-implementation', description: 'Clear pipelines and connected customer handoffs.', visual: 'orbit' },
  ] },
  { label: 'Growth (AI-era)', items: [
    { label: 'SEO', href: '/services/seo', description: 'Technical search reviews and verified website fixes.', popular: true, visual: 'device' },
    { label: 'GEO / AEO', href: '/services/geo-aeo', description: 'Clear answers backed by specific expertise and evidence.', popular: true, ai: true, visual: 'grid' },
    { label: 'Paid Media', href: '/services/paid-media', description: 'Campaign pages, lead delivery, and conversion measurement.', popular: true, visual: 'signal' },
  ] },
]

export const industryItems: NavigationItem[] = industries.map(industry => ({
  label: industry.name,
  href: `/case-studies/industries/${industry.slug}`,
}))

export const toolItems: NavigationItem[] = [
  { label: 'Business Diagnosis', ai: true },
  { label: 'AI Visibility Check', ai: true },
  { label: 'Free SEO Check' },
]

export const moreItems: NavigationItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Reviews' },
]

export type DropdownName = 'services' | 'case-studies' | 'tools' | 'more'

export const dropdownLabels: Record<DropdownName, string> = {
  services: 'Services',
  'case-studies': 'Case studies',
  tools: 'Tools',
  more: 'More',
}
