import { getPublishedShader } from './registry'
import { serviceVisualSlots, type ServiceVisuals } from './types'

function imageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > 2048 || /[\u0000-\u0020\\]/.test(value)) return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
}

export function assertServiceVisuals(value: unknown): asserts value is ServiceVisuals {
  if (value == null) return
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid service visuals')
  for (const [slot, visual] of Object.entries(value)) {
    if (!serviceVisualSlots.includes(slot as typeof serviceVisualSlots[number]) || !visual || typeof visual !== 'object' || Array.isArray(visual)) throw new Error('Invalid service visual slot')
    if (typeof visual.alt !== 'string' || !visual.alt.trim() || visual.alt.length > 500) throw new Error(`${slot}: describe the image or shader`)
    if (visual.type === 'image') {
      if (Object.keys(visual).some(key => !['type', 'src', 'alt'].includes(key)) || !imageUrl(visual.src)) throw new Error(`${slot}: choose an uploaded image`)
    } else if (visual.type === 'shader') {
      const definition = getPublishedShader(visual.shader)
      if (!definition || visual.version !== definition.version) throw new Error(`${slot}: unsupported shader or version`)
      if (Object.keys(visual).some(key => !['type', 'shader', 'version', 'props', 'poster', 'alt'].includes(key)) || !definition.schema.safeParse(visual.props).success) throw new Error(`${slot}: invalid shader settings`)
      if (visual.poster !== undefined && visual.poster !== '' && !imageUrl(visual.poster)) throw new Error(`${slot}: invalid legacy poster image`)
    } else throw new Error(`${slot}: choose an image or shader`)
  }
}
