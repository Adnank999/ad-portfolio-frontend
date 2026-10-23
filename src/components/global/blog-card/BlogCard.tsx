import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { blogCategories, formatBlogDate } from "@/data/blog";
import type { BlogSummary } from "@/data/blog";

export function BlogCard({ post, view = "grid" }: { post: BlogSummary; view?: "grid" | "list" }) {
  const category = blogCategories.find((entry) => entry.id === post.category)?.label;

  return (
    <article className="h-full min-w-0">
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className={`group flex h-full overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1b] transition-colors hover:border-accent/50 hover:bg-[#201a1e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none ${view === "list" ? "flex-col sm:flex-row" : "flex-col"}`}
      >
        <div className={`relative overflow-hidden bg-[#181518] ${view === "list" ? "aspect-[1.65] shrink-0 sm:aspect-auto sm:w-[38%]" : "aspect-[1.65]"}`}>
          <img src={post.cover} alt={post.coverAlt} width={1200} height={630} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-linear-to-b from-black/50 to-transparent p-4 text-[9px] uppercase tracking-[.12em] text-[#e6dfe5]">
            <span className="rounded-full border border-white/15 bg-[#151515]/80 px-3 py-1.5">{category}</span>
            <span>{post.readingMinutes ?? 1} min read</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-6">
          <h3 className="text-[2rem] leading-[1.12] text-[#f3f0f2] [text-wrap:balance]">{post.title}</h3>
          <p className="mt-4 text-xs leading-[1.9] text-[#b0a8b1]">{post.description}</p>
          <div className="mt-auto flex items-end justify-between gap-4 pt-8 text-[9px] uppercase leading-relaxed tracking-[.1em] text-[#aaa2ac]">
            <span>{post.author.name}<span aria-hidden="true"> · </span><time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time></span>
            <ArrowUpRight size={17} className="shrink-0 text-accent" aria-hidden="true" />
          </div>
        </div>
      </Link>
    </article>
  );
}
