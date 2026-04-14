import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for Timeline Editor unit testing
 * 
 * This configuration provides comprehensive unit testing for:
 * - Core timeline engine functionality
 * - State management systems
 * - Media processing pipelines
 * - UI component logic
 */
export default defineConfig({
  test: {
    /* Test environment settings */
    environment: 'node',
    globals: true,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    
    /* Test coverage and reporting */
    coverage: {
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.{js,ts}'],
      exclude: ['**/*.test.{js,ts}'],
    },
    
    /* Test execution settings */
    maxWorkers: 4,
    testTimeout: 30000,
    hookTimeout: 30000,
    
    /* Setup and teardown */
    setupFiles: ['./src/test-setup.ts'],
    teardownFiles: ['./src/test-teardown.ts'],
    
    /* Assertion settings */
    expect: {
      assertionTimeout: 5000,
    },
  },
});