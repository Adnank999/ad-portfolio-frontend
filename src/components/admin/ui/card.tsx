import * as React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('rounded-xl border border-white/10 bg-[#151519] shadow-[0_20px_60px_rgba(0,0,0,.16)]', className)} {...props} />
}
export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 border-b border-white/8 p-5', className)} {...props} />
}
export function CardTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return <h2 className={cn('text-2xl leading-none text-white', className)} {...props} />
}
export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('p-5', className)} {...props} />
}
