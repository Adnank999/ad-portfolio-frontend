import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { ProjectShowcasePass } from '../../src/components/terrain-recreation/engine/project-showcase.js'
import { configureProjectOutput } from '../../src/components/terrain-recreation/engine/project-output.js'

const results: string[] = []
const check = (condition: unknown, message: string) => { if (!condition) throw new Error(message); results.push(`PASS: ${message}`) }
const width = 384
const height = 256
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true })
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.setSize(width, height)
document.body.prepend(renderer.domElement)
const context = renderer.getContext()
const info = context.getExtension('WEBGL_debug_renderer_info')
document.body.dataset.renderer = info ? context.getParameter(info.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER)
const textures: THREE.Texture[] = []
function texture(color: number[], colorSpace: THREE.ColorSpace = THREE.NoColorSpace) {
  const image = new THREE.DataTexture(new Uint8Array([...color, 255]), 1, 1)
  image.colorSpace = colorSpace
  image.needsUpdate = true
  textures.push(image)
  return image
}
const neutral = texture([128, 128, 128])
const solid = texture([255, 255, 255])
const composer = new EffectComposer(renderer)
const backdrop = new ShaderPass(new THREE.ShaderMaterial({
  vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader: 'void main(){gl_FragColor=vec4(.18,.2,.22,1.);}',
}))
const output = new OutputPass()
const grade = configureProjectOutput(output)
const artwork = new ProjectShowcasePass({ reducedMotion: true, distortion: neutral, masks: { reveal: solid, erosion: neutral } })
composer.addPass(backdrop)
composer.addPass(output)
composer.addPass(artwork)
artwork.transition.open()
const state = artwork.update(0, .1)
const frame = { left: 0, top: 0, width, height }
const hidden = { left: 0, top: -height * 4, width, height }
const read = () => {
  const pixels = new Uint8Array(width * height * 4)
  context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, pixels)
  return pixels
}
function sample(pixels: Uint8Array) {
  const index = (Math.floor(height / 2) * width + Math.floor(width / 2)) * 4
  return [...pixels.slice(index, index + 3)]
}
function render(exposure: number) {
  grade.update(state, { projectExposure: exposure })
  renderer.toneMappingExposure = exposure * 3
  composer.render()
  return read()
}
function sameColor(actual: number[], expected: number[]) {
  return actual.every((channel, index) => Math.abs(channel - expected[index]) <= 3)
}
async function run() {
  for (const color of [[180, 60, 40], [40, 180, 60], [60, 70, 180], [124, 124, 124]]) {
    const image = texture(color, THREE.SRGBColorSpace)
    artwork.setProject(color.join('-'), image, image, neutral)
    artwork.setLayout(frame, hidden, width, height)
    for (const exposure of [.05, .9]) {
      const pixel = sample(render(exposure))
      check(sameColor(pixel, color), `Hero preserves source RGB ${color} at background exposure ${exposure} (got ${pixel})`)
    }
  }
  const image = new Image()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const drawing = canvas.getContext('2d')!
  drawing.fillStyle = 'rgb(40,100,180)'
  drawing.fillRect(0, 0, 1, 1)
  image.src = canvas.toDataURL()
  await image.decode()
  artwork.setLayout(hidden, hidden, width, height)
  artwork.setMediaImage('detail', image)
  artwork.setMediaLayout([{ id: 'detail', rectangle: frame, progress: 1, hovered: false }], width, height)
  artwork.update(0, .1)
  for (const exposure of [.05, .9]) {
    const pixel = sample(render(exposure))
    check(sameColor(pixel, [40, 100, 180]), `Small detail preserves source RGB at background exposure ${exposure} (got ${pixel})`)
  }
  artwork.resetImages()
  const mask = await new THREE.TextureLoader().loadAsync('/project-artwork-mask.webp')
  textures.push(mask)
  artwork.uniforms.uRevealMask.value = mask
  const white = texture([255, 255, 255], THREE.SRGBColorSpace)
  artwork.setProject('mask-coverage', white, white, neutral)
  artwork.setLayout(hidden, hidden, width, height)
  artwork.update(0, .1)
  const background = render(.25)
  artwork.setLayout(frame, hidden, width, height)
  const revealed = render(.25)
  let visible = 0
  for (let index = 0; index < revealed.length; index += 4) visible += Math.max(0, (revealed[index] - background[index]) / Math.max(1, 255 - background[index]))
  const coverage = visible / (width * height)
  check(coverage > .6, `Expanded organic hero mask exposes ${(coverage * 100).toFixed(1)}% of its frame`)
  artwork.setLayout(hidden, frame, width, height)
  artwork.revealImage('next')
  artwork.update(0, .1)
  const next = render(.25)
  visible = 0
  for (let index = 0; index < next.length; index += 4) visible += Math.max(0, (next[index] - background[index]) / Math.max(1, 255 - background[index]))
  const nextCoverage = visible / (width * height)
  check(nextCoverage > .45, `Expanded circular mask exposes ${(nextCoverage * 100).toFixed(1)}% of its frame`)
  check(context.getError() === context.NO_ERROR, 'Project artwork renders without WebGL errors')
  document.getElementById('result')!.textContent = `${results.join('\n')}\n${results.length} project artwork browser checks passed`
  document.body.dataset.status = 'passed'
}
run().catch(error => { document.getElementById('result')!.textContent = `${results.join('\n')}\nFAIL: ${error.stack ?? error}`; document.body.dataset.status = 'failed' }).finally(() => {
  composer.dispose()
  backdrop.dispose()
  output.dispose()
  artwork.dispose()
  textures.forEach(image => image.dispose())
  renderer.dispose()
})
