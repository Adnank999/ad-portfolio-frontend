import PrismaticBurst from '../react-bits/PrismaticBurst'
import { definition } from '../definitions/prismatic-burst'
import type { JsonObject } from '@/server/portfolio-content'

export default function PrismaticBurstAdapter(props: JsonObject) {
  return <PrismaticBurst {...definition.schema.parse(props)} dpr={1.25} quality="medium" />
}
