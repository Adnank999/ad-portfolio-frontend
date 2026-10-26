import SoftAurora from '../react-bits/SoftAurora'
import { definition } from '../definitions/soft-aurora'
import type { JsonObject } from '@/server/portfolio-content'

export default function SoftAuroraAdapter(props: JsonObject) {
  return <SoftAurora {...definition.schema.parse(props)} />
}
