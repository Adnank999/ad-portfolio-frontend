import { expect, test } from 'bun:test'
import { gunzipSync } from 'node:zlib'
import { compressPublicHtml } from '../src/server/html-compression'

const html = '<!doctype html><html><body>' + '<p>Ideas into reality.</p>'.repeat(100) + '</body></html>'
const page = (headers?: HeadersInit) => new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'x-test': 'preserved', ...headers } })
const request = (encoding: string, path = '/', headers?: HeadersInit) => new Request('https://adnanhk.dev' + path, { headers: { 'accept-encoding': encoding, ...headers } })

test('public HTML compression preserves streamed content and headers without buffering the page', async () => {
  let finish: ReadableStreamDefaultController<Uint8Array>
  const stream = new ReadableStream<Uint8Array>({ start(controller) { finish = controller; controller.enqueue(new TextEncoder().encode(html.slice(0, 100))) } })
  const response = compressPublicHtml(request('br, gzip'), new Response(stream, { headers: { 'content-type': 'text/html', 'content-length': String(html.length), vary: 'Origin', 'x-test': 'preserved', etag: 'original-bytes' } }))
  expect(response.headers.get('content-encoding')).toBe('gzip')
  expect(response.headers.get('vary')).toBe('Origin, Accept-Encoding')
  expect(response.headers.get('x-test')).toBe('preserved')
  expect(response.headers.has('content-length')).toBe(false)
  expect(response.headers.has('etag')).toBe(false)
  finish!.enqueue(new TextEncoder().encode(html.slice(100)))
  finish!.close()
  const bytes = new Uint8Array(await response.arrayBuffer())
  expect(bytes.length).toBeLessThan(html.length / 4)
  expect(gunzipSync(bytes).toString()).toBe(html)
})

test('encoding negotiation respects explicit gzip refusal and varies identity responses', async () => {
  for (const encoding of ['', 'br', 'gzip;q=0', '*;q=1, gzip;q=0', 'gzip;q=invalid']) {
    const response = compressPublicHtml(request(encoding), page())
    expect(response.headers.has('content-encoding')).toBe(false)
    expect(response.headers.get('vary')).toBe('Accept-Encoding')
    expect(await response.text()).toBe(html)
  }
  for (const encoding of ['GZip; q=0.5', '*;q=1']) expect(compressPublicHtml(request(encoding), page()).headers.get('content-encoding')).toBe('gzip')
})

test('private pages, cookies, APIs and already encoded responses are unchanged', () => {
  for (const path of ['/admin', '/admin/shaders', '/login', '/register', '/api/v1/services', '/_server/test']) {
    const original = page()
    expect(compressPublicHtml(request('gzip', path), original)).toBe(original)
  }
  for (const headers of [{ cookie: 'session=private' }, { authorization: 'Bearer private' }, { range: 'bytes=0-10' }]) {
    const original = page()
    expect(compressPublicHtml(request('gzip', '/', headers), original)).toBe(original)
  }
  for (const headers of [{ 'set-cookie': 'session=private' }, { 'content-encoding': 'br' }, { 'content-type': 'application/json' }, { 'cache-control': 'private, no-transform' }]) {
    const original = page(headers)
    expect(compressPublicHtml(request('gzip'), original)).toBe(original)
  }
  const post = new Request('https://adnanhk.dev/', { method: 'POST', headers: { 'accept-encoding': 'gzip' } })
  const original = page()
  expect(compressPublicHtml(post, original)).toBe(original)
})
