/**
 * Monitoring Service
 * Provides error tracking, performance monitoring, and analytics
 */

export class MonitoringService {
  constructor() {
    this.metrics = {
      errors: [],
      performance: {},
      userActions: [],
      apiCalls: []
    };

    this.config = {
      maxMetrics: 1000,
      errorReporting: true,
      performanceTracking: true,
      userTracking: false, // GDPR compliant
      apiTracking: true
    };

    this.init();
  }

  /**
   * Initialize monitoring service
   */
  init() {
    // Set up global error handlers
    this.setupGlobalHandlers();
    
    // Set up performance observer
    this.setupPerformanceObserver();
    
    console.log('[MonitoringService] Initialized');
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('unhandled_promise_rejection', {
        reason: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Global errors
    window.addEventListener('error', (event) => {
      this.trackError('global_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Page visibility changes (for session tracking)
    document.addEventListener('visibilitychange', () => {
      this.trackUserAction('visibility_change', {
        hidden: document.hidden,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup performance observer
   */
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        // Observe long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.trackPerformance('long_task', {
              duration: entry.duration,
              startTime: entry.startTime,
              timestamp: new Date().toISOString()
            });
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });

        // Observe navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.trackPerformance('navigation', {
                domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                loadComplete: entry.loadEventEnd - entry.loadEventStart,
                dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
                tcpConnect: entry.connectEnd - entry.connectStart,
                serverResponse: entry.responseEnd - entry.requestStart,
                timestamp: new Date().toISOString()
              });
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });

        // Observe resource loading
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 1000) { // Only track slow resources
              this.trackPerformance('slow_resource', {
                name: entry.name,
                duration: entry.duration,
                size: entry.transferSize,
                type: entry.initiatorType,
                timestamp: new Date().toISOString()
              });
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });

      } catch (error) {
        console.warn('[MonitoringService] Performance observer setup failed:', error);
      }
    }
  }

  /**
   * Track error
   * @param {string} type - Error type
   * @param {Object} data - Error data
   */
  trackError(type, data) {
    const error = {
      type,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    this.metrics.errors.push(error);
    this.enforceMetricsLimit();

    // Send to error reporting service
    this.reportError(error);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[MonitoringService] Error tracked:', error);
    }
  }

  /**
   * Track performance metric
   * @param {string} type - Performance type
   * @param {Object} data - Performance data
   */
  trackPerformance(type, data) {
    if (!this.metrics.performance[type]) {
      this.metrics.performance[type] = [];
    }

    this.metrics.performance[type].push({
      ...data,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 entries per type
    if (this.metrics.performance[type].length > 100) {
      this.metrics.performance[type] = this.metrics.performance[type].slice(-100);
    }
  }

  /**
   * Track user action
   * @param {string} action - Action type
   * @param {Object} data - Action data
   */
  trackUserAction(action, data) {
    if (!this.config.userTracking) return;

    this.metrics.userActions.push({
      action,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    });

    this.enforceMetricsLimit();
  }

  /**
   * Track API call
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {number} duration - Request duration
   * @param {number} status - Response status
   * @param {boolean} success - Whether request succeeded
   */
  trackApiCall(endpoint, method, duration, status, success) {
    this.metrics.apiCalls.push({
      endpoint,
      method,
      duration,
      status,
      success,
      timestamp: new Date().toISOString()
    });

    this.enforceMetricsLimit();

    // Track slow API calls
    if (duration > 3000) {
      this.trackPerformance('slow_api_call', {
        endpoint,
        method,
        duration,
        status,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Track feature usage
   * @param {string} feature - Feature name
   * @param {Object} data - Usage data
   */
  trackFeatureUsage(feature, data = {}) {
    this.trackUserAction(`feature_${feature}`, {
      ...data,
      feature
    });
  }

  /**
   * Report error to external service
   * @param {Object} error - Error data
   */
  reportError(error) {
    // Send to error reporting service (Sentry, Bugsnag, etc.)
    try {
      if (window.Sentry && this.config.errorReporting) {
        window.Sentry.captureException(new Error(error.data.message || error.type), {
          tags: {
            errorType: error.type,
            sessionId: error.sessionId
          },
          extra: error.data
        });
      }

      // Could also send to custom error endpoint
      // fetch('/api/errors', { method: 'POST', body: JSON.stringify(error) });
    } catch (err) {
      console.warn('[MonitoringService] Error reporting failed:', err);
    }
  }

  /**
   * Get session ID
   * @returns {string} Session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Enforce metrics limit
   */
  enforceMetricsLimit() {
    // Limit errors
    if (this.metrics.errors.length > this.config.maxMetrics) {
      this.metrics.errors = this.metrics.errors.slice(-this.config.maxMetrics);
    }

    // Limit user actions
    if (this.metrics.userActions.length > this.config.maxMetrics) {
      this.metrics.userActions = this.metrics.userActions.slice(-this.config.maxMetrics);
    }

    // Limit API calls
    if (this.metrics.apiCalls.length > this.config.maxMetrics) {
      this.metrics.apiCalls = this.metrics.apiCalls.slice(-this.config.maxMetrics);
    }
  }

  /**
   * Get monitoring statistics
   * @returns {Object} Monitoring stats
   */
  getStats() {
    return {
      errors: {
        total: this.metrics.errors.length,
        byType: this.groupBy(this.metrics.errors, 'type')
      },
      performance: Object.keys(this.metrics.performance).reduce((acc, type) => {
        acc[type] = this.metrics.performance[type].length;
        return acc;
      }, {}),
      userActions: {
        total: this.metrics.userActions.length,
        byAction: this.groupBy(this.metrics.userActions, 'action')
      },
      apiCalls: {
        total: this.metrics.apiCalls.length,
        successRate: this.calculateSuccessRate(),
        avgDuration: this.calculateAvgApiDuration()
      }
    };
  }

  /**
   * Group array by key
   * @param {Array} array - Array to group
   * @param {string} key - Key to group by
   * @returns {Object} Grouped object
   */
  groupBy(array, key) {
    return array.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Calculate API success rate
   * @returns {number} Success rate percentage
   */
  calculateSuccessRate() {
    if (this.metrics.apiCalls.length === 0) return 100;
    
    const successful = this.metrics.apiCalls.filter(call => call.success).length;
    return Math.round((successful / this.metrics.apiCalls.length) * 100);
  }

  /**
   * Calculate average API duration
   * @returns {number} Average duration in ms
   */
  calculateAvgApiDuration() {
    if (this.metrics.apiCalls.length === 0) return 0;
    
    const total = this.metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0);
    return Math.round(total / this.metrics.apiCalls.length);
  }

  /**
   * Export monitoring data
   * @returns {Object} Monitoring data
   */
  exportData() {
    return {
      ...this.metrics,
      stats: this.getStats(),
      config: this.config,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Clear all monitoring data
   */
  clearData() {
    this.metrics = {
      errors: [],
      performance: {},
      userActions: [],
      apiCalls: []
    };
    console.log('[MonitoringService] Data cleared');
  }

  /**
   * Configure monitoring settings
   * @param {Object} config - New configuration
   */
  configure(config) {
    this.config = { ...this.config, ...config };
    console.log('[MonitoringService] Configuration updated:', this.config);
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();
