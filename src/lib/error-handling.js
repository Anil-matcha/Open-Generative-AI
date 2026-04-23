/**
 * Enhanced Error Handling System
 * Provides structured error handling, logging, and recovery mechanisms
 */

import { secureStorage } from './security/index.js';

// Error categories for better organization
export const ERROR_CATEGORIES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  USER_INPUT: 'user_input',
  SYSTEM: 'system',
  THIRD_PARTY: 'third_party'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Enhanced Error class with additional metadata
export class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'AppError';
    this.category = options.category || ERROR_CATEGORIES.SYSTEM;
    this.severity = options.severity || ERROR_SEVERITY.MEDIUM;
    this.context = options.context || {};
    this.userId = options.userId;
    this.sessionId = options.sessionId;
    this.timestamp = new Date().toISOString();
    this.stack = this.stack;
  }
}

// Network error handler
export class NetworkError extends AppError {
  constructor(message, status, url, options = {}) {
    super(message, { 
      ...options, 
      category: ERROR_CATEGORIES.NETWORK,
      context: { status, url, ...options.context }
    });
    this.name = 'NetworkError';
    this.status = status;
    this.url = url;
  }
}

// Validation error handler
export class ValidationError extends AppError {
  constructor(message, field, value, options = {}) {
    super(message, { 
      ...options, 
      category: ERROR_CATEGORIES.VALIDATION,
      context: { field, value, ...options.context }
    });
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

// Security error handler
export class SecurityError extends AppError {
  constructor(message, threat, options = {}) {
    super(message, { 
      ...options, 
      category: ERROR_CATEGORIES.SECURITY,
      severity: ERROR_SEVERITY.HIGH,
      context: { threat, ...options.context }
    });
    this.name = 'SecurityError';
    this.threat = threat;
  }
}

// Error logging system
class ErrorLogger {
  constructor() {
    this.maxStoredErrors = 100;
    this.errors = [];
  }

  log(error) {
    const errorEntry = {
      id: generateErrorId(),
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        category: error.category || ERROR_CATEGORIES.SYSTEM,
        severity: error.severity || ERROR_SEVERITY.MEDIUM
      },
      context: error.context || {},
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errors.unshift(errorEntry);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.maxStoredErrors);
    }

    // Store in secure storage
    secureStorage.setItem('error_logs', this.errors);

    // Console logging based on severity
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.category.toUpperCase()}] ${error.message}`, error);

    // Report critical errors
    if (error.severity === ERROR_SEVERITY.CRITICAL) {
      this.reportCriticalError(error);
    }
  }

  getLogMethod(severity) {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return console.error;
      case ERROR_SEVERITY.HIGH:
        return console.warn;
      default:
        return console.error;
    }
  }

  reportCriticalError(error) {
    // In production, send to error reporting service
    if (import.meta.env.PROD) {
      // Example: send to error reporting service
      // errorReportingService.report(error);
      console.error('CRITICAL ERROR REPORTED:', error);
    }
  }

  getRecentErrors(limit = 10) {
    return this.errors.slice(0, limit);
  }

  clearErrors() {
    this.errors = [];
    secureStorage.removeItem('error_logs');
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

// Error boundary for React-like error catching
export class ErrorBoundary {
  constructor(onError) {
    this.onError = onError;
  }

  catch(error, context = {}) {
    const appError = error instanceof AppError ? error : 
      new AppError(error.message || 'Unknown error', {
        category: ERROR_CATEGORIES.SYSTEM,
        severity: ERROR_SEVERITY.MEDIUM,
        context: { originalError: error, ...context }
      });
    
    errorLogger.log(appError);
    this.onError?.(appError);
  }
}

// Retry mechanism with exponential backoff
export async function retryWithBackoff(operation, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryCondition = () => true
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !retryCondition(error)) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// API error handler with automatic retry
export async function handleApiCall(apiCall, options = {}) {
  return retryWithBackoff(apiCall, {
    maxRetries: 2,
    retryCondition: (error) => {
      // Retry on network errors, not on auth errors
      return error.name === 'NetworkError' && error.status >= 500;
    },
    ...options
  });
}

// Graceful degradation handler
export function withGracefulDegradation(operation, fallback) {
  return async (...args) => {
    try {
      return await operation(...args);
    } catch (error) {
      errorLogger.log(new AppError(
        `Operation failed, using fallback: ${error.message}`,
        {
          category: ERROR_CATEGORIES.SYSTEM,
          severity: ERROR_SEVERITY.LOW,
          context: { operation: operation.name, args }
        }
      ));
      return fallback(...args);
    }
  };
}

// Utility function to generate error IDs
function generateErrorId() {
  return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Global error handlers
export function setupGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      errorLogger.log(new AppError(
        `Uncaught error: ${event.error?.message || event.message}`,
        {
          category: ERROR_CATEGORIES.SYSTEM,
          severity: ERROR_SEVERITY.HIGH,
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
          }
        }
      ));
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      errorLogger.log(new AppError(
        `Unhandled promise rejection: ${event.reason?.message || event.reason}`,
        {
          category: ERROR_CATEGORIES.SYSTEM,
          severity: ERROR_SEVERITY.MEDIUM,
          context: { reason: event.reason }
        }
      ));
    });
  }
}

// Initialize error handling system
export function initializeErrorHandling() {
  setupGlobalErrorHandlers();
}
