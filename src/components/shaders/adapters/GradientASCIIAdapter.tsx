import GradientASCII from '../react-bits/GradientASCII'
import { definition } from '../definitions/gradient-ascii'
import type { JsonObject } from '@/server/portfolio-content'

export default function GradientASCIIAdapter(props: JsonObject) {
  return <GradientASCII {...definition.schema.parse(props)} dpr={1.25} />
}
