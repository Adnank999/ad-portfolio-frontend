import WebThreads from '../react-bits/WebThreads'
import { definition } from '../definitions/web-threads'
import type { JsonObject } from '@/server/portfolio-content'

export default function WebThreadsAdapter(props: JsonObject) {
  return <WebThreads {...definition.schema.parse(props)} dpr={1.25} />
}
