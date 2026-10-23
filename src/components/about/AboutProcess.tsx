import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react'
import { motion, useInView, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { useAboutMedia } from './useAboutMedia'
import { ParticleBoundary } from './ParticleBoundary'
import { createParticleHues, loadParticleMasks, PARTICLE_SHAPE_ASSETS } from './particleShapes'

const ParticleCanvas = lazy(() => import('./ParticleCanvas'))
const fallbackHues = Array.from(createParticleHues(64))
const fallbackScatter = createParticleHues(72)
const steps = [
  { name: 'Think', text: 'Start with the person, the workflow, and what can go wrong.', detail: 'A hotel search, a payment callback, or a media upload each has different constraints. Understand the need, the dependencies, and the failure states before choosing a solution.', command: 'understand the workflow and its constraints' },
  { name: 'Design', text: 'Connect the experience before adding the complexity.', detail: 'Map interfaces, data relationships, API contracts, and background work. Make business rules and ownership clear so a change in one service does not become a surprise somewhere else.', command: 'map the data, contracts, and boundaries' },
  { name: 'Build', text: 'Make the interface clear and the system dependable.', detail: 'Bring React and TypeScript together with Laravel, validated APIs, efficient queries, and queues. Keep the code readable, test the important paths, and handle the states beyond the happy path.', command: 'build, validate, and handle the exceptions' },
  { name: 'Ship', text: 'Deliver carefully. Learn from what happens next.', detail: 'Use version control and CI/CD to support reliable releases. Follow the slow requests, failed jobs, and user feedback, then improve the product without making it harder to maintain.', command: 'release, observe, and keep improving' },
]

export function ParticleFallback({ stage }: { stage: number }) {
  const id = useId()
  const shapeId = `${id}-shape`, patternId = `${id}-pattern`, glowId = `${id}-glow`, dotsId = `${id}-dots`, gradientId = `${id}-rainbow`
  return <svg className="about-particle-fallback" viewBox="0 0 400 400" aria-hidden="true">
    <defs>
      <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
        <feGaussianBlur stdDeviation="1.5" result="softGlow" />
        <feMerge><feMergeNode in="softGlow" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="360">
        {['#ff637b', '#ffb45c', '#f5ea69', '#64e8a4', '#64c8ff', '#9b8aff', '#ed7aff'].map((color, index) => <stop key={color} offset={`${index / 6 * 100}%`} stopColor={color} />)}
      </linearGradient>
      <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="white" stroke="none" /></pattern>
      <mask id={dotsId} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><rect width="400" height="400" fill={`url(#${patternId})`} stroke="none" /></mask>
      <mask id={shapeId} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400" style={{ maskType: 'alpha' }}>
        {stage === 0 ? <>
          <path d="M100 70 Q300 150 200 200 Q100 250 300 330 H100 Q300 250 200 200 Q100 150 300 70Z" fill="white" stroke="none" />
          <ellipse cx="200" cy="70" rx="100" ry="24" fill="none" stroke="white" /><ellipse cx="200" cy="330" rx="100" ry="24" fill="none" stroke="white" />
        </> : <image href={`${import.meta.env?.BASE_URL || '/'}about-me/${PARTICLE_SHAPE_ASSETS[stage - 1]}`} x="40" y="40" width="320" height="320" />}
      </mask>
    </defs>
    <g filter={`url(#${glowId})`}>
      {fallbackHues.slice(0, 24).map((hue, index) => <circle key={index} className="about-particle-float" cx={(index % 2 ? 320 : 12) + fallbackScatter[index * 3] * 68} cy={20 + fallbackScatter[index * 3 + 1] * 360} r={.35 + fallbackScatter[index * 3 + 2] * .65} fill={`hsl(${hue * 360}, 85%, 70%)`} stroke="none" opacity="0.6" />)}
      <g mask={`url(#${shapeId})`}><rect width="400" height="400" fill={`url(#${gradientId})`} stroke="none" mask={`url(#${dotsId})`} /></g>
    </g>
  </svg>
}

function ProcessStep({ index, reduced }: { index: number; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 15%'] })
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.75, 1], [0.4, 1, 1, 0.4])
  const translate = useTransform(scrollYProgress, [0, 1], [35, -35])
  const step = steps[index]
  return <article ref={ref} id={`about-${step.name.toLowerCase()}`} className="about-process-step">
    <motion.div style={reduced ? undefined : { opacity, y: translate }}><p className="about-label">0{index + 1} / The process</p><h3>{step.name.toUpperCase()}<span>.</span></h3><p className="about-process-text">{step.text}</p><p className="about-body">{step.detail}</p></motion.div>
  </article>
}

export function AboutProcess() {
  const sectionRef = useRef<HTMLElement>(null)
  const activeStage = useRef(0)
  const { reducedMotion, compact } = useAboutMedia()
  const [paused, setPaused] = useState(false)
  const [stage, setStage] = useState(0)
  const [prepared, setPrepared] = useState(false)
  const inView = useInView(sectionRef, { margin: '200px' })
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const phase = useTransform(scrollYProgress, [0, 1], [0, 3])
  const progress = useSpring(phase, { stiffness: 65, damping: 26, restDelta: 0.001 })
  useMotionValueEvent(phase, 'change', value => {
    const next = Math.min(3, Math.floor(value + 0.5))
    if (activeStage.current !== next) { activeStage.current = next; setStage(next) }
  })
  useEffect(() => {
    if (reducedMotion) return
    setPrepared(true)
    void loadParticleMasks().catch(() => {})
  }, [reducedMotion])
  const staticMode = reducedMotion || paused
  return <section ref={sectionRef} className="about-process" aria-labelledby="about-process-title" data-stage={steps[stage].name.toLowerCase()} data-static={staticMode}>
    <div className="about-process-stage">
      <div className="about-particle-viewport">
        <ParticleFallback stage={stage} />
        {prepared && !reducedMotion && <ParticleBoundary><Suspense fallback={null}><ParticleCanvas progress={progress} compact={compact} active={inView && !paused} /></Suspense></ParticleBoundary>}
        <div className="about-particle-meta"><span>03 / How the work happens</span>{!reducedMotion && <button type="button" aria-label={paused ? 'Resume particle animation' : 'Pause particle animation'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}{paused ? 'Resume' : 'Pause'}</button>}</div>
      </div>
      <div className="about-process-caption"><p className="about-label">How the work actually happens</p><h2 id="about-process-title">AT THE<br />MACHINE.</h2><div className="about-terminal" aria-hidden="true">{steps.map((step, index) => <p key={step.name} className={index <= stage ? 'is-revealed' : ''}><span>›</span> {step.command}</p>)}</div><nav className="about-process-navigation" aria-label="Process chapters">{steps.map((step, index) => <a key={step.name} href={`#about-${step.name.toLowerCase()}`} aria-current={stage === index ? 'step' : undefined}><span>0{index + 1}</span>{step.name}</a>)}</nav></div>
    </div>
    <div className="about-process-chapters">{steps.map((step, index) => <ProcessStep key={step.name} index={index} reduced={staticMode} />)}</div>
  </section>
}
