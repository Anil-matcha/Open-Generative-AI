import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ApiRateLimiter, AuthRateLimiter, UploadRateLimiter } from '../../src/lib/services/DistributedRateLimiter.js';

describe('Distributed Rate Limiter', () => {
  let apiRateLimiter;
  let authRateLimiter;
  let uploadRateLimiter;

  beforeEach(() => {
    apiRateLimiter = new ApiRateLimiter({
      windowMs: 1000,
      maxRequests: 5
    });
    authRateLimiter = new AuthRateLimiter({
      windowMs: 1000,
      maxRequests: 3
    });
    uploadRateLimiter = new UploadRateLimiter({
      windowMs: 1000,
      maxRequests: 2
    });
  });

  describe('ApiRateLimiter', () => {
    it('should allow requests under the limit', async () => {
      const result = await apiRateLimiter.isAllowed('client-1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should block requests over the limit', async () => {
      for (let i = 0; i < 6; i++) {
        await apiRateLimiter.isAllowed('client-2');
      }
      const result = await apiRateLimiter.isAllowed('client-2');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should track different clients separately', async () => {
      const result1 = await apiRateLimiter.isAllowed('client-a');
      const result2 = await apiRateLimiter.isAllowed('client-b');
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('AuthRateLimiter', () => {
    it('should have stricter limits', async () => {
      for (let i = 0; i < 3; i++) {
        await authRateLimiter.isAllowed('auth-client');
      }
      const result = await authRateLimiter.isAllowed('auth-client');
      expect(result.allowed).toBe(false);
    });
  });

  describe('UploadRateLimiter', () => {
    it('should have very limited requests', async () => {
      for (let i = 0; i < 2; i++) {
        await uploadRateLimiter.isAllowed('upload-client');
      }
      const result = await uploadRateLimiter.isAllowed('upload-client');
      expect(result.allowed).toBe(false);
    });
  });
});