import * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn('flex h-11 w-full rounded-lg border border-white/12 bg-[#0e0e12] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus-visible:border-accent-400 focus-visible:ring-2 focus-visible:ring-accent-400/20 disabled:opacity-50', className)} {...props} />
}
