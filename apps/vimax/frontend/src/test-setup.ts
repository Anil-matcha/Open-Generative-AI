import { expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock WebSocket
class WebSocketMock {
  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;
  readyState = 0;
  onopen = null;
  onclose = null;
  onmessage = null;
  onerror = null;
  send = () => {};
  close = () => {};
}
(window as any).WebSocket = WebSocketMock as any;

// Mock fetch
global.fetch = () => Promise.resolve({
  ok: true,
  status: 200,
  json: () => Promise.resolve({}),
  text: () => Promise.resolve(''),
}) as any;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};

// Mock scrollTo
global.scrollTo = () => {};

// Suppress console errors/warnings in tests (optional)
const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('ReactDOM.render')) {
      return;
    }
    originalError.apply(console, args);
  };
});
afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
