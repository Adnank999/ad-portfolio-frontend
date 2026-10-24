import { randomUUID } from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { portfolioApi } from './portfolio-api'
import type { Account } from './portfolio-auth'

const maxImageBytes = 8 * 1024 * 1024
const maxVideoBytes = 64 * 1024 * 1024
const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

export function validMedia(bytes: Uint8Array, type: string) {
  if (type === 'video/mp4') return bytes.length >= 16 && new TextDecoder().decode(bytes.subarray(4, 8)) === 'ftyp' && /^(isom|iso[2-9]|mp4[12]|avc1|M4V |dash|MSNV)$/.test(new TextDecoder().decode(bytes.subarray(8, 12)))
  if (type === 'video/webm') return bytes.length >= 8 && bytes.subarray(0, 4).every((value, index) => value === [0x1a, 0x45, 0xdf, 0xa3][index]) && new TextDecoder().decode(bytes.subarray(0, 4096)).includes('webm')
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === 'image/png') return bytes.length >= 8 && bytes.subarray(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index])
  if (type === 'image/gif') return new TextDecoder().decode(bytes.subarray(0, 6)) === 'GIF87a' || new TextDecoder().decode(bytes.subarray(0, 6)) === 'GIF89a'
  if (type === 'image/webp') return new TextDecoder().decode(bytes.subarray(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.subarray(8, 12)) === 'WEBP'
  if (type === 'image/avif') return new TextDecoder().decode(bytes.subarray(4, 12)) === 'ftypavif' || new TextDecoder().decode(bytes.subarray(4, 12)) === 'ftypavis'
  return false
}

async function readLimited(request: Request, maximum: number) {
  if (!request.body) throw new Error('Image is empty')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maximum) { await reader.cancel(); throw new Error(`Media must be ${maximum / 1024 / 1024} MB or smaller`) }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  if (length === 0) throw new Error('Image is empty')
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

export async function uploadMedia(request: Request): Promise<Response> {
  const expectedOrigin = process.env.APP_ORIGIN ?? new URL(request.url).origin
  if (request.headers.get('origin') !== expectedOrigin) return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  let account: Account
  try {
    account = await portfolioApi<Account>('/api/v1/auth/me', { authenticated: true })
  } catch {
    return Response.json({ error: 'Sign in to upload media' }, { status: 401 })
  }
  if (!account.permissions.some((permission) => ['blogs:write', 'projects:write', 'case-studies:write', 'services:write'].includes(permission))) {
    return Response.json({ error: 'Image upload is not permitted' }, { status: 403 })
  }
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.startsWith('image/') && process.env.ADMIN_DIRECT_R2_UPLOAD === 'true') return Response.json({ error: 'Prepare WebP and use the direct R2 image-upload flow' }, { status: 415 })
  const video = contentType.startsWith('video/')
  if (video && !account.permissions.includes('services:write')) return Response.json({ error: 'Service media upload is not permitted' }, { status: 403 })
  const extension = extensions[contentType]
  if (!extension) return Response.json({ error: 'Choose a JPEG, PNG, WebP, GIF, AVIF, MP4, or WebM file' }, { status: 415 })
  let bytes: Uint8Array
  try {
    bytes = await readLimited(request, video ? maxVideoBytes : maxImageBytes)
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Invalid image' }, { status: 413 })
  }
  if (!validMedia(bytes, contentType)) return Response.json({ error: 'File content does not match its type' }, { status: 415 })
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET
  const publicBase = process.env.R2_PUBLIC_URL
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
    return Response.json({ error: 'Image storage is not configured' }, { status: 503 })
  }
  const publicUrl = new URL(publicBase.endsWith('/') ? publicBase : `${publicBase}/`)
  if (publicUrl.protocol !== 'https:' || publicUrl.username || publicUrl.password || publicUrl.search || publicUrl.hash) {
    return Response.json({ error: 'Image storage is not configured' }, { status: 503 })
  }
  const key = `portfolio/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${extension}`
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })
  try {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: Buffer.from(bytes), ContentType: contentType }))
  } catch {
    return Response.json({ error: 'Image storage is unavailable' }, { status: 502 })
  } finally {
    client.destroy()
  }
  return Response.json({ url: new URL(key, publicUrl).toString() }, { headers: { 'cache-control': 'no-store' } })
}
