import React from 'react'
import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { AboutHumanSide } from '../src/components/about/AboutHumanSide'
import { AboutTechnologies } from '../src/components/about/AboutTechnologies'
import { technologyGroups } from '../src/components/about/technology-data'

const routerExports = { ...await import('@tanstack/react-router') }
mock.module('@tanstack/react-router', () => ({
  ...routerExports,
  Link: ({ to, children, ...props }: React.ComponentProps<'a'> & { to: string }) => <a href={to} {...props}>{children}</a>,
}))
const { AboutChallenges } = await import('../src/components/about/AboutChallenges')
const { AboutExplorations } = await import('../src/components/about/AboutExplorations')

afterEach(cleanup)

describe('About showcase sections', () => {
  test('introduces personality, curiosity, and motivation immediately after the hero', () => {
    render(<AboutHumanSide />)
    expect(screen.getByRole('heading', { level: 2, name: /Personality, curiosity and motivation/ })).toBeTruthy()
    expect(screen.getAllByRole('article')).toHaveLength(3)
    for (const quality of ['Personality', 'Curiosity', 'Motivation']) expect(screen.getByText(new RegExp(`0[1-3] / ${quality}`))).toBeTruthy()
    const source = readFileSync(new URL('../src/components/sections/About.tsx', import.meta.url), 'utf8')
    expect(source.indexOf('<AboutHumanSide />')).toBeLessThan(source.indexOf('<AboutMindset />'))
    expect(source).toContain('href="#about-human-side"')
  })

  test('selects all five technology disciplines with connected pressed states and detail content', () => {
    const { container } = render(<AboutTechnologies />)
    const group = screen.getByRole('group', { name: 'Technology categories' })
    const controls = within(group).getAllByRole('button')
    expect(controls).toHaveLength(5)
    for (const [index, category] of technologyGroups.entries()) {
      fireEvent.click(controls[index])
      expect(controls[index].getAttribute('aria-pressed')).toBe('true')
      expect(controls.filter(control => control.getAttribute('aria-pressed') === 'true')).toHaveLength(1)
      const region = screen.getByRole('region', { name: category.name })
      expect(region.id).toBe(controls[index].getAttribute('aria-controls')!)
      expect(screen.getByRole('heading', { name: category.title })).toBeTruthy()
      for (const tool of category.tools) expect(within(region).getByRole('heading', { name: tool.name })).toBeTruthy()
      expect(container.querySelectorAll('line[data-selected="true"]')).toHaveLength(1)
      expect(region.querySelector('[aria-live="polite"]')).toBeTruthy()
    }
    expect(container.querySelector('canvas')).toBeNull()
  })

  test('supports wrapping arrow navigation and Home/End without intercepting Tab', () => {
    render(<AboutTechnologies />)
    const controls = screen.getAllByRole('button')
    controls[0].focus()
    fireEvent.keyDown(controls[0], { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(controls[4])
    expect(controls[4].getAttribute('aria-pressed')).toBe('true')
    fireEvent.keyDown(controls[4], { key: 'ArrowDown' })
    expect(document.activeElement).toBe(controls[0])
    fireEvent.keyDown(controls[0], { key: 'End' })
    expect(document.activeElement).toBe(controls[4])
    fireEvent.keyDown(controls[4], { key: 'Home' })
    expect(document.activeElement).toBe(controls[0])
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    fireEvent(controls[0], tab)
    expect(tab.defaultPrevented).toBe(false)
  })

  test('keeps technology identifiers unique and content visible in server-rendered markup', () => {
    const { container } = render(<><AboutTechnologies /><AboutTechnologies /></>)
    const identifiers = Array.from(container.querySelectorAll('button[id], [role="region"][id]'), element => element.id)
    expect(new Set(identifiers).size).toBe(identifiers.length)
    const markup = renderToString(<AboutTechnologies />)
    expect(markup).toContain('Component-driven interfaces')
    expect(markup).not.toContain('opacity:0')
    expect(markup).not.toContain('<canvas')
  })

  test('shows one engineering challenge at a time, with collapsible labelled regions', () => {
    render(<AboutChallenges />)
    const controls = screen.getAllByRole('button')
    expect(controls).toHaveLength(7)
    expect(controls[0].getAttribute('aria-expanded')).toBe('true')
    const section = screen.getByRole('region', { name: /Real-world technical challenges/ })
    expect(within(section).getAllByRole('region')).toHaveLength(1)
    fireEvent.click(controls[1])
    expect(controls[0].getAttribute('aria-expanded')).toBe('false')
    expect(controls[1].getAttribute('aria-expanded')).toBe('true')
    const region = screen.getByRole('region', { name: /booking accounted for/ })
    expect(region.id).toBe(controls[1].getAttribute('aria-controls')!)
    expect(within(region).getByRole('heading', { name: 'The trade-off' })).toBeTruthy()
    expect(document.getElementById(controls[0].getAttribute('aria-controls')!)?.hidden).toBe(true)
    fireEvent.click(controls[1])
    expect(within(section).queryAllByRole('region')).toHaveLength(0)
    fireEvent.click(controls[2])
    expect(screen.getByRole('region', { name: /Heavy background work/ })).toBeTruthy()
    for (const control of controls.slice(3)) {
      fireEvent.click(control)
      expect(control.getAttribute('aria-expanded')).toBe('true')
      expect(within(section).getAllByRole('region')).toHaveLength(1)
    }
    expect(screen.getByRole('link', { name: 'Explore the case studies' }).getAttribute('href')).toBe('/case-studies')
  })

  test('offers three learning directions with native disclosures and a working project destination', () => {
    const { container } = render(<AboutExplorations />)
    expect(screen.getByRole('heading', { level: 2, name: /Creative experiments and learning/ })).toBeTruthy()
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(container.querySelectorAll('details > summary')).toHaveLength(3)
    expect(container.querySelectorAll('.about-exploration-art[aria-hidden="true"]')).toHaveLength(3)
    expect(container.querySelectorAll('.about-exploration-art svg')).toHaveLength(0)
    expect(container.querySelectorAll('.exploration-logo-canvas')).toHaveLength(1)
    expect(container.querySelectorAll('.exploration-logo-fallback')).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Step inside the work' }).getAttribute('href')).toBe('/projects')
    for (const topic of ['WebGL', 'Three.js', 'React Three Fiber', 'shaders', '3D modeling', 'Java', 'C#', 'Rust', 'Python', 'AI']) expect(container.textContent).toContain(topic)
    expect(screen.getByText(/I’m learning Java, C#, Rust, and Python/)).toBeTruthy()
  })

  test('grounds the challenges in the supplied CV and requested booking-platform work', () => {
    const { container } = render(<AboutChallenges />)
    for (const topic of ['6M+', '400k+', 'Gemini 2.5 Flash Lite', 'reconciliation', 'Redis', 'hotel brands', 'cashback', 'Coinbase Commerce', 'Google Places API', 'dependency']) expect(container.textContent?.toLowerCase()).toContain(topic.toLowerCase())
    expect(container.textContent).not.toContain('This portfolio / content tools')
  })

  test('uses CV technologies rather than the old generic stack', () => {
    const content = JSON.stringify(technologyGroups)
    for (const tool of ['Next.js', 'Vue.js', 'Nuxt.js', 'TanStack Start', 'RTK Query', 'Zustand', 'GSAP', 'Laravel', 'Spring Boot', 'NestJS', 'Coinbase Commerce', 'Kafka', 'RabbitMQ', 'Amazon S3', 'GCP', 'Azure', 'Oracle Cloud', 'Hetzner', 'Cloudflare', 'Docker', 'Kubernetes', 'GitHub Actions', 'Prometheus', 'Loki', 'MongoDB', 'Redis', 'Prisma', 'TypeORM', 'Hibernate', 'EF Core', 'Gemini 2.5 Flash Lite', 'Virtual Try-On']) expect(content).toContain(tool)
  })

  test('keeps the requested chapter order, existing shaders, and reduced-motion styles', () => {
    const source = readFileSync(new URL('../src/components/sections/About.tsx', import.meta.url), 'utf8')
    const sequence = ['<AboutHumanSide />', '<AboutMindset />', '<AboutProcess />', 'id="about-journey-title"', '<AboutTechnologies />', '<AboutChallenges />', '<AboutExplorations />', '08 / The next chapter']
    const positions = sequence.map(part => source.indexOf(part))
    expect(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1]))).toBe(true)
    const styles = readFileSync(new URL('../src/styles/about-showcase.css', import.meta.url), 'utf8')
    expect(styles).toContain('var(--accent)')
    expect(styles).toContain('var(--font-editorial)')
    expect(styles).toContain('@media (max-width: 480px)')
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
    expect(styles).not.toContain('infinite')
  })
})
