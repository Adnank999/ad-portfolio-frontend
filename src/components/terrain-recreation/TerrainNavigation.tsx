import { Link } from '@tanstack/react-router'
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react'
import { useRef } from 'react'

export type TerrainAudioState = { enabled: boolean; status: 'on' | 'off' | 'blocked' }

export function TerrainNavigation({ projectSlug, audio, ready, onToggleSound }: {
  projectSlug: string | null
  audio: TerrainAudioState
  ready: boolean
  onToggleSound: (enabled: boolean) => void
}) {
  const playing = audio.enabled && audio.status === 'on'
  const SoundIcon = playing ? Volume2 : VolumeX
  const soundLabel = playing ? 'Turn sound off' : 'Turn sound on'
  const soundIntent = useRef<boolean | null>(null)

  return <header className="site-header">
    <nav className="terrain-back-nav" aria-label="Project navigation">
      <Link to={projectSlug ? '/projects' : '/'} className="terrain-back-button" aria-label={projectSlug ? 'Back to projects' : 'Back to home'} viewTransition={false}>
        <ArrowLeft size={15} aria-hidden="true" />Back
      </Link>
    </nav>
    <div className="header-actions">
      <button type="button" className="sound-toggle" data-sound-toggle aria-label={soundLabel} aria-pressed={playing}
        title={audio.enabled && audio.status === 'blocked' ? 'Your browser requires a click to enable sound' : soundLabel}
        disabled={!ready}
        onPointerDown={() => { soundIntent.current = !playing }}
        onPointerCancel={() => { soundIntent.current = null }}
        onBlur={() => { soundIntent.current = null }}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') soundIntent.current = !playing }}
        onClick={() => { const enabled = soundIntent.current ?? !playing; soundIntent.current = null; onToggleSound(enabled) }}>
        <SoundIcon aria-hidden="true" /><span>{playing ? 'Sound on' : audio.enabled && audio.status === 'blocked' ? 'Enable sound' : 'Sound off'}</span>
      </button>
    </div>
  </header>
}
