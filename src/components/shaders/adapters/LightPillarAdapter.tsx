import LightPillar from '../react-bits/LightPillar'
import { definition } from '../definitions/light-pillar'
import type { JsonObject } from '@/server/portfolio-content'

export default function LightPillarAdapter(props: JsonObject) {
  return <LightPillar {...definition.schema.parse(props)} quality="medium" mixBlendMode="normal" />
}
