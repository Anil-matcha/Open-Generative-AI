import './style.css';
import './components/styles/header-mega-menu.css';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { initRouter, navigate } from './lib/router.js';
import { perfMonitor } from './lib/performance.js';
import { enhancedPerfMonitor } from './lib/enhanced-performance-monitor.js';
import { memoryLeakDetector } from './lib/memory-leak-detector.js';
import { mediaLoader } from './lib/media-loader.js';
import { performanceBudget } from './lib/performance-budget.js';
import { analytics } from './lib/analytics.js';
import { showToast } from './lib/loading.js';
import { generationService } from './lib/editor/generationService.js';
import { initializeAuthHardening } from './lib/auth-hardening.js';
import { initializeEnvironmentValidation } from './lib/environment-config.js';
import { initializePerformanceHardening } from './lib/performance-hardening.js';
import { initializeErrorHandling } from './lib/error-handling.js';
import { initializeSecurity } from './lib/security/index.js';
import { enforceHTTPS, validateEnvironment, generateCSPHeader } from './lib/security/index.js';
import { escapeHtml, safeHtml } from './lib/security.js';
import { initializeEnhancedMuAPI } from './lib/muapiEnhanced.js';
import { loadConfig } from './lib/muapiConfig.js';
import { initializeAIOptimizations } from './lib/services/aiIntegration.js';
import { LandingPage } from './components/landing/index.js';
// Track reported errors to prevent toast spam in development
if (typeof window !== 'undefined') {
  window.__reportedErrors = new Set();
}

// Show configuration warning banner if critical env vars missing
if (typeof document !== 'undefined') {
  const checkConfigAndShowBanner = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      const banner = document.createElement('div');
      banner.id = 'config-warning-banner';
      banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #dc2626; color: white; text-align: center; padding: 12px; z-index: 10000; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.15);';
      banner.innerHTML = `
        <strong>⚠️ Configuration Required:</strong> Supabase credentials are missing.
        Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.
        <button onclick="document.getElementById('config-warning-banner').remove();" style="margin-left: 12px; padding: 4px 12px; background: white; color: #dc2626; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Dismiss</button>
      `;
      document.body.insertBefore(banner, document.body.firstChild);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkConfigAndShowBanner);
  } else {
    checkConfigAndShowBanner();
  }
}
const app = document.querySelector('#app');
let contentArea;

// Router - navigate is imported from router.js via director.js
// Note: Navigation is handled via director.js which wraps the router's navigate

// Initialize environment validation
const envConfig = initializeEnvironmentValidation();

// Initialize authentication hardening
const authTools = initializeAuthHardening();
// Initialize security measures
// Initialize comprehensive security and error handling
// Initialize performance hardening
const performanceTools = initializePerformanceHardening();
const securityStatus = initializeSecurity();
initializeErrorHandling();
enforceHTTPS();
const envStatus = validateEnvironment();
console.log('[Security] Environment validated:', envStatus);

// Set CSP header if in browser environment
if (typeof document !== 'undefined') {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = generateCSPHeader();
  document.head.appendChild(meta);
}
// Make generation service available globally for embedded components
window.generationService = generationService;

console.log('[App] Starting initialization...');

// Track initialization performance
const initStart = performance.now();

// Initialize performance monitoring
window.enhancedPerfMonitor = enhancedPerfMonitor;
window.memoryLeakDetector = memoryLeakDetector;
window.mediaLoader = mediaLoader;
window.performanceBudget = performanceBudget;

