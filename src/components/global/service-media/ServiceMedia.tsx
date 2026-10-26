import type { ServiceArtworkKind } from '../service-page/servicePage.types'
import type { ServiceMedia as Media } from '@/lib/services/services'
import { ServiceArtwork } from '../service-page/ServiceArtwork'
import { VisualRenderer } from '@/components/visuals/VisualRenderer'
import type { VisualConfig } from '@/components/shaders/types'

export function ServiceMedia({ media, visual, artwork, className = '', eager = false }: { media?: Media; visual?: VisualConfig; artwork: ServiceArtworkKind; className?: string; eager?: boolean }) {
  if (visual) return <VisualRenderer visual={visual} className={className} eager={eager || media?.slot === 'hero'} />
  if (!media) return <ServiceArtwork kind={artwork} className={className} />
  return <figure className="min-w-0">
    <div className={`overflow-hidden rounded-xl border border-white/10 bg-[#191919] ${className}`}>
    {media.kind === 'video'
      ? <video className="h-full max-h-[600px] w-full object-contain" src={media.url} poster={media.poster || undefined} controls playsInline preload="metadata" aria-label={media.alt}>{media.alt}</video>
      : <img src={media.url} alt={media.alt} className="h-full w-full object-cover" loading={media.slot === 'hero' ? 'eager' : 'lazy'} />}
    </div>
    {media.caption && <figcaption className="px-4 py-3 text-left text-xs leading-relaxed text-zinc-400">{media.caption}</figcaption>}
  </figure>
}
