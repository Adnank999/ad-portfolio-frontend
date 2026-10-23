import { expect, spyOn, test } from 'bun:test'
import { createRef } from 'react'
import { renderToString } from 'react-dom/server'
import { createRoot, _roots } from '../node_modules/@react-three/fiber/dist/react-three-fiber.esm.js'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { CinematicHero } from '../src/components/home/cinematic/CinematicHero'
import { prefersLightweightGraphics, scheduleAfterPageLoad } from '../src/lib/deferred-work'

test('the homepage headline is visible in server HTML before JavaScript or WebGL loads', async () => {
  const route = createRootRoute({ component: () => <CinematicHero sectionRef={createRef<HTMLElement>()} still /> })
  const router = createRouter({ routeTree: route, history: createMemoryHistory({ initialEntries: ['/'] }), isServer: true })
  await router.load()
  const markup = renderToString(<RouterProvider router={router} />)
  const heading = markup.match(/<h1[^>]*>[\s\S]*?<\/h1>/)?.[0]
  expect(heading).toContain('Ideas')
  expect(heading).toContain('evolve.')
  expect(heading).toContain('opacity:1')
  expect(heading).not.toContain('opacity:0')
  expect(heading).not.toContain('blur(10px)')
})

test('Fiber uses Timer without deprecated Clock construction and preserves pause/resume timing', () => {
  let milliseconds = 1000
  const now = spyOn(performance, 'now').mockImplementation(() => milliseconds)
  const warning = spyOn(console, 'warn').mockImplementation(() => {})
  const canvas = document.createElement('canvas')
  try {
    createRoot(canvas)
    const store = _roots.get(canvas)!.store
    store.setState({ gl: { xr: { isPresenting: false } } as ReturnType<typeof store.getState>['gl'] })
    const clock = store.getState().clock
    expect(clock.getDelta()).toBe(0)
    milliseconds += 16
    expect(clock.getDelta()).toBeCloseTo(.016)
    expect(clock.getElapsedTime()).toBeCloseTo(.016)
    clock.stop()
    milliseconds += 1000
    expect(clock.getDelta()).toBe(0)
    clock.start()
    milliseconds += 20
    expect(clock.getDelta()).toBeCloseTo(.02)
    expect(clock.elapsedTime).toBeCloseTo(.02)
    store.getState().setFrameloop('never')
    expect(clock.elapsedTime).toBe(0)
    expect(clock.running).toBe(false)
    store.getState().setFrameloop('demand')
    milliseconds += 10
    expect(clock.getDelta()).toBeCloseTo(.01)
    expect(warning).not.toHaveBeenCalled()
  } finally {
    _roots.delete(canvas)
    now.mockRestore(); warning.mockRestore()
  }
})

test('background graphics wait for page load, paint and idle time, and cancel on unmount', () => {
  const readyState = Object.getOwnPropertyDescriptor(document, 'readyState')
  const idleCallback = Object.getOwnPropertyDescriptor(window, 'requestIdleCallback')
  const cancelIdleCallback = Object.getOwnPropertyDescriptor(window, 'cancelIdleCallback')
  Object.defineProperty(document, 'readyState', { configurable: true, value: 'loading' })
  const frames: FrameRequestCallback[] = []
  const timers: { callback: () => void; delay?: number }[] = []
  const idle: (() => void)[] = []
  const frame = spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { frames.push(callback); return frames.length })
  const cancelFrame = spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  const timer = spyOn(window, 'setTimeout').mockImplementation((callback, delay) => { timers.push({ callback: callback as () => void, delay }); return timers.length })
  const clearTimer = spyOn(window, 'clearTimeout').mockImplementation(() => {})
  Object.defineProperty(window, 'requestIdleCallback', { configurable: true, value: (callback: () => void) => { idle.push(callback); return idle.length } })
  Object.defineProperty(window, 'cancelIdleCallback', { configurable: true, value: () => {} })
  let calls = 0
  const cancel = scheduleAfterPageLoad(() => calls++, { delay: 4000 })
  try {
    expect(frames).toHaveLength(0)
    window.dispatchEvent(new Event('load'))
    frames.shift()!(0)
    expect(timers).toHaveLength(0)
    frames.shift()!(16)
    expect(timers[0].delay).toBe(4000)
    timers.shift()!.callback()
    expect(calls).toBe(0)
    idle.shift()!()
    expect(calls).toBe(1)
    cancel()
    const cancelLater = scheduleAfterPageLoad(() => calls++)
    window.dispatchEvent(new Event('load'))
    frames.shift()!(32)
    frames.shift()!(48)
    timers.shift()!.callback()
    cancelLater()
    idle.shift()!()
    expect(calls).toBe(1)
  } finally {
    cancel()
    frame.mockRestore(); cancelFrame.mockRestore(); timer.mockRestore(); clearTimer.mockRestore()
    if (readyState) Object.defineProperty(document, 'readyState', readyState)
    else Reflect.deleteProperty(document, 'readyState')
    if (idleCallback) Object.defineProperty(window, 'requestIdleCallback', idleCallback)
    else Reflect.deleteProperty(window, 'requestIdleCallback')
    if (cancelIdleCallback) Object.defineProperty(window, 'cancelIdleCallback', cancelIdleCallback)
    else Reflect.deleteProperty(window, 'cancelIdleCallback')
  }
})

test('Save-Data and 2G connections retain the lightweight homepage', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'connection')
  try {
    for (const [connection, expected] of [[{ saveData: true }, true], [{ effectiveType: 'slow-2g' }, true], [{ effectiveType: '2g' }, true], [{ saveData: false, effectiveType: '4g' }, false]] as const) {
      Object.defineProperty(navigator, 'connection', { configurable: true, value: connection })
      expect(prefersLightweightGraphics()).toBe(expected)
    }
  } finally {
    if (original) Object.defineProperty(navigator, 'connection', original)
    else Reflect.deleteProperty(navigator, 'connection')
  }
})
