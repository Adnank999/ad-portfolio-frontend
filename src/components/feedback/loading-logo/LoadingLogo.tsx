import { useEffect, useRef, useSyncExternalStore } from 'react'
import { getLoadingLogoPoster, getServerLoadingLogoPoster, subscribeLoadingLogoPoster } from './poster'
import { loaderModelUrl } from './model-url'

const sparks = Array.from({ length: 18 }, (_, index) => ({
  left: `${8 + ((index * 37) % 86)}%`,
  top: `${5 + ((index * 53) % 88)}%`,
  animationDelay: `${-(index % 7) * 0.65}s`,
  animationDuration: `${3 + (index % 4)}s`,
}))

export function LoadingLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poster = useSyncExternalStore(subscribeLoadingLogoPoster, getLoadingLogoPoster, getServerLoadingLogoPoster)

  useEffect(() => {
    if (!('WebGLRenderingContext' in window)) return
    let cancelled = false
    let renderer: { dispose: () => void } | null = null
    void import('./renderer').then(({ createLoadingLogoRenderer }) => {
      if (!cancelled && canvasRef.current) renderer = createLoadingLogoRenderer(canvasRef.current, loaderModelUrl)
    }).catch(() => {})
    return () => {
      cancelled = true
      renderer?.dispose()
    }
  }, [])

  return <div className="loading-logo" aria-hidden="true">
    <div className="loading-logo-aura" />
    <div className="loading-logo-sparks">{sparks.map((style, index) => <i key={index} style={style} />)}</div>
    <div className="loading-logo-model" data-has-poster={Boolean(poster)}>
      {poster && <img className="loading-logo-poster" src={poster} alt="" decoding="sync" />}
      <canvas ref={canvasRef} width={1} height={1} />
      <svg className="loading-logo-fallback" viewBox="0 0 320 320" fill="none" focusable="false">
        <circle cx="160" cy="160" r="131" stroke="#c21e5640" />
        <circle className="loading-logo-ring-highlight" cx="160" cy="160" r="131" pathLength="1" stroke="#ff82b1" strokeWidth="2" strokeDasharray=".16 .34" transform="rotate(-82 160 160)" />
      </svg>
    </div>
    <div className="loading-logo-reflection" />
  </div>
}
