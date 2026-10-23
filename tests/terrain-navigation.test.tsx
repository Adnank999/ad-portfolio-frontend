import { afterEach, expect, mock, test } from 'bun:test'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

mock.module('@tanstack/react-router', () => ({
  Link: ({ to, children, viewTransition: _viewTransition, ...props }: React.ComponentProps<'a'> & { to: string; viewTransition?: boolean }) => <a href={to} {...props}>{children}</a>,
}))

import { TerrainNavigation, type TerrainAudioState } from '../src/components/terrain-recreation/TerrainNavigation'

afterEach(cleanup)

function NavigationExample() {
  const [audio, setAudio] = useState<TerrainAudioState>({ enabled: true, status: 'blocked' })
  return <TerrainNavigation projectSlug={null} audio={audio} ready
    onToggleSound={() => setAudio(previous => previous.status === 'on' ? { enabled: false, status: 'off' } : { enabled: true, status: 'on' })} />
}

test('Back targets projects on details and portfolio home on the terrain overview', () => {
  const audio: TerrainAudioState = { enabled: true, status: 'on' }
  const view = render(<TerrainNavigation projectSlug="hotel-booking-platform" audio={audio} ready onToggleSound={() => {}} />)
  expect(screen.getByRole('link', { name: 'Back to projects' }).getAttribute('href')).toBe('/projects')
  expect(screen.getByRole('link', { name: 'Back to projects' }).textContent).toBe('Back')
  view.rerender(<TerrainNavigation projectSlug={null} audio={audio} ready onToggleSound={() => {}} />)
  expect(screen.getByRole('link', { name: 'Back to home' }).getAttribute('href')).toBe('/')
})

test('sound toggle exposes blocked, playing and muted states with keyboard-accessible labels', () => {
  render(<NavigationExample />)
  const button = screen.getByRole('button', { name: 'Turn sound on' })
  expect(button.getAttribute('aria-pressed')).toBe('false')
  expect(button.textContent).toBe('Enable sound')
  expect(button.hasAttribute('data-sound-toggle')).toBe(true)
  fireEvent.click(button)
  expect(screen.getByRole('button', { name: 'Turn sound off' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(button)
  expect(screen.getByRole('button', { name: 'Turn sound on' }).textContent).toBe('Sound off')
})

test('the first sound click still enables audio if the browser resumes it between press and click', () => {
  const toggle = mock((_enabled: boolean) => {})
  const view = render(<TerrainNavigation projectSlug={null} audio={{ enabled: true, status: 'blocked' }} ready onToggleSound={toggle} />)
  const button = screen.getByRole('button', { name: 'Turn sound on' })
  fireEvent.pointerDown(button)
  view.rerender(<TerrainNavigation projectSlug={null} audio={{ enabled: true, status: 'on' }} ready onToggleSound={toggle} />)
  fireEvent.click(button)
  expect(toggle).toHaveBeenLastCalledWith(true)
})
