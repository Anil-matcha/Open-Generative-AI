import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// Security headers middleware
function securityHeaders() {
    return {
        name: 'security-headers',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                // Content Security Policy
                res.setHeader(
                    'Content-Security-Policy',
                    "default-src 'self' https://github.dev https://*.github.dev; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co " + (process.env.VITE_MUAPI_URL || 'https://api.muapi.ai') + "; media-src 'self' https: blob:; manifest-src 'self' https://github.dev https://*.github.dev; worker-src 'self' blob:; frame-ancestors 'self' https://github.dev https://*.github.dev;"
                );

                  // Prevent clickjacking
                  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
                
                // Prevent MIME type sniffing
                res.setHeader('X-Content-Type-Options', 'nosniff');
                
                // Enable XSS filter
                res.setHeader('X-XSS-Protection', '1; mode=block');
                
                // Referrer Policy
                res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
                
                // Permissions Policy
                res.setHeader(
                    'Permissions-Policy',
                    'camera=(), microphone=(), geolocation=()'
                );
                
                next();
            });
        }
    };
}

export default defineConfig({
    plugins: [
        tailwindcss(),
        securityHeaders(),
    ],
    root: './',
    publicDir: 'public',
    optimizeDeps: {
        exclude: ['src/components/EffectsStudio.js']
    },
    esbuild: {
        include: ['src/**/*.{js,jsx,ts,tsx}'],
        exclude: ['src/components/EffectsStudio.js', 'director/**/*', 'apps/**/*', 'external-repos/**/*', 'modules/**/*']
    },


    server: {
        host: '0.0.0.0',
        port: 8080,
        strictPort: true,
        cors: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
         proxy: {
             "/api": {
                 target: process.env.VITE_MUAPI_URL || "https://api.muapi.ai",
                 changeOrigin: true,
                 secure: true,
                 rewrite: (path) => path.replace(/^\/api/, "")
              },
              "/apps/remix-go": {
                  target: "http://localhost:5173",
                  changeOrigin: true,
                  bypass: async (req, res, options) => {
                      try {
                          const http = await import('http');
                          const available = await new Promise((resolve) => {
                              const request = http.request({
                                  hostname: 'localhost',
                                  port: 5173,
                                  path: req.url.replace(/^\/apps\/remix-go/, '/apps/remix-go'),
                                  method: 'HEAD',
                                  timeout: 500
                              }, (response) => {
                                  resolve(response.statusCode < 400);
                              });
                              request.on('error', () => resolve(false));
                              request.on('timeout', () => {
                                  request.destroy();
                                  resolve(false);
                              });
                              request.end();
                          });
                          return available ? null : req.url;
                      } catch (error) {
                          return req.url; // Bypass proxy on error
                      }
                  }
              },
                "/apps/ai-vfx": {
                   target: "http://localhost:5174",
                   changeOrigin: true
               },
               "/apps/sendspark": {
                   target: "http://localhost:5175",
                   changeOrigin: true
               }
         }
    },
    build: {
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        rollupOptions: {
            input: 'index.html',
            output: {
                manualChunks: (id) => {
                    if (id.includes('@supabase/supabase-js')) {
                        return 'vendor';
                    }
              },
              "/apps/remix-go": {
                  target: "http://localhost:5173",
                  changeOrigin: true,
                  configure: (proxy, options) => {
                      // Check if remix-go dev server is running
                      proxy.on('error', (err, req, res) => {
                          console.log('Proxy error, falling back to static files');
                          // Let Vite serve static files
                      });
                  }
              },
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        },
        sourcemap: process.env.NODE_ENV !== 'production',
        chunkSizeWarningLimit: 1000
    },
     preview: {
         port: 3000,
         headers: {
             'Cache-Control': 'public, max-age=31536000',
             'X-Frame-Options': 'SAMEORIGIN',
             'X-Content-Type-Options': 'nosniff',
             'X-XSS-Protection': '1; mode=block',
             'Referrer-Policy': 'strict-origin-when-cross-origin'
         }
     }
});
