import { useId, useMemo } from 'react'
import { createValueParticles, getValueParticleColor } from './particle-data'

export function ValueParticleFallback() {
  const identifier = useId().replaceAll(':', '')
  const cloud = useMemo(() => createValueParticles(240, 36, 0), [])
  return <svg className="value-particle-fallback" viewBox="0 0 520 520" aria-hidden="true" focusable="false">
    <defs><filter id={`value-glow-${identifier}`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="12" /></filter><filter id={`value-spark-${identifier}`} x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="2" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
    <g filter={`url(#value-glow-${identifier})`} opacity=".35">{[0, .25, .5, .75].map((hue, index) => <circle key={hue} cx={220 + Math.sin(index * 2) * 35} cy={160 + index * 60} r="30" fill={`rgb(${getValueParticleColor(hue).map(channel => Math.round(channel * 255)).join(' ')})`} />)}</g>
    {Array.from(cloud.seeds, (seed, index) => {
      const color = `rgb(${getValueParticleColor(cloud.colors[index]).map(channel => Math.round(channel * 255)).join(' ')})`
      return <circle key={index} cx={260 + cloud.positions[index * 3] * 120} cy={260 - cloud.positions[index * 3 + 1] * 120} r={.65 + seed ** 5 * 2.6} opacity={.3 + seed * .7} fill={color} filter={seed > .9 ? `url(#value-spark-${identifier})` : undefined} />
    })}
  </svg>
}
