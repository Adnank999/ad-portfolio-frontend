import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { cleanup, render } from '@testing-library/react'
import { createParticleCloud, createParticleHues, createParticleShapes, PARTICLE_SHAPE_ASSETS, sampleParticleMask, type ParticleMask } from '../src/components/about/particleShapes'
import { ParticleFallback } from '../src/components/about/AboutProcess'

afterEach(cleanup)

function ringMask(): ParticleMask {
  const width = 8, height = 8
  const data = new Uint8ClampedArray(width * height * 4)
  for (let vertical = 0; vertical < height; vertical++) {
    for (let horizontal = 0; horizontal < width; horizontal++) {
      if (vertical === 0 || vertical === 7 || horizontal === 0 || horizontal === 7) data[(vertical * width + horizontal) * 4 + 3] = 255
    }
  }
  return { width, height, data }
}

describe('About process particle silhouettes', () => {
  test('uses the three supplied SVGs in the requested stage order', () => {
    expect(PARTICLE_SHAPE_ASSETS).toEqual(['design.svg', 'build.svg', 'ship.svg'])
    for (const asset of PARTICLE_SHAPE_ASSETS) expect(existsSync(new URL(`../public/about-me/${asset}`, import.meta.url))).toBe(true)
  })

  test('samples alpha rather than color and preserves transparent holes', () => {
    const mask = ringMask()
    const points = sampleParticleMask(mask, 300)
    expect(points.length).toBe(900)
    for (let index = 0; index < points.length; index += 3) {
      const horizontal = Math.round(points[index] / (3 / 8) + 3.5)
      const vertical = Math.round(3.5 - points[index + 1] / (3 / 8))
      expect(mask.data[(vertical * mask.width + horizontal) * 4 + 3]).toBe(255)
      expect(Math.abs(points[index + 2])).toBeLessThanOrEqual(.031)
    }
    expect(sampleParticleMask(mask, 300)).toEqual(points)
    expect(() => sampleParticleMask({ width: 1, height: 1, data: new Uint8ClampedArray(4) }, 10)).toThrow('no visible pixels')
  })

  test('retains the original Think geometry and equal morph buffer lengths on desktop and mobile', () => {
    const mask = ringMask()
    for (const count of [1800, 4200]) {
      const shapes = createParticleShapes(count, [mask, mask, mask])
      expect(shapes.length).toBe(4)
      for (const shape of shapes) {
        expect(shape.length).toBe(count * 3)
        expect(Array.from(shape).every(Number.isFinite)).toBe(true)
      }
      for (const index of [0, 1, Math.floor(count / 2), count - 1]) {
        const fraction = index / count, angle = index * 2.39996322973
        const height = fraction * 2 - 1, radius = .28 + Math.pow(Math.abs(height), .8) * .85
        expect(shapes[0].slice(index * 3, index * 3 + 3)).toEqual(new Float32Array([Math.cos(angle) * radius, height * 1.55, Math.sin(angle) * radius]))
      }
      expect(shapes[1]).toEqual(sampleParticleMask(mask, count))
    }
    expect(() => createParticleShapes(10, [mask])).toThrow('masks are required')
  })

  test('fallbacks share the exact SVG assets and a rainbow particle mask', () => {
    for (const [index, asset] of PARTICLE_SHAPE_ASSETS.entries()) {
      const view = render(<ParticleFallback stage={index + 1} />)
      const svg = view.container.querySelector('svg')!
      expect(svg.getAttribute('aria-hidden')).toBe('true')
      expect(svg.querySelector('image')?.getAttribute('href')).toBe(`/about-me/${asset}`)
      expect(svg.querySelector('mask[style]')?.getAttribute('style')).toContain('alpha')
      expect(svg.querySelectorAll('linearGradient stop').length).toBe(7)
      expect(svg.querySelector('pattern circle')?.getAttribute('fill')).toBe('white')
      expect(svg.querySelector('feGaussianBlur')).not.toBeNull()
      expect(svg.querySelectorAll('.about-particle-float').length).toBe(24)
      view.unmount()
    }
  })

  test('restores the ordered rainbow gradient while keeping particle colors stable during morphs', () => {
    for (const count of [1800, 4200]) {
      const hues = createParticleHues(count)
      expect(hues).toEqual(createParticleHues(count))
      const bins = new Array(6).fill(0)
      for (const [index, hue] of hues.entries()) {
        expect(hue).toBeGreaterThanOrEqual(0)
        expect(hue).toBeLessThan(1)
        bins[Math.floor(hue * 6)]++
        expect(hue).toBeCloseTo((index * .61803398875) % 1, 6)
      }
      expect(bins.every(total => total > count / 9 && total < count / 4)).toBe(true)
      expect(createParticleHues(count + 10).slice(0, count)).toEqual(hues)
    }
  })

  test('adds sparse side sparks and shape-following glow without moving silhouette particles', () => {
    const mask = ringMask()
    for (const [count, floating, glow] of [[1800, 60, 6], [4200, 160, 12]]) {
      const shapes = createParticleShapes(count, [mask, mask, mask])
      const cloud = createParticleCloud(shapes, floating, glow)
      const total = count + floating + glow
      expect(cloud.hues.length).toBe(total)
      expect(cloud.seeds.length).toBe(total)
      expect(cloud.seeds).not.toEqual(cloud.hues)
      expect(Array.from(cloud.kinds).filter(kind => kind === 0).length).toBe(count)
      expect(Array.from(cloud.kinds).filter(kind => kind === 1).length).toBe(floating)
      expect(Array.from(cloud.kinds).filter(kind => kind === 2).length).toBe(glow)
      for (const [stage, positions] of cloud.positions.entries()) {
        expect(positions.length).toBe(total * 3)
        expect(positions.slice(0, count * 3)).toEqual(shapes[stage])
      }
      for (let index = count; index < count + floating; index++) {
        expect(Math.abs(cloud.positions[0][index * 3])).toBeGreaterThanOrEqual(.52)
        expect(Math.abs(cloud.positions[0][index * 3])).toBeLessThan(1)
        for (let stage = 1; stage < 4; stage++) expect(cloud.positions[stage].slice(index * 3, index * 3 + 3)).toEqual(cloud.positions[0].slice(index * 3, index * 3 + 3))
      }
      for (let index = 0; index < glow; index++) {
        const source = Math.floor(((index + .5) * .61803398875 % 1) * count)
        const destination = count + floating + index
        expect(cloud.hues[destination]).toBe(cloud.hues[source])
        for (let stage = 0; stage < 4; stage++) expect(cloud.positions[stage].slice(destination * 3, destination * 3 + 3)).toEqual(shapes[stage].slice(source * 3, source * 3 + 3))
      }
      expect(createParticleCloud(shapes, floating, glow)).toEqual(cloud)
    }
  })

  test('Think fallback keeps its hourglass and mask IDs do not collide', () => {
    const view = render(<><ParticleFallback stage={0} /><ParticleFallback stage={1} /></>)
    const icons = view.container.querySelectorAll('svg')
    expect(icons[0].querySelectorAll('ellipse').length).toBe(2)
    expect(icons[0].querySelector('image')).toBeNull()
    const ids = Array.from(view.container.querySelectorAll('[id]'), element => element.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
