export type Point = { x: number; y: number }
export type TextBounds = { left: number; top: number; width: number; height: number }
export type GlassShard = {
  points: [Point, Point, Point]
  center: Point
  bounds: TextBounds
  seed: number
}

export function seededNoise(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

export function createGlassShards(source: HTMLCanvasElement, bounds: TextBounds, fontSize: number, shardSize: number, irregularity: number, pixelRatio: number): GlassShard[] {
  const context = source.getContext('2d')
  if (!context) return []
  const pixels = context.getImageData(0, 0, source.width, source.height).data
  const spacing = Math.max(8, fontSize * shardSize, Math.sqrt(bounds.width * bounds.height / 1200))
  const columns = Math.ceil(bounds.width / spacing)
  const rows = Math.ceil(bounds.height / spacing)
  const vertices = Array.from({ length: rows + 1 }, (_, row) => Array.from({ length: columns + 1 }, (_, column) => {
    const seed = row * (columns + 1) + column
    return {
      x: bounds.left + column / columns * bounds.width + (column > 0 && column < columns ? (seededNoise(seed) - .5) * spacing * irregularity : 0),
      y: bounds.top + row / rows * bounds.height + (row > 0 && row < rows ? (seededNoise(seed + 4000) - .5) * spacing * irregularity : 0),
    }
  }))
  const shards: GlassShard[] = []
  const add = (points: [Point, Point, Point]) => {
    const left = Math.min(...points.map(point => point.x))
    const top = Math.min(...points.map(point => point.y))
    const width = Math.max(...points.map(point => point.x)) - left
    const height = Math.max(...points.map(point => point.y)) - top
    const hasInk = Array.from({ length: 28 }, (_, sample) => {
      const fraction = seededNoise(sample + 800)
      const second = seededNoise(sample + 1600) * (1 - fraction)
      const x = Math.floor((points[0].x * fraction + points[1].x * second + points[2].x * (1 - fraction - second)) * pixelRatio)
      const y = Math.floor((points[0].y * fraction + points[1].y * second + points[2].y * (1 - fraction - second)) * pixelRatio)
      return pixels[(y * source.width + x) * 4 + 3] > 12
    }).some(Boolean)
    if (!hasInk) return
    shards.push({ points, center: { x: points.reduce((sum, point) => sum + point.x, 0) / 3, y: points.reduce((sum, point) => sum + point.y, 0) / 3 }, bounds: { left, top, width, height }, seed: seededNoise(shards.length + 100) })
  }
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const topLeft = vertices[row][column]
      const topRight = vertices[row][column + 1]
      const bottomLeft = vertices[row + 1][column]
      const bottomRight = vertices[row + 1][column + 1]
      if ((row + column) % 2) { add([topLeft, topRight, bottomLeft]); add([topRight, bottomRight, bottomLeft]) }
      else { add([topLeft, topRight, bottomRight]); add([topLeft, bottomRight, bottomLeft]) }
    }
  }
  return shards
}
