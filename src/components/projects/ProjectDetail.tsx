import { ArrowLeft, ArrowUpRight, Check, Github } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Project } from "@/data/projects";
import { GlassCard } from "@/components/ui/GlassCard";
import { TechBadge } from "@/components/ui/TechBadge";
import { projects } from "@/data/projects";
import { projectTransitionStyle, useProjectTransition } from "@/components/global/project-transition/projectTransition";

export function ProjectDetail({ project }: { project: Project }) {
  const related = projects.filter((p) => p.slug !== project.slug).slice(0, 2);
  const viewTransition = useProjectTransition();
  return (
    <main className="pt-28 pb-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Link
          to="/projects"
          viewTransition={viewTransition}
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to Work
        </Link>
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <span style={projectTransitionStyle(project.slug, "category")} className="rounded-full border border-accent-400/15 bg-accent-400/[.07] px-3 py-1.5 text-xs font-semibold text-accent-200">
              <span className="accent-text">{project.category}</span>
            </span>
            <span className="text-xs text-slate-600">{project.year}</span>
          </div>
          <h1 style={projectTransitionStyle(project.slug, "title")} className="mt-5 max-w-5xl text-4xl font-extrabold tracking-[-.04em] sm:text-6xl">
            {project.title}
          </h1>
          <p style={projectTransitionStyle(project.slug, "description")} className="mt-5 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg">
            {project.description}
          </p>
        </div>
        <div
          className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.02]"
          style={projectTransitionStyle(project.slug, "image")}
        >
          <img
            src={project.image}
            alt={`${project.title} detailed project preview`}
            width={1600}
            height={800}
            loading="eager"
            decoding="async"
            className="aspect-[16/8] w-full object-cover"
          />
        </div>
        <div className="mt-7 flex flex-wrap gap-2">
          {project.technologies.map((t) => (
            <TechBadge key={t}>{t}</TechBadge>
          ))}
          <a
            href={project.liveUrl}
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold hover:bg-white/[.08]"
          >
            Live project <ArrowUpRight size={14} />
          </a>
          <a
            href={project.githubUrl}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold hover:bg-white/[.08]"
          >
            <Github size={14} /> Code
          </a>
        </div>
        <div className="mt-16 grid gap-12 lg:grid-cols-[1.2fr_.8fr]">
          <article className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold">Overview</h2>
              <p className="mt-4 leading-8 text-slate-400">
                {project.overview}
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold">The problem</h2>
              <p className="mt-4 leading-8 text-slate-400">{project.problem}</p>
            </section>
            <section>
              <h2 className="text-2xl font-bold">The solution</h2>
              <p className="mt-4 leading-8 text-slate-400">
                {project.solution}
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold">Technical implementation</h2>
              <p className="mt-4 leading-8 text-slate-400">
                {project.technical}
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold">Challenges</h2>
              <p className="mt-4 leading-8 text-slate-400">
                {project.challenges}
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold">Results</h2>
              <p className="mt-4 leading-8 text-slate-400">{project.results}</p>
            </section>
          </article>
          <aside>
            <GlassCard className="sticky top-24 p-6">
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-accent-300">
                <span className="accent-text">Key features
              </span></p>
              <ul className="mt-5 space-y-4">
                {project.features.map((f) => (
                  <li
                    key={f}
                    className="flex gap-3 text-sm leading-6 text-slate-300"
                  >
                    <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent-400/10 text-accent-300">
                      <Check size={12} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </aside>
        </div>
        <section className="mt-24">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500">
            Keep exploring
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {related.map((relatedProject) => (
              <Link
                key={relatedProject.slug}
                to="/projects/$slug"
                params={{ slug: relatedProject.slug }}
                viewTransition={viewTransition}
                className="glass group overflow-hidden rounded-3xl p-2"
              >
                <img
                  src={relatedProject.image}
                  alt=""
                  width={1600}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/8] w-full rounded-2xl object-cover opacity-80 transition duration-500 group-hover:scale-[1.02]"
                />
                <div className="p-4">
                  <p className="text-xs text-accent-300"><span className="accent-text">{relatedProject.category}</span></p>
                  <h3 className="mt-1 text-lg font-bold">{relatedProject.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
