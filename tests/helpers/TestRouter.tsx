import type { ReactNode } from 'react'
import { createMemoryHistory, createRootRoute, createRouter, RouterContextProvider } from '@tanstack/react-router'

export function TestRouter({ children }: { children: ReactNode }) {
  const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory({ initialEntries: ['/admin'] }), isServer: true })
  return <RouterContextProvider router={router}>{children}</RouterContextProvider>
}
