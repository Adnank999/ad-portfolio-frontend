import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  return <button className={cn('inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:opacity-50', variant === 'primary' ? 'bg-white text-slate-950 hover:-translate-y-0.5 hover:bg-accent-50' : 'border border-white/10 bg-white/[.04] text-white hover:bg-white/[.08]', className)} {...props} />
}
