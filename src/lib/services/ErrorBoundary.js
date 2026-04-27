/**
 * Monitoring Service - Collects metrics and performance data for AI operations
 */
export class ErrorBoundary {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
    this.interval = null;
    this.enabled = true;

    // Initialize metric categories
    this.initializeMetrics();
  }

  /**
   * Initialize metric storage
   */
  initializeMetrics() {
    this.metrics.set('api_calls', {
      total: 0,
      success: 0,
      failure: 0,
      byType: new Map(),
      responseTimes: []
    });

    this.metrics.set('errors', {
      total: 0,
      byType: new Map(),
      byService: new Map(),
      recent: []
    });

    this.metrics.set('cache', {
      hits: 0,
      misses: 0,
      hitRate: 0
    });

    this.metrics.set('rate_limiting', {
      blocked: 0,
      byService: new Map()
    });

    this.metrics.set('circuit_breaker', {
      opened: 0,
      closed: 0,
      byService: new Map()
    });

    this.metrics.set('retry', {
      attempts: 0,
      successes: 0,
      failures: 0
    });
  }

  /**
   * Record API call metrics
   */
  record(type, data) {
    if (!this.enabled) return;

    const timestamp = Date.now();

    switch (type) {
      case 'api_call':
        this.recordApiCall(data, timestamp);
        break;
      case 'error':
        this.recordError(data, timestamp);
        break;
      case 'cache_hit':
        this.recordCacheHit(data);
        break;
      case 'cache_miss':
        this.recordCacheMiss(data);
        break;
      case 'rate_limit':
        this.recordRateLimit(data);
        break;
      case 'circuit_open':
        this.recordCircuitOpen(data);
        break;
      case 'circuit_close':
        this.recordCircuitClose(data);
        break;
      case 'retry':
        this.recordRetry(data);
        break;
      case 'cancelled':
        this.recordCancellation(data);
        break;
      default:
        // Unknown metric type
        break;
    }
  }

  recordApiCall(data, timestamp) {
    const apiMetrics = this.metrics.get('api_calls');
    apiMetrics.total++;

    if (data.success !== false) {
      apiMetrics.success++;
    } else {
      apiMetrics.failure++;
    }

    // Track by type
    const typeKey = data.type || 'unknown';
    if (!apiMetrics.byType.has(typeKey)) {
      apiMetrics.byType.set(typeKey, { total: 0, success: 0, failure: 0 });
    }
    const typeMetrics = apiMetrics.byType.get(typeKey);
    typeMetrics.total++;
    if (data.success !== false) {
      typeMetrics.success++;
    } else {
      typeMetrics.failure++;
    }

    // Track response times
    if (data.duration) {
      apiMetrics.responseTimes.push(data.duration);
      // Keep only last 1000 response times
      if (apiMetrics.responseTimes.length > 1000) {
        apiMetrics.responseTimes.shift();
      }
    }
  }

  recordError(data, timestamp) {
    const errorMetrics = this.metrics.get('errors');
    errorMetrics.total++;

    // Track by type
    const typeKey = data.type || 'unknown';
    if (!errorMetrics.byType.has(typeKey)) {
      errorMetrics.byType.set(typeKey, 0);
    }
    errorMetrics.byType.set(typeKey, errorMetrics.byType.get(typeKey) + 1);

    // Track by service
    const serviceKey = data.service || 'unknown';
    if (!errorMetrics.byService.has(serviceKey)) {
      errorMetrics.byService.set(serviceKey, 0);
    }
    errorMetrics.byService.set(serviceKey, errorMetrics.byService.get(serviceKey) + 1);

    // Keep recent errors (last 50)
    errorMetrics.recent.push({
      timestamp,
      type: typeKey,
      service: serviceKey,
      error: data.error,
      context: data.context
    });

    if (errorMetrics.recent.length > 50) {
      errorMetrics.recent.shift();
    }
  }

  recordCacheHit(data) {
    const cacheMetrics = this.metrics.get('cache');
    cacheMetrics.hits++;
    this.updateCacheHitRate();
  }

  recordCacheMiss(data) {
    const cacheMetrics = this.metrics.get('cache');
    cacheMetrics.misses++;
    this.updateCacheHitRate();
  }

  updateCacheHitRate() {
    const cacheMetrics = this.metrics.get('cache');
    const total = cacheMetrics.hits + cacheMetrics.misses;
    cacheMetrics.hitRate = total > 0 ? (cacheMetrics.hits / total) * 100 : 0;
  }

  recordRateLimit(data) {
    const rateMetrics = this.metrics.get('rate_limiting');
    rateMetrics.blocked++;

    const serviceKey = data.service || 'unknown';
    if (!rateMetrics.byService.has(serviceKey)) {
      rateMetrics.byService.set(serviceKey, 0);
    }
    rateMetrics.byService.set(serviceKey, rateMetrics.byService.get(serviceKey) + 1);
  }

  recordCircuitOpen(data) {
    const circuitMetrics = this.metrics.get('circuit_breaker');
    circuitMetrics.opened++;

    const serviceKey = data.service || 'unknown';
    if (!circuitMetrics.byService.has(serviceKey)) {
      circuitMetrics.byService.set(serviceKey, { opened: 0, closed: 0 });
    }
    circuitMetrics.byService.get(serviceKey).opened++;
  }

  recordCircuitClose(data) {
    const circuitMetrics = this.metrics.get('circuit_breaker');
    circuitMetrics.closed++;

    const serviceKey = data.service || 'unknown';
    if (!circuitMetrics.byService.has(serviceKey)) {
      circuitMetrics.byService.set(serviceKey, { opened: 0, closed: 0 });
    }
    circuitMetrics.byService.get(serviceKey).closed++;
  }

  recordRetry(data) {
    const retryMetrics = this.metrics.get('retry');
    retryMetrics.attempts++;

    if (data.success) {
      retryMetrics.successes++;
    } else {
      retryMetrics.failures++;
    }
  }

  recordCancellation(data) {
    // Track cancellations as a separate metric
    if (!this.metrics.has('cancellations')) {
      this.metrics.set('cancellations', { total: 0, byType: new Map() });
    }

    const cancelMetrics = this.metrics.get('cancellations');
    cancelMetrics.total++;

    const typeKey = data.type || 'unknown';
    if (!cancelMetrics.byType.has(typeKey)) {
      cancelMetrics.byType.set(typeKey, 0);
    }
    cancelMetrics.byType.set(typeKey, cancelMetrics.byType.get(typeKey) + 1);
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    const uptime = Date.now() - this.startTime;
    const stats = {
      uptime,
      enabled: this.enabled,
      metrics: {}
    };

    // Convert Maps to objects for JSON serialization
    for (const [key, value] of this.metrics) {
      if (value instanceof Map) {
        stats.metrics[key] = Object.fromEntries(value);
      } else {
        stats.metrics[key] = value;
      }
    }

    // Add computed metrics
    const apiMetrics = this.metrics.get('api_calls');
    if (apiMetrics.responseTimes.length > 0) {
      const sorted = [...apiMetrics.responseTimes].sort((a, b) => a - b);
      stats.metrics.api_calls.p50 = sorted[Math.floor(sorted.length * 0.5)];
      stats.metrics.api_calls.p95 = sorted[Math.floor(sorted.length * 0.95)];
      stats.metrics.api_calls.p99 = sorted[Math.floor(sorted.length * 0.99)];
    }

    return stats;
  }

  /**
   * Get health status based on metrics
   */
  getHealthStatus() {
    const stats = this.getStats();
    const apiMetrics = stats.metrics.api_calls;
    const errorMetrics = stats.metrics.errors;

    let status = 'healthy';
    const issues = [];

    // Check error rate
    const totalRequests = apiMetrics.total;
    const errorRate = totalRequests > 0 ? (apiMetrics.failure / totalRequests) * 100 : 0;

    if (errorRate > 50) {
      status = 'critical';
      issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
    } else if (errorRate > 20) {
      status = 'warning';
      issues.push(`Elevated error rate: ${errorRate.toFixed(1)}%`);
    }

    // Check circuit breakers
    const circuitMetrics = stats.metrics.circuit_breaker;
    if (circuitMetrics.opened > circuitMetrics.closed) {
      status = 'warning';
      issues.push('Circuit breakers are open');
    }

    // Check rate limiting
    const rateMetrics = stats.metrics.rate_limiting;
    if (rateMetrics.blocked > 10) {
      status = 'warning';
      issues.push(`Rate limiting triggered ${rateMetrics.blocked} times`);
    }

    return {
      status,
      issues,
      metrics: {
        errorRate: errorRate.toFixed(1) + '%',
        totalRequests,
        cacheHitRate: stats.metrics.cache.hitRate.toFixed(1) + '%',
        circuitBreakersOpen: circuitMetrics.opened - circuitMetrics.closed
      }
    };
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.getStats()
    };
  }

  /**
   * Start periodic cleanup of old metrics
   */
  start() {
    this.interval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000); // 5 minutes
  }

  /**
   * Stop periodic cleanup
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  cleanupOldMetrics() {
    const errorMetrics = this.metrics.get('errors');

    // Keep only recent errors (last 24 hours)
    const oneDayAgo = Date.now() - 86400000;
    errorMetrics.recent = errorMetrics.recent.filter(
      error => error.timestamp > oneDayAgo
    );

    // Trim response times array if too large
    const apiMetrics = this.metrics.get('api_calls');
    if (apiMetrics.responseTimes.length > 500) {
      // Keep only the most recent 250
      apiMetrics.responseTimes = apiMetrics.responseTimes.slice(-250);
    }
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.startTime = Date.now();
    this.initializeMetrics();
  }

  /**
   * Enable or disable monitoring
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}
export const errorboundary = new ErrorBoundary();
