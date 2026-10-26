import Grainient from '../react-bits/Grainient'
import { definition } from '../definitions/grainient'
import type { JsonObject } from '@/server/portfolio-content'

export default function GrainientAdapter(props: JsonObject) {
  return <Grainient {...definition.schema.parse(props)} dpr={1.25} />
}
