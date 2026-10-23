import { useEffect, useMemo, useRef, useState } from 'react'
import { useMotionValue, type MotionValue } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'

export type HeroShaderControls = {
  speed: MotionValue<number>
  strength: MotionValue<number>
  brightness: MotionValue<number>
  view: MotionValue<number>
  snapshot: MotionValue<number>
  exportPng: MotionValue<number>
}

export function useHeroShaderControls(): HeroShaderControls {
  const speed = useMotionValue(1.5)
  const strength = useMotionValue(2)
  const brightness = useMotionValue(.25)
  const view = useMotionValue(0)
  const snapshot = useMotionValue(0)
  const exportPng = useMotionValue(0)
  return useMemo(() => ({ speed, strength, brightness, view, snapshot, exportPng }), [speed, strength, brightness, view, snapshot, exportPng])
}

const renderViews = ['Final composite', 'Original marble', 'Reveal mask (R)', 'Selection mask (G)', 'Timing mask (B)', 'Color gradient', 'Noise', 'Loop feedback', 'Blurred feedback']
const sliders = [
  { key: 'speed', label: 'Animation speed', min: .1, max: 2, step: .05 },
  { key: 'strength', label: 'Hover reveal', min: 0, max: 3, step: .05 },
  { key: 'brightness', label: 'Dim factor', min: .25, max: 2, step: .05 },
] as const

export function ShaderControls({ controls, available, paused, onPause, onSnapshot, copyHidden, onToggleCopy }: {
  controls: HeroShaderControls
  available: boolean
  paused: boolean
  onPause: () => void
  onSnapshot: () => void
  copyHidden: boolean
  onToggleCopy: () => void
}) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(() => ({ speed: controls.speed.get(), strength: controls.strength.get(), brightness: controls.brightness.get(), view: controls.view.get() }))
  const toggle = useRef<HTMLButtonElement>(null)
  const close = () => { setOpen(false); toggle.current?.focus() }
  useEffect(() => {
    if (!open) return
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus() } }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [open])

  return <div className="hero-shader-tools" data-lenis-prevent>
    <button ref={toggle} className="hero-shader-toggle" type="button" aria-expanded={open} aria-controls="hero-shader-panel" onClick={() => setOpen(!open)}>
      <SlidersHorizontal size={16} aria-hidden="true" />Shader controls
    </button>
    {open && <section id="hero-shader-panel" className="hero-shader-panel" aria-labelledby="hero-shader-controls-title">
      <div className="hero-shader-panel-heading"><h2 id="hero-shader-controls-title">Tune the shader</h2><button type="button" onClick={close} aria-label="Close shader controls"><X size={18} aria-hidden="true" /></button></div>
      {!available && <p className="hero-shader-notice">Controls are available when the animated WebGL scene is ready.</p>}
      <fieldset disabled={!available}>
        <label className="hero-shader-select" htmlFor="hero-shader-view">Render pass<select id="hero-shader-view" value={values.view} onChange={event => {
          const view = Number(event.target.value)
          controls.view.set(view)
          setValues(previous => ({ ...previous, view }))
        }}>{renderViews.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></label>
        {sliders.map(slider => <div className="hero-shader-slider" key={slider.key}>
          <label htmlFor={`hero-shader-${slider.key}`}>{slider.label}<output htmlFor={`hero-shader-${slider.key}`}>{values[slider.key].toFixed(2)}×</output></label>
          <input id={`hero-shader-${slider.key}`} type="range" min={slider.min} max={slider.max} step={slider.step} value={values[slider.key]} onChange={event => {
            const value = Number(event.target.value)
            controls[slider.key].set(value)
            setValues(previous => ({ ...previous, [slider.key]: value }))
          }} />
        </div>)}
        <div className="hero-shader-actions">
          <button type="button" aria-pressed={paused} onClick={onPause}>{paused ? 'Play shader' : 'Pause shader'}</button>
          <button type="button" onClick={onSnapshot}>Captured frame</button>
          <button type="button" onClick={() => controls.exportPng.set(controls.exportPng.get() + 1)}>Save PNG</button>
        </div>
      </fieldset>
      <button className="hero-shader-copy-toggle" type="button" aria-pressed={copyHidden} onClick={onToggleCopy}>{copyHidden ? 'Show hero text' : 'Hide hero text'}</button>
    </section>}
  </div>
}
