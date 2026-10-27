import { afterEach, expect, spyOn, test } from 'bun:test'
import { act, cleanup, render } from '@testing-library/react'
import { useRef } from 'react'
import { renderToString } from 'react-dom/server'
import { isHeroVisibleInViewport, useHeroShaderVisibility } from '../src/components/home/hooks/useHeroShaderVisibility'
import { SHADER_RELEASE_DELAY_MS } from '../src/components/shaders/shader-transition'

afterEach(cleanup)

function Harness({ enabled = true }: { enabled?: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const state = useHeroShaderVisibility(ref, enabled)
  return <section ref={ref} data-mounted={state.mounted} data-visible={state.visible} />
}

test('homepage SSR defers hero GPU resources until visibility is measured', () => {
  expect(renderToString(<Harness />)).toContain('data-mounted="false" data-visible="false"')
})

test('a tall hero remains eligible at the top of a short viewport, including landscape and docked devtools', () => {
  expect(isHeroVisibleInViewport({ top: 0, bottom: 2400, height: 2400 }, 300)).toBe(true)
  expect(isHeroVisibleInViewport({ top: -2330, bottom: 70, height: 2400 }, 300)).toBe(true)
  expect(isHeroVisibleInViewport({ top: -2350, bottom: 50, height: 2400 }, 300)).toBe(false)
  expect(isHeroVisibleInViewport({ top: -80, bottom: 20, height: 100 }, 300)).toBe(true)
  expect(isHeroVisibleInViewport({ top: 0, bottom: 0, height: 0 }, 300)).toBe(false)
})

test('hero finishes its fade before releasing resources, cancels release on return, and releases immediately when disabled', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'IntersectionObserver')
  let report: IntersectionObserverCallback = () => {}
  let disconnected = 0
  Object.defineProperty(globalThis, 'IntersectionObserver', { configurable: true, value: class {
    constructor(callback: IntersectionObserverCallback) { report = callback }
    observe() {}
    disconnect() { disconnected++ }
  } })
  const scheduled = new Map<number, () => void>()
  let id = 0
  const timer = spyOn(window, 'setTimeout').mockImplementation((callback, delay) => {
    expect(delay).toBe(SHADER_RELEASE_DELAY_MS)
    scheduled.set(++id, callback as () => void)
    return id
  })
  const clear = spyOn(window, 'clearTimeout').mockImplementation(value => { scheduled.delete(Number(value)) })
  const result = render(<Harness />)
  const section = result.container.querySelector('section')!
  const ratio = (intersectionRatio: number) => act(() => report([{ intersectionRatio, isIntersecting: intersectionRatio > 0, boundingClientRect: { top: -(600 - intersectionRatio * 600), bottom: intersectionRatio * 600, height: 600 }, rootBounds: { height: 600 } } as IntersectionObserverEntry], {} as IntersectionObserver))
  try {
    expect(section.dataset.mounted).toBe('false')
    ratio(.75)
    expect(section.dataset.visible).toBe('true')
    expect(section.dataset.mounted).toBe('true')
    ratio(.15)
    expect(section.dataset.visible).toBe('false')
    expect(section.dataset.mounted).toBe('true')
    expect(scheduled.size).toBe(1)
    ratio(.5)
    expect(scheduled.size).toBe(0)
    ratio(0)
    act(() => { for (const callback of scheduled.values()) callback(); scheduled.clear() })
    expect(section.dataset.mounted).toBe('false')
    ratio(.8)
    result.rerender(<Harness enabled={false} />)
    expect(section.dataset.mounted).toBe('false')
    expect(section.dataset.visible).toBe('false')
    expect(scheduled.size).toBe(0)
    result.rerender(<Harness />)
    expect(section.dataset.mounted).toBe('true')
    ratio(0)
    result.unmount()
    expect(disconnected).toBe(1)
    expect(scheduled.size).toBe(0)
  } finally {
    result.unmount(); timer.mockRestore(); clear.mockRestore()
    if (original) Object.defineProperty(globalThis, 'IntersectionObserver', original)
    else Reflect.deleteProperty(globalThis, 'IntersectionObserver')
  }
})
