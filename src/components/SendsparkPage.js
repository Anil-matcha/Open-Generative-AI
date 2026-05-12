import { createHeroSection } from "../lib/thumbnails.js";
export function SendsparkPage() {
  const element = document.createElement('div');
  element.className = 'w-full h-full relative';
  element.style.overflow = 'hidden';
  const heroBanner = createHeroSection('sendspark', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    element.appendChild(heroBanner);
    const textOverlay = document.createElement('div');
    textOverlay.className = 'absolute bottom-4 left-4 z-10';
    textOverlay.innerHTML = '<h1 class="text-2xl md:text-3xl font-bold text-white">Sendspark Workflow Studio</h1>';
    heroBanner.appendChild(textOverlay);
  }
  // Loading state
  const loadingContainer = document.createElement('div');
  loadingContainer.className = 'absolute inset-0 flex items-center justify-center bg-gray-900 z-10';
  loadingContainer.innerHTML = `
    <div class="text-center">
      <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-400">Loading Sendspark Workflow Studio...</p>
    </div>
  `;
  element.appendChild(loadingContainer);

  // Error state container
  const errorContainer = document.createElement('div');
  errorContainer.className = 'absolute inset-0 flex items-center justify-center bg-gray-900 z-10 hidden';
  errorContainer.innerHTML = `
    <div class="text-center max-w-md mx-auto p-6">
      <div class="text-red-500 mb-4">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold mb-2 text-white">Sendspark Unavailable</h3>
      <p class="text-gray-400 mb-4">The Sendspark application is currently unavailable. Please try again later.</p>
      <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors" onclick="location.reload()">
        Try Again
      </button>
    </div>
  `;
  element.appendChild(errorContainer);

  // Iframe container
  const iframe = document.createElement('iframe');
  iframe.src = '/apps/sendspark/';
  iframe.className = 'w-full h-full border-0';
  iframe.style.display = 'none';
  iframe.onload = () => {
    loadingContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    iframe.style.display = 'block';
  };
  iframe.onerror = () => {
    loadingContainer.style.display = 'none';
    errorContainer.classList.remove('hidden');
  };

  element.appendChild(iframe);

  // Auto-retry mechanism
  let retryCount = 0;
  const maxRetries = 3;
  const retryInterval = 5000; // 5 seconds

  const checkAvailability = () => {
    if (retryCount < maxRetries) {
      setTimeout(() => {
        const testIframe = document.createElement('iframe');
        testIframe.src = 'http://localhost:5175';
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

  // Start checking after initial error
  iframe.onerror = () => {
    loadingContainer.style.display = 'none';
    errorContainer.classList.remove('hidden');
    checkAvailability();
  };

  return element;
}