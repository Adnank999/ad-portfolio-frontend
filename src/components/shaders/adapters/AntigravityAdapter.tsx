import Antigravity from '../react-bits/Antigravity'
import { definition } from '../definitions/antigravity'
import type { JsonObject } from '@/server/portfolio-content'

export default function AntigravityAdapter(props: JsonObject) {
  return <Antigravity {...definition.schema.parse(props)} maxDevicePixelRatio={1.25} />
}
