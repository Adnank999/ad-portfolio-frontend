import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties } from 'react'
import { animate, useAnimationFrame, useInView, useMotionValue, useMotionValueEvent, type AnimationPlaybackControls } from 'framer-motion'
import { cn } from '@/lib/utils'
import { sampleVaporWord, vaporPalette, type VaporSweep, type VaporWord } from './vaporTextParticles'
import { vaporTextPresets, type VaporPreset } from './vaporTextPresets'
import { useVaporReducedMotion } from './useVaporReducedMotion'

export type VaporTextHandle = { next: () => void; replay: () => void }
export type VaporTextProps = {
  words?: string[]
  preset?: VaporPreset
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  className?: string
  style?: CSSProperties
  id?: string
  align?: 'start' | 'center' | 'end'
  color?: string
  vaporColor?: string
  density?: number
  particleSize?: number
  spread?: number
  rise?: number
  turbulence?: number
  diffusion?: number
  grain?: number
  sweep?: VaporSweep
  stagger?: number
  condense?: number
  hold?: number
  dissolve?: number
  overlap?: number
  gap?: number
  loop?: boolean
  startOnView?: boolean
  interactive?: boolean
  breath?: number
  breathRadius?: number
  recovery?: number
  clickAdvance?: boolean
  pauseOnHover?: boolean
  area?: 'parent' | 'self' | 'window'
  paused?: boolean
  dpr?: number
  onWordChange?: (index: number) => void
}

type Phase = 'condense' | 'hold' | 'dissolve' | 'gap'
type BreathPoint = { x: number; y: number; strength: number; time: number }
type Resources = { words: VaporWord[]; width: number; height: number; textWidth: number; textHeight: number; fontSize: number; padding: number; offsetX: number; pixelRatio: number; palette: string[] }
const defaultWords = ['Imagine', 'Create', 'Inspire']

