import { useRef, useState } from "react";
import { motion, useMotionValueEvent } from "framer-motion";
import { usePinnedStorytelling } from "../hooks/useCinematicMotion";
import { useSmoothScroll } from "@/components/layout/SmoothScrollProvider";
import { SectionLabel } from "./SectionLabel";
import { ProcessStep } from "./ProcessStep";
import { processSteps } from "./processSteps";

export function CinematicProcess({ still }: { still: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { progress, activeStep } = usePinnedStorytelling(sectionRef);
  const [active, setActive] = useState(0);
  const lenis = useSmoothScroll();
  useMotionValueEvent(activeStep, "change", (value) =>
    setActive((previous) =>
      previous === Math.round(value) ? previous : Math.round(value),
    ),
  );
  const jumpToStep = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const target =
      top + ((section.offsetHeight - window.innerHeight) * index) / 4;
    if (lenis.current) lenis.current.scrollTo(target);
    else window.scrollTo({ top: target, behavior: "instant" });
  };
  return (
    <section
      ref={sectionRef}
      id="process"
      className="cinema-section cinema-light cinema-process"
      aria-labelledby="process-title"
    >
      <div className="cinema-sticky cinema-process-sticky">
        <div className="cinema-wrap">
          <div className="cinema-section-heading">
            <SectionLabel number="02">From possibility to product</SectionLabel>
            <h2 id="process-title">The 5-step method.</h2>
          </div>
          <div className="cinema-process-stage">
            {processSteps.map((step, index) => (
              <ProcessStep
                key={step.title}
                index={index}
                position={activeStep}
                still={still}
              />
            ))}
          </div>
          {!still && (
            <nav
              className="cinema-process-navigation"
              aria-label="Process steps"
            >
              {processSteps.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => jumpToStep(index)}
                  aria-current={active === index ? "step" : undefined}
                >
                  <span className="accent-text">0{index + 1}</span>
                  <span className="accent-text">{step.title.replace(".", "")}</span>
                </button>
              ))}
            </nav>
          )}
          {!still && (
            <motion.div
              className="cinema-process-progress"
              style={{ scaleX: progress }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </section>
  );
}
