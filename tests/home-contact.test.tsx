import React from 'react'
import { afterEach, expect, test } from 'bun:test'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import BlurText from '../src/components/blur-text/BlurText'

afterEach(cleanup)

test('contact keeps both lines in one labeled bold heading and accents real without TextReveal', () => {
  const source = readFileSync(new URL('../src/components/home/cinematic/CinematicContact.tsx', import.meta.url), 'utf8')
  expect(source).toContain('aria-labelledby="contact-title"')
  expect(source).toContain('<h2 id="contact-title" className="contact-title">')
  expect(source.match(/<BlurText/g)).toHaveLength(2)
  expect(source).toContain('text="Your next idea."')
  expect(source).toContain('text="Let’s make it real."')
  expect(source).toContain('segment === "real." ? <em>{segment}</em> : segment')
  expect(source.match(/disabled=\{still\}/g)).toHaveLength(2)
  expect(source.match(/threshold=\{0\.2\}/g)).toHaveLength(2)
  expect(source.match(/once=\{false\}/g)).toHaveLength(2)
  const styles = readFileSync(new URL('../src/styles/homepage.css', import.meta.url), 'utf8')
  expect(styles).toContain('.cinema-contact #contact-title { letter-spacing: -.04em; }')
  expect(source).not.toContain('TextReveal')
  const homepage = readFileSync(new URL('../src/components/sections/HomePage.tsx', import.meta.url), 'utf8')
  expect(homepage).toContain('<CinematicContact still={!mounted || reducedMotion} />')
})

for (const once of [true, false]) test(`blur words respect the viewport threshold with once=${once} and clean up their observer`, async () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(window, 'IntersectionObserver')
  const globalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'IntersectionObserver')
  const observers: ViewportObserver[] = []
  class ViewportObserver {
    disconnected = false
    target: Element | null = null
    constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {
      observers.push(this)
    }
    observe(target: Element) { this.target = target }
    disconnect() { this.disconnected = true }
  }
  Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: ViewportObserver })
  Object.defineProperty(globalThis, 'IntersectionObserver', { configurable: true, value: ViewportObserver })
  try {
    const { container, unmount } = render(<BlurText text="Your next idea." direction="bottom" threshold={0.2} rootMargin="0px 0px -40px 0px" once={once} delay={0} stepDuration={0} />)
    const observer = observers[0]
    const words = [...container.querySelectorAll<HTMLElement>('.blur-text-segment')]
    expect(observer.options).toEqual({ threshold: 0.2, rootMargin: '0px 0px -40px 0px' })
    expect(observer.target).toBe(container.querySelector('.blur-text'))
    expect(words.every(word => word.style.opacity === '0')).toBe(true)
    act(() => observer.callback([{ isIntersecting: true, intersectionRatio: 0.05 } as IntersectionObserverEntry], observer as unknown as IntersectionObserver))
    expect(words.every(word => word.style.opacity === '0')).toBe(true)
    expect(observer.disconnected).toBe(false)
    act(() => observer.callback([{ isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], observer as unknown as IntersectionObserver))
    await waitFor(() => expect(words.every(word => word.style.opacity === '1')).toBe(true))
    expect(observer.disconnected).toBe(once)
    if (!once) {
      act(() => observer.callback([{ isIntersecting: false, intersectionRatio: 0 } as IntersectionObserverEntry], observer as unknown as IntersectionObserver))
      await waitFor(() => expect(words.every(word => word.style.opacity === '0')).toBe(true))
      act(() => observer.callback([{ isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], observer as unknown as IntersectionObserver))
      await waitFor(() => expect(words.every(word => word.style.opacity === '1')).toBe(true))
    }
    unmount()
    expect(observer.disconnected).toBe(true)
  } finally {
    cleanup()
    if (windowDescriptor) Object.defineProperty(window, 'IntersectionObserver', windowDescriptor)
    else Reflect.deleteProperty(window, 'IntersectionObserver')
    if (globalDescriptor) Object.defineProperty(globalThis, 'IntersectionObserver', globalDescriptor)
    else Reflect.deleteProperty(globalThis, 'IntersectionObserver')
  }
})

test('disabled animations keep both text and the accent word immediately visible', () => {
  const { container } = render(<BlurText text="Let’s make it real." disabled renderSegment={segment => segment === 'real.' ? <em>{segment}</em> : segment} />)
  expect(container.querySelector('em')?.textContent).toBe('real.')
  expect(container.querySelector('.blur-text-accessible')?.textContent).toBe('Let’s make it real.')
  expect([...container.querySelectorAll<HTMLElement>('.blur-text-segment')].every(word => word.style.opacity === '1' && word.style.filter === 'blur(0px)')).toBe(true)
})
