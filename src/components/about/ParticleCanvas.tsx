import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { MotionValue } from 'framer-motion'
import { AdditiveBlending, MathUtils, ShaderMaterial, type Points } from 'three'
import { createParticleCloud, createParticleShapes, loadParticleMasks, type ParticleMask } from './particleShapes'

const vertexShader = `
  attribute vec3 aDesign;
  attribute vec3 aBuild;
  attribute vec3 aShip;
  attribute float aHue;
  attribute float aSeed;
  attribute float aKind;
  uniform float uProgress;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uViewportWidth;
  uniform float uGlowScale;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vKind;
  varying float vHot;
  void main() {
    float stage = clamp(uProgress, 0.0, 3.0);
    vec3 point = stage < 1.0 ? mix(position, aDesign, smoothstep(0.0, 1.0, stage))
      : stage < 2.0 ? mix(aDesign, aBuild, smoothstep(1.0, 2.0, stage))
      : mix(aBuild, aShip, smoothstep(2.0, 3.0, stage));
    point += sin(point.yzx * 5.0 + uTime * 0.45) * 0.013;
    float floating = step(0.5, aKind) * (1.0 - step(1.5, aKind));
    float aura = step(1.5, aKind);
    float edge = 1.0;
    if (floating > 0.5) {
      point.x = position.x * uViewportWidth * 0.5 + sin(uTime * 0.18 + aSeed * 63.0) * 0.075;
      point.y = mod(position.y + uTime * mix(0.025, 0.065, aSeed) + 2.4, 4.8) - 2.4;
      point.z = position.z + sin(uTime * 0.13 + aSeed * 41.0) * 0.12;
      edge = 1.0 - smoothstep(1.75, 2.35, abs(point.y));
    }
    vec4 viewPosition = modelViewMatrix * vec4(point, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    vHot = smoothstep(0.88, 1.0, aSeed);
    float diameter = mix(3.5, 8.0, aSeed * aSeed) + vHot * vHot * 21.0;
    diameter = mix(diameter, mix(3.0, 12.0, aSeed * aSeed), floating);
    diameter = mix(diameter, mix(130.0, 210.0, aSeed), aura);
    gl_PointSize = clamp(diameter * 5.6 / -viewPosition.z, 2.0, 240.0) * uPixelRatio;
    float twinkle = 0.74 + 0.26 * sin(uTime * mix(0.55, 1.1, aSeed) + aSeed * 93.0);
    vAlpha = clamp(0.85 + point.z * 0.25, 0.3, 1.0) * twinkle * edge * uGlowScale;
    vAlpha *= mix(1.0, 0.64, floating);
    vec3 rainbow = clamp(abs(fract(aHue + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    vColor = mix(vec3(1.0), rainbow, 0.92);
    vKind = aKind;
  }
`
const fragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vKind;
  varying float vHot;
  void main() {
    vec2 centered = (gl_PointCoord - 0.5) * 2.0;
    float radiusSquared = dot(centered, centered);
    if (radiusSquared > 1.0) discard;
    float edge = 1.0 - smoothstep(0.55, 1.0, radiusSquared);
    if (vKind > 1.5) {
      gl_FragColor = vec4(vColor, exp(-radiusSquared * 4.5) * edge * vAlpha * 0.065);
      return;
    }
    float core = exp(-radiusSquared * 44.0);
    float innerGlow = exp(-radiusSquared * 16.0) * 0.36;
    float halo = exp(-radiusSquared * 4.0) * mix(0.10, 0.24, vHot);
    vec3 color = vColor * (1.05 + core * 0.30) + vec3(core * vHot * 0.15);
    gl_FragColor = vec4(color, min(1.0, (core * 1.7 + innerGlow + halo) * edge * vAlpha));
  }
`

function Sculpture({ progress, compact, masks }: { progress: MotionValue<number>; compact: boolean; masks: ParticleMask[] }) {
  const pointsRef = useRef<Points>(null)
  const count = compact ? 1800 : 4200
  const shapes = useMemo(() => createParticleShapes(count, masks), [count, masks])
  const cloud = useMemo(() => createParticleCloud(shapes, compact ? 60 : 160, compact ? 6 : 12), [shapes, compact])
  const material = useMemo(() => new ShaderMaterial({
    vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false,
    uniforms: { uProgress: { value: 0 }, uTime: { value: 0 }, uPixelRatio: { value: 1 }, uViewportWidth: { value: 4.8 }, uGlowScale: { value: compact ? .72 : 1 } },
  }), [compact])
  useEffect(() => () => material.dispose(), [material])
  useFrame(({ clock, gl, viewport }) => {
    material.uniforms.uProgress.value = progress.get()
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uPixelRatio.value = gl.getPixelRatio()
    material.uniforms.uViewportWidth.value = viewport.width
    if (pointsRef.current) {
      const thinkWeight = 1 - MathUtils.smoothstep(progress.get(), 0, 1)
      pointsRef.current.rotation.y = (0.3 + Math.sin(clock.elapsedTime * 0.12) * 0.22) * thinkWeight
      pointsRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.1) * 0.025
    }
  })
  return <points ref={pointsRef} material={material} frustumCulled={false}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[cloud.positions[0], 3]} />
      <bufferAttribute attach="attributes-aDesign" args={[cloud.positions[1], 3]} />
      <bufferAttribute attach="attributes-aBuild" args={[cloud.positions[2], 3]} />
      <bufferAttribute attach="attributes-aShip" args={[cloud.positions[3], 3]} />
      <bufferAttribute attach="attributes-aHue" args={[cloud.hues, 1]} />
      <bufferAttribute attach="attributes-aSeed" args={[cloud.seeds, 1]} />
      <bufferAttribute attach="attributes-aKind" args={[cloud.kinds, 1]} />
    </bufferGeometry>
  </points>
}

export default function ParticleCanvas({ progress, compact, active }: { progress: MotionValue<number>; compact: boolean; active: boolean }) {
  const [supported, setSupported] = useState(false)
  const [masks, setMasks] = useState<ParticleMask[] | null>(null)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    let mounted = true
    try {
      const context = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true })
      if (context) {
        setSupported(true); context.getExtension('WEBGL_lose_context')?.loseContext()
        void loadParticleMasks().then(loaded => { if (mounted) setMasks(loaded) }).catch(() => { if (mounted) setSupported(false) })
      }
    } catch { setSupported(false) }
    const visibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    visibility()
    return () => { mounted = false; document.removeEventListener('visibilitychange', visibility) }
  }, [])
  if (!supported || !masks) return null
  return <div className="about-particle-webgl" aria-hidden="true">
    <Canvas camera={{ position: [0, 0.1, 5.6], fov: 43 }} dpr={compact ? 1 : [1, 1.5]} gl={{ antialias: false, alpha: false, powerPreference: 'low-power' }} frameloop={active && visible ? 'always' : 'demand'} onCreated={({ gl }) => {
      gl.setClearColor('#050505')
      gl.domElement.addEventListener('webglcontextlost', () => setSupported(false), { once: true })
    }}><Sculpture progress={progress} compact={compact} masks={masks} /></Canvas>
  </div>
}
