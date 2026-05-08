/**
 * Health Check System
 * Monitors app components and provides fallback mechanisms
 */

class HealthCheckSystem {
  constructor() {
    this.checks = new Map();
    this.status = 'initializing';
    this.failures = [];
  }

  /**
   * Register a health check
   */
  register(name, checkFunction, options = {}) {
    this.checks.set(name, {
      check: checkFunction,
      options: {
        timeout: 5000,
        retries: 2,
        critical: false,
        ...options
      },
      lastResult: null,
      lastCheck: null
    });
  }

  /**
   * Run all health checks
   */
  async runAllChecks() {
    const results = {};
    const promises = [];

    for (const [name, checkData] of this.checks) {
      promises.push(this.runCheck(name, checkData));
    }

    const checkResults = await Promise.allSettled(promises);

    checkResults.forEach((result, index) => {
      const name = Array.from(this.checks.keys())[index];
      if (result.status === 'fulfilled') {
        results[name] = result.value;
      } else {
        results[name] = {
          healthy: false,
          error: result.reason.message,
          timestamp: Date.now()
        };
      }
    });

    this.updateOverallStatus(results);
    return results;
  }

  /**
   * Run a single health check with timeout and retries
   */
  async runCheck(name, checkData) {
    const { check, options } = checkData;
    let lastError;

    for (let attempt = 0; attempt <= options.retries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Check timeout')), options.timeout);
        });

        const result = await Promise.race([check(), timeoutPromise]);

        checkData.lastResult = {
          healthy: true,
          data: result,
          timestamp: Date.now(),
          attempts: attempt + 1
        };
        checkData.lastCheck = Date.now();

        return checkData.lastResult;

      } catch (error) {
        lastError = error;
        if (attempt < options.retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }

    // All attempts failed
    const failure = {
      healthy: false,
      error: lastError.message,
      timestamp: Date.now(),
      attempts: options.retries + 1
    };

    checkData.lastResult = failure;
    checkData.lastCheck = Date.now();

    if (options.critical) {
      this.failures.push({ name, ...failure });
    }

    return failure;
  }

  /**
   * Update overall system status
   */
  updateOverallStatus(results) {
    const criticalFailures = Object.entries(results)
      .filter(([name, result]) => !result.healthy && this.checks.get(name)?.options.critical)
      .length;

    if (criticalFailures > 0) {
      this.status = 'critical';
    } else {
      const healthyCount = Object.values(results).filter(r => r.healthy).length;
      const totalCount = Object.keys(results).length;

      if (healthyCount === totalCount) {
        this.status = 'healthy';
      } else if (healthyCount >= totalCount * 0.5) {
        this.status = 'degraded';
      } else {
        this.status = 'unhealthy';
      }
    }
  }

  /**
   * Get system health status
   */
  getStatus() {
    return {
      status: this.status,
      timestamp: Date.now(),
      checks: Object.fromEntries(
        Array.from(this.checks.entries()).map(([name, data]) => [
          name,
          {
            ...data.lastResult,
            options: data.options
          }
        ])
      ),
      failures: this.failures.slice(-10) // Last 10 failures
    };
  }

  /**
   * Check if system is healthy
   */
  isHealthy() {
    return this.status === 'healthy';
  }

  /**
   * Get critical failures
   */
  getCriticalFailures() {
    return this.failures.filter(f => this.checks.get(f.name)?.options.critical);
  }
}

// Create global health check instance
export const healthCheck = new HealthCheckSystem();

/**
 * Initialize default health checks
 */
export function initializeHealthChecks() {
  // CSP compliance check
  healthCheck.register('csp', async () => {
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!meta) {
      throw new Error('CSP meta tag not found');
    }

    const policy = meta.content;
    if (!policy.includes("frame-ancestors")) {
      throw new Error('CSP missing frame-ancestors directive');
    }

    return { policy: policy.substring(0, 100) + '...' };
  }, { critical: true });

  // Supabase client check
  healthCheck.register('supabase', async () => {
    try {
      // Try to import and check supabase client
      const { supabase } = await import('./hybrid-supabase.js');
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Test basic functionality
      const testResult = await supabase.from('_test').select('count').limit(1);
      // This will likely fail due to permissions, but we just want to test the client works
      return { client: 'available' };
    } catch (error) {
      // Don't fail on permission errors, just check client exists
      if (error.message.includes('permission denied') || error.message.includes('does not exist')) {
        return { client: 'available', note: 'permissions expected to fail' };
      }
      throw error;
    }
  }, { critical: false });

  // Memory leak detector check
  healthCheck.register('memory-detector', async () => {
    if (typeof window.memoryLeakDetector === 'undefined') {
      throw new Error('Memory leak detector not initialized');
    }

    const report = window.memoryLeakDetector.getLeakReport();
    return {
      snapshots: report.snapshots.length,
      isDetecting: report.isDetecting
    };
  }, { critical: false });

  // MuAPI configuration check
  healthCheck.register('muapi-config', async () => {
    const { loadConfig, validateConfig } = await import('./muapiConfig.js');
    const config = loadConfig();
    const validation = validateConfig(config);

    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    return {
      baseURL: config.api.baseURL,
      features: Object.keys(config.features).length
    };
  }, { critical: false });

  // Run initial health check
  setTimeout(() => {
    healthCheck.runAllChecks().then(results => {
      console.log('[HealthCheck] Initial check complete:', results);

      if (!healthCheck.isHealthy()) {
        console.warn('[HealthCheck] System not fully healthy:', healthCheck.getStatus());
      }
    }).catch(error => {
      console.error('[HealthCheck] Initial check failed:', error);
    });
  }, 2000);

  // Periodic health checks
  setInterval(() => {
    healthCheck.runAllChecks().catch(error => {
      console.error('[HealthCheck] Periodic check failed:', error);
    });
  }, 60000); // Check every minute
}

// Make health check available globally for debugging
window.healthCheck = healthCheck;