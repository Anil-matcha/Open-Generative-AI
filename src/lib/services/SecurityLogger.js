export class SecurityLogger {
  constructor(options = {}) {
    this.endpoint = options.endpoint || '/api/security/logs';
    this.backendUrl = options.backendUrl || 'http://localhost:3001';
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 5000;
    this.logBuffer = [];
    this.isFlushing = false;
    this.serviceName = options.serviceName || 'higgsfield-client';
    this.enabled = options.enabled !== false;
    this.flushTimer = null;
    this.apiKey = options.apiKey || null; // For admin actions
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Flush logs periodically
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);

    // Flush before page unload
    window.addEventListener('beforeunload', () => this.flushSync());

    // Flush when page becomes visible (after being hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.flush().catch(console.error);
      }
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      console.log('[SecurityLogger] Online - attempting to flush queued logs');
      this.flush().catch(console.error);
    });

    console.log('[SecurityLogger] Initialized');
  }

  log(level, event, details = {}) {
    if (!this.enabled) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      service: this.serviceName,
      details: this.sanitizeDetails(details),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      screen: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : undefined,
      language: typeof navigator !== 'undefined' ? navigator.language : undefined,
      online: typeof navigator !== 'undefined' ? navigator.onLine : undefined
    };

    this.logBuffer.push(entry);

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SecurityLogger] ${level.toUpperCase()}:${event}`, details);
    }

    if (this.logBuffer.length >= this.batchSize) {
      this.flush().catch(err => {
        console.error('[SecurityLogger] Flush failed, will retry:', err);
      });
    }
  }

  info(event, details) {
    this.log('info', event, details);
  }

  warn(event, details) {
    this.log('warn', event, details);
  }

  error(event, details) {
    this.log('error', event, details);
  }

  security(event, details) {
    this.log('security', event, details);
  }

  sanitizeDetails(details) {
    const sanitized = {};
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'apikey', 'api_key', 'private', 'signature', 'session'
    ];

    for (const [key, value] of Object.entries(details)) {
      const lowerKey = key.toLowerCase();

      // Redact sensitive fields
      if (sensitiveKeys.some(s => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          sanitized[key] = '[ARRAY]';
        } else {
          sanitized[key] = '[OBJECT]';
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Enable for admin-only features (requires apiKey)
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Get buffer status for debugging
   */
  getStatus() {
    return {
      enabled: this.enabled,
      bufferSize: this.logBuffer.length,
      batchSize: this.batchSize,
      isFlushing: this.isFlushing,
      flushInterval: this.flushInterval
    };
  }

  /**
   * Enable logging
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable logging
   */
  disable() {
    this.enabled = false;
    this.flush().catch(console.error);
  }

  /**
   * Destroy instance and clean up
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushSync();
  }
}

  async flush() {
    if (this.isFlushing || this.logBuffer.length === 0) return;

    this.isFlushing = true;

    const batch = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Skip if offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.warn('[SecurityLogger] Offline - logs will be queued locally');
        this.logBuffer.push(...batch);
        return;
      }

      const response = await fetch(`${this.backendUrl}${this.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          logs: batch,
          source: 'client',
          version: '1.0'
        }),
        keepalive: true,
        signal: AbortSignal?.timeout?.(5000) // 5s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`[SecurityLogger] Flushed ${batch.length} logs successfully`);
      }
    } catch (error) {
      console.error('[SecurityLogger] Flush failed:', error.message);

      // Re-queue logs on failure (except for network errors that are likely permanent)
      if (!error.name?.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        this.logBuffer.push(...batch);
      }

      // Exponential backoff for next flush
      this.scheduleRetry();
    } finally {
      this.isFlushing = false;
    }
  }

  flushSync() {
    if (this.logBuffer.length === 0) return;

    const batch = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Use sendBeacon for synchronous transmission during unload
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({
          logs: batch,
          source: 'client-unload',
          version: '1.0'
        })], { type: 'application/json' });

        const success = navigator.sendBeacon(`${this.backendUrl}${this.endpoint}`, blob);
        if (!success) {
          console.warn('[SecurityLogger] sendBeacon failed, re-queuing logs');
          this.logBuffer.push(...batch);
        }
      } else {
        // Fallback to synchronous XHR (deprecated but reliable)
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${this.backendUrl}${this.endpoint}`, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ logs: batch, source: 'client-sync' }));
      }
    } catch (error) {
      console.error('[SecurityLogger] Sync flush failed:', error);
      this.logBuffer.push(...batch); // Re-queue
    }
  }

  scheduleRetry() {
    // Exponential backoff: 1s, 2s, 4s, 8s max 30s
    const delay = Math.min(30000, 1000 * Math.pow(2, this.retryCount || 0));
    this.retryCount = (this.retryCount || 0) + 1;

    setTimeout(() => {
      this.flush().finally(() => {
        this.retryCount = 0;
      });
    }, delay);
  }

  clear() {
    this.logBuffer = [];
  }
}

export const securityLogger = new SecurityLogger();