import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

test('About vapor cycles the four complete build statements without a duplicated static prefix', () => {
  const source = readFileSync(new URL('../src/components/sections/About.tsx', import.meta.url), 'utf8')
  const statements = source.match(/const buildStatements = \[([\s\S]*?)\]/)?.[1]
  const phrases = [...(statements ?? '').matchAll(/(['"])(.*?)\1/gs)].map(match => match[2].replaceAll('\\n', ' '))
  expect(phrases).toEqual([
    'I BUILD FOR Real-world needs.',
    'I BUILD Complex systems.',
    'I BUILD Cool stuff.',
    'I BUILD something distinctive, something people actually remember.',
  ])
  expect(source).toContain('words={buildStatements}')
  expect(source).toContain('className="about-hero-vapor"')
  expect(source).toContain('align="start"')
  expect(source).not.toContain('md:text-[112px]')
  expect(source).not.toContain('about-hero-statement">I BUILD FOR')
})

test('About statement typography fits its own column and keeps the multiline vapor sizing stable', () => {
  const styles = readFileSync(new URL('../src/styles/about.css', import.meta.url), 'utf8')
  expect(styles).toContain('font-size:clamp(22px,4.8cqi,32px)')
  expect(styles).toContain('.about-hero-statement .about-hero-vapor{display:grid;width:100%;font-size:inherit;line-height:inherit;text-align:left}')
  expect(styles).not.toContain('.about-hero-statement{font-size:24px}')
})
