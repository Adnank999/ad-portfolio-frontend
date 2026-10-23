import { useEffect } from 'react'
import { loaderModelUrl } from './loading-logo/model-url'
import { prefersLightweightGraphics, scheduleAfterPageLoad } from '@/lib/deferred-work'

export function LoaderPreload() {
  useEffect(() => {
    if (!('WebGLRenderingContext' in window)) return
    if (prefersLightweightGraphics()) return
    let cancelled = false
    const warm = () => {
      if (cancelled || document.querySelector('.loading-logo')) return
      void import('./loading-logo/renderer').then(({ prewarmLoadingLogo }) => {
        if (!cancelled) return prewarmLoadingLogo(loaderModelUrl)
      }).catch(() => {})
    }
    const cancel = scheduleAfterPageLoad(warm, { delay: 4000 })
    return () => { cancelled = true; cancel() }
  }, [])
  return null
}
