import { RateLimiter } from './RateLimiter.js';

class DistributedRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000;
    this.maxRequests = options.maxRequests || 100;
    this.distributedStorage = options.distributedStorage || null;
    this.localLimiter = new RateLimiter({
      rate: this.maxRequests,
      duration: this.windowMs
    });
    this.keyPrefix = options.keyPrefix || 'rate_limit';
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      errors: 0
    };
  }

  async isAllowed(identifier) {
    this.stats.totalRequests++;

    try {
      if (this.distributedStorage) {
        return await this._checkDistributed(identifier);
      }
      return this._checkLocal(identifier);
    } catch (error) {
      this.stats.errors++;
      console.error('[DistributedRateLimiter] Error checking limit:', error);

      // Fail open - allow request if rate limiter fails
      return {
        allowed: true,
        remaining: this.maxRequests,
        retryAfter: 0,
        error: error.message
      };
    }
  }

  _checkLocal(identifier) {
    const acquired = this.localLimiter.canProceed(1);
    if (acquired) {
      this.localLimiter.tokens -= 1;
      this.stats.allowedRequests++;
    } else {
      this.stats.blockedRequests++;
    }
    const remaining = Math.max(0, Math.floor(this.localLimiter.tokens));
    return {
      allowed: acquired,
      remaining,
      retryAfter: acquired ? 0 : this.windowMs / 1000
    };
  }

  async _checkDistributed(identifier) {
    const key = `${this.keyPrefix}:${identifier}`;

    try {
      // Check if Redis is available
      if (!this.distributedStorage.isReady) {
        console.warn('[DistributedRateLimiter] Redis not ready, falling back to local');
        return this._checkLocal(identifier);
      }

      const current = await this.distributedStorage.get(key);

      if (current === null) {
        await this.distributedStorage.set(key, 1, {
          EX: Math.floor(this.windowMs / 1000)
        });
        this.stats.allowedRequests++;
        return { allowed: true, remaining: this.maxRequests - 1 };
      }

      const currentCount = parseInt(current, 10);

      if (currentCount >= this.maxRequests) {
        this.stats.blockedRequests++;
        const ttl = await this.distributedStorage.ttl(key);
        return {
          allowed: false,
          remaining: 0,
          retryAfter: ttl > 0 ? ttl : this.windowMs / 1000
        };
      }

      await this.distributedStorage.incr(key);
      this.stats.allowedRequests++;
      return {
        allowed: true,
        remaining: this.maxRequests - currentCount - 1
      };
    } catch (error) {
      console.error('[DistributedRateLimiter] Redis error:', error);
      this.stats.errors++;
      // Fallback to local rate limiting
      return this._checkLocal(identifier);
    }
  }

  async getClientKey(request) {
    const ip = request.ip ||
               request.connection?.remoteAddress ||
               request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               'unknown';
    const userId = request.headers?.authorization
      ? this._extractUserId(request.headers.authorization)
      : null;
    return userId || ip;
  }

  _extractUserId(authHeader) {
    if (!authHeader.startsWith('Bearer ')) return null;
    try {
      const token = authHeader.substring(7);
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.user_id || null;
    } catch {
      return null;
    }
  }

  /**
   * Get rate limiting statistics
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      errors: 0
    };
  }
}

export class ApiRateLimiter extends DistributedRateLimiter {
  constructor(options = {}) {
    super({
      windowMs: options.windowMs || 60000,
      maxRequests: options.maxRequests || 100,
      distributedStorage: options.distributedStorage || null,
      keyPrefix: 'api'
    });
  }
}

export class AuthRateLimiter extends DistributedRateLimiter {
  constructor(options = {}) {
    super({
      windowMs: options.windowMs || 300000,
      maxRequests: options.maxRequests || 5,
      distributedStorage: options.distributedStorage || null,
      keyPrefix: 'auth'
    });
  }
}

export class UploadRateLimiter extends DistributedRateLimiter {
  constructor(options = {}) {
    super({
      windowMs: options.windowMs || 3600000,
      maxRequests: options.maxRequests || 10,
      distributedStorage: options.distributedStorage || null,
      keyPrefix: 'upload'
    });
  }
}

export const apiRateLimiter = new ApiRateLimiter();
export const authRateLimiter = new AuthRateLimiter();
export const uploadRateLimiter = new UploadRateLimiter();