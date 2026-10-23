import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

test('enforces regular editorial typography on all h2, h3 and spans without changing h1 or sizing', () => {
  const styles = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8')
  const rule = styles.match(/@layer base\s*\{\s*h2, h3, span\s*\{([^}]+)\}/)?.[1]
  expect(rule).toBeDefined()
  expect(rule).toContain('font-family: var(--font-editorial) !important;')
  expect(rule).toContain('font-weight: 400 !important;')
  expect(rule).toContain('font-style: normal !important;')
  expect(rule).not.toContain('font-size:')
  expect(rule).not.toContain('line-height:')
  expect(styles).toContain('h1 { font-family: var(--font-display); font-weight: 700;')
  expect(styles).not.toContain('h1, h1 span {')
})

test('uses editorial bold only for the homepage hero and closing headline, including animated words', () => {
  const styles = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8')
  const rule = styles.match(/\.cinema-home :is\(#hero-title, #contact-title\),\s*\.cinema-home :is\(#hero-title, #contact-title\) \*\s*\{([^}]+)\}/)?.[1]
  expect(rule).toBeDefined()
  expect(rule).toContain('font-family: var(--font-display) !important;')
  expect(rule).toContain('font-weight: 700 !important;')
  expect(rule).toContain('font-style: normal !important;')
  expect(rule).not.toContain('font-size:')
  expect(rule).not.toContain('line-height:')
})
