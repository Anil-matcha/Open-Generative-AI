import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    server: {
        proxy: {
            '/api': {
                target: 'https://api.muapi.ai',
                changeOrigin: true,
                secure: false
            }
        }
    }
});
