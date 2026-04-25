import { MuapiClient } from '../muapi.js';
import { SecurityService } from './SecurityService.js';
import { RetryService } from './RateLimiter.js';
import { RateLimiter } from './RateLimiter.js';
import { CircuitBreaker } from './CircuitBreaker.js';
import { CacheService } from './CacheService.js';
import { WebSocketService } from './WebSocketService.js';
import { MonitoringService } from './MonitoringService.js';

/**
 * AI Service Layer - Production-ready AI integration service
 * Separates AI logic from UI components with comprehensive error handling
 */
export class AIService {
  constructor() {
    this.muapi = new MuapiClient();
    this.security = new SecurityService();
    this.retry = new RetryService();
    this.rateLimiter = new RateLimiter();
    this.circuitBreaker = new CircuitBreaker();
    this.cache = new CacheService();
    this.websocket = new WebSocketService();
    this.monitoring = new MonitoringService();

    this.activeRequests = new Map();
    this.requestIds = new Set();

    this.initialize();
  }

  async initialize() {
    try {
      await this.security.initialize();
      await this.websocket.connect();
      this.monitoring.start();
    } catch (error) {
      console.error('[AIService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Secure API key management with encryption
   */
  async setApiKey(key) {
    if (!key || key.length < 20) {
      throw new Error('Invalid API key format');
    }
    await this.security.storeEncryptedKey(key);
    this.muapi = new MuapiClient(); // Recreate with new key
  }

  async getApiKey() {
    return await this.security.getDecryptedKey();
  }

  /**
   * Generate image with all production safeguards
   */
  async generateImage(params, options = {}) {
    const requestId = this.generateRequestId(params);

    // Request deduplication
    if (this.requestIds.has(requestId)) {
      throw new Error('Duplicate request in progress');
    }

    this.requestIds.add(requestId);

    try {
      // Rate limiting
      await this.rateLimiter.acquire('image_generation');

      // Circuit breaker
      if (!this.circuitBreaker.canProceed('image_generation')) {
        throw new Error('Service temporarily unavailable');
      }

      // Cache check
      const cached = this.cache.get(requestId);
      if (cached && !options.skipCache) {
        this.monitoring.record('cache_hit', { type: 'image' });
        return cached;
      }

      // Retry logic with exponential backoff
      const result = await this.retry.execute(async () => {
        const controller = new AbortController();
        this.activeRequests.set(requestId, controller);

        try {
          const startTime = Date.now();
          const result = await this.muapi.generateImage(params, controller.signal);

          this.monitoring.record('api_call', {
            type: 'image',
            duration: Date.now() - startTime,
            success: true
          });

          return result;
        } finally {
          this.activeRequests.delete(requestId);
        }
      }, {
        maxAttempts: 3,
        baseDelay: 1000,
        onRetry: (attempt, error) => {
          this.monitoring.record('retry', { attempt, error: error.message });
        }
      });

      // Cache successful result
      this.cache.set(requestId, result, 300000); // 5 minutes

      this.circuitBreaker.recordSuccess('image_generation');
      return result;

    } catch (error) {
      this.circuitBreaker.recordFailure('image_generation');
      this.monitoring.record('error', {
        type: 'image_generation',
        error: error.message
      });
      throw error;
    } finally {
      this.requestIds.delete(requestId);
    }
  }

  /**
   * Generate video with enhanced monitoring
   */
  async generateVideo(params, options = {}) {
    const requestId = this.generateRequestId(params);

    if (this.requestIds.has(requestId)) {
      throw new Error('Duplicate request in progress');
    }

    this.requestIds.add(requestId);

    try {
      await this.rateLimiter.acquire('video_generation');

      if (!this.circuitBreaker.canProceed('video_generation')) {
        throw new Error('Video generation service temporarily unavailable');
      }

      const cached = this.cache.get(requestId);
      if (cached && !options.skipCache) {
        return cached;
      }

      // WebSocket-based real-time polling for long-running video tasks
      const result = await this.retry.execute(async () => {
        const controller = new AbortController();
        this.activeRequests.set(requestId, controller);

        try {
          const result = await this.muapi.generateVideo(params, controller.signal);

          // If result has request_id, setup WebSocket polling
          if (result.request_id && !result.url) {
            return await this.websocket.pollForResult(result.request_id, 'video');
          }

          return result;
        } finally {
          this.activeRequests.delete(requestId);
        }
      }, {
        maxAttempts: 2, // Fewer retries for expensive video generation
        baseDelay: 2000
      });

      this.cache.set(requestId, result, 600000); // 10 minutes
      this.circuitBreaker.recordSuccess('video_generation');
      return result;

    } catch (error) {
      this.circuitBreaker.recordFailure('video_generation');
      throw error;
    } finally {
      this.requestIds.delete(requestId);
    }
  }

  /**
   * WAN AI Effects implementation
   */
  async applyWanAIEffect(videoUrl, effectType, options = {}) {
    const params = {
      video_url: videoUrl,
      effect_type: effectType,
      prompt: options.prompt || `Apply ${effectType} style transformation`,
      ...options
    };

    return await this.generateVideoEffect(params);
  }

  /**
   * Complete WAN AI effects implementation
   */
  async generateVideoEffect(params, options = {}) {
    const requestId = this.generateRequestId(params);

    if (this.requestIds.has(requestId)) {
      throw new Error('Duplicate effect request in progress');
    }

    this.requestIds.add(requestId);

    try {
      await this.rateLimiter.acquire('effect_generation');

      if (!this.circuitBreaker.canProceed('effect_generation')) {
        throw new Error('Effect generation service temporarily unavailable');
      }

      const result = await this.retry.execute(async () => {
        const controller = new AbortController();
        this.activeRequests.set(requestId, controller);

        try {
          return await this.muapi.generateVideoEffect(params, controller.signal);
        } finally {
          this.activeRequests.delete(requestId);
        }
      }, {
        maxAttempts: 3,
        baseDelay: 1500
      });

      this.circuitBreaker.recordSuccess('effect_generation');
      return result;

    } catch (error) {
      this.circuitBreaker.recordFailure('effect_generation');
      throw error;
    } finally {
      this.requestIds.delete(requestId);
    }
  }

  /**
   * Batch processing for multiple requests
   */
  async batchProcess(requests, options = {}) {
    const results = [];
    const errors = [];

    // Process in parallel with concurrency control
    const concurrency = options.concurrency || 3;
    const chunks = this.chunkArray(requests, concurrency);

    for (const chunk of chunks) {
      const promises = chunk.map(async (request) => {
        try {
          const result = await this.processRequest(request);
          results.push(result);
        } catch (error) {
          errors.push({ request, error: error.message });
        }
      });

      await Promise.all(promises);
    }

    return { results, errors };
  }

  async processRequest(request) {
    const { type, params, options = {} } = request;

    switch (type) {
      case 'image':
        return await this.generateImage(params, options);
      case 'video':
        return await this.generateVideo(params, options);
      case 'effect':
        return await this.generateVideoEffect(params, options);
      default:
        throw new Error(`Unknown request type: ${type}`);
    }
  }

  /**
   * State recovery mechanisms
   */
  async recoverState(sessionId) {
    try {
      const cachedState = this.cache.get(`session_${sessionId}`);
      if (cachedState) {
        // Validate and restore active requests
        for (const [requestId, data] of Object.entries(cachedState.activeRequests || {})) {
          if (data.status === 'polling') {
            // Resume polling for incomplete requests
            this.websocket.pollForResult(requestId, data.type).then(result => {
              // Notify listeners of recovered result
              this.emit('recovered_result', { requestId, result });
            });
          }
        }
        return cachedState;
      }
    } catch (error) {
      console.error('[AIService] State recovery failed:', error);
    }
    return null;
  }

  async saveState(sessionId, state) {
    this.cache.set(`session_${sessionId}`, {
      ...state,
      activeRequests: Object.fromEntries(this.activeRequests),
      timestamp: Date.now()
    }, 3600000); // 1 hour
  }

  /**
   * Cancel active request
   */
  cancelRequest(requestId) {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      this.requestIds.delete(requestId);
      this.monitoring.record('cancelled', { requestId });
    }
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests() {
    for (const [requestId, controller] of this.activeRequests) {
      controller.abort();
    }
    this.activeRequests.clear();
    this.requestIds.clear();
    this.monitoring.record('cancelled_all');
  }

  /**
   * Generate unique request ID
   */
  generateRequestId(params) {
    const key = JSON.stringify(params);
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `req_${Math.abs(hash)}_${Date.now()}`;
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
   * Event emitter for real-time updates
   */
  on(event, callback) {
    this.websocket.on(event, callback);
  }

  off(event, callback) {
    this.websocket.off(event, callback);
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      circuitBreaker: this.circuitBreaker.getStatus(),
      rateLimiter: this.rateLimiter.getStatus(),
      websocket: this.websocket.isConnected(),
      activeRequests: this.activeRequests.size,
      cache: this.cache.getStats(),
      monitoring: this.monitoring.getStats()
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.cancelAllRequests();
    this.websocket.disconnect();
    this.monitoring.stop();
    this.cache.clear();
  }
}

// Singleton instance
export const aiService = new AIService();</content>
<parameter name="filePath">src/lib/services/AIService.js