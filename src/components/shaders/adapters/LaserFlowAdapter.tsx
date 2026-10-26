import LaserFlow from '../react-bits/LaserFlow'
import { definition } from '../definitions/laser-flow'
import type { JsonObject } from '@/server/portfolio-content'

export default function LaserFlowAdapter(props: JsonObject) {
  return <LaserFlow {...definition.schema.parse(props)} dpr={1.25} />
}
