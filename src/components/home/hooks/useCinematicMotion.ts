import { useEffect, useRef, type RefObject } from 'react'
import { useInView, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { useSmoothScroll } from '@/components/layout/SmoothScrollProvider'

export function useSectionProgress(target: RefObject<HTMLElement | null>, pinned = false) {
  const { scrollYProgress } = useScroll({ target, offset: pinned ? ['start start', 'end end'] : ['start end', 'end start'] })
  return useTransform(() => scrollYProgress.get())
}

export function useHeroAnimation(target: RefObject<HTMLElement | null>) {
  const progress = useSectionProgress(target)
  return {
    headlineY: useTransform(progress, [0.4, 1], [0, -100]),
  }
}

export function useTextReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { once: true, margin: '-40px' })
  return { ref, visible }
}

export function usePinnedStorytelling(target: RefObject<HTMLElement | null>) {
  const progress = useSectionProgress(target, true)
  const activeStep = useTransform(progress, [0, 1], [0, 4])
  return { progress, activeStep }
}

export function useShaderTransition(target: RefObject<HTMLElement | null>, uniform: { value: number }) {
  const progress = useSectionProgress(target, true)
  useMotionValueEvent(progress, 'change', value => { uniform.value = value })
  useEffect(() => { uniform.value = progress.get() }, [progress, uniform])
  return progress
}

export function useFocusReveal(target: RefObject<HTMLElement | null>, progress: MotionValue<number>, still: boolean) {
  const lenis = useSmoothScroll()
  return () => {
    const section = target.current
    if (still || !section || progress.get() >= 0.85) return
    const top = section.getBoundingClientRect().top + window.scrollY + Math.max(0, section.offsetHeight - window.innerHeight) * 0.9
    if (lenis.current) lenis.current.scrollTo(top, { immediate: true })
    else window.scrollTo({ top, behavior: 'instant' })
  }
}

export function useScrollVelocity() {
  const { scrollY } = useScroll()
  const velocity = useMotionValue(0)
  const previous = useRef({ position: 0, time: 0 })
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useMotionValueEvent(scrollY, 'change', position => {
    const time = performance.now()
    const delta = Math.max(16, time - previous.current.time)
    velocity.set(Math.max(-1, Math.min(1, (position - previous.current.position) / delta / 3)))
    previous.current = { position, time }
    clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => velocity.set(0), 100)
  })
  useEffect(() => () => clearTimeout(resetTimer.current), [])
  return useSpring(velocity, { stiffness: 90, damping: 30 })
}

export function useMagneticMotion(still: boolean) {
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const x = useSpring(pointerX, { stiffness: 180, damping: 20 })
  const y = useSpring(pointerY, { stiffness: 180, damping: 20 })
  return {
    x, y,
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (still || event.pointerType !== 'mouse') return
      const bounds = event.currentTarget.getBoundingClientRect()
      pointerX.set((event.clientX - bounds.left - bounds.width / 2) * 0.16)
      pointerY.set((event.clientY - bounds.top - bounds.height / 2) * 0.16)
    },
    onPointerLeave: () => { pointerX.set(0); pointerY.set(0) },
  }
}
