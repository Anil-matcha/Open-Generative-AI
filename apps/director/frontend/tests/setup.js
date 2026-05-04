import { expect } from 'vitest';
import { afterEach } from 'vitest';

// Simple cleanup: reset DOM body between tests
afterEach(() => {
  document.body.innerHTML = '';
});

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_APP_BACKEND_URL: 'http://localhost:8000',
    VITE_API_URL: 'http://localhost:8000',
  },
});
