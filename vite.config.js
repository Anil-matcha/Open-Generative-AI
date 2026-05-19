import { defineConfig } from 'vite';

// Custom CORS middleware for strict origin validation
function corsMiddleware() {
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://app.higgsfield.ai',
    'https://studio.higgsfield.ai'
  ];

  return {
    name: 'cors-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const origin = req.headers.origin;

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            res.setHeader('Access-Control-Max-Age', '86400');
          }
          res.statusCode = 200;
          res.end();
          return;
        }

        // Validate origin for actual requests
        if (origin && allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        }

        next();
      });
    }
  };
}

const SRI_HASHES = {
  'framer-motion': 'sha384-y5ggJt9rA+5N/oXsznF6f0tNhMzQAj+8iyLHOC3WgdDyQ9dAb5OQcHvRl/bL/bu0',
  'lucide-react': 'sha384-H/rlrUvAgLM+jJQDAG/lcGRGebjEnNb2IRTPJeX8bXCc8NoL/NOLpc2kUJp/FtGy',
  'canvas-confetti': 'sha384-JSZXO0kKYHTylAsDYTb+7Kg2eUyalm19b8Pydcdf8sQ1cCKYZr9lLahoKT9+LFY5kQSGR'
};

const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self' https://cdn.jsdelivr.net",
  "style-src 'self' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://api.muapi.ai https://api.openai.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
  "referrer 'strict-origin-when-cross-origin'",
  "block-all-mixed-content"
].join('; ');

const DEVELOPMENT_CSP = [
  "default-src 'self'",
  "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'",
  "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://api.muapi.ai https://api.openai.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "referrer-policy 'strict-origin-when-cross-origin'"
].join('; ');

export default defineConfig({
    plugins: [corsMiddleware()],
    root: './',
    publicDir: 'public',
    optimizeDeps: {
        exclude: ['src/components/EffectsStudio.js', 'workflow-builder', 'ai-agent', 'design-agent'],
        esbuildOptions: {
          loader: {
            '.js': 'js'
          }
        }
    },
    esbuild: {
          include: ['src/**/*.{js,jsx,ts,tsx}'],
          exclude: ['src/components/EffectsStudio.js', 'src/components/TimelineEditorPage.jsx', 'director/**/*', 'external-repos/**/*', 'modules/**/*', 'node_modules/workflow-builder/**/*', 'node_modules/ai-agent/**/*', 'node_modules/design-agent/**/*']
      },

    server: {
        host: '0.0.0.0',
        port: 8080,
        strictPort: true,
        cors: false,
        headers: {
            'X-Frame-Options': 'SAMEORIGIN',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Content-Security-Policy': process.env.NODE_ENV === 'production' ? PRODUCTION_CSP : DEVELOPMENT_CSP
        },
     proxy: {
           "/api": {
                    target: process.env.VITE_MUAPI_URL || "https://api.muapi.ai",
                    changeOrigin: true,
                    secure: true,
                    rewrite: (path) => path.replace(/^\/api/, "")
                 },
"/apps/videco-ai-platform": {
                    target: "http://localhost:3002",
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/apps\/videco-ai-platform/, "")
                  },
                 "/apps/ai-headshot-generator": {
                    target: "http://localhost:3003",
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/apps\/ai-headshot-generator/, "")
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
