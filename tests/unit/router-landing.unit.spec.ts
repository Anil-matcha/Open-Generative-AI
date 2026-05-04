import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DOM elements and browser APIs
const mockContentArea = {
  innerHTML: '',
  appendChild: vi.fn(),
  _cleanup: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  _originalCleanup: undefined as (() => void) | undefined
};

global.document = {
  createElement: vi.fn(() => mockContentArea),
  querySelector: vi.fn(() => null),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
} as any;

describe('Landing Page Router Integration', () => {
  let mockContainer: any;
  let mockCallback: any;

  beforeEach(() => {
    mockContainer = { ...mockContentArea };
    mockCallback = vi.fn();
    vi.clearAllMocks();
  });

  describe('Route Navigation to Landing', () => {
    it('should navigate to landing page without errors', async () => {
      const { initRouter, navigate } = await import('../../src/lib/router.js');
      initRouter(mockContainer, mockCallback);
      await expect(navigate('landing')).resolves.not.toThrow();
    });

    it('should call the navigation callback with landing page', async () => {
      const { initRouter, navigate } = await import('../../src/lib/router.js');
      initRouter(mockContainer, mockCallback);
      await navigate('landing');
      expect(mockCallback).toHaveBeenCalledWith('landing');
    });

    it('should update URL hash to #/landing', async () => {
      const { initRouter, navigate } = await import('../../src/lib/router.js');
      initRouter(mockContainer, mockCallback);
      await navigate('landing');
      expect(window.location.hash).toBe('#/landing');
    });

    it('should load landing page component into content area', async () => {
      const { initRouter, navigate } = await import('../../src/lib/router.js');
      initRouter(mockContainer, mockCallback);
      await navigate('landing');
      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should handle navigation away from landing and back', async () => {
      const { initRouter, navigate } = await import('../../src/lib/router.js');
      initRouter(mockContainer, mockCallback);
      await navigate('image');
      await navigate('landing');
      expect(mockCallback).toHaveBeenCalledWith('landing');
    });
  });
});
