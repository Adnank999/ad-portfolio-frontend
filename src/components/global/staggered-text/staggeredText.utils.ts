import type { Target, TargetAndTransition } from 'framer-motion'

export type SegmentBy = 'chars' | 'words' | 'lines'
export type StaggerDirection = 'forward' | 'reverse' | 'center'
export type TextSegment = { text: string; index: number }
export type TextGroup = { text: string; segments: TextSegment[] }

export function segmentText(text: string, segmentBy: SegmentBy, separator?: string) {
  const lines = text.split(separator || '\n')
  let count = 0
  const graphemes = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null
  const rows = lines.map(line => {
    if (segmentBy === 'lines') return [{ text: line, segments: [{ text: line || '\u00a0', index: count++ }] }]
    return (line.match(/\S+|\s+/g) ?? []).map(word => {
      if (/^\s+$/.test(word)) return { text: word, segments: [] }
      const parts = segmentBy === 'words' ? [word] : graphemes ? Array.from(graphemes.segment(word), part => part.segment) : Array.from(word)
      return { text: word, segments: parts.map(part => ({ text: part, index: count++ })) }
    })
  })
  return { rows, count, accessibleText: lines.join('\n') }
}

export function staggerOrder(index: number, count: number, direction: StaggerDirection) {
  if (direction === 'reverse') return count - index - 1
  if (direction === 'center') return Math.abs(index - (count - 1) / 2) - (count % 2 === 0 ? .5 : 0)
  return index
}

export function buildTextKeyframes(from: Target, steps: Target[]): TargetAndTransition {
  const keys = new Set([...Object.keys(from), ...steps.flatMap(step => Object.keys(step))] as (keyof Target)[])
  return Object.fromEntries([...keys].map(key => {
    let previous = from[key] ?? steps.find(step => step[key] !== undefined)?.[key]
    return [key, [previous, ...steps.map(step => {
      previous = step[key] ?? previous
      return previous
    })]]
  })) as TargetAndTransition
}

export function reverseTextKeyframes(keyframes: TargetAndTransition): TargetAndTransition {
  return Object.fromEntries(Object.entries(keyframes).map(([key, value]) => [key, Array.isArray(value) ? [...value].reverse() : value])) as TargetAndTransition
}
