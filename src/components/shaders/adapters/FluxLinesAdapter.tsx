import FluxLines from '../react-bits/FluxLines'
import { definition } from '../definitions/flux-lines'
import type { JsonObject } from '@/server/portfolio-content'

export default function FluxLinesAdapter(props: JsonObject) {
  return <FluxLines {...definition.schema.parse(props)} dpr={1.25} />
}
