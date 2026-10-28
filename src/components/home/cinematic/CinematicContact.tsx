import { SectionLabel } from "./SectionLabel";
import { MagneticAnchor } from "./MagneticAnchor";
import BlurText from "@/components/blur-text/BlurText";

export function CinematicContact({ still }: { still: boolean }) {
  return (
    <section
      id="connection"
      className="cinema-section cinema-contact"
      aria-labelledby="contact-title"
    >
      <div className="cinema-wrap">
        <SectionLabel number="05">The next chapter</SectionLabel>
        <h2 id="contact-title" className="contact-title">
          <BlurText
            as="span"
            text="Your next idea."
            delay={100}
            animateBy="words"
            direction="bottom"
            threshold={0.2}
            rootMargin="0px 0px -40px 0px"
            once={false}
            disabled={still}
          />
          <BlurText
            as="span"
            text="Let’s make it real."
            delay={100}
            animateBy="words"
            direction="bottom"
            threshold={0.2}
            rootMargin="0px 0px -40px 0px"
            once={false}
            disabled={still}
            renderSegment={(segment) =>
              segment === "real." ? <em>{segment}</em> : segment
            }
          />
        </h2>

        <div className="cinema-contact-bottom">
          <p>
            Have a product, a challenge, or a possibility in mind?
            <br />
            I’d love to hear where you want to go.
          </p>
          <MagneticAnchor
            href="/contact"
            className="cinema-contact-cta"
            still={still}
          >
            Start a conversation
          </MagneticAnchor>
        </div>
      </div>
    </section>
  );
}
