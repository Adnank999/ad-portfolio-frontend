import { afterEach, expect, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { PageNotFound } from '../src/components/feedback/PageNotFound'

afterEach(cleanup)

test('missing pages offer clear recovery destinations', () => {
  render(<PageNotFound />)
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('A little off the map.')
  expect(screen.getByRole('link', { name: /Back to home/ }).getAttribute('href')).toBe('/')
  expect(screen.getByRole('link', { name: /Explore projects/ }).getAttribute('href')).toBe('/projects')
})

test('missing articles link to the journal', () => {
  render(<PageNotFound collection="blog" />)
  expect(screen.getByRole('link', { name: /Read the journal/ }).getAttribute('href')).toBe('/blog')
})
