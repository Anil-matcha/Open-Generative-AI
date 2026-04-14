/**
 * Comprehensive Error Handling Service
 * Categorizes errors, provides user-friendly messages, and implements retry logic
 */

import { monitoringService } from '../monitoring/monitoringService.js';

export class ErrorHandler {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffMultiplier: 2
    };
    
    this.errorCategories = {
      NETWORK: 'network',
      AUTHENTICATION: 'authentication', 
      AUTHORIZATION: 'authorization',
      VALIDATION: 'validation',
      SERVER: 'server',
      CLIENT: 'client',
      STORAGE: 'storage',
      PERMISSION: 'permission'
    };
  }

  /**
   * Categorize an error based on its properties
   * @param {Error|Object} error - The error to categorize
   * @returns {string} Error category
   */
  categorizeError(error) {
    if (!error) return this.errorCategories.CLIENT;

    // Network errors
    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      return this.errorCategories.NETWORK;
    }

    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return this.errorCategories.NETWORK;
    }

    // Authentication errors
    if (error.status === 401 || error.message?.includes('unauthorized') || error.message?.includes('token')) {
      return this.errorCategories.AUTHENTICATION;
    }

    // Authorization errors
    if (error.status === 403 || error.message?.includes('forbidden') || error.message?.includes('permission')) {
      return this.errorCategories.PERMISSION;
    }

    // Validation errors
    if (error.status === 400 || error.message?.includes('validation') || error.message?.includes('invalid')) {
      return this.errorCategories.VALIDATION;
    }

    // Server errors
    if (error.status >= 500 || error.message?.includes('server')) {
      return this.errorCategories.SERVER;
    }

    // Storage errors
    if (error.message?.includes('storage') || error.message?.includes('quota')) {
      return this.errorCategories.STORAGE;
    }

    // Default to client error
    return this.errorCategories.CLIENT;
  }

  /**
   * Get user-friendly error message
   * @param {Error|Object} error - The error
   * @param {string} context - Context where error occurred
   * @returns {Object} User-friendly error info
   */
  getUserFriendlyMessage(error, context = '') {
    const category = this.categorizeError(error);
    const messages = {
      [this.errorCategories.NETWORK]: {
        title: 'Connection Problem',
        message: 'Unable to connect to our servers. Please check your internet connection and try again.',
        action: 'Retry',
        icon: 'wifi-off'
      },
      [this.errorCategories.AUTHENTICATION]: {
        title: 'Authentication Required',
        message: 'Your session has expired. Please sign in again to continue.',
        action: 'Sign In',
        icon: 'log-in'
      },
      [this.errorCategories.PERMISSION]: {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        action: 'OK',
        icon: 'shield-x'
      },
      [this.errorCategories.VALIDATION]: {
        title: 'Invalid Input',
        message: 'Please check your input and try again.',
        action: 'OK',
        icon: 'alert-triangle'
      },
      [this.errorCategories.SERVER]: {
        title: 'Server Error',
        message: 'We\'re experiencing technical difficulties. Our team has been notified.',
        action: 'Retry',
        icon: 'server-crash'
      },
      [this.errorCategories.STORAGE]: {
        title: 'Storage Issue',
        message: 'There was a problem saving your data. Please try again.',
        action: 'Retry',
        icon: 'hard-drive'
      },
      [this.errorCategories.CLIENT]: {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please refresh the page and try again.',
        action: 'Refresh',
        icon: 'alert-circle'
      }
    };

    const friendly = messages[category] || messages[this.errorCategories.CLIENT];
    
    return {
      ...friendly,
      category,
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
      recoverable: this.isRecoverable(category)
    };
  }

  /**
   * Check if an error category is recoverable
   * @param {string} category - Error category
   * @returns {boolean} Whether error is recoverable
   */
  isRecoverable(category) {
    const recoverableCategories = [
      this.errorCategories.NETWORK,
      this.errorCategories.SERVER,
      this.errorCategories.STORAGE
    ];
    
    return recoverableCategories.includes(category);
  }

  /**
   * Execute function with retry logic
   * @param {Function} fn - Function to execute
   * @param {Object} options - Retry options
   * @returns {Promise} Result of function execution
   */
  async withRetry(fn, options = {}) {
    const config = { ...this.retryConfig, ...options };
    let lastError;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        const category = this.categorizeError(error);
        
        // Don't retry non-recoverable errors
        if (!this.isRecoverable(category)) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === config.maxRetries) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );
        
        console.warn(`[ErrorHandler] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
        
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Delay execution for specified milliseconds
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle error globally
   * @param {Error|Object} error - The error
   * @param {string} context - Context where error occurred
   * @param {Object} options - Handling options
   */
  handleError(error, context = '', options = {}) {
    const friendlyError = this.getUserFriendlyMessage(error, context);
    
    // Track error with monitoring service
    monitoringService.trackError('application_error', {
      category: friendlyError.category,
      message: friendlyError.message,
      context,
      recoverable: friendlyError.recoverable,
      stack: error.stack,
      originalMessage: error.message
    });

    // Log error for monitoring
    console.error(`[ErrorHandler] ${context}:`, {
      category: friendlyError.category,
      message: friendlyError.message,
      originalError: error,
      recoverable: friendlyError.recoverable,
      timestamp: friendlyError.timestamp
    });

    // Track error for analytics if enabled
    if (options.track !== false) {
      this.trackError(friendlyError, context);
    }

    // Show user notification if enabled
    if (options.notify !== false) {
      this.showErrorNotification(friendlyError);
    }

    return friendlyError;
  }

  /**
   * Show error notification to user
   * @param {Object} friendlyError - User-friendly error info
   */
  showErrorNotification(friendlyError) {
    // Import showToast dynamically to avoid circular dependencies
    import('../loading.js').then(({ showToast }) => {
      const toastType = friendlyError.category === this.errorCategories.AUTHENTICATION ? 'warning' : 'error';
      const duration = friendlyError.recoverable ? 5000 : 10000;
      
      showToast(friendlyError.message, toastType, duration);
    }).catch(err => {
      console.warn('[ErrorHandler] Could not show error notification:', err);
    });
  }

  /**
   * Track error for analytics
   * @param {Object} friendlyError - User-friendly error info
   * @param {string} context - Error context
   */
  trackError(friendlyError, context) {
    try {
      // Check if analytics is available
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: `${context}: ${friendlyError.message}`,
          fatal: !friendlyError.recoverable
        });
      }
      
      // Could also send to error monitoring service like Sentry
      if (window.Sentry) {
        window.Sentry.captureException(friendlyError.originalError, {
          tags: {
            category: friendlyError.category,
            context: context,
            recoverable: friendlyError.recoverable
          }
        });
      }
    } catch (err) {
      console.warn('[ErrorHandler] Error tracking failed:', err);
    }
  }

  /**
   * Create error boundary for components
   * @param {Function} componentFn - Component function to wrap
   * @param {Object} fallbackProps - Fallback component props
   * @returns {Function} Wrapped component function
   */
  withErrorBoundary(componentFn, fallbackProps = {}) {
    return (...args) => {
      try {
        return componentFn(...args);
      } catch (error) {
        console.error('[ErrorBoundary] Component error:', error);
        
        const fallback = document.createElement('div');
        fallback.className = fallbackProps.className || 'w-full h-full flex items-center justify-center bg-bg-panel border border-red-200 rounded-lg';
        
        fallback.innerHTML = `
          <div class="text-center p-6">
            <div class="w-12 h-12 mx-auto mb-4 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-text-primary mb-2">Something went wrong</h3>
            <p class="text-text-muted mb-4">This component encountered an error and couldn't load properly.</p>
            <button class="px-4 py-2 bg-color-primary text-black rounded-lg hover:bg-color-primary-hover transition-colors" onclick="location.reload()">
              Reload Page
            </button>
          </div>
        `;
        
        return fallback;
      }
    };
  }

  /**
   * Validate input data
   * @param {any} data - Data to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} Validation result
   */
  validateInput(data, schema) {
    const errors = [];
    
    // Basic validation - can be enhanced with proper JSON schema validation
    if (schema.required && (!data || data === '')) {
      errors.push('This field is required');
    }
    
    if (schema.type && typeof data !== schema.type) {
      errors.push(`Expected type ${schema.type}, got ${typeof data}`);
    }
    
    if (schema.maxLength && data && data.length > schema.maxLength) {
      errors.push(`Maximum length is ${schema.maxLength} characters`);
    }
    
    if (schema.pattern && data && !new RegExp(schema.pattern).test(data)) {
      errors.push('Invalid format');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();
