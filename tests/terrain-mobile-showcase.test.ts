import { afterEach, expect, mock, test } from 'bun:test'
import { createMobileProjectNavigation, getAdjacentProjectIndex, getMobileCameraScale } from '../src/components/terrain-recreation/engine/mobile-showcase.js'

afterEach(() => { document.body.replaceChildren() })

test('mobile camera pulls back responsively without changing desktop framing', () => {
  expect(getMobileCameraScale(1440, 900)).toBe(1)
  expect(getMobileCameraScale(390, 844)).toBe(1.5)
  expect(getMobileCameraScale(760, 390)).toBe(1.1)
  expect(getMobileCameraScale(390, 740)).toBeCloseTo(740 / 390 * .75)
  expect(getMobileCameraScale(0, 740)).toBe(1)
})

test('project arrows select adjacent entries and wrap in either direction', () => {
  expect(getAdjacentProjectIndex(0, -1, 3)).toBe(2)
  expect(getAdjacentProjectIndex(2, 1, 3)).toBe(0)
  expect(getAdjacentProjectIndex(1, 1, 3)).toBe(2)
  expect(getAdjacentProjectIndex(0, 1, 0)).toBe(-1)
  const onStep = mock((_direction: number) => {})
  const navigation = createMobileProjectNavigation(document.body, onStep)
  navigation.update(0, [{ title: 'First' }, { title: 'Second' }, { title: 'Third' }])
  const buttons = document.querySelectorAll('button')
  expect(buttons[0].getAttribute('aria-label')).toBe('Previous project: Third')
  expect(buttons[1].getAttribute('aria-label')).toBe('Next project: Second')
  buttons[0].click()
  buttons[1].click()
  expect(onStep.mock.calls).toEqual([[-1], [1]])
  expect(document.querySelector('[role="status"]')?.textContent).toBe('1 / 3')
  navigation.update(0, [{ title: 'Only project' }])
  expect(buttons[0].disabled).toBe(true)
  expect(buttons[1].disabled).toBe(true)
  navigation.destroy()
  expect(document.querySelector('nav')).toBeNull()
})
