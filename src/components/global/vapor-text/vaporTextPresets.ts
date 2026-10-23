import type { VaporSweep } from './vaporTextParticles'

export type VaporPreset = 'ink' | 'mist' | 'steam' | 'dust' | 'bloom' | 'frost'
export type VaporPresetSettings = {
  vaporColor: string
  particleSize: number
  spread: number
  rise: number
  turbulence: number
  diffusion: number
  grain: number
  sweep: VaporSweep
  stagger: number
  condense: number
  hold: number
  dissolve: number
  overlap: number
}

const timing = { grain: 1, condense: 2, hold: 2.4, dissolve: 1.5, overlap: .6 }

export const vaporTextPresets: Record<VaporPreset, VaporPresetSettings> = {
  ink: { ...timing, vaporColor: '#ffffff', particleSize: 1.2, spread: 1, rise: .6, turbulence: .6, diffusion: .2, sweep: 'left', stagger: .8 },
  mist: { ...timing, vaporColor: '#b19eef', particleSize: 1.2, spread: 1.2, rise: 1, turbulence: .8, diffusion: .35, sweep: 'left', stagger: .8 },
  steam: { ...timing, vaporColor: '#e8e3ff', particleSize: 1.1, spread: 1.7, rise: 2, turbulence: 1.2, diffusion: .25, sweep: 'top', stagger: .6 },
  dust: { ...timing, vaporColor: '#a3a3a3', particleSize: 1, spread: 1.5, rise: 0, turbulence: .3, diffusion: 1.4, sweep: 'scatter', stagger: .4 },
  bloom: { ...timing, vaporColor: '#ff9ffc', particleSize: 1.3, spread: 1.3, rise: .8, turbulence: 1, diffusion: .45, sweep: 'center', stagger: .9 },
  frost: { ...timing, vaporColor: '#9fd8ff', particleSize: 1.1, spread: 1.1, rise: -.5, turbulence: .5, diffusion: .5, sweep: 'right', stagger: .8 },
}
