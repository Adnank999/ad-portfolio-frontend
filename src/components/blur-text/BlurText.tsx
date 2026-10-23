import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, useReducedMotion, type Easing, type TargetAndTransition } from 'framer-motion'
import './blur-text.css'

type AnimationSnapshot = {
  filter?: string
  opacity?: number
  x?: number | string
  y?: number | string
  scale?: number
  rotate?: number | string
}

export type BlurTextProps = {
  text?: string
  delay?: number
  className?: string
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  id?: string
  style?: CSSProperties
  animateBy?: 'words' | 'letters'
  direction?: 'top' | 'bottom'
  threshold?: number
  rootMargin?: string
  once?: boolean
  animationFrom?: AnimationSnapshot
  animationTo?: AnimationSnapshot[]
  easing?: Easing
  onAnimationComplete?: () => void
  stepDuration?: number
  disabled?: boolean
  renderSegment?: (segment: string, index: number) => ReactNode
}

function buildKeyframes(from: AnimationSnapshot, steps: AnimationSnapshot[]): TargetAndTransition {
  const keys = new Set([...Object.keys(from), ...steps.flatMap(step => Object.keys(step))] as (keyof AnimationSnapshot)[])
  return Object.fromEntries([...keys].map(key => {
    let previous = from[key] ?? steps.find(step => step[key] !== undefined)?.[key]
    return [key, [previous, ...steps.map(step => {
      previous = step[key] ?? previous
      return previous
    })]]
  })) as TargetAndTransition
}

export default function BlurText({ text = '', delay = 200, className = '', as: Element = 'p', id, style, animateBy = 'words', direction = 'top', threshold = .1, rootMargin = '0px', once = true, animationFrom, animationTo, easing = 'linear', onAnimationComplete, stepDuration = .35, disabled = false, renderSegment }: BlurTextProps) {
  const container = useRef<HTMLElement | null>(null)
  const completed = useRef(false)
  const [inView, setInView] = useState(false)
  const [finished, setFinished] = useState(false)
  const reducedMotion = useReducedMotion()
  const staticText = disabled || Boolean(reducedMotion)
  const elements = useMemo(() => animateBy === 'words' ? text.split(' ') : Array.from(text), [text, animateBy])
  const from = useMemo(() => animationFrom ?? { filter: 'blur(10px)', opacity: 0, y: direction === 'top' ? -50 : 50 }, [animationFrom, direction])
  const steps = useMemo(() => animationTo?.length ? animationTo : [
    { filter: 'blur(5px)', opacity: .5, y: direction === 'top' ? 5 : -5 },
    { filter: 'blur(0px)', opacity: 1, y: 0 },
  ], [animationTo, direction])
  const keyframes = useMemo(() => buildKeyframes(from, steps), [from, steps])
  const times = useMemo(() => Array.from({ length: steps.length + 1 }, (_, index) => index / steps.length), [steps.length])

  useEffect(() => {
    const element = container.current
    completed.current = false
    setFinished(false)
    if (!element) return
    if (staticText || !('IntersectionObserver' in window)) { setInView(true); return }
    setInView(false)
    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting && entry.intersectionRatio >= threshold
      if (visible) {
        setInView(true)
        if (once) observer.disconnect()
      } else if (!once) {
        setInView(false)
        completed.current = false
        setFinished(false)
      }
    }, { threshold, rootMargin })
    observer.observe(element)
    return () => observer.disconnect()
  }, [text, staticText, threshold, rootMargin, once])

  return <Element ref={(element: HTMLElement | null) => { container.current = element }} id={id} className={`blur-text ${className}`} style={style}>
    <span className="blur-text-accessible">{text}</span>
    {elements.map((segment, index) => <motion.span
      key={`${text}-${index}`}
      className="blur-text-segment"
      aria-hidden="true"
      initial={staticText ? false : from}
      animate={staticText ? { filter: 'blur(0px)', opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 } : inView ? keyframes : from}
      style={{ willChange: !staticText && inView && !finished ? 'transform, filter, opacity' : undefined }}
      transition={staticText ? { duration: 0 } : { duration: Math.max(0, stepDuration) * steps.length, times, delay: inView ? index * Math.max(0, delay) / 1000 : 0, ease: easing }}
      onAnimationComplete={index === elements.length - 1 ? () => {
        if (!inView || completed.current) return
        completed.current = true
        setFinished(true)
        onAnimationComplete?.()
      } : undefined}
    >{renderSegment ? renderSegment(segment, index) : segment === ' ' ? '\u00a0' : segment}{animateBy === 'words' && index < elements.length - 1 && '\u00a0'}</motion.span>)}
    <noscript><style>{`.blur-text-segment{filter:none!important;opacity:1!important;transform:none!important}`}</style></noscript>
  </Element>
}
