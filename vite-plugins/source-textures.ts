import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { normalizePath, type Plugin } from 'vite'

export function sourceTextures(): Plugin {
  const directory = new URL('../src/components/home/shaders-glsl/assets/', import.meta.url)
  const paths = new Map(readdirSync(directory).filter(name => name.endsWith('.ktx2')).map(name => [
    `/src/components/home/shaders-glsl/assets/${name}`,
    `/@fs/${normalizePath(fileURLToPath(new URL(name, directory)))}`,
  ]))

  return {
    name: 'serve-source-textures',
    enforce: 'pre',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const url = request.url ?? ''
        const pathname = url.split('?')[0]
        const asset = paths.get(pathname)
        if (asset && (request.method === 'GET' || request.method === 'HEAD')) request.url = asset + url.slice(pathname.length)
        next()
      })
    },
  }
}
