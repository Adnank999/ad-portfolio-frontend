import LightTunnel from '../react-bits/LightTunnel'
import { definition } from '../definitions/light-tunnel'
import type { JsonObject } from '@/server/portfolio-content'

export default function LightTunnelAdapter(props: JsonObject) {
  return <LightTunnel {...definition.schema.parse(props)} dpr={1.25} />
}
