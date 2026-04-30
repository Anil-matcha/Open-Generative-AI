import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/dom';

afterEach(() => {
  cleanup();
});

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_APP_BACKEND_URL: 'http://localhost:8000',
    VITE_API_URL: 'http://localhost:8000',
  },
});
