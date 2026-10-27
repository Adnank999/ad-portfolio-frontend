import { useEffect, useState, type RefObject } from 'react'
import { SHADER_RELEASE_DELAY_MS } from '../../shaders/shader-transition'

export function isHeroVisibleInViewport(bounds: Pick<DOMRectReadOnly, 'top' | 'bottom' | 'height'>, viewportHeight: number) {
  const referenceHeight = Math.min(bounds.height, viewportHeight)
  const visibleHeight = Math.max(0, Math.min(bounds.bottom, viewportHeight) - Math.max(bounds.top, 0))
  return referenceHeight > 0 && visibleHeight / referenceHeight >= .2
}

// Keep GPU targets only long enough to finish the fade used by service shaders.
export function useHeroShaderVisibility(heroRef: RefObject<HTMLElement | null>, enabled: boolean) {
  const [inView, setInView] = useState(false)
  const [retained, setRetained] = useState(false)
  const visible = enabled && inView

  useEffect(() => {
    const hero = heroRef.current
    if (!hero || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) setInView(entry.isIntersecting && isHeroVisibleInViewport(entry.boundingClientRect, entry.rootBounds?.height ?? window.innerHeight))
    }, { threshold: Array.from({ length: 101 }, (_, index) => index / 100) })
    const resize = () => setInView(isHeroVisibleInViewport(hero.getBoundingClientRect(), window.innerHeight))
    observer.observe(hero)
    window.addEventListener('resize', resize)
    return () => { observer.disconnect(); window.removeEventListener('resize', resize) }
  }, [heroRef])

  useEffect(() => {
    if (!enabled) { setRetained(false); return }
    if (visible) { setRetained(true); return }
    if (!retained) return
    const timer = window.setTimeout(() => setRetained(false), SHADER_RELEASE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [enabled, visible, retained])

  return { visible, mounted: enabled && (visible || retained) }
}
