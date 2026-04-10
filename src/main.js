import './style.css';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { initRouter, navigate } from './lib/router.js';
import { perfMonitor } from './lib/performance.js';
import { analytics } from './lib/analytics.js';
import { showToast } from './lib/loading.js';
import { generationService } from './lib/editor/generationService.js';
import { escapeHtml, safeHtml } from './lib/security.js';

// Make generation service available globally for embedded components
window.generationService = generationService;

console.log('[App] Starting initialization...');

// Track initialization performance
const initStart = performance.now();

// Global error handlers for uncaught exceptions
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
  
  // Don't show error UI for known benign errors
  if (event.message?.includes('ResizeObserver') || 
      event.message?.includes('passive event listener') ||
      event.message?.includes('non-passive')) {
    return;
  }
  
  // Track error
  analytics.trackError('uncaught_exception', event.message || 'Unknown error', {
    filename: event.filename,
    lineno: event.lineno
  });
  
  // Show error toast notification instead of full page crash
  showToast('Something went wrong. Please refresh the page.', 'error', 10000);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
  
  // Only show UI for significant errors (not API cancellations)
  if (event.reason?.name === 'AbortError' || 
      event.reason?.message?.includes('cancelled') ||
      event.reason?.message?.includes('Request cancelled')) {
    return;
  }
  
  analytics.trackError('unhandled_rejection', event.reason?.message || String(event.reason));
  showToast('An operation failed. Please try again.', 'error', 5000);
});

// Service worker registration for offline support (production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('[SW] Registration failed:', err);
      // Continue without service worker
    });
  });
}

// Visibility change handler - pause/resume operations when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden - pause non-essential operations
    console.log('[App] Page hidden, pausing operations');
  } else {
    // Page is visible again
    console.log('[App] Page visible, resuming operations');
  }
});

// Online/offline detection
window.addEventListener('online', () => {
  showToast('Connection restored', 'success', 3000);
});

window.addEventListener('offline', () => {
  showToast('You are offline. Some features may not work.', 'warning', 10000);
});

try {
  const app = document.querySelector('#app');
  if (!app) {
    throw new Error('App container not found');
  }

  app.innerHTML = '';

  const headerEl = Header((page) => navigate(page));
  app.appendChild(headerEl);

  const body = document.createElement('div');
  body.className = 'flex flex-1';

  const sidebar = Sidebar((page) => navigate(page));
  body.appendChild(sidebar);

  const contentArea = document.createElement('main');
  contentArea.id = 'content-area';
  contentArea.className = 'flex-1 relative w-full flex flex-col bg-app-bg';
  body.appendChild(contentArea);

  app.appendChild(body);

  initRouter(contentArea, (page) => {
    headerEl.dispatchEvent(new CustomEvent('route-changed', { detail: { page } }));
    sidebar.dispatchEvent(new CustomEvent('route-changed', { detail: { page } }));
  });

  // Track initialization time
  const initDuration = performance.now() - initStart;
  perfMonitor.trackPageLoad('initialization', initDuration);
  
  console.log(`[App] Initialized in ${initDuration.toFixed(2)}ms`);
  
  // Navigate to initial page
  // Check URL for deep linking
  const path = window.location.pathname;
  let initialPage = 'image';
  
  if (path === '/' || path === '') {
    initialPage = 'image';
  } else if (path.startsWith('/')) {
    initialPage = path.slice(1);
  }
  
  // Handle studio query param
  const studioParam = new URLSearchParams(window.location.search).get('studio');
  if (studioParam) {
    initialPage = studioParam;
  }
  
  console.log('[App] Navigating to initial page:', initialPage);
  navigate(initialPage);
  
} catch (error) {
  console.error('[App] Fatal initialization error:', error);
  
  // Track fatal error
  analytics.trackError('fatal_init', error.message);
  
  document.body.innerHTML = safeHtml(`
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff; flex-direction: column; padding: 20px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 20px;">😕</div>
      <h1 style="color: #ff4444; margin-bottom: 20px;">Application Error</h1>
      <p style="color: #aaa; max-width: 600px; margin-bottom: 20px;">${escapeHtml(error.message)}</p>
      <p style="color: #666; font-size: 12px; margin-bottom: 20px;">Please try refreshing the page. If the problem persists, clear your browser cache.</p>
      <button onclick="location.reload()" style="padding: 12px 24px; background: #3b82f6; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: bold;">Reload Page</button>
    </div>
  `);
}

window.addEventListener('navigate', (e) => {
  if (e.detail.page === 'settings') {
    import('./components/SettingsModal.js').then(({ SettingsModal }) => {
      document.body.appendChild(SettingsModal());
    });
  } else {
    navigate(e.detail.page);
  }
});

// Wrap navigate to add mobile menu cleanup - use a function wrapper instead of reassignment
const wrapNavigate = (navigateFn) => {
  return (page, params) => {
    // Remove any existing mobile menu before navigation
    const existingMobileMenu = document.querySelector('[data-mobile-menu]');
    if (existingMobileMenu) {
      existingMobileMenu.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => existingMobileMenu.remove(), 300);
    }
    return navigateFn(page, params);
  };
};

// Note: The wrapper is applied inside initRouter in the router module
// Expose navigate globally for debugging
window.navigate = navigate;


