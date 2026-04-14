// Global test setup for Vitest
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock browser APIs
const mockIntersectionObserver = class IntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
};

const mockResizeObserver = class ResizeObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
};

Object.defineProperty(window, 'IntersectionObserver', {
  value: mockIntersectionObserver,
  configurable: true,
  writable: true,
});

Object.defineProperty(window, 'ResizeObserver', {
  value: mockResizeObserver,
  configurable: true,
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock WebGL context
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function(this: HTMLCanvasElement, contextId: string) {
  if (contextId === 'webgl' || contextId === 'experimental-webgl') {
    return {
      canvas: this,
      drawingBufferWidth: this.width,
      drawingBufferHeight: this.height,
      getParameter: vi.fn(),
      // ... other WebGL methods
    };
  }
  return null;
});

// Mock requestAnimationFrame and cancelAnimationFrame
window.requestAnimationFrame = window.requestAnimationFrame || ((callback) => setTimeout(callback, 16));
window.cancelAnimationFrame = window.cancelAnimationFrame || ((id) => clearTimeout(id));