export default {
    plugins: [],
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
};