import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mock dependencies BEFORE importing module under test ---

// Mock RateLimiter
vi.mock('../../../src/lib/services/RateLimiter.js', () => ({
  RateLimiter: vi.fn().mockImplementation(() => ({
    canProceed: vi.fn().mockReturnValue(true),
    acquire: vi.fn().mockResolvedValue(undefined),
    getAvailableTokens: vi.fn().mockReturnValue(200),
    reset: vi.fn()
  }))
}));

// Mock CircuitBreaker
vi.mock('../../../src/lib/services/CircuitBreaker.js', () => ({
  CircuitBreaker: vi.fn().mockImplementation(() => ({
    addService: vi.fn(),
    canProceed: vi.fn().mockReturnValue(true),
    recordSuccess: vi.fn(),
    recordFailure: vi.fn(),
    getServiceStatus: vi.fn().mockReturnValue({ state: 'CLOSED' })
  }))
}));

// Mock CacheService
vi.mock('../../../src/lib/services/CacheService.js', () => ({
  CacheService: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    clear: vi.fn()
  }))
}));

// Mock ErrorBoundary
vi.mock('../../../src/lib/services/ErrorBoundary.js', () => ({
  ErrorBoundary: vi.fn().mockImplementation(() => ({
    wrap: vi.fn().mockImplementation(fn => fn)
  }))
}));

// Import the mocked modules (to access mock instances)
import { RateLimiter as RateLimiterMock } from '../../../src/lib/services/RateLimiter.js';
import { CircuitBreaker as CircuitBreakerMock } from '../../../src/lib/services/CircuitBreaker.js';
import { CacheService as CacheServiceMock } from '../../../src/lib/services/CacheService.js';
import { ErrorBoundary as ErrorBoundaryMock } from '../../../src/lib/services/ErrorBoundary.js';

// Now import the service under test
import { PexelsService } from '../../../src/lib/services/PexelsService.js';

