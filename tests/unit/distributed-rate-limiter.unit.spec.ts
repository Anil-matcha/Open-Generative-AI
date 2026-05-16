/**
 * Unit tests for DistributedRateLimiter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DistributedRateLimiter,
  ApiRateLimiter,
  AuthRateLimiter,
  UploadRateLimiter
} from '../../src/lib/services/DistributedRateLimiter.js';

// Mock Redis client
const createMockRedis = () => ({
  isReady: true,
  get: vi.fn(),
  set: vi.fn(),
  incr: vi.fn(),
  ttl: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn()
});

describe('DistributedRateLimiter', () => {
  let limiter;
  let mockRedis;

  beforeEach(() => {
    mockRedis = createMockRedis();
    limiter = new DistributedRateLimiter({
      windowMs: 60000,
      maxRequests: 10,
      distributedStorage: mockRedis,
      keyPrefix: 'test'
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultLimiter = new DistributedRateLimiter();
      expect(defaultLimiter.windowMs).toBe(60000);
      expect(defaultLimiter.maxRequests).toBe(100);
      expect(defaultLimiter.keyPrefix).toBe('rate_limit');
    });

    it('should accept custom options', () => {
      const customLimiter = new DistributedRateLimiter({
        windowMs: 30000,
        maxRequests: 50,
        keyPrefix: 'custom'
      });
      expect(customLimiter.windowMs).toBe(30000);
      expect(customLimiter.maxRequests).toBe(50);
      expect(customLimiter.keyPrefix).toBe('custom');
    });

    it('should initialize statistics', () => {
      expect(limiter.stats).toEqual({
        totalRequests: 0,
        allowedRequests: 0,
        blockedRequests: 0,
        errors: 0
      });
    });
  });

  describe('isAllowed', () => {
    it('should allow first request', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await limiter.isAllowed('test-identifier');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(mockRedis.get).toHaveBeenCalledWith('test:rate_limit:test-identifier');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test:rate_limit:test-identifier',
        1,
        { EX: 60 }
      );
    });

    it('should allow request when under limit', async () => {
      mockRedis.get.mockResolvedValue('5');

      const result = await limiter.isAllowed('test-identifier');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(mockRedis.incr).toHaveBeenCalledWith('test:rate_limit:test-identifier');
    });

    it('should deny request when limit exceeded', async () => {
      mockRedis.get.mockResolvedValue('10');
      mockRedis.ttl.mockResolvedValue(45);

      const result = await limiter.isAllowed('test-identifier');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBe(45);
    });

    it('should fall back to local when Redis fails', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await limiter.isAllowed('test-identifier');

      expect(result.allowed).toBe(true);
      expect(limiter.stats.errors).toBe(1);
    });

    it('should fall back to local when Redis not ready', async () => {
      mockRedis.isReady = false;

      const result = await limiter.isAllowed('test-identifier');

      expect(result.allowed).toBe(true);
    });

    it('should track statistics correctly', async () => {
      mockRedis.get.mockResolvedValue(null);
      await limiter.isAllowed('id1');
      await limiter.isAllowed('id2');

      expect(limiter.stats.totalRequests).toBe(2);
      expect(limiter.stats.allowedRequests).toBe(2);
      expect(limiter.stats.blockedRequests).toBe(0);
    });

    it('should count blocked requests', async () => {
      mockRedis.get.mockResolvedValue('10');
      mockRedis.ttl.mockResolvedValue(60);

      await limiter.isAllowed('id1');

      expect(limiter.stats.blockedRequests).toBe(1);
    });
  });

  describe('getClientKey', () => {
    it('should extract user ID from Bearer token', async () => {
      const request = {
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMSJ9.signature'
        }
      };

      const key = await limiter.getClientKey(request);

      expect(key).toBe('user1');
    });

    it('should extract IP from request', async () => {
      const request = {
        ip: '192.168.1.1'
      };

      const key = await limiter.getClientKey(request);

      expect(key).toBe('192.168.1.1');
    });

    it('should prefer user ID over IP', async () => {
      const request = {
        ip: '192.168.1.1',
        headers: {
          authorization: 'Bearer eyJzdWIiOiJ1c2VyMSJ9.signature'
        }
      };

      const key = await limiter.getClientKey(request);

      expect(key).toBe('user1');
    });

    it('should handle X-Forwarded-For header', async () => {
      const request = {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178'
        }
      };

      const key = await limiter.getClientKey(request);

      expect(key).toBe('203.0.113.195');
    });

    it('should return "unknown" for invalid auth', async () => {
      const request = {
        ip: undefined,
        connection: { remoteAddress: undefined },
        headers: {
          authorization: 'Invalid token'
        }
      };

      const key = await limiter.getClientKey(request);

      expect(key).toBe('unknown');
    });
  });

  describe('getStats and resetStats', () => {
    it('should return current stats', () => {
      const stats = limiter.getStats();

      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('allowedRequests');
      expect(stats).toHaveProperty('blockedRequests');
      expect(stats).toHaveProperty('errors');
    });

    it('should reset stats to zero', () => {
      limiter.stats.totalRequests = 100;
      limiter.stats.allowedRequests = 95;
      limiter.stats.blockedRequests = 5;

      limiter.resetStats();

      expect(limiter.stats.totalRequests).toBe(0);
      expect(limiter.stats.allowedRequests).toBe(0);
      expect(limiter.stats.blockedRequests).toBe(0);
    });
  });
});

describe('ApiRateLimiter', () => {
  it('should use correct defaults', () => {
    const limiter = new ApiRateLimiter();
    expect(limiter.windowMs).toBe(60000);
    expect(limiter.maxRequests).toBe(100);
    expect(limiter.keyPrefix).toBe('api');
  });
});

describe('AuthRateLimiter', () => {
  it('should use correct defaults', () => {
    const limiter = new AuthRateLimiter();
    expect(limiter.windowMs).toBe(300000); // 5 minutes
    expect(limiter.maxRequests).toBe(5);
    expect(limiter.keyPrefix).toBe('auth');
  });
});

describe('UploadRateLimiter', () => {
  it('should use correct defaults', () => {
    const limiter = new UploadRateLimiter();
    expect(limiter.windowMs).toBe(3600000); // 1 hour
    expect(limiter.maxRequests).toBe(10);
    expect(limiter.keyPrefix).toBe('upload');
  });
});
