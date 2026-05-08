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

// Mock Canvas 2D context
const mockCanvasContext2D = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(100),
    width: 10,
    height: 10
  })),
  putImageData: vi.fn(),
  createLinearGradient: vi.fn(),
  createRadialGradient: vi.fn(),
  createPattern: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: true
};

HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function(this: HTMLCanvasElement, contextId: string) {
  if (contextId === '2d') {
    return mockCanvasContext2D;
  }
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

// Mock toBlob method
HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  const blob = new Blob(['mock-image-data'], { type: 'image/png' });
  callback(blob);
});

// Mock toDataURL method
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mockImageData');

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(() => ({
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    result: {
      createObjectStore: vi.fn(() => ({
        createIndex: vi.fn()
      })),
      objectStoreNames: {
        contains: vi.fn(() => false)
      },
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          put: vi.fn(() => ({ onsuccess: null, onerror: null })),
          get: vi.fn(() => ({ onsuccess: null, onerror: null, result: null })),
          delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
          openCursor: vi.fn(() => ({ onsuccess: null, onerror: null, result: null })),
          getAll: vi.fn(() => ({ onsuccess: null, onerror: null, result: [] })),
          clear: vi.fn(() => ({ onsuccess: null, onerror: null }))
        }))
      }))
    }
  })),
  deleteDatabase: vi.fn()
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
});

// Mock requestAnimationFrame and cancelAnimationFrame
window.requestAnimationFrame = window.requestAnimationFrame || ((callback) => setTimeout(callback, 16));
window.cancelAnimationFrame = window.cancelAnimationFrame || ((id) => clearTimeout(id));