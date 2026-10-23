import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useAboutMedia } from './useAboutMedia'
import '@/styles/about-mindset.css'

const stages = [
  { name: 'Build', start: 0, text: 'Understand the workflow before choosing the architecture.' },
  { name: 'Ship', start: 0.08, text: 'Deliver the first useful version, with room to learn.' },
  { name: 'Scale', start: 0.4, text: 'Connect more services without losing clear boundaries.' },
  { name: 'Optimize', start: 0.7, text: 'Use caching, efficient queries, and queues where they earn their place.' },
  { name: 'Sustain', start: 0.9, text: 'Keep releases, integrations, and background work dependable.' },
]

const nodes = [
  { id: 'web', label: 'WEB', row: 0, x: 300, width: 86, start: 0.08 },
  { id: 'mobile', label: 'MOBILE', row: 0, x: 480, width: 114, start: 0.35 },
  { id: 'realtime', label: 'REALTIME', row: 0, x: 660, width: 140, start: 0.5 },
  { id: 'gateway', label: 'API GATEWAY', row: 1, x: 480, width: 174, start: 0.1 },
  { id: 'backend', label: 'BACKEND', row: 2, x: 300, width: 126, start: 0.12 },
  { id: 'services', label: 'SERVICES', row: 2, x: 480, width: 140, start: 0.65 },
  { id: 'ai', label: 'AI', row: 2, x: 660, width: 72, start: 0.8 },
  { id: 'data', label: 'DATA', row: 3, x: 480, width: 90, start: 0.16 },
  { id: 'cache', label: 'CACHE', row: 4, x: 300, width: 104, start: 0.55 },
  { id: 'queue', label: 'QUEUE', row: 4, x: 480, width: 108, start: 0.7 },
  { id: 'storage', label: 'STORAGE', row: 4, x: 660, width: 132, start: 0.6 },
  { id: 'infra', label: 'INFRA', row: 5, x: 480, width: 104, start: 0.9 },
]

const connections = [
  ['web', 'gateway'], ['mobile', 'gateway'], ['realtime', 'gateway'],
  ['gateway', 'backend'], ['gateway', 'services'], ['gateway', 'ai'],
  ['backend', 'data'], ['services', 'data'], ['ai', 'data'],
  ['data', 'cache'], ['data', 'queue'], ['data', 'storage'],
  ['cache', 'infra'], ['queue', 'infra'], ['storage', 'infra'],
]
const layers = ['CLIENTS', 'GATEWAY', 'CAPABILITIES', 'DATA', 'STORAGE', 'PLATFORM']
const checkpoints = [[0, 0], [0.08, 1], [0.35, 100], [0.55, 10000], [0.75, 100000], [1, 1000000]]

function userCount(progress: number) {
  const end = checkpoints.findIndex(([position]) => position >= progress)
  if (end <= 0) return end === 0 ? 0 : 1000000
  const [startPosition, startCount] = checkpoints[end - 1]
  const [endPosition, endCount] = checkpoints[end]
  const fraction = (progress - startPosition) / (endPosition - startPosition)
  return Math.round(startCount + (endCount - startCount) * fraction)
}

function formatCount(count: number) {
  if (count >= 1000000) return '1M+'
  if (count >= 10000) return `${Math.round(count / 1000)}K`
  return count.toLocaleString('en-US')
}

function GraphNode({ node, progress, still }: { node: typeof nodes[number]; progress: MotionValue<number>; still: boolean }) {
  const reveal = useTransform(progress, [node.start, Math.min(1, node.start + 0.045)], [0.18, 1])
  const glow = useTransform(progress, [Math.max(0, node.start - 0.01), node.start + 0.03, node.start + 0.12], [0, 0.9, 0])
  const vertical = node.row * 100 + 42
  return <g transform={`translate(${node.x}, ${vertical})`}>
    {!still && <motion.rect x={-node.width / 2 - 7} y={-28} width={node.width + 14} height={56} rx={28} className="about-scale-node-halo" opacity={glow} />}
    <motion.g opacity={still ? 1 : reveal}><rect x={-node.width / 2} y={-23} width={node.width} height={46} rx={23} className="about-scale-node" /><circle cx={-node.width / 2 + 17} cy={0} r={3.5} fill="currentColor" /><text x={6} y={5} textAnchor="middle">{node.label}</text></motion.g>
  </g>
}

