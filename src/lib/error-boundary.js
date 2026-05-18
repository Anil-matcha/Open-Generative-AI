/**
 * Error Boundary Component
 * Catches and handles errors gracefully in React components
 */
export class ErrorBoundary extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.error = null;
    this.hasError = false;
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['error'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'error' && newValue) {
      this.hasError = true;
      this.error = JSON.parse(newValue);
      this.render();
    }
  }

  render() {
    if (!this.shadowRoot) return;

    if (this.hasError) {
      this.shadowRoot.innerHTML = `
        <style>
          .error-boundary {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            background: #fee;
            border: 2px solid #fcc;
            border-radius: 8px;
            padding: 20px;
            margin: 10px;
            flex-direction: column;
            text-align: center;
          }
          .error-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          .error-title {
            color: #c33;
            margin-bottom: 8px;
            font-weight: bold;
          }
          .error-message {
            color: #666;
            margin-bottom: 16px;
            font-family: monospace;
            font-size: 12px;
          }
          .retry-btn {
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
          }
          .retry-btn:hover {
            background: #2563eb;
          }
        </style>
        <div class="error-boundary">
          <div class="error-icon">⚠️</div>
          <div class="error-title">Component Error</div>
          <div class="error-message">${this.error?.message || 'An unexpected error occurred'}</div>
          <button class="retry-btn" onclick="location.reload()">Reload Page</button>
        </div>
      `;
    } else {
      this.shadowRoot.innerHTML = '<slot></slot>';
    }
  }
}

// Register the error boundary
customElements.define('error-boundary', ErrorBoundary);

/**
 * Wrap a component function with error boundary
 */
export function withErrorBoundary(ComponentFunction, componentName = 'Component') {
  return function(...args) {
    try {
      return ComponentFunction(...args);
    } catch (error) {
      console.error(`[ErrorBoundary] ${componentName} failed:`, error);

      // Create error boundary element
      const boundary = document.createElement('error-boundary');
      boundary.setAttribute('error', JSON.stringify({
        message: `${componentName}: ${error.message}`,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }));

      return boundary;
    }
  };
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandling() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('[GlobalErrorHandler] Uncaught error:', event.error);

    // Show toast notification instead of crashing
    if (window.showToast) {
      window.
    }

    // Don't prevent default - let other handlers run
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[GlobalErrorHandler] Unhandled promise rejection:', event.reason);

    // Only show for significant errors
    if (event.reason?.name !== 'AbortError' && !event.reason?.message?.includes('cancelled')) {
      if (window.showToast) {
        window.
      }
    }
  });
}