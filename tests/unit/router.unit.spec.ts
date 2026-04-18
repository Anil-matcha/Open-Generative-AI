import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';

// Mock DOM elements and browser APIs
const mockContentArea = {
  innerHTML: '',
  appendChild: vi.fn(),
  _cleanup: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  _originalCleanup: undefined as (() => void) | undefined
};

// Mock history API
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn()
};

// Mock window.location
const mockLocation = {
  hash: '',
  search: '',
  pathname: '/',
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000'
};

// Mock fetch for dynamic imports
global.fetch = vi.fn();

// Mock dynamic import
vi.mock('../../src/components/ImageStudio.js', () => ({
  ImageStudio: () => document.createElement('div')
}));

vi.mock('../../src/components/VideoStudio.js', () => ({
  VideoStudio: () => document.createElement('div')
}));

// Setup DOM mocks
Object.defineProperty(document, 'createElement', {
  writable: true,
  value: vi.fn((tag: string) => {
    const element = {
      className: '',
      innerHTML: '',
      textContent: '',
      style: {},
      appendChild: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      _cleanup: vi.fn(),
      tagName: tag.toUpperCase()
    };
    return element;
  })
});

Object.defineProperty(window, 'history', {
  value: mockHistory
});

Object.defineProperty(window, 'location', {
  value: mockLocation
});

// Mock the router module
vi.mock('../../src/lib/router.js', async () => {
  const actual = await vi.importActual('../../src/lib/router.js');

  // Mock pageLoaders for testing
  const mockLoaders = {
    timeline: () => Promise.resolve(document.createElement('div')),
    library: () => Promise.resolve(document.createElement('div')),
    settings: () => Promise.resolve(document.createElement('div')),
    explore: () => Promise.resolve(document.createElement('div')),
    invalid: () => Promise.reject(new Error('Page not found'))
  };

  return {
    ...actual,
    pageLoaders: mockLoaders,
    initRouter: vi.fn((container: any, callback: any) => {
      (global as any).contentArea = container;
      (global as any).onNavigateCallback = callback;
    }),
    navigate: vi.fn(async (page: string, params = {}) => {
      const loader = mockLoaders[page as keyof typeof mockLoaders];
      if (!loader) {
        throw new Error(`Unknown page: ${page}`);
      }

      const element = await loader();
      (global as any).currentPage = page;

      // Update URL
      const searchParams = new URLSearchParams(params).toString();
      const newUrl = searchParams ? `/?${searchParams}#/${page}` : `/#/${page}`;
      mockHistory.pushState({}, '', newUrl);

      return element;
    }),
    getCurrentPage: vi.fn(() => (global as any).currentPage || null)
  };
});