// Initialize enhanced MuAPI system
const { validateConfig } = await import("./lib/muapiConfig.js");
console.log('[App] Initializing enhanced MuAPI...');
const muapiConfig = loadConfig();
initializeEnhancedMuAPI(muapiConfig).then(async (success) => {
  if (success) {
    console.log('[App] Enhanced MuAPI initialized successfully');
  // DISABLED:     showToast('Enhanced AI features enabled', 'success', 3000);

    // Initialize AI service optimizations after MuAPI is ready
    console.log('[App] Initializing AI service optimizations...');
    const aiResult = await initializeAIOptimizations();
    if (aiResult.success) {
      console.log('[App] AI optimizations enabled successfully');
  // DISABLED:       showToast('AI optimizations active', 'success', 2000);
    } else {
      console.warn('[App] AI optimizations failed to initialize:', aiResult.error);
  // DISABLED:       showToast('AI optimizations unavailable', 'warning', 3000);
    }
  } else {
    console.log('[App] Enhanced MuAPI initialization failed, using basic features');
  // DISABLED:     showToast('Using basic AI features', 'info', 3000);
  }
}).catch(error => {
  console.warn('[App] Enhanced MuAPI initialization error:', error);
  // DISABLED:   showToast('AI features unavailable', 'warning', 5000);
});

// Start memory leak detection in development
if (import.meta.env.DEV) {
  memoryLeakDetector.startDetection();

  // Add OpenHiggsfield service health checks
  setTimeout(() => {
    console.log('[Health Check] Running OpenHiggsfield service diagnostics...');

    // Check aiIntegration
    if (window.__openhiggsfield_aiIntegration) {
      console.log('✅ aiIntegration singleton initialized');
    } else {
      console.warn('⚠️ aiIntegration singleton not found');
    }

    // Check muapi instance
    if (window.muapi) {
      console.log('✅ muapi instance available globally');
    } else {
      console.warn('⚠️ muapi instance not available globally');
    }

    // Check enhanced performance monitor
    if (window.enhancedPerfMonitor) {
      console.log('✅ Enhanced performance monitor initialized');
    } else {
      console.warn('⚠️ Enhanced performance monitor not initialized');
    }

    console.log('[Health Check] Diagnostics complete');
  }, 2000);
}

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
  
  // Deduplicate error toasts (prevent spam)
  const errorKey = `${event.message}:${event.filename}:${event.lineno}`;
  if (!window.__reportedErrors.has(errorKey)) {
    window.__reportedErrors.add(errorKey);
  } else {
    return;
  }
  // Show error toast notification instead of full page crash
  //   showToast('Something went wrong. Please refresh the page.', 'error', 10000);
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
  // Deduplicate rejection toasts
  const rejKey = event.reason?.message || String(event.reason);
  if (!window.__reportedErrors.has(rejKey)) {
    window.__reportedErrors.add(rejKey);
  } else {
    return;
  }
  //   showToast('An operation failed. Please try again.', 'error', 5000);
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
  // DISABLED:   showToast('Connection restored', 'success', 3000);
});

window.addEventListener('offline', () => {
  // DISABLED:   showToast('You are offline. Some features may not work.', 'warning', 10000);
});

try {

  const app = document.querySelector('#app');
  if (!app) throw new Error('App container not found');
  
  app.innerHTML = '';
  
  // Determine initial page BEFORE building shell
  const path = window.location.pathname;
  const hash = window.location.hash;
  let initialPage = 'landing';
  
  if (path === '/' || path === '') {
    initialPage = 'landing';
  } else if (path.startsWith('/')) {
    initialPage = path.slice(1);
  }
  
  if (hash && hash.startsWith('#/')) {
    const hashPage = hash.slice(2);
    if (hashPage) initialPage = hashPage;
  }
  
  const studioParam = new URLSearchParams(window.location.search).get('studio');
  if (studioParam) initialPage = studioParam;
  
  // Landing page: full-page without app shell
  if (initialPage === 'landing') {
    const landingPage = LandingPage();
    app.appendChild(landingPage);
    console.log('[App] Landing page rendered (full-page mode)');
  } else {
    // Standard app shell for editor pages
    const header = Header((page) => navigate(page));
    const headerEl = header.element;
    const updateHeaderActive = header.updateActiveStates;
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
      updateHeaderActive(page);
      sidebar.dispatchEvent(new CustomEvent('route-changed', { detail: { page } }));
    });
    
    console.log('[App] App shell rendered, navigating to:', initialPage);
    navigate(initialPage);
  }
  
  // Track initialization time
  const initDuration = performance.now() - initStart;
  perfMonitor.trackPageLoad('initialization', initDuration);
  console.log(`[App] Initialized in ${initDuration.toFixed(2)}ms`);

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


