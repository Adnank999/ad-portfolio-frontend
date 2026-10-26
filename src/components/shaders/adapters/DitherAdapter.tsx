import Dither from '../react-bits/Dither'
import { definition } from '../definitions/dither'
import type { JsonObject } from '@/server/portfolio-content'

export default function DitherAdapter(props: JsonObject) {
  return <Dither {...definition.schema.parse(props)} dpr={1.25} />
}
