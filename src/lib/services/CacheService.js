/**
 * Circuit Breaker - Prevents cascading failures by temporarily stopping requests to failing services
 */
export class CacheService {
  constructor() {
    this.services = new Map();
    this.defaultConfig = {
      failureThreshold: 5, // Number of failures before opening
      recoveryTimeout: 60000, // 1 minute before trying again
      monitoringPeriod: 60000, // 1 minute monitoring window
      successThreshold: 3 // Number of successes needed to close
    };
  }

  /**
   * Check if request can proceed
   */
  canProceed(serviceName) {
    const state = this.getServiceState(serviceName);

    switch (state.status) {
      case 'CLOSED':
        return true;
      case 'OPEN':
        // Check if recovery timeout has passed
        if (Date.now() - state.lastFailureTime >= state.config.recoveryTimeout) {
          state.status = 'HALF_OPEN';
          state.successCount = 0;
          return true;
        }
        return false;
      case 'HALF_OPEN':
        return true;
      default:
        return true;
    }
  }

  /**
   * Record successful request
   */
  recordSuccess(serviceName) {
    const state = this.getServiceState(serviceName);

    state.successCount = (state.successCount || 0) + 1;
    state.lastSuccessTime = Date.now();

    // Reset failure count on success
    state.failureCount = 0;

    // Close circuit if we've had enough successes in half-open state
    if (state.status === 'HALF_OPEN' && state.successCount >= state.config.successThreshold) {
      state.status = 'CLOSED';
      state.successCount = 0;
      console.log(`[CircuitBreaker] ${serviceName} circuit CLOSED`);
    }

    this.cleanupOldFailures(serviceName);
  }

  /**
   * Record failed request
   */
  recordFailure(serviceName, error = null) {
    const state = this.getServiceState(serviceName);

    state.failureCount = (state.failureCount || 0) + 1;
    state.lastFailureTime = Date.now();

    if (error) {
      state.lastError = error.message;
    }

    // Open circuit if failure threshold exceeded
    if (state.status === 'CLOSED' && state.failureCount >= state.config.failureThreshold) {
      state.status = 'OPEN';
      console.warn(`[CircuitBreaker] ${serviceName} circuit OPENED after ${state.failureCount} failures`);
    } else if (state.status === 'HALF_OPEN') {
      // Failure in half-open state, go back to open
      state.status = 'OPEN';
      state.successCount = 0;
      console.warn(`[CircuitBreaker] ${serviceName} circuit OPENED (half-open failure)`);
    }

    this.cleanupOldFailures(serviceName);
  }

  /**
   * Get or create service state
   */
  getServiceState(serviceName) {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, {
        status: 'CLOSED',
        failureCount: 0,
        successCount: 0,
        lastFailureTime: 0,
        lastSuccessTime: 0,
        lastError: null,
        config: { ...this.defaultConfig },
        failureHistory: []
      });
    }
    return this.services.get(serviceName);
  }

  /**
   * Clean up old failure records outside monitoring period
   */
  cleanupOldFailures(serviceName) {
    const state = this.getServiceState(serviceName);
    const cutoffTime = Date.now() - state.config.monitoringPeriod;

    state.failureHistory = state.failureHistory.filter(
      failure => failure.timestamp > cutoffTime
    );
  }

  /**
   * Update configuration for a service
   */
  configureService(serviceName, config) {
    const state = this.getServiceState(serviceName);
    state.config = { ...state.config, ...config };
  }

  /**
   * Get status for all services
   */
  getStatus() {
    const status = {};
    for (const [serviceName, state] of this.services) {
      status[serviceName] = {
        status: state.status,
        failureCount: state.failureCount,
        successCount: state.successCount,
        lastFailureTime: state.lastFailureTime,
        lastSuccessTime: state.lastSuccessTime,
        lastError: state.lastError,
        timeToRecovery: state.status === 'OPEN' ?
          Math.max(0, state.config.recoveryTimeout - (Date.now() - state.lastFailureTime)) : 0
      };
    }
    return status;
  }

  /**
   * Get status for specific service
   */
  getServiceStatus(serviceName) {
    return this.getStatus()[serviceName] || {
      status: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      lastError: null,
      timeToRecovery: 0
    };
  }

  /**
   * Manually reset circuit for a service
   */
  resetService(serviceName) {
    if (this.services.has(serviceName)) {
      const state = this.services.get(serviceName);
      state.status = 'CLOSED';
      state.failureCount = 0;
      state.successCount = 0;
      state.lastError = null;
      console.log(`[CircuitBreaker] ${serviceName} circuit manually reset`);
    }
  }

  /**
   * Reset all circuits
   */
  resetAll() {
    for (const serviceName of this.services.keys()) {
      this.resetService(serviceName);
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    const stats = {};
    for (const [serviceName, state] of this.services) {
      const totalRequests = state.failureHistory.length;
      const recentFailures = state.failureHistory.filter(
        f => Date.now() - f.timestamp < state.config.monitoringPeriod
      ).length;

      stats[serviceName] = {
        status: state.status,
        failureRate: totalRequests > 0 ? (recentFailures / totalRequests) * 100 : 0,
        totalFailures: state.failureCount,
        totalSuccesses: state.successCount,
        uptime: state.lastSuccessTime > 0 ?
          ((Date.now() - Math.max(state.lastFailureTime, state.lastSuccessTime)) / 1000) : 0
      };
    }
    return stats;
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(serviceName, fn) {
    if (!this.canProceed(serviceName)) {
      throw new Error(`Circuit breaker is OPEN for ${serviceName}`);
    }

    try {
      const result = await fn();
      this.recordSuccess(serviceName);
      return result;
    } catch (error) {
      this.recordFailure(serviceName, error);
      throw error;
    }
  }
}
export const cacheService = new CacheService();
export const cacheservice = new CacheService();
