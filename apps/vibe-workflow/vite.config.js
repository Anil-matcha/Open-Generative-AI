import { defineConfig } from 'vite'

export default defineConfig({
  // Netlify hosting: dist publish, SPA redirects, Supabase env via dashboard
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  },
  server: {
    port: 5173,
    open: true
  }
})
