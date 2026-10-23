import { useEffect, useState, useSyncExternalStore } from 'react'

const reducedQuery = '(prefers-reduced-motion: reduce)'
const compactQuery = '(max-width: 900px)'
const shortQuery = '(max-height: 600px), (max-width: 600px) and (max-height: 780px)'

function subscribeMedia(callback: () => void) {
  const reduced = window.matchMedia(reducedQuery)
  const compact = window.matchMedia(compactQuery)
  const short = window.matchMedia(shortQuery)
  reduced.addEventListener('change', callback)
  compact.addEventListener('change', callback)
  short.addEventListener('change', callback)
  return () => {
    reduced.removeEventListener('change', callback)
    compact.removeEventListener('change', callback)
    short.removeEventListener('change', callback)
  }
}

export function useHomeMedia() {
  const flags = useSyncExternalStore(subscribeMedia, () => `${window.matchMedia(reducedQuery).matches},${window.matchMedia(compactQuery).matches},${window.matchMedia(shortQuery).matches}`, () => 'false,true,false')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [reduced, compact, short] = flags.split(',')
  return { reducedMotion: reduced === 'true', compact: compact === 'true', shortViewport: short === 'true', mounted }
}
