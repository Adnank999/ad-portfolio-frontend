import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root className={cn('text-[11px] font-semibold uppercase tracking-[.1em] text-zinc-400', className)} {...props} />
}
