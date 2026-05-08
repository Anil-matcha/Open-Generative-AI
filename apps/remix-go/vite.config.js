import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Security headers middleware for remix-go
function securityHeaders() {
    return {
        name: 'security-headers',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                // Content Security Policy
                res.setHeader(
                    'Content-Security-Policy',
                    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://api.muapi.ai; media-src 'self' https: blob:; manifest-src 'self'; worker-src 'self' blob:; frame-ancestors 'self' https://github.dev https://*.github.dev;"
                );

                // Prevent clickjacking
                res.setHeader('X-Frame-Options', 'SAMEORIGIN');

                // Prevent MIME type sniffing
                res.setHeader('X-Content-Type-Options', 'nosniff');

                // Enable XSS filter
                res.setHeader('X-XSS-Protection', '1; mode=block');

                next();
            });
        }
    };
}

export default defineConfig({
  base: "/apps/remix-go/",
  plugins: [react(), securityHeaders()],
  server: {
    port: 5173,
    host: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    global: 'globalThis'
  }
})
