import { Bot, Boxes, ChartNoAxesCombined, Cloud, Code2, Database, Globe2, Laptop, Megaphone, RefreshCcw, Search, Users, Workflow, type LucideIcon } from 'lucide-react'

const serviceIcons: Record<string, LucideIcon> = {
  'web-development': Globe2,
  'nearshore-software-development': Users,
  'custom-software-development': Code2,
  'legacy-modernization': RefreshCcw,
  'cloud-migration': Cloud,
  'data-analytics': ChartNoAxesCombined,
  'ai-automation': Bot,
  'digital-transformation': Workflow,
  'erp-implementation': Boxes,
  'crm-implementation': Database,
  seo: Search,
  'geo-aeo': Globe2,
  'paid-media': Megaphone,
}

export function getServiceIcon(href?: string) {
  return serviceIcons[href?.split('/').at(-1) ?? ''] ?? Laptop
}
