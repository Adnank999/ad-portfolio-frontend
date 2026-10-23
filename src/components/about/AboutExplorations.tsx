import { useRef, useState } from 'react'
import { ArrowUpRight, Box, Pause, Play, ScanLine, Workflow } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useAboutMedia } from './useAboutMedia'
import { ExplorationLogoCanvas } from './exploration-logos/ExplorationLogoCanvas'
import { ExplorationLogoFallback } from './exploration-logos/ExplorationLogoFallback'
import type { ExplorationLogoKind } from './exploration-logos/geometry'
import './exploration-logos/exploration-logos.css'

const explorations = [
  {
    id: 'visual', title: 'Beyond the flat screen.', tag: 'WebGL / Three.js / shaders', icon: ScanLine,
    description: 'Exploring WebGL, Three.js, and React Three Fiber through shaders, particles, lighting, and scroll-driven scenes. I’m interested in motion that gives an interface atmosphere without getting in the way.',
    question: 'How can a real-time scene feel expressive and still leave the interface fast and usable?',
    next: 'Keep experimenting with shader materials, GPU-friendly particles, render budgets, and reduced-motion alternatives.',
  },
  {
    id: 'modeling', title: 'From mesh to material.', tag: '3D modeling / visual craft', icon: Box,
    description: 'Learning how form, topology, materials, and light work together in 3D modeling, then bringing those assets into an interactive browser experience.',
    question: 'What makes a 3D asset convincing before it becomes expensive to render?',
    next: 'Explore cleaner geometry, UVs, texture quality, lighting, and asset optimization so the model and the real-time scene are designed together.',
  },
  {
    id: 'systems', title: 'More languages. New perspectives.', tag: 'Backend languages / AI', icon: Workflow,
    description: 'Alongside my day-to-day PHP and Laravel work, I’m learning Java, C#, Rust, and Python and exploring how to integrate AI into complete backend workflows.',
    question: 'What can a different language teach me about building a clearer, more reliable system?',
    next: 'Build small services and AI experiments to compare type systems, concurrency, persistence, and API design, turning unfamiliar ideas into practical understanding.',
  },
] as const

function ExplorationArtwork({ kind }: { kind: ExplorationLogoKind }) {
  return <div className={`about-exploration-art about-exploration-art-${kind}`} data-exploration-logo={kind} aria-hidden="true">
    <ExplorationLogoFallback kind={kind} />
  </div>
}

export function AboutExplorations() {
  const gridRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const { reducedMotion } = useAboutMedia()
  return <section id="about-exploring" className="about-showcase about-explorations about-container" aria-labelledby="about-exploring-title">
    <header className="about-showcase-heading">
      <p className="about-label">07 / What I’m exploring</p>
      <h2 id="about-exploring-title">Creative experiments<br />and <em className="accent-text-gradient">learning.</em></h2>
      <p className="about-body">Production work gives me practical questions. Experimenting gives me new ways to answer them: through real-time visuals, 3D craft, backend languages, and AI.</p>
    </header>
    <div ref={gridRef} className="about-exploration-grid"><ExplorationLogoCanvas root={gridRef} paused={paused} reducedMotion={reducedMotion} />{explorations.map(({ id, title, tag, icon: Icon, description, question, next }) => <article key={id} className="about-exploration">
      <ExplorationArtwork kind={id} />
      <div className="about-exploration-copy">
        <p className="about-label"><Icon size={14} aria-hidden="true" />{tag}</p>
        <h3>{title}</h3>
        <p className="about-body">{description}</p>
        <details className="about-exploration-details"><summary>The question I’m following <ArrowUpRight size={16} aria-hidden="true" /></summary><div><p>{question}</p><p className="about-body">{next}</p></div></details>
      </div>
    </article>)}</div>
    <div className="about-exploration-footer"><div className="about-exploration-playback"><p className="about-body">A work in progress. <em>And that’s the point.</em></p>{!reducedMotion && <button className="about-exploration-pause" type="button" aria-pressed={paused} aria-label={paused ? 'Resume shader logos' : 'Pause shader logos'} onClick={() => setPaused(previous => !previous)}>{paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}{paused ? 'Resume artwork' : 'Pause artwork'}</button>}</div><Link to="/projects" className="about-link">Step inside the work <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
  </section>
}
