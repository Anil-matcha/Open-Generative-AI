/**
 * AI Service Configuration
 * Defines default settings for AI service optimizations
 */

export const aiServiceConfig = {
  // Cache configuration
  cache: {
    maxSize: 1000, // Maximum number of cached items
    defaultTTL: 3600000, // 1 hour in milliseconds
    ttlByType: {
      'text-to-video': 1800000, // 30 minutes
      'image-to-video': 3600000, // 1 hour
      'generate-image': 7200000, // 2 hours
      'agent-execution': 900000, // 15 minutes
    },
    compressionEnabled: true,
    persistenceEnabled: false
  },

  // Batch processing configuration
  batch: {
    maxBatchSize: 5, // Maximum requests per batch
    batchTimeout: 5000, // 5 seconds
    similarityThreshold: 0.85, // Similarity threshold for batching
    enabled: true
  },

  // Rate limiting configuration
  rateLimit: {
    tokenBucket: {
      capacity: 100, // Maximum tokens
      refillRate: 10, // Tokens per second
      initialTokens: 50
    },
    slidingWindow: {
      windowSize: 60000, // 1 minute in milliseconds
      maxRequests: 60
    },
    priorityQueues: {
      high: { weight: 3 },
      medium: { weight: 2 },
      low: { weight: 1 }
    }
  },

  // Request deduplication configuration
  deduplication: {
    enabled: true,
    similarityThreshold: 0.9,
    timeWindow: 30000, // 30 seconds
    maxTrackedRequests: 100
  },

  // Graceful degradation configuration
  degradation: {
    errorThreshold: 0.1, // 10% error rate triggers degradation
    recoveryTime: 60000, // 1 minute recovery period
    fallbackEnabled: true
  },

  // Metrics configuration
  metrics: {
    enabled: true,
    collectionInterval: 60000, // 1 minute
    retentionPeriod: 3600000, // 1 hour
    exportEnabled: false
  }
};

