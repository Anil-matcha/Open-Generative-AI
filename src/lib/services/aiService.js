import { MuapiClient } from '../muapi.js';
import { aiServiceConfig } from './aiServiceConfig.js';

/**
 * Comprehensive AI Service with advanced optimization layers
 * Features: Request deduplication, intelligent caching, batch processing,
 * advanced rate limiting, and graceful degradation
 */
export class AIService {
  constructor(options = {}) {
    this.config = { ...aiServiceConfig, ...options };
    this.muapi = new MuapiClient();

    // Core optimization components
    this.requestDeduplicator = new RequestDeduplicator(this.config.deduplication);
    this.intelligentCache = new IntelligentCache(this.config.cache);
    this.batchProcessor = new BatchProcessor(this.config.batch);
    this.advancedRateLimiter = new AdvancedRateLimiter(this.config.rateLimit);
    this.metricsCollector = new MetricsCollector(this.config.metrics);
    this.gracefulDegrader = new GracefulDegrader(this.config.degradation);

    // Request management
    this.activeRequests = new Map();
    this.requestQueue = new PriorityQueue();

    // Similarity detection for deduplication
    this.similarityDetector = new SimilarityDetector();

    // Integration hooks
    this.hooks = {
      beforeRequest: [],
      afterRequest: [],
      onError: [],
      onBatchComplete: [],
      onRateLimit: [],
      onCacheHit: [],
      onCacheMiss: []
    };

    this.initialized = false;
  }

  /**
   * Initialize the AI service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await this.intelligentCache.initialize();
      await this.advancedRateLimiter.initialize();
      this.metricsCollector.start();
      this.initialized = true;
    } catch (error) {
      console.error('[AIService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate content with full optimization pipeline
   */
  async generate(params, options = {}) {
    const startTime = Date.now();

    try {
      // Pre-request hooks
      await this.executeHooks('beforeRequest', { params, options });

      // Request deduplication with similarity detection
      const dedupeKey = await this.requestDeduplicator.getDedupeKey(params);
      if (this.requestDeduplicator.isDuplicate(dedupeKey)) {
        this.metricsCollector.record('deduplication_hit');
        return this.requestDeduplicator.getDuplicateResult(dedupeKey);
      }

      // Intelligent caching
      const cacheKey = await this.intelligentCache.generateCacheKey(params);
      const cached = this.intelligentCache.get(cacheKey, params);
      if (cached && !options.skipCache) {
        this.metricsCollector.record('cache_hit', { type: params.type || 'unknown' });
        await this.executeHooks('onCacheHit', { params, cached });
        return cached;
      }

      await this.executeHooks('onCacheMiss', { params });

      // Rate limiting with priority queues
      const priority = this.calculatePriority(params, options);
      await this.advancedRateLimiter.acquire(params.type || 'default', priority);

      // Check if we should batch this request
      if (this.batchProcessor.shouldBatch(params)) {
        return await this.batchProcessor.addToBatch(params, options);
      }

      // Execute the request
      const result = await this.executeRequest(params, options);

      // Cache the result
      this.intelligentCache.set(cacheKey, result, params);

      // Post-request hooks
      await this.executeHooks('afterRequest', { params, result, duration: Date.now() - startTime });

      this.metricsCollector.record('request_success', {
        type: params.type || 'unknown',
        duration: Date.now() - startTime
      });

      return result;

    } catch (error) {
      this.metricsCollector.record('request_error', {
        type: params.type || 'unknown',
        error: error.message,
        duration: Date.now() - startTime
      });

      await this.executeHooks('onError', { params, error });

      // Graceful degradation
      if (this.gracefulDegrader.shouldDegrade(error)) {
        return this.gracefulDegrader.getFallbackResponse(params, error);
      }

      throw error;
    }
  }

