export function selectActiveShader(ratios: Record<string, number>, current: string | null) {
  const ranked = Object.entries(ratios).filter(([, ratio]) => ratio >= 0.2).sort(([leftId, left], [rightId, right]) => right - left || leftId.localeCompare(rightId))
  const best = ranked[0]
  if (!best) return null
  if (current && (ratios[current] ?? 0) >= 0.2 && best[1] < ratios[current] + 0.12) return current
  return best[0]
}
