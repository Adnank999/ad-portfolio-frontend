import LetterGlitch from '../react-bits/LetterGlitch'
import { definition } from '../definitions/letter-glitch'
import type { JsonObject } from '@/server/portfolio-content'

export default function LetterGlitchAdapter(props: JsonObject) {
  return <LetterGlitch {...definition.schema.parse(props)} dpr={1.25} fontFamily="ui-monospace, monospace" />
}