  /**
   * Execute a single request
   */
  async executeRequest(params, options = {}) {
    const requestId = this.generateRequestId();

    try {
      // Register active request
      this.activeRequests.set(requestId, { params, startTime: Date.now() });

      // Circuit breaker check (if available)
      if (this.gracefulDegrader.isServiceAvailable(params.type)) {
        const result = await this.callAppropriateGenerateMethod(params);
        return result;
      } else {
        throw new Error(`Service ${params.type} is currently unavailable`);
      }

    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  async callAppropriateGenerateMethod(params) {
    const methodMap = {
      'text-to-image': 'generateImage',
      'image-to-image': 'generateI2I',
      'text-to-video': 'generateVideo',
      'image-to-video': 'generateI2V',
      'video-to-video': 'generateV2V', // Assuming this exists or maps to appropriate method
      'avatar': 'generateAvatar',
      'audio': 'generateAudio',
      'text': 'generateText',
      'effect': 'generateVideoEffect',
      'anime': 'generateAnime',
      'music': 'generateMusic'
    };

    const methodName = methodMap[params.type] || 'generateImage';
    if (this.muapi[methodName]) {
      return await this.muapi[methodName](params);
    } else {
      throw new Error(`Unsupported generation type: ${params.type}`);
    }
  }

  /**
   * Batch generate multiple requests
   */
  async generateBatch(requests, options = {}) {
    const startTime = Date.now();
    const results = [];
    const errors = [];

    try {
      // Group similar requests for batching
      const groupedRequests = this.batchProcessor.groupSimilarRequests(requests);

      // Process each group
      for (const group of groupedRequests) {
        try {
          const batchResults = await this.batchProcessor.processBatch(group, options);
          results.push(...batchResults);
        } catch (error) {
          // Handle batch errors gracefully
          for (const request of group) {
            errors.push({ request, error: error.message });
          }
        }
      }

      await this.executeHooks('onBatchComplete', { results, errors, duration: Date.now() - startTime });

      this.metricsCollector.record('batch_complete', {
        totalRequests: requests.length,
        successful: results.length,
        failed: errors.length,
        duration: Date.now() - startTime
      });

      return { results, errors };

    } catch (error) {
      this.metricsCollector.record('batch_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Cancel active request
   */
  cancelRequest(requestId) {
    if (this.activeRequests.has(requestId)) {
      this.activeRequests.delete(requestId);
      this.metricsCollector.record('request_cancelled');
      return true;
    }
    return false;
  }

  /**
   * Get service health and metrics
   */
  getHealthStatus() {
    return {
      initialized: this.initialized,
      activeRequests: this.activeRequests.size,
      cache: this.intelligentCache.getStats(),
      rateLimiter: this.advancedRateLimiter.getStats(),
      metrics: this.metricsCollector.getSummary(),
      degradation: this.gracefulDegrader.getStatus()
    };
  }

  /**
   * Register integration hooks
   */
  on(event, callback) {
    if (this.hooks[event]) {
      this.hooks[event].push(callback);
    }
  }

  /**
   * Unregister integration hooks
   */
  off(event, callback) {
    if (this.hooks[event]) {
      const index = this.hooks[event].indexOf(callback);
      if (index > -1) {
        this.hooks[event].splice(index, 1);
      }
    }
  }

  /**
   * Execute hooks for an event
   */
  async executeHooks(event, data) {
    const eventHooks = this.hooks[event] || [];
    for (const hook of eventHooks) {
      try {
        await hook(data);
      } catch (error) {
        console.warn(`[AIService] Hook execution failed for ${event}:`, error);
      }
    }
  }

  /**
   * Calculate request priority
   */
  calculatePriority(params, options) {
    if (options.priority) return options.priority;

    // Default priority based on request type
    const typePriorities = {
      'text-to-image': 3,
      'image-to-image': 4,
      'text-to-video': 5,
      'video-to-video': 6,
      'effect': 2,
      'analysis': 1
    };

    return typePriorities[params.type] || 3;
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.activeRequests.clear();
    this.requestQueue.clear();
    this.intelligentCache.destroy();
    this.advancedRateLimiter.destroy();
    this.metricsCollector.stop();
  }
}

/**
 * Request Deduplicator with similarity detection
 */
class RequestDeduplicator {
  constructor() {
    this.activeRequests = new Map();
    this.similarityThreshold = 0.85;
  }

  async getDedupeKey(params) {
    // Create content hash using Web Crypto API
    const data = new TextEncoder().encode(JSON.stringify(params));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const contentHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Check for similar requests
    const similar = this.findSimilarRequest(params);
    if (similar) {
      return similar.key;
    }

    return contentHash;
  }

  findSimilarRequest(params) {
    for (const [key, request] of this.activeRequests) {
      if (this.calculateSimilarity(params, request.params) > this.similarityThreshold) {
        return { key, request };
      }
    }
    return null;
  }

  calculateSimilarity(params1, params2) {
    // Simple similarity based on common parameters
    const keys1 = Object.keys(params1);
    const keys2 = Object.keys(params2);
    const commonKeys = keys1.filter(key => keys2.includes(key));

    if (commonKeys.length === 0) return 0;

    let similarCount = 0;
    for (const key of commonKeys) {
      if (params1[key] === params2[key]) {
        similarCount++;
      }
    }

    return similarCount / Math.max(keys1.length, keys2.length);
  }

  isDuplicate(key) {
    return this.activeRequests.has(key);
  }

  getDuplicateResult(key) {
    const request = this.activeRequests.get(key);
    return request ? request.result : null;
  }

  registerRequest(key, params, result = null) {
    this.activeRequests.set(key, { params, result, timestamp: Date.now() });
  }

  unregisterRequest(key) {
    this.activeRequests.delete(key);
  }
}

/**
 * Intelligent Cache with TTL, content-based keys, and invalidation
 */
class IntelligentCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.cache = new Map();
    this.accessOrder = new Map();
    this.contentKeys = new Map(); // Content-based key mapping
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  async initialize() {
    // Load persisted cache if available
  }

  async generateCacheKey(params) {
    // Content-based key generation
    const keyComponents = {
      type: params.type,
      prompt: params.prompt,
      model: params.model,
      dimensions: params.width && params.height ? `${params.width}x${params.height}` : undefined
    };

    const keyString = JSON.stringify(keyComponents);
    const data = new TextEncoder().encode(keyString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const contentKey = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Store mapping for invalidation
    this.contentKeys.set(contentKey, keyComponents);

    return contentKey;
  }

  get(key, params = {}) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() > entry.expiry) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access order
    this.accessOrder.delete(key);
    this.accessOrder.set(key, Date.now());

    this.stats.hits++;
    return entry.value;
  }

  set(key, value, params = {}) {
    const ttl = params.ttl || this.calculateTTL(params);
    const expiry = Date.now() + ttl;

    if (this.cache.has(key)) {
      this.accessOrder.delete(key);
    }

    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, { value, expiry, params });
    this.accessOrder.set(key, Date.now());
    this.stats.sets++;
  }

  calculateTTL(params) {
    // Dynamic TTL based on content type and parameters
    const typeMultipliers = {
      'text-to-image': 1,
      'image-to-image': 0.8,
      'text-to-video': 2,
      'video-to-video': 1.5,
      'effect': 0.5
    };

    const multiplier = typeMultipliers[params.type] || 1;
    return this.defaultTTL * multiplier;
  }

  delete(key) {
    if (this.cache.delete(key)) {
      this.accessOrder.delete(key);
      this.stats.deletes++;
      return true;
    }
    return false;
  }

  invalidate(pattern) {
    // Invalidate cache entries matching a pattern
    const keysToDelete = [];
    for (const [key, entry] of this.cache) {
      if (this.matchesPattern(entry.params, pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  matchesPattern(params, pattern) {
    for (const [key, value] of Object.entries(pattern)) {
      if (params[key] !== value) {
        return false;
      }
    }
    return true;
  }

  evictLRU() {
    if (this.accessOrder.size === 0) return;

    const [oldestKey] = this.accessOrder.keys();
    this.delete(oldestKey);
    this.stats.evictions++;
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  destroy() {
    this.cache.clear();
    this.accessOrder.clear();
    this.contentKeys.clear();
  }
}

/**
 * Batch Processor for similar requests
 */
class BatchProcessor {
  constructor(options = {}) {
    this.maxBatchSize = options.maxBatchSize || 10;
    this.maxWaitTime = options.maxWaitTime || 5000; // 5 seconds
    this.batches = new Map();
    this.batchTimers = new Map();
  }

  shouldBatch(params) {
    // Batch requests of the same type with similar parameters
    return params.type && ['text-to-image', 'image-to-image'].includes(params.type);
  }

  async addToBatch(params, options = {}) {
    const batchKey = this.getBatchKey(params);
    let batch = this.batches.get(batchKey);

    if (!batch) {
      batch = {
        requests: [],
        promises: [],
        resolvers: []
      };
      this.batches.set(batchKey, batch);

      // Set timer for batch execution
      const timer = setTimeout(() => {
        this.executeBatch(batchKey);
      }, this.maxWaitTime);

      this.batchTimers.set(batchKey, timer);
    }

    // Add request to batch
    return new Promise((resolve, reject) => {
      batch.requests.push({ params, options });
      batch.resolvers.push({ resolve, reject });

      // Execute batch if full
      if (batch.requests.length >= this.maxBatchSize) {
        this.executeBatch(batchKey);
      }
    });
  }

  async executeBatch(batchKey) {
    const batch = this.batches.get(batchKey);
    if (!batch) return;

    // Clear timer
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }

    try {
      // Process batch (simplified - would integrate with actual batch API)
      const results = await this.processBatchRequests(batch.requests);

      // Resolve all promises
      batch.resolvers.forEach(({ resolve }, index) => {
        resolve(results[index]);
      });

    } catch (error) {
      // Reject all promises
      batch.resolvers.forEach(({ reject }) => {
        reject(error);
      });
    }

    // Clean up
    this.batches.delete(batchKey);
  }

  async processBatchRequests(requests) {
    // Simplified batch processing - would call actual batch API
    const results = [];
    for (const request of requests) {
      try {
        const result = await this.callAppropriateGenerateMethod(request.params);
        results.push(result);
      } catch (error) {
        results.push(null); // Or handle errors appropriately
      }
    }
    return results;
  }

  getBatchKey(params) {
    return `${params.type}_${params.model || 'default'}`;
  }

  groupSimilarRequests(requests) {
    const groups = new Map();

    for (const request of requests) {
      const key = this.getBatchKey(request);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(request);
    }

    return Array.from(groups.values());
  }

  async processBatch(group, options = {}) {
    // Process a group of similar requests
    const results = [];
    for (const request of group) {
      const result = await this.muapi.generate(request.params);
      results.push(result);
    }
    return results;
  }
}

/**
 * Advanced Rate Limiter with token buckets, sliding windows, and priority queues
 */
class AdvancedRateLimiter {
  constructor(options = {}) {
    this.buckets = new Map();
    this.windows = new Map();
    this.priorityQueues = new Map();
    this.configs = {
      default: {
        capacity: 100,
        refillRate: 10, // tokens per second
        windowSize: 60000, // 1 minute
        maxRequests: 100
      },
      ...options
    };
  }

  async initialize() {
    // Initialize buckets for different service types
    const types = ['text-to-image', 'image-to-image', 'text-to-video', 'video-to-video', 'effect', 'default'];
    for (const type of types) {
      this.buckets.set(type, {
        tokens: this.configs[type]?.capacity || this.configs.default.capacity,
        lastRefill: Date.now()
      });
      this.windows.set(type, []);
      this.priorityQueues.set(type, new PriorityQueue());
    }
  }

  async acquire(type, priority = 3) {
    const bucket = this.buckets.get(type) || this.buckets.get('default');
    const config = this.configs[type] || this.configs.default;

    // Refill tokens
    this.refillTokens(bucket, config);

    // Check sliding window
    if (!this.checkSlidingWindow(type, config)) {
      // Add to priority queue
      return new Promise((resolve, reject) => {
        this.priorityQueues.get(type).enqueue({ resolve, reject, priority, timestamp: Date.now() });
        this.processQueue(type);
      });
    }

    // Check token availability
    if (bucket.tokens < 1) {
      throw new Error(`Rate limit exceeded for ${type}`);
    }

    // Consume token
    bucket.tokens--;
    this.recordRequest(type);

    return true;
  }

  refillTokens(bucket, config) {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor((timePassed / 1000) * config.refillRate);

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.tokens + tokensToAdd, config.capacity);
      bucket.lastRefill = now;
    }
  }

  checkSlidingWindow(type, config) {
    const window = this.windows.get(type);
    const now = Date.now();
    const windowStart = now - config.windowSize;

    // Remove old requests
    while (window.length > 0 && window[0] < windowStart) {
      window.shift();
    }

    return window.length < config.maxRequests;
  }

  recordRequest(type) {
    const window = this.windows.get(type);
    window.push(Date.now());
  }

  async processQueue(type) {
    const queue = this.priorityQueues.get(type);
    const bucket = this.buckets.get(type) || this.buckets.get('default');
    const config = this.configs[type] || this.configs.default;

    while (!queue.isEmpty() && bucket.tokens >= 1) {
      const item = queue.dequeue();
      if (item) {
        this.refillTokens(bucket, config);
        if (this.checkSlidingWindow(type, config)) {
          bucket.tokens--;
          this.recordRequest(type);
          item.resolve(true);
        } else {
          // Re-queue if still limited
          queue.enqueue(item);
          break;
        }
      }
    }
  }

  getStats() {
    const stats = {};
    for (const [type, bucket] of this.buckets) {
      stats[type] = {
        tokens: bucket.tokens,
        capacity: this.configs[type]?.capacity || this.configs.default.capacity,
        queueSize: this.priorityQueues.get(type).size(),
        windowRequests: this.windows.get(type).length
      };
    }
    return stats;
  }

  destroy() {
    this.buckets.clear();
    this.windows.clear();
    for (const queue of this.priorityQueues.values()) {
      queue.clear();
    }
    this.priorityQueues.clear();
  }
}

/**
 * Priority Queue for rate limiting
 */
class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
    this.items.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  clear() {
    this.items = [];
  }
}

/**
 * Similarity Detector for request deduplication
 */
class SimilarityDetector {
  constructor() {
    this.cache = new Map();
  }

  calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;

    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  findSimilarRequests(newRequest, existingRequests, threshold = 0.8) {
    const similar = [];
    for (const existing of existingRequests) {
      const similarity = this.calculateSimilarity(
        newRequest.prompt || '',
        existing.prompt || ''
      );
      if (similarity >= threshold) {
        similar.push({ request: existing, similarity });
      }
    }
    return similar;
  }
}

/**
 * Metrics Collector for monitoring
 */
class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.interval = null;
  }

  start() {
    // Periodic cleanup and aggregation
    this.interval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000); // 5 minutes
  }

