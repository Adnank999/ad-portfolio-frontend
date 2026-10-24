import { defineConfig, normalizePath } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { sourceTextures } from './vite-plugins/source-textures'

const loaderModelFile = fileURLToPath(new URL('./public/loader/crimson_logo_optimized.glb', import.meta.url))

export default defineConfig(() => ({
  assetsInclude: ['**/*.ktx2'],
  define: {
    'import.meta.env.VITE_LOADER_MODEL_VERSION': JSON.stringify(createHash('sha256').update(readFileSync(loaderModelFile)).digest('hex')),
  },
  plugins: [sourceTextures(), tsconfigPaths(), tanstackStart(), nitro({ preset: 'node_server' }), react(), tailwindcss(), {
    name: 'reload-loading-logo',
    configureServer(server) {
      const reloadModel = (file: string) => {
        if (normalizePath(file) === normalizePath(loaderModelFile)) void server.restart()
      }
      server.watcher.add(loaderModelFile)
      server.watcher.on('change', reloadModel)
      server.httpServer?.once('close', () => server.watcher.off('change', reloadModel))
    },
  }],
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: {
    include: ['react', 'react-dom/client', '@react-three/fiber', '@react-three/drei/core/PerformanceMonitor', 'three'],
  },
  server: { port: 3000 },
}))
