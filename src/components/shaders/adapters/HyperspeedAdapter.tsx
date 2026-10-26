import Hyperspeed from '../react-bits/Hyperspeed'
import { definition } from '../definitions/hyperspeed'
import type { JsonObject } from '@/server/portfolio-content'

export default function HyperspeedAdapter(props: JsonObject) {
  const { roadReflections, ...settings } = definition.schema.parse(props)
  return <Hyperspeed {...settings} reflections={roadReflections} />
}