  record(metric, data = {}) {
    const timestamp = Date.now();
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }

    this.metrics.get(metric).push({
      timestamp,
      ...data
    });
  }

  getSummary() {
    const summary = {};
    for (const [metric, entries] of this.metrics) {
      const recent = entries.filter(e => Date.now() - e.timestamp < 3600000); // Last hour
      summary[metric] = {
        count: recent.length,
        average: this.calculateAverage(recent),
        latest: recent[recent.length - 1]
      };
    }
    return summary;
  }

  calculateAverage(entries) {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, entry) => acc + (entry.duration || 0), 0);
    return sum / entries.length;
  }

  cleanupOldMetrics() {
    const cutoff = Date.now() - 86400000; // 24 hours
    for (const [metric, entries] of this.metrics) {
      this.metrics.set(metric, entries.filter(e => e.timestamp > cutoff));
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

/**
 * Graceful Degrader for handling service unavailability
 */
class GracefulDegrader {
  constructor() {
    this.serviceStatus = new Map();
    this.fallbacks = new Map();
    this.degradationThresholds = {
      errorRate: 0.5, // 50% error rate
      responseTime: 30000, // 30 seconds
      consecutiveFailures: 5
    };
  }

  shouldDegrade(error) {
    // Check if we should enter degraded mode
    return error.message.includes('unavailable') ||
           error.message.includes('timeout') ||
           error.message.includes('rate limit');
  }

  getFallbackResponse(params, error) {
    const fallback = this.fallbacks.get(params.type);
    if (fallback) {
      return fallback(params);
    }

    // Default fallback
    return {
      error: 'Service temporarily unavailable',
      fallback: true,
      type: params.type,
      timestamp: Date.now()
    };
  }

  isServiceAvailable(type) {
    const status = this.serviceStatus.get(type);
    return !status || !status.degraded;
  }

  updateServiceStatus(type, success, responseTime) {
    const status = this.serviceStatus.get(type) || {
      degraded: false,
      consecutiveFailures: 0,
      totalRequests: 0,
      errorCount: 0,
      avgResponseTime: 0
    };

    status.totalRequests++;
    status.avgResponseTime = (status.avgResponseTime + responseTime) / 2;

    if (success) {
      status.consecutiveFailures = 0;
      status.errorCount = Math.max(0, status.errorCount - 1);
    } else {
      status.consecutiveFailures++;
      status.errorCount++;
    }

    const errorRate = status.errorCount / status.totalRequests;

    // Check degradation conditions
    if (errorRate > this.degradationThresholds.errorRate ||
        status.avgResponseTime > this.degradationThresholds.responseTime ||
        status.consecutiveFailures >= this.degradationThresholds.consecutiveFailures) {
      status.degraded = true;
    } else if (status.degraded && errorRate < 0.1 && status.avgResponseTime < 10000) {
      // Recover from degradation
      status.degraded = false;
    }

    this.serviceStatus.set(type, status);
  }

  setFallback(type, fallbackFn) {
    this.fallbacks.set(type, fallbackFn);
  }

  getStatus() {
    const status = {};
    for (const [type, serviceStatus] of this.serviceStatus) {
      status[type] = {
        available: !serviceStatus.degraded,
        errorRate: serviceStatus.errorCount / serviceStatus.totalRequests,
        avgResponseTime: serviceStatus.avgResponseTime,
        consecutiveFailures: serviceStatus.consecutiveFailures
      };
    }
    return status;
  }
}

// Singleton instance
export const aiService = new AIService();
