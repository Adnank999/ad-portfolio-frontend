import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { sourceTextures } from '../vite-plugins/source-textures'

test('shader textures bypass the SSR fallback and retain their original binary bytes', async () => {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../', import.meta.url)),
    logLevel: 'silent',
    plugins: [sourceTextures(), {
      name: 'test-ssr-fallback',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url?.startsWith('/@fs/')) return next()
          response.statusCode = 404
          response.end('SSR fallback')
        })
      },
    }],
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { host: '127.0.0.1', port: 0, watch: null },
  })
  try {
    await server.listen()
    const address = server.httpServer?.address()
    if (!address || typeof address === 'string') throw new Error('Missing test server address')
    const origin = `http://127.0.0.1:${address.port}`
    const prefix = '/src/components/home/shaders-glsl/assets/'
    for (const name of ['marble-desktop.ktx2', 'marble-01-desktop.ktx2', 'marble-02-desktop.ktx2', 'marble-03-desktop.ktx2']) {
      const response = await fetch(origin + prefix + name + '?v=regression')
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('image/ktx2')
      expect(Buffer.from(await response.arrayBuffer())).toEqual(readFileSync(new URL('../src/components/home/shaders-glsl/assets/' + name, import.meta.url)))
    }
    const head = await fetch(origin + prefix + 'marble-desktop.ktx2', { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect((await head.arrayBuffer()).byteLength).toBe(0)
    for (const path of [prefix + 'missing.ktx2', '/package.json', '/src/../package.json']) {
      expect((await fetch(origin + path)).status).toBe(404)
    }
    expect((await fetch(origin + prefix + 'marble-desktop.ktx2', { method: 'POST' })).status).toBe(404)
  } finally {
    await server.close()
  }
}, 30_000)
