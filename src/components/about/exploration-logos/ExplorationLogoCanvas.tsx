import { useEffect, useRef, type RefObject } from 'react'
import type { LogoRenderer } from './renderer'

type Props = { root: RefObject<HTMLDivElement | null>; paused: boolean; reducedMotion: boolean }

export function ExplorationLogoCanvas({ root, paused, reducedMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const preferences = useRef({ paused, reducedMotion })
  const syncRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    preferences.current = { paused, reducedMotion }
    syncRef.current?.()
  }, [paused, reducedMotion])

  useEffect(() => {
    const canvas = canvasRef.current
    const element = root.current ?? canvas?.parentElement as HTMLDivElement | null
    if (!element || !canvas || typeof IntersectionObserver === 'undefined') return
    element.dataset.logoState = 'idle'
    let disposed = false
    let near = false
    let visible = false
    let loading = false
    let attempted = false
    let controller: LogoRenderer | null = null
    const sync = () => {
      controller?.setActive(visible && !document.hidden && !preferences.current.paused && !preferences.current.reducedMotion)
    }
    const prepare = async () => {
      if (disposed || loading || attempted || document.hidden) return
      loading = true
      try {
        const { createLogoRenderer } = await import('./renderer')
        if (disposed) return
        attempted = true
        controller = createLogoRenderer(canvas, element)
        sync()
      } catch {
        attempted = true
        if (!disposed) element.dataset.logoState = 'fallback'
      } finally {
        loading = false
      }
    }
    const visibility = () => { if (near) void prepare(); sync() }
    const preloadObserver = new IntersectionObserver(entries => {
      near = entries.some(entry => entry.isIntersecting)
      if (near) void prepare()
    }, { rootMargin: '180px' })
    const visibilityObserver = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting)
      sync()
    })
    preloadObserver.observe(element)
    visibilityObserver.observe(element)
    document.addEventListener('visibilitychange', visibility)
    syncRef.current = sync
    return () => {
      disposed = true
      syncRef.current = null
      preloadObserver.disconnect()
      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      controller?.dispose()
    }
  }, [root])

  return <canvas ref={canvasRef} className="exploration-logo-canvas" aria-hidden="true" />
}
