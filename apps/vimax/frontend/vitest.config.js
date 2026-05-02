import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    teardownFiles: ['./src/test-teardown.ts'],
    tsconfig: './tsconfig.json',
    include: ['tests/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
