import { useId } from 'react'
import './loading-logo.css'

const arch = 'M185 323 248 177 Q259 148 270 177 L335 323'

export function LoadingLogo() {
  const identifier = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const gradient = `loading-gradient-${identifier}`
  const bloom = `loading-bloom-${identifier}`
  const dot = `loading-dot-${identifier}`
  const grain = `loading-grain-${identifier}`

  return <div className="loading-logo" aria-hidden="true">
    <svg className="loading-logo-artwork" viewBox="0 0 520 520" fill="none" focusable="false">
      <defs>
        <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1="185" y1="150" x2="335" y2="323">
          <stop offset="0" stopColor="var(--loader-light)" />
          <stop offset=".55" stopColor="var(--loader-accent)" />
          <stop offset="1" stopColor="var(--loader-light)" />
        </linearGradient>
        <filter id={bloom} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="12" /></filter>
        <filter id={dot} x="-500%" y="-500%" width="1100%" height="1100%"><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id={grain} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="7" stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" result="monochrome" />
          <feComponentTransfer in="monochrome" result="texture"><feFuncA type="linear" slope=".45" /></feComponentTransfer>
          <feBlend in="SourceGraphic" in2="texture" mode="soft-light" result="textured" />
          <feComposite in="textured" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <g className="loading-logo-guides">
        <circle cx="260" cy="260" r="176" />
        <circle cx="260" cy="260" r="205" strokeDasharray="1 17" />
        <circle cx="260" cy="260" r="138" strokeDasharray="2 11" opacity=".6" />
        <path d="M260 35v23 M260 462v23 M35 260h23 M462 260h23" />
      </g>
      <g className="loading-logo-orbit">
        <circle cx="260" cy="260" r="176" className="loading-logo-orbit-stroke" strokeDasharray="230 875" transform="rotate(-38 260 260)" />
        <circle cx="260" cy="260" r="176" className="loading-logo-orbit-stroke loading-logo-dim" strokeDasharray="95 1010" transform="rotate(148 260 260)" />
        <circle cx="260" cy="84" r="3" className="loading-logo-dot" filter={`url(#${dot})`} />
      </g>
      <g className="loading-logo-orbit loading-logo-orbit-reverse">
        <circle cx="260" cy="260" r="205" className="loading-logo-orbit-stroke loading-logo-dim" strokeDasharray="185 1103" transform="rotate(50 260 260)" />
        <circle cx="260" cy="260" r="205" className="loading-logo-orbit-stroke" strokeDasharray="55 1233" transform="rotate(235 260 260)" />
        <circle cx="260" cy="55" r="2" className="loading-logo-dot" filter={`url(#${dot})`} />
      </g>
      <g>
        <path className="loading-logo-echo" pathLength="100" d="M141 320 244 112 Q259 83 273 112 L378 320" />
        <path className="loading-logo-echo loading-logo-second" pathLength="100" d="M168 347h-34 M350 347h34" />
        <g className="loading-logo-bloom" filter={`url(#${bloom})`}><path d={arch} /></g>
        <g className="loading-logo-grained" filter={`url(#${grain})`}>
          <g stroke={`url(#${gradient})`}><path className="loading-logo-mark" pathLength="100" d={arch} /></g>
          <path className="loading-logo-beam" pathLength="100" d={arch} />
        </g>
        <path className="loading-logo-echo loading-logo-third" pathLength="100" d="M157 352h52 M309 352h54" />
      </g>
      <g filter={`url(#${dot})`}><circle cx="146" cy="320" r="2.6" className="loading-logo-spark" /><circle cx="376" cy="320" r="2" className="loading-logo-spark loading-logo-second" /><circle cx="260" cy="113" r="2" className="loading-logo-spark loading-logo-third" /></g>
      <text className="loading-logo-hud" x="17" y="253">01</text><text className="loading-logo-hud" x="458" y="253">∞</text>
    </svg>
  </div>
}