const VaporText = forwardRef<VaporTextHandle, VaporTextProps>(function VaporText({ words = defaultWords, preset = 'mist', as: Element = 'span', className, style, id, align = 'center', color = 'currentColor', vaporColor: vaporColorOverride, density = 1, particleSize: particleSizeOverride, spread: spreadOverride, rise: riseOverride, turbulence: turbulenceOverride, diffusion: diffusionOverride, grain: grainOverride, sweep: sweepOverride, stagger: staggerOverride, condense: condenseOverride, hold: holdOverride, dissolve: dissolveOverride, overlap: overlapOverride, gap = .2, loop = true, startOnView = true, interactive = true, breath = 1, breathRadius = .8, recovery = 1.2, clickAdvance = true, pauseOnHover = true, area = 'parent', paused = false, dpr = 2, onWordChange }, forwardedRef) {
  const settings = vaporTextPresets[preset]
  const vaporColor = vaporColorOverride ?? settings.vaporColor
  const particleSize = particleSizeOverride ?? settings.particleSize
  const spread = spreadOverride ?? settings.spread
  const rise = riseOverride ?? settings.rise
  const turbulence = turbulenceOverride ?? settings.turbulence
  const diffusion = diffusionOverride ?? settings.diffusion
  const grain = grainOverride ?? settings.grain
  const sweep = sweepOverride ?? settings.sweep
  const stagger = staggerOverride ?? settings.stagger
  const condense = condenseOverride ?? settings.condense
  const hold = holdOverride ?? settings.hold
  const dissolve = dissolveOverride ?? settings.dissolve
  const overlap = Math.max(0, Math.min(1, overlapOverride ?? settings.overlap))
  const wordsKey = JSON.stringify(words)
  const phrases = useMemo<string[]>(() => {
    const parsed: string[] = JSON.parse(wordsKey)
    return parsed.length ? parsed : ['']
  }, [wordsKey])
  const root = useRef<HTMLElement | null>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const resources = useRef<Resources | null>(null)
  const control = useRef<AnimationPlaybackControls | null>(null)
  const started = useRef(false)
  const dirty = useRef(true)
  const wordIndex = useRef(0)
  const phaseRef = useRef<Phase>('condense')
  const runner = useRef<(phase: Phase, start?: number) => void>(() => {})
  const incoming = useRef<{ index: number } | null>(null)
  const active = useRef(false)
  const callback = useRef(onWordChange)
  const trails = useRef<BreathPoint[]>([])
  const impact = useRef<{ x: number; y: number } | null>(null)
  const [ready, setReady] = useState(false)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('condense')
  const [hovered, setHovered] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(true)
  const progress = useMotionValue(0)
  const inView = useInView(root, { amount: .1 })
  const reducedMotion = useVaporReducedMotion()
  const run = useCallback((nextPhase: Phase, start = 0) => runner.current(nextPhase, start), [])
  useMotionValueEvent(progress, 'change', value => {
    dirty.current = true
    if (phaseRef.current !== 'dissolve' || !overlap || incoming.current || value < 1 - overlap) return
    const nextIndex = (wordIndex.current + 1) % phrases.length
    incoming.current = { index: nextIndex }
    setIndex(nextIndex)
    callback.current?.(nextIndex)
  })

  useEffect(() => { callback.current = onWordChange }, [onWordChange])
  useEffect(() => {
    const update = () => setDocumentVisible(!document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  useEffect(() => {
    runner.current = (nextPhase, start = 0) => {
      control.current?.stop()
      phaseRef.current = nextPhase
      setPhase(nextPhase)
      progress.set(start)
      dirty.current = true
      if (nextPhase === 'condense') {
        impact.current = null
        const alreadyAnnounced = incoming.current?.index === wordIndex.current
        incoming.current = null
        if (!alreadyAnnounced) callback.current?.(wordIndex.current)
      }
      const duration = { condense, hold, dissolve, gap }[nextPhase]
      control.current = animate(progress, 1, { duration: Math.max(.05, duration * (1 - start)), ease: 'linear', onComplete: () => {
        if (nextPhase === 'condense') run('hold')
        else if (nextPhase === 'hold') {
          if (!loop && wordIndex.current === phrases.length - 1) return
          run('dissolve')
        } else if (nextPhase === 'dissolve' && overlap) {
          wordIndex.current = (wordIndex.current + 1) % phrases.length
          setIndex(wordIndex.current)
          run('condense', Math.min(1, overlap * Math.max(.05, dissolve) / Math.max(.05, condense)))
        } else if (nextPhase === 'dissolve') run('gap')
        else {
          wordIndex.current = (wordIndex.current + 1) % phrases.length
          setIndex(wordIndex.current)
          run('condense')
        }
      } })
      if (!active.current || nextPhase === 'hold' && pauseOnHover && hovered) control.current.pause()
    }
  }, [progress, run, condense, hold, dissolve, gap, loop, phrases.length, pauseOnHover, hovered, overlap])

  useEffect(() => {
    started.current = false
    wordIndex.current = 0
    setIndex(0)
    phaseRef.current = 'condense'
    setPhase('condense')
    incoming.current = null
    progress.set(0)
    trails.current = []
    return () => { control.current?.stop(); resources.current = null }
  }, [wordsKey, preset, progress])

  useEffect(() => {
    const element = root.current
    const surface = canvas.current
    if (!element || !surface || reducedMotion) return
    let disposed = false
    let generation = 0
    setReady(false)
    const build = async () => {
      const version = ++generation
      const computed = getComputedStyle(element)
      const fontSize = parseFloat(computed.fontSize)
      const font = `${computed.fontWeight} ${fontSize}px ${computed.fontFamily}`
      await document.fonts.load(font, phrases.join('')).catch(() => [])
      if (disposed || version !== generation) return
      const width = element.clientWidth
      const height = element.clientHeight
      if (!width || !height) return
      const pixelRatio = Math.min(window.devicePixelRatio || 1, Math.max(1, Math.min(2, dpr)))
      const padding = Math.ceil(fontSize * Math.max(.5, spread) * Math.max(1.8, Math.abs(rise) + .7))
      const fullWidth = width + padding * 2
      const fullHeight = height + padding * 2
      const bounds = element.getBoundingClientRect()
      const leftPadding = Math.min(padding, Math.max(0, bounds.left))
      const rightPadding = Math.min(padding, Math.max(0, window.innerWidth - bounds.right))
      const canvasWidth = width + leftPadding + rightPadding
      const offsetX = padding - leftPadding
      surface.width = Math.ceil(canvasWidth * pixelRatio)
      surface.height = Math.ceil(fullHeight * pixelRatio)
      Object.assign(surface.style, { left: `${-leftPadding}px`, top: `${-padding}px`, width: `${canvasWidth}px`, height: `${fullHeight}px` })
      element.style.setProperty('overflow-clip-margin', `${padding}px`)
      const frontColor = color === 'currentColor' ? computed.color : color
      const limit = window.matchMedia('(max-width: 600px)').matches ? 4000 : 10000
      const bitmaps = phrases.map(phrase => {
        const bitmap = document.createElement('canvas')
        bitmap.width = Math.ceil(width * pixelRatio)
        bitmap.height = Math.ceil(height * pixelRatio)
        const context = bitmap.getContext('2d')
        if (!context) return null
        context.scale(pixelRatio, pixelRatio)
        context.font = font
        context.textAlign = align === 'start' ? 'left' : align === 'end' ? 'right' : 'center'
        context.textBaseline = 'middle'
        context.fillStyle = frontColor
        const lineHeight = parseFloat(computed.lineHeight) || fontSize * 1.2
        const lines = phrase.split('\n')
        const position = align === 'start' ? 0 : align === 'end' ? width : width / 2
        lines.forEach((line, lineIndex) => context.fillText(line, position, height / 2 + (lineIndex - (lines.length - 1) / 2) * lineHeight))
        return sampleVaporWord(bitmap, width, height, padding, pixelRatio, density, { spread, rise, turbulence, diffusion, grain, sweep }, fontSize, limit)
      })
      if (bitmaps.some(bitmap => !bitmap)) return
      const paletteCanvas = document.createElement('canvas')
      paletteCanvas.width = paletteCanvas.height = 1
      const paletteContext = paletteCanvas.getContext('2d')
      if (!paletteContext) return
      resources.current = { words: bitmaps as VaporWord[], width: fullWidth, height: fullHeight, textWidth: width, textHeight: height, fontSize, padding, offsetX, pixelRatio, palette: vaporPalette(paletteContext, frontColor, vaporColor === 'currentColor' ? computed.color : vaporColor) }
      dirty.current = true
      setReady(true)
    }
    const observer = new ResizeObserver(() => { void build() })
    observer.observe(element)
    return () => { disposed = true; observer.disconnect(); resources.current = null }
  }, [wordsKey, phrases, reducedMotion, align, color, vaporColor, density, sweep, spread, rise, turbulence, diffusion, grain, dpr, preset])

  useEffect(() => {
    active.current = !paused && !reducedMotion && documentVisible && (inView || !startOnView)
    if (!active.current) control.current?.pause()
    if (!ready || reducedMotion || !resources.current) return
    if (!started.current && active.current) { started.current = true; run('condense') }
    if (!active.current || phase === 'hold' && pauseOnHover && hovered) control.current?.pause()
    else control.current?.play()
    dirty.current = true
  }, [ready, reducedMotion, paused, documentVisible, inView, startOnView, phase, pauseOnHover, hovered, run, wordsKey, preset])

  const next = useCallback(() => {
    if (!resources.current || paused || reducedMotion || phaseRef.current === 'dissolve' || phaseRef.current === 'gap') return
    run('dissolve')
  }, [paused, reducedMotion, run])
  const replay = useCallback(() => {
    if (!resources.current || paused || reducedMotion) return
    wordIndex.current = 0
    incoming.current = null
    setIndex(0)
    run('condense')
  }, [paused, reducedMotion, run])
  useImperativeHandle(forwardedRef, () => ({ next, replay }), [next, replay])

  useEffect(() => {
    const element = root.current
    if (!element || !interactive || reducedMotion) return
    const target = area === 'window' ? window : area === 'parent' ? element.parentElement || element : element
    let lastX = 0
    let lastY = 0
    let lastTime = 0
    let wasHovered = false
    const move = (event: Event) => {
      const pointer = event as PointerEvent
      const current = resources.current
      if (pointer.pointerType !== 'mouse' || !current || paused) return
      const bounds = element.getBoundingClientRect()
      const pointerX = pointer.clientX - bounds.left + current.padding
      const pointerY = pointer.clientY - bounds.top + current.padding
      const overText = pointer.clientX >= bounds.left && pointer.clientX <= bounds.right && pointer.clientY >= bounds.top && pointer.clientY <= bounds.bottom
      if (overText !== wasHovered) { wasHovered = overText; setHovered(overText) }
      const now = performance.now()
      const distance = Math.hypot(pointerX - lastX, pointerY - lastY)
      if (lastTime && distance < current.fontSize * .025) return
      const speed = lastTime ? Math.min(2, distance / Math.max(1, now - lastTime) * 100 / current.fontSize) : .25
      trails.current = [...trails.current.slice(-3), { x: pointerX, y: pointerY, time: now, strength: Math.max(0, breath) * (.35 + speed) }]
      lastX = pointerX
      lastY = pointerY
      lastTime = now
      dirty.current = true
    }
    const leave = () => { wasHovered = false; setHovered(false) }
    target.addEventListener('pointermove', move, { passive: true })
    target.addEventListener('pointerleave', leave)
    window.addEventListener('blur', leave)
    return () => { target.removeEventListener('pointermove', move); target.removeEventListener('pointerleave', leave); window.removeEventListener('blur', leave) }
  }, [interactive, reducedMotion, area, paused, breath])

  useAnimationFrame(() => {
    const current = resources.current
    const context = canvas.current?.getContext('2d')
    if (!current || !context || !inView || !documentVisible || reducedMotion) return
    if (paused && started.current) return
    const now = performance.now()
    trails.current = trails.current.filter(point => now - point.time < Math.max(.05, recovery) * 1000)
    if (!dirty.current && !trails.current.length) return
    dirty.current = trails.current.length > 0
    context.setTransform(current.pixelRatio, 0, 0, current.pixelRatio, -current.offsetX * current.pixelRatio, 0)
    context.clearRect(0, 0, current.width, current.height)
    const word = current.words[wordIndex.current]
    if (!word) return
    if (phaseRef.current === 'hold' && !trails.current.length || paused && !started.current) {
      context.drawImage(word.bitmap, current.padding, current.padding, current.textWidth, current.textHeight)
      return
    }
    const stage = progress.get()
    const waveStagger = Math.min(1, Math.max(0, stagger))
    const drawWord = (renderWord: VaporWord, renderPhase: Phase, renderProgress: number, pointerInteraction: boolean) => {
      for (const particle of renderWord.particles) {
        let delay = particle.delay
        if (pointerInteraction && impact.current && renderPhase === 'dissolve') delay = Math.min(1, Math.hypot(particle.x - impact.current.x, particle.y - impact.current.y) / Math.max(1, current.fontSize * 2))
        const start = delay * waveStagger
        const local = Math.max(0, Math.min(1, (renderProgress - start) / Math.max(.04, 1 - start)))
        let travel = renderPhase === 'condense' ? 1 - local : renderPhase === 'dissolve' ? local : renderPhase === 'gap' ? 1 + renderProgress * .4 : 0
        if (pointerInteraction) for (const point of trails.current) {
          const influence = Math.max(0, 1 - Math.hypot(particle.x - point.x, particle.y - point.y) / Math.max(1, breathRadius * current.fontSize))
          travel = Math.max(travel, Math.min(1, influence * point.strength * (1 - (now - point.time) / (Math.max(.05, recovery) * 1000))))
        }
        if (travel < .025) {
          context.globalAlpha = 1
          const cell = renderWord.cellSize
          context.drawImage(renderWord.bitmap, (particle.x - current.padding) * current.pixelRatio, (particle.y - current.padding) * current.pixelRatio, cell * current.pixelRatio, cell * current.pixelRatio, particle.x, particle.y, cell, cell)
          continue
        }
        const lifespan = 1.04 + particle.seed * .28
        if (travel >= lifespan) continue
        const pathPosition = Math.min(11.999, travel * 12)
        const pathIndex = Math.floor(pathPosition) * 2
        const fraction = pathPosition - Math.floor(pathPosition)
        const extension = Math.max(0, travel - 1) * 12
        const horizontalDirection = renderPhase === 'condense' && (sweep === 'left' || sweep === 'right') ? -1 : 1
        const verticalDirection = renderPhase === 'condense' && sweep === 'top' ? -1 : 1
        const driftX = (particle.path[pathIndex] + (particle.path[pathIndex + 2] - particle.path[pathIndex]) * fraction + (particle.path[24] - particle.path[22]) * extension) * horizontalDirection
        const driftY = (particle.path[pathIndex + 1] + (particle.path[pathIndex + 3] - particle.path[pathIndex + 1]) * fraction + (particle.path[25] - particle.path[23]) * extension) * verticalDirection
        const radius = Math.max(.4, particleSize) * (1 + travel * .3) * (.7 + particle.seed * .6)
        context.globalAlpha = particle.alpha * Math.pow(Math.max(0, Math.min(1, (lifespan - travel) / .9)), .8)
        context.fillStyle = current.palette[Math.min(15, Math.floor(travel * 18))]
        context.fillRect(particle.x + driftX, particle.y + driftY, radius, radius)
      }
    }
    drawWord(word, phaseRef.current, stage, true)
    if (phaseRef.current === 'dissolve' && incoming.current) {
      const incomingWord = current.words[incoming.current.index]
      const incomingProgress = Math.max(0, Math.min(1, (stage - (1 - overlap)) * Math.max(.05, dissolve) / Math.max(.05, condense)))
      drawWord(incomingWord, 'condense', incomingProgress, false)
    }
    context.globalAlpha = 1
  })

  return <Element ref={(element: HTMLElement | null) => { root.current = element }} id={id} className={cn('relative inline-grid max-w-full overflow-clip align-baseline', className)} style={{ ...style, ...(color !== 'currentColor' ? { color } : {}) }} data-vapor-ready={ready} data-vapor-phase={phase} data-vapor-word={index} data-vapor-preset={preset}>
    <span className="sr-only">{phrases[0]}</span>
    {phrases.map((phrase, phraseIndex) => <span key={phraseIndex} aria-hidden="true" className="invisible whitespace-pre [grid-area:1/1]">{phrase || '\u00a0'}</span>)}
    <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0 whitespace-pre', align === 'start' ? 'text-start' : align === 'end' ? 'text-end' : 'text-center', ready && !reducedMotion && 'invisible')}>{phrases[0]}</span>
    <canvas ref={canvas} aria-hidden="true" className={cn('pointer-events-none absolute', (!ready || reducedMotion) && 'invisible')} />
    {clickAdvance && <button type="button" aria-label="Advance vapor text" disabled={!ready || paused || Boolean(reducedMotion)} className="absolute inset-0 cursor-pointer touch-pan-y border-0 bg-transparent p-0 outline-none focus-visible:ring-1 focus-visible:ring-current disabled:cursor-default" onClick={event => {
      if (event.detail && resources.current) {
        const bounds = event.currentTarget.getBoundingClientRect()
        impact.current = { x: event.clientX - bounds.left + resources.current.padding, y: event.clientY - bounds.top + resources.current.padding }
      }
      next()
    }} />}
  </Element>
})

export default VaporText
