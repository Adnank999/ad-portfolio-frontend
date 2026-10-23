import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { getIndustry, getIndustryFaqs, type Industry } from "@/data/case-studies";
import { CaseStudyShell, CaseStudyBreadcrumbs, IndustryFilters, CaseStudyGrid, CaseStudyFaq, StudyContact } from "@/components/global/case-study-layout/CaseStudyLayout";
import { useSuspenseQuery } from "@tanstack/react-query";
import { caseStudiesOptions } from "@/queries/case-studies/case-studies";

export function IndustryPage({ industry }: { industry: Industry }) {
  const { data: allStudies } = useSuspenseQuery(caseStudiesOptions());
  const studies = allStudies.filter(study => study.industry === industry.slug);
  const concepts = studies.filter((study) => study.status === "concept").length;
  const toolCount = new Set(studies.flatMap((study) => study.technologies)).size;

  return <CaseStudyShell>
    <div className="mx-auto max-w-6xl px-6 pt-36 pb-12 md:px-12 md:pt-44">
      <CaseStudyBreadcrumbs items={[{ name: "Home", path: "/" }, { name: "Case studies", path: "/case-studies" }, { name: industry.name, path: `/case-studies/industries/${industry.slug}` }]} />
      <header className="grid items-center gap-8 pb-14 md:grid-cols-2 md:gap-12">
        <img src={studies[0]?.image || "/images/case-studies-cover.png"} alt={studies[0]?.imageAlt || `${industry.name} case studies`} width={1600} height={1000} className="aspect-[16/10] w-full rounded-2xl object-cover" />
        <div><p className="mb-4 text-[10px] uppercase tracking-[.18em] text-[#b29cae]">Industry / Case studies</p><h1 className="text-[clamp(3.5rem,6vw,5.75rem)] leading-[.98] [text-wrap:balance]">{industry.name}<br />Case Studies</h1><p className="mt-6 text-xs leading-[1.95] text-[#b1a7b6]">{industry.description}</p>
          <dl className="mt-7 grid grid-cols-3 gap-4">{[[studies.length, "Available studies"], [concepts, "New concepts"], [toolCount, "Tools explored"]].map(([value, label]) => <div key={label}><dt className="text-[9px] uppercase tracking-wider text-[#b29cae]">{label}</dt><dd className="mt-2 font-heading text-3xl text-white">{value}</dd></div>)}</dl>
        </div>
      </header>
      <IndustryFilters active={industry.slug} studies={allStudies} />
      <section className="py-14 md:py-20" aria-labelledby="industry-perspective-title">
        <p className="mb-4 text-[10px] uppercase tracking-[.18em] text-accent"><span className="accent-text">Industry perspective</span></p><h2 id="industry-perspective-title" className="mb-8 text-5xl leading-none md:text-6xl [text-wrap:balance]">A clearer view of {industry.name.toLowerCase()} workflows.</h2>
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] md:gap-16"><div><p className="text-xs leading-[2] text-[#b1a7b6]">{industry.perspective}</p><ul className="mt-7 space-y-3">{industry.priorities.map((priority) => <li key={priority} className="flex gap-3 text-[11px] leading-relaxed text-[#d4c9d9]"><span className="text-accent" aria-hidden="true"><span className="accent-text">↗</span></span>{priority}</li>)}</ul></div><aside className="self-start rounded-xl border border-white/10 bg-[#1b1b1b] p-6"><h3 className="mb-5 font-mono! text-[10px]! font-normal! uppercase tracking-widest text-[#b29cae]">Contexts to consider</h3><ul className="space-y-3">{industry.audiences.map((audience) => <li key={audience} className="text-[11px] leading-relaxed text-[#b1a7b6]">• {audience}</li>)}</ul></aside></div>
      </section>
      <section id="industry-studies" className="scroll-mt-28 py-10" aria-labelledby="industry-studies-title">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><h2 id="industry-studies-title" className="text-4xl leading-none">Studies in {industry.name}</h2><span className="text-[10px] text-[#b29cae]">{studies.length} {studies.length === 1 ? "study" : "studies"}</span></div>
        <p className="mb-7 max-w-2xl text-[11px] leading-[1.9] text-[#b1a7b6]">Portfolio entries and new concepts are labeled separately. Design outcomes are not presented as independently measured business results.</p>
        <CaseStudyGrid studies={studies} />
      </section>
      <section className="py-14 md:py-20" aria-labelledby="related-industries-title"><p className="mb-4 text-[10px] uppercase tracking-[.18em] text-accent"><span className="accent-text">Explore other perspectives</span></p><h2 id="related-industries-title" className="mb-8 text-4xl leading-none md:text-5xl">More industries to explore.</h2><div className="grid gap-4 md:grid-cols-3">{industry.related.map((slug) => {
        const related = getIndustry(slug);
        if (!related) return null;
        const count = allStudies.filter(study => study.industry === slug).length;
        return <Link key={slug} to={`/case-studies/industries/${slug}`} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#1b1b1b] p-6 transition-colors hover:border-accent/40"><h3 className="text-3xl leading-tight">{related.name}</h3><p className="line-clamp-3 text-[11px] leading-[1.9] text-[#b1a7b6]">{related.description}</p><span className="mt-auto flex min-h-11 items-center justify-between text-[10px] text-accent"><span className="accent-text">{count}</span> <span className="accent-text">{count === 1 ? "study" : "studies"}</span> <ArrowUpRight size={16} aria-hidden="true" /></span></Link>;
      })}</div></section>
      <CaseStudyFaq items={getIndustryFaqs(industry, allStudies)} />
      <StudyContact title={`What could work better in your ${industry.name.toLowerCase()} workflow?`} />
    </div>
  </CaseStudyShell>;
}
