import { createParticleHues } from '@/components/about/particleShapes'

export function getValueParticleColor(hue: number) {
  return [0, 2 / 3, 1 / 3].map(offset => {
    const fraction = hue + offset - Math.floor(hue + offset)
    const channel = Math.max(0, Math.min(1, Math.abs(fraction * 6 - 3) - 1))
    return .08 + channel * .92
  })
}

export function getValueParticleScrollBurst(progress: number) {
  const fraction = Math.max(0, Math.min(1, (progress - .3) / .4))
  return fraction * fraction * (3 - 2 * fraction)
}

export function getValueParticleBurstRadius(burst: number, seed: number) {
  const delay = seed * .12
  const travel = Math.max(0, Math.min(1, (burst - delay) / (1 - delay)))
  const center = .07 + seed * .1
  const radius = .6 + seed * 1.35
  return center + (radius - center) * travel
}

export function createValueParticles(count: number, floatingCount: number, glowCount: number) {
  const total = count + floatingCount + glowCount
  const positions = new Float32Array(total * 3)
  const seeds = new Float32Array(total)
  const colors = new Float32Array(total)
  const kinds = new Float32Array(total)
  const hues = createParticleHues(count)
  const random = (index: number) => {
    const value = Math.sin((index + 1) * 127.1) * 43758.5453
    return value - Math.floor(value)
  }
  for (let index = 0; index < total; index++) {
    const seed = random(index)
    seeds[index] = seed
    if (index < count) {
      const fraction = (index + .5) / count
      const angle = index * 2.399963
      const height = 1 - fraction * 2
      const radius = Math.sqrt(1 - height * height)
      const scatter = 1.08 + Math.sin(index * 73.31) * .16
      positions.set([Math.cos(angle) * radius * scatter, height * scatter, Math.sin(angle) * radius * scatter], index * 3)
      colors[index] = hues[index]
    } else if (index < count + floatingCount) {
      kinds[index] = 1
      const angle = random(index + 230) * Math.PI * 2
      const radius = 1.3 + seed * .55
      positions.set([Math.cos(angle) * radius, Math.sin(angle) * radius, (random(index + 91) - .5) * .7], index * 3)
      colors[index] = random(index + 11)
    } else {
      kinds[index] = 2
      const anchor = Math.floor((index - count - floatingCount + .5) / glowCount * count)
      positions.set(positions.subarray(anchor * 3, anchor * 3 + 3), index * 3)
      colors[index] = colors[anchor]
      seeds[index] = seeds[anchor]
    }
  }
  return { positions, seeds, colors, kinds }
}

export function getValueParticlePlacement(bounds: { left: number; top: number; width: number; height: number }, screen: { width: number; height: number }, viewport: { width: number; height: number }) {
  return {
    horizontal: ((bounds.left + bounds.width / 2) / screen.width - .5) * viewport.width,
    vertical: (.5 - (bounds.top + bounds.height / 2) / screen.height) * viewport.height,
    scale: Math.min(bounds.width, bounds.height) / screen.height * viewport.height / 3.8,
    visible: bounds.top < screen.height && bounds.top + bounds.height > 0 && bounds.width > 0 && bounds.height > 0,
  }
}
