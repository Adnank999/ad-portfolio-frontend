import type { ReactNode } from 'react'

export function TechBadge({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs font-medium text-slate-300">{children}</span>
}
