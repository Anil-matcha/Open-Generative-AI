// API Rate Limiter
// Implements token bucket algorithm for rate limiting API requests

class RateLimiter {
  constructor(requestsPerMinute = 60, burstLimit = 10) {
    this.requestsPerMinute = requestsPerMinute;
    this.burstLimit = burstLimit;
    this.tokens = burstLimit;
    this.lastRefill = Date.now();
    this.queue = [];
    this.processing = false;
  }

  async acquire() {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      await this.refillTokens();

      if (this.tokens > 0) {
        this.tokens--;
        const resolve = this.queue.shift();
        resolve();
      } else {
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.processing = false;
  }

  async refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / 60000) * this.requestsPerMinute; // tokens per millisecond

    this.tokens = Math.min(this.burstLimit, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async execute(fn, ...args) {
    await this.acquire();
    try {
      return await fn(...args);
    } catch (error) {
      // On error, we might want to add back a token or handle differently
      throw error;
    }
  }
}

// Different rate limiters for different API types
export const apiRateLimiter = new RateLimiter(60, 10); // 60 requests per minute, burst of 10
export const uploadRateLimiter = new RateLimiter(10, 2); // 10 uploads per minute, burst of 2
export const generationRateLimiter = new RateLimiter(30, 5); // 30 generations per minute, burst of 5

// Rate-limited fetch wrapper
export async function rateLimitedFetch(url, options = {}, rateLimiter = apiRateLimiter) {
  return rateLimiter.execute(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  });
}

// Circuit breaker for API endpoints
class CircuitBreaker {
  constructor(failureThreshold = 5, recoveryTimeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

export const muapiCircuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 minute recovery