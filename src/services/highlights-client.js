/**
 * Highlights Client Service
 * Handles communication with the Highlights backend for video highlights and clips
 * Includes demo fallback, rate limiting, and circuit breaker patterns
 */

import { RateLimiter } from '../lib/services/RateLimiter.js';
import { CircuitBreaker } from '../lib/services/CircuitBreaker.js';

class HighlightsClient {
  constructor(options = {}) {
    // Configuration from environment variables
    this.baseUrl = options.baseUrl || import.meta.env.VITE_HIGHLIGHTS_API_URL || 'https://api.highlights.ai';
    this.apiKey = options.apiKey || import.meta.env.VITE_HIGHLIGHTS_API_KEY || '';
    this.enabled = options.enabled !== false && (import.meta.env.VITE_HIGHLIGHTS_ENABLED !== 'false');
    this.demoMode = options.demoMode || import.meta.env.VITE_HIGHLIGHTS_DEMO_MODE === 'true';

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
      errors: 0,
      demoFallbacks: 0
    };

    console.log(`[HighlightsClient] Initialized with baseUrl: ${this.baseUrl}, demoMode: ${this.demoMode}`);
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.enabled && !this.demoMode;
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
      return this.getDemoHighlights(params);
    }

    // Circuit breaker check
    if (!this.circuitBreaker.canProceed('highlights')) {
      console.warn('[HighlightsClient] Circuit breaker OPEN, using demo fallback');
      return this.getDemoHighlights(params);
    }

    // Rate limit check
    if (!this.rateLimiter.canProceed()) {
      console.warn('[HighlightsClient] Rate limit exceeded, using demo fallback');
      return this.getDemoHighlights(params);
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
      return this.getDemoHighlights(params);
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
      return this.getDemoReel(params);
    }

    if (!this.circuitBreaker.canProceed('highlights')) {
      console.warn('[HighlightsClient] Circuit breaker OPEN, using demo fallback');
      return this.getDemoReel(params);
    }

    if (!this.rateLimiter.canProceed()) {
      console.warn('[HighlightsClient] Rate limit exceeded, using demo fallback');
      return this.getDemoReel(params);
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

      return this.getDemoReel(params);
    }
  }

  /**
   * Get highlight extraction status
   * @param {string} jobId - Job ID from extraction request
   * @returns {Promise<Object>} - Status information
   */
  async getExtractionStatus(jobId) {
    if (!this.isAvailable()) {
      return this.getDemoExtractionStatus(jobId);
    }

    if (!this.circuitBreaker.canProceed('highlights')) {
      return this.getDemoExtractionStatus(jobId);
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
      return this.getDemoExtractionStatus(jobId);
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
   * Get demo highlights data when service is unavailable
   */
  getDemoHighlights(params) {
    this.stats.demoFallbacks++;

    // Mock highlight extraction with realistic delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockHighlights = [
          {
            id: 'highlight-1',
            startTime: 10.5,
            endTime: 15.2,
            duration: 4.7,
            confidence: 0.95,
            thumbnailUrl: 'https://demo.highlights.ai/thumbnails/highlight-1.jpg',
            clipUrl: 'https://demo.highlights.ai/clips/highlight-1.mp4',
            description: 'Exciting moment with high engagement'
          },
          {
            id: 'highlight-2',
            startTime: 45.0,
            endTime: 52.8,
            duration: 7.8,
            confidence: 0.89,
            thumbnailUrl: 'https://demo.highlights.ai/thumbnails/highlight-2.jpg',
            clipUrl: 'https://demo.highlights.ai/clips/highlight-2.mp4',
            description: 'Key action sequence'
          },
          {
            id: 'highlight-3',
            startTime: 120.3,
            endTime: 127.1,
            duration: 6.8,
            confidence: 0.92,
            thumbnailUrl: 'https://demo.highlights.ai/thumbnails/highlight-3.jpg',
            clipUrl: 'https://demo.highlights.ai/clips/highlight-3.mp4',
            description: 'Emotional peak moment'
          }
        ].slice(0, params.maxHighlights || 3);

        resolve({
          success: true,
          highlights: mockHighlights,
          totalHighlights: mockHighlights.length,
          sourceVideoUrl: params.videoUrl,
          extractedAt: new Date().toISOString(),
          source: 'demo',
          isDemo: true,
          message: 'Demo mode: Service unavailable, returning mock highlights'
        });
      }, 2500); // 2.5 second delay to simulate processing
    });
  }

  /**
   * Get demo reel data when service is unavailable
   */
  getDemoReel(params) {
    this.stats.demoFallbacks++;

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          reelUrl: 'https://demo.highlights.ai/reels/demo-reel.mp4',
          thumbnailUrl: 'https://demo.highlights.ai/thumbnails/demo-reel-thumb.jpg',
          duration: Math.min(params.maxDuration || 30, 30),
          highlightsUsed: params.timestamps?.length || 3,
          createdAt: new Date().toISOString(),
          source: 'demo',
          isDemo: true,
          message: 'Demo mode: Service unavailable, returning mock reel'
        });
      }, 4000); // 4 second delay to simulate processing
    });
  }

  /**
   * Get demo extraction status
   */
  getDemoExtractionStatus(jobId) {
    return {
      jobId,
      status: 'completed',
      progress: 100,
      estimatedTimeRemaining: 0,
      result: {
        highlights: [
          {
            id: 'demo-highlight-1',
            startTime: 5.0,
            endTime: 12.0,
            duration: 7.0,
            confidence: 0.9,
            thumbnailUrl: 'https://demo.highlights.ai/thumbnails/demo-highlight.jpg',
            clipUrl: 'https://demo.highlights.ai/clips/demo-highlight.mp4'
          }
        ]
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
      errors: 0,
      demoFallbacks: 0
    };
  }
}

// Export singleton instance
const highlightsClient = new HighlightsClient();
export default highlightsClient;
export { HighlightsClient };