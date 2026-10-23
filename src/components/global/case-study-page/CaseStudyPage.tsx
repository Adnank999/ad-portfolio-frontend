import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { getIndustry, type CaseStudy } from "@/data/case-studies";
import { CaseStudyShell, CaseStudyBreadcrumbs, CaseStudyFaq, StudyLabel, StudyContact } from "@/components/global/case-study-layout/CaseStudyLayout";
import "./case-study.css";

const sections = [["context", "The context"], ["problem", "The problem"], ["approach", "The approach"], ["tools", "Tools & architecture"], ["outcomes", "Outcomes & evidence"], ["lessons", "Lessons"], ["faq", "Questions"]];

function StorySection({ id, number, title, children }: { id: string; number: string; title: string; children: ReactNode }) {
  return <section id={id} className="relative scroll-mt-28 border-b border-[#25162e]/10 py-12 md:py-16"><span aria-hidden="true" className="pointer-events-none absolute top-8 right-0 font-heading text-8xl text-[#dad4e5]/70">{number}</span><h2 className="relative mb-7 max-w-xl pr-14 text-5xl leading-none md:text-6xl [text-wrap:balance]">{title}</h2><div className="relative">{children}</div></section>;
}

export function CaseStudyPage({ study }: { study: CaseStudy }) {
  const industry = getIndustry(study.industry);
  if (!industry) return null;
  const navigation = (study.editorContent ? [["story", "The study"], ["faq", "Questions"]] : sections).filter(([id]) => id !== "faq" || study.faqs.length > 0);

  return <CaseStudyShell>
    <div className="mx-auto max-w-6xl px-6 pt-36 pb-16 md:px-12 md:pt-44">
      <CaseStudyBreadcrumbs items={[{ name: "Home", path: "/" }, { name: "Case studies", path: "/case-studies" }, { name: industry.name, path: `/case-studies/industries/${industry.slug}` }, { name: study.title, path: `/case-studies/${study.slug}` }]} />
      <header className="grid items-center gap-10 md:grid-cols-2 md:gap-14"><div><StudyLabel status={study.status} /><p className="mt-6 mb-4 text-[10px] uppercase tracking-[.18em] text-[#b29cae]">{industry.name} / Technical study</p><h1 className="text-[clamp(3.25rem,5.5vw,5.5rem)] leading-[.98] [text-wrap:balance]">{study.title}</h1><p className="mt-6 text-xs leading-[1.95] text-[#b1a7b6]">{study.description}</p><p className="mt-6 border-l-2 border-accent pl-4 text-[11px] leading-[1.9] text-[#c1b4c9]">{study.status === "concept" ? "Fictional concept study. Not a commissioned client project, live deployment, or measured business outcome." : "Expanded from the existing portfolio. Outcomes describe the design; independent business results are not supplied."}</p></div><img src={study.image || "/images/case-studies-cover.png"} alt={study.imageAlt || study.title} width={1600} height={1000} fetchPriority="high" className="aspect-[16/10] w-full rounded-2xl object-cover" /></header>
    </div>
    <article className="rounded-t-[2rem] bg-[#efedf7] px-6 pb-8 text-[#261c30] md:rounded-t-[3rem] md:px-12">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[160px_minmax(0,1fr)] md:gap-14">
        <aside className="pt-10 md:sticky md:top-28 md:self-start md:pt-16"><nav aria-label="On this case study"><ul className="flex flex-wrap gap-3 md:flex-col md:gap-4">{navigation.map(([id, label], index) => <li key={id}><a href={`#${id}`} className="inline-flex min-h-8 items-center gap-2 text-[10px] text-[#695c74] hover:text-[#a60062] focus-visible:outline-2 focus-visible:outline-[#a60062]"><span className="text-[#a883a0]">0{index + 1}</span>{label}</a></li>)}</ul></nav></aside>
        <div className="min-w-0">
          {study.editorContent && study.renderedHtml ? <section id="story" className="case-study-rich py-12 md:py-16" aria-label="Case study content" dangerouslySetInnerHTML={{ __html: study.renderedHtml.split("<section><h2>Frequently asked questions</h2>")[0] }} /> : <>
          <StorySection id="context" number="01" title="The context behind the interface."><p className="max-w-2xl text-sm leading-[2] text-[#5e5268]">{study.context}</p><dl className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-[#25162e]/10 bg-white/35 p-5"><dt className="text-[10px] uppercase tracking-wider text-[#846c85]">Industry</dt><dd className="mt-3 text-sm">{industry.name}</dd></div><div className="rounded-xl border border-[#25162e]/10 bg-white/35 p-5"><dt className="text-[10px] uppercase tracking-wider text-[#846c85]">Study type</dt><dd className="mt-3 text-sm">{study.status === "concept" ? "Illustrative concept" : "Existing portfolio project"}</dd></div></dl></StorySection>
          <StorySection id="problem" number="02" title="What needed a clearer answer."><p className="max-w-2xl text-sm leading-[2] text-[#5e5268]">{study.problem}</p></StorySection>
          <StorySection id="approach" number="03" title="How the approach takes shape."><p className="mb-8 max-w-2xl text-sm leading-[2] text-[#5e5268]">{study.solution}</p><div className="grid gap-4 sm:grid-cols-2">{study.steps.map((step, index) => <div key={step.title} className="rounded-xl border border-[#25162e]/10 bg-white/40 p-6"><span className="mb-5 block font-heading text-4xl text-[#b8a6bf]">0{index + 1}</span><h3 className="mb-3 text-3xl leading-tight">{step.title}</h3><p className="text-xs leading-[1.95] text-[#5e5268]">{step.text}</p></div>)}</div></StorySection>
          <StorySection id="tools" number="04" title="Tools & architectural choices."><ul className="flex flex-wrap gap-3">{study.technologies.map((tool) => <li key={tool} className="rounded-full border border-[#25162e]/15 bg-white/40 px-4 py-3 text-[11px] text-[#5e5268]">{tool}</li>)}</ul><p className="mt-6 max-w-2xl text-xs leading-[1.95] text-[#5e5268]">{study.status === "concept" ? "These technologies are proposed for the concept. They do not imply an implemented production system or a vendor certification." : "These technologies come from the existing portfolio description. Their inclusion is not an independent verification of a production deployment."}</p></StorySection>
          <StorySection id="outcomes" number="05" title="Design outcomes. Clear evidence boundaries."><div className="space-y-4">{study.outcomes.map((outcome) => <div key={outcome.title} className="rounded-xl border border-[#25162e]/10 bg-white/40 p-6"><h3 className="mb-3 text-3xl">{outcome.title}</h3><p className="text-xs leading-[1.95] text-[#5e5268]">{outcome.text}</p></div>)}</div></StorySection>
          <StorySection id="lessons" number="06" title="What the study brings into focus."><ol className="grid gap-4 sm:grid-cols-3">{study.lessons.map((lesson, index) => <li key={lesson} className="rounded-xl border border-[#25162e]/10 p-5"><span className="mb-4 block font-heading text-4xl text-[#b5006c]">0{index + 1}</span><p className="text-xs leading-[1.95] text-[#5e5268]">{lesson}</p></li>)}</ol></StorySection>
          </>}
          {!!study.gallery?.length && <section className="grid gap-6 py-12 sm:grid-cols-2" aria-label="Case study photos">{study.gallery.map(image => <figure key={image.url}><img src={image.url} alt={image.alt} width={1600} height={1000} loading="lazy" className="h-auto w-full rounded-xl" />{image.caption && <figcaption className="mt-3 text-xs leading-relaxed text-[#5e5268]">{image.caption}</figcaption>}</figure>)}</section>}
          {!!study.faqs.length && <CaseStudyFaq items={study.faqs} light />}
          {study.projectSlug && <Link to="/projects/$slug" params={{ slug: study.projectSlug }} className="mb-12 inline-flex min-h-11 items-center gap-3 text-xs text-[#96355f] focus-visible:outline-2 focus-visible:outline-[#96355f]">Read the original portfolio entry <ArrowUpRight size={15} aria-hidden="true" /></Link>}
        </div>
      </div>
    </article>
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-12"><StudyContact title="Ready to explore your own version?" /></div>
  </CaseStudyShell>;
}
