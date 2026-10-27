import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { HeroShader } from '../../src/components/home/shaders-glsl/HeroShader'
import { useHeroShaderControls } from '../../src/components/home/shaders-glsl/ShaderControls'
import { motionValue } from 'framer-motion'

const time = motionValue(0)
const progress = motionValue(0)

// Force a rebuilt frame during the effect flush to catch any readiness/opacity
// reset that could cover a working shader during a quality adjustment.
function WarmRebuiltFrame({ compact }: { compact: boolean }) {
  const advance = useThree(state => state.advance)
  useEffect(() => { advance(performance.now(), true) }, [advance, compact])
  return null
}

export function HeroRebuildFixture({ onReady }: { onReady: (value: boolean) => void }) {
  const heroRef = useRef<HTMLElement>(null)
  const [compact, setCompact] = useState(true)
  const controls = useHeroShaderControls()
  return <><section ref={heroRef} style={{ height: 600 }}><button id="rebuild-hero" onClick={() => setCompact(value => !value)}>Change quality</button></section><div style={{ position: 'fixed', inset: 0, width: 320, height: 240, pointerEvents: 'none' }}><Canvas dpr={1} gl={{ antialias: false }}><HeroShader heroRef={heroRef} time={time} progress={progress} visible still={false} compact={compact} controls={controls} onReady={onReady} /><WarmRebuiltFrame compact={compact} /></Canvas></div></>
}
