import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { AboutProcess } from "@/components/about/AboutProcess";
import { AboutMindset } from "@/components/about/AboutMindset";
import { AboutHumanSide } from "@/components/about/AboutHumanSide";
import { AboutTechnologies } from "@/components/about/AboutTechnologies";
import { AboutChallenges } from "@/components/about/AboutChallenges";
import { AboutExplorations } from "@/components/about/AboutExplorations";
import { experience } from "@/data/experience";
import "@/styles/about.css";
import "@/styles/about-showcase.css";
import VaporText from "../global/vapor-text";

const buildStatements = [
  "I BUILD FOR\nReal-world needs.",
  "I BUILD\nComplex systems.",
  "I BUILD\nCool stuff.",
  "I BUILD\nsomething distinctive,\nsomething people actually remember.",
];

export function About() {
  return (
    <main id="about" className="about-story">
      <section className="about-hero" aria-labelledby="about-name">
        <div className="about-hero-art" aria-hidden="true">
          <div className="about-orbit about-orbit-one" />
          <div className="about-orbit about-orbit-two" />
          <span className="about-monogram">
            AK<span>IDEAS → SYSTEMS</span>
          </span>
          <span className="about-art-caption">
            01 / THE PERSON BEHIND THE CODE
          </span>
        </div>
        <div className="about-hero-copy">
          <p className="about-label">Full-stack developer · Dhaka, Bangladesh</p>
          <h1 id="about-name" aria-label="Adnan Hossain Khan">
            <span className="about-name-outline">ADNAN HOSSAIN</span>
            <span className="about-name-solid">KHAN.</span>
          </h1>
          <p className="about-hero-statement">
            <VaporText
              as="span"
              words={buildStatements}
              className="about-hero-vapor"
              preset="frost"
              color="#FFFFFF"
              vaporColor="#97FFFF"
              sweep="scatter"
              align="start"
              density={0.1}
              particleSize={0.5}
              spread={4}
              rise={5}
              turbulence={5}
              diffusion={0.2}
              grain={1}
              stagger={0.8}
              condense={2}
              hold={2.5}
              dissolve={1.5}
              overlap={0.6}
              breath={3}
              breathRadius={0.8}
              recovery={1.2}
              area="self"
              loop={true}
              startOnView={true}
              interactive={false}
              clickAdvance={true}
              pauseOnHover={true}
              paused={false}
            />
          </p>
          <p className="about-body">
            I connect thoughtful interfaces with the systems behind them. With
            4+ years across React, TypeScript, Laravel, and PHP, my work spans
            travel platforms, payments, cloud media, and AI-powered workflows.
            The goal stays the same: make complex products feel dependable and
            straightforward to use.
          </p>
        </div>
        <a className="about-scroll" href="#about-human-side">
          Scroll the story <ArrowDown size={16} aria-hidden="true" />
        </a>
      </section>
      <AboutHumanSide />
      <AboutMindset />
      <AboutProcess />
      <section
        className="about-journey about-container"
        aria-labelledby="about-journey-title"
      >
        <div>
          <p className="about-label">04 / Built through experience</p>
          <h2 id="about-journey-title">
            ALWAYS
            <br />
            BUILDING.
            <br />
            <span>
              ALWAYS
              <br />
              EVOLVING.
            </span>
          </h2>
        </div>
        <div className="about-roles">
          {experience.map(position => <article key={position.company}>
            <p className="about-label">{position.period}</p>
            <h3>{position.company}</h3>
            <p className="about-role">{position.role}</p>
            <p className="about-body">{position.summary}</p>
          </article>)}
          <Link to="/experience" className="about-link">
            Explore the journey <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <AboutTechnologies />
      <AboutChallenges />
      <AboutExplorations />
      <section
        className="about-finale about-container"
        aria-labelledby="about-finale-title"
      >
        <p className="about-label">08 / The next chapter</p>
        <h2 id="about-finale-title">
          GOOD IDEAS
          <br />
          DESERVE TO
          <br />
          <span>BE BUILT.</span>
        </h2>
        <div>
          <p className="about-body">
            A booking flow that needs to work harder. An integration that needs
            to be reliable. An interface people should enjoy using. Let’s build
            the right system around your next idea.
          </p>
          <Link to="/contact" className="about-link">
            Let's talk <ArrowUpRight size={22} aria-hidden="true" />
          </Link>
          <Link to="/projects" className="about-secondary-link">
            Explore my work
          </Link>
        </div>
      </section>
    </main>
  );
}
