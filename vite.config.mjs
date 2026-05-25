import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    base: './',
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react',
    },
    resolve: {
        alias: [
            { find: '@studio', replacement: path.resolve(__dirname, 'packages/studio/src') },
            { find: 'next/navigation', replacement: path.resolve(__dirname, 'src/desktop/nextNavigationShim.js') },
            { find: 'next/dynamic', replacement: path.resolve(__dirname, 'src/desktop/nextDynamicShim.jsx') },
            {
                find: /^workflow-builder$/,
                replacement: path.resolve(__dirname, 'packages/Vibe-Workflow/packages/workflow-builder/src/index.js'),
            },
            {
                find: 'workflow-builder/dist/tailwind.css',
                replacement: path.resolve(__dirname, 'packages/Vibe-Workflow/packages/workflow-builder/dist/tailwind.css'),
            },
        ],
    },
    server: {
        watch: {
            ignored: ['**/.next/**', '**/dist/**'],
        },
        proxy: {
            '/api': {
                target: 'https://api.muapi.ai',
                changeOrigin: true,
                secure: false
            }
        }
    }
});
