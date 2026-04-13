import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: '.',
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:10272',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:10272',
        ws: true
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})
