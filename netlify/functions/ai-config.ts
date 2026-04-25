/**
 * AI Service Configuration
 * Centralized configuration for AI service features
 */

export interface AIServiceConfig {
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
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
    burstLimit?: number;
  };
}

export interface AIRequest {
  agentId: string;
  prompt: string;
  options?: Record<string, any>;
}

// Production configuration
export const productionConfig: AIServiceConfig = {
  cache: {
    enabled: true,
    defaultTtl: 300000, // 5 minutes
    maxSize: 500
  },
  deduplication: {
    enabled: true,
    windowMs: 15000 // 15 seconds
  },
  batching: {
    enabled: true,
    maxBatchSize: 10,
    maxWaitTime: 3000 // 3 seconds
  },
  rateLimiting: {
    enabled: true,
    maxRequests: 20,
    windowMs: 60000, // 1 minute
    burstLimit: 10
  }
};

// Development configuration
export const developmentConfig: AIServiceConfig = {
  cache: {
    enabled: true,
    defaultTtl: 180000, // 3 minutes
    maxSize: 100
  },
  deduplication: {
    enabled: true,
    windowMs: 10000 // 10 seconds
  },
  batching: {
    enabled: true,
    maxBatchSize: 5,
    maxWaitTime: 2000 // 2 seconds
  },
  rateLimiting: {
    enabled: true,
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    burstLimit: 5
  }
};

// Agent-specific configuration (lighter for real-time operations)
export const agentConfig: AIServiceConfig = {
  cache: {
    enabled: true,
    defaultTtl: 180000, // 3 minutes
    maxSize: 50
  },
  deduplication: {
    enabled: true,
    windowMs: 5000 // 5 seconds
  },
  batching: {
    enabled: false, // Disable batching for agent operations
    maxBatchSize: 1,
    maxWaitTime: 0
  },
  rateLimiting: {
    enabled: true,
    maxRequests: 5,
    windowMs: 30000, // 30 seconds
    burstLimit: 2
  }
};

// Get configuration based on environment
export function getAIConfig(environment: string = process.env.NODE_ENV || 'development'): AIServiceConfig {
  switch (environment) {
    case 'production':
      return productionConfig;
    case 'development':
      return developmentConfig;
    case 'agent':
      return agentConfig;
    default:
      return developmentConfig;
  }
}</content>
<parameter name="filePath">netlify/functions/ai-config.ts