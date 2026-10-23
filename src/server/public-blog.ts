import { createServerFn } from '@tanstack/react-start'
import { blogCategories } from '@/data/blog'
import type { BlogArchive, BlogCounts, BlogSearch, PublishedBlogPost } from '@/data/blog'
import { portfolioApi, PortfolioApiError } from './portfolio-api'

function archiveInput(input: Pick<BlogSearch, 'category' | 'page' | 'sort'>) {
  if (input.category && !blogCategories.some((category) => category.id === input.category)) throw new Error('Invalid blog category')
  if (input.sort && input.sort !== 'oldest') throw new Error('Invalid blog order')
  if (input.page !== undefined && (!Number.isSafeInteger(input.page) || input.page < 1 || input.page > 1_000_000)) throw new Error('Invalid blog page')
  return input
}

export const publicBlogArchiveFn = createServerFn({ method: 'GET' })
  .validator(archiveInput)
  .handler(async ({ data }) => {
    const query = new URLSearchParams({ page: String(data.page ?? 1), perPage: '12', sort: data.sort ?? 'newest' })
    if (data.category) query.set('category', data.category)
    return portfolioApi<BlogArchive>(`/api/v1/blogs?${query}`)
  })

export const publicBlogCountsFn = createServerFn({ method: 'GET' })
  .handler(async (): Promise<BlogCounts> => {
    const entries = await Promise.all(['all', ...blogCategories.map((category) => category.id)].map(async (category) => {
      const query = new URLSearchParams({ perPage: '1' })
      if (category !== 'all') query.set('category', category)
      const archive = await portfolioApi<BlogArchive>(`/api/v1/blogs?${query}`)
      return [category, archive.pagination.total] as const
    }))
    return Object.fromEntries(entries) as BlogCounts
  })

function headingText(html: string) {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
  return html.replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity: string, code: string) => {
    if (!code.startsWith('#')) return entities[code.toLowerCase()] ?? entity
    const point = code[1].toLowerCase() === 'x' ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10)
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '\uFFFD'
  }).replace(/\s+/g, ' ').trim()
}

function withContents(post: PublishedBlogPost): PublishedBlogPost {
  const contents: PublishedBlogPost['contents'] = []
  const renderedHtml = post.renderedHtml.replace(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_heading: string, level: string, text: string) => {
    const id = `article-section-${contents.length + 1}`
    contents.push({ id, title: headingText(text) })
    return `<h${level} id="${id}">${text}</h${level}>`
  })
  return {
    slug: post.slug, title: post.title, description: post.description, category: post.category,
    publishedAt: post.publishedAt, updatedAt: post.updatedAt, author: post.author,
    cover: post.cover, coverAlt: post.coverAlt, socialImage: post.socialImage,
    intro: post.intro, takeaways: post.takeaways, sections: post.sections, faqs: post.faqs,
    tags: post.tags, readingMinutes: post.readingMinutes, seo: post.seo,
    structuredData: post.structuredData, renderedHtml, contents,
  }
}

export const publicBlogPostFn = createServerFn({ method: 'GET' })
  .validator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    if (typeof data.slug !== 'string' || data.slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) return null
    try {
      return withContents(await portfolioApi<PublishedBlogPost>(`/api/v1/blogs/${encodeURIComponent(data.slug)}`))
    } catch (error) {
      if (error instanceof PortfolioApiError && error.status === 404) return null
      throw error
    }
  })
