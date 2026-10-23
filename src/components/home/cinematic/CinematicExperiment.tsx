import { useState, type RefObject } from "react";
import type { MotionValue } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SectionLabel } from "./SectionLabel";
import { ValueParticleFallback } from "./value/ValueParticleFallback";
import './value/value.css';

export function CinematicExperiment({
  sectionRef,
  pointerX,
  pointerY,
  burst,
  still,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  burst: MotionValue<number>;
  still: boolean;
}) {
  const [dispersed, setDispersed] = useState(false);
  const toggle = () => {
    setDispersed(!dispersed);
    burst.set(dispersed ? 0 : 1);
  };
  return (
    <section
      ref={sectionRef}
      id="experiment"
      className="cinema-section cinema-value"
      aria-labelledby="experiment-title"
      onPointerMove={(event) => {
        if (still || event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        pointerX.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1);
        pointerY.set(1 - ((event.clientY - bounds.top) / bounds.height) * 2);
      }}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
    >
      <div className="cinema-wrap value-layout">
        <div className="value-copy">
          <SectionLabel number="04">Code with purpose</SectionLabel>
          <h2 id="experiment-title">More than code.<span className="accent-text-gradient">Value that compounds.</span></h2>
          <p className="value-intro">Good software should do more than work. It should give people time back, connect the moving parts, and make the next step easier.</p>
          <div className="value-pillars">
            {[
              ['01', 'Turn complexity into something useful.', 'Build tools around real needs: clearer workflows, fewer repetitive steps, and experiences people can actually use.'],
              ['02', 'Build systems, not workarounds.', 'Connect interfaces, data, and services into a dependable whole, with foundations that can grow without starting over.'],
              ['03', 'Integrate AI where it adds value.', 'Bring AI into the workflow to assist with content, surface useful information, and support decisions, with human review where it matters.'],
            ].map(([number, title, description]) => <div className="value-pillar" key={number}><span className="value-pillar-number accent-text-gradient">{number}</span><div><h3>{title}</h3><p>{description}</p></div></div>)}
          </div>
          <div className="value-actions">
            <button className="cinema-link" type="button" onClick={toggle} disabled={still} aria-pressed={dispersed}>
              <span className="accent-text">{still ? 'A moment of stillness' : dispersed ? 'Bring it together' : 'Explore the connections'}</span><ArrowUpRight size={16} aria-hidden="true" />
            </button>
            <p className="value-interaction-note">{still ? 'Motion is paused. The possibilities aren’t.' : 'Scroll to burst outward. Scroll back to gather.'}</p>
          </div>
        </div>
        <div className="value-visual">
          <div className="value-visual-heading"><span>Small connections. Bigger possibilities.</span><span aria-hidden="true">01 / ∞</span></div>
          <div className="value-particle-stage" data-value-particles aria-hidden="true"><ValueParticleFallback /><div className="value-orbit value-orbit-one" /><div className="value-orbit value-orbit-two" /></div>
          <div className="value-visual-caption"><span className="value-signal" aria-hidden="true" /><span>Idea <span aria-hidden="true">→</span> System <span aria-hidden="true">→</span> Impact</span></div>
        </div>
      </div>
    </section>
  );
}
