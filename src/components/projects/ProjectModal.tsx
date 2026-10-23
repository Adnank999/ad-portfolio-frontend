import { ArrowUpRight, Check, Github, X } from "lucide-react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { Project } from "@/data/projects";
import { GlassCard } from "@/components/ui/GlassCard";
import { TechBadge } from "@/components/ui/TechBadge";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (project) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop Fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeInOut" }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative h-full w-full overflow-y-auto px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto w-full max-w-5xl">
              <motion.div
                layoutId={`card-container-${project.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "tween",
                  stiffness: 280,
                  damping: 32,
                  mass: 0.6,
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="project-modal-title"
                className="gpu-layer relative overflow-hidden rounded-[2.25rem] border border-white/15 bg-[#0b0f19] text-left shadow-2xl"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close project details"
                  className="absolute right-4 top-4 z-20 grid size-10 place-items-center rounded-full border border-white/15 bg-black/50 text-slate-300 backdrop-blur-md transition hover:bg-white hover:text-slate-950"
                >
                  <X size={18} />
                </button>

                {/* Expanded Hero Image */}
                <motion.div
                  layoutId={`card-image-wrap-${project.id}`}
                  className="relative overflow-hidden"
                >
                  <motion.img
                    layoutId={`card-image-${project.id}`}
                    src={project.image}
                    alt={`${project.title} detailed preview`}
                    className="aspect-[16/8] w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-transparent" />

                  <motion.div
                    layoutId={`card-category-${project.id}`}
                    className="absolute bottom-5 left-5 sm:bottom-7 sm:left-7"
                  >
                    <span className="rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-md">
                      {project.category}
                    </span>
                  </motion.div>
                </motion.div>

                {/* Modal Content */}
                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-widest text-accent-400">
                          <span className="accent-text">{project.category}</span>
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {project.year}
                        </span>
                      </div>

                      <motion.h2
                        layoutId={`card-title-${project.id}`}
                        id="project-modal-title"
                        className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
                      >
                        {project.title}
                      </motion.h2>

                      <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                        {project.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-3">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15"
                        >
                          Live project
                          <ArrowUpRight size={14} />
                        </a>
                      )}

                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15"
                        >
                          <Github size={14} />
                          Code
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Technology Badges */}
                  <div className="mt-8 flex flex-wrap gap-2">
                    {project.technologies.map((technology) => (
                      <TechBadge key={technology}>{technology}</TechBadge>
                    ))}
                  </div>

                  {/* Details Section */}
                  <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
                    <article className="space-y-10">
                      {project.overview && (
                        <section>
                          <h3 className="text-xl font-bold text-white">
                            Overview
                          </h3>
                          <p className="mt-3 leading-relaxed text-slate-400">
                            {project.overview}
                          </p>
                        </section>
                      )}

                      {project.problem && (
                        <section>
                          <h3 className="text-xl font-bold text-white">
                            The problem
                          </h3>
                          <p className="mt-3 leading-relaxed text-slate-400">
                            {project.problem}
                          </p>
                        </section>
                      )}

                      {project.solution && (
                        <section>
                          <h3 className="text-xl font-bold text-white">
                            The solution
                          </h3>
                          <p className="mt-3 leading-relaxed text-slate-400">
                            {project.solution}
                          </p>
                        </section>
                      )}

                      {project.technical && (
                        <section>
                          <h3 className="text-xl font-bold text-white">
                            Technical implementation
                          </h3>
                          <p className="mt-3 leading-relaxed text-slate-400">
                            {project.technical}
                          </p>
                        </section>
                      )}
                    </article>

                    {/* Features Sidebar */}
                    {project.features && project.features.length > 0 && (
                      <aside>
                        <GlassCard className="sticky top-6 p-6">
                          <p className="text-xs font-semibold uppercase tracking-widest text-accent-300">
                            <span className="accent-text">Key features
                          </span></p>

                          <ul className="mt-4 space-y-3">
                            {project.features.map((feature) => (
                              <li
                                key={feature}
                                className="flex gap-3 text-sm leading-relaxed text-slate-300"
                              >
                                <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent-500/20 text-accent-400">
                                  <Check size={12} />
                                </span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </GlassCard>
                      </aside>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
