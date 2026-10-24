import { describe, expect, mock, test } from 'bun:test'
import { readProjectGallery, uploadProjectImages } from '../src/lib/project-gallery'

const image = (name: string, type = 'image/jpeg') => new File(['image'], name, { type })

describe('project gallery uploads', () => {
  test('uploads sequentially in selection order and retains successes after a failed file', async () => {
    let active = 0
    let peak = 0
    const upload = mock(async (file: File) => {
      active++
      peak = Math.max(peak, active)
      await Promise.resolve()
      active--
      if (file.name === 'bad.jpg') throw new Error('Storage unavailable')
      return `https://cdn.test/${file.name}`
    })
    const result = await uploadProjectImages([image('first.jpg'), image('bad.jpg'), image('last.jpg')], upload)
    expect(peak).toBe(1)
    expect(result.uploaded).toEqual([{ url: 'https://cdn.test/first.jpg', alt: '', caption: '' }, { url: 'https://cdn.test/last.jpg', alt: '', caption: '' }])
    expect(result.failed).toEqual([{ name: 'bad.jpg', message: 'Storage unavailable' }])
  })
  test('rejects excessive counts, unsafe types, empty and oversized files before any upload', async () => {
    const upload = mock(async () => 'https://cdn.test/upload.jpg')
    for (const files of [[], Array.from({ length: 21 }, (_, index) => image(`${index}.jpg`)), [image('valid.jpg'), image('script.svg', 'image/svg+xml')], [new File([], 'empty.jpg', { type: 'image/jpeg' })], [new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' })]]) {
      await expect(uploadProjectImages(files, upload)).rejects.toThrow()
    }
    expect(upload).not.toHaveBeenCalled()
  })
  test('normalizes optional captions and legacy missing galleries', () => {
    expect(readProjectGallery(undefined)).toEqual([])
    expect(readProjectGallery([{ url: '/images/a.webp', alt: 'Dashboard' }])).toEqual([{ url: '/images/a.webp', alt: 'Dashboard', caption: '' }])
  })
})
