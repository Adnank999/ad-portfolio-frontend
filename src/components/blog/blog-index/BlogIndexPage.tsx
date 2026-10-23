import { ArrowUpRight, BookOpen, Grid2X2, List, Sparkles, TrendingUp, Newspaper } from "lucide-react";
import { BlogLayout, BlogLabel } from "@/components/global/blog-layout/BlogLayout";
import { BlogCard } from "@/components/global/blog-card/BlogCard";
import { blogCategories } from "@/data/blog";
import type { BlogArchive, BlogCounts, BlogSearch } from "@/data/blog";

const categoryIcons = { insights: BookOpen, growth: TrendingUp, ai: Sparkles, news: Newspaper };

export function BlogIndexPage({ archive, counts, search, onSearchChange }: { archive: BlogArchive; counts: BlogCounts; search: BlogSearch; onSearchChange: (change: BlogSearch) => void }) {
  const articles = archive.data;
  const selectedCategory = blogCategories.find((category) => category.id === search.category);
  const view = search.view ?? "grid";
  const filterClass = "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2.5 text-[10px] uppercase tracking-[.1em] transition-colors hover:border-accent/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none";

  return (
    <BlogLayout>
      <header className="mx-auto max-w-3xl py-8 text-center md:py-12">
        <BlogLabel>The journal</BlogLabel>
        <h1 className="mt-7 text-[clamp(4.5rem,9vw,8rem)] leading-[.98] [text-wrap:balance]">Notes from<br />the build.</h1>
        <p className="mx-auto mt-7 max-w-xl text-xs leading-[1.95] text-[#b0a8b1] md:text-sm">Field notes on turning ideas into useful software. The planning, design, and engineering decisions behind a product, explained one practical question at a time.</p>
      </header>

      <section id="blog-content" aria-labelledby="blog-topics-title" className="scroll-mt-32 pt-20 md:pt-28">
        <BlogLabel>Browse by category</BlogLabel>
        <h2 id="blog-topics-title" className="mt-5 max-w-3xl text-[clamp(3rem,5.5vw,5.5rem)] leading-[1.04] [text-wrap:balance]">Pick a topic.<br />Follow your curiosity.</h2>
        <div role="group" aria-label="Filter articles by topic" className="mt-8 flex flex-wrap gap-3">
          <button type="button" aria-pressed={!search.category} onClick={() => onSearchChange({ category: undefined, page: undefined })} className={`${filterClass} ${!search.category ? "border-accent/45 bg-accent/10 text-[#f1b5d7]" : "border-white/15 text-[#b0a8b1]"}`}>All<span className="text-[9px] opacity-80">{counts.all}</span></button>
          {blogCategories.map((category) => {
            const Icon = categoryIcons[category.id];
            const count = counts[category.id];
            return <button key={category.id} type="button" aria-pressed={search.category === category.id} onClick={() => onSearchChange({ category: category.id, page: undefined })} className={`${filterClass} ${search.category === category.id ? "border-accent/45 bg-accent/10 text-[#f1b5d7]" : "border-white/15 text-[#b0a8b1]"}`}><Icon size={13} aria-hidden="true" />{category.label}<span className="text-[9px] opacity-80">{count}</span></button>;
          })}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-5 md:mt-20">
          <p id="blog-results" role="status" className="text-[10px] uppercase tracking-[.14em] text-[#aaa2ac]">{selectedCategory?.label ?? "Latest writing"}<span aria-hidden="true"> / </span>{archive.pagination.total} {archive.pagination.total === 1 ? "article" : "articles"}</p>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#aaa2ac]">Sort by<select value={search.sort ?? "newest"} onChange={(event) => onSearchChange({ sort: event.target.value === "oldest" ? "oldest" : undefined, page: undefined })} className="min-h-11 rounded-md border border-white/10 bg-[#1b1b1b] px-3 text-[10px] text-[#eee5ed] focus-visible:outline-2 focus-visible:outline-accent"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
            <div role="group" aria-label="Article layout" className="flex gap-1">
              <button type="button" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => onSearchChange({ view: undefined })} className={`grid size-11 place-items-center rounded-md border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${view === "grid" ? "border-accent/45 bg-accent/15 text-accent" : "border-transparent text-[#aaa2ac] hover:text-white"}`}><Grid2X2 size={16} aria-hidden="true" /></button>
              <button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => onSearchChange({ view: "list" })} className={`grid size-11 place-items-center rounded-md border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${view === "list" ? "border-accent/45 bg-accent/15 text-accent" : "border-transparent text-[#aaa2ac] hover:text-white"}`}><List size={17} aria-hidden="true" /></button>
            </div>
          </div>
        </div>

        {articles.length > 0 ? (
          <>
            <div aria-describedby="blog-results" className={`mt-6 grid items-stretch gap-6 ${view === "list" ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"}`}>{articles.map((post) => <BlogCard key={post.slug} post={post} view={view} />)}</div>
            <p className="mt-12 text-center text-[10px] uppercase leading-relaxed tracking-[.12em] text-[#aaa2ac]">You’re up to date. More field notes to come.</p>
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-white/10 bg-[#1b1b1b] px-6 py-16 text-center">
            <h3 className="text-4xl">{selectedCategory ? `No notes on ${selectedCategory.label} yet.` : 'The next story is taking shape.'}</h3>
            <p className="mx-auto mt-4 max-w-md text-xs leading-[1.9] text-[#b0a8b1]">{counts.all > 0 ? 'Browse the other topics for the latest writing.' : 'Published articles will appear here. Check back for new field notes.'}</p>
            {selectedCategory && counts.all > 0 && <button type="button" onClick={() => onSearchChange({ category: undefined, page: undefined })} className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-full border border-accent/40 px-5 py-3 text-xs text-accent hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"><span className="accent-text">Browse all articles</span><ArrowUpRight size={15} aria-hidden="true" /></button>}
          </div>
        )}
        {archive.pagination.totalPages > 1 && <nav aria-label="Article pages" className="mt-10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#aaa2ac]"><span>Page {archive.pagination.page} of {archive.pagination.totalPages}</span><div className="flex gap-3"><button type="button" disabled={archive.pagination.page <= 1} onClick={() => onSearchChange({ page: archive.pagination.page > 2 ? archive.pagination.page - 1 : undefined })} className={`${filterClass} border-white/15 disabled:opacity-40`}>Previous</button><button type="button" disabled={archive.pagination.page >= archive.pagination.totalPages} onClick={() => onSearchChange({ page: archive.pagination.page + 1 })} className={`${filterClass} border-white/15 disabled:opacity-40`}>Next</button></div></nav>}
      </section>
    </BlogLayout>
  );
}
