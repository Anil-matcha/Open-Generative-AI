/**
 * Error Boundary Service - Wraps async operations with error handling
 */
export class ErrorBoundary {
  constructor(options = {}) {
    this.serviceName = options.service || 'Service';
    this.handlers = new Map();
    this.defaultHandler = null;
  }
  
  /**
   * Wrap a function with error boundary
   */
  wrap(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handle(error, { args, fn });
        throw error;
      }
    };
  }
  
  /**
   * Execute with error boundary
   */
  async execute(fn, context = {}) {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      throw error;
    }
  }
  
  /**
   * Handle error
   */
  handle(error, context = {}) {
    const formatted = {
      error,
      message: error.message || String(error),
      service: this.serviceName,
      context,
      timestamp: Date.now()
    };
    
    // Call custom handler if registered
    if (this.handlers.has('global')) {
      this.handlers.get('global')(formatted);
    }
    
    // Call default handler
    if (this.defaultHandler) {
      this.defaultHandler(formatted);
    } else {
      console.error(`[${this.serviceName}]`, error);
    }
    
    // Record error
    this.recordError(formatted);
  }
  
  /**
   * Register error handler
   */
  onError(handler, category = 'global') {
    this.handlers.set(category, handler);
  }
  
  /**
   * Set default error handler
   */
  setDefaultHandler(handler) {
    this.defaultHandler = handler;
  }
  
  /**
   * Record error for monitoring
   */
  recordError(formatted) {
    // Simple error tracking - could be extended to send to monitoring service
    if (!this.errors) {
      this.errors = [];
    }
    this.errors.push(formatted);
    
    // Keep last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }
  
  /**
   * Get recent errors
   */
  getErrors() {
    return this.errors || [];
  }
  
  /**
   * Clear errors
   */
  clearErrors() {
    this.errors = [];
  }
}

export const errorBoundary = new ErrorBoundary();
export const errorboundary = new ErrorBoundary();
