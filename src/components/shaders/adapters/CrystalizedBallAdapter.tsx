import CrystalizedBall from '../react-bits/CrystalizedBall'
import { definition } from '../definitions/crystalized-ball'
import type { JsonObject } from '@/server/portfolio-content'

export default function CrystalizedBallAdapter(props: JsonObject) {
  return <CrystalizedBall {...definition.schema.parse(props)} />
}
