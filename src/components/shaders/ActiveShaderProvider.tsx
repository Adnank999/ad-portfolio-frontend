import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { selectActiveShader } from './active-shader-policy'
import { SHADER_RELEASE_DELAY_MS } from './shader-transition'

type State = { ratios: Record<string, number>; active: string | null }
const Context = createContext<{ activeId: string | null; visibleId: string | null; report: (id: string, ratio: number | null) => void } | null>(null)

export function ActiveShaderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer((previous: State, action: { id: string; ratio: number | null }): State => {
    if (previous.ratios[action.id] === action.ratio || (action.ratio === null && !(action.id in previous.ratios))) return previous
    const ratios = { ...previous.ratios }
    if (action.ratio === null) delete ratios[action.id]
    else ratios[action.id] = Math.min(1, Math.max(0, action.ratio))
    return { ratios, active: selectActiveShader(ratios, previous.active) }
  }, { ratios: {}, active: null })
  const [allowed, setAllowed] = useState(false)
  const [capable, setCapable] = useState<boolean | null>(null)
  const [mountedId, setMountedId] = useState<string | null>(null)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setAllowed(!query.matches && !document.hidden)
    update()
    query.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    return () => { query.removeEventListener('change', update); document.removeEventListener('visibilitychange', update) }
  }, [])
  useEffect(() => {
    if (!allowed || !state.active || capable !== null) return
    try {
      const context = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true })
      setCapable(!!context)
      context?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch { setCapable(false) }
  }, [allowed, state.active, capable])
  useEffect(() => {
    if (!allowed || !capable) { setMountedId(null); return }
    if (mountedId === null) { setMountedId(state.active); return }
    if (mountedId === state.active) return
    const timer = setTimeout(() => setMountedId(null), SHADER_RELEASE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [allowed, capable, mountedId, state.active])
  const report = useCallback((id: string, ratio: number | null) => dispatch({ id, ratio }), [])
  const value = useMemo(() => ({ activeId: allowed && capable ? mountedId : null, visibleId: allowed && capable ? state.active : null, report }), [allowed, capable, mountedId, state.active, report])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useActiveShader() {
  const context = useContext(Context)
  if (!context) throw new Error('Shader slots need ActiveShaderProvider')
  return context
}
