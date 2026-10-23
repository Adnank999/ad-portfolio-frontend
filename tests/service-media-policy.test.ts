import { expect, test } from 'bun:test'
import { validMedia } from '../src/server/media'

test('service video uploads validate media signatures rather than trusting their MIME type', () => {
  const mp4 = new Uint8Array([0, 0, 0, 24, ...new TextEncoder().encode('ftypisom'), 0, 0, 0, 0, ...new TextEncoder().encode('isommp42')])
  expect(validMedia(mp4, 'video/mp4')).toBe(true)
  expect(validMedia(mp4, 'image/avif')).toBe(false)
  const avif = new Uint8Array([0, 0, 0, 24, ...new TextEncoder().encode('ftypavif'), 0, 0, 0, 0])
  expect(validMedia(avif, 'video/mp4')).toBe(false)
  expect(validMedia(new Uint8Array([0, 1, 2, 3]), 'video/mp4')).toBe(false)
  expect(validMedia(new TextEncoder().encode('<svg onload="alert(1)"></svg>'), 'video/mp4')).toBe(false)
})

test('WebM requires an EBML header and its WebM document type', () => {
  const header = [0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]
  expect(validMedia(new Uint8Array([...header, ...new TextEncoder().encode('webm')]), 'video/webm')).toBe(true)
  expect(validMedia(new Uint8Array([...header, ...new TextEncoder().encode('matroska')]), 'video/webm')).toBe(false)
  expect(validMedia(new TextEncoder().encode('webm'), 'video/webm')).toBe(false)
})
