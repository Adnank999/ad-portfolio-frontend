import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { BrandLogo } from '../src/components/global/brand-logo/BrandLogo'

test('server HTML embeds the original brand vector without depending on an image or renderer', () => {
  const markup = renderToStaticMarkup(<BrandLogo />)
  const container = document.createElement('div')
  container.innerHTML = markup
  const original = new DOMParser().parseFromString(readFileSync(new URL('../public/logo.svg', import.meta.url), 'utf8'), 'image/svg+xml')
  const mark = container.querySelector('svg')!
  expect(mark.getAttribute('viewBox')).toBe(original.querySelector('svg')!.getAttribute('viewBox'))
  expect(mark.querySelector('path')!.getAttribute('d')).toBe(original.querySelector('path')!.getAttribute('d'))
  expect(mark.getAttribute('fill')).toBe('currentColor')
  expect(container.querySelector('canvas, img, image, use')).toBeNull()
  expect(container.querySelector('.brand-logo')!.getAttribute('aria-hidden')).toBe('true')
})
