import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useSuspenseQuery } from '@tanstack/react-query';
import { servicesOptions } from '@/queries/services/services';
import { groupServices } from '@/lib/services/services';
import { ServiceContactLink } from "@/components/global/service-page/ServiceSections";

const groupDescriptions: Record<string, string> = {
  "Software & Product": "Launch a website, build a product, add development capacity, or make an existing application easier to maintain.",
  "Cloud, Data & AI": "Move an application, make reporting dependable, or automate a repetitive task with a clear way to review the result.",
  "Business Systems": "Improve how records, decisions, and customer information move between the people and tools in your operation.",
  "Growth (AI-era)": "Make your offer easier to discover and understand, then connect the visit or ad click to a useful next action.",
};

export function ServicesIndexPage() {
  const { data } = useSuspenseQuery(servicesOptions());
  const serviceGroups = groupServices(data);
  return <main className="min-h-screen bg-[#151515] px-6 pt-44 pb-24 font-mono text-[#f3f0f2] md:px-12">
    <div className="mx-auto max-w-6xl">
      <p className="mb-6 text-[10px] uppercase tracking-[.2em] text-accent"><span className="accent-text">Services / Adnan Hossain Khan</span></p>
      <h1 className="max-w-3xl text-[clamp(4rem,8vw,7rem)] leading-none">Build what your business needs next.</h1>
      <p className="mt-7 max-w-2xl text-sm leading-[1.9] text-[#aaa6ac]">I help turn product ideas and operational problems into working websites, software, and connected systems. Explore the service closest to your challenge to see what the work involves, what you receive, and how to prepare for a first conversation.</p>
      <div className="mt-8"><ServiceContactLink /></div>
      {!serviceGroups.length && <p className="mt-16 text-sm text-zinc-400">No services are currently available. Please contact me to discuss your project.</p>}
      {serviceGroups.map((group) => <section key={group.label} className="mt-20">
        <h2 className="mb-4 text-4xl">{group.label}</h2>
        <p className="mb-7 max-w-2xl text-xs leading-[1.9] text-[#aaa6ac]">{groupDescriptions[group.label]}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{group.items.map((item) => <Link key={item.label} to={item.href ?? "/services"} className="group flex flex-col rounded-xl border border-white/10 bg-[#1c1c1c] p-7 transition-colors hover:border-accent/50">
          <ArrowUpRight size={21} className="mb-8 text-accent" aria-hidden="true" />
          <h3 className="mb-3 text-3xl">{item.label}</h3><p className="text-xs leading-[1.9] text-[#aaa6ac]">{item.description}</p>
          <span className="mt-6 text-[10px] uppercase tracking-widest text-accent"><span className="accent-text">Explore service</span></span>
        </Link>)}</div>
      </section>)}
    </div>
  </main>;
}
