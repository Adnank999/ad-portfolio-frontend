import { afterEach, expect, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { TerrainLoadingScreen } from '../src/components/terrain-recreation/TerrainProjectFallback'

afterEach(cleanup)

test('shows a small accessible loading status without fake progress or a large heading', () => {
  render(<TerrainLoadingScreen />)
  expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite')
  expect(screen.queryByRole('heading')).toBeNull()
  expect(screen.getByRole('status').textContent).toBe('Please wait for an immersive experience')
  expect(screen.queryByRole('progressbar')).toBeNull()
})
