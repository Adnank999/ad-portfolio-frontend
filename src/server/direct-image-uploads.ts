import { PortfolioApiError, portfolioApi } from './portfolio-api'
import type { Account } from './portfolio-auth'

async function readMetadata(request: Request): Promise<Record<string, unknown>> {
  if (!request.body) throw new PortfolioApiError(400, 'Missing image metadata')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > 4096) { await reader.cancel(); throw new PortfolioApiError(413, 'Image metadata is too large') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  const data: unknown = JSON.parse(new TextDecoder().decode(bytes))
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new PortfolioApiError(400, 'Invalid image metadata')
  return data as Record<string, unknown>
}

export async function directImageMetadata(request: Request, api: typeof portfolioApi = portfolioApi): Promise<Response> {
  const origin = process.env.APP_ORIGIN ?? new URL(request.url).origin
  if (request.headers.get('origin') !== origin) return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  try {
    const { action, uploadId, ...metadata } = await readMetadata(request)
    const enabled = process.env.ADMIN_DIRECT_R2_UPLOAD === 'true'
    if (action === 'policy' && !enabled) {
      const actor = await api<Account>('/api/v1/auth/me', { authenticated: true })
      if (!actor.permissions.some(permission => ['blogs:write', 'projects:write', 'case-studies:write', 'services:write'].includes(permission))) throw new PortfolioApiError(403, 'Image upload is not permitted')
      return Response.json({ enabled: false }, { headers: { 'cache-control': 'no-store' } })
    }
    if (!enabled) throw new PortfolioApiError(503, 'Direct image uploads are not enabled')
    let path: string
    let method: 'GET' | 'POST' | 'DELETE' = 'POST'
    if (action === 'policy') { path = '/api/v1/admin/uploads/policy'; method = 'GET' }
    else if (action === 'presign') path = '/api/v1/admin/uploads/presign'
    else if (action === 'complete' || action === 'abandon') {
      if (typeof uploadId !== 'string' || !/^[a-f0-9-]{36}$/i.test(uploadId)) throw new PortfolioApiError(400, 'Invalid upload ID')
      path = `/api/v1/admin/uploads/${uploadId}${action === 'complete' ? '/complete' : ''}`
      if (action === 'abandon') method = 'DELETE'
    } else throw new PortfolioApiError(400, 'Invalid image action')
    const result = await api<unknown>(path, { method, authenticated: true, body: action === 'presign' ? metadata : method === 'POST' ? {} : undefined, timeoutMs: 28_000, signal: request.signal })
    if (action === 'policy' && (!result || typeof result !== 'object' || !('enabled' in result) || result.enabled !== true)) throw new PortfolioApiError(503, 'Direct image uploads are not enabled on the backend')
    return Response.json(result ?? { abandoned: true }, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: 'Invalid image metadata JSON' }, { status: 400 })
    if (error instanceof PortfolioApiError) return Response.json({ error: error.message }, { status: error.status, headers: { 'cache-control': 'no-store' } })
    return Response.json({ error: 'Image metadata request failed. Retry completion if the image was uploaded.' }, { status: 502 })
  }
}
