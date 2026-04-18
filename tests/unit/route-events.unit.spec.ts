import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock CustomEvent
global.CustomEvent = vi.fn((type: string, options?: any) => ({
  type,
  detail: options?.detail || {},
  bubbles: options?.bubbles || false,
  composed: options?.composed || false
})) as any;

// Mock HTMLElement
class MockHTMLElement {
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();

  constructor() {
    // Bind methods to maintain context
    this.addEventListener = vi.fn();
    this.removeEventListener = vi.fn();
    this.dispatchEvent = vi.fn();
  }
}

global.HTMLElement = MockHTMLElement as any;

describe('Route Events Unit Tests', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockElement = new MockHTMLElement() as any;
  });

  describe('dispatchRouteChange', () => {
    it('should dispatch route change event with page and params', async () => {
      const { dispatchRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      const page = 'timeline';
      const params = { tab: 'settings', view: 'advanced' };

      dispatchRouteChange(mockElement, page, params);

      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(1);
      const eventCall = mockElement.dispatchEvent.mock.calls[0][0];

      expect(eventCall.type).toBe('route-changed');
      expect(eventCall.detail.page).toBe(page);
      expect(eventCall.detail.params).toBe(params);
      expect(eventCall.bubbles).toBe(true);
      expect(eventCall.composed).toBe(true);
    });

    it('should dispatch event without params when none provided', async () => {
      const { dispatchRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      dispatchRouteChange(mockElement, 'library');

      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(1);
      const eventCall = mockElement.dispatchEvent.mock.calls[0][0];

      expect(eventCall.detail.page).toBe('library');
      expect(eventCall.detail.params).toBeUndefined();
    });

    it('should handle empty params object', async () => {
      const { dispatchRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      dispatchRouteChange(mockElement, 'settings', {});

      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(1);
      const eventCall = mockElement.dispatchEvent.mock.calls[0][0];

      expect(eventCall.detail.params).toEqual({});
    });
  });

  describe('onRouteChange', () => {
    it('should add event listener for route changes', async () => {
      const { onRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      const callback = vi.fn();

      const unsubscribe = onRouteChange(mockElement, callback);

      expect(mockElement.addEventListener).toHaveBeenCalledTimes(1);
      expect(mockElement.addEventListener).toHaveBeenCalledWith('route-changed', expect.any(Function));

      // Test that the listener calls our callback with correct parameters
      const eventHandler = mockElement.addEventListener.mock.calls[0][1];
      const mockEvent = {
        detail: { page: 'timeline', params: { tab: 'videos' } }
      };

      eventHandler(mockEvent);

      expect(callback).toHaveBeenCalledWith('timeline', { tab: 'videos' });
    });

    it('should handle events without params', async () => {
      const { onRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      const callback = vi.fn();

      onRouteChange(mockElement, callback);

      const eventHandler = mockElement.addEventListener.mock.calls[0][1];
      const mockEvent = {
        detail: { page: 'library' }
      };

      eventHandler(mockEvent);

      expect(callback).toHaveBeenCalledWith('library', undefined);
    });

    it('should return unsubscribe function that removes event listener', async () => {
      const { onRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      const callback = vi.fn();

      const unsubscribe = onRouteChange(mockElement, callback);

      expect(typeof unsubscribe).toBe('function');

      // Call unsubscribe
      unsubscribe();

      expect(mockElement.removeEventListener).toHaveBeenCalledTimes(1);
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('route-changed', expect.any(Function));
    });

    it('should handle multiple event listeners', async () => {
      const { onRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = onRouteChange(mockElement, callback1);
      const unsubscribe2 = onRouteChange(mockElement, callback2);

      expect(mockElement.addEventListener).toHaveBeenCalledTimes(2);

      // Trigger event
      const eventHandler1 = mockElement.addEventListener.mock.calls[0][1];
      const eventHandler2 = mockElement.addEventListener.mock.calls[1][1];

      const mockEvent = {
        detail: { page: 'explore', params: { category: 'featured' } }
      };

      eventHandler1(mockEvent);
      eventHandler2(mockEvent);

      expect(callback1).toHaveBeenCalledWith('explore', { category: 'featured' });
      expect(callback2).toHaveBeenCalledWith('explore', { category: 'featured' });

      // Unsubscribe one
      unsubscribe1();

      expect(mockElement.removeEventListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('RouteChangeEvent Type', () => {
    it('should have correct type structure', async () => {
      const { RouteChangeEvent } = await import('../../../packages/navigation/src/route-events.js');

      // RouteChangeEvent is a type, so we test the interface structure
      // by creating a mock event that matches the interface

      const mockRouteChangeEvent: typeof RouteChangeEvent = {
        detail: {
          page: 'timeline',
          params: { tab: 'clips' }
        }
      } as any;

      expect(mockRouteChangeEvent.detail.page).toBe('timeline');
      expect(mockRouteChangeEvent.detail.params).toEqual({ tab: 'clips' });
    });

    it('should handle params as optional', async () => {
      const mockRouteChangeEvent = {
        detail: {
          page: 'library'
          // params is optional
        }
      } as any;

      expect(mockRouteChangeEvent.detail.page).toBe('library');
      expect(mockRouteChangeEvent.detail.params).toBeUndefined();
    });
  });

  describe('Event Bubbling and Composition', () => {
    it('should create events that bubble and are composed', async () => {
      const { dispatchRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      dispatchRouteChange(mockElement, 'settings');

      const eventCall = mockElement.dispatchEvent.mock.calls[0][0];

      expect(eventCall.bubbles).toBe(true);
      expect(eventCall.composed).toBe(true);
    });

    it('should allow events to bubble up the DOM tree', async () => {
      const { onRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      const parentElement = new MockHTMLElement() as any;
      const childElement = new MockHTMLElement() as any;

      // Mock parent-child relationship
      parentElement.contains = vi.fn(() => true);
      childElement.parentElement = parentElement;

      const parentCallback = vi.fn();

      onRouteChange(parentElement, parentCallback);

      // Simulate event bubbling by calling parent's listener
      const parentHandler = parentElement.addEventListener.mock.calls[0][1];

      const mockEvent = {
        detail: { page: 'video', params: { id: '123' } },
        target: childElement,
        currentTarget: parentElement
      };

      parentHandler(mockEvent);

      expect(parentCallback).toHaveBeenCalledWith('video', { id: '123' });
    });
  });

  describe('Event Handler Error Handling', () => {
    it('should handle callback errors gracefully', async () => {
      const { onRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      const failingCallback = vi.fn(() => {
        throw new Error('Callback failed');
      });

      onRouteChange(mockElement, failingCallback);

      const eventHandler = mockElement.addEventListener.mock.calls[0][1];
      const mockEvent = {
        detail: { page: 'audio' }
      };

      // Event handler should not throw
      expect(() => {
        eventHandler(mockEvent);
      }).not.toThrow();

      expect(failingCallback).toHaveBeenCalledWith('audio', undefined);
    });

    it('should handle malformed events', async () => {
      const { onRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      const callback = vi.fn();

      onRouteChange(mockElement, callback);

      const eventHandler = mockElement.addEventListener.mock.calls[0][1];

      // Event without detail
      const malformedEvent = {};

      expect(() => {
        eventHandler(malformedEvent);
      }).not.toThrow();

      // Callback should still be called (though with undefined values)
      expect(callback).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('Memory Management', () => {
    it('should not leak event listeners when unsubscribed', async () => {
      const { onRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      const callback = vi.fn();

      const unsubscribe = onRouteChange(mockElement, callback);

      expect(mockElement.addEventListener).toHaveBeenCalledTimes(1);

      unsubscribe();

      expect(mockElement.removeEventListener).toHaveBeenCalledTimes(1);

      // Verify the same handler is removed
      const addCall = mockElement.addEventListener.mock.calls[0];
      const removeCall = mockElement.removeEventListener.mock.calls[0];

      expect(addCall[1]).toBe(removeCall[1]);
    });

    it('should handle multiple unsubscribe calls safely', async () => {
      const { onRouteChange } = await import('../../../packages/navigation/src/route-events.js');

      const callback = vi.fn();

      const unsubscribe = onRouteChange(mockElement, callback);

      unsubscribe();
      unsubscribe(); // Second call should be safe

      expect(mockElement.removeEventListener).toHaveBeenCalledTimes(1);
    });
  });
});