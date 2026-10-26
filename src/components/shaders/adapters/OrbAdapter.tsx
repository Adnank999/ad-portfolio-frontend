import Orb from '../../Orb'
import { definition } from '../definitions/orb'
import type { JsonObject } from '@/server/portfolio-content'

export default function OrbAdapter(props: JsonObject) {
  return <Orb {...definition.schema.parse(props)} dpr={1.5} />
}
