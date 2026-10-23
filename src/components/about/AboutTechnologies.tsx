import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowDownRight, Orbit } from 'lucide-react'
import { technologyGroups } from './technology-data'

const stars = Array.from({ length: 32 }, (_, index) => ({
  x: 7 + ((index * .61803398875) % 1) * 86,
  y: 8 + ((index * .754877666) % 1) * 83,
  size: index % 5 === 0 ? 1.5 : .7,
}))

export function AboutTechnologies() {
  const [selected, setSelected] = useState(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const identifier = useId()
  const panelId = `${identifier}-technology-panel`
  const current = technologyGroups[selected]

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': next = (index + 1) % technologyGroups.length; break
      case 'ArrowLeft':
      case 'ArrowUp': next = (index - 1 + technologyGroups.length) % technologyGroups.length; break
      case 'Home': next = 0; break
      case 'End': next = technologyGroups.length - 1; break
      default: return
    }
    event.preventDefault()
    setSelected(next)
    buttons.current[next]?.focus()
  }

  return <section id="about-technologies" className="about-showcase about-technologies about-container" aria-labelledby="about-technologies-title">
    <header className="about-showcase-heading">
      <p className="about-label">05 / What I use</p>
      <h2 id="about-technologies-title">Technology<br /><em className="accent-text-gradient">constellation.</em></h2>
      <p className="about-body">The languages, frameworks, and services behind my work. Select a discipline to explore how the pieces connect, from customer-facing interfaces to the infrastructure behind them.</p>
    </header>
    <div className="about-technology-layout">
      <div className="about-constellation" role="group" aria-label="Technology categories">
        <svg className="about-constellation-map" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="about-constellation-orbit" cx="50" cy="48" r="35" />
          <circle className="about-constellation-orbit about-constellation-orbit-inner" cx="50" cy="48" r="22" />
          {stars.map((star, index) => <circle key={index} className="about-constellation-star" cx={star.x} cy={star.y} r={star.size / 4} />)}
          {technologyGroups.map(group => <line key={group.id} className="about-constellation-connection" data-selected={current.id === group.id} x1="50" y1="48" x2={group.position.x} y2={group.position.y} />)}
        </svg>
        <div className="about-constellation-core" aria-hidden="true"><Orbit size={28} strokeWidth={1} /><p>Ideas into<br />systems.</p></div>
        {technologyGroups.map((group, index) => <button
          key={group.id}
          ref={element => { buttons.current[index] = element }}
          id={`${identifier}-${group.id}`}
          type="button"
          className="about-constellation-node"
          style={{ left: `${group.position.x}%`, top: `${group.position.y}%` }}
          aria-pressed={selected === index}
          aria-controls={panelId}
          onClick={() => setSelected(index)}
          onKeyDown={event => navigate(event, index)}
        ><group.icon size={21} strokeWidth={1.35} aria-hidden="true" /><span>{group.name}</span></button>)}
        <p className="about-constellation-caption about-label">Five disciplines. Shared purpose.</p>
      </div>
      <div id={panelId} className="about-technology-panel" role="region" aria-labelledby={`${identifier}-${current.id}`}>
        <div aria-live="polite" aria-atomic="true"><div key={current.id} className="about-technology-content">
          <p className="about-label">0{selected + 1} / {current.name}</p>
          <h3>{current.title}</h3>
          <p className="about-body">{current.description}</p>
          <ul className="about-technology-tools">{current.tools.map(tool => <li key={tool.name}><h4>{tool.name}</h4><p>{tool.purpose}</p></li>)}</ul>
          <p className="about-technology-connection"><ArrowDownRight size={17} aria-hidden="true" />{current.connection}</p>
        </div></div>
      </div>
    </div>
  </section>
}
