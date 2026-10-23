import { expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'

test('about name uses exactly two lines with an accessible full name', () => {
  const source = readFileSync(new URL('../src/components/sections/About.tsx', import.meta.url), 'utf8')
  const heading = source.match(/<h1 id="about-name"[^>]*>(.*?)<\/h1>/s)?.[0]
  expect(heading).toBeDefined()
  expect(heading).toContain('aria-label="Adnan Hossain Khan"')
  expect(heading).toContain('className="about-name-outline">ADNAN HOSSAIN</span>')
  expect(heading).toContain('className="about-name-solid">KHAN.</span>')
  expect(heading?.match(/<span/g)).toHaveLength(2)
  expect(heading).not.toContain('<br')
})

test('supplied Stranger Things fonts and clipped gradients remain scoped to the responsive About name', () => {
  const styles = readFileSync(new URL('../src/styles/about.css', import.meta.url), 'utf8')
  for (const font of ['Stranger Things Outlined.ttf', 'Benguiat Bold.ttf']) {
    expect(existsSync(new URL(`../public/fonts/stranger things/${font}`, import.meta.url))).toBe(true)
    expect(styles).toContain(encodeURIComponent(font))
  }
  expect(styles).toContain("font-family:'Stranger Things Outlined',Georgia,serif!important;font-weight:400!important")
  expect(styles).toContain("font-family:'Benguiat Bold',Georgia,serif!important;font-weight:700!important")
  expect(styles).toContain('container-type:inline-size')
  expect(styles).toContain('font-size:clamp(26px,11.4cqi,74px)')
  expect(styles).toContain('white-space:nowrap')
  expect(styles).toContain('background-clip:text')
  expect(styles).toContain('.about-hero-copy #about-name :is(.about-name-outline,.about-name-solid){background-image:linear-gradient(110deg,#9b22ff,#df41f5 55%,#f4b2e7);')
  expect(styles).toContain('.about-name-solid{color:#eea5eb;font-size:1.1em;')
  expect(styles).not.toContain('#7878ff')
  expect(styles).toContain('forced-colors:active')
  const globalStyles = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8')
  expect(globalStyles).toContain('--color-accent: #C21E56;')
  expect(globalStyles).toContain('font-family: var(--font-editorial) !important;')
})
