import { prepareWebpImage, type PreparedImage } from './convert-to-webp'
import type { ImagePurpose } from './image-presets'

export type CompletedAsset = { assetId: string; status: 'ready'; publicUrl: string; key: string; contentType: 'image/webp'; sizeBytes: number; width: number; height: number }
export type SignedUpload = { uploadId: string; method: 'PUT'; uploadUrl: string; headers: Record<string, string>; expiresAt: string }
export type UploadStage = 'converting' | 'signing' | 'uploading' | 'verifying' | 'ready'
export class ImageUploadError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
export type MediaJson = <Result>(action: 'policy' | 'presign' | 'complete' | 'abandon', data?: Record<string, unknown>, signal?: AbortSignal) => Promise<Result>

export const mediaJson: MediaJson = async <Result>(action: string, data?: Record<string, unknown>, signal?: AbortSignal) => {
  const response = await fetch('/api/admin/media', {
    method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, ...data }), signal,
  })
  const result = await response.json() as Result & { error?: string }
  if (!response.ok) throw new ImageUploadError(response.status, result.error ?? 'Image request failed')
  return result
}

type Session = { prepared: PreparedImage; signed?: SignedUpload; attempted: boolean; asset?: CompletedAsset }

export function createDirectImageUploader(options: {
  api?: MediaJson
  prepare?: typeof prepareWebpImage
  put?: typeof fetch
} = {}) {
  const sessions = new WeakMap<File, Map<ImagePurpose, Session>>()
  const api = options.api ?? mediaJson
  const prepare = options.prepare ?? prepareWebpImage
  const put = options.put ?? ((...parameters: Parameters<typeof fetch>) => fetch(...parameters))
  return async (source: File, purpose: ImagePurpose, settings: { signal?: AbortSignal; onStage?: (stage: UploadStage) => void; onPrepared?: (image: PreparedImage) => void } = {}): Promise<CompletedAsset> => {
    const { signal, onStage, onPrepared } = settings
    signal?.throwIfAborted()
    let session = sessions.get(source)?.get(purpose)
    if (!session) {
      onStage?.('converting')
      session = { prepared: await prepare(source, purpose, signal), attempted: false }
      if (!sessions.has(source)) sessions.set(source, new Map())
      sessions.get(source)!.set(purpose, session)
    }
    onPrepared?.(session.prepared)
    const complete = async () => {
      onStage?.('verifying')
      const asset = await api<CompletedAsset>('complete', { uploadId: session!.signed!.uploadId }, signal)
      if (asset.status !== 'ready' || !asset.assetId || asset.contentType !== 'image/webp' || !asset.publicUrl.startsWith('https://')) throw new Error('Image was not verified and published')
      session!.asset = asset
      onStage?.('ready')
      return asset
    }
    if (session.asset) { onStage?.('ready'); return session.asset }
    if (session.attempted && session.signed) {
      try { return await complete() }
      catch (error) {
        if (!(error instanceof ImageUploadError) || ![409, 410].includes(error.status)) throw error
        if (error.status === 410) { session.signed = undefined; session.attempted = false }
      }
    }
    signal?.throwIfAborted()
    if (!session.signed || Date.parse(session.signed.expiresAt) <= Date.now()) {
      onStage?.('signing')
      const signed = await api<SignedUpload>('presign', {
        purpose, originalName: session.prepared.originalName, contentType: 'image/webp',
        sizeBytes: session.prepared.file.size, width: session.prepared.width, height: session.prepared.height,
      }, signal)
      let destination: URL
      try { destination = new URL(signed.uploadUrl) } catch { throw new Error('Invalid direct-upload destination') }
      if (destination.protocol !== 'https:' || !/^[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/.test(destination.hostname)
        || destination.username || destination.password || destination.hash
        || signed.method !== 'PUT' || !Number.isFinite(Date.parse(signed.expiresAt))
        || Object.keys(signed.headers).some(name => /^(authorization|cookie|host)$/i.test(name))) throw new Error('Invalid direct-upload destination')
      session.signed = signed
      session.attempted = false
    }
    onStage?.('uploading')
    session.attempted = true
    let response: Response
    try {
      response = await put(session.signed.uploadUrl, {
        method: 'PUT', headers: session.signed.headers, body: session.prepared.file,
        credentials: 'omit', redirect: 'error', signal,
      })
    } catch {
      signal?.throwIfAborted()
      throw new Error('R2 could not be reached. Check your connection or bucket CORS, then Retry.')
    }
    if (!response.ok && response.status !== 412) {
      if (response.status === 403) { session.signed = undefined; session.attempted = false }
      throw new ImageUploadError(response.status, `Direct R2 upload failed (HTTP ${response.status}). Retry the image upload.`)
    }
    return complete()
  }
}

export const uploadDirectImage = createDirectImageUploader()
