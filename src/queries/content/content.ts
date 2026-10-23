import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { createContentFn, deleteContentFn, getContentFn, listContentFn, updateContentFn } from '@/server/portfolio-content'
import type { ContentKind, ContentListInput, ContentWrite } from '@/server/portfolio-content'
import { blogKeys } from '@/queries/blog/blog'
import { caseStudyKeys } from '@/queries/case-studies/case-studies'
import { serviceKeys } from '@/queries/services/services'

export const contentKeys = {
  all: (kind: ContentKind) => ['admin-content', kind] as const,
  list: (input: ContentListInput) => ['admin-content', input.kind, 'list', input] as const,
  detail: (kind: ContentKind, id: string) => ['admin-content', kind, 'detail', id] as const,
}

export const contentListOptions = (input: ContentListInput) => queryOptions({
  queryKey: contentKeys.list(input),
  queryFn: () => listContentFn({ data: input }),
  staleTime: 10_000,
  retry: false,
})

export const contentDetailOptions = (kind: ContentKind, id: string) => queryOptions({
  queryKey: contentKeys.detail(kind, id),
  queryFn: () => getContentFn({ data: { kind, id } }),
  staleTime: 10_000,
  retry: false,
})

export function useCreateContent(kind: ContentKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: ContentWrite) => createContentFn({ data: { kind, content } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contentKeys.all(kind) })
      if (kind === 'blogs') await queryClient.invalidateQueries({ queryKey: blogKeys.all })
      if (kind === 'case-studies') await queryClient.invalidateQueries({ queryKey: caseStudyKeys.all })
      if (kind === 'services') await queryClient.invalidateQueries({ queryKey: serviceKeys.all })
    },
  })
}

export function useUpdateContent(kind: ContentKind, id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: ContentWrite) => updateContentFn({ data: { kind, id, content } }),
    onSuccess: async (item) => {
      queryClient.setQueryData(contentKeys.detail(kind, id), item)
      await queryClient.invalidateQueries({ queryKey: contentKeys.all(kind) })
      if (kind === 'blogs') await queryClient.invalidateQueries({ queryKey: blogKeys.all })
      if (kind === 'case-studies') await queryClient.invalidateQueries({ queryKey: caseStudyKeys.all })
      if (kind === 'services') await queryClient.invalidateQueries({ queryKey: serviceKeys.all })
    },
  })
}

export function useDeleteContent(kind: ContentKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; version: number }) => deleteContentFn({ data: { kind, ...input } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contentKeys.all(kind) })
      if (kind === 'blogs') await queryClient.invalidateQueries({ queryKey: blogKeys.all })
      if (kind === 'case-studies') await queryClient.invalidateQueries({ queryKey: caseStudyKeys.all })
      if (kind === 'services') await queryClient.invalidateQueries({ queryKey: serviceKeys.all })
    },
  })
}
