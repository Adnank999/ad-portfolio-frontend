import { expect, test } from 'bun:test'
import type { Camera, Object3D, Texture, WebGLRenderer } from 'three'
import { prepareHeroPrograms } from '../src/components/home/shaders-glsl/prepare-hero-programs'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const fail = (error: unknown) => { throw error }
async function until(condition: () => boolean) {
  const deadline = Date.now() + 2000
  while (!condition() && Date.now() < deadline) await wait(10)
  expect(condition()).toBe(true)
}
function fixture() {
  let completed = false
  const calls: string[] = []
  const renderer = {
    getContext: () => ({ isContextLost: () => false, getProgramParameter: () => completed }),
    extensions: { get: () => ({ COMPLETION_STATUS_KHR: 0x91B1 }) },
    info: { programs: [{ program: {} }] },
    compile: () => calls.push('compile'),
    initTexture: () => calls.push('texture'),
  } as unknown as WebGLRenderer
  return { renderer, calls, complete: () => { completed = true } }
}
const scenes = Array.from({ length: 3 }, () => ({ scene: {} as Object3D, camera: {} as Camera }))
const textures = Array.from({ length: 7 }, () => ({} as Texture))

test('hero preparation yields between stages and waits for GPU compilation before uploading or presenting', async () => {
  const { renderer, calls, complete } = fixture()
  const cancel = prepareHeroPrograms(renderer, scenes, textures, () => calls.push('ready'), fail)
  expect(calls).toEqual([])
  await until(() => calls.length === 3)
  await wait(30)
  expect(calls).toEqual(['compile', 'compile', 'compile'])
  complete()
  await until(() => calls.includes('ready'))
  expect(calls).toEqual([...Array(3).fill('compile'), ...Array(7).fill('texture'), 'ready'])
  cancel()
})

test('leaving the hero or unmounting cancels queued GPU work and completion polling', async () => {
  const { renderer, calls } = fixture()
  const cancel = prepareHeroPrograms(renderer, scenes, textures, () => calls.push('ready'), fail)
  await until(() => calls.length === 3)
  cancel()
  await wait(40)
  expect(calls).toEqual(['compile', 'compile', 'compile'])
  const neverStarted = fixture()
  const stop = prepareHeroPrograms(neverStarted.renderer, scenes, textures, () => neverStarted.calls.push('ready'), fail)
  stop()
  await wait(40)
  expect(neverStarted.calls).toEqual([])
})

test('GPU preparation errors reach the existing scene boundary without presenting a broken shader', async () => {
  const { renderer, calls } = fixture()
  const error = new Error('GPU unavailable')
  renderer.compile = () => { throw error }
  let reported: unknown
  const cancel = prepareHeroPrograms(renderer, scenes, textures, () => calls.push('ready'), failure => { reported = failure })
  await until(() => reported === error)
  expect(calls).toEqual([])
  cancel()
})
