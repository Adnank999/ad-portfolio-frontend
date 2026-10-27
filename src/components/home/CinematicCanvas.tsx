import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei/core/PerformanceMonitor'
import { useMotionValueEvent, type MotionValue } from 'framer-motion'
import { Color, ShaderMaterial } from 'three'
import { HeroShader } from './shaders-glsl/HeroShader'
import { useHeroShaderVisibility } from './hooks/useHeroShaderVisibility'
import { ValueParticles } from './cinematic/value/ValueParticles'
import type { HeroShaderControls } from './shaders-glsl/ShaderControls'
import inkVertex from './shaders/inkVertex.glsl?raw'
import inkFragment from './shaders/inkFragment.glsl?raw'

export type InkUniforms = {
  uReveal: { value: number }
  uReverse: { value: number }
  uAspect: { value: number }
  uInk: { value: Color }
  uPaper: { value: Color }
}

export type CinematicSceneProps = {
  reveal: MotionValue<number>
  reverse: MotionValue<number>
  heroProgress: MotionValue<number>
  experimentProgress: MotionValue<number>
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
  burst: MotionValue<number>
  time: MotionValue<number>
  compact: boolean
  still: boolean
  staticLayout: boolean
  heroRef: RefObject<HTMLElement | null>
  experimentRef: RefObject<HTMLElement | null>
  onHeroReady: (ready: boolean) => void
  heroControls: HeroShaderControls
}

function CinematicScene(props: CinematicSceneProps & { heroVisible: boolean; heroMounted: boolean; heroRequested: boolean; experimentVisible: boolean; experimentRequested: boolean; lowQuality: boolean }) {
  const { reveal, reverse, heroProgress, experimentProgress, pointerX, pointerY, burst, time, still, compact, heroVisible, experimentVisible, lowQuality } = props
  const uniforms = useMemo<InkUniforms>(() => ({
    uReveal: { value: 0 }, uReverse: { value: 0 }, uAspect: { value: 1 },
    uInk: { value: new Color('#171717').convertLinearToSRGB() },
    uPaper: { value: new Color('#faf9f6').convertLinearToSRGB() },
  }), [])
  const ink = useRef<ShaderMaterial>(null)
  const { size, invalidate } = useThree()

  useFrame((_, delta) => {
    if (!still && !document.hidden && (heroVisible || experimentVisible)) time.set(time.get() + Math.min(.045, delta) * 1000)
  }, -2)

  useMotionValueEvent(reveal, 'change', value => {
    if (ink.current) ink.current.uniforms.uReveal.value = value
    invalidate()
  })
  useMotionValueEvent(reverse, 'change', value => {
    if (ink.current) ink.current.uniforms.uReverse.value = value
    invalidate()
  })
  useMotionValueEvent(heroProgress, 'change', () => invalidate())

  useEffect(() => {
    uniforms.uAspect.value = size.width / size.height
    invalidate()
  }, [size.width, size.height, uniforms, invalidate, heroVisible, experimentVisible, still])

  useFrame(() => {
    if (ink.current) {
      ink.current.uniforms.uReveal.value = reveal.get()
      ink.current.uniforms.uReverse.value = reverse.get()
      ink.current.uniforms.uAspect.value = size.width / size.height
    }
  })

  return <>
    {!props.staticLayout && <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={ink} uniforms={uniforms} vertexShader={inkVertex} fragmentShader={inkFragment} depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>}
    {(props.heroRequested || props.heroMounted) && <HeroShader time={time} progress={heroProgress} heroRef={props.heroRef} allocated={props.heroMounted} visible={heroVisible} still={still} compact={compact || lowQuality} onReady={props.onHeroReady} controls={props.heroControls} />}
    {props.experimentRequested && <ValueParticles sectionRef={props.experimentRef} compact={compact || lowQuality} visible={experimentVisible} still={still} progress={experimentProgress} pointerX={pointerX} pointerY={pointerY} burst={burst} time={time} />}
  </>
}

export default function CinematicCanvas(props: CinematicSceneProps & { onUnavailable: () => void }) {
  const [supported, setSupported] = useState(false)
  const [experimentVisible, setExperimentVisible] = useState(false)
  const [experimentRequested, setExperimentRequested] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(true)
  const { visible: heroVisible, mounted: heroMounted } = useHeroShaderVisibility(props.heroRef, supported && documentVisible)
  const [heroRequested, setHeroRequested] = useState(false)
  const [lowQuality, setLowQuality] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const invalidateRef = useRef<(() => void) | null>(null)
  const continuous = !props.still && documentVisible && (heroVisible || experimentVisible)

  useEffect(() => { if (heroMounted) setHeroRequested(true) }, [heroMounted])

  useEffect(() => {
    if (!supported || !props.compact || !continuous) return
    const timer = window.setInterval(() => invalidateRef.current?.(), 1000 / 30)
    return () => window.clearInterval(timer)
  }, [supported, props.compact, continuous])

  useEffect(() => {
    const probe = document.createElement('canvas')
    try {
      const context = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
      setSupported(Boolean(context))
      if (!context) props.onUnavailable()
      context?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch { setSupported(false); props.onUnavailable() }
  }, [props.onUnavailable])

  useEffect(() => {
    const experiment = props.experimentRef.current
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === experiment) {
          setExperimentVisible(entry.isIntersecting)
          if (entry.isIntersecting) setExperimentRequested(true)
        }
      }
    })
    if (experiment) observer.observe(experiment)
    const update = () => setDocumentVisible(!document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [props.experimentRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const lost = (event: Event) => { event.preventDefault(); setSupported(false); props.onUnavailable() }
    canvas.addEventListener('webglcontextlost', lost)
    return () => canvas.removeEventListener('webglcontextlost', lost)
  }, [supported, props.onUnavailable])

  if (!supported) return null
  return <div className="cinema-webgl" data-hero-visible={heroVisible} data-hero-allocated={heroMounted} aria-hidden="true">
    <Canvas ref={canvasRef} onCreated={({ invalidate, gl }) => { invalidateRef.current = invalidate; gl.setClearColor('#171717', 1) }} camera={{ position: [0, 0, 5], fov: 45 }} dpr={props.compact || lowQuality ? 1 : [1, 1.5]} frameloop={continuous && !props.compact ? 'always' : 'demand'} gl={{ alpha: false, antialias: !props.compact, powerPreference: props.compact ? 'low-power' : 'high-performance' }} fallback={null}>
      {continuous && <PerformanceMonitor onDecline={() => setLowQuality(true)} flipflops={1} onFallback={() => setLowQuality(true)} />}
      <CinematicScene {...props} heroVisible={heroVisible} heroMounted={heroMounted} heroRequested={heroRequested} experimentVisible={experimentVisible} experimentRequested={experimentRequested} lowQuality={lowQuality} />
    </Canvas>
  </div>
}
