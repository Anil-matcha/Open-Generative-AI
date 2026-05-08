// Error Reporting Service
// Handles error collection and reporting to monitoring services

class ErrorReporter {
  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.serviceUrl = import.meta.env.VITE_ERROR_REPORTING_URL;
    this.apiKey = import.meta.env.VITE_ERROR_REPORTING_KEY;
    this.queue = [];
    this.flushInterval = 30000; // 30 seconds
    this.maxQueueSize = 50;

    if (this.isProduction && this.serviceUrl) {
      this.startFlushInterval();
    }
  }

  // Capture and report errors
  captureError(error, context = {}) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      context: context,
      severity: this.getSeverity(error)
    };

    if (this.isProduction) {
      this.queue.push(errorReport);
      this.flushIfNeeded();
    } else {
      // In development, log to console
      console.error('[ErrorReporter]', errorReport);
    }
  }

  // Capture unhandled promise rejections
  captureRejection(reason, context = {}) {
    const errorReport = {
      message: reason?.message || String(reason),
      stack: reason?.stack,
      timestamp: new Date().toISOString(),
      type: 'unhandledrejection',
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      context: context,
      severity: 'high'
    };

    if (this.isProduction) {
      this.queue.push(errorReport);
      this.flushIfNeeded();
    } else {
      console.error('[ErrorReporter] Unhandled rejection:', errorReport);
    }
  }

  // Performance monitoring
  capturePerformanceMetric(name, value, context = {}) {
    if (!this.isProduction) return;

    const metric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      type: 'performance',
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      context: context
    };

    this.queue.push(metric);
    this.flushIfNeeded();
  }

  // User action tracking
  captureUserAction(action, context = {}) {
    if (!this.isProduction) return;

    const userAction = {
      action,
      timestamp: new Date().toISOString(),
      type: 'user_action',
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      context: context
    };

    this.queue.push(userAction);
    this.flushIfNeeded();
  }

  // Flush queued reports
  async flush() {
    if (this.queue.length === 0 || !this.serviceUrl) return;

    const reports = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.serviceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-Version': '1.0.0'
        },
        body: JSON.stringify({ reports }),
        // Don't retry failed reports to avoid infinite loops
        signal: AbortSignal.timeout(5000)
      });
    } catch (error) {
      // If reporting fails, put reports back in queue (but limit to prevent memory leaks)
      if (this.queue.length + reports.length <= this.maxQueueSize) {
        this.queue.unshift(...reports);
      }
      // Silently fail - don't cause more errors
    }
  }

  // Flush if queue is getting large
  flushIfNeeded() {
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  // Start periodic flush
  startFlushInterval() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Flush on visibility change (when user switches tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });
  }

  // Get severity level based on error type
  getSeverity(error) {
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'high';
    }
    if (error.message?.includes('network') || error.message?.includes('timeout')) {
      return 'medium';
    }
    return 'low';
  }

  // Get or create user ID
  getUserId() {
    let userId = localStorage.getItem('error_reporting_user_id');
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem('error_reporting_user_id', userId);
    }
    return userId;
  }

  // Get or create session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('error_reporting_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('error_reporting_session_id', sessionId);
    }
    return sessionId;
  }
}

// Global error reporter instance
export const errorReporter = new ErrorReporter();