describe('PexelsService', () => {
  beforeEach(() => {
    // Clear environment and localStorage
    vi.stubEnv('VITE_PEXELS_API_KEY', 'test-key');
    vi.stubEnv('VITE_PEXELS_ENABLED', 'true');
    localStorage.clear();
    
    // Clear all mock implementations and calls
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with API key from environment', () => {
      const service = new PexelsService();
      expect(service.apiKey).toBe('test-key');
      expect(service.enabled).toBe(true);
    });

    it('should initialize with API key from localStorage when env missing', () => {
      vi.stubEnv('VITE_PEXELS_API_KEY', '');
      localStorage.setItem('pexels_api_key', 'local-key');
      const service = new PexelsService();
      expect(service.apiKey).toBe('local-key');
    });

    it('should disable service when no API key present', () => {
      vi.stubEnv('VITE_PEXELS_API_KEY', '');
      localStorage.clear();
      const service = new PexelsService();
      expect(service.enabled).toBe(false);
    });

    it('should initialize supporting services with correct constructors', () => {
      const service = new PexelsService();
      expect(service.rateLimiter).toBeInstanceOf(RateLimiterMock);
      expect(service.breaker).toBeInstanceOf(CircuitBreakerMock);
      expect(service.cache).toBeInstanceOf(CacheServiceMock);
      expect(service.errorBoundary).toBeInstanceOf(ErrorBoundaryMock);
    });

    it('should initialize stats object', () => {
      const service = new PexelsService();
      expect(service.stats).toEqual({
        requests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        errors: 0
      });
    });
  });

  describe('searchPhotos', () => {
    let originalFetch;

    beforeEach(() => {
      originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          photos: [
            {
              id: 123,
              src: { large: 'https://large.jpg', large2x: 'https://large2x.jpg', original: 'https://original.jpg' },
              alt: 'Test photo',
              photographer: 'John Doe',
              width: 1920,
              height: 1080
            }
          ]
        })
      });
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should build correct API URL with query and options', async () => {
      const service = new PexelsService();
      await service.searchPhotos('nature', { orientation: 'landscape', per_page: 10 });

      expect(fetch).toHaveBeenCalledTimes(1);
      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toBe('https://api.pexels.com/v1/search?query=nature&orientation=landscape&per_page=10');
    });

    it('should include default per_page of 20 if not specified', async () => {
      const service = new PexelsService();
      await service.searchPhotos('city');

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('per_page=20');
    });

    it('should transform response to asset format with required fields', async () => {
      const service = new PexelsService();
      const results = await service.searchPhotos('test');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'pexels-photo-123',
        type: 'photo',
        url: 'https://large.jpg',
        originalUrl: 'https://original.jpg',
        alt: 'Test photo',
        photographer: 'John Doe',
        width: 1920,
        height: 1080,
        source: 'pexels'
      });
    });

    it('should handle missing alt text gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          photos: [{ id: 999, src: { large: 'img.jpg' } }]
        })
      });
      const service = new PexelsService();
      const results = await service.searchPhotos('test');
      expect(results[0].alt).toBe('');
    });

    it('should respect per_page parameter', async () => {
      const service = new PexelsService();
      await service.searchPhotos('city', { per_page: 30 });

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('per_page=30');
    });

    it('should cache results and increment cacheHits', async () => {
      const service = new PexelsService();
      // First call - cache miss
      await service.searchPhotos('mountain');
      const firstCalls = fetch.mock.calls.length;
      // Second call - should hit cache, not call fetch again
      await service.searchPhotos('mountain');

      expect(service.stats.cacheHits).toBe(1);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when service disabled', async () => {
      vi.stubEnv('VITE_PEXELS_ENABLED', 'false');
      const service = new PexelsService();
      await expect(service.searchPhotos('test')).rejects.toThrow('Pexels service is disabled');
    });

    it('should throw error when circuit breaker is open', async () => {
      const service = new PexelsService();
      service.breaker.canProceed = () => false;

      await expect(service.searchPhotos('test')).rejects.toThrow('Circuit breaker is OPEN for pexels');
    });

    it('should throw error when rate limit exceeded', async () => {
      const service = new PexelsService();
      service.rateLimiter.canProceed = () => false;

      await expect(service.searchPhotos('test')).rejects.toThrow('Rate limit exceeded');
    });

    it('should call rateLimiter.acquire before making request', async () => {
      const service = new PexelsService();
      await service.searchPhotos('nature');

      expect(service.rateLimiter.acquire).toHaveBeenCalledWith(1);
    });

    it('should record successful request in stats', async () => {
      const service = new PexelsService();
      await service.searchPhotos('test');
      expect(service.stats.requests).toBe(1);
    });

    it('should call circuitBreaker.recordSuccess on success', async () => {
      const service = new PexelsService();
      await service.searchPhotos('test');
      expect(service.breaker.recordSuccess).toHaveBeenCalledWith('pexels');
    });

    it('should call circuitBreaker.recordFailure on fetch error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 });
      const service = new PexelsService();

      try {
        await service.searchPhotos('test');
      } catch (e) {}

      expect(service.breaker.recordFailure).toHaveBeenCalledWith('pexels');
      expect(service.stats.errors).toBe(1);
    });
  });

  describe('searchVideos', () => {
    let originalFetch;

    beforeEach(() => {
      originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          videos: [
            {
              id: 456,
              video_files: [
                { quality: 'hd', link: 'https://hd.mp4', width: 1920, height: 1080 },
                { quality: 'sd', link: 'https://sd.mp4', width: 640, height: 480 }
              ],
              duration: 12.5,
              width: 1920,
              height: 1080
            }
          ]
        })
      });
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should query videos endpoint', async () => {
      const service = new PexelsService();
      await service.searchVideos('ocean');

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('api.pexels.com/videos/search');
    });

    it('should include query parameter', async () => {
      const service = new PexelsService();
      await service.searchVideos('wave');

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('query=wave');
    });

    it('should select HD quality video preferentially', async () => {
      const service = new PexelsService();
      const results = await service.searchVideos('wave');

      expect(results[0].url).toBe('https://hd.mp4');
      expect(results[0].quality).toBe('hd');
    });

    it('should select SD if HD not available', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          videos: [{
            id: 123,
            video_files: [
              { quality: 'sd', link: 'https://sd.mp4' }
            ],
            duration: 10
          }]
        })
      });
      const service = new PexelsService();
      const results = await service.searchVideos('test');

      expect(results[0].url).toBe('https://sd.mp4');
      expect(results[0].quality).toBe('sd');
    });

    it('should fallback to first video file if no recognized quality', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          videos: [{ id: 789, video_files: [{ quality: 'original', link: 'https://orig.mp4' }], duration: 5 }]
        })
      });
      const service = new PexelsService();
      const results = await service.searchVideos('test');

      expect(results[0].url).toBe('https://orig.mp4');
    });

    it('should include video duration', async () => {
      const service = new PexelsService();
      const results = await service.searchVideos('clip');

      expect(results[0].duration).toBe(12.5);
    });

    it('should include video dimensions', async () => {
      const service = new PexelsService();
      const results = await service.searchVideos('clip');

      expect(results[0].width).toBe(1920);
      expect(results[0].height).toBe(1080);
    });
  });

  describe('transformPhotos', () => {
    it('should map single Pexels photo to internal asset format', () => {
      const service = new PexelsService();
      const input = [{
        id: 111,
        src: { large: 'large.jpg', large2x: 'large2x.jpg', original: 'original.jpg' },
        alt: 'A photo',
        photographer: 'Jane Smith',
        width: 1000,
        height: 800
      }];

      const result = service.transformPhotos(input);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'pexels-photo-111',
        type: 'photo',
        url: 'large.jpg',
        originalUrl: 'original.jpg',
        alt: 'A photo',
        photographer: 'Jane Smith',
        width: 1000,
        height: 800,
        source: 'pexels'
      });
    });

    it('should handle empty array', () => {
      const service = new PexelsService();
      const result = service.transformPhotos([]);
      expect(result).toEqual([]);
    });

    it('should handle photo without alt text', () => {
      const service = new PexelsService();
      const input = [{ id: 222, src: { large: 'test.jpg' } }];
      const result = service.transformPhotos(input);
      expect(result[0].alt).toBe('');
    });

    it('should use large2x as fallback if large missing', () => {
      const service = new PexelsService();
      const input = [{ id: 333, src: { large2x: 'large2x.jpg' } }];
      const result = service.transformPhotos(input);
      expect(result[0].url).toBe('large2x.jpg');
    });
  });

  describe('transformVideos', () => {
    it('should map Pexels video to internal asset format with best quality', () => {
      const service = new PexelsService();
      const input = [{
        id: 222,
        video_files: [
          { quality: '4k', link: '4k.mp4', width: 3840, height: 2160 },
          { quality: 'hd', link: 'hd.mp4', width: 1920, height: 1080 },
          { quality: 'sd', link: 'sd.mp4', width: 640, height: 480 }
        ],
        duration: 20,
        width: 1920,
        height: 1080
      }];

      const result = service.transformVideos(input);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'pexels-video-222',
        type: 'video',
        url: '4k.mp4',
        quality: '4k',
        width: 3840,
        height: 2160,
        duration: 20,
        source: 'pexels'
      });
    });

    it('should select SD if only SD available', () => {
      const service = new PexelsService();
      const input = [{
        id: 123,
        video_files: [{ quality: 'sd', link: 'sd.mp4', width: 640, height: 480 }],
        duration: 10
      }];
      const result = service.transformVideos(input);
      expect(result[0].url).toBe('sd.mp4');
    });

    it('should fallback to first video file when no recognized quality', () => {
      const service = new PexelsService();
      const input = [{
        id: 789,
        video_files: [{ quality: 'original', link: 'orig.mp4' }],
        duration: 5
      }];
      const result = service.transformVideos(input);
      expect(result[0].url).toBe('orig.mp4');
    });

    it('should handle empty array', () => {
      const service = new PexelsService();
      const result = service.transformVideos([]);
      expect(result).toEqual([]);
    });

    it('should default missing duration to 0', () => {
      const service = new PexelsService();
      const input = [{ id: 999, video_files: [{ quality: 'hd', link: 'hd.mp4' }] }];
      const result = service.transformVideos(input);
      expect(result[0].duration).toBe(0);
    });
  });

  describe('Cache management', () => {
    it('should clear cache via clearCache method', () => {
      const service = new PexelsService();
      service.cache.set('key', { data: 'test' });
      service.clearCache();
      expect(service.cache.get('key')).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return statistics object with required fields', () => {
      const service = new PexelsService();
      const stats = service.getStats();

      expect(stats).toHaveProperty('requests', 0);
      expect(stats).toHaveProperty('cacheHits', 0);
      expect(stats).toHaveProperty('cacheMisses', 0);
      expect(stats).toHaveProperty('errors', 0);
      expect(stats).toHaveProperty('cacheHitRate', 0);
      expect(stats).toHaveProperty('rateLimitAvailable', 200);
      expect(stats).toHaveProperty('circuitBreakerState', 'CLOSED');
    });
  });
});
