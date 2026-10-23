export function prefersLightweightGraphics() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return !!connection?.saveData || connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g'
}

export function scheduleAfterPageLoad(callback: () => void, { delay = 0, timeout = 1500 } = {}) {
  let cancelled = false
  let frame: number | undefined
  let timer: number | undefined
  let idle: number | undefined
  const run = () => { if (!cancelled) callback() }
  const schedule = () => {
    if (cancelled) return
    frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => {
        timer = window.setTimeout(() => {
          if (cancelled) return
          if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(run, { timeout })
          else timer = window.setTimeout(run, 0)
        }, delay)
      })
    })
  }
  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })
  return () => {
    cancelled = true
    window.removeEventListener('load', schedule)
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    if (timer !== undefined) window.clearTimeout(timer)
    if (idle !== undefined) window.cancelIdleCallback(idle)
  }
}
