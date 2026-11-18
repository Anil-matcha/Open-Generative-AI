import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['tests/unit/**/*.test.{js,jsx}', 'tests/components/**/*.test.{js,jsx}'],
    // Unit tests (models, muapi, middleware) run in node environment
    // Component tests override with jsdom via @vitest-environment docblock
    exclude: ['node_modules', 'dist', '.next', 'release'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'packages/studio/src/**/*.{js,jsx}',
        'electron/lib/**/*.js',
        'middleware.js',
      ],
      exclude: [
        'packages/studio/src/models.js',
        'packages/studio/src/messages/**',
        '**/*.test.*',
        '**/node_modules/**',
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 55,
        lines: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('.'),
      'studio': path.resolve('./packages/studio/src'),
      'ai-agent': path.resolve('./packages/Open-Poe-AI/packages/agents/src'),
      'workflow-builder': path.resolve('./packages/Vibe-Workflow/packages/workflow-builder/src'),
      'design-agent': path.resolve('./packages/Open-AI-Design-Agent/packages/design-agent/src'),
    },
  },
});
