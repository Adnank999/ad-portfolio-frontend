import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { sourceTextures } from './vite-plugins/source-textures'

export default defineConfig(() => ({
  assetsInclude: ['**/*.ktx2'],
  plugins: [sourceTextures(), tsconfigPaths(), tanstackStart(), nitro({
    preset: 'node_server',
    plugins: ['./server/plugins/html-compression.ts'],
    compressPublicAssets: { gzip: true, brotli: true },
    routeRules: {
      '/fonts/**': { headers: { 'cache-control': 'public, max-age=86400' } },
      '/logo.svg': { headers: { 'cache-control': 'public, max-age=86400' } },
      '/images/value-particles.svg': { headers: { 'cache-control': 'public, max-age=86400' } },
    },
  }), react(), tailwindcss()],
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: {
    include: ['react', 'react-dom/client', '@react-three/fiber', '@react-three/drei/core/PerformanceMonitor', 'three'],
  },
  server: { port: 3000 },
}))
