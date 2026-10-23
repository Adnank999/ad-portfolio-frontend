import { useRef, useState } from "react";
import { motion, useAnimationFrame, useInView, useMotionValue, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { projects } from "@/data/projects";
import { ReviewCard } from "./ReviewCard";
import { sampleReviews, toolkit, type Review } from "./reviews";

export function CinematicReviews({ still, reviews = sampleReviews }: { still: boolean; reviews?: Review[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const inView = useInView(sectionRef, { margin: "100px 0px" });
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const progress = useMotionValue(0);
  const x = useTransform(progress, (value) => `${-value * 50}%`);

  useAnimationFrame((_, delta) => {
    if (still || paused || interacting || !inView || document.hidden) return;
    progress.set((progress.get() + Math.min(delta, 64) / 45000) % 1);
  });

  const move = (direction: number) => {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!track || !card) return;
    track.scrollBy({ left: direction * (card.getBoundingClientRect().width + 24), behavior: still ? "instant" : "smooth" });
  };

  if (!reviews.length) return null;

  return (
    <section
      ref={sectionRef}
      id="reviews"
      aria-labelledby="reviews-title"
      className="relative z-1 overflow-hidden bg-[#111111] py-20 text-[#faf9f6] md:py-28"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-size-[20px_20px] opacity-50" />
      <div className="cinema-wrap relative flex flex-col gap-5 pb-12 md:flex-row md:items-end md:justify-between">
        {reviews.some((review) => review.sample) && (
          <p className="max-w-64 text-[11px] leading-relaxed text-white/45">Preview content — sample reviews, not published client testimonials.</p>
        )}
      </div>

      <div
        className="relative flex min-h-24 items-center overflow-hidden"
        onMouseEnter={() => setInteracting(true)}
        onMouseLeave={() => setInteracting(false)}
        onFocusCapture={() => setInteracting(true)}
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}
      >
        <span className="sr-only">Toolkit: {toolkit.join(", ")}</span>
        <motion.div aria-hidden="true" className="flex w-max items-center text-xl font-bold tracking-tight text-white/30" style={{ x: still ? 0 : x }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex min-w-screen shrink-0 items-center justify-around gap-14 px-7">
              {toolkit.map((tool) => <span key={tool} className="whitespace-nowrap">{tool}</span>)}
            </div>
          ))}
        </motion.div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#111111] via-transparent to-[#111111]" />
        <div className="absolute inset-x-0 flex justify-center px-6">
          <div className="flex max-w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-white/15 bg-[#141414]/95 px-5 py-4 text-center text-[9px] uppercase tracking-[0.12em] shadow-xl backdrop-blur-md sm:text-[10px]">
            <span>5+ years</span>
            <span className="text-white/60">50+ projects</span>
            <span className="text-accent"><span className="accent-text">Built with care</span></span>
          </div>
        </div>
      </div>

      <ul
        ref={trackRef}
        aria-label="Reviews"
        tabIndex={0}
        data-lenis-prevent
        className="relative flex snap-x snap-mandatory items-start gap-6 overflow-x-auto px-[var(--home-gutter)] pt-10 pb-7 [scrollbar-color:#454545_transparent] [scrollbar-width:thin]"
      >
        {reviews.map((review) => <ReviewCard key={review.id} review={review} still={still} />)}
      </ul>
      <div className="cinema-wrap relative flex flex-wrap items-center justify-between gap-4 pt-5">
        <button type="button" aria-label={paused ? "Resume toolkit animation" : "Pause toolkit animation"} aria-pressed={paused} disabled={still} onClick={() => setPaused(!paused)} className="flex min-h-11 items-center gap-2 font-mono! text-[10px]! uppercase tracking-wider text-white/55 hover:text-white disabled:cursor-default disabled:opacity-50">
          {paused || still ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
          {still ? "Motion reduced" : paused ? "Resume motion" : "Pause motion"}
        </button>
        <div className="flex gap-3">
          <button type="button" aria-label="Previous reviews" onClick={() => move(-1)} className="grid size-11 place-items-center rounded-full border border-white/15 hover:bg-white/10"><ArrowLeft size={18} aria-hidden="true" /></button>
          <button type="button" aria-label="Next reviews" onClick={() => move(1)} className="grid size-11 place-items-center rounded-full border border-white/15 hover:bg-white/10"><ArrowRight size={18} aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  );
}
