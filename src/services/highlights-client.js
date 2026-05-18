/**
 * Highlights Client Service
 * Handles communication with the Highlights backend for video highlights and clips
 * Rate limiting and circuit breaker patterns
 */

import { RateLimiter } from '../lib/services/RateLimiter.js';
import { CircuitBreaker } from '../lib/services/CircuitBreaker.js';

class HighlightsClient {
  constructor(options = {}) {
    // Configuration from environment variables
    this.baseUrl = options.baseUrl || import.meta.env.VITE_HIGHLIGHTS_API_URL;
    this.apiKey = options.apiKey || import.meta.env.VITE_HIGHLIGHTS_API_KEY || '';
    this.enabled = options.enabled !== false && (import.meta.env.VITE_HIGHLIGHTS_ENABLED !== 'false');

    // Initialize supporting services
    this.rateLimiter = new RateLimiter({
      rate: options.rateLimit || 40, // 40 requests per minute
      duration: 60000
    });

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 60000
    });

    // Add Highlights service to circuit breaker
    this.circuitBreaker.addService('highlights', {
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

    console.log(`[HighlightsClient] Initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.enabled;
  }

  /**
   * Extract highlights from video
   * @param {Object} params - Highlight extraction parameters
   * @param {string} params.videoUrl - Source video URL
   * @param {number} params.maxHighlights - Maximum number of highlights to extract
   * @param {number} params.minDuration - Minimum duration for each highlight (seconds)
   * @param {number} params.maxDuration - Maximum duration for each highlight (seconds)
   * @returns {Promise<Object>} - Extraction result with highlight clips
   */
   async extractHighlights(params) {
     if (!this.enabled) {
       throw new Error('Highlights service is disabled. Configure VITE_HIGHLIGHTS_ENABLED=true and valid API URL.');
     }

     // Circuit breaker check
     if (!this.circuitBreaker.canProceed('highlights')) {
       throw new Error('Highlights circuit breaker is open. Service temporarily unavailable.');
     }

     // Rate limit check
     if (!this.rateLimiter.canProceed()) {
       throw new Error('Highlights rate limit exceeded. Please slow down requests.');
     }

     try {
       const response = await this.makeRequest('/extract', {
         method: 'POST',
         body: JSON.stringify(params),
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${this.apiKey}`
         }
       });

       const result = await response.json();

       // Record success
       this.circuitBreaker.recordSuccess('highlights');
       this.stats.requests++;

       return {
         success: true,
         highlights: result.highlights || [],
         totalHighlights: result.highlights?.length || 0,
         sourceVideoUrl: params.videoUrl,
        extractedAt: new Date().toISOString(),
        source: 'highlights'
      };

    } catch (error) {
      console.error('[HighlightsClient] Highlight extraction failed:', error);
      this.circuitBreaker.recordFailure('highlights');
      this.stats.errors++;

      // Fallback to demo mode on error
      throw new Error('Highlights service unavailable');
    }
  }

  /**
   * Create highlight reel from video
   * @param {Object} params - Reel creation parameters
   * @param {string} params.videoUrl - Source video URL
   * @param {Array} params.timestamps - Array of timestamp objects with start/end times
   * @param {number} params.maxDuration - Maximum duration of the reel (seconds)
   * @returns {Promise<Object>} - Reel creation result
   */
  async createReel(params) {
    if (!this.enabled) {
      throw new Error('Highlights service unavailable');
    }

    if (!this.circuitBreaker.canProceed('highlights')) {
      console.warn('[HighlightsClient] Circuit breaker OPEN, using demo fallback');
      throw new Error('Highlights service unavailable');
    }

    if (!this.rateLimiter.canProceed()) {
      console.warn('[HighlightsClient] Rate limit exceeded, using demo fallback');
      throw new Error('Highlights service unavailable');
    }

    try {
      const response = await this.makeRequest('/reel', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const result = await response.json();

      this.circuitBreaker.recordSuccess('highlights');
      this.stats.requests++;

      return {
        success: true,
        reelUrl: result.reel_url,
        thumbnailUrl: result.thumbnail_url,
        duration: result.duration,
        highlightsUsed: result.highlights_used || 0,
        createdAt: new Date().toISOString(),
        source: 'highlights'
      };

    } catch (error) {
      console.error('[HighlightsClient] Reel creation failed:', error);
      this.circuitBreaker.recordFailure('highlights');
      this.stats.errors++;

      throw new Error('Highlights service unavailable');
    }
  }

  /**
   * Get highlight extraction status
   * @param {string} jobId - Job ID from extraction request
   * @returns {Promise<Object>} - Status information
   */
  async getExtractionStatus(jobId) {
    if (!this.isAvailable()) {
      throw new Error('Highlights service unavailable');
    }

    if (!this.circuitBreaker.canProceed('highlights')) {
      throw new Error('Highlights service unavailable');
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
      console.error('[HighlightsClient] Status check failed:', error);
      this.stats.errors++;
      throw new Error('Highlights service unavailable');
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
        throw new Error(`Highlights API error: ${response.status} ${response.statusText}`);
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
   * Highlights service methods - no demo fallbacks (Phase 1 complete)
   */
  getDemoHighlights() {
    throw new Error('Highlights service unavailable - demo mode disabled');
  }

  getDemoReel() {
    throw new Error('Highlights service unavailable - demo mode disabled');
  }

  getDemoStatus() {
    throw new Error('Highlights service unavailable - demo mode disabled');
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      ...this.stats,
      rateLimiter: this.rateLimiter.getAvailableTokens(),
      circuitBreaker: this.circuitBreaker.getServiceStatus('highlights'),
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
const highlightsClient = new HighlightsClient();
export default highlightsClient;
export { HighlightsClient };