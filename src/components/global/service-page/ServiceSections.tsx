import type { ReactNode } from "react";
import { Plus, ArrowUpRight, Check, Minus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ServiceMedia } from '../service-media/ServiceMedia';
import type { ServiceMedia as Media } from '@/lib/services/services';
import type { ServiceArtworkKind, ServiceItem } from "./servicePage.types";

export function ServiceSection({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 py-12 md:py-20">
      <p className="mb-4 text-[10px] uppercase tracking-[.2em] text-accent"><span className="accent-text">{eyebrow}</span></p>
      <h2 className="mb-7 max-w-3xl text-[clamp(2.5rem,4.5vw,4rem)] leading-[1.05] text-[#f3f0f2] [text-wrap:balance]">{title}</h2>
      {children}
    </section>
  );
}

export function ServiceGrid({ items }: { items: ServiceItem[] }) {
  return <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => (
    <article key={item.title} className="bg-[#191919] p-6 md:p-7">
      <span className="mb-5 block text-[10px] text-accent"><span className="accent-text">{String(index + 1).padStart(2, "0")}</span> <span className="accent-text">/</span></span>
      <h3 className="mb-3 text-2xl leading-tight text-[#f3f0f2]">{item.title}</h3>
      <p className="text-xs leading-[1.9] text-[#aaa6ac]">{item.text}</p>
    </article>
  ))}</div>;
}

export function ServiceComparison({ before, after }: { before: string[]; after: string[] }) {
  return <div className="grid gap-4 md:grid-cols-2">{[{ label: "What holds things back", items: before, positive: false }, { label: "A more considered approach", items: after, positive: true }].map((group) => (
    <div key={group.label} className={`rounded-xl border p-6 md:p-8 ${group.positive ? "border-accent/15 bg-[#22171e]" : "border-white/5 bg-[#1b1b1b]"}`}>
      <h3 className="mb-5 text-2xl">{group.label}</h3>
      <ul className="space-y-4">{group.items.map((item) => <li key={item} className="flex gap-3 text-xs leading-relaxed text-[#b3aeb6]">{group.positive ? <Check size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" /> : <Minus size={14} className="mt-0.5 shrink-0 text-[#737078]" aria-hidden="true" />}{item}</li>)}</ul>
    </div>
  ))}</div>;
}

export function ServiceSpotlight({ kind, title, text, points, media }: { kind: ServiceArtworkKind; title: string; text: string; points: string[]; media?: Media }) {
  return <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:gap-16 md:py-20">
    <div><p className="mb-4 text-[10px] uppercase tracking-[.2em] text-accent"><span className="accent-text">The connected view</span></p><h2 className="mb-6 text-[clamp(2.5rem,4.5vw,4rem)] leading-[1.05] [text-wrap:balance]">{title}</h2><p className="text-xs leading-[1.9] text-[#aaa6ac]">{text}</p><ul className="mt-5 space-y-2">{points.map((point) => <li key={point} className="flex gap-3 text-[11px] leading-relaxed text-[#bcb6be]"><span className="text-accent" aria-hidden="true"><span className="accent-text">↗</span></span>{point}</li>)}</ul></div>
    <ServiceMedia media={media} artwork={kind} className="aspect-[1.4]" />
  </section>;
}

export function ServiceAccordion({ items, numbered = false }: { items: ServiceItem[]; numbered?: boolean }) {
  return <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-[#191919]">{items.map((item, index) => (
    <details key={item.title} className="group p-5 md:px-7" open={numbered && index === 0 ? true : undefined}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 text-sm text-[#e0dce1] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
        {numbered && <span className={`text-[11px] ${index === items.length - 1 ? "text-accent" : "text-[#858087]"}`}><span className="accent-text">{String(index + 1).padStart(2, "0")}</span></span>}
        <span className="flex-1">{item.title}</span><Plus size={15} className="shrink-0 text-[#aaa6ac] transition-transform group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true" />
      </summary>
      <p className={`max-w-3xl pt-4 text-xs leading-[1.95] text-[#aaa6ac] ${numbered ? "pl-8" : ""}`}>{item.text}</p>
    </details>
  ))}</div>;
}

export function ServiceContactLink({ children = "Discuss your project" }: { children?: ReactNode }) {
  return <Link to="/contact" className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-accent px-6 py-3 text-[11px] font-medium text-white transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{children}<ArrowUpRight size={15} aria-hidden="true" /></Link>;
}
