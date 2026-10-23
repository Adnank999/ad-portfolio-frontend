import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva('inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:pointer-events-none disabled:opacity-50', {
  variants: {
    variant: {
      default: 'bg-accent-500 text-white hover:bg-accent-400',
      secondary: 'border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12]',
      ghost: 'text-zinc-300 hover:bg-white/[0.08] hover:text-white',
      destructive: 'bg-red-500/15 text-red-200 hover:bg-red-500/25',
    },
    size: { default: 'px-4', sm: 'min-h-9 px-3', icon: 'size-10 p-0' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button'
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
