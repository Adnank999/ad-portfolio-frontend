import { IMAGE_PRESETS, MAX_SOURCE_BYTES, MAX_SOURCE_PIXELS, rasterImageTypes, type ImagePurpose } from './image-presets'

export type PreparedImage = { file: File; width: number; height: number; originalName: string; sourceBytes: number }

export function inspectRaster(bytes: Uint8Array, type: string) {
  const text = (start: number, length: number) => new TextDecoder().decode(bytes.subarray(start, start + length))
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (type === 'image/png') {
    if (bytes.length < 24 || text(12, 4) !== 'IHDR' || !bytes.subarray(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index])) throw new Error('Invalid PNG image')
    for (let offset = 8; offset + 8 <= bytes.length;) {
      const length = view.getUint32(offset)
      if (text(offset + 4, 4) === 'acTL') throw new Error('Animated PNG images are not supported; choose a still image')
      if (offset + length + 12 > bytes.length) throw new Error('Truncated PNG image')
      offset += length + 12
    }
    return { width: view.getUint32(16), height: view.getUint32(20) }
  }
  if (type === 'image/webp') {
    if (bytes.length < 21 || text(0, 4) !== 'RIFF' || text(8, 4) !== 'WEBP' || view.getUint32(4, true) + 8 !== bytes.length) throw new Error('Invalid WebP image')
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const kind = text(offset, 4)
      const length = view.getUint32(offset + 4, true)
      if (kind === 'ANIM' || kind === 'ANMF' || (kind === 'VP8X' && length >= 10 && (bytes[offset + 8] & 2))) throw new Error('Animated WebP images are not supported; choose a still image')
      if (offset + length + 8 > bytes.length) throw new Error('Truncated WebP image')
      offset += 8 + length + length % 2
    }
    if (text(12, 4) === 'VP8X' && bytes.length >= 30) {
      const read24 = (offset: number) => 1 + bytes[offset] + bytes[offset + 1] * 256 + bytes[offset + 2] * 65536
      return { width: read24(24), height: read24(27) }
    }
    if (text(12, 4) === 'VP8L' && bytes.length >= 25 && bytes[20] === 47) {
      const packed = view.getUint32(21, true)
      return { width: 1 + (packed & 16383), height: 1 + ((packed >>> 14) & 16383) }
    }
    if (text(12, 4) === 'VP8 ' && bytes.length >= 30 && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) return { width: view.getUint16(26, true) & 16383, height: view.getUint16(28, true) & 16383 }
    return null
  }
  if (type !== 'image/jpeg' || bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) throw new Error('File contents do not match the selected image type')
  for (let offset = 2; offset + 4 <= bytes.length;) {
    if (bytes[offset++] !== 255) break
    while (bytes[offset] === 255) offset++
    const marker = bytes[offset++]
    if (marker === 217 || marker === 218 || offset + 2 > bytes.length) break
    if (marker === 1 || (marker >= 208 && marker <= 215)) continue
    const length = view.getUint16(offset)
    if (length < 2 || offset + length > bytes.length) throw new Error('Truncated JPEG image')
    if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) && length >= 7) return { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) }
    offset += length
  }
  return null
}

export function imageGeometry(sourceWidth: number, sourceHeight: number, purpose: ImagePurpose) {
  if (!Number.isInteger(sourceWidth) || !Number.isInteger(sourceHeight) || sourceWidth <= 0 || sourceHeight <= 0 || sourceWidth * sourceHeight > MAX_SOURCE_PIXELS) throw new Error('Image must have at most 25 megapixels')
  const preset = IMAGE_PRESETS[purpose]
  let cropWidth = sourceWidth
  let cropHeight = sourceHeight
  if (preset.cover) {
    if (sourceWidth / sourceHeight > 16 / 9) cropWidth = sourceHeight * 16 / 9
    else cropHeight = sourceWidth * 9 / 16
  }
  const scale = Math.min(1, preset.maxWidth / cropWidth, preset.maxHeight / cropHeight)
  const unit = Math.floor(Math.min(cropWidth / 16, cropHeight / 9, 120))
  if (preset.cover && unit < 1) throw new Error('Cover image is too small for a 16:9 crop')
  return {
    sourceX: (sourceWidth - cropWidth) / 2, sourceY: (sourceHeight - cropHeight) / 2, cropWidth, cropHeight,
    width: preset.cover ? unit * 16 : Math.max(1, Math.floor(cropWidth * scale)),
    height: preset.cover ? unit * 9 : Math.max(1, Math.floor(cropHeight * scale)),
  }
}

export async function prepareWebpImage(source: File, purpose: ImagePurpose, signal?: AbortSignal): Promise<PreparedImage> {
  signal?.throwIfAborted()
  if (!rasterImageTypes.includes(source.type)) throw new Error('Choose a still JPEG, PNG, or WebP image. SVG, GIF, AVIF, and HEIC are not supported by this image workflow.')
  if (!source.size || source.size > MAX_SOURCE_BYTES) throw new Error('Choose a nonempty image of 20 MiB or smaller')
  const dimensions = inspectRaster(new Uint8Array(await source.arrayBuffer()), source.type)
  if (dimensions && (dimensions.width <= 0 || dimensions.height <= 0 || dimensions.width * dimensions.height > MAX_SOURCE_PIXELS)) throw new Error('Image must have at most 25 megapixels')
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') throw new Error('This browser cannot prepare images. Use a browser with WebP canvas support.')
  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  try {
    signal?.throwIfAborted()
    const geometry = imageGeometry(bitmap.width, bitmap.height, purpose)
    canvas.width = geometry.width
    canvas.height = geometry.height
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) throw new Error('Image canvas is unavailable')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, geometry.sourceX, geometry.sourceY, geometry.cropWidth, geometry.cropHeight, 0, 0, geometry.width, geometry.height)
    let output: Blob | null = null
    for (const quality of [IMAGE_PRESETS[purpose].quality, 0.75, 0.68]) {
      signal?.throwIfAborted()
      output = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => {
        if (!blob || blob.type !== 'image/webp') reject(new Error('This browser cannot encode WebP images'))
        else resolve(blob)
      }, 'image/webp', quality))
      if (output.size <= IMAGE_PRESETS[purpose].maxOutputBytes) break
    }
    signal?.throwIfAborted()
    if (!output?.size || output.size > IMAGE_PRESETS[purpose].maxOutputBytes) throw new Error('Converted WebP exceeds 2 MiB; choose a smaller image')
    inspectRaster(new Uint8Array(await output.arrayBuffer()), 'image/webp')
    return {
      file: new File([output], `${source.name.replace(/\.[^.]+$/, '') || 'image'}.webp`, { type: 'image/webp' }),
      width: geometry.width, height: geometry.height, originalName: source.name, sourceBytes: source.size,
    }
  } finally {
    bitmap.close()
    canvas.width = 0
    canvas.height = 0
  }
}
