export type VaporSweep = 'left' | 'right' | 'center' | 'top' | 'scatter'
export type VaporParticle = { x: number; y: number; alpha: number; seed: number; delay: number; path: Float32Array }
export type VaporWord = { bitmap: HTMLCanvasElement; particles: VaporParticle[]; cellSize: number }
export type VaporFlow = { spread: number; rise: number; turbulence: number; diffusion: number; grain: number; sweep: VaporSweep }

export function vaporNoise(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

function curlField(positionX: number, positionY: number) {
  return {
    x: -Math.sin(positionX * 1.2) * Math.sin(positionY * 1.1) * .55 + Math.cos(positionX * 1.8 + positionY * 1.5) * .38 + Math.sin(positionX * .7 - positionY * 1.9) * .4,
    y: -Math.cos(positionX * 1.2) * Math.cos(positionY * 1.1) * .6 - Math.cos(positionX * 1.8 + positionY * 1.5) * .46 + Math.sin(positionX * .7 - positionY * 1.9) * .15,
  }
}

function buildParticlePath(particle: VaporParticle, normalizedX: number, normalizedY: number, fontSize: number, flow: VaporFlow) {
  const direction = flow.sweep === 'right' ? 1 : flow.sweep === 'center' ? normalizedX < .5 ? -1 : 1 : flow.sweep === 'left' ? -1 : 0
  const scatterAngle = vaporNoise(particle.seed * 200 + 12) * Math.PI * 2
  const scatterSpeed = .3 + vaporNoise(particle.seed * 400 + 27) * 1.4
  let positionX = 0
  let positionY = 0
  for (let step = 1; step <= 12; step++) {
    const field = curlField(normalizedX * 4 + positionX * 1.6 + 2.1, normalizedY * 2 + positionY * 1.6 + 3.4)
    const baseX = flow.sweep === 'scatter' ? Math.cos(scatterAngle) * scatterSpeed : direction * (.65 + normalizedX * .2)
    const baseY = flow.sweep === 'scatter' ? Math.sin(scatterAngle) * scatterSpeed : -flow.rise
    const diffusionX = Math.cos(scatterAngle) * flow.diffusion * (.35 + particle.seed)
    const diffusionY = Math.sin(scatterAngle) * flow.diffusion * (.35 + particle.seed)
    positionX += (baseX + field.x * flow.turbulence + diffusionX) * flow.spread / 12
    positionY += (baseY + field.y * flow.turbulence + diffusionY) * flow.spread / 12
    particle.path[step * 2] = positionX * fontSize
    particle.path[step * 2 + 1] = positionY * fontSize
  }
}

export function sampleVaporWord(bitmap: HTMLCanvasElement, width: number, height: number, padding: number, pixelRatio: number, density: number, flow: VaporFlow, fontSize: number, limit: number): VaporWord {
  const context = bitmap.getContext('2d')!
  const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data
  let ink = 0
  for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 12) ink++
  const cellSize = Math.max(1, 1.35 / Math.sqrt(Math.max(.1, density)), Math.sqrt(ink / (pixelRatio * pixelRatio * limit)))
  const particles: VaporParticle[] = []
  for (let localY = 0; localY < height; localY += cellSize) {
    for (let localX = 0; localX < width; localX += cellSize) {
      const originX = localX + padding
      const originY = localY + padding
      let alpha = 0
      for (let sampleY = Math.floor(localY * pixelRatio); sampleY < Math.min(bitmap.height, (localY + cellSize) * pixelRatio); sampleY++) {
        for (let sampleX = Math.floor(localX * pixelRatio); sampleX < Math.min(bitmap.width, (localX + cellSize) * pixelRatio); sampleX++) alpha = Math.max(alpha, pixels[(sampleY * bitmap.width + sampleX) * 4 + 3])
      }
      if (!alpha) continue
      const seed = vaporNoise(particles.length + localX * 13 + localY * 7)
      particles.push({ x: originX, y: originY, alpha: alpha / 255, seed, delay: 0, path: new Float32Array(26) })
    }
  }
  const left = Math.min(...particles.map(particle => particle.x))
  const right = Math.max(...particles.map(particle => particle.x))
  const top = Math.min(...particles.map(particle => particle.y))
  const bottom = Math.max(...particles.map(particle => particle.y))
  for (const particle of particles) {
    const horizontal = (particle.x - left) / Math.max(1, right - left)
    const vertical = (particle.y - top) / Math.max(1, bottom - top)
    const rank = flow.sweep === 'right' ? 1 - horizontal : flow.sweep === 'center' ? Math.abs(horizontal - .5) * 2 : flow.sweep === 'top' ? vertical : flow.sweep === 'scatter' ? vaporNoise(Math.floor(horizontal * 8 / Math.max(.2, flow.grain)) * 37 + Math.floor(vertical * 5 / Math.max(.2, flow.grain)) * 73) : horizontal
    particle.delay = Math.max(0, Math.min(1, rank + (particle.seed - .5) * .075 * flow.grain))
    buildParticlePath(particle, horizontal, vertical, fontSize, flow)
  }
  return { bitmap, particles, cellSize }
}

export function vaporPalette(context: CanvasRenderingContext2D, front: string, vapor: string): string[] {
  const read = (color: string) => {
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = color
    context.fillRect(0, 0, 1, 1)
    return context.getImageData(0, 0, 1, 1).data
  }
  const start = read(front)
  const end = read(vapor)
  return Array.from({ length: 16 }, (_, index) => `rgb(${[0, 1, 2].map(channel => Math.round(start[channel] + (end[channel] - start[channel]) * index / 15)).join(',')})`)
}
