import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useActiveShader } from './ActiveShaderProvider'
import { getPublishedShader } from './registry'
import type { ShaderVisual } from './types'
import { SHADER_FADE_DURATION_MS } from './shader-transition'

class ShaderBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function ReadyShader({ children, onReady }: { children: ReactNode; onReady: () => void }) {
  useEffect(() => {
    let painted = 0
    const frame = requestAnimationFrame(() => { painted = requestAnimationFrame(onReady) })
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(painted) }
  }, [onReady])
  return children
}

function ShaderLayer({ visible, children }: { visible: boolean; children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  return <div data-shader-layer aria-hidden="true" className="h-full w-full" style={{ opacity: visible && ready ? 1 : 0, transition: `opacity ${SHADER_FADE_DURATION_MS}ms ease-in-out` }}>
    <Suspense fallback={null}><ReadyShader onReady={onReady}>{children}</ReadyShader></Suspense>
  </div>
}

export function ShaderSlot({ id, visual }: { id: string; visual: ShaderVisual }) {
  const { activeId, visibleId, report } = useActiveShader()
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const definition = getPublishedShader(visual.shader)
  const Renderer = useMemo(() => definition ? lazy(definition.load) : null, [definition])
  const parsed = definition?.schema.safeParse(visual.props)
  const valid = !!Renderer && definition?.version === visual.version && parsed?.success === true
  useEffect(() => {
    setFailed(false)
  }, [visual.shader, visual.version])
  useEffect(() => {
    if (!valid || failed || !ref.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) report(id, entry.isIntersecting ? entry.intersectionRatio : 0)
    }, { threshold: [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1] })
    observer.observe(ref.current)
    return () => { observer.disconnect(); report(id, null) }
  }, [id, report, valid, failed])
  useEffect(() => {
    const target = ref.current
    const lost = (event: Event) => { event.preventDefault(); setFailed(true); report(id, null) }
    target?.addEventListener('webglcontextlost', lost, true)
    return () => target?.removeEventListener('webglcontextlost', lost, true)
  }, [id, report])
  const active = activeId === id && valid && !failed && parsed?.success && Renderer
  return <div ref={ref} role="img" aria-label={visual.alt} data-shader-slot={id} data-shader-active={active ? 'true' : 'false'} data-shader-visible={active && visibleId === id ? 'true' : 'false'} className="relative h-full w-full overflow-hidden" style={{ backgroundColor: '#151515' }}>
    {active && <ShaderBoundary key={`${visual.shader}:${visual.version}`} fallback={null} onFailure={() => { setFailed(true); report(id, null) }}><ShaderLayer visible={visibleId === id}><Renderer {...parsed.data} /></ShaderLayer></ShaderBoundary>}
  </div>
}
