# AI Service Integration

This document describes the comprehensive AI Service that provides advanced optimization layers for AI operations in the timeline editor application.

## Overview

The AI Service implements four key optimization layers:

1. **Request Deduplication** - Prevents duplicate requests and caches identical operations
2. **Intelligent Caching** - Content-based caching with TTL and semantic similarity
3. **Batch Processing** - Groups similar requests for efficient processing
4. **Advanced Rate Limiting** - Token bucket algorithm with priority queues

## Architecture

### Core Components

```
AI Service
├── RequestDeduplicator     - Handles duplicate request detection
├── IntelligentCache        - LRU cache with content-based keys
├── BatchProcessor          - Groups and processes similar requests
├── AdvancedRateLimiter     - Token bucket with priority queues
├── MetricsCollector        - Performance monitoring
└── GracefulDegrader        - Service health management
```

### Integration Points

- **Generation Service** - Wraps `submit()` and `submitBatch()` methods
- **AI Agents** - Enhances Director and Screenwriter agent execution
- **Main Application** - Auto-initializes on app startup

## Usage

### Automatic Initialization

The AI Service automatically initializes when the application starts:

```javascript
// In main.js - happens automatically
import { initializeAIOptimizations } from './lib/services/aiIntegration.js';
// Called after MuAPI initialization
```

### Manual Control

```javascript
import { initializeAIOptimizations, getAIOptimizationStatus } from './lib/services/aiIntegration.js';

// Initialize optimizations
await initializeAIOptimizations();

// Check status
const status = getAIOptimizationStatus();
console.log('AI optimizations:', status.aiService.healthy ? 'active' : 'degraded');
```

### Direct AI Service Usage

```javascript
import { aiService } from './lib/services/aiService.js';

// Single generation request
const result = await aiService.generate({
  type: 'text-to-image',
  params: { prompt: 'A sunset', model: 'flux-dev' },
  priority: 'high'
});

// Batch processing
const batchResults = await aiService.generateBatch([
  { type: 'text-to-image', params: { prompt: 'Mountain' } },
  { type: 'text-to-image', params: { prompt: 'Ocean' } }
]);
```

### Generation Service Integration

```javascript
import { generationService } from './lib/editor/generationService.js';

// Enable AI optimizations
await generationService.enableAIOptimizations();

// Submit with optimizations (automatic if enabled)
const result = await generationService.submit({
  mode: 'text-to-video',
  prompt: 'A beautiful scene',
  model: 'ltx-2-fast'
});

// Batch submission with optimizations
const results = await generationService.submitBatch([
  createTextToVideoRequest('Scene 1'),
  createTextToVideoRequest('Scene 2')
]);
```

### Agent Integration

```javascript
import { directorAgent, screenwriterAgent } from './lib/agents/index.js';

// Enable optimizations
await directorAgent.enableAIOptimizations();
await screenwriterAgent.enableAIOptimizations();

// Execute with optimizations (automatic if enabled)
const analysis = await directorAgent.execute({
  timelineState: timelineData,
  options: { includeNarrativeSuggestions: true }
});
```

## Configuration

The AI Service uses a comprehensive configuration system:

```javascript
// src/lib/services/aiServiceConfig.js
export const aiServiceConfig = {
  cache: {
    maxSize: 1000,
    defaultTTL: 3600000, // 1 hour
    ttlByType: {
      'text-to-video': 1800000, // 30 minutes
      'agent-execution': 900000  // 15 minutes
    }
  },
  batch: {
    maxBatchSize: 5,
    batchTimeout: 5000,
    similarityThreshold: 0.85
  },
  rateLimit: {
    tokenBucket: {
      capacity: 100,
      refillRate: 10 // tokens per second
    }
  }
  // ... more options
};
```

## Monitoring and Health Checks

### Service Health Status

```javascript
const health = aiService.getHealthStatus();
// Returns: { healthy: true, errorRate: 0.02, avgResponseTime: 1500 }
```

### Optimization Status

```javascript
import { getAIOptimizationStatus } from './lib/services/aiIntegration.js';

const status = getAIOptimizationStatus();
// Returns comprehensive status for all integrated services
```

### Metrics and Events

