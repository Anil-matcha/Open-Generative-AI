/**
 * Route Events
 * Event system for route changes
 */

export interface RouteChangeEvent extends CustomEvent {
  detail: {
    page: string;
    params?: Record<string, string>;
  };
}

/**
 * Dispatches a route change event
 */
export function dispatchRouteChange(element: HTMLElement, page: string, params?: Record<string, string>): void {
  const event = new CustomEvent('route-changed', {
    detail: { page, params },
    bubbles: true,
    composed: true,
  });
  element.dispatchEvent(event);
}

/**
 * Listens for route change events
 */
export function onRouteChange(element: HTMLElement, callback: (page: string, params?: Record<string, string>) => void): () => void {
  const handler = (event: Event) => {
    try {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as { page?: string; params?: Record<string, string> } | undefined;
      if (detail && typeof detail.page === 'string') {
        callback(detail.page, detail.params);
      } else {
        // Malformed event: call callback with undefined
        callback(undefined as any, undefined);
      }
    } catch (error) {
      // Swallow errors to prevent breaking the event system
      console.warn('[RouteEvents] Handler error:', error);
    }
  };

  element.addEventListener('route-changed', handler);

  let removed = false;
  return () => {
    if (!removed) {
      element.removeEventListener('route-changed', handler);
      removed = true;
    }
  };
}
