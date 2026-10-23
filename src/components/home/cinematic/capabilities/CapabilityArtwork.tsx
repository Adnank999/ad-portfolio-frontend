import { useId } from 'react'
import type { CapabilityArtworkKind } from './capabilities'

const svgCoordinate = (value: number) => Number(value.toFixed(3))

function Diagram({ kind, metal, glass }: { kind: CapabilityArtworkKind; metal: string; glass: string }) {
  if (kind === 'interface') return <g transform="translate(240 186) rotate(-24) skewX(12)">
    {[2, 1, 0].map(layer => <g key={layer} transform={`translate(${layer * -18} ${layer * 23})`} opacity={1 - layer * .23}>
      <rect x="-128" y="-90" width="256" height="170" rx="12" fill={`url(#${glass})`} stroke={`url(#${metal})`} />
      <path d="M-128-54H128M-70-54V80" stroke="currentColor" strokeOpacity=".24" />
      <circle cx="-108" cy="-72" r="3" fill="var(--accent)" />
      <path d="M-53-23H96M-53-6H49M-107-29H-91M-107-8H-91M-107 13H-91" stroke="currentColor" strokeOpacity=".36" strokeWidth="3" strokeLinecap="round" />
      <rect x="-52" y="17" width="61" height="40" rx="5" fill="var(--accent)" fillOpacity=".22" stroke="var(--accent)" strokeOpacity=".7" />
      <rect x="23" y="17" width="73" height="40" rx="5" fill="currentColor" fillOpacity=".04" stroke="currentColor" strokeOpacity=".2" />
    </g>)}
  </g>

  if (kind === 'architecture' || kind === 'product') return <g transform="translate(240 185)">
    {[3, 2, 1, 0].map(layer => <g key={layer} transform={`translate(0 ${layer * 29 - 45})`}>
      <path d="M0-65 126-6 126 12 0 73-126 12-126-6Z" fill={`url(#${glass})`} stroke={`url(#${metal})`} />
      <path d="M-126-6 0 55 126-6M0 55V73" fill="none" stroke="currentColor" strokeOpacity=".25" />
      <path d="M-87-4 0-45 87-4 0 38Z" fill="none" stroke={layer === 0 ? 'var(--accent)' : 'currentColor'} strokeOpacity={layer === 0 ? '.9' : '.14'} />
      <circle cx="93" cy="12" r="2" fill="var(--accent)" />
    </g>)}
    {kind === 'product' && <path d="m-20-68 16 16 33-37" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />}
  </g>

  if (kind === 'connections') return <g transform="translate(240 190)">
    <ellipse rx="150" ry="98" fill="none" stroke="currentColor" strokeOpacity=".12" strokeDasharray="3 8" />
    {Array.from({ length: 6 }, (_, index) => {
      const angle = index * Math.PI / 3
      const horizontal = Math.cos(angle) * 143
      const vertical = Math.sin(angle) * 96
      return <g key={index}><path d={`M0 0Q${svgCoordinate(horizontal * .6)} ${svgCoordinate(vertical * .15)} ${svgCoordinate(horizontal)} ${svgCoordinate(vertical)}`} fill="none" stroke={`url(#${metal})`} /><rect x={svgCoordinate(horizontal - 20)} y={svgCoordinate(vertical - 20)} width="40" height="40" rx="10" fill={`url(#${glass})`} stroke="currentColor" strokeOpacity=".3" /><circle cx={svgCoordinate(horizontal)} cy={svgCoordinate(vertical)} r="4" fill="var(--accent)" /></g>
    })}
    <path d="M0-42 40-20 40 22 0 44-40 22-40-20Z" fill={`url(#${glass})`} stroke={`url(#${metal})`} />
    <path d="m-40-20 40 22 40-22M0 2V44" fill="none" stroke="var(--accent)" />
  </g>

  return <g transform={`translate(240 190) rotate(${kind === 'motion' ? -28 : -14})`}>
    {[0, 1, 2].map(layer => <ellipse key={layer} rx={147 - layer * 28} ry={104 - layer * 20} fill="none" stroke={`url(#${metal})`} strokeWidth={layer === 0 ? '14' : '5'} transform={kind === 'motion' ? `rotate(${layer * 56})` : undefined} />)}
    {Array.from({ length: 32 }, (_, index) => {
      const angle = index * Math.PI / 16
      return <path key={index} d={`M${svgCoordinate(Math.cos(angle) * 121)} ${svgCoordinate(Math.sin(angle) * 84)}L${svgCoordinate(Math.cos(angle) * 135)} ${svgCoordinate(Math.sin(angle) * 94)}`} stroke={index % 4 === 0 ? 'var(--accent)' : 'currentColor'} strokeOpacity={index % 4 === 0 ? '.9' : '.22'} strokeWidth="2" />
    })}
    <ellipse rx="63" ry="43" fill={`url(#${glass})`} stroke="var(--accent)" strokeOpacity=".75" />
    <ellipse rx="39" ry="27" fill="none" stroke="currentColor" strokeOpacity=".16" />
  </g>
}

export function CapabilityArtwork({ kind }: { kind: CapabilityArtworkKind }) {
  const identifier = useId().replaceAll(':', '')
  const metal = `capability-metal-${identifier}`
  const glass = `capability-glass-${identifier}`
  return <div className="capabilities-artwork" data-artwork={kind} aria-hidden="true">
    <svg viewBox="0 0 480 380" fill="none" focusable="false">
      <defs>
        <linearGradient id={metal} x1="68" y1="55" x2="375" y2="336" gradientUnits="userSpaceOnUse"><stop stopColor="var(--accent)" /><stop offset=".3" stopColor="#faf9f6" stopOpacity=".8" /><stop offset=".52" stopColor="#77747b" stopOpacity=".25" /><stop offset=".72" stopColor="var(--accent)" stopOpacity=".8" /><stop offset="1" stopColor="#faf9f6" stopOpacity=".45" /></linearGradient>
        <linearGradient id={glass} x1="-100" y1="-80" x2="125" y2="110" gradientUnits="userSpaceOnUse"><stop stopColor="#2c252b" /><stop offset=".45" stopColor="#19171b" stopOpacity=".94" /><stop offset="1" stopColor="var(--accent)" stopOpacity=".15" /></linearGradient>
      </defs>
      <path d="M30 94V30H94M386 30H450V94M450 286V350H386M94 350H30V286" stroke="currentColor" strokeOpacity=".1" />
      <path d="M80 190H400M240 62V318" stroke="currentColor" strokeOpacity=".08" strokeDasharray="3 9" />
      <g className="capabilities-artwork-object"><Diagram kind={kind} metal={metal} glass={glass} /></g>
      <circle cx="30" cy="190" r="2" fill="var(--accent)" /><circle cx="450" cy="190" r="2" fill="var(--accent)" />
    </svg>
  </div>
}
