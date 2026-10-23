import type { RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useFocusReveal } from "../hooks/useCinematicMotion";
import StaggeredText from "@/components/global/staggered-text";
import { SectionLabel } from "./SectionLabel";

export function CinematicAbout({
  sectionRef,
  progress,
  still,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  progress: MotionValue<number>;
  still: boolean;
}) {
  const revealOnFocus = useFocusReveal(sectionRef, progress, still);
  const incoming = useTransform(progress, [0.65, 0.84], [0, 1]);
  const outgoing = useTransform(progress, [0, 0.24], [1, 0]);
  const incomingY = useTransform(progress, [0.4, 0.8], [80, 0]);
  return (
    <section
      ref={sectionRef}
      id="mindset"
      className="cinema-section cinema-light cinema-transition"
      aria-labelledby="about-title"
    >
      <div className="cinema-sticky cinema-about-sticky">
        <motion.div
          className="cinema-transition-thought"
          style={still ? { display: "none" } : { opacity: outgoing }}
          aria-hidden="true"
        >
          <StaggeredText
            as="h2"
            text={"Good work starts\nwith a better question."}
            segmentBy="words"
            direction="top"
            staggerDirection="forward"
            duration={0.85}
            delay={55}
            easing={[0.22, 1, 0.36, 1]}
            from={{ opacity: 0, y: 18 }}
            blur
            className="m-0 text-center text-[clamp(2rem,5vw,4.5rem)] leading-[1.15]"
          />
        </motion.div>
        <motion.div
          className="cinema-wrap cinema-about-content"
          onFocusCapture={revealOnFocus}
          style={still ? undefined : { opacity: incoming, y: incomingY }}
        >
          <SectionLabel number="01">A little about me</SectionLabel>
          <h2 id="about-title">
            Curiosity is the spark.
            <br />
            <span>Craft is the difference.</span>
          </h2>
          <div className="cinema-about-grid">
            <p className="cinema-lead">
              I’m Adnan. A developer who cares as much about how a product feels
              as how it works.
            </p>
            <div>
              <p>
                I work across React, TypeScript, and Laravel to bring ambitious
                ideas to life. From the first interaction to the systems behind
                it, every detail deserves a little more thought.
              </p>
              <Link to="/about" className="cinema-link">
                <span className="accent-text">Meet the person behind the code</span><span className="accent-text">{" "}</span>
                <ArrowUpRight size={20} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="cinema-principles">
            {[
              "Ask better questions.",
              "Make complex feel simple.",
              "Build things that last.",
            ].map((text, index) => (
              <div key={text}>
                <span>0{index + 1}</span>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