```javascript
// Listen to AI service events
aiService.on('onCacheHit', (data) => {
  console.log('Cache hit for:', data.type);
});

aiService.on('onRateLimit', (data) => {
  console.log('Rate limited:', data.type);
});

aiService.on('onBatchComplete', (data) => {
  console.log(`Batch processed: ${data.processedCount} requests`);
});
```

## Features

### Request Deduplication
- SHA-256 content hashing for exact duplicates
- Similarity detection for near-identical requests
- Active request tracking to prevent concurrent identical operations

### Intelligent Caching
- LRU (Least Recently Used) cache with configurable size
- Content-based key generation using semantic similarity
- TTL (Time-To-Live) support with type-specific expiration
- Cache invalidation by pattern matching
- Compression support for large cached items

### Batch Processing
- Automatic grouping of similar requests
- Configurable batch sizes and timeouts
- Parallel processing with concurrency control
- Batch completion callbacks and error handling

### Advanced Rate Limiting
- Token bucket algorithm for smooth rate limiting
- Sliding window for burst control
- Priority queues (high, medium, low)
- Service-specific rate limit configurations

### Graceful Degradation
- Service health monitoring
- Automatic fallback to direct processing
- Error rate tracking with recovery mechanisms
- Configurable degradation thresholds

### Metrics and Monitoring
- Request success/failure rates
- Cache hit/miss ratios
- Rate limiting statistics
- Response time tracking
- Service health status reporting

## Performance Benefits

- **Reduced API Calls**: Deduplication prevents redundant requests
- **Faster Response Times**: Caching serves frequently requested content instantly
- **Improved Throughput**: Batch processing maximizes API utilization
- **Reliability**: Rate limiting prevents service overload
- **Cost Efficiency**: Optimized resource usage reduces operational costs

## Fallback Behavior

If the AI Service encounters errors or is unavailable, the system gracefully falls back to direct processing:

1. **AI Service Failure**: Falls back to direct MuAPI calls
2. **Cache Unavailable**: Processes requests without caching
3. **Rate Limiting**: Queues requests for later processing
4. **Batch Processing Failure**: Processes requests individually

## Development and Testing

### Verification Script

```bash
node verify-ai-integration.js
```

### Integration Tests

```bash
# Run AI integration tests
npm run test:ai-integration

# Run performance tests
npm run test:performance
```

### Monitoring in Development

```javascript
// Enable debug logging
aiService.configure({
  metrics: { enabled: true, collectionInterval: 30000 }
});

// Monitor in browser console
console.log('AI Service Status:', aiService.getHealthStatus());
```

## Troubleshooting

### Common Issues

1. **AI Service Not Initializing**
   - Check MuAPI initialization completes first
   - Verify configuration is valid
   - Check browser console for errors

2. **Poor Performance**
   - Verify cache configuration
   - Check rate limiting settings
   - Monitor batch processing efficiency

3. **High Error Rates**
   - Check service health status
   - Review rate limiting configuration
   - Monitor graceful degradation

### Debug Mode

Enable debug mode for detailed logging:

```javascript
aiService.configure({
  debug: true,
  metrics: { enabled: true, collectionInterval: 10000 }
});
```

## API Reference

### AIService Class

#### Methods
- `initialize()` - Initialize the service
- `generate(request)` - Process a single AI request
- `generateBatch(requests)` - Process multiple requests
- `configure(config)` - Update service configuration
- `getHealthStatus()` - Get service health metrics

#### Events
- `onCacheHit` - Fired when cache serves a request
- `onCacheMiss` - Fired when cache miss occurs
- `onRateLimit` - Fired when rate limiting activates
- `onBatchComplete` - Fired when batch processing completes
- `onError` - Fired when service errors occur

### GenerationService Extensions

#### Methods
- `enableAIOptimizations()` - Enable AI optimizations
- `submitBatch(requests)` - Submit multiple requests
- `getAIOptimizationStatus()` - Get optimization status

### BaseAgent Extensions

#### Methods
- `enableAIOptimizations()` - Enable AI optimizations for agent
- `executeInternal(context)` - Internal execution method

## Future Enhancements

- **Machine Learning Optimization**: Use ML to predict and pre-cache content
- **Advanced Similarity**: Semantic similarity for better deduplication
- **Predictive Batching**: Group requests based on usage patterns
- **Distributed Caching**: Redis integration for multi-instance deployments
- **Real-time Analytics**: Advanced monitoring and alerting