import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useMotionValueEvent, type MotionValue } from 'framer-motion'
import { AdditiveBlending, Vector2, type Points, type ShaderMaterial } from 'three'
import { createValueParticles, getValueParticlePlacement, getValueParticleScrollBurst } from './particle-data'
import { valueParticleFragment, valueParticleVertex } from './particle-shaders'

type ValueParticlesProps = {
  sectionRef: RefObject<HTMLElement | null>
  compact: boolean
  visible: boolean
  still: boolean
  progress: MotionValue<number>
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
  burst: MotionValue<number>
  time: MotionValue<number>
}

export function ValueParticles({ sectionRef, compact, visible, still, progress, pointerX, pointerY, burst, time }: ValueParticlesProps) {
  const points = useRef<Points>(null)
  const material = useRef<ShaderMaterial>(null)
  const visual = useRef<HTMLElement | null>(null)
  const placement = useRef({ horizontal: 0, vertical: 0, scale: 1, visible: false })
  const frozenTime = useRef(0)
  const visualProgress = useRef(0)
  const { size, viewport, gl, invalidate } = useThree()
  const data = useMemo(() => createValueParticles(compact ? 850 : 2400, compact ? 60 : 150, compact ? 6 : 12), [compact])
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uBurst: { value: 0 }, uScrollBurst: { value: 0 },
    uDpr: { value: 1 }, uPointer: { value: new Vector2() },
  }), [])

  useEffect(() => {
    const element = sectionRef.current?.querySelector<HTMLElement>('[data-value-particles]')
    if (!element) return
    visual.current = element
    let frame: number | null = null
    const measure = () => {
      frame = null
      const bounds = element.getBoundingClientRect()
      placement.current = getValueParticlePlacement(bounds, size, viewport)
      visualProgress.current = Math.max(0, Math.min(1, (size.height - bounds.top) / (size.height + bounds.height)))
      invalidate()
    }
    const schedule = () => { if (frame === null) frame = requestAnimationFrame(measure) }
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    window.addEventListener('scroll', schedule, { passive: true })
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      if (frame !== null) cancelAnimationFrame(frame)
      delete element.dataset.valueParticlesReady
      visual.current = null
    }
  }, [sectionRef, size, viewport, invalidate])

  useMotionValueEvent(progress, 'change', () => invalidate())
  useMotionValueEvent(pointerX, 'change', () => invalidate())
  useMotionValueEvent(pointerY, 'change', () => invalidate())
  useMotionValueEvent(burst, 'change', () => invalidate())

  useFrame(() => {
    if (!points.current || !material.current) return
    const current = placement.current
    points.current.visible = visible && current.visible
    if (!points.current.visible) return
    points.current.position.set(current.horizontal, current.vertical, 0)
    points.current.scale.setScalar(current.scale)
    if (!still) frozenTime.current = time.get() / 1000
    const values = material.current.uniforms
    values.uTime.value = frozenTime.current
    values.uScrollBurst.value = getValueParticleScrollBurst(progress.get())
    if (compact) values.uScrollBurst.value = getValueParticleScrollBurst(visualProgress.current)
    values.uPointer.value.set(pointerX.get(), pointerY.get())
    values.uBurst.value = burst.get()
    values.uDpr.value = gl.getPixelRatio()
    if (visual.current) visual.current.dataset.valueParticlesReady = 'true'
  })

  return <points ref={points} visible={false} frustumCulled={false}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      <bufferAttribute attach="attributes-seed" args={[data.seeds, 1]} />
      <bufferAttribute attach="attributes-colorMix" args={[data.colors, 1]} />
      <bufferAttribute attach="attributes-kind" args={[data.kinds, 1]} />
    </bufferGeometry>
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={valueParticleVertex} fragmentShader={valueParticleFragment} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
  </points>
}
