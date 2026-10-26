import DitherVeil from '../react-bits/DitherVeil'
import { definition } from '../definitions/dither-veil'
import type { JsonObject } from '@/server/portfolio-content'

const veilTexture = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><radialGradient id="glow"><stop stop-color="#fce6ec"/><stop offset=".5" stop-color="#c21e56"/><stop offset="1" stop-color="#151515"/></radialGradient></defs><rect width="512" height="512" fill="url(#glow)"/><circle cx="256" cy="256" r="150" fill="none" stroke="#fce6ec" stroke-width="10"/></svg>')

export default function DitherVeilAdapter(props: JsonObject) {
  return <DitherVeil {...definition.schema.parse(props)} src={veilTexture} />
}
