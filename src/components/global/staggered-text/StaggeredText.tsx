import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { motion, useReducedMotion, type Easing, type Target } from 'framer-motion'
import { cn } from '@/lib/utils'
import { buildTextKeyframes, reverseTextKeyframes, segmentText, staggerOrder, type SegmentBy, type StaggerDirection } from './staggeredText.utils'

export type StaggeredTextProps = {
  text?: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  id?: string
  style?: CSSProperties
  segmentBy?: SegmentBy
  separator?: string
  delay?: number
  duration?: number
  easing?: Easing | Easing[]
  threshold?: number
  rootMargin?: string
  direction?: 'top' | 'bottom' | 'left' | 'right'
  blur?: boolean
  staggerDirection?: StaggerDirection
  respectReducedMotion?: boolean
  exitOnScrollOut?: boolean
  from?: Target
  to?: Target | Target[]
  onAnimationComplete?: () => void
  onExitComplete?: () => void
}

export default function StaggeredText({ text = '', className, as: Element = 'p', id, style, segmentBy = 'words', separator, delay = 80, duration = .6, easing = 'anticipate', threshold = .1, rootMargin = '0px', direction = 'top', blur = true, staggerDirection = 'forward', respectReducedMotion = true, exitOnScrollOut = false, from, to, onAnimationComplete, onExitComplete }: StaggeredTextProps) {
  const container = useRef<HTMLElement | null>(null)
  const entered = useRef(false)
  const completedPhase = useRef<'enter' | 'exit' | null>(null)
  const [phase, setPhase] = useState<'hidden' | 'enter' | 'exit'>('hidden')
  const preference = useReducedMotion()
  const reducedMotion = respectReducedMotion && Boolean(preference)
  const { rows, count, accessibleText } = useMemo(() => segmentText(text, segmentBy, separator), [text, segmentBy, separator])
  const start = useMemo<Target>(() => ({
    opacity: 0,
    x: direction === 'left' ? -40 : direction === 'right' ? 40 : 0,
    y: direction === 'top' ? -40 : direction === 'bottom' ? 40 : 0,
    filter: blur ? 'blur(10px)' : 'blur(0px)',
    ...from,
  }), [direction, blur, from])
  const steps = useMemo<Target[]>(() => {
    const snapshots = to ? Array.isArray(to) ? to : [to] : [{}]
    return (snapshots.length ? snapshots : [{}]).map(snapshot => ({ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, filter: 'blur(0px)', ...snapshot }))
  }, [to])
  const entrance = useMemo(() => buildTextKeyframes(start, steps), [start, steps])
  const exit = useMemo(() => reverseTextKeyframes(entrance), [entrance])
  const order = useMemo(() => Array.from({ length: count }, (_, index) => staggerOrder(index, count, staggerDirection)), [count, staggerDirection])
  const maxOrder = Math.max(0, ...order)
  const finishingIndex = order.reduce((last, rank, index) => (phase === 'exit' ? maxOrder - rank : rank) === maxOrder ? index : last, -1)

  useEffect(() => {
    const element = container.current
    entered.current = false
    completedPhase.current = null
    setPhase('hidden')
    if (!element) return
    if (!('IntersectionObserver' in window)) { setPhase('enter'); return }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= Math.max(0, Math.min(1, threshold))) {
        entered.current = true
        setPhase('enter')
        if (!exitOnScrollOut) observer.disconnect()
      } else if (exitOnScrollOut && entered.current) setPhase('exit')
    }, { threshold: Math.max(0, Math.min(1, threshold)), rootMargin })
    observer.observe(element)
    return () => observer.disconnect()
  }, [text, segmentBy, separator, threshold, rootMargin, exitOnScrollOut])

  useEffect(() => { completedPhase.current = null }, [phase])

  const complete = () => {
    if (phase === 'hidden' || completedPhase.current === phase) return
    completedPhase.current = phase
    if (phase === 'enter') onAnimationComplete?.()
    else onExitComplete?.()
  }

  useEffect(() => {
    if (!reducedMotion || phase === 'hidden' || completedPhase.current === phase) return
    completedPhase.current = phase
    if (phase === 'enter') onAnimationComplete?.()
    else onExitComplete?.()
  }, [reducedMotion, phase, onAnimationComplete, onExitComplete])

  return <Element ref={(element: HTMLElement | null) => { container.current = element }} id={id} className={cn('relative', className)} style={style} data-staggered-phase={phase}>
    <span className="sr-only">{accessibleText}</span>
    <span aria-hidden="true">
      {rows.map((groups, rowIndex) => <span key={rowIndex} className="block whitespace-pre-wrap">
        {groups.length ? groups.map((group, groupIndex) => group.segments.length ? <span key={groupIndex} className={segmentBy === 'lines' ? 'block' : 'inline-block'}>
          {group.segments.map(segment => <motion.span
            key={`${text}-${segment.index}`}
            className={cn('staggered-text-segment inline-block', segmentBy === 'lines' ? 'whitespace-pre-wrap' : 'whitespace-pre', respectReducedMotion && 'motion-reduce:transform-none! motion-reduce:opacity-100! motion-reduce:blur-none!')}
            initial={reducedMotion ? false : start}
            animate={reducedMotion ? { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' } : phase === 'enter' ? entrance : phase === 'exit' ? exit : start}
            transition={reducedMotion ? { duration: 0 } : { duration: Math.max(0, duration), delay: (phase === 'exit' ? maxOrder - order[segment.index] : order[segment.index]) * Math.max(0, delay) / 1000, ease: easing }}
            onAnimationComplete={segment.index === finishingIndex ? complete : undefined}
          >{segment.text}</motion.span>)}
        </span> : group.text) : '\u00a0'}
      </span>)}
    </span>
    <noscript><style>{`.staggered-text-segment{opacity:1!important;filter:none!important;transform:none!important}`}</style></noscript>
  </Element>
}
