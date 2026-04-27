/**
 * Circuit Breaker Service
 * Implements circuit breaker pattern for automatic failure isolation, graceful degradation, and recovery
 * Provides protection against cascading failures in AI API calls
 */

export class CircuitBreaker {
  constructor(options = {}) {
    // Default configuration
    this.config = {
      failureThreshold: options.failureThreshold || 5, // Number of failures before opening circuit
      recoveryTimeout: options.recoveryTimeout || 60000, // Time to wait before attempting recovery (1 minute)
      monitoringPeriod: options.monitoringPeriod || 300000, // Period to monitor for failures (5 minutes)
      successThreshold: options.successThreshold || 3, // Number of successes needed in half-open state
      ...options
    };

    // Circuit states
    this.states = {
      CLOSED: 'CLOSED',     // Normal operation
      OPEN: 'OPEN',         // Circuit is open, requests fail fast
      HALF_OPEN: 'HALF_OPEN' // Testing recovery
    };

    // Initialize circuits for different services
    this.circuits = new Map();
    this.initializeServices();
  }

  initializeServices() {
    // Initialize circuits for different AI services
    const services = [
      'image_generation',
      'video_generation',
      'effect_generation',
      'music_generation',
      'api_request',
      'text_generation',
      'audio_generation',
      'avatar_generation',
      'face_swap',
      'upscale',
      'background_removal',
      'ai_agent'
    ];

    services.forEach(service => {
      this.circuits.set(service, {
        state: this.states.CLOSED,
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        totalRequests: 0,
        totalFailures: 0,
        totalSuccesses: 0
      });
    });
  }

  /**
   * Check if a request can proceed for the given service
   * @param {string} serviceName - Name of the service
   * @returns {boolean} - True if request can proceed
   */
  canProceed(serviceName) {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) {
      // Unknown service, allow request
      return true;
    }

    const now = Date.now();

