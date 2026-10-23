import { GlassCard } from "@/components/ui/GlassCard";
import { education, experience, professionalProfile } from "@/data/experience";

export function Experience() {
  return (
    <main id="experience" className="pt-32 pb-24 sm:pb-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <header className="max-w-3xl">
          <p className="mb-4 text-xs uppercase tracking-[.24em] text-accent-300">Experience / From interface to infrastructure</p>
          <h1 className="text-4xl leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">Building the systems behind the experience.</h1>
          <p className="mt-6 text-base leading-8 text-slate-300">{professionalProfile.summary}</p>
          <p className="mt-4 text-sm leading-7 text-slate-400">{professionalProfile.focus}</p>
        </header>

        <section className="mt-16" aria-labelledby="experience-career-title">
          <h2 id="experience-career-title" className="mb-8 text-2xl sm:text-3xl">The work, and what it involved.</h2>
          <div className="relative ml-2 border-l border-white/10 pl-7 sm:ml-4 sm:pl-10">
          {experience.map(position => (
            <article key={position.company} className="relative mb-8 last:mb-0" aria-label={`${position.role} at ${position.company}`}>
              <span aria-hidden="true" className="absolute -left-[35px] top-7 size-3 rounded-full border-2 border-[#05070d] bg-accent-400 shadow-[0_0_0_5px_rgba(194,30,86,.12)] sm:-left-[47px]" />
              <GlassCard className="p-6 sm:p-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.18em] text-accent-300">
                      <span className="accent-text">{position.period}</span>
                    </p>
                    <h3 className="mt-3 text-2xl sm:text-3xl">{position.company}</h3>
                    <p className="mt-2 text-sm text-slate-300">{position.role}</p>
                  </div>
                  <p className="text-xs leading-6 text-slate-400">Company location<br />{position.location}</p>
                </div>
                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300">{position.summary}</p>
                <ul className="mt-6 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-400 marker:text-accent-400">
                  {position.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}
                </ul>
                <ul className="mt-7 flex flex-wrap gap-2" aria-label={`${position.company} technologies`}>
                  {position.technologies.map(technology => <li key={technology} className="border border-white/10 px-3 py-1.5 text-xs leading-5 text-slate-300">{technology}</li>)}
                </ul>
              </GlassCard>
            </article>
          ))}
          </div>
        </section>
        <section className="mt-16 border-t border-white/10 pt-10" aria-labelledby="experience-education-title">
          <p className="text-xs uppercase tracking-[.2em] text-accent-300">Education / The foundation</p>
          <h2 id="experience-education-title" className="mt-4 text-2xl sm:text-3xl">{education.institution}</h2>
          <p className="mt-4 text-base leading-7 text-slate-300">{education.qualification}</p>
          <p className="mt-3 text-sm leading-7 text-slate-400">{education.period} · {education.location}</p>
        </section>
      </div>
    </main>
  );
}
