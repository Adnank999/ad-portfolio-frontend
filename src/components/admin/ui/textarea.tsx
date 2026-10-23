import * as React from 'react'
import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn('flex min-h-28 w-full rounded-lg border border-white/12 bg-[#0e0e12] px-3 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-zinc-600 focus-visible:border-accent-400 focus-visible:ring-2 focus-visible:ring-accent-400/20 disabled:opacity-50', className)} {...props} />
}
