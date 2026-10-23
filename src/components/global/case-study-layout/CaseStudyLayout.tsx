import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight, Plus } from "lucide-react";
import { industries, getIndustry, type Answer, type CaseStudy } from "@/data/case-studies";
import type { CaseStudySummary } from "@/data/case-studies/types";

export function CaseStudyShell({ children }: { children: ReactNode }) {
  return <main className="relative isolate min-h-screen overflow-hidden bg-[#151515] font-mono text-[#f3eff4] selection:bg-accent/40">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,#ffffff09_1px,transparent_1px)] bg-size-[20px_20px]" />
    {children}
  </main>;
}

export function CaseStudyBreadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return <nav aria-label="Breadcrumb" className="pb-8 text-[10px] text-[#b2a9b5]">
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">{items.map((item, index) => <li key={item.path} className="flex min-h-8 items-center gap-2">
      {index > 0 && <ChevronRight size={11} className="text-[#807484]" aria-hidden="true" />}
      {index === items.length - 1 ? <span aria-current="page" className="text-[#e2d6e4]">{item.name}</span> : <Link to={item.path} className="hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"><span className="accent-text">{item.name}</span></Link>}
    </li>)}</ol>
  </nav>;
}

export function IndustryFilters({ active, studies }: { active?: string; studies: CaseStudySummary[] }) {
  return <nav aria-label="Case study industries" className="border-y border-white/10 py-5">
    <ul className="flex flex-wrap gap-2">
      <li><Link to="/case-studies" aria-current={!active ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-full border px-3 py-2 text-[9px] uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-accent ${!active ? "border-accent/40 bg-accent/10 text-[#f1b6d7]" : "border-transparent text-[#aaa0ae] hover:border-white/20 hover:text-white"}`}>All industries</Link></li>
      {industries.map((industry) => <li key={industry.slug}><Link to={`/case-studies/industries/${industry.slug}`} aria-current={active === industry.slug ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-[9px] uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-accent ${active === industry.slug ? "border-accent/40 bg-accent/10 text-[#f1b6d7]" : "border-transparent text-[#aaa0ae] hover:border-white/20 hover:text-white"}`}>{industry.name}<span className="text-[#d2b6ca]">{studies.filter(study => study.industry === industry.slug).length}</span></Link></li>)}
    </ul>
  </nav>;
}

export function StudyLabel({ status }: { status: CaseStudy["status"] }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-[9px] uppercase tracking-wider ${status === "concept" ? "border-accent/30 bg-accent/10 text-[#f1a8d0]" : "border-white/15 bg-white/5 text-[#c9bdce]"}`}>{status === "concept" ? "Concept study" : "Portfolio study"}</span>;
}

export function CaseStudyGrid({ studies }: { studies: CaseStudySummary[] }) {
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{studies.map((study) => {
    const industry = getIndustry(study.industry);
    if (!industry) return null;
    return <Link key={study.slug} to="/case-studies/$slug" params={{ slug: study.slug }} className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1b1b1b] transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
      <img src={study.image || "/images/case-studies-cover.png"} alt={study.imageAlt || study.title} width={1600} height={1000} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none" />
      <div className="flex flex-1 flex-col gap-4 p-6"><StudyLabel status={study.status} /><p className="text-[9px] uppercase tracking-wider text-[#b29cae]">{industry.name}</p><h3 className="text-3xl leading-tight text-white [text-wrap:balance]">{study.title}</h3><p className="line-clamp-3 text-[11px] leading-[1.9] text-[#b1a7b6]">{study.description}</p><span className="mt-auto flex min-h-11 items-center justify-between gap-4 pt-4 text-[10px] uppercase tracking-wider text-accent"><span className="accent-text">Read the study </span><ArrowUpRight size={17} aria-hidden="true" /></span></div>
    </Link>;
  })}</div>;
}

export function CaseStudyFaq({ items, light = false }: { items: Answer[]; light?: boolean }) {
  return <section id="faq" aria-labelledby="case-faq-title" className="scroll-mt-28 py-14 md:py-20">
    <p className={`mb-4 text-[10px] uppercase tracking-[.18em] ${light ? "text-[#96355f]" : "text-accent"}`}><span className="accent-text">Questions & answers</span></p>
    <h2 id="case-faq-title" className="mb-8 text-4xl leading-none md:text-5xl">Frequently asked questions</h2>
    <div className={`divide-y overflow-hidden rounded-xl border ${light ? "divide-[#20172a]/10 border-[#20172a]/10 bg-white/40" : "divide-white/10 border-white/10 bg-[#1b1b1b]"}`}>{items.map((faq) => <details key={faq.question} className="group px-5 py-4 md:px-7">
      <summary className={`flex min-h-11 cursor-pointer list-none items-center gap-4 text-xs leading-relaxed focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b5006c] [&::-webkit-details-marker]:hidden ${light ? "text-[#382b40]" : "text-[#e1d9e5]"}`}><span className="flex-1">{faq.question}</span><Plus size={15} className="shrink-0 transition-transform group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true" /></summary>
      <p className={`max-w-3xl pt-4 pb-2 text-xs leading-[1.95] ${light ? "text-[#5e5268]" : "text-[#b1a7b6]"}`}>{faq.answer}</p>
    </details>)}</div>
  </section>;
}

export function StudyContact({ title = "Have a similar workflow in mind?" }: { title?: string }) {
  return <section className="my-12 rounded-2xl border border-white/10 bg-[#1c1c1c] px-6 py-14 text-center md:my-20 md:px-12 md:py-20"><h2 className="mx-auto max-w-3xl text-5xl leading-none md:text-6xl [text-wrap:balance]">{title}</h2><p className="mx-auto mt-6 max-w-md text-xs leading-[1.9] text-[#b1a7b6]">Tell me what you are trying to improve. We can discuss the users, constraints, and a sensible first step for your own project.</p><Link to="/contact" className="mt-7 inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-accent px-7 py-3 text-[10px] uppercase tracking-wider text-white transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Let's talk <ArrowUpRight size={15} aria-hidden="true" /></Link></section>;
}
