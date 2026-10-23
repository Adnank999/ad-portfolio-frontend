import { useSyncExternalStore } from 'react'

const reducedQuery = '(prefers-reduced-motion: reduce)'
const compactQuery = '(max-width: 800px)'

function subscribe(callback: () => void) {
  const queries = [window.matchMedia(reducedQuery), window.matchMedia(compactQuery)]
  queries.forEach(query => query.addEventListener('change', callback))
  return () => queries.forEach(query => query.removeEventListener('change', callback))
}

export function useAboutMedia() {
  const media = useSyncExternalStore(subscribe, () => `${window.matchMedia(reducedQuery).matches},${window.matchMedia(compactQuery).matches}`, () => 'true,true')
  return { reducedMotion: media.startsWith('true'), compact: media.endsWith('true') }
}