    switch (circuit.state) {
      case this.states.CLOSED:
        return true;

      case this.states.OPEN:
        // Check if recovery timeout has elapsed
        if (now >= circuit.nextAttemptTime) {
          circuit.state = this.states.HALF_OPEN;
          circuit.successes = 0;
          console.log(`[CircuitBreaker] ${serviceName} entering HALF_OPEN state`);
          return true;
        }
        return false;

      case this.states.HALF_OPEN:
        return true;

      default:
        return true;
    }
  }

  /**
   * Record a successful request for the given service
   * @param {string} serviceName - Name of the service
   */
  recordSuccess(serviceName) {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) return;

    circuit.totalRequests++;
    circuit.totalSuccesses++;

    const now = Date.now();

    if (circuit.state === this.states.HALF_OPEN) {
      circuit.successes++;

      // Check if we've reached success threshold
      if (circuit.successes >= this.config.successThreshold) {
        this.resetCircuit(circuit, serviceName);
        console.log(`[CircuitBreaker] ${serviceName} recovered, circuit CLOSED`);
      }
    } else if (circuit.state === this.states.CLOSED) {
      // Reset failure count on success in closed state
      circuit.failures = 0;
    }
  }

  /**
   * Record a failed request for the given service
   * @param {string} serviceName - Name of the service
   */
  recordFailure(serviceName) {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) return;

    circuit.totalRequests++;
    circuit.totalFailures++;
    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === this.states.HALF_OPEN) {
      // Failure during recovery, go back to open
      circuit.state = this.states.OPEN;
      circuit.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
      circuit.successes = 0;
      console.log(`[CircuitBreaker] ${serviceName} recovery failed, circuit OPEN`);
    } else if (circuit.state === this.states.CLOSED) {
      // Check if we've reached failure threshold
      if (circuit.failures >= this.config.failureThreshold) {
        this.openCircuit(circuit, serviceName);
      }
    }
  }

  /**
   * Open the circuit for a service
   * @param {Object} circuit - Circuit object
   * @param {string} serviceName - Name of the service
   */
  openCircuit(circuit, serviceName) {
    circuit.state = this.states.OPEN;
    circuit.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    console.log(`[CircuitBreaker] ${serviceName} circuit OPEN due to ${circuit.failures} failures`);
  }

  /**
   * Reset the circuit to closed state
   * @param {Object} circuit - Circuit object
   * @param {string} serviceName - Name of the service
   */
  resetCircuit(circuit, serviceName) {
    circuit.state = this.states.CLOSED;
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.lastFailureTime = 0;
    circuit.nextAttemptTime = 0;
  }

  /**
   * Get the current status of all circuits
   * @returns {Object} - Status of all circuits
   */
  getStatus() {
    const status = {};
    const now = Date.now();

    for (const [serviceName, circuit] of this.circuits.entries()) {
      const failureRate = circuit.totalRequests > 0 ?
        (circuit.totalFailures / circuit.totalRequests) * 100 : 0;

      status[serviceName] = {
        state: circuit.state,
        failures: circuit.failures,
        successes: circuit.successes,
        totalRequests: circuit.totalRequests,
        totalFailures: circuit.totalFailures,
        totalSuccesses: circuit.totalSuccesses,
        failureRate: Math.round(failureRate * 100) / 100,
        lastFailureTime: circuit.lastFailureTime,
        nextAttemptTime: circuit.nextAttemptTime,
        timeUntilRetry: circuit.nextAttemptTime > now ? circuit.nextAttemptTime - now : 0,
        isHealthy: circuit.state === this.states.CLOSED,
        isRecovering: circuit.state === this.states.HALF_OPEN
      };
    }

    return status;
  }

  /**
   * Get status for a specific service
   * @param {string} serviceName - Name of the service
   * @returns {Object|null} - Status of the service or null if not found
   */
  getServiceStatus(serviceName) {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) return null;

    const now = Date.now();
    const failureRate = circuit.totalRequests > 0 ?
      (circuit.totalFailures / circuit.totalRequests) * 100 : 0;

    return {
      state: circuit.state,
      failures: circuit.failures,
      successes: circuit.successes,
      totalRequests: circuit.totalRequests,
      totalFailures: circuit.totalFailures,
      totalSuccesses: circuit.totalSuccesses,
      failureRate: Math.round(failureRate * 100) / 100,
      lastFailureTime: circuit.lastFailureTime,
      nextAttemptTime: circuit.nextAttemptTime,
      timeUntilRetry: circuit.nextAttemptTime > now ? circuit.nextAttemptTime - now : 0,
      isHealthy: circuit.state === this.states.CLOSED,
      isRecovering: circuit.state === this.states.HALF_OPEN
    };
  }

  /**
   * Force a circuit into a specific state (for testing/admin purposes)
   * @param {string} serviceName - Name of the service
   * @param {string} state - New state (CLOSED, OPEN, HALF_OPEN)
   */
  setCircuitState(serviceName, state) {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) return false;

    if (!Object.values(this.states).includes(state)) {
      throw new Error(`Invalid state: ${state}`);
    }

    const oldState = circuit.state;
    circuit.state = state;

    if (state === this.states.CLOSED) {
      this.resetCircuit(circuit, serviceName);
    } else if (state === this.states.OPEN) {
      circuit.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    }

    console.log(`[CircuitBreaker] ${serviceName} manually set from ${oldState} to ${state}`);
    return true;
  }

  /**
   * Reset all circuits to closed state
   */
  resetAllCircuits() {
    for (const [serviceName, circuit] of this.circuits.entries()) {
      this.resetCircuit(circuit, serviceName);
    }
    console.log('[CircuitBreaker] All circuits reset to CLOSED');
  }

  /**
   * Get overall system health based on circuit states
   * @returns {Object} - Overall health status
   */
  getHealthStatus() {
    const status = this.getStatus();
    const circuits = Object.values(status);

    const openCircuits = circuits.filter(c => c.state === this.states.OPEN).length;
    const halfOpenCircuits = circuits.filter(c => c.state === this.states.HALF_OPEN).length;
    const totalCircuits = circuits.length;

    const averageFailureRate = circuits.reduce((sum, c) => sum + c.failureRate, 0) / totalCircuits;

    let health = 'healthy';
    if (openCircuits > totalCircuits * 0.5) {
      health = 'critical';
    } else if (openCircuits > 0 || halfOpenCircuits > 0) {
      health = 'degraded';
    }

    return {
      health,
      totalCircuits,
      openCircuits,
      halfOpenCircuits,
      closedCircuits: totalCircuits - openCircuits - halfOpenCircuits,
      averageFailureRate: Math.round(averageFailureRate * 100) / 100,
      timestamp: Date.now()
    };
  }

  /**
   * Get monitoring statistics for alerting
   * @returns {Object} - Monitoring stats
   */
  getMonitoringStats() {
    const status = this.getStatus();
    const now = Date.now();

    // Count circuits by state
    const stateCounts = {
      [this.states.CLOSED]: 0,
      [this.states.OPEN]: 0,
      [this.states.HALF_OPEN]: 0
    };

    let totalRequests = 0;
    let totalFailures = 0;
    let recentFailures = 0;

    for (const circuit of Object.values(status)) {
      stateCounts[circuit.state]++;
      totalRequests += circuit.totalRequests;
      totalFailures += circuit.totalFailures;

      // Count failures in last monitoring period
      if (circuit.lastFailureTime > now - this.config.monitoringPeriod) {
        recentFailures++;
      }
    }

    return {
      stateCounts,
      totalRequests,
      totalFailures,
      recentFailures,
      failureRate: totalRequests > 0 ? (totalFailures / totalRequests) * 100 : 0,
      monitoringPeriod: this.config.monitoringPeriod,
      timestamp: now
    };
  }

  /**
   * Update configuration for the circuit breaker
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[CircuitBreaker] Configuration updated:', this.config);
  }

  /**
   * Add a new service to monitor
   * @param {string} serviceName - Name of the new service
   * @param {Object} options - Service-specific options
   */
  addService(serviceName, options = {}) {
    if (this.circuits.has(serviceName)) {
      console.warn(`[CircuitBreaker] Service ${serviceName} already exists`);
      return;
    }

    this.circuits.set(serviceName, {
      state: this.states.CLOSED,
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      ...options
    });

    console.log(`[CircuitBreaker] Added service: ${serviceName}`);
  }

  /**
   * Remove a service from monitoring
   * @param {string} serviceName - Name of the service to remove
   */
  removeService(serviceName) {
    const removed = this.circuits.delete(serviceName);
    if (removed) {
      console.log(`[CircuitBreaker] Removed service: ${serviceName}`);
    }
    return removed;
  }
}

// Export singleton instance
export const circuitBreaker = new CircuitBreaker();
export const circuitbreaker = new CircuitBreaker();
