/**
 * Rate Limiter Service - Token bucket algorithm
 * Limits API calls to respect Pexels API rate limits (200 requests/hour for free, 10000/hour for paid)
 */
export class RateLimiter {
  constructor(options = {}) {
    this.rate = options.rate || 200; // tokens per duration
    this.duration = options.duration || 3600000; // 1 hour in ms
    this.tokens = options.initialTokens || this.rate;
    this.lastRefill = Date.now();
    this.queue = [];
    this.maxQueueSize = options.maxQueueSize || 100;
  }
  
  /**
   * Refill tokens based on elapsed time
   */
  refresh() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / this.duration) * this.rate;
    
    this.tokens = Math.min(this.rate, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  /**
   * Acquire tokens to make a request
   * @param {number} weight - Number of tokens needed (default 1)
   * @param {number} timeout - Max time to wait in ms (default 0 = no wait)
   * @returns {Promise<boolean>} - True if tokens acquired
   */
  async acquire(weight = 1, timeout = 0) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const attemptAcquire = () => {
        this.refresh();
        
        if (this.tokens >= weight) {
          this.tokens -= weight;
          resolve(true);
        } else if (timeout > 0 && (Date.now() - startTime) >= timeout) {
          reject(new Error('Rate limit timeout'));
        } else {
          // Queue for later
          if (this.queue.length >= this.maxQueueSize) {
            reject(new Error('Rate limit queue full'));
            return;
          }
          
          setTimeout(attemptAcquire, 100);
        }
      };
      
      attemptAcquire();
    });
  }
  
  /**
   * Check if we can proceed without waiting (non-blocking)
   */
  canProceed(weight = 1) {
    this.refresh();
    return this.tokens >= weight;
  }
  
  /**
   * Get current token count
   */
  getAvailableTokens() {
    this.refresh();
    return this.tokens;
  }
  
  /**
   * Get time until next token available
   */
  getTimeToNextToken(weight = 1) {
    this.refresh();
    if (this.tokens >= weight) return 0;
    
    const deficit = weight - this.tokens;
    const timePerToken = this.duration / this.rate;
    return deficit * timePerToken;
  }
  
  /**
   * Reset to full capacity
   */
  reset() {
    this.tokens = this.rate;
    this.lastRefill = Date.now();
    this.queue = [];
  }
}

/**
 * Retry Service - Exponential backoff retry logic
 */
export class RetryService {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.backoffFactor = options.backoffFactor || 2;
  }

  /**
   * Execute a function with retry logic
   */
  async execute(fn, options = {}) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on the last attempt
        if (attempt === this.maxRetries) break;

        // Check if error is retryable
        if (!this.isRetryableError(error)) break;

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.baseDelay * Math.pow(this.backoffFactor, attempt),
          this.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        const finalDelay = delay + jitter;

        await new Promise(resolve => setTimeout(resolve, finalDelay));
      }
    }

    throw lastError;
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error) {
    // Retry on network errors, 5xx errors, timeouts
    if (error.name === 'NetworkError' || error.name === 'TimeoutError') return true;
    if (error.status >= 500) return true;
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;

    return false;
  }
}

export const rateLimiter = new RateLimiter();
export const ratelimiter = new RateLimiter();
export const retryService = new RetryService();
