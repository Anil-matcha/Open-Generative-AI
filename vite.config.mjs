import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    base: './',
    publicDir: 'public',
    server: {
        port: 5173,
        proxy: {
            // MuAPI for main application
            '/api': {
                target: 'https://api.muapi.ai',
                changeOrigin: true,
                secure: false
            },
            // Netlify Functions (local development)
            '/.netlify/functions': {
                target: 'http://localhost:9999',
                changeOrigin: true,
                secure: false
            }
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html')
            }
        }
    }
});