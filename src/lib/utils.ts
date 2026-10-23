import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function transitionTo(url: string) {
  if (typeof document === 'undefined') return
  const start = (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition
  if (start) start(() => { window.location.href = url })
  else window.location.href = url
}