function GraphConnection({ from, to, progress, still, index }: { from: string; to: string; progress: MotionValue<number>; still: boolean; index: number }) {
  const source = nodes.find(node => node.id === from)!
  const destination = nodes.find(node => node.id === to)!
  const start = Math.max(source.start, destination.start)
  const draw = useTransform(progress, [start, Math.min(1, start + 0.06)], [0, 1])
  const flow = useTransform(progress, value => Math.max(0, (value - start) * 14 + index * 0.23) % 1)
  const startY = source.row * 100 + 65
  const endY = destination.row * 100 + 19
  const pointX = useTransform(flow, fraction => source.x + (destination.x - source.x) * (3 * fraction ** 2 - 2 * fraction ** 3))
  const pointY = useTransform(flow, fraction => {
    const inverse = 1 - fraction
    return inverse ** 3 * startY + 3 * inverse ** 2 * fraction * (startY + 30) + 3 * inverse * fraction ** 2 * (endY - 30) + fraction ** 3 * endY
  })
  const path = `M${source.x},${startY} C${source.x},${startY + 30} ${destination.x},${endY - 30} ${destination.x},${endY}`
  return <g>
    <path d={path} className="about-scale-wire-base" />
    <motion.path d={path} className="about-scale-wire" pathLength={still ? 1 : draw} opacity={still ? 0.7 : draw} />
    {!still && <motion.circle r={2.8} fill="#f3f3f0" cx={pointX} cy={pointY} opacity={draw} />}
  </g>
}

export function AboutMindset() {
  const sectionRef = useRef<HTMLElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const stageRef = useRef(0)
  const [stage, setStage] = useState(0)
  const { reducedMotion } = useAboutMedia()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const updateCounter = (value: number) => {
    if (counterRef.current) counterRef.current.textContent = formatCount(userCount(value))
    const next = stages.reduce((active, item, index) => value >= item.start ? index : active, 0)
    if (stageRef.current !== next) { stageRef.current = next; setStage(next) }
  }
  useMotionValueEvent(scrollYProgress, 'change', value => updateCounter(reducedMotion ? 1 : value))
  useEffect(() => { updateCounter(reducedMotion ? 1 : scrollYProgress.get()) }, [reducedMotion, scrollYProgress])
  const current = stages[reducedMotion ? 4 : stage]
  return <section ref={sectionRef} id="about-mindset" className="about-scale" aria-labelledby="about-mindset-title" data-scale-stage={current.name.toLowerCase()}>
    <div className="about-scale-sticky">
      <div className="about-scale-matrix" aria-hidden="true">{Array.from({ length: 20 }, (_, column) => <span key={column}>{Array.from({ length: 24 }, (_, row) => (column * 7 + row * 3) % 10).join(' ')}</span>)}</div>
      <div className="about-scale-layout about-container">
        <div className="about-scale-copy">
          <h2 id="about-mindset-title">The journey</h2>
          <span className="about-scale-counter" ref={counterRef} aria-hidden="true">{reducedMotion ? '1M+' : '0'}</span>
          <p className="about-label">Users <span className="about-scale-demo">/ illustrative scale</span></p>
          <p className="about-scale-stage"><span aria-hidden="true">◇</span> {current.name}</p>
          <p className="about-scale-stage-text">{current.text}</p>
          <p className="about-scale-context">An illustrative journey from first commit to one million users, not a claim about the audience of my projects.</p>
          <p className="about-scale-philosophy">Travel products have taught me to think beyond the screen: supplier latency, payment state, queue failures, and data freshness all shape the experience. Good architecture makes those moving parts easier to understand and improve.</p>
          <p className="about-scale-screen-reader">Illustrative progression: build at zero users, ship to the first users, scale, optimize, and sustain at one million. Scroll to explore the connected system.</p>
        </div>
        <div className="about-scale-graph">
          <svg viewBox="0 0 750 590" aria-hidden="true">
            {layers.map((layer, index) => <text key={layer} x={2} y={index * 100 + 47} className="about-scale-layer-label">{layer}</text>)}
            {connections.map(([from, to], index) => <GraphConnection key={`${from}-${to}`} from={from} to={to} progress={scrollYProgress} still={reducedMotion} index={index} />)}
            {nodes.map(node => <GraphNode key={node.id} node={node} progress={scrollYProgress} still={reducedMotion} />)}
          </svg>
          <dl className="about-scale-screen-reader">{layers.map((layer, index) => <div key={layer}><dt>{layer}</dt><dd>{nodes.filter(node => node.row === index).map(node => node.label).join(', ')}</dd></div>)}</dl>
          <p className="about-scale-graph-caption">Conceptual architecture / scroll to connect the system</p>
        </div>
      </div>
      <motion.div className="about-scale-progress" style={{ scaleX: reducedMotion ? 1 : scrollYProgress }} aria-hidden="true" />
    </div>
  </section>
}
