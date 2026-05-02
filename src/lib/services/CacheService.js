// Simple TTL cache implementation
export class CacheService {
  constructor(options = {}) {
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.cache = new Map();
  }
  
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }
  
  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
      created: Date.now()
    });
  }
  
  has(key) {
    return this.get(key) !== null;
  }
  
  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
}

export const cacheService = new CacheService();
export const cacheservice = new CacheService();
