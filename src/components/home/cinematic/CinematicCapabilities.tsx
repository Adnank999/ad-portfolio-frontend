import { useId, useRef, useState, type RefObject } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUpRight, Minus, Plus } from 'lucide-react'
import { SectionLabel } from './SectionLabel'
import { CapabilityArtwork } from './capabilities/CapabilityArtwork'
import { capabilities, getCapabilityFocusIndex } from './capabilities/capabilities'
import './capabilities/capabilities.css'

export function CinematicCapabilities({ sectionRef, still }: { sectionRef: RefObject<HTMLElement | null>; still: boolean }) {
  const [expanded, setExpanded] = useState<number | null>(0)
  const [preview, setPreview] = useState<number | null>(null)
  const triggers = useRef<(HTMLButtonElement | null)[]>([])
  const identifier = useId().replaceAll(':', '')
  const active = capabilities[preview ?? expanded ?? 0]

  return <section ref={sectionRef} id="toolkit" className="cinema-section cinema-capabilities" aria-labelledby="capabilities-title">
    <div className="cinema-wrap capabilities-content">
      <div className="capabilities-intro">
        <div className="capabilities-intro-copy">
          <SectionLabel number="03">How I can help</SectionLabel>
          <h2 id="capabilities-title">Build with Care <span className="accent-text-gradient">from Front to Back</span></h2>
          <p className="capabilities-lead">The interface is only the beginning. I connect thoughtful design with dependable engineering to make the whole product feel considered.</p>
          <p className="capabilities-summary">From the first interaction to the systems behind it, I bring clarity to the complex parts, care to the small details, and a practical approach to getting things built.</p>
          <a className="capabilities-explore" href={`#capabilities-list-${identifier}`}><ArrowDown size={15} aria-hidden="true" /><span>Explore the details</span></a>
        </div>
        <div className="capabilities-intro-visual" onPointerLeave={() => setPreview(null)}>
          <div className="capabilities-visual-topline"><span>One connected experience</span><span aria-hidden="true">01 — 06</span></div>
          <CapabilityArtwork kind={active.artwork} />
          <div className="capabilities-visual-caption"><span>{active.category}</span><span className="capabilities-live-dot" aria-hidden="true" /></div>
        </div>
      </div>

      <div id={`capabilities-list-${identifier}`} className="capabilities-list" onPointerLeave={() => setPreview(null)}>
        <div className="capabilities-list-label"><span>Different disciplines. One thoughtful result.</span><span aria-hidden="true">Select to explore <ArrowDown size={12} /></span></div>
        {capabilities.map((capability, index) => {
          const open = expanded === index
          const triggerId = `capability-trigger-${identifier}-${index}`
          const panelId = `capability-panel-${identifier}-${index}`
          return <article className="capabilities-row" data-open={open} key={capability.artwork} onPointerEnter={event => { if (event.pointerType === 'mouse') setPreview(index) }}>
            <h3>
              <button ref={element => { triggers.current[index] = element }} id={triggerId} type="button" aria-expanded={open} aria-controls={panelId}
                onClick={() => { setExpanded(open ? null : index); setPreview(null) }}
                onKeyDown={event => {
                  const next = getCapabilityFocusIndex(index, event.key, capabilities.length)
                  if (next === null) return
                  event.preventDefault()
                  triggers.current[next]?.focus()
                }}>
                <span className="capabilities-row-number accent-text-gradient">{String(index + 1).padStart(2, '0')}</span>
                <span className="capabilities-row-title">{capability.title}</span>
                <span className="capabilities-row-category">{capability.category}</span>
                <span className="capabilities-row-toggle" aria-hidden="true">{open ? <Minus size={18} /> : <Plus size={18} />}</span>
              </button>
            </h3>
            <motion.div id={panelId} role="region" aria-labelledby={triggerId} aria-hidden={!open} inert={!open} className="capabilities-panel"
              initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: still ? 0 : .3, ease: [.22, 1, .36, 1] }}>
              <div className="capabilities-panel-grid">
                <div className="capabilities-panel-copy"><p>{capability.description}</p><ul aria-label={`${capability.category} toolkit`}>{capability.tools.map(tool => <li key={tool}>{tool}</li>)}</ul><p className="capabilities-outcome"><ArrowUpRight size={13} aria-hidden="true" />{capability.outcome}</p></div>
                <CapabilityArtwork kind={capability.artwork} />
              </div>
            </motion.div>
          </article>
        })}
      </div>
      <div className="capabilities-closing"><p>Not separate services. The pieces of a better product.</p><span aria-hidden="true">Designed to work together.</span></div>
    </div>
  </section>
}
