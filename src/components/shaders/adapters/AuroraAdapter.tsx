import Aurora from '../react-bits/Aurora'
import { definition } from '../definitions/aurora'
import type { JsonObject } from '@/server/portfolio-content'

export default function AuroraAdapter(props: JsonObject) {
  return <Aurora {...definition.schema.parse(props)} dpr={1.25} />
}
