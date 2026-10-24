import { describe, expect, mock, test } from 'bun:test'
import { imageGeometry, inspectRaster } from '../src/lib/media/convert-to-webp'
import { createDirectImageUploader, ImageUploadError, type CompletedAsset, type MediaJson, type SignedUpload } from '../src/lib/media/direct-upload'
import { imagePurpose } from '../src/lib/media/image-presets'

const asset: CompletedAsset = { assetId: 'asset-id', status: 'ready', publicUrl: 'https://media.test/blogs/immutable.webp', key: 'blogs/immutable.webp', contentType: 'image/webp', sizeBytes: 4, width: 16, height: 9 }
const signed: SignedUpload = { uploadId: 'upload-id', method: 'PUT', uploadUrl: `https://${'a'.repeat(32)}.r2.cloudflarestorage.com/private/pending/id.webp?signature=opaque`, headers: { 'content-type': 'image/webp', 'if-none-match': '*' }, expiresAt: '2099-01-01T00:00:00Z' }
const source = () => new File(['source'], 'original.png', { type: 'image/png' })
const prepared = (file: File) => ({ file: new File(['webp'], 'converted.webp', { type: 'image/webp' }), originalName: file.name, sourceBytes: file.size, width: 16, height: 9 })

describe('shared direct WebP image uploads', () => {
  test('all content kinds resolve purpose-specific cover, gallery, and inline policies', () => {
    expect(imagePurpose('blogs', 'cover')).toBe('blog_cover')
    expect(imagePurpose('projects', 'gallery')).toBe('project_gallery')
    expect(imagePurpose('case-studies', 'cover')).toBe('case_study_cover')
    expect(imagePurpose('case-studies', 'inline')).toBe('case_study_inline')
    expect(imagePurpose('services', 'inline')).toBe('service_image')
  })

  test('center crops covers and resizes other images without upscaling or stretching', () => {
    expect(imageGeometry(4000, 3000, 'blog_cover')).toEqual({ sourceX: 0, sourceY: 375, cropWidth: 4000, cropHeight: 2250, width: 1920, height: 1080 })
    expect(imageGeometry(900, 1600, 'project_cover').sourceY).toBeCloseTo(546.875)
    expect(imageGeometry(400, 200, 'blog_inline')).toMatchObject({ width: 400, height: 200, cropWidth: 400, cropHeight: 200 })
    expect(imageGeometry(4000, 2000, 'case_study_gallery')).toMatchObject({ width: 1600, height: 800 })
    expect(() => imageGeometry(10000, 10000, 'service_image')).toThrow('25 megapixels')
    expect(() => imageGeometry(1, 1, 'blog_cover')).toThrow('too small')
  })

  test('rejects MIME spoofing and animated WebP before decoding', () => {
    expect(() => inspectRaster(new Uint8Array(30), 'image/png')).toThrow('Invalid PNG')
    expect(() => inspectRaster(new Uint8Array(30), 'image/jpeg')).toThrow('match')
    const bytes = new Uint8Array(30)
    bytes.set(new TextEncoder().encode('RIFF'))
    new DataView(bytes.buffer).setUint32(4, 22, true)
    bytes.set(new TextEncoder().encode('WEBPVP8X'), 8)
    new DataView(bytes.buffer).setUint32(16, 10, true)
    bytes[20] = 2
    expect(() => inspectRaster(bytes, 'image/webp')).toThrow('Animated WebP')
  })

  test('sends only JSON metadata to the app and raw WebP directly to R2 without application credentials', async () => {
    const file = source()
    const image = prepared(file)
    const calls: { action: string; data?: Record<string, unknown> }[] = []
    const api: MediaJson = async <Result>(action: string, data?: Record<string, unknown>) => { calls.push({ action, data }); return (action === 'presign' ? signed : asset) as Result }
    const put = mock(async (_url: string | URL | Request, _options?: RequestInit) => new Response(null, { status: 200 }))
    const upload = createDirectImageUploader({ prepare: async () => image, api, put })
    expect(await upload(file, 'blog_cover')).toEqual(asset)
    expect(calls.map(call => call.action)).toEqual(['presign', 'complete'])
    expect(calls[0].data).toEqual({ purpose: 'blog_cover', originalName: 'original.png', contentType: 'image/webp', sizeBytes: 4, width: 16, height: 9 })
    expect(calls[1].data).toEqual({ uploadId: signed.uploadId })
    expect(put.mock.calls[0][0]).toBe(signed.uploadUrl)
    expect(put.mock.calls[0][1]).toMatchObject({ method: 'PUT', body: image.file, headers: signed.headers, credentials: 'omit', redirect: 'error' })
  })

  test('retries completion with the same ID without uploading or signing again', async () => {
    const file = source()
    let completions = 0
    let signs = 0
    const api: MediaJson = async <Result>(action: string) => {
      if (action === 'presign') { signs++; return signed as Result }
      completions++
      if (completions === 1) throw new ImageUploadError(502, 'Temporary storage error')
      return asset as Result
    }
    const put = mock(async () => new Response(null, { status: 200 }))
    const upload = createDirectImageUploader({ prepare: async () => prepared(file), api, put })
    await expect(upload(file, 'blog_cover')).rejects.toThrow('Temporary storage')
    expect(await upload(file, 'blog_cover')).toEqual(asset)
    expect(put).toHaveBeenCalledTimes(1)
    expect(signs).toBe(1)
    expect(completions).toBe(2)
  })

  test('conditional PUT replay completes the existing object instead of overwriting it', async () => {
    const file = source()
    const api: MediaJson = async <Result>(action: string) => (action === 'presign' ? signed : asset) as Result
    const put = mock(async () => new Response(null, { status: 412 }))
    const upload = createDirectImageUploader({ prepare: async () => prepared(file), api, put })
    expect(await upload(file, 'blog_cover')).toEqual(asset)
    expect(put).toHaveBeenCalledTimes(1)
  })

  test('a 403 starts a fresh signing session on retry instead of editing the expired URL', async () => {
    const file = source()
    let signs = 0
    const api: MediaJson = async <Result>(action: string) => {
      if (action === 'presign') { signs++; return { ...signed, uploadId: `upload-${signs}` } as Result }
      return asset as Result
    }
    let puts = 0
    const put = mock(async () => new Response(null, { status: ++puts === 1 ? 403 : 200 }))
    const upload = createDirectImageUploader({ prepare: async () => prepared(file), api, put })
    await expect(upload(file, 'blog_cover')).rejects.toThrow('403')
    expect(await upload(file, 'blog_cover')).toEqual(asset)
    expect(signs).toBe(2)
    expect(put).toHaveBeenCalledTimes(2)
  })

  test('an uncertain PUT failure checks completion before attempting another upload', async () => {
    const file = source()
    const api: MediaJson = async <Result>(action: string) => (action === 'presign' ? signed : asset) as Result
    const put = mock(async () => { throw new Error('network failure with sensitive URL') })
    const upload = createDirectImageUploader({ prepare: async () => prepared(file), api, put })
    await expect(upload(file, 'blog_cover')).rejects.toThrow('could not be reached')
    expect(await upload(file, 'blog_cover')).toEqual(asset)
    expect(put).toHaveBeenCalledTimes(1)
  })

  test('conversion failure and cancellation never send image bytes or sign a URL', async () => {
    const api = mock(async () => signed)
    const put = mock(async () => new Response(null, { status: 200 }))
    const upload = createDirectImageUploader({ prepare: async () => { throw new Error('Cannot encode WebP') }, api: api as MediaJson, put })
    await expect(upload(source(), 'blog_cover')).rejects.toThrow('Cannot encode WebP')
    const controller = new AbortController()
    controller.abort()
    await expect(upload(source(), 'blog_cover', { signal: controller.signal })).rejects.toThrow()
    expect(api).not.toHaveBeenCalled()
    expect(put).not.toHaveBeenCalled()
  })

  test('rejects a CDN URL instead of sending bytes through an application or public delivery host', async () => {
    const file = source()
    const api: MediaJson = async <Result>() => ({ ...signed, uploadUrl: 'https://media.test/upload' }) as Result
    const put = mock(async () => new Response(null, { status: 200 }))
    const upload = createDirectImageUploader({ prepare: async () => prepared(file), api, put })
    await expect(upload(file, 'service_image')).rejects.toThrow('destination')
    await expect(upload(file, 'service_image')).rejects.toThrow('destination')
    expect(put).not.toHaveBeenCalled()
  })
})
