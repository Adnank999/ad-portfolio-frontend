import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { BlogBreadcrumbs, BlogLayout } from '@/components/global/blog-layout/BlogLayout'
import { ArticleToc } from '@/components/global/article-toc/ArticleToc'
import { ArticleShare } from '@/components/global/article-share/ArticleShare'
import { blogCategories, formatBlogDate } from '@/data/blog'
import type { PublishedBlogPost } from '@/data/blog'
import './blog-detail.css'

export function BlogDetailPage({ post }: { post: PublishedBlogPost }) {
  const category = blogCategories.find((entry) => entry.id === post.category)?.label ?? 'Insights'

  return <BlogLayout>
    <article aria-labelledby="blog-title">
      <BlogBreadcrumbs category={category} title={post.title} />
      <header>
        <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-[#191619] p-6 md:p-12 lg:min-h-[590px]">
          <img src={post.cover} alt="" aria-hidden="true" width={1200} height={630} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-60" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-[#171317]/95 via-[#171317]/75 to-[#171317]/20" />
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 text-[10px] uppercase tracking-[.12em] text-[#cec0cd]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#151515]/70 px-3 py-2"><span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />{category}<span aria-hidden="true"> / </span><time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time></span>
            <span>{post.readingMinutes} min read / {post.author.name}</span>
          </div>
          <h1 id="blog-title" className="mt-12 max-w-3xl text-[clamp(3.75rem,7.5vw,7.5rem)] leading-[1.02] [text-wrap:balance] md:mt-16">{post.title}</h1>
        </div>
        <div className="mt-7 grid gap-6 md:grid-cols-12"><p className="text-xs leading-[1.95] text-[#b8aebc] md:col-span-5 md:col-start-8 md:text-sm">{post.description}</p></div>
      </header>

      <div id="blog-content" className="scroll-mt-32 mt-16 grid items-start gap-10 lg:mt-24 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <ArticleToc items={post.contents} articleId="blog-article-body" />
        <div id="blog-article-body" className="min-w-0 text-[13px] leading-[1.95] text-[#bcb4bf] md:text-sm">
          <div className="blog-article-body" dangerouslySetInnerHTML={{ __html: post.renderedHtml }} />
          <footer className="mt-14 border-t border-white/10 pt-8">
            <ul aria-label="Article topics" className="flex flex-wrap gap-2">{post.tags.map((tag) => <li key={tag} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-[#bcb4bf]">{tag}</li>)}</ul>
            <div className="my-8 flex items-center gap-4"><span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full border border-accent/30 bg-accent/10 text-xs text-accent"><span className="accent-text">{post.author.initials}</span></span><div><Link to="/about" className="inline-flex min-h-7 items-center text-sm text-[#eee5ed] hover:text-accent"><span className="accent-text">{post.author.name}</span></Link><p className="text-[11px] text-[#aaa2ac]">{post.author.role}</p></div></div>
            <ArticleShare />
          </footer>
        </div>
      </div>
    </article>

    <div className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-8 md:mt-28">
      <Link to="/blog" className="inline-flex min-h-11 items-center gap-3 text-xs text-[#cfc4d2] hover:text-accent"><ArrowLeft size={16} aria-hidden="true" /><span className="accent-text">Back to all articles</span></Link>
      <Link to="/contact" className="inline-flex min-h-11 items-center gap-3 rounded-full bg-accent px-6 py-3 text-xs text-white hover:bg-accent-400">Discuss your next project<ArrowUpRight size={15} aria-hidden="true" /></Link>
    </div>
  </BlogLayout>
}
