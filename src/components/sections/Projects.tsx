import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";

export function Projects() {
  return (
    <main id="work" className="pt-32 pb-24 sm:pb-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <header className="max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[.24em] text-accent-300"><span className="accent-text">Work / All projects</span></p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">Projects built to solve real problems.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">Engineering fast, resilient, and performant digital products.</p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              featured={!!project.featured}
            />
          ))}
        </div>

      </div>
    </main>
  );
}
