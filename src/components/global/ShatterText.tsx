import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { animate, useAnimationFrame, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, type AnimationPlaybackControls } from 'framer-motion'
import { createGlassShards, type GlassShard, type Point } from './shatterTextGeometry'
import { cn } from '@/lib/utils'

export type ShatterTextHandle = { shatter: (x?: number, y?: number) => void; assemble: () => void }
export type ShatterTextProps = {
  text: string
  className?: string
  style?: CSSProperties
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  colors?: [string, string]
  accentColor?: string
  shardSize?: number
  irregularity?: number
  crack?: number
  crackRadius?: number
  shatterRadius?: number
  force?: number
  introDuration?: number
  reassembleDuration?: number
  autoShatter?: boolean
  interactive?: boolean
  paused?: boolean
  onShatter?: () => void
}

type RenderResources = {
  front: HTMLCanvasElement
  back: HTMLCanvasElement
  shards: GlassShard[]
  width: number
  height: number
  fontSize: number
  pixelRatio: number
}

const ShatterText = forwardRef<ShatterTextHandle, ShatterTextProps>(function ShatterText({ text, className = '', style, as: Heading = 'h2', fontFamily, fontSize, fontWeight = 700, colors, accentColor = '#7b5cff', shardSize = .09, irregularity = .6, crack = .6, crackRadius = .5, shatterRadius = .75, force = 1, introDuration = 1.6, reassembleDuration = 1.1, autoShatter = true, interactive = true, paused = false, onShatter }, forwardedRef) {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const resources = useRef<RenderResources | null>(null)
  const dirty = useRef(true)
  const entered = useRef(false)
  const autoPlayed = useRef(false)
  const impact = useRef<Point>({ x: 0, y: 0 })
  const introControl = useRef<AnimationPlaybackControls | null>(null)
  const burstControl = useRef<AnimationPlaybackControls | null>(null)
  const [ready, setReady] = useState(false)
  const reducedMotion = useReducedMotion()
  const inView = useInView(root, { amount: .15 })
  const assembly = useMotionValue(0)
  const burst = useMotionValue(0)
  const pointerX = useSpring(-10000, { stiffness: 260, damping: 30 })
  const pointerY = useSpring(-10000, { stiffness: 260, damping: 30 })
  const hover = useSpring(0, { stiffness: 100, damping: 20 })
  const markDirty = useCallback(() => { dirty.current = true }, [])
  useMotionValueEvent(assembly, 'change', markDirty)
  useMotionValueEvent(burst, 'change', markDirty)
  useMotionValueEvent(pointerX, 'change', markDirty)
  useMotionValueEvent(pointerY, 'change', markDirty)
  useMotionValueEvent(hover, 'change', markDirty)

  const shatter = useCallback((x?: number, y?: number) => {
    const current = resources.current
    if (!current || reducedMotion || paused) return
    const target = current.shards[Math.floor(current.shards.length * .48)]
    impact.current = { x: x ?? target?.center.x ?? current.width / 2, y: y ?? target?.center.y ?? current.height / 2 }
    burstControl.current?.stop()
    burst.set(0)
    burstControl.current = animate(burst, [0, 1, 1, 0], { duration: .65 + Math.max(.1, reassembleDuration), times: [0, .2, .36, 1], ease: ['easeOut', 'linear', [.22, 1, .36, 1]] })
    onShatter?.()
  }, [burst, reducedMotion, paused, reassembleDuration, onShatter])

  const assemble = useCallback(() => {
    if (reducedMotion || paused) return
    burstControl.current?.stop()
    burst.set(0)
    introControl.current?.stop()
    assembly.set(0)
    introControl.current = animate(assembly, 1, { duration: Math.max(.1, introDuration), ease: [.22, 1, .36, 1] })
  }, [assembly, burst, introDuration, reducedMotion, paused])
  useImperativeHandle(forwardedRef, () => ({ shatter, assemble }), [shatter, assemble])

  useEffect(() => {
    entered.current = false
    autoPlayed.current = false
    assembly.set(0)
    burst.set(0)
    return () => { introControl.current?.stop(); burstControl.current?.stop() }
  }, [text, assembly, burst])

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
      const family = fontFamily || computed.fontFamily
      const requestedSize = fontSize || parseFloat(computed.fontSize)
      await document.fonts.load(`${fontWeight} ${requestedSize}px ${family}`, text).catch(() => [])
      if (disposed || version !== generation) return
      const width = element.clientWidth
      const height = element.clientHeight
      if (!width || !height) return
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
      const front = document.createElement('canvas')
      const back = document.createElement('canvas')
      front.width = back.width = surface.width = Math.ceil(width * pixelRatio)
      front.height = back.height = surface.height = Math.ceil(height * pixelRatio)
      const context = front.getContext('2d')
      const backContext = back.getContext('2d')
      if (!context || !backContext) return
      const lines = text.split('\n')
      context.font = `${fontWeight} ${requestedSize}px ${family}`
      const measuredWidth = Math.max(1, ...lines.map(line => context.measureText(line).width))
      const fittedSize = Math.max(1, Math.min(requestedSize, requestedSize * (width * .88) / measuredWidth, height * .72 / (lines.length * 1.1)))
      const lineHeight = fittedSize * 1.1
      const textHeight = lineHeight * lines.length
      const top = (height - textHeight) / 2
      context.scale(pixelRatio, pixelRatio)
      context.font = `${fontWeight} ${fittedSize}px ${family}`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      const gradient = context.createLinearGradient(width * .1, 0, width * .9, height)
      gradient.addColorStop(0, colors?.[0] || computed.color)
      gradient.addColorStop(1, colors?.[1] || computed.color)
      context.fillStyle = gradient
      lines.forEach((line, index) => context.fillText(line, width / 2, top + lineHeight * (index + .5)))
      backContext.drawImage(front, 0, 0)
      backContext.globalCompositeOperation = 'source-in'
      backContext.fillStyle = accentColor
      backContext.fillRect(0, 0, back.width, back.height)
      const shards = createGlassShards(front, { left: width * .04, top: Math.max(0, top - fittedSize * .2), width: width * .92, height: Math.min(height, textHeight + fittedSize * .4) }, fittedSize, Math.max(.03, shardSize), Math.min(1, Math.max(0, irregularity)), pixelRatio)
      resources.current = { front, back, shards, width, height, fontSize: fittedSize, pixelRatio }
      dirty.current = true
      setReady(true)
    }
    const observer = new ResizeObserver(() => { void build() })
    observer.observe(element)
    return () => { disposed = true; observer.disconnect(); resources.current = null }
  }, [text, fontFamily, fontSize, fontWeight, colors?.[0], colors?.[1], accentColor, shardSize, irregularity, reducedMotion])

  useEffect(() => {
    if (!ready || reducedMotion || !inView || paused || entered.current) return
    entered.current = true
    introControl.current = animate(assembly, 1, { duration: Math.max(.1, introDuration), ease: [.22, 1, .36, 1], onComplete: () => {
      if (!autoShatter || autoPlayed.current) return
      autoPlayed.current = true
      shatter()
    } })
  }, [ready, reducedMotion, inView, paused, introDuration, autoShatter, assembly, shatter, text])

  useEffect(() => {
    dirty.current = true
    for (const control of [introControl.current, burstControl.current]) {
      if (paused || !inView) control?.pause()
      else control?.play()
    }
  }, [paused, inView])

  useAnimationFrame(() => {
    const current = resources.current
    const context = canvas.current?.getContext('2d')
    if (!current || !context || !inView || reducedMotion || !dirty.current) return
    dirty.current = false
    const { front, back, width, height, pixelRatio, fontSize: size, shards } = current
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    context.clearRect(0, 0, width, height)
    const introduction = paused && !entered.current ? 0 : 1 - assembly.get()
    const explosion = burst.get()
    const cursor = { x: pointerX.get(), y: pointerY.get() }
    const fragments: { shard: GlassShard; offsetX: number; offsetY: number; turn: number; scale: number; rotation: number }[] = []
    if (introduction < .0001) context.drawImage(front, 0, 0, width, height)
    for (const shard of shards) {
      const distance = Math.hypot(shard.center.x - impact.current.x, shard.center.y - impact.current.y)
      const reach = Math.max(1, size * shatterRadius)
      const influence = Math.max(0, 1 - distance / reach)
      const flight = explosion * Math.pow(influence, .55)
      const cursorDistance = Math.hypot(shard.center.x - cursor.x, shard.center.y - cursor.y)
      const fracture = Math.max(0, 1 - cursorDistance / Math.max(1, size * crackRadius)) * hover.get() * crack * (1 - flight)
      if (introduction < .0001 && flight < .0001 && fracture < .0001) continue
      const angle = Math.atan2(shard.center.y - impact.current.y, shard.center.x - impact.current.x) + (shard.seed - .5) * .8
      const travel = flight * size * force * (1.2 + shard.seed * 2)
      const introAngle = shard.seed * Math.PI * 2
      const introTravel = introduction * size * (1 + shard.seed * 2)
      const crackAngle = Math.atan2(shard.center.y - cursor.y, shard.center.x - cursor.x)
      const offsetX = Math.cos(angle) * travel + Math.cos(introAngle) * introTravel + Math.cos(crackAngle) * fracture * size * .025
      const offsetY = Math.sin(angle) * travel + Math.sin(introAngle) * introTravel + Math.sin(crackAngle) * fracture * size * .025
      const turn = (flight * (1.5 + shard.seed * 3) + introduction * (shard.seed - .5) * 3) * Math.PI
      const scale = (1 - fracture * .035) * (1 + flight * .15)
      fragments.push({ shard, offsetX, offsetY, turn, scale, rotation: flight * (shard.seed - .5) * 4 + introduction * (shard.seed - .5) * 2 + fracture * (shard.seed - .5) * .12 })
    }
    if (introduction < .0001) {
      context.save()
      context.globalCompositeOperation = 'destination-out'
      context.beginPath()
      for (const { shard } of fragments) {
        shard.points.forEach((point, index) => {
          if (index === 0) context.moveTo(point.x, point.y)
          else context.lineTo(point.x, point.y)
        })
        context.closePath()
      }
      context.fill()
      context.restore()
    }
    for (const { shard, offsetX, offsetY, turn, scale, rotation } of fragments) {
      context.save()
      context.translate(shard.center.x + offsetX, shard.center.y + offsetY)
      context.rotate(rotation)
      context.transform(Math.cos(turn) * scale, 0, Math.sin(turn) * .15, scale, 0, 0)
      context.globalAlpha = 1 - introduction * .85
      context.beginPath()
      shard.points.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x - shard.center.x, point.y - shard.center.y)
        else context.lineTo(point.x - shard.center.x, point.y - shard.center.y)
      })
      context.closePath()
      context.clip()
      const { left, top, width: shardWidth, height: shardHeight } = shard.bounds
      context.drawImage(Math.cos(turn) < 0 ? back : front, left * pixelRatio, top * pixelRatio, shardWidth * pixelRatio, shardHeight * pixelRatio, left - shard.center.x, top - shard.center.y, shardWidth, shardHeight)
      context.restore()
    }
  })

  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse' || paused) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (hover.get() < .01) { pointerX.jump(event.clientX - bounds.left); pointerY.jump(event.clientY - bounds.top) }
    else { pointerX.set(event.clientX - bounds.left); pointerY.set(event.clientY - bounds.top) }
    hover.set(1)
  }

  return <div ref={root} className={cn('relative isolate min-h-60 w-full font-heading text-[clamp(3rem,12vw,12rem)] leading-[1.05]', className)} style={{ ...style, ...(fontFamily ? { fontFamily } : {}), ...(fontSize ? { fontSize } : {}) }} data-shatter-ready={ready}>
    <Heading className={ready && !reducedMotion ? 'sr-only' : 'pointer-events-none absolute inset-0 flex items-center justify-center whitespace-pre-wrap text-center text-[inherit] leading-[inherit]'}>{text}</Heading>
    <button type="button" aria-label={`Shatter ${text.replaceAll('\n', ' ')}`} disabled={!interactive || paused || Boolean(reducedMotion) || !ready} className="absolute inset-0 block h-full w-full cursor-pointer touch-pan-y border-0 bg-transparent p-0 outline-none focus-visible:ring-1 focus-visible:ring-current focus-visible:ring-offset-4 disabled:cursor-default" onPointerMove={move} onPointerLeave={() => hover.set(0)} onBlur={() => hover.set(0)} onClick={event => {
      const bounds = event.currentTarget.getBoundingClientRect()
      shatter(event.detail === 0 ? undefined : event.clientX - bounds.left, event.detail === 0 ? undefined : event.clientY - bounds.top)
    }}>
      <canvas ref={canvas} aria-hidden="true" className={`pointer-events-none h-full w-full ${ready && !reducedMotion ? 'visible' : 'invisible'}`} />
    </button>
  </div>
})

export default ShatterText
