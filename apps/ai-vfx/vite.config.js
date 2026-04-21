import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174 // Separate from main app
  },
  build: {
    outDir: '../../public/apps/ai-vfx',
    emptyOutDir: true
  }
})