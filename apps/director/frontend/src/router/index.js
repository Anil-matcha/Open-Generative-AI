/**
 * Vanilla JS Router for Director App
 * Handles navigation between timeline, library, and settings pages
 * Uses History API with hash-based routing for simplicity
 */

// Route configuration
const routes = {
  '/timeline': {
    init: async () => {
      try {
        const { initDirector } = await import('../director.js');
        if (typeof initDirector === 'function') {
          initDirector();
          return () => {}; // No cleanup needed currently
        }
      } catch (error) {
        console.error('[Router] Failed to load director module:', error);
        throw error;
      }
    }
  },
  '/library': {
    init: async () => {
      const container = document.getElementById('app');
      if (!container) return () => {};

      container.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-app-bg">
          <div class="text-center">
            <h1 class="text-3xl font-bold text-white mb-4">Media Library</h1>
            <p class="text-secondary">Browse and manage your media assets.</p>
          </div>
        </div>
      `;
      return () => {};
    }
  },
  '/settings': {
    init: async () => {
      const container = document.getElementById('app');
      if (!container) return () => {};

      container.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-app-bg">
          <div class="text-center">
            <h1 class="text-3xl font-bold text-white mb-4">Settings</h1>
            <p class="text-secondary">Configure your editor preferences.</p>
          </div>
        </div>
      `;
      return () => {};
    }
  }
};

// Current route cleanup/dispose function
let currentDispose = null;

/**
 * Navigate to a route
 * @param {string} path - Route path (e.g., '/timeline')
 * @param {boolean} replace - If true, replace history instead of pushing
 */
export function navigate(path, replace = false) {
  const url = new URL(path, window.location.origin);
  const hashPath = `#${path}`;

  if (replace) {
    window.history.replaceState(null, '', hashPath);
  } else {
    window.history.pushState(null, '', hashPath);
  }

  handleRouteChange();
}

/**
 * Handle route changes (navigation and popstate)
 */
async function handleRouteChange() {
  const hash = window.location.hash.slice(1) || '/timeline';
  const path = hash.startsWith('/') ? hash : `/${hash}`;

  // Clean up previous route if dispose function exists
  if (currentDispose && typeof currentDispose === 'function') {
    try {
      currentDispose();
    } catch (error) {
      console.warn('[Router] Error cleaning up previous route:', error);
    }
    currentDispose = null;
  }

  // Find matching route (exact match)
  const route = routes[path] || routes['/timeline'];

  try {
    const disposeFn = await route.init();
    currentDispose = disposeFn || (() => {});
  } catch (error) {
    console.error('[Router] Failed to initialize route:', path, error);
    // Show error fallback
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-app-bg">
          <div class="text-center text-red-500">
            <h1 class="text-2xl font-bold mb-4">Route Error</h1>
            <p>Failed to load ${path}</p>
          </div>
        </div>
      `;
    }
  }
}

// Listen for browser back/forward buttons
window.addEventListener('popstate', handleRouteChange);

// Initial route on page load
document.addEventListener('DOMContentLoaded', () => {
  handleRouteChange();
});

// Export router API
export { routes, navigate as default };
