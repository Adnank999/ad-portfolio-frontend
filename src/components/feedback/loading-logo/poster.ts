let poster: string | undefined
const listeners = new Set<() => void>()

export const getLoadingLogoPoster = () => poster
export const getServerLoadingLogoPoster = () => undefined

export function subscribeLoadingLogoPoster(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function cacheLoadingLogoPoster(image: string) {
  if (poster) return
  poster = image
  listeners.forEach(listener => listener())
}
