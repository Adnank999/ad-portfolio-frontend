export type ParticleMask = { width: number; height: number; data: Uint8ClampedArray }

export const PARTICLE_SHAPE_ASSETS = ['design.svg', 'build.svg', 'ship.svg'] as const
const assetBase = `${import.meta.env?.BASE_URL || '/'}about-me/`
let maskPromise: Promise<ParticleMask[]> | undefined

function readParticleMask(filename: string): Promise<ParticleMask> {
  return new Promise((resolve, reject) => {
    const image = document.createElement('img')
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 384
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) throw new Error('Particle mask canvas unavailable')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(context.getImageData(0, 0, canvas.width, canvas.height))
      } catch (error) { reject(error) }
      finally { image.onload = image.onerror = null }
    }
    image.onerror = () => {
      image.onload = image.onerror = null
      reject(new Error(`Particle shape could not load: ${filename}`))
    }
    image.src = `${assetBase}${filename}`
  })
}

export function loadParticleMasks() {
  if (!maskPromise) maskPromise = Promise.all(PARTICLE_SHAPE_ASSETS.map(readParticleMask)).catch(error => {
    maskPromise = undefined
    throw error
  })
  return maskPromise
}

export function sampleParticleMask(mask: ParticleMask, count: number) {
  const pixels: number[] = []
  let left = mask.width, right = 0, top = mask.height, bottom = 0
  for (let pixel = 0; pixel < mask.width * mask.height; pixel++) {
    if (mask.data[pixel * 4 + 3] < 128) continue
    const horizontal = pixel % mask.width, vertical = Math.floor(pixel / mask.width)
    pixels.push(pixel)
    left = Math.min(left, horizontal); right = Math.max(right, horizontal)
    top = Math.min(top, vertical); bottom = Math.max(bottom, vertical)
  }
  if (!pixels.length) throw new Error('Particle shape has no visible pixels')
  const scale = 3 / Math.max(right - left + 1, bottom - top + 1)
  const centerX = (left + right + 1) / 2, centerY = (top + bottom + 1) / 2
  const points = new Float32Array(count * 3)
  for (let index = 0; index < count; index++) {
    const pixel = pixels[Math.floor(((index + .5) * .61803398875 % 1) * pixels.length)]
    points[index * 3] = (pixel % mask.width + .5 - centerX) * scale
    points[index * 3 + 1] = (centerY - Math.floor(pixel / mask.width) - .5) * scale
    points[index * 3 + 2] = ((index * .41421356237) % 1 - .5) * .06
  }
  return points
}

export function createParticleShapes(count: number, masks: readonly ParticleMask[]) {
  if (masks.length !== 3) throw new Error('Design, build and ship particle masks are required')
  const think = new Float32Array(count * 3)
  for (let index = 0; index < count; index++) {
    const fraction = index / count
    const angle = index * 2.39996322973
    const height = fraction * 2 - 1
    const radius = 0.28 + Math.pow(Math.abs(height), 0.8) * 0.85
    think.set([Math.cos(angle) * radius, height * 1.55, Math.sin(angle) * radius], index * 3)
  }
  return [think, ...masks.map(mask => sampleParticleMask(mask, count))]
}

function createRandomValues(count: number, seed: number) {
  const hues = new Float32Array(count)
  let state = seed
  for (let index = 0; index < count; index++) {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    hues[index] = (state >>> 8) / 0x1000000
  }
  return hues
}

export function createParticleHues(count: number) {
  return Float32Array.from({ length: count }, (_value, index) => (index * .61803398875) % 1)
}

export function createParticleCloud(shapes: readonly Float32Array[], floatingCount: number, glowCount: number) {
  const shapeCount = shapes[0].length / 3
  const total = shapeCount + floatingCount + glowCount
  const positions = shapes.map(shape => {
    const buffer = new Float32Array(total * 3)
    buffer.set(shape)
    return buffer
  })
  const kinds = new Float32Array(total)
  const seeds = createRandomValues(total, 0x85ebca6b)
  const hues = createParticleHues(total)
  const scatter = createRandomValues(floatingCount * 3, 0x27d4eb2d)
  for (let index = 0; index < floatingCount; index++) {
    const offset = (shapeCount + index) * 3
    const horizontal = (.52 + scatter[index * 3] * .44) * (index % 2 ? -1 : 1)
    const vertical = (scatter[index * 3 + 1] * 2 - 1) * 2.4
    const depth = (scatter[index * 3 + 2] - .5) * 1.3
    for (const shape of positions) shape.set([horizontal, vertical, depth], offset)
    kinds[shapeCount + index] = 1
  }
  for (let index = 0; index < glowCount; index++) {
    const source = Math.floor(((index + .5) * .61803398875 % 1) * shapeCount)
    const destination = shapeCount + floatingCount + index
    for (const [stage, shape] of positions.entries()) shape.set(shapes[stage].subarray(source * 3, source * 3 + 3), destination * 3)
    hues[destination] = hues[source]
    kinds[destination] = 2
  }
  return { positions, kinds, seeds, hues }
}
