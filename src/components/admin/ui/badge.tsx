import * as React from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[.1em] text-zinc-300', className)} {...props} />
}
