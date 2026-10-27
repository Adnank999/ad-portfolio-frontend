import type { RefObject } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useHeroAnimation } from "../hooks/useCinematicMotion";
import BlurText from "@/components/blur-text/BlurText";
import { MagneticAnchor } from "./MagneticAnchor";
import { CinematicReviews } from "./reviews/CinematicReviews";

const headlineFrom = { filter: 'blur(0px)', opacity: 1, y: 12 };
const headlineTo = [{ filter: 'blur(0px)', opacity: 1, y: 0 }];

export function CinematicHero({
  sectionRef,
  still,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  still: boolean;
}) {
  const { headlineY } = useHeroAnimation(sectionRef);
  return (
    <section
      ref={sectionRef}
      id="spark"
      className="cinema-section cinema-hero"
      aria-labelledby="hero-title"
    >
      {/*<div className="cinema-wrap cinema-hero-top">
        <span className="cinema-micro">
          Adnan Hossain Khan / Ideas into reality
        </span>
        <span className="cinema-status">
          <i /> Open to collaboration
        </span>
      </div>*/}
      <div className="cinema-hero-fallback" aria-hidden="true" />
      <motion.div
        className="cinema-wrap cinema-hero-copy"
        style={still ? undefined : { y: headlineY }}
      >
        <p className="cinema-micro">
          Thoughtful systems. Remarkable experiences.
        </p>
        <h1 id="hero-title">
          <BlurText
            as="span"
            text="Ideas into reality."
            animationFrom={headlineFrom}
            animationTo={headlineTo}
            delay={100}
            direction="bottom"
            className="cinema-hero-blur-line"
          />
          <BlurText
            as="span"
            text="Built to evolve."
            animationFrom={headlineFrom}
            animationTo={headlineTo}
            delay={100}
            direction="bottom"
            className="cinema-hero-blur-line"
            renderSegment={(segment) =>
              segment === "evolve." ? <em>{segment}</em> : segment
            }
          />
        </h1>
        <p className="cinema-hero-description">
          I connect design, code, and a little curiosity to build digital
          products that move people forward.
        </p>
        <MagneticAnchor href="/projects" still={still}>
          Explore selected work
        </MagneticAnchor>
      </motion.div>
      <div className="cinema-wrap cinema-hero-bottom">
        <a href="#mindset" className="cinema-scroll-cue">
          <ArrowDown size={17} aria-hidden="true" /> Scroll to discover
        </a>
        {/*<span className="cinema-micro">
          Working together, wherever you are
        </span>*/}
      </div>
      <CinematicReviews still={still} />
    </section>
  );
}
