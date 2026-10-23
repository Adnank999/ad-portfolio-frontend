import { ArrowRight, ArrowUpRight, BookOpen, Code2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ServiceSummary } from '@/lib/services/services';
import { ServiceMedia } from '../service-media/ServiceMedia';
import { projects } from "@/data/projects";
import { ServiceArtwork } from "./ServiceArtwork";
import { ServiceAccordion, ServiceComparison, ServiceContactLink, ServiceGrid, ServiceSection, ServiceSpotlight } from "./ServiceSections";
import type { ServiceContent } from "./servicePage.types";

const phases = ["Discover", "Diagnose", "Design", "Deliver", "Evolve"];

export function ServicePage({ content, services = [] }: { content: ServiceContent; services?: ServiceSummary[] }) {
  const related = services.filter((service) => service.enabled && content.related.includes(service.slug)).map(service => ({ slug: service.slug, name: service.navTitle, description: service.navDescription }));
  const media = (slot: string) => content.media?.find(media => media.slot === slot);
  const work = projects.filter((project) => content.projectSlugs?.includes(project.slug));

  return (
    <main className="overflow-hidden bg-[#151515] font-mono text-[#f3f0f2] selection:bg-accent/40">
      <a href="#service-overview" className="sr-only fixed top-28 left-6 z-90 rounded-lg bg-accent p-4 text-sm focus:not-sr-only">Skip to service details</a>
      <section className="relative isolate flex min-h-[720px] flex-col items-center justify-center overflow-hidden px-6 pt-36 pb-20 text-center md:min-h-[800px]">
        <div className="pointer-events-none absolute top-10 left-1/2 -z-20 w-[min(150%,1500px)] max-w-none -translate-x-1/2 opacity-65 md:-top-20">
          {!media('hero') && <ServiceArtwork kind={content.artwork} className="aspect-[1.7] scale-125 border-none!" />}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-[#151515] via-[#151515]/40 to-[#151515]/25" />
        <Link to="/services" className="mb-7 inline-flex min-h-11 items-center gap-2 text-[10px] uppercase tracking-[.18em] text-[#d2b8c8] hover:text-white">Services <span aria-hidden="true">/</span> {content.category}</Link>
        <h1 className="max-w-4xl text-[clamp(3.75rem,8.5vw,8rem)] leading-[.95] [text-wrap:balance]">{content.title}</h1>
        <p className="mt-7 max-w-xl text-xs leading-[1.9] text-[#d1c6cf] md:text-sm">{content.summary}</p>
        {media('hero') && <div className="mt-10 w-full max-w-4xl"><ServiceMedia media={media('hero')} artwork={content.artwork} /></div>}
        <div className="mt-8"><ServiceContactLink /></div>
        <div className="mt-9 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[9px] uppercase tracking-wider text-[#b7a9b2]"><span>Adnan Hossain Khan</span><span>Based in Bangladesh</span><span>Working remotely</span></div>
      </section>

      <nav aria-label="On this service page" className="border-y border-white/10 px-6">
        <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-7 gap-y-1 py-4">{[["Overview", "service-overview"], ["Solutions", "service-solutions"], ["Deliverables", "service-deliverables"], ["Method", "service-method"], ["Getting started", "service-preparation"], ["FAQ", "service-faq"], ["Insights", "service-insights"]].map(([label, id]) => <li key={id}><a href={`#${id}`} className="inline-flex min-h-11 items-center text-[10px] uppercase tracking-[.15em] text-[#aaa6ac] hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"><span className="accent-text">{label}</span></a></li>)}</ul>
      </nav>

      <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-12 md:py-12">
        <section id="service-overview" className="scroll-mt-28 py-12 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div><p className="mb-4 text-[10px] uppercase tracking-[.2em] text-accent"><span className="accent-text">01 / The fundamentals</span></p><h2 className="mb-6 text-[clamp(2.5rem,4.5vw,4rem)] leading-[1.05] [text-wrap:balance]">{content.overview.title}</h2><p className="text-xs leading-[1.95] text-[#aaa6ac]">{content.overview.text}</p></div>
            <ServiceMedia media={media('overview')} artwork={content.artwork} className="aspect-[1.4]" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">{content.overview.definitions.map((item) => <article key={item.title} className="rounded-xl bg-[#1c1c1c] p-6"><h3 className="mb-3 text-2xl">{item.title}</h3><p className="text-xs leading-[1.9] text-[#aaa6ac]">{item.text}</p></article>)}</div>
        </section>

        <ServiceSection eyebrow="02 / A better starting point" title={content.challenge.title}><ServiceComparison before={content.challenge.before} after={content.challenge.after} /></ServiceSection>
        <ServiceSection id="service-solutions" eyebrow="03 / How I can help" title={content.offerings.title}><ServiceGrid items={content.offerings.items} /></ServiceSection>
        <ServiceSection id="service-deliverables" eyebrow="04 / What you receive" title={content.deliverables.title}>
          <p className="mb-7 max-w-2xl text-xs leading-[1.9] text-[#aaa6ac]">The proposal defines the deliverables for your project. A typical engagement brings together the following.</p>
          <ServiceGrid items={content.deliverables.items} />
          <div className="mt-5 rounded-xl border border-accent/20 bg-[#22171e] p-6 md:p-7">
            <h3 className="mb-3 text-2xl">How we review the result</h3>
            <p className="max-w-3xl text-xs leading-[1.9] text-[#bcb6be]">{content.deliverables.acceptance}</p>
          </div>
        </ServiceSection>
        <ServiceSpotlight kind={content.artwork} media={media('spotlight')} {...content.spotlight} />

        <ServiceSection eyebrow="Where it fits" title="Built around your working environment.">
          <p className="mb-7 max-w-2xl text-xs leading-[1.9] text-[#aaa6ac]">Your users, existing tools, and day-to-day responsibilities shape the scope. These are some of the settings this service can support.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{content.sectors.map((sector) => <div key={sector} className="flex items-center justify-between gap-4 rounded-lg border border-white/8 px-5 py-5 text-xs text-[#c8c2ca]">{sector}<ArrowUpRight size={14} className="text-accent" aria-hidden="true" /></div>)}</div>
        </ServiceSection>

        <section aria-label="Relevant tools and technologies" className="py-12 text-center"><p className="mx-auto mb-6 max-w-xs text-xs leading-relaxed text-[#b4abb5]">Tools chosen for the problem.<br />Not the other way around.</p><ul className="flex flex-wrap justify-center gap-x-7 gap-y-4">{content.tools.map((tool) => <li key={tool} className="flex items-center gap-2 text-[11px] text-[#aaa6ac]"><Code2 size={15} aria-hidden="true" />{tool}</li>)}</ul></section>

        <ServiceSection eyebrow="In practice" title={content.approach.title}><ServiceGrid items={content.approach.items} /></ServiceSection>
        <ServiceSection id="service-method" eyebrow="05 / How the work moves forward" title="A clear path from discovery to handover."><ServiceAccordion numbered items={phases.map((title, index) => ({ title, text: content.process[index] }))} /></ServiceSection>

        <ServiceSection eyebrow="06 / Ways to work together" title={content.engagement.title}><ServiceGrid items={content.engagement.items} /><p className="mt-5 max-w-3xl text-[11px] leading-[1.9] text-[#aaa6ac]">You work directly with me, Adnan, from Bangladesh. Before work begins, we agree on deliverables, fees, review dates, time-zone overlap, and support responsibilities. Progress is shared through written updates and milestone reviews.</p><div className="mt-6"><ServiceContactLink>Discuss your scope</ServiceContactLink></div></ServiceSection>

        <ServiceSection id="service-preparation" eyebrow="Before our first conversation" title={content.preparation.title}>
          <div className="grid gap-7 md:grid-cols-2 md:gap-12">
            <p className="max-w-2xl text-xs leading-[1.95] text-[#aaa6ac]">{content.preparation.text}</p>
            <ul className="space-y-4 rounded-xl border border-white/10 bg-[#191919] p-6 md:p-7">{content.preparation.items.map((item) => <li key={item} className="flex gap-3 text-xs leading-[1.9] text-[#bcb6be]"><span aria-hidden="true" className="text-accent"><span className="accent-text">/</span></span>{item}</li>)}</ul>
          </div>
        </ServiceSection>

        {work.length > 0 && <ServiceSection eyebrow="Selected portfolio work" title="Explore relevant portfolio projects."><div className="grid gap-5 sm:grid-cols-2">{work.map((project) => <Link key={project.slug} to="/projects/$slug" params={{ slug: project.slug }} className="group rounded-xl border border-white/10 bg-[#1b1b1b] p-6 transition-colors hover:border-accent/40"><p className="mb-4 text-[10px] uppercase tracking-widest text-accent"><span className="accent-text">{project.category}</span></p><h3 className="mb-3 text-3xl">{project.title}</h3><p className="text-xs leading-[1.9] text-[#aaa6ac]">{project.description}</p><span className="mt-5 inline-flex min-h-11 items-center gap-3 text-[11px] text-accent"><span className="accent-text">View portfolio project </span><ArrowUpRight size={15} aria-hidden="true" /></span></Link>)}</div></ServiceSection>}

        <ServiceSection id="service-faq" eyebrow="07 / Common questions" title={content.faqTitle}><ServiceAccordion items={content.faqs} /></ServiceSection>
        <ServiceSection eyebrow="Often paired with" title="Services that can support the next step."><div className="divide-y divide-white/10 rounded-xl border border-white/10">{related.map((service) => <Link key={service.slug} to="/services/$slug" params={{ slug: service.slug }} className="flex min-h-24 items-center gap-5 px-5 py-4 transition-colors hover:bg-white/3"><div className="grid size-12 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"><Code2 size={20} aria-hidden="true" /></div><span className="flex-1"><span className="block text-sm text-[#e3dce6]">{service.name}</span><span className="mt-2 block text-[11px] leading-relaxed text-[#aaa6ac]">{service.description}</span></span><ArrowRight size={18} aria-hidden="true" /></Link>)}</div></ServiceSection>

        <ServiceSection id="service-insights" eyebrow="From the notebook" title="Ideas worth a closer look.">
          <p className="mb-6 text-[11px] text-[#aaa6ac]">Practical guides to the decisions behind the work. These articles are in preparation.</p>
          <div className="grid gap-5 md:grid-cols-3">{content.articles.map((article, index) => <article key={article.title} className="overflow-hidden rounded-xl border border-white/10 bg-[#191919]">
            <div className="relative"><ServiceMedia media={media(`article-${index + 1}`)} artwork={index === 0 ? content.artwork : index === 1 ? "data" : "software"} className="aspect-[1.65] rounded-none! border-none!" /><span className="pointer-events-none absolute top-3 left-3 rounded-full border border-white/10 bg-[#151515]/90 px-3 py-1 text-[9px] uppercase tracking-wider text-[#d2b8c8]">Coming soon</span></div>
            <div className="p-5"><p className="mb-3 flex items-center gap-2 text-[9px] uppercase tracking-wider text-accent"><BookOpen size={12} aria-hidden="true" /><span className="accent-text">Insight / 0</span><span className="accent-text">{index + 1}</span></p><h3 className="mb-3 text-2xl leading-tight">{article.title}</h3><p className="text-[11px] leading-[1.9] text-[#aaa6ac]">{article.text}</p></div>
          </article>)}</div>
        </ServiceSection>
      </div>
    </main>
  );
}
