import { useId, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Quote } from "lucide-react";
import type { Review } from "./reviews";

export function ReviewCard({ review, still }: { review: Review; still: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const quoteId = useId();

  return (
    <motion.li
      className="relative flex w-[min(82vw,350px)] shrink-0 snap-center flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.065] focus-within:border-white/30 motion-reduce:transition-none"
      whileHover={still ? undefined : { y: -12 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
    >
      <figure className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/50">
          <Quote size={13} aria-hidden="true" />
          {review.sample ? "Sample review" : "Client feedback"}
        </div>
        <span aria-hidden="true" className="text-xs tracking-[0.15em] text-amber-400">★★★★★</span>
        <blockquote
          id={quoteId}
          className={`text-[12px] italic leading-[1.65] text-white/80 ${expanded ? "" : "line-clamp-3"}`}
        >
          “{review.quote}”
        </blockquote>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={quoteId}
          aria-label={`${expanded ? "Collapse" : "Read full"} review from ${review.name}`}
          onClick={() => setExpanded(!expanded)}
          className="flex min-h-11 items-center gap-2 self-start font-mono! text-[10px]! uppercase tracking-[0.12em] text-accent hover:text-white"
        >
          <span className="accent-text">{expanded ? "Read less" : "Read more"}</span>
          <ArrowUpRight size={13} aria-hidden="true" />
        </button>
        <figcaption className="flex items-center gap-2 border-t border-white/10 pt-3">
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-[#754b78] to-[#25353f] text-[11px] text-white/80">
            {review.initials}
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[10px] leading-relaxed">
            <span className="text-white/80">{review.name}</span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span className="text-white/45">{review.role}</span>
          </span>
        </figcaption>
      </figure>
    </motion.li>
  );
}
