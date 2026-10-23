import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#151515] bg-[radial-gradient(#ffffff0b_1px,transparent_1px)] bg-[size:22px_22px] font-mono text-[#f3f0f2] selection:bg-accent/40">
      <a href="#blog-content" className="sr-only fixed top-28 left-6 z-90 rounded-lg bg-accent p-4 text-sm focus:not-sr-only">Skip to blog content</a>
      <div className="mx-auto max-w-6xl px-6 pt-36 pb-24 md:px-12 md:pt-44 md:pb-32">{children}</div>
    </main>
  );
}

export function BlogLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[10px] uppercase tracking-[.18em] text-[#b0a8b1] ${className}`}>{children}</p>;
}

export function BlogBreadcrumbs({ category, title }: { category: string; title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-9">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[.12em] text-[#b0a8b1]">
        <li><Link to="/blog" className="inline-flex min-h-11 items-center hover:text-accent"><span className="accent-text">Blog</span></Link></li>
        <li className="flex items-center gap-3"><ChevronRight size={12} aria-hidden="true" /><span>{category}</span></li>
        <li className="flex min-w-0 items-center gap-3"><ChevronRight size={12} className="shrink-0" aria-hidden="true" /><span aria-current="page" className="max-w-xl text-[#ddd5df]">{title}</span></li>
      </ol>
    </nav>
  );
}
