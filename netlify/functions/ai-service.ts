/**
 * Comprehensive AI Service with Request Deduplication, Intelligent Caching,
 * Batch Processing, and Advanced Rate Limiting
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  timestamp: number;
}

interface RateLimitConfig {
  enabled?: boolean;
  maxRequests: number;
  windowMs: number;
  burstLimit?: number;
}

interface AIServiceConfig {
  cache: {
    enabled: boolean;
    defaultTtl: number; // in milliseconds
    maxSize: number;
  };
  deduplication: {
    enabled: boolean;
    windowMs: number; // deduplication window
  };
  batching: {
    enabled: boolean;
    maxBatchSize: number;
    maxWaitTime: number; // in milliseconds
  };
  rateLimiting: RateLimitConfig;
}

interface AIRequest {
  agentId: string;
  prompt: string;
  options?: Record<string, any>;
}

interface BatchRequest {
  id: string;
  request: AIRequest;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timestamp: number;
}

class AIService {
  private config: AIServiceConfig;
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private rateLimitBuckets = new Map<string, { requests: number[]; }>();
  private batchQueue: BatchRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  /**
   * Process an AI request with deduplication, caching, batching, and rate limiting
   */
  async processRequest<T>(request: AIRequest, processor: (req: AIRequest) => Promise<T>): Promise<T> {
    const requestKey = this.generateRequestKey(request);

    // 1. Check rate limiting
    if (this.config.rateLimiting.enabled && !this.checkRateLimit(requestKey)) {
      throw new Error('Rate limit exceeded');
    }

    // 2. Check cache
    if (this.config.cache.enabled) {
      const cached = this.getFromCache<T>(requestKey);
      if (cached) {
        return cached;
      }
    }

    // 3. Check deduplication (pending requests)
    if (this.config.deduplication.enabled) {
      const pending = this.pendingRequests.get(requestKey);
      if (pending && Date.now() - pending.timestamp < this.config.deduplication.windowMs) {
        return pending.promise as Promise<T>;
      }
    }

    // 4. Check if batching is applicable
    if (this.shouldBatch(request)) {
      return this.addToBatch<T>(request, processor);
    }

    // 5. Process directly with deduplication tracking
    return this.processWithDeduplication<T>(requestKey, request, processor);
  }

  /**
   * Generate a unique key for request deduplication and caching
   */
  private generateRequestKey(request: AIRequest): string {
    const { agentId, prompt, options } = request;
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${agentId}:${this.hashString(prompt)}:${this.hashString(optionsStr)}`;
  }

  /**
   * Simple string hashing for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Check if request should be batched
   */
  private shouldBatch(request: AIRequest): boolean {
    return this.config.batching.enabled &&
           ['faceless_video_creator', 'ai_ad_films', 'ai_voiceovers'].includes(request.agentId);
  }

  /**
   * Add request to batch queue
   */
  private addToBatch<T>(request: AIRequest, processor: (req: AIRequest) => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const batchRequest: BatchRequest = {
        id: this.generateRequestKey(request),
        request,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.batchQueue.push(batchRequest);

      // Start batch timer if not already running
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), this.config.batching.maxWaitTime);
      }

      // Process batch immediately if queue is full
      if (this.batchQueue.length >= this.config.batching.maxBatchSize) {
        this.processBatch();
      }
    });
  }

  /**
   * Process batched requests
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batch = this.batchQueue.splice(0);
    const now = Date.now();

    // Group by agent type for efficient processing
    const grouped = batch.reduce((acc, req) => {
      if (!acc[req.request.agentId]) {
        acc[req.request.agentId] = [];
      }
      acc[req.request.agentId].push(req);
      return acc;
    }, {} as Record<string, BatchRequest[]>);

    // Process each group
    for (const [agentId, requests] of Object.entries(grouped)) {
      try {
        // Process requests in parallel with concurrency control
        const promises = requests.map(async (batchReq) => {
          try {
            const result = await this.processWithDeduplication(
              batchReq.id,
              batchReq.request,
              async (req) => {
                // Simulate batch processing - in real implementation,
                // this would call the actual batch API
                return await this.callAIAgent(req.agentId, req.prompt, req.options);
              }
            );
            batchReq.resolve(result);
          } catch (error) {
            batchReq.reject(error);
          }
        });

        await Promise.allSettled(promises);
      } catch (error) {
        // If batch processing fails, reject all requests in this batch
        requests.forEach(req => req.reject(error));
      }
    }
  }

  /**
   * Process request with deduplication tracking
   */
  private async processWithDeduplication<T>(
    requestKey: string,
    request: AIRequest,
    processor: (req: AIRequest) => Promise<T>
  ): Promise<T> {
    // Create a pending request entry
    let resolve: (value: T) => void;
    let reject: (reason: any) => void;

    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const pendingRequest: PendingRequest<T> = {
      promise,
      resolve: resolve!,
      reject: reject!,
      timestamp: Date.now()
    };

    this.pendingRequests.set(requestKey, pendingRequest);

    try {
      const result = await processor(request);

      // Cache the result
      if (this.config.cache.enabled) {
        this.setCache(requestKey, result);
      }

      resolve(result);
      return result;
    } catch (error) {
      reject(error);
      throw error;
    } finally {
      // Clean up pending request after deduplication window
      setTimeout(() => {
        this.pendingRequests.delete(requestKey);
      }, this.config.deduplication.windowMs);
    }
  }

  /**
   * Get result from cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry
   */
  private setCache(key: string, data: any, ttl?: number): void {
    const actualTtl = ttl || this.config.cache.defaultTtl;

    // Evict old entries if cache is full
    if (this.cache.size >= this.config.cache.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: actualTtl
    });
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(key: string): boolean {
    const now = Date.now();
    const bucket = this.rateLimitBuckets.get(key) || { requests: [] };

    // Remove old requests outside the window
    bucket.requests = bucket.requests.filter(time => now - time < this.config.rateLimiting.windowMs);

    // Check burst limit
    const burstLimit = this.config.rateLimiting.burstLimit || this.config.rateLimiting.maxRequests;
    if (bucket.requests.length >= burstLimit) {
      return false;
    }

    // Check sustained rate
    const windowStart = now - this.config.rateLimiting.windowMs;
    const requestsInWindow = bucket.requests.filter(time => time >= windowStart).length;

    if (requestsInWindow >= this.config.rateLimiting.maxRequests) {
      return false;
    }

    // Add current request
    bucket.requests.push(now);
    this.rateLimitBuckets.set(key, bucket);

    return true;
  }

  /**
   * Call the actual AI agent (integrates with existing handlers)
   * Note: This method is not used in the current implementation since we pass the handler function directly
   */
  private async callAIAgent(agentId: string, prompt: string, options?: any): Promise<any> {
    // This is kept for compatibility but not used in the main flow
    throw new Error('callAIAgent should not be called directly - use processRequest with handler function');
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      batchQueueSize: this.batchQueue.length,
      rateLimitBuckets: this.rateLimitBuckets.size
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Shutdown service (clear timers, etc.)
   */
  shutdown(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.batchQueue.length = 0;
    this.pendingRequests.clear();
    this.rateLimitBuckets.clear();
  }
}

export default AIService;
</content>
<parameter name="filePath">netlify/functions/ai-service.ts