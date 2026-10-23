import { expect, test } from 'bun:test'
import * as THREE from 'three'
import { ProjectBackgroundPass } from '../src/components/terrain-recreation/engine/project-background.js'
import { DEFAULT_SETTINGS } from '../src/components/terrain-recreation/engine/scene.js'

function backgroundPass(reducedMotion = false) {
  return new ProjectBackgroundPass({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), objects: [], distortion: null, reducedMotion,
    stormUniforms: { uFlash: { value: 0 }, uFlashPosition: { value: new THREE.Vector2(.5, .5) } } })
}

test('uses the selected project background preset without changing terrain or thunder audio defaults', () => {
  expect(DEFAULT_SETTINGS).toMatchObject({
    projectGlow: 3, projectThunderGlow: 1.59, projectBloom: .24, projectBloomThreshold: .31,
    projectDistortion: 1.32, projectDistortionScale: 5, projectBackgroundBlur: 0,
    projectExposure: .25, projectFrost: .73, projectFrostDensity: .52, projectFrostSize: .23,
    projectGrain: .09, projectThunderVolume: .1, thunderVolume: .3,
    lightningEnabled: true, soundEnabled: true,
  })
  const pass = backgroundPass()
  pass.update(12, { active: true, amount: 1 }, new THREE.Vector2(), DEFAULT_SETTINGS)
  expect(pass.getState()).toMatchObject({
    glow: 3, thunderGlow: 1.59, bloom: .24, bloomThreshold: .31,
    amount: 1.32, scale: 5, blur: 0, frost: .73, frostDensity: .52, frostSize: .23,
  })
  pass.dispose()
})

test('softens only the project background and exposes a bounded frost control without another pass', () => {
  const pass = backgroundPass()
  pass.setSize(1440, 900)
  pass.update(12, { active: true, amount: 1 }, new THREE.Vector2())
  expect(pass.getState().blur).toBe(3.35)
  expect(pass.getState().frost).toBe(.85)
  expect(pass.getState().frostDensity).toBe(.72)
  expect(pass.getState().frostSize).toBe(.4)
  expect(pass.uniforms.uTime.value).toBe(12)
  expect(pass.uniforms.uViewportSize.value.toArray()).toEqual([1440, 900])
  pass.update(14, { active: true, amount: 1 }, new THREE.Vector2(), { projectFrost: 5, projectFrostDensity: 3, projectFrostSize: 10, projectBackgroundBlur: 4 })
  expect(pass.getState().frost).toBe(1.5)
  expect(pass.getState().frostDensity).toBe(1)
  expect(pass.getState().frostSize).toBe(1.2)
  expect(pass.getState().blur).toBe(4)
  pass.update(15, { active: false, amount: 0 }, new THREE.Vector2(), { projectFrost: 0, projectFrostDensity: -1, projectFrostSize: 0 })
  expect(pass.enabled).toBe(false)
  expect(pass.getState().frost).toBe(0)
  expect(pass.getState().frostDensity).toBe(0)
  expect(pass.getState().frostSize).toBe(.2)
  pass.dispose()
})

test('reduced motion freezes the frosty shimmer instead of continuously animating it', () => {
  const pass = backgroundPass(true)
  pass.update(20, { active: true, amount: 1 }, new THREE.Vector2(.4, .6))
  expect(pass.uniforms.uTime.value).toBe(0)
  expect(pass.uniforms.uPointer.value.toArray()).toEqual([0, 0])
  pass.update(40, { active: true, amount: 1 }, new THREE.Vector2(.8, .2))
  expect(pass.uniforms.uTime.value).toBe(0)
  pass.dispose()
})

test('advances sparkle animation every frame independently of the cached background capture', () => {
  const pass = backgroundPass()
  pass.ready = true
  pass.lastCapture = 10
  for (const time of [10.016, 10.032, 10.048]) {
    pass.update(time, { active: true, amount: 1 }, new THREE.Vector2())
    expect(pass.uniforms.uTime.value).toBe(time)
    expect(pass.lastCapture).toBe(10)
    expect(pass.ready).toBe(true)
  }
  pass.dispose()
})
