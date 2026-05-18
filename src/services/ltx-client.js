/**
 * LTX Client Service
 * Handles communication with the LTX backend for AI video generation
 * Rate limiting and circuit breaker patterns
 */

import { RateLimiter } from '../lib/services/RateLimiter.js';
import { CircuitBreaker } from '../lib/services/CircuitBreaker.js';

class LtxClient {
  constructor(options = {}) {
    // Configuration from environment variables
    this.baseUrl = options.baseUrl || import.meta.env.VITE_LTX_API_URL;
    this.apiKey = options.apiKey || import.meta.env.VITE_LTX_API_KEY || '';
    this.enabled = options.enabled !== false && (import.meta.env.VITE_LTX_ENABLED !== 'false');

    // Initialize supporting services
    this.rateLimiter = new RateLimiter({
      rate: options.rateLimit || 30, // 30 requests per minute
      duration: 60000
    });

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 60000
    });

    // Add LTX service to circuit breaker
    this.circuitBreaker.addService('ltx', {
      failureThreshold: 3,
      recoveryTimeout: 30000
    });

    // Statistics tracking
    this.stats = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };

    console.log(`[LtxClient] Initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.enabled;
  }

  /**
   * Generate video using LTX API
   * @param {Object} params - Generation parameters
   * @param {string} params.prompt - Text prompt for video generation
   * @param {number} params.duration - Video duration in seconds
   * @param {string} params.aspectRatio - Aspect ratio (16:9, 9:16, etc.)
   * @returns {Promise<Object>} - Generation result with video URL and metadata
   */
   async generateVideo(params) {
     if (!this.enabled) {
       throw new Error('LTX service is disabled. Configure VITE_LTX_ENABLED=true and valid API URL.');
     }

     // Circuit breaker check
     if (!this.circuitBreaker.canProceed('ltx')) {
       throw new Error('LTX circuit breaker is open. Service temporarily unavailable.');
     }

     // Rate limit check
     if (!this.rateLimiter.canProceed()) {
       throw new Error('LTX rate limit exceeded. Please slow down requests.');
     }

     try {
       const response = await this.makeRequest('/generate', {
         method: 'POST',
         body: JSON.stringify(params),
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${this.apiKey}`
         }
       });

       const result = await response.json();

       // Record success
       this.circuitBreaker.recordSuccess('ltx');
       this.stats.requests++;

       return {
         success: true,
         videoUrl: result.video_url,
         thumbnailUrl: result.thumbnail_url,
         duration: result.duration,
         aspectRatio: result.aspect_ratio,
        prompt: params.prompt,
        generatedAt: new Date().toISOString(),
        source: 'ltx'
      };

    } catch (error) {
      console.error('[LtxClient] Generation failed:', error);
      this.circuitBreaker.recordFailure('ltx');
      this.stats.errors++;

      // Service unavailable - throw error (no demo fallback)
      throw new Error('LTX service unavailable');
    }
  }

  /**
   * Get video generation status
   * @param {string} jobId - Job ID from generation request
   * @returns {Promise<Object>} - Status information
   */
  async getGenerationStatus(jobId) {
    if (!this.isAvailable()) {
      throw new Error('LTX service unavailable');
    }

    if (!this.circuitBreaker.canProceed('ltx')) {
      throw new Error('LTX service unavailable');
    }

    try {
      const response = await this.makeRequest(`/status/${jobId}`);
      const result = await response.json();

      this.stats.requests++;

      return {
        jobId,
        status: result.status, // 'pending', 'processing', 'completed', 'failed'
        progress: result.progress || 0,
        estimatedTimeRemaining: result.estimated_time_remaining,
        result: result.result,
        error: result.error
      };

    } catch (error) {
      console.error('[LtxClient] Status check failed:', error);
      this.stats.errors++;
      throw new Error('LTX service unavailable');
    }
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`LTX API error: ${response.status} ${response.statusText}`);
      }

      return response;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

/**
   * LTX service methods - no demo fallbacks (production-ready)
   */
  getDemoVideo() {
    throw new Error('LTX service unavailable - demo mode disabled');
  }

  getDemoStatus() {
    throw new Error('LTX service unavailable - demo mode disabled');
  }


  /**
   * Check LTX backend capabilities (used by UI to show real status)
   */
  async checkCapabilities() {
    if (!this.isAvailable()) {
      return { available: false, reason: 'LTX service disabled' };
    }
    try {
      const response = await this.makeRequest('/capabilities');
      const data = await response.json();
      return { available: true, ...data };
    } catch (e) {
      return { available: false, reason: e.message };
    }
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      ...this.stats,
      rateLimiter: this.rateLimiter.getAvailableTokens(),
      circuitBreaker: this.circuitBreaker.getServiceStatus('ltx'),
      isAvailable: this.isAvailable()
    };
  }

  /**
   * Reset rate limiter and circuit breaker
   */
  reset() {
    this.rateLimiter.reset();
    this.circuitBreaker.resetAllCircuits();
    this.stats = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };
  }
}

// Export singleton instance
const ltxClient = new LtxClient();
export default ltxClient;
export { LtxClient };