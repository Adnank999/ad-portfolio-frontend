import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

const SmoothScrollContext = createContext<{ current: Lenis | null }>({ current: null })

export function useSmoothScroll() {
  return useContext(SmoothScrollContext)
}

function RouteScrollSync() {
  const router = useRouter()
  const instance = useContext(SmoothScrollContext)

  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    const stopMomentum = router.subscribe('onBeforeLoad', () => {
      instance.current?.scrollTo(window.scrollY, { immediate: true, force: true })
    })
    const synchronize = router.subscribe('onRendered', () => {
      clearTimeout(settleTimer)
      settleTimer = setTimeout(() => {
        instance.current?.resize()
        instance.current?.scrollTo(window.scrollY, { immediate: true, force: true })
      }, 0)
    })
    return () => {
      stopMomentum()
      synchronize()
      clearTimeout(settleTimer)
    }
  }, [router, instance])

  return null
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const instance = useRef<Lenis | null>(null)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const initialize = () => {
      instance.current?.destroy()
      instance.current = preference.matches ? null : new Lenis({
        autoRaf: true,
        smoothWheel: true,
        syncTouch: false,
        lerp: 0.08,
        wheelMultiplier: 1,
        touchMultiplier: 1,
        allowNestedScroll: true,
        anchors: { offset: -110 },
        stopInertiaOnNavigate: true,
      })
    }
    initialize()
    preference.addEventListener('change', initialize)
    return () => {
      preference.removeEventListener('change', initialize)
      instance.current?.destroy()
      instance.current = null
    }
  }, [])

  return <SmoothScrollContext.Provider value={instance}><RouteScrollSync />{children}</SmoothScrollContext.Provider>
}
