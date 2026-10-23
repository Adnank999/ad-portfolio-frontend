import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { PageLoadError } from './PageFeedback'

export function RouteLoadError({ reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryBoundary = useQueryErrorResetBoundary()

  return <PageLoadError onRetry={async () => {
    queryBoundary.reset()
    await router.invalidate()
    reset?.()
  }} />
}
