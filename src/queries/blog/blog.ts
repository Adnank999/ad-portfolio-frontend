import { queryOptions } from '@tanstack/react-query'
import type { BlogSearch } from '@/data/blog'
import { publicBlogArchiveFn, publicBlogCountsFn, publicBlogPostFn } from '@/server/public-blog'

export const blogKeys = {
  all: ['public-blog'] as const,
  archive: (search: Pick<BlogSearch, 'category' | 'sort' | 'page'>) => ['public-blog', 'archive', search] as const,
  counts: ['public-blog', 'counts'] as const,
  post: (slug: string) => ['public-blog', 'post', slug] as const,
}

export const blogArchiveOptions = (search: Pick<BlogSearch, 'category' | 'sort' | 'page'>) => queryOptions({
  queryKey: blogKeys.archive(search),
  queryFn: ({ signal }) => publicBlogArchiveFn({ data: search, signal }),
  staleTime: 10_000,
  retry: false,
})

export const blogCountsOptions = () => queryOptions({
  queryKey: blogKeys.counts,
  queryFn: ({ signal }) => publicBlogCountsFn({ signal }),
  staleTime: 10_000,
  retry: false,
})

export const blogPostOptions = (slug: string) => queryOptions({
  queryKey: blogKeys.post(slug),
  queryFn: ({ signal }) => publicBlogPostFn({ data: { slug }, signal }),
  staleTime: 10_000,
  retry: false,
})
