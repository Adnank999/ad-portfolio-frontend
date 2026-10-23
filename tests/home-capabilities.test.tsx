import React, { createRef } from 'react'
import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CinematicCapabilities } from '../src/components/home/cinematic/CinematicCapabilities'
import { capabilities, getCapabilityFocusIndex } from '../src/components/home/cinematic/capabilities/capabilities'

afterEach(cleanup)

function mount() {
  return render(<CinematicCapabilities sectionRef={createRef<HTMLElement>()} still />)
}

describe('homepage capability showcase', () => {
  test('keeps the requested headline and presents development-focused disciplines', () => {
    mount()
    expect(screen.getByRole('heading', { level: 2, name: 'Build with Care from Front to Back' })).toBeTruthy()
    expect(screen.getAllByRole('button')).toHaveLength(6)
    expect(new Set(capabilities.map(item => item.artwork)).size).toBe(6)
    expect(screen.getByRole('link', { name: 'Explore the details' }).getAttribute('href')).toMatch(/^#capabilities-list-/)
    expect(screen.getByRole('region', { name: /Interfaces that feel intuitive/ }).getAttribute('aria-labelledby')).toBe(screen.getAllByRole('button')[0].id)
  })

  test('opens one panel at a time, preserves relationships and collapses it again', () => {
    mount()
    const triggers = screen.getAllByRole('button')
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(triggers[2])
    expect(triggers[0].getAttribute('aria-expanded')).toBe('false')
    expect(triggers[2].getAttribute('aria-expanded')).toBe('true')
    const panel = screen.getByRole('region', { name: /The right systems, connected/ })
    expect(panel.id).toBe(triggers[2].getAttribute('aria-controls'))
    expect(panel.textContent).toContain(capabilities[2].description)
    expect(document.getElementById(triggers[0].getAttribute('aria-controls')!)?.hasAttribute('inert')).toBe(true)
    fireEvent.click(triggers[2])
    expect(screen.queryAllByRole('region')).toHaveLength(1)
    expect(triggers.every(trigger => trigger.getAttribute('aria-expanded') === 'false')).toBe(true)
  })

  test('supports arrow, Home and End focus navigation without auto-opening panels', () => {
    mount()
    const triggers = screen.getAllByRole('button')
    triggers[0].focus()
    fireEvent.keyDown(triggers[0], { key: 'ArrowUp' })
    expect(document.activeElement).toBe(triggers[5])
    fireEvent.keyDown(triggers[5], { key: 'ArrowDown' })
    expect(document.activeElement).toBe(triggers[0])
    fireEvent.keyDown(triggers[0], { key: 'End' })
    expect(document.activeElement).toBe(triggers[5])
    fireEvent.keyDown(triggers[5], { key: 'Home' })
    expect(document.activeElement).toBe(triggers[0])
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true')
    expect(getCapabilityFocusIndex(0, 'Tab', 6)).toBeNull()
  })

  test('previews different artwork on mouse hover and keeps SVG resource IDs unique', () => {
    const { container } = mount()
    const row = screen.getAllByRole('button')[3].closest('article')!
    fireEvent.pointerEnter(row, { pointerType: 'mouse' })
    expect(container.querySelector('.capabilities-intro-visual [data-artwork]')?.getAttribute('data-artwork')).toBe('performance')
    fireEvent.pointerLeave(container.querySelector('.capabilities-list')!)
    expect(container.querySelector('.capabilities-intro-visual [data-artwork]')?.getAttribute('data-artwork')).toBe('interface')
    const identifiers = [...container.querySelectorAll('linearGradient')].map(element => element.id)
    expect(new Set(identifiers).size).toBe(identifiers.length)
    expect(container.querySelector('canvas')).toBeNull()
  })
})
