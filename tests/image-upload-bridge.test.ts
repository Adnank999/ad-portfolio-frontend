import { describe, expect, mock, test } from 'bun:test'
import { directImageMetadata } from '../src/server/direct-image-uploads'
import type { portfolioApi } from '../src/server/portfolio-api'

function request(data: unknown, origin?: string) {
  const base = process.env.APP_ORIGIN ?? 'http://localhost:3000'
  return new Request(new URL('/api/admin/media', base), { method: 'POST', headers: { origin: origin ?? base, 'content-type': 'application/json' }, body: JSON.stringify(data) })
}

describe('private API image metadata bridge', () => {
  test('blocks cross-origin signing before contacting the backend', async () => {
    const api = mock(async () => ({ enabled: true }))
    const response = await directImageMetadata(request({ action: 'presign' }, 'https://attacker.test'), api as typeof portfolioApi)
    expect(response.status).toBe(403)
    expect(api).not.toHaveBeenCalled()
  })

  test('fails closed rather than posting image bytes when frontend direct mode is enabled but Rust is disabled', async () => {
    const previous = process.env.ADMIN_DIRECT_R2_UPLOAD
    process.env.ADMIN_DIRECT_R2_UPLOAD = 'true'
    try {
      const api = mock(async () => ({ enabled: false }))
      const response = await directImageMetadata(request({ action: 'policy' }), api as typeof portfolioApi)
      expect(response.status).toBe(503)
      expect((await response.json()).error).toContain('backend')
    } finally {
      if (previous === undefined) delete process.env.ADMIN_DIRECT_R2_UPLOAD
      else process.env.ADMIN_DIRECT_R2_UPLOAD = previous
    }
  })

  test('forwards small metadata through the established authenticated API client and rejects oversized metadata', async () => {
    const previous = process.env.ADMIN_DIRECT_R2_UPLOAD
    process.env.ADMIN_DIRECT_R2_UPLOAD = 'true'
    try {
      const api = mock(async () => ({ uploadId: 'id' }))
      const metadata = { purpose: 'project_cover', contentType: 'image/webp', sizeBytes: 400, width: 1920, height: 1080, originalName: 'image.png' }
      const response = await directImageMetadata(request({ action: 'presign', ...metadata }), api as typeof portfolioApi)
      expect(response.status).toBe(200)
      expect(api.mock.calls[0]).toEqual(['/api/v1/admin/uploads/presign', expect.objectContaining({ authenticated: true, method: 'POST', body: metadata })])
      const oversized = await directImageMetadata(request({ action: 'presign', padding: 'x'.repeat(5000) }), api as typeof portfolioApi)
      expect(oversized.status).toBe(413)
      expect(api).toHaveBeenCalledTimes(1)
    } finally {
      if (previous === undefined) delete process.env.ADMIN_DIRECT_R2_UPLOAD
      else process.env.ADMIN_DIRECT_R2_UPLOAD = previous
    }
  })
})
