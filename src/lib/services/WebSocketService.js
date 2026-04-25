/**
 * Cache Service - In-memory LRU cache with TTL support for API responses
 */
export class CacheService {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = new Map(); // For LRU eviction
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  /**
   * Get value from cache
   */
  get(key) {
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

    // Update access order for LRU
    this.accessOrder.delete(key);
    this.accessOrder.set(key, Date.now());

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache with TTL
   */
  set(key, value, ttlMs = 300000) { // Default 5 minutes
    const expiry = Date.now() + ttlMs;

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.accessOrder.delete(key);
    }

    // Evict if at capacity (LRU)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, { value, expiry });
    this.accessOrder.set(key, Date.now());
    this.stats.sets++;
  }

  /**
   * Delete entry from cache
   */
  delete(key) {
    if (this.cache.delete(key)) {
      this.accessOrder.delete(key);
      this.stats.deletes++;
      return true;
    }
    return false;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.accessOrder.clear();
    this.resetStats();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    const entry = this.cache.get(key);
    return entry && Date.now() <= entry.expiry;
  }

  /**
   * Get all valid keys
   */
  keys() {
    const validKeys = [];
    for (const [key, entry] of this.cache) {
      if (Date.now() <= entry.expiry) {
        validKeys.push(key);
      }
    }
    return validKeys;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: hitRate.toFixed(2) + '%',
      utilization: ((this.cache.size / this.maxSize) * 100).toFixed(2) + '%'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, entry] of this.cache) {
      if (now > entry.expiry) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));

    return expiredKeys.length;
  }

  /**
   * Set maximum cache size
   */
  setMaxSize(maxSize) {
    this.maxSize = maxSize;

    // Evict excess entries if needed
    while (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    if (this.accessOrder.size === 0) return;

    // Find the oldest accessed key
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Get cache entry metadata
   */
  getMetadata(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    return {
      exists: true,
      expiry: entry.expiry,
      ttl: Math.max(0, entry.expiry - Date.now()),
      isExpired: Date.now() > entry.expiry
    };
  }

  /**
   * Batch operations
   */
  batchGet(keys) {
    const results = {};
    keys.forEach(key => {
      results[key] = this.get(key);
    });
    return results;
  }

  batchSet(entries) {
    Object.entries(entries).forEach(([key, { value, ttl }]) => {
      this.set(key, value, ttl);
    });
  }

  batchDelete(keys) {
    const deleted = [];
    keys.forEach(key => {
      if (this.delete(key)) {
        deleted.push(key);
      }
    });
    return deleted;
  }

  /**
   * Export cache data (for persistence)
   */
  export() {
    const data = {};
    for (const [key, entry] of this.cache) {
      if (Date.now() <= entry.expiry) {
        data[key] = {
          value: entry.value,
          expiry: entry.expiry
        };
      }
    }
    return data;
  }

  /**
   * Import cache data (for restoration)
   */
  import(data) {
    Object.entries(data).forEach(([key, entry]) => {
      if (Date.now() <= entry.expiry) {
        this.cache.set(key, entry);
        this.accessOrder.set(key, Date.now());
      }
    });
  }

  /**
   * Auto-cleanup interval
   */
  startCleanup(intervalMs = 60000) { // Default 1 minute
    this.cleanupInterval = setInterval(() => {
      this.cleanExpired();
    }, intervalMs);
  }

  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}</content>
<parameter name="filePath">src/lib/services/CacheService.js