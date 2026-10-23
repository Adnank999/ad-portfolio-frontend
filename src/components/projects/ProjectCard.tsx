import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Project } from "@/data/projects";
import { TechBadge } from "@/components/ui/TechBadge";
import { projectTransitionStyle, useProjectTransition } from "@/components/global/project-transition/projectTransition";

interface ProjectCardProps {
  project: Project;
  featured?: boolean;
}

export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  const viewTransition = useProjectTransition();

  return (
    <motion.div
      whileHover={viewTransition ? { y: -2 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`gpu-layer ${featured ? "md:col-span-2" : ""}`}
    >
      <Link
        to="/projects/$slug"
        params={{ slug: project.slug }}
        viewTransition={viewTransition}
        className="group block w-full rounded-[1.75rem] text-left outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        aria-label={`View ${project.title} project`}
      >
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0c101d] shadow-lg transition-colors duration-300 group-hover:border-white/20">
          <div
            className={`relative overflow-hidden ${featured ? "aspect-[16/8]" : "aspect-[16/10]"}`}
            style={projectTransitionStyle(project.slug, "image")}
          >
            <img
              src={project.image}
              alt={`${project.title} preview`}
              width={1600}
              height={featured ? 800 : 1000}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c101d] via-transparent to-transparent opacity-80" />
            <span
              style={projectTransitionStyle(project.slug, "category")}
              className="absolute top-4 left-4 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-slate-200 backdrop-blur-md"
            >
              {project.category}
            </span>
            <span className="absolute right-4 bottom-4 grid size-10 place-items-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition group-hover:bg-white group-hover:text-slate-950">
              <ArrowUpRight size={17} aria-hidden="true" />
            </span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3
                  style={projectTransitionStyle(project.slug, "title")}
                  className="text-xl font-bold tracking-tight text-white group-hover:text-accent-200 sm:text-2xl"
                >
                  <span className="accent-text">{project.title}</span>
                </h3>
                <p
                  style={projectTransitionStyle(project.slug, "description")}
                  className="mt-2 max-w-xl text-sm leading-6 text-slate-400"
                >
                  {project.description}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs text-slate-500">{project.year}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {project.technologies.slice(0, 4).map((tech) => <TechBadge key={tech}>{tech}</TechBadge>)}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
