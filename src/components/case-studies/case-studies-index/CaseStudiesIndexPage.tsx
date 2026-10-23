import { caseStudyFaqs, industries } from "@/data/case-studies";
import { CaseStudyShell, CaseStudyBreadcrumbs, IndustryFilters, CaseStudyGrid, CaseStudyFaq, StudyContact } from "@/components/global/case-study-layout/CaseStudyLayout";

export function CaseStudiesIndexPage({ studies }: { studies: import("@/data/case-studies/types").CaseStudySummary[] }) {
  return <CaseStudyShell><div className="mx-auto max-w-6xl px-6 pt-36 pb-12 md:px-12 md:pt-44">
    <CaseStudyBreadcrumbs items={[{ name: "Home", path: "/" }, { name: "Case studies", path: "/case-studies" }]} />
    <header className="max-w-3xl pb-12"><p className="mb-5 text-[10px] uppercase tracking-[.18em] text-accent"><span className="accent-text">The thinking behind the interface</span></p><h1 className="text-[clamp(4rem,8vw,7rem)] leading-none">Different industries.<br />Thoughtful systems.</h1><p className="mt-7 max-w-xl text-sm leading-[1.95] text-[#b1a7b6]">Explore {studies.length} software studies across {industries.length} industries. Existing portfolio entries sit alongside clearly labeled concepts, with practical explanations rather than invented client results.</p></header>
    <IndustryFilters studies={studies} />
    <section className="py-12" aria-labelledby="all-studies-title"><h2 id="all-studies-title" className="mb-8 text-4xl">All case studies</h2><CaseStudyGrid studies={studies} /></section>
    <CaseStudyFaq items={caseStudyFaqs} />
    <StudyContact />
  </div></CaseStudyShell>;
}
