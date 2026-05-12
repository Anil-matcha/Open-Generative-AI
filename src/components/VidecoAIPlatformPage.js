import { createSecureIframe } from "../lib/security/index.js";
export function VidecoAIPlatformPage() {
  const element = document.createElement('div');
  element.className = 'w-full h-full relative';
  element.style.overflow = 'hidden';

  // Loading state
  const loadingContainer = document.createElement('div');
  loadingContainer.className = 'absolute inset-0 flex items-center justify-center bg-gray-50 z-10';
  loadingContainer.innerHTML = `
    <div class="text-center">
      <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-secondary">Loading Videco AI Platform...</p>
    </div>
  `;
  element.appendChild(loadingContainer);

  // Error state container
  const errorContainer = document.createElement('div');
  errorContainer.className = 'absolute inset-0 flex items-center justify-center bg-gray-50 z-10 hidden';
  errorContainer.innerHTML = `
    <div class="text-center max-w-md mx-auto p-6">
      <div class="text-red-500 mb-4">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold mb-2">Videco AI Platform Unavailable</h3>
      <p class="text-secondary mb-4">The Videco AI Platform application is currently unavailable. Please try again later.</p>
      <button class="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors" onclick="location.reload()">
        Try Again
      </button>
    </div>
  `;
  element.appendChild(errorContainer);

  // Iframe container
  const iframe = document.createElement('iframe');
  iframe.src = '/apps/videco-ai-platform/';
  iframe.className = 'w-full h-full border-0';
  iframe.style.display = 'none';
  let hasLoaded = false;
  iframe.onload = () => {
    console.log('VidecoAIPlatform iframe loaded successfully');
    hasLoaded = true;
    loadingContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    iframe.style.display = 'block';
  };
  iframe.onerror = (event) => {
    console.error('VidecoAIPlatform iframe ERROR event fired:', event, Date.now());
    if (!hasLoaded) {
      loadingContainer.style.display = 'none';
      errorContainer.classList.remove('hidden');
    }
  };

  element.appendChild(iframe);

  // Development-only auto-retry mechanism
  if (import.meta.env.DEV) {
    let retryCount = 0;
    const maxRetries = 3;
    const retryInterval = 5000; // 5 seconds

    const checkAvailability = () => {
      if (retryCount < maxRetries) {
        setTimeout(() => {
          const testIframe = createSecureIframe('http://localhost:3002');
          testIframe.src = 'http://localhost:3002';
          testIframe.style.display = 'none';
          testIframe.onload = () => {
            location.reload(); // Reload to show the iframe
          };
          testIframe.onerror = () => {
            retryCount++;
            checkAvailability();
          };
          document.body.appendChild(testIframe);
          setTimeout(() => document.body.removeChild(testIframe), 1000);
        }, retryInterval);
      }
    };

    iframe.onerror = () => {
      loadingContainer.style.display = 'none';
      errorContainer.classList.remove('hidden');
      checkAvailability();
    };
  }

  return element;
}
