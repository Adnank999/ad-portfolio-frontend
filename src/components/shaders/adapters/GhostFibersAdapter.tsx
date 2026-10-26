import GhostFibers from '../react-bits/GhostFibers'
import { definition } from '../definitions/ghost-fibers'
import type { JsonObject } from '@/server/portfolio-content'

export default function GhostFibersAdapter(props: JsonObject) {
  return <GhostFibers {...definition.schema.parse(props)} dpr={1.25} />
}