describe('Router Unit Tests', () => {
  let mockContainer: any;
  let mockCallback: Mock;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup test container
    mockContainer = {
      innerHTML: '',
      appendChild: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      _cleanup: vi.fn()
    };

    mockCallback = vi.fn();

    // Reset global state
    (global as any).contentArea = undefined;
    (global as any).onNavigateCallback = undefined;
    (global as any).currentPage = undefined;

    // Reset history mock
    mockHistory.pushState.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Router Initialization', () => {
    it('should initialize router with container and callback', async () => {
      const { initRouter } = await import('../../src/lib/router.js');

      initRouter(mockContainer, mockCallback);

      expect((global as any).contentArea).toBe(mockContainer);
      expect((global as any).onNavigateCallback).toBe(mockCallback);
    });

    it('should handle missing container gracefully', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      // Don't initialize router first
      const result = await navigate('timeline');

      // Should not throw, but may not work properly
      expect(result).toBeUndefined();
    });
  });

  describe('Route Navigation', () => {
    beforeEach(async () => {
      const { initRouter } = await import('../../src/lib/router.js');
      initRouter(mockContainer, mockCallback);
    });

    it('should navigate to valid routes', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      await navigate('timeline');
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/timeline');
      expect(mockCallback).toHaveBeenCalledWith('timeline');

      await navigate('library');
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/library');
      expect(mockCallback).toHaveBeenCalledWith('library');
    });

    it('should handle navigation with parameters', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      const params = { tab: 'videos', filter: 'recent' };
      await navigate('library', params);

      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/?tab=videos&filter=recent#/library'
      );
    });

    it('should prevent concurrent navigation', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      // Start first navigation
      const firstNav = navigate('timeline');

      // Try second navigation before first completes
      const secondNav = navigate('library');

      await Promise.all([firstNav, secondNav]);

      // Should only navigate once (to the first route)
      expect(mockHistory.pushState).toHaveBeenCalledTimes(1);
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/timeline');
    });

    it('should handle template routes', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      // Mock template studio import
      vi.doMock('../../src/components/TemplateStudio.js', () => ({
        TemplateStudio: (id: string) => {
          const div = document.createElement('div');
          div.textContent = `Template ${id}`;
          return div;
        }
      }));

      await navigate('template/123');

      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/template/123');
    });

    it('should handle invalid routes gracefully', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      // Mock console.error to avoid test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(navigate('invalid-route')).rejects.toThrow('Unknown page: invalid-route');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Route Map and URL Generation', () => {
    it('should map item names to routes correctly', async () => {
      const { getRouteForItem } = await import('../../src/lib/router.js');

      expect(getRouteForItem('Explore')).toBe('explore');
      expect(getRouteForItem('Image')).toBe('image');
      expect(getRouteForItem('Video')).toBe('video');
      expect(getRouteForItem('Vibe Motion')).toBe('effects');
      expect(getRouteForItem('Unknown Item')).toBe('unknown-item');
    });

    it('should generate correct URLs for routes', async () => {
      const { navigate } = await import('../../src/lib/router.js');
      const { initRouter } = await import('../../src/lib/router.js');

      initRouter(mockContainer, mockCallback);

      await navigate('timeline');
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/timeline');

      await navigate('library', { tab: 'videos' });
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/?tab=videos#/library');
    });
  });

  describe('Content Area Management', () => {
    beforeEach(async () => {
      const { initRouter } = await import('../../src/lib/router.js');
      initRouter(mockContainer, mockCallback);
    });

    it('should clear content area before navigation', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      mockContainer.innerHTML = '<div>Old content</div>';

      await navigate('timeline');

      expect(mockContainer.innerHTML).toBe('');
    });

    it('should show loading state during navigation', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      await navigate('timeline');

      // Verify loading element was created and added
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should cleanup previous components', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      // Mock element with cleanup method
      const mockElement = {
        _cleanup: vi.fn(),
        className: 'test-element'
      };

      mockContainer.querySelectorAll.mockReturnValue([mockElement]);

      await navigate('timeline');

      expect(mockElement._cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      // Mock element with failing cleanup
      const mockElement = {
        _cleanup: vi.fn(() => { throw new Error('Cleanup failed'); }),
        className: 'test-element'
      };

      mockContainer.querySelectorAll.mockReturnValue([mockElement]);

      // Mock console.warn
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await navigate('timeline');

      expect(consoleSpy).toHaveBeenCalledWith('[Router] Cleanup error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Current Page Tracking', () => {
    it('should track current page correctly', async () => {
      const { navigate, getCurrentPage, initRouter } = await import('../../src/lib/router.js');

      initRouter(mockContainer, mockCallback);

      expect(getCurrentPage()).toBeNull();

      await navigate('timeline');
      expect(getCurrentPage()).toBe('timeline');

      await navigate('library');
      expect(getCurrentPage()).toBe('library');
    });

    it('should handle navigation interruption correctly', async () => {
      const { navigate, getCurrentPage, initRouter } = await import('../../src/lib/router.js');

      initRouter(mockContainer, mockCallback);

      // Start navigation but interrupt it
      (global as any).isNavigating = true;
      (global as any).currentPage = 'interrupted';

      await navigate('timeline');

      // Should not change page if navigation was in progress
      expect(getCurrentPage()).toBe('interrupted');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const { initRouter } = await import('../../src/lib/router.js');
      initRouter(mockContainer, mockCallback);
    });

    it('should handle page loader errors', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Navigate to route that will fail
      await expect(navigate('invalid')).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Router] Failed to load page: invalid',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should create error UI for failed navigation', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      try {
        await navigate('invalid');
      } catch {
        // Error is expected
      }

      // Verify error element was created
      expect(document.createElement).toHaveBeenCalledWith('div');
    });

    it('should continue working after errors', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      // First navigation fails
      try {
        await navigate('invalid');
      } catch {
        // Expected
      }

      // Second navigation should still work
      await navigate('timeline');

      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/timeline');
    });
  });

  describe('Route Parameters and Query Strings', () => {
    beforeEach(async () => {
      const { initRouter } = await import('../../src/lib/router.js');
      initRouter(mockContainer, mockCallback);
    });

    it('should handle empty parameters', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      await navigate('timeline', {});

      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/timeline');
    });

    it('should encode special characters in parameters', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      await navigate('library', { query: 'hello world', filter: 'type=video' });

      const expectedUrl = '/?query=hello%20world&filter=type%3Dvideo#/library';
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', expectedUrl);
    });

    it('should handle array parameters', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      await navigate('explore', { tags: ['animation', 'motion'] });

      // URLSearchParams should handle array serialization
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/?tags=animation%2Cmotion#/explore'
      );
    });
  });

  describe('Navigation State Management', () => {
    beforeEach(async () => {
      const { initRouter } = await import('../../src/lib/router.js');
      initRouter(mockContainer, mockCallback);
    });

    it('should prevent navigation loops', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      // Mock callback that triggers navigation
      mockCallback.mockImplementation(() => {
        if ((global as any).currentPage === 'timeline') {
          navigate('library'); // This should be prevented
        }
      });

      await navigate('timeline');

      // Should only navigate once despite callback trying to navigate again
      expect(mockHistory.pushState).toHaveBeenCalledTimes(1);
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/timeline');
    });

    it('should handle rapid successive navigation', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      // Rapid navigation calls
      await Promise.all([
        navigate('timeline'),
        navigate('library'),
        navigate('settings')
      ]);

      // Should end up at the last route
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/settings');
    });

    it('should reset navigation state after completion', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      await navigate('timeline');

      // Navigation should be marked as complete
      expect((global as any).isNavigating).toBe(false);
    });
  });

    it('should handle missing container gracefully', async () => {
      const { navigate } = await import('../lib/router.js');

      // Don't initialize router first
      const result = await navigate('timeline');

      // Should not throw, but may not work properly
      expect(result).toBeUndefined();
    });
  });

  describe('Route Navigation', () => {
    beforeEach(async () => {
      const { initRouter } = await import('../lib/router.js');
      initRouter(mockContainer, mockCallback);
    });

    it('should navigate to valid routes', async () => {
      const { navigate } = await import('../lib/router.js');

      await navigate('timeline');
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/timeline');
      expect(mockCallback).toHaveBeenCalledWith('timeline');

      await navigate('library');
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/library');
      expect(mockCallback).toHaveBeenCalledWith('library');
    });

    it('should handle navigation with parameters', async () => {
      const { navigate } = await import('../lib/router.js');

      const params = { tab: 'videos', filter: 'recent' };
      await navigate('library', params);

      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/?tab=videos&filter=recent#/library'
      );
    });

    it('should prevent concurrent navigation', async () => {
      const { navigate } = await import('../lib/router.js');

      // Start first navigation
      const firstNav = navigate('timeline');

      // Try second navigation before first completes
      const secondNav = navigate('library');

      await Promise.all([firstNav, secondNav]);

      // Should only navigate once (to the first route)
      expect(mockHistory.pushState).toHaveBeenCalledTimes(1);
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/timeline');
    });

    it('should handle template routes', async () => {
      const { navigate } = await import('../lib/router.js');

      // Mock template studio import
      vi.doMock('../components/TemplateStudio.js', () => ({
        TemplateStudio: (id: string) => {
          const div = document.createElement('div');
          div.textContent = `Template ${id}`;
          return div;
        }
      }));

      await navigate('template/123');

      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/template/123');
    });

    it('should handle invalid routes gracefully', async () => {
      const { navigate } = await import('../lib/router.js');

      // Mock console.error to avoid test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(navigate('invalid-route')).rejects.toThrow('Unknown page: invalid-route');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Route Map and URL Generation', () => {
    it('should map item names to routes correctly', async () => {
      const { getRouteForItem } = await import('../lib/router.js');

      expect(getRouteForItem('Explore')).toBe('explore');
      expect(getRouteForItem('Image')).toBe('image');
      expect(getRouteForItem('Video')).toBe('video');
      expect(getRouteForItem('Vibe Motion')).toBe('effects');
      expect(getRouteForItem('Unknown Item')).toBe('unknown-item');
    });

    it('should generate correct URLs for routes', async () => {
      const { navigate } = await import('../lib/router.js');
      const { initRouter } = await import('../lib/router.js');

      initRouter(mockContainer, mockCallback);

      await navigate('timeline');
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/timeline');

      await navigate('library', { tab: 'videos' });
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/?tab=videos#/library');
    });
  });

  describe('Content Area Management', () => {
    beforeEach(async () => {
      const { initRouter } = await import('../lib/router.js');
      initRouter(mockContainer, mockCallback);
    });

    it('should clear content area before navigation', async () => {
      const { navigate } = await import('../lib/router.js');

      mockContainer.innerHTML = '<div>Old content</div>';

      await navigate('timeline');

      expect(mockContainer.innerHTML).toBe('');
    });

    it('should show loading state during navigation', async () => {
      const { navigate } = await import('../lib/router.js');

      await navigate('timeline');

      // Verify loading element was created and added
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should cleanup previous components', async () => {
      const { navigate } = await import('../lib/router.js');

      // Mock element with cleanup method
      const mockElement = {
        _cleanup: vi.fn(),
        className: 'test-element'
      };

      mockContainer.querySelectorAll.mockReturnValue([mockElement]);

      await navigate('timeline');

      expect(mockElement._cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const { navigate } = await import('../lib/router.js');

      // Mock element with failing cleanup
      const mockElement = {
        _cleanup: vi.fn(() => { throw new Error('Cleanup failed'); }),
        className: 'test-element'
      };

      mockContainer.querySelectorAll.mockReturnValue([mockElement]);

      // Mock console.warn
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await navigate('timeline');

      expect(consoleSpy).toHaveBeenCalledWith('[Router] Cleanup error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Current Page Tracking', () => {
    it('should track current page correctly', async () => {
      const { navigate, getCurrentPage, initRouter } = await import('../lib/router.js');

      initRouter(mockContainer, mockCallback);

      expect(getCurrentPage()).toBeNull();

      await navigate('timeline');
      expect(getCurrentPage()).toBe('timeline');

      await navigate('library');
      expect(getCurrentPage()).toBe('library');
    });

    it('should handle navigation interruption correctly', async () => {
      const { navigate, getCurrentPage, initRouter } = await import('../lib/router.js');

      initRouter(mockContainer, mockCallback);

      // Start navigation but interrupt it
      (global as any).isNavigating = true;
      (global as any).currentPage = 'interrupted';

      await navigate('timeline');

      // Should not change page if navigation was in progress
      expect(getCurrentPage()).toBe('interrupted');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const { initRouter } = await import('../lib/router.js');
      initRouter(mockContainer, mockCallback);
    });

    it('should handle page loader errors', async () => {
      const { navigate } = await import('../lib/router.js');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Navigate to route that will fail
      await expect(navigate('invalid')).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Router] Failed to load page: invalid',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should create error UI for failed navigation', async () => {
      const { navigate } = await import('../lib/router.js');

      try {
        await navigate('invalid');
      } catch {
        // Error is expected
      }

      // Verify error element was created
      expect(document.createElement).toHaveBeenCalledWith('div');
    });

    it('should continue working after errors', async () => {
      const { navigate } = await import('../lib/router.js');

      // First navigation fails
      try {
        await navigate('invalid');
      } catch {
        // Expected
      }

      // Second navigation should still work
      await navigate('timeline');

      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/timeline');
    });
  });

  describe('Route Parameters and Query Strings', () => {
    beforeEach(async () => {
      const { initRouter } = await import('../lib/router.js');
      initRouter(mockContainer, mockCallback);
    });

    it('should handle empty parameters', async () => {
      const { navigate } = await import('../lib/router.js');

      await navigate('timeline', {});

      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/timeline');
    });

    it('should encode special characters in parameters', async () => {
      const { navigate } = await import('../lib/router.js');

      await navigate('library', { query: 'hello world', filter: 'type=video' });

      const expectedUrl = '/?query=hello%20world&filter=type%3Dvideo#/library';
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', expectedUrl);
    });

    it('should handle array parameters', async () => {
      const { navigate } = await import('../lib/router.js');

      await navigate('explore', { tags: ['animation', 'motion'] });

      // URLSearchParams should handle array serialization
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/?tags=animation%2Cmotion#/explore'
      );
    });
  });

  describe('Navigation State Management', () => {
    beforeEach(async () => {
      const { initRouter } = await import('../lib/router.js');
      initRouter(mockContainer, mockCallback);
    });

    it('should prevent navigation loops', async () => {
      const { navigate } = await import('../lib/router.js');

      // Mock callback that triggers navigation
      mockCallback.mockImplementation(() => {
        if ((global as any).currentPage === 'timeline') {
          navigate('library'); // This should be prevented
        }
      });

      await navigate('timeline');

      // Should only navigate once despite callback trying to navigate again
      expect(mockHistory.pushState).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid successive navigation', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      // Rapid navigation calls
      await Promise.all([
        navigate('timeline'),
        navigate('library'),
        navigate('settings')
      ]);

      // Should end up at the last route
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/#/settings');
    });

    it('should reset navigation state after completion', async () => {
      const { navigate } = await import('../../src/lib/router.js');

      await navigate('timeline');

      // Navigation should be marked as complete
      expect((global as any).isNavigating).toBe(false);
    });
  });
});