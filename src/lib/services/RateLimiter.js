/**
 * Retry Service - Implements exponential backoff retry logic with jitter
 */
export class RetryService {
  constructor() {
    this.maxAttempts = 3;
    this.baseDelay = 1000; // 1 second
    this.maxDelay = 30000; // 30 seconds
    this.jitterFactor = 0.2; // 20% jitter
  }

  /**
   * Execute function with retry logic
   */
  async execute(fn, options = {}) {
    const {
      maxAttempts = this.maxAttempts,
      baseDelay = this.baseDelay,
      maxDelay = this.maxDelay,
      jitterFactor = this.jitterFactor,
      onRetry = null,
      retryCondition = null
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if we should retry this error
        if (!this.shouldRetry(error, retryCondition)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, baseDelay, maxDelay, jitterFactor);

        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt, error);
        }

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Determine if an error should be retried
   */
  shouldRetry(error, customCondition = null) {
    // Use custom condition if provided
    if (customCondition) {
      return customCondition(error);
    }

    // Default retry conditions
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'AbortError',
      'TypeError', // Often network-related
    ];

    // Retry on network errors
    if (retryableErrors.includes(error.name)) {
      return true;
    }

    // Retry on HTTP 5xx errors
    if (error.message && error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504')) {
      return true;
    }

    // Retry on rate limiting (429)
    if (error.message && error.message.includes('429')) {
      return true;
    }

    // Don't retry on client errors (4xx) except rate limiting
    if (error.message && /^4\d{2}/.test(error.message)) {
      return false;
    }

    // Retry on timeout errors
    if (error.message && error.message.toLowerCase().includes('timeout')) {
      return true;
    }

    // Retry on connection errors
    if (error.message && error.message.toLowerCase().includes('connection')) {
      return true;
    }

    return false;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  calculateDelay(attempt, baseDelay, maxDelay, jitterFactor) {
    // Exponential backoff: baseDelay * (2 ^ (attempt - 1))
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = exponentialDelay * jitterFactor * Math.random();
    const delay = exponentialDelay + jitter;

    return Math.floor(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute with circuit breaker integration
   */
  async executeWithBreaker(fn, breaker, serviceName, options = {}) {
    try {
      const result = await this.execute(fn, options);
      breaker.recordSuccess(serviceName);
      return result;
    } catch (error) {
      breaker.recordFailure(serviceName);
      throw error;
    }
  }

  /**
   * Batch retry for multiple operations
   */
  async executeBatch(operations, options = {}) {
    const results = [];
    const errors = [];

    const {
      concurrency = 3,
      continueOnError = true
    } = options;

    // Process operations in chunks to control concurrency
    const chunks = this.chunkArray(operations, concurrency);

    for (const chunk of chunks) {
      const promises = chunk.map(async (operation) => {
        try {
          const result = await this.execute(operation.fn, operation.options || options);
          results.push(result);
        } catch (error) {
          errors.push({ operation, error });
          if (!continueOnError) {
            throw error;
          }
        }
      });

      await Promise.all(promises);
    }

    return { results, errors };
  }

  /**
   * Utility method to chunk arrays
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get retry statistics (for monitoring)
   */
  getStats() {
    return {
      maxAttempts: this.maxAttempts,
      baseDelay: this.baseDelay,
      maxDelay: this.maxDelay,
      jitterFactor: this.jitterFactor
    };
  }
}</content>
<parameter name="filePath">src/lib/services/RetryService.js