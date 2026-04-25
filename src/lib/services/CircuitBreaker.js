/**
 * Rate Limiter - Token bucket algorithm for API rate limiting
 */
export class RateLimiter {
  constructor() {
    // Rate limits per service type (requests per minute)
    this.limits = {
      image_generation: { tokens: 60, refillRate: 1 }, // 60 per minute
      video_generation: { tokens: 10, refillRate: 6 }, // 10 per minute (every 6 seconds)
      effect_generation: { tokens: 30, refillRate: 2 }, // 30 per minute
      music_generation: { tokens: 20, refillRate: 3 }, // 20 per minute
      upload: { tokens: 100, refillRate: 0.6 }, // 100 per minute
    };

    this.buckets = new Map();
    this.lastRefill = new Map();

    // Initialize buckets
    Object.keys(this.limits).forEach(service => {
      this.buckets.set(service, this.limits[service].tokens);
      this.lastRefill.set(service, Date.now());
    });
  }

  /**
   * Acquire permission to make a request
   */
  async acquire(serviceName) {
    const limit = this.limits[serviceName];
    if (!limit) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    this.refillBucket(serviceName);

    const currentTokens = this.buckets.get(serviceName);

    if (currentTokens < 1) {
      const waitTime = this.calculateWaitTime(serviceName);
      throw new Error(`Rate limit exceeded for ${serviceName}. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    this.buckets.set(serviceName, currentTokens - 1);
    return true;
  }

  /**
   * Try to acquire without throwing (returns boolean)
   */
  tryAcquire(serviceName) {
    try {
      this.acquire(serviceName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for rate limit to allow request
   */
  async waitForSlot(serviceName) {
    const waitTime = this.calculateWaitTime(serviceName);

    if (waitTime > 0) {
      await this.sleep(waitTime);
    }

    return this.acquire(serviceName);
  }

  /**
   * Refill tokens based on time elapsed
   */
  refillBucket(serviceName) {
    const limit = this.limits[serviceName];
    const now = Date.now();
    const lastRefillTime = this.lastRefill.get(serviceName);
    const timeElapsed = now - lastRefillTime;

    // Calculate tokens to add (refillRate is tokens per second)
    const tokensToAdd = (timeElapsed / 1000) * limit.refillRate;
    const currentTokens = this.buckets.get(serviceName);
    const newTokens = Math.min(limit.tokens, currentTokens + tokensToAdd);

    this.buckets.set(serviceName, newTokens);
    this.lastRefill.set(serviceName, now);
  }

  /**
   * Calculate wait time for next available slot
   */
  calculateWaitTime(serviceName) {
    const limit = this.limits[serviceName];
    const currentTokens = this.buckets.get(serviceName);

    if (currentTokens >= 1) {
      return 0;
    }

    // Time to get 1 token
    const timeForOneToken = 1000 / limit.refillRate; // milliseconds
    return timeForOneToken;
  }

  /**
   * Get current status for a service
   */
  getServiceStatus(serviceName) {
    this.refillBucket(serviceName);

    const limit = this.limits[serviceName];
    const currentTokens = this.buckets.get(serviceName);

    return {
      service: serviceName,
      availableTokens: currentTokens,
      maxTokens: limit.tokens,
      refillRate: limit.refillRate,
      nextAvailableIn: this.calculateWaitTime(serviceName)
    };
  }

  /**
   * Get status for all services
   */
  getStatus() {
    const status = {};
    Object.keys(this.limits).forEach(service => {
      status[service] = this.getServiceStatus(service);
    });
    return status;
  }

  /**
   * Reset rate limiter for a service
   */
  resetService(serviceName) {
    const limit = this.limits[serviceName];
    if (limit) {
      this.buckets.set(serviceName, limit.tokens);
      this.lastRefill.set(serviceName, Date.now());
    }
  }

  /**
   * Reset all services
   */
  resetAll() {
    Object.keys(this.limits).forEach(service => {
      this.resetService(service);
    });
  }

  /**
   * Update rate limits dynamically
   */
  updateLimits(newLimits) {
    Object.assign(this.limits, newLimits);

    // Initialize new services
    Object.keys(newLimits).forEach(service => {
      if (!this.buckets.has(service)) {
        this.buckets.set(service, newLimits[service].tokens);
        this.lastRefill.set(service, Date.now());
      }
    });
  }

  /**
   * Get rate limit stats for monitoring
   */
  getStats() {
    const stats = {};
    Object.keys(this.limits).forEach(service => {
      const status = this.getServiceStatus(service);
      stats[service] = {
        utilization: ((status.maxTokens - status.availableTokens) / status.maxTokens) * 100,
        availableTokens: status.availableTokens,
        nextAvailableIn: status.nextAvailableIn
      };
    });
    return stats;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}</content>
<parameter name="filePath">src/lib/services/RateLimiter.js