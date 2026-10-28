import React, { createRef } from 'react'
import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { motionValue } from 'framer-motion'
import { readFileSync } from 'node:fs'
import { CinematicExperiment } from '../src/components/home/cinematic/CinematicExperiment'
import { createValueParticles, getValueParticleColor, getValueParticlePlacement, getValueParticleScrollBurst, getValueParticleBurstRadius } from '../src/components/home/cinematic/value/particle-data'
import { createParticleHues } from '../src/components/about/particleShapes'
import { valueParticleFragment, valueParticleVertex } from '../src/components/home/cinematic/value/particle-shaders'

afterEach(cleanup)

describe('code with purpose section', () => {
  test('short mobile layouts retain bounded, visibility-aware WebGL effects', () => {
    const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')
    const home = source('components/sections/HomePage.tsx')
    expect(home).toContain('mounted && !reducedMotion && !sceneUnavailable')
    expect(home).not.toContain('mounted && !staticLayout &&')
    expect(home).toContain('staticLayout={staticLayout}')
    const canvas = source('components/home/CinematicCanvas.tsx')
    expect(canvas).toContain('1000 / 30')
    expect(canvas).toContain('continuous && !props.compact')
    expect(canvas).toContain('window.clearInterval(timer)')
    expect(canvas).toContain('!props.staticLayout && <mesh')
    const hero = source('components/home/shaders-glsl/HeroShader.tsx')
    expect(hero).toContain('compact ? 384 : 1536')
    expect(hero).toContain('compact ? 256 : 1024')
    expect(hero).toContain('compact ? 1 : 2')
    expect(source('components/home/cinematic/value/ValueParticles.tsx')).toContain('getValueParticleScrollBurst(visualProgress.current)')
  })

  test('explains useful code, systems and AI while keeping a colored static fallback', () => {
    render(<CinematicExperiment sectionRef={createRef<HTMLElement>()} still pointerX={motionValue(0)} pointerY={motionValue(0)} burst={motionValue(0)} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('More than code.Value that compounds.')
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
    expect(screen.getByText(/with human review where it matters/)).toBeTruthy()
    expect(screen.getByRole('button').hasAttribute('disabled')).toBe(true)
    const fallback = document.querySelector<HTMLImageElement>('.value-particle-fallback')!
    expect(fallback.loading).toBe('lazy')
    expect(fallback.alt).toBe('')
    const artwork = readFileSync(new URL('../public/images/value-particles.svg', import.meta.url), 'utf8')
    expect(artwork.match(/<circle /g)).toHaveLength(280)
    expect(artwork).toContain('viewBox="0 0 520 520"')
    expect(document.querySelector('.value-particle-stage')?.hasAttribute('data-value-particles')).toBe(true)
    expect(document.querySelector('.value-layout')?.firstElementChild?.classList.contains('value-copy')).toBe(true)
  })

  test('keeps the burst control reversible and resets the pointer when leaving', () => {
    const horizontal = motionValue(.5)
    const vertical = motionValue(-.3)
    const burst = motionValue(0)
    const { container } = render(<CinematicExperiment sectionRef={createRef<HTMLElement>()} still={false} pointerX={horizontal} pointerY={vertical} burst={burst} />)
    const trigger = screen.getByRole('button', { name: /Explore the connections/ })
    fireEvent.click(trigger)
    expect(burst.get()).toBe(1)
    expect(trigger.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(trigger)
    expect(burst.get()).toBe(0)
    fireEvent.pointerLeave(container.querySelector('section')!)
    expect(horizontal.get()).toBe(0)
    expect(vertical.get()).toBe(0)
  })

  test('uses the same ordered hues and full rainbow shader as the About particles', () => {
    for (const [hue, expected] of [[0, [1, .08, .08]], [1 / 3, [.08, 1, .08]], [2 / 3, [.08, .08, 1]]] as const) {
      getValueParticleColor(hue).forEach((channel, index) => expect(channel).toBeCloseTo(expected[index], 8))
    }
    for (const [count, floating, glow] of [[2400, 150, 12], [850, 60, 6]]) {
      const cloud = createValueParticles(count, floating, glow)
      expect(cloud.seeds.length).toBe(count + floating + glow)
      expect(cloud.positions.length).toBe(cloud.seeds.length * 3)
      expect(cloud.kinds.filter(kind => kind === 1).length).toBe(floating)
      expect(cloud.kinds.filter(kind => kind === 2).length).toBe(glow)
      expect(cloud.positions.every(Number.isFinite)).toBe(true)
      expect(cloud.colors.every(color => color >= 0 && color <= 1)).toBe(true)
      expect(cloud.positions).toEqual(createValueParticles(count, floating, glow).positions)
      expect(cloud.colors.slice(0, count)).toEqual(createParticleHues(count))
      const bins = Array.from({ length: 4 }, (_, index) => cloud.colors.slice(0, count).filter(color => color >= index / 4 && color < (index + 1) / 4).length)
      expect(bins.every(total => total > count * .1)).toBe(true)
    }
    expect(valueParticleVertex).toContain('vColor = mix(vec3(1.0), rainbow, 0.92)')
    expect(valueParticleFragment).toContain('float innerGlow')
    expect(valueParticleFragment).toContain('float halo')
  })

  test('maps the right visual and mobile stacked container into the persistent canvas', () => {
    const desktop = getValueParticlePlacement({ left: 860, top: 200, width: 500, height: 500 }, { width: 1440, height: 1000 }, { width: 6, height: 4 })
    expect(desktop.horizontal).toBeGreaterThan(0)
    expect(desktop.visible).toBe(true)
    const mobile = getValueParticlePlacement({ left: 25, top: 100, width: 340, height: 340 }, { width: 390, height: 844 }, { width: 2, height: 4 })
    expect(mobile.horizontal).toBe(0)
    expect(mobile.scale).toBeGreaterThan(0)
    expect(getValueParticlePlacement({ left: 20, top: 900, width: 340, height: 340 }, { width: 390, height: 844 }, { width: 2, height: 4 }).visible).toBe(false)
  })

  test('bursts from the center on downward scroll and exactly regroups on upward scroll', () => {
    const forward = [.3, .4, .5, .6, .7].map(getValueParticleScrollBurst)
    const reverse = [.7, .6, .5, .4, .3].map(getValueParticleScrollBurst)
    expect(forward[0]).toBe(0)
    expect(forward[4]).toBeCloseTo(1, 8)
    expect(forward.every((amount, index) => index === 0 || amount > forward[index - 1])).toBe(true)
    expect(reverse).toEqual([...forward].reverse())
    expect(getValueParticleScrollBurst(-1)).toBe(0)
    expect(getValueParticleScrollBurst(2)).toBe(1)
    for (const seed of [.1, .5, .9]) {
      const outward = forward.map(amount => getValueParticleBurstRadius(amount, seed))
      expect(outward[4]).toBeGreaterThan(outward[0] * 7)
      expect(outward.every((radius, index) => index === 0 || radius > outward[index - 1])).toBe(true)
      expect(reverse.map(amount => getValueParticleBurstRadius(amount, seed))).toEqual([...outward].reverse())
    }
    expect(valueParticleVertex).toContain('point = normalize(point) * radius')
  })

  test('uses different launch delays and travel distances rather than uniformly resizing the sphere', () => {
    expect(getValueParticleBurstRadius(.08, .9)).toBeCloseTo(getValueParticleBurstRadius(0, .9), 8)
    expect(getValueParticleBurstRadius(.08, .1)).toBeGreaterThan(getValueParticleBurstRadius(0, .1))
    const fastTravel = getValueParticleBurstRadius(1, .9) - getValueParticleBurstRadius(0, .9)
    const slowTravel = getValueParticleBurstRadius(1, .1) - getValueParticleBurstRadius(0, .1)
    expect(fastTravel).toBeGreaterThan(slowTravel * 2)
    expect(valueParticleVertex).toContain('uniform float uScrollBurst')
  })

  test('writes frame updates into the rendered material rather than its initialization uniforms', () => {
    const source = readFileSync(new URL('../src/components/home/cinematic/value/ValueParticles.tsx', import.meta.url), 'utf8')
    expect(source).toContain('const values = material.current.uniforms')
    expect(source).toContain('values.uScrollBurst.value = getValueParticleScrollBurst(progress.get())')
    expect(source).toContain('values.uTime.value = frozenTime.current')
    expect(source).not.toContain('uniforms.uScrollBurst.value =')
  })
})
