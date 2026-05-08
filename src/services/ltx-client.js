/**
 * LTX Client Service
 * Handles communication with the LTX backend for AI video generation
 * Includes demo fallback, rate limiting, and circuit breaker patterns
 */

import { RateLimiter } from '../lib/services/RateLimiter.js';
import { CircuitBreaker } from '../lib/services/CircuitBreaker.js';

class LtxClient {
  constructor(options = {}) {
    // Configuration from environment variables
    this.baseUrl = options.baseUrl || import.meta.env.VITE_LTX_API_URL || 'https://api.ltx.ai';
    this.apiKey = options.apiKey || import.meta.env.VITE_LTX_API_KEY || '';
    this.enabled = options.enabled !== false && (import.meta.env.VITE_LTX_ENABLED !== 'false');
    this.demoMode = options.demoMode || import.meta.env.VITE_LTX_DEMO_MODE === 'true';

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
      errors: 0,
      demoFallbacks: 0
    };

    console.log(`[LtxClient] Initialized with baseUrl: ${this.baseUrl}, demoMode: ${this.demoMode}`);
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.enabled && !this.demoMode;
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
      return this.getDemoVideo(params);
    }

    // Circuit breaker check
    if (!this.circuitBreaker.canProceed('ltx')) {
      console.warn('[LtxClient] Circuit breaker OPEN, using demo fallback');
      return this.getDemoVideo(params);
    }

    // Rate limit check
    if (!this.rateLimiter.canProceed()) {
      console.warn('[LtxClient] Rate limit exceeded, using demo fallback');
      return this.getDemoVideo(params);
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

      // Fallback to demo mode on error
      return this.getDemoVideo(params);
    }
  }

  /**
   * Get video generation status
   * @param {string} jobId - Job ID from generation request
   * @returns {Promise<Object>} - Status information
   */
  async getGenerationStatus(jobId) {
    if (!this.isAvailable()) {
      return this.getDemoStatus(jobId);
    }

    if (!this.circuitBreaker.canProceed('ltx')) {
      return this.getDemoStatus(jobId);
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
      return this.getDemoStatus(jobId);
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
   * Get demo video data when service is unavailable
   */
  getDemoVideo(params) {
    this.stats.demoFallbacks++;

    // Mock video generation with realistic delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          videoUrl: 'https://demo.ltx.ai/videos/demo-generated.mp4',
          thumbnailUrl: 'https://demo.ltx.ai/thumbnails/demo-thumb.jpg',
          duration: params.duration || 5,
          aspectRatio: params.aspectRatio || '16:9',
          prompt: params.prompt,
          generatedAt: new Date().toISOString(),
          source: 'demo',
          isDemo: true,
          message: 'Demo mode: Service unavailable, returning mock data'
        });
      }, 2000); // 2 second delay to simulate processing
    });
  }

  /**
   * Get demo status data
   */
  getDemoStatus(jobId) {
    return {
      jobId,
      status: 'completed',
      progress: 100,
      estimatedTimeRemaining: 0,
      result: {
        videoUrl: 'https://demo.ltx.ai/videos/demo-generated.mp4',
        thumbnailUrl: 'https://demo.ltx.ai/thumbnails/demo-thumb.jpg'
      },
      isDemo: true
    };
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
      errors: 0,
      demoFallbacks: 0
    };
  }
}

// Export singleton instance
const ltxClient = new LtxClient();
export default ltxClient;
export { LtxClient };