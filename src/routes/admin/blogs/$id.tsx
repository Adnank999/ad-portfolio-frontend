import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ContentEditor } from '@/components/admin/content/ContentEditor'
import { contentDetailOptions } from '@/queries/content/content'
import { PageLoading, PageLoadError } from '@/components/feedback/PageFeedback'

export const Route = createFileRoute('/admin/blogs/$id')({ component: EditBlog })

function EditBlog() {
  const { id } = Route.useParams()
  const detail = useQuery(contentDetailOptions('blogs', id))
  if (detail.isPending) return <PageLoading size="panel" />
  if (detail.isError && !detail.data) return <PageLoadError size="panel" onRetry={() => detail.refetch({ throwOnError: true })} />
  return <ContentEditor key={id} kind="blogs" existing={detail.data} />
}
