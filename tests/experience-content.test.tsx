import React from 'react'
import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { Experience } from '../src/components/sections/Experience'
import { education, experience } from '../src/data/experience'

afterEach(cleanup)

describe('CV-based career content', () => {
  test('keeps all three employers and exact CV periods in reverse chronological order', () => {
    expect(experience.map(position => [position.company, position.role, position.period, position.location])).toEqual([
      ['VervTrip', 'Full-Stack Developer', 'October 2025 — Present', 'London, United Kingdom'],
      ['BZM Graphics', 'Full-Stack Developer', 'October 2024 — October 2025', 'Dhaka, Bangladesh'],
      ['ChatChef', 'Frontend Developer', 'December 2022 — September 2024', 'Canada'],
    ])
    const source = readFileSync(new URL('../src/components/sections/About.tsx', import.meta.url), 'utf8')
    expect(source).toContain('experience.map(position =>')
    expect(source).not.toContain('Earlier experience')
  })

  test('renders a single page heading, concrete responsibilities, and source-backed achievements', () => {
    render(<Experience />)
    expect(screen.getByRole('main').id).toBe('experience')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole('article')).toHaveLength(3)
    for (const position of experience) {
      const article = screen.getByRole('article', { name: `${position.role} at ${position.company}` })
      expect(within(article).getByRole('heading', { name: position.company })).toBeTruthy()
      expect(within(article).getByText(position.period)).toBeTruthy()
      for (const highlight of position.highlights) expect(within(article).getByText(highlight)).toBeTruthy()
    }
    expect(screen.getByText(/6M\+ hotel images across 400k\+ hotels using Gemini 2.5 Flash Lite/)).toBeTruthy()
    expect(screen.getByRole('heading', { name: education.institution })).toBeTruthy()
    expect(screen.getByText(education.qualification)).toBeTruthy()
  })

  test('makes career content available without a client-side reveal', () => {
    const markup = renderToString(<Experience />)
    for (const company of ['VervTrip', 'BZM Graphics', 'ChatChef']) expect(markup).toContain(company)
    expect(markup).toContain('October 2025')
    expect(markup).not.toContain('opacity:0')
  })
})
