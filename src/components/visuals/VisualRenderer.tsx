import { useId } from 'react'
import { ShaderSlot } from '../shaders/ShaderSlot'
import type { VisualConfig } from '../shaders/types'
import { cn } from '@/lib/utils'

export function VisualRenderer({ visual, className = '', eager = false }: { visual: VisualConfig; className?: string; eager?: boolean }) {
  const id = useId()
  return <div className={cn('relative aspect-video min-w-0 overflow-hidden rounded-xl border border-white/10', visual.type === 'shader' ? 'bg-[#151515]' : 'bg-[#191919]', className)}>
    {visual.type === 'shader' ? <div className="absolute inset-0"><ShaderSlot id={id} visual={visual} /></div> : <img src={visual.src} alt={visual.alt} className="absolute inset-0 h-full w-full object-cover" loading={eager ? 'eager' : 'lazy'} />}
  </div>
}
