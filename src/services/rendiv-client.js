/**
 * Rendiv Client Service
 * Handles communication with the Rendiv backend for animation and effects
 * Rate limiting and circuit breaker patterns
 */

import { RateLimiter } from '../lib/services/RateLimiter.js';
import { CircuitBreaker } from '../lib/services/CircuitBreaker.js';

class RendivClient {
  constructor(options = {}) {
    // Configuration from environment variables
    this.baseUrl = options.baseUrl || import.meta.env.VITE_RENDIV_API_URL;
    this.apiKey = options.apiKey || import.meta.env.VITE_RENDIV_API_KEY || '';
    this.enabled = options.enabled !== false && (import.meta.env.VITE_RENDIV_ENABLED !== 'false');

    // Initialize supporting services
    this.rateLimiter = new RateLimiter({
      rate: options.rateLimit || 50, // 50 requests per minute
      duration: 60000
    });

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 60000
    });

    // Add Rendiv service to circuit breaker
    this.circuitBreaker.addService('rendiv', {
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

    console.log(`[RendivClient] Initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.enabled;
  }

  /**
   * Apply animation effect to video/clip
   * @param {Object} params - Animation parameters
   * @param {string} params.videoUrl - Source video URL
   * @param {string} params.effectType - Type of animation effect
   * @param {Object} params.settings - Effect-specific settings
   * @returns {Promise<Object>} - Animation result with processed video URL
   */
   async applyAnimation(params) {
     if (!this.enabled) {
       throw new Error('Rendiv service is disabled. Configure VITE_RENDIV_ENABLED=true and valid API URL.');
     }

     // Circuit breaker check
     if (!this.circuitBreaker.canProceed('rendiv')) {
       throw new Error('Rendiv circuit breaker is open. Service temporarily unavailable.');
     }

     // Rate limit check
     if (!this.rateLimiter.canProceed()) {
       throw new Error('Rendiv rate limit exceeded. Please slow down requests.');
     }

     try {
       const response = await this.makeRequest('/animate', {
         method: 'POST',
         body: JSON.stringify(params),
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${this.apiKey}`
         }
       });

       const result = await response.json();

       // Record success
       this.circuitBreaker.recordSuccess('rendiv');
       this.stats.requests++;

       return {
         success: true,
         videoUrl: result.animated_video_url,
         thumbnailUrl: result.thumbnail_url,
         effectType: params.effectType,
         duration: result.duration,
         appliedAt: new Date().toISOString(),
         source: 'rendiv'
       };

     } catch (error) {
       console.error('[RendivClient] Animation failed:', error);
       this.circuitBreaker.recordFailure('rendiv');
       this.stats.errors++;
       throw error;
     }
   }

  /**
   * Get available animation effects
   * @returns {Promise<Array>} - List of available effects
   */
   async getEffects() {
     if (!this.isAvailable()) {
       throw new Error('Rendiv service is not available. Configure VITE_RENDIV_API_URL and VITE_RENDIV_ENABLED=true.');
     }

     if (!this.circuitBreaker.canProceed('rendiv')) {
       throw new Error('Rendiv circuit breaker is open.');
     }

     try {
       const response = await this.makeRequest('/effects');
       const result = await response.json();

       this.stats.requests++;

       return result.effects || [];

     } catch (error) {
       console.error('[RendivClient] Failed to get effects:', error);
       this.circuitBreaker.recordFailure('rendiv');
       throw error;
     }
   }

    if (!this.circuitBreaker.canProceed('rendiv')) {
      throw new Error('Rendiv service unavailable');
    }

    try {
      const response = await this.makeRequest('/effects');
      const result = await response.json();

      this.stats.requests++;

      return result.effects || [];

    } catch (error) {
      console.error('[RendivClient] Get effects failed:', error);
      this.stats.errors++;
      throw new Error('Rendiv service unavailable');
    }
  }

  /**
   * Get animation job status
   * @param {string} jobId - Job ID from animation request
   * @returns {Promise<Object>} - Status information
   */
  async getAnimationStatus(jobId) {
    if (!this.isAvailable()) {
      throw new Error('Rendiv service unavailable');
    }

    if (!this.circuitBreaker.canProceed('rendiv')) {
      throw new Error('Rendiv service unavailable');
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
      console.error('[RendivClient] Status check failed:', error);
      this.stats.errors++;
      throw new Error('Rendiv service unavailable');
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
        throw new Error(`Rendiv API error: ${response.status} ${response.statusText}`);
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
   * Get client statistics
   */
  getStats() {
    return {
      ...this.stats,
      rateLimiter: this.rateLimiter.getAvailableTokens(),
      circuitBreaker: this.circuitBreaker.getServiceStatus('rendiv'),
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
const rendivClient = new RendivClient();
export default rendivClient;
export { RendivClient };