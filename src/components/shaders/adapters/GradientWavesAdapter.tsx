import GradientWaves from '../react-bits/GradientWaves'
import { definition } from '../definitions/gradient-waves'
import type { JsonObject } from '@/server/portfolio-content'

export default function GradientWavesAdapter(props: JsonObject) {
  return <GradientWaves {...definition.schema.parse(props)} dpr={1.25} quality="medium" />
}
