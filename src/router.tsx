import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'
import { PageLoading } from './components/feedback/PageFeedback'
import { RouteNotFound } from './components/feedback/PageNotFound'
import { RouteLoadError } from './components/feedback/RouteFeedback'

export function getRouter() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, retry: 1 } } })
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    scrollRestorationBehavior: 'instant',
    defaultPreload: 'intent',
    defaultViewTransition: true,
    defaultPendingComponent: PageLoading,
    defaultPendingMs: 200,
    defaultPendingMinMs: 350,
    defaultErrorComponent: RouteLoadError,
    defaultNotFoundComponent: RouteNotFound,
  })
  setupRouterSsrQueryIntegration({ router, queryClient })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
