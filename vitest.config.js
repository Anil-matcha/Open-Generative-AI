import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts', './src/test-teardown.ts'],
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'apps/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'modules/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '**/*.d.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'src/test/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': '/workspaces/Open-Higgsfield-AI',
      '@test': '/workspaces/Open-Higgsfield-AI/tests'
    }
  }
});