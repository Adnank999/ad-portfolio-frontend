import { createValueParticles, getValueParticleColor } from '../src/components/home/cinematic/value/particle-data'

// Preserve the exact static artwork without hydrating hundreds of SVG nodes.
const cloud = createValueParticles(240, 36, 0)
const color = (hue: number) => `rgb(${getValueParticleColor(hue).map(channel => Math.round(channel * 255)).join(' ')})`
const glow = [0, .25, .5, .75].map((hue, index) => `<circle cx="${220 + Math.sin(index * 2) * 35}" cy="${160 + index * 60}" r="30" fill="${color(hue)}"/>`).join('')
const particles = Array.from(cloud.seeds, (seed, index) => `<circle cx="${260 + cloud.positions[index * 3] * 120}" cy="${260 - cloud.positions[index * 3 + 1] * 120}" r="${.65 + seed ** 5 * 2.6}" opacity="${.3 + seed * .7}" fill="${color(cloud.colors[index])}"${seed > .9 ? ' filter="url(#spark)"' : ''}/>`).join('')
await Bun.write(new URL('../public/images/value-particles.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 520"><defs><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="12"/></filter><filter id="spark" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="2"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#glow)" opacity=".35">${glow}</g>${particles}</svg>`)
