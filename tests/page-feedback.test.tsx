import { afterEach, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { PageLoading, PageLoadError } from '../src/components/feedback/PageFeedback'
import { BlogPending } from '../src/components/blog/blog-feedback/BlogFeedback'
import { CaseStudyPending } from '../src/components/case-studies/feedback/CaseStudyFeedback'

afterEach(cleanup)

test('global route defaults and the resilient document shell cover routes without custom feedback', () => {
  const router = readFileSync(new URL('../src/router.tsx', import.meta.url), 'utf8')
  expect(router).toContain('defaultPendingComponent: PageLoading')
  expect(router).toContain('defaultErrorComponent: RouteLoadError')
  expect(router).toContain('defaultPendingMs: 200')
  expect(router).toContain('defaultPendingMinMs: 350')
  const root = readFileSync(new URL('../src/routes/__root.tsx', import.meta.url), 'utf8')
  expect(root).toContain('shellComponent: RootShell')
  const recovery = readFileSync(new URL('../src/components/feedback/RouteFeedback.tsx', import.meta.url), 'utf8')
  expect(recovery).toContain('queryBoundary.reset()')
  expect(recovery).toContain('await router.invalidate()')
})

test('public data fallbacks share a lightweight loading experience without fabricated progress', () => {
  expect(BlogPending).toBe(PageLoading)
  expect(CaseStudyPending).toBe(PageLoading)
  const { container } = render(<PageLoading />)
  expect(screen.getByRole('status').textContent).toBe('Loading…')
  expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite')
  expect(container.firstElementChild?.getAttribute('aria-busy')).toBe('true')
  expect(container.querySelector('.loading-logo')?.getAttribute('aria-hidden')).toBe('true')
  expect(screen.queryByRole('progressbar')).toBeNull()
  expect(container.querySelector('canvas')).toBeNull()
  expect(container.querySelector('.loading-logo-artwork')).toBeTruthy()
  expect(container.querySelector('.page-feedback-track')).toBeNull()
})

test('error feedback offers safe recovery and a home link without needing router context', async () => {
  let finishRetry: (() => void) | undefined
  let retries = 0
  render(<PageLoadError onRetry={() => {
    retries += 1
    return new Promise<void>(resolve => { finishRetry = resolve })
  }} />)
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('A brief interruption.')
  expect(screen.getByRole('link', { name: /Back to home/ }).getAttribute('href')).toBe('/')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  const button = screen.getByRole('button', { name: 'Trying again…' }) as HTMLButtonElement
  expect(button.disabled).toBe(true)
  fireEvent.click(button)
  expect(retries).toBe(1)
  finishRetry?.()
  await waitFor(() => expect((screen.getByRole('button', { name: 'Try again' }) as HTMLButtonElement).disabled).toBe(false))
})

test('a failed retry remains recoverable and never displays internal error details', async () => {
  render(<PageLoadError size="panel" onRetry={async () => { throw new Error('PRIVATE backend credentials') }} />)
  expect(screen.getByRole('heading', { level: 2 })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Still unable to connect'))
  expect(document.body.textContent).not.toContain('PRIVATE')
  expect((screen.getByRole('button', { name: 'Try again' }) as HTMLButtonElement).disabled).toBe(false)
})
