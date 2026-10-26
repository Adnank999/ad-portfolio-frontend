import Lightfall from '../react-bits/Lightfall'
import { definition } from '../definitions/lightfall'
import type { JsonObject } from '@/server/portfolio-content'

export default function LightfallAdapter(props: JsonObject) {
  return <Lightfall {...definition.schema.parse(props)} dpr={1.25} />
}
