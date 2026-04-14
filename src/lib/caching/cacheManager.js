/**
 * Intelligent Caching Manager
 * Provides multi-level caching for improved performance and offline support
 */

export class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.localStorageCache = new Map();
    this.indexedDBCache = new Map();
    
    this.cacheConfig = {
      memory: {
        maxSize: 50, // Max items in memory
        ttl: 5 * 60 * 1000 // 5 minutes
      },
      localStorage: {
        maxSize: 100,
        ttl: 60 * 60 * 1000 // 1 hour
      },
      indexedDB: {
        maxSize: 500,
        ttl: 24 * 60 * 60 * 1000 // 24 hours
      }
    };

    this.init();
  }

  /**
   * Initialize caching system
   */
  async init() {
    try {
      // Load from localStorage
      this.loadFromLocalStorage();
      
      // Initialize IndexedDB if available
      if (this.isIndexedDBAvailable()) {
        await this.initIndexedDB();
        this.loadFromIndexedDB();
      }

      // Set up cleanup intervals
      this.setupCleanupIntervals();
      
      console.log('[CacheManager] Initialized');
    } catch (error) {
      console.warn('[CacheManager] Initialization error:', error);
    }
  }

  /**
   * Check if IndexedDB is available
   * @returns {boolean} Whether IndexedDB is available
   */
  isIndexedDBAvailable() {
    return typeof window !== 'undefined' && 
           window.indexedDB && 
           typeof window.indexedDB.open === 'function';
  }

  /**
   * Initialize IndexedDB database
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OpenHiggsfieldCache', 1);
      
      request.onerror = () => {
        console.warn('[CacheManager] IndexedDB initialization failed');
        resolve(); // Don't reject, just disable IndexedDB
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {Object} options - Cache options
   */
  async set(key, value, options = {}) {
    const entry = {
      key,
      value,
      timestamp: Date.now(),
      ttl: options.ttl || this.cacheConfig.memory.ttl,
      tags: options.tags || []
    };

    try {
      // Always set in memory
      this.memoryCache.set(key, entry);
      
      // Set in localStorage for persistence
      if (this.shouldCacheInLocalStorage(options)) {
        this.localStorageCache.set(key, entry);
        this.saveToLocalStorage();
      }
      
      // Set in IndexedDB for large data
      if (this.shouldCacheInIndexedDB(value, options)) {
        await this.saveToIndexedDB(entry);
      }
      
      // Enforce cache size limits
      this.enforceCacheLimits();
      
    } catch (error) {
      console.warn('[CacheManager] Cache set error:', error);
    }
  }

  /**
   * Get cache entry
   * @param {string} key - Cache key
   * @returns {any} Cached value or null
   */
  async get(key) {
    try {
      // Try memory first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        return memoryEntry.value;
      }
      
      // Try localStorage
      const localEntry = this.localStorageCache.get(key);
      if (localEntry && !this.isExpired(localEntry)) {
        // Promote to memory
        this.memoryCache.set(key, localEntry);
        return localEntry.value;
      }
      
      // Try IndexedDB
      const indexedEntry = await this.getFromIndexedDB(key);
      if (indexedEntry && !this.isExpired(indexedEntry)) {
        // Promote to memory
        this.memoryCache.set(key, indexedEntry);
        return indexedEntry.value;
      }
      
      return null;
    } catch (error) {
      console.warn('[CacheManager] Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  async delete(key) {
    try {
      this.memoryCache.delete(key);
      this.localStorageCache.delete(key);
      await this.deleteFromIndexedDB(key);
    } catch (error) {
      console.warn('[CacheManager] Cache delete error:', error);
    }
  }

  /**
   * Clear cache by tags
   * @param {string[]} tags - Tags to clear
   */
  async clearByTags(tags) {
    try {
      // Clear from memory
      for (const [key, entry] of this.memoryCache.entries()) {
        if (tags.some(tag => entry.tags.includes(tag))) {
          this.memoryCache.delete(key);
        }
      }
      
      // Clear from localStorage
      for (const [key, entry] of this.localStorageCache.entries()) {
        if (tags.some(tag => entry.tags.includes(tag))) {
          this.localStorageCache.delete(key);
        }
      }
      
      // Clear from IndexedDB
      await this.clearIndexedDBByTags(tags);
      
      this.saveToLocalStorage();
    } catch (error) {
      console.warn('[CacheManager] Clear by tags error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    try {
      this.memoryCache.clear();
      this.localStorageCache.clear();
      await this.clearIndexedDB();
      this.saveToLocalStorage();
      console.log('[CacheManager] All caches cleared');
    } catch (error) {
      console.warn('[CacheManager] Clear all error:', error);
    }
  }

  /**
   * Check if entry is expired
   * @param {Object} entry - Cache entry
   * @returns {boolean} Whether entry is expired
   */
  isExpired(entry) {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Check if should cache in localStorage
   * @param {Object} options - Cache options
   * @returns {boolean} Whether to cache in localStorage
   */
  shouldCacheInLocalStorage(options) {
    return options.persist !== false;
  }

  /**
   * Check if should cache in IndexedDB
   * @param {any} value - Value to cache
   * @param {Object} options - Cache options
   * @returns {boolean} Whether to cache in IndexedDB
   */
  shouldCacheInIndexedDB(value, options) {
    // Cache large objects or when explicitly requested
    const valueSize = this.estimateSize(value);
    return valueSize > 50000 || options.indexedDB === true;
  }

  /**
   * Estimate object size in bytes
   * @param {any} obj - Object to measure
   * @returns {number} Estimated size in bytes
   */
  estimateSize(obj) {
    try {
      return JSON.stringify(obj).length * 2; // Rough estimate
    } catch {
      return 0;
    }
  }

  /**
   * Enforce cache size limits
   */
  enforceCacheLimits() {
    // Clean expired entries
    this.cleanExpired();
    
    // Enforce memory limit
    if (this.memoryCache.size > this.cacheConfig.memory.maxSize) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp); // Oldest first
      
      const toRemove = entries.slice(0, this.memoryCache.size - this.cacheConfig.memory.maxSize);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
    
    // Enforce localStorage limit
    if (this.localStorageCache.size > this.cacheConfig.localStorage.maxSize) {
      const entries = Array.from(this.localStorageCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.localStorageCache.size - this.cacheConfig.localStorage.maxSize);
      toRemove.forEach(([key]) => this.localStorageCache.delete(key));
    }
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    
    // Clean memory
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clean localStorage
    for (const [key, entry] of this.localStorageCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.localStorageCache.delete(key);
      }
    }
    
    // Clean IndexedDB (async, don't wait)
    this.cleanExpiredIndexedDB().catch(error => 
      console.warn('[CacheManager] IndexedDB cleanup error:', error)
    );
  }

  /**
   * Setup cleanup intervals
   */
  setupCleanupIntervals() {
    // Clean expired entries every 5 minutes
    setInterval(() => {
      this.cleanExpired();
    }, 5 * 60 * 1000);
    
    // Save to localStorage every minute
    setInterval(() => {
      this.saveToLocalStorage();
    }, 60 * 1000);
  }

  /**
   * Load from localStorage
   */
  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('oh_cache');
      if (data) {
        const parsed = JSON.parse(data);
        Object.entries(parsed).forEach(([key, entry]) => {
          this.localStorageCache.set(key, entry);
        });
      }
    } catch (error) {
      console.warn('[CacheManager] Load from localStorage error:', error);
    }
  }

  /**
   * Save to localStorage
   */
  saveToLocalStorage() {
    try {
      const data = {};
      for (const [key, entry] of this.localStorageCache.entries()) {
        data[key] = entry;
      }
      localStorage.setItem('oh_cache', JSON.stringify(data));
    } catch (error) {
      console.warn('[CacheManager] Save to localStorage error:', error);
    }
  }

  /**
   * Load from IndexedDB
   */
  async loadFromIndexedDB() {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.getAll();
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const entries = request.result;
          entries.forEach(entry => {
            this.indexedDBCache.set(entry.key, entry);
          });
          resolve();
        };
        
        request.onerror = () => {
          console.warn('[CacheManager] Load from IndexedDB error');
          resolve();
        };
      });
    } catch (error) {
      console.warn('[CacheManager] Load from IndexedDB error:', error);
    }
  }

  /**
   * Save to IndexedDB
   * @param {Object} entry - Cache entry
   */
  async saveToIndexedDB(entry) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await new Promise((resolve, reject) => {
        const request = store.put(entry);
        request.onsuccess = resolve;
        request.onerror = reject;
      });
    } catch (error) {
      console.warn('[CacheManager] Save to IndexedDB error:', error);
    }
  }

  /**
   * Get from IndexedDB
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} Cache entry or null
   */
  async getFromIndexedDB(key) {
    if (!this.db) return null;
    
    try {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      
      return new Promise((resolve) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.warn('[CacheManager] Get from IndexedDB error:', error);
      return null;
    }
  }

  /**
   * Delete from IndexedDB
   * @param {string} key - Cache key
   */
  async deleteFromIndexedDB(key) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await new Promise((resolve) => {
        const request = store.delete(key);
        request.onsuccess = resolve;
        request.onerror = () => resolve();
      });
    } catch (error) {
      console.warn('[CacheManager] Delete from IndexedDB error:', error);
    }
  }

  /**
   * Clear IndexedDB by tags
   * @param {string[]} tags - Tags to clear
   */
  async clearIndexedDBByTags(tags) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('timestamp');
      
      const request = index.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const entry = cursor.value;
          if (tags.some(tag => entry.tags.includes(tag))) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    } catch (error) {
      console.warn('[CacheManager] Clear IndexedDB by tags error:', error);
    }
  }

  /**
   * Clear all IndexedDB
   */
  async clearIndexedDB() {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();
      
      await new Promise((resolve) => {
        request.onsuccess = resolve;
        request.onerror = resolve;
      });
    } catch (error) {
      console.warn('[CacheManager] Clear IndexedDB error:', error);
    }
  }

  /**
   * Clean expired IndexedDB entries
   */
  async cleanExpiredIndexedDB() {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const now = Date.now();
      
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const entry = cursor.value;
          if (now - entry.timestamp > entry.ttl) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    } catch (error) {
      console.warn('[CacheManager] Clean expired IndexedDB error:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      memory: {
        size: this.memoryCache.size,
        maxSize: this.cacheConfig.memory.maxSize
      },
      localStorage: {
        size: this.localStorageCache.size,
        maxSize: this.cacheConfig.localStorage.maxSize
      },
      indexedDB: {
        size: this.indexedDBCache.size,
        maxSize: this.cacheConfig.indexedDB.maxSize,
        available: this.isIndexedDBAvailable()
      }
    };
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
