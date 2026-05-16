/**
 * Hybrid Storage Strategy
 * Provides multi-layer token storage with security boundaries
 */

import { httpOnlyCookies } from './http-only-cookies.js';

// In-memory cache for active tokens
class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value) {
    this.cache.set(key, value);
  }

  get(key) {
    return this.cache.get(key) || null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Encrypted IndexedDB storage for metadata and less sensitive tokens
class EncryptedIndexedDB {
  constructor(dbName = 'SecureTokensDB', storeName = 'tokens') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
    this.encryptionKey = null;
  }

  async initialize(encryptionKey) {
    this.encryptionKey = encryptionKey;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async setItem(key, value) {
    if (!this.db) throw new Error('Database not initialized');

    // Encrypt value before storing
    const encryptedValue = await this.encryptData(JSON.stringify(value));

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(encryptedValue, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getItem(key) {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        try {
          if (request.result) {
            const decrypted = await this.decryptData(request.result);
            resolve(JSON.parse(decrypted));
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      };
    });
  }

  async removeItem(key) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear() {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Simple encryption using Web Crypto API (in production, use proper key management)
  async encryptData(data) {
    if (!this.encryptionKey) return btoa(data); // Fallback for demo

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const key = await crypto.subtle.importKey(
      'raw',
      this.encryptionKey,
      'AES-GCM',
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async decryptData(encryptedData) {
    if (!this.encryptionKey) return atob(encryptedData); // Fallback for demo

    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const key = await crypto.subtle.importKey(
      'raw',
      this.encryptionKey,
      'AES-GCM',
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}

/**
 * Hybrid Storage Strategy
 * Implements multi-layer storage hierarchy:
 * - HTTP-only cookies: Sensitive tokens (JWT, API keys)
 * - Encrypted IndexedDB: Metadata and less sensitive tokens (refresh tokens)
 * - Memory cache: Active session data
 */
export class HybridStorage {
  constructor() {
    this.memoryCache = new MemoryCache();
    this.encryptedDB = new EncryptedIndexedDB();
    this.initialized = false;
  }

  /**
   * Initialize storage with encryption key
   * @param {Uint8Array} encryptionKey - Key for encrypting IndexedDB data
   */
  async initialize(encryptionKey) {
    try {
      await this.encryptedDB.initialize(encryptionKey);
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize encrypted storage:', error);
      // Continue without IndexedDB if it fails
    }
  }

  /**
   * Store token based on type and sensitivity
   * @param {string} type - Token type
   * @param {object} tokenData - Token data object
   */
  async setToken(type, tokenData) {
    // Store sensitive tokens in HTTP-only cookies
    if (this.isCookieStored(type)) {
      await httpOnlyCookies.setToken(type, tokenData.value, {
        expires: tokenData.expires,
        path: '/',
        secure: true,
        sameSite: 'strict'
      });
    }

    // Store all tokens in encrypted IndexedDB for metadata
    if (this.initialized) {
      await this.encryptedDB.setItem(`token_${type}`, tokenData);
    }

    // Cache in memory
    this.memoryCache.set(type, tokenData);
  }

  /**
   * Retrieve token from storage hierarchy
   * @param {string} type - Token type
   * @returns {object|null} - Token data object
   */
  async getToken(type) {
    // Check memory cache first
    let tokenData = this.memoryCache.get(type);
    if (tokenData) return tokenData;

    // Check HTTP-only cookies for sensitive tokens
    if (this.isCookieStored(type)) {
      const cookieValue = await httpOnlyCookies.getToken(type);
      if (cookieValue) {
        // Get metadata from IndexedDB
        if (this.initialized) {
          tokenData = await this.encryptedDB.getItem(`token_${type}`);
          if (tokenData) {
            tokenData.value = cookieValue; // Override with actual token from cookie
            this.memoryCache.set(type, tokenData);
            return tokenData;
          }
        }
        // Fallback if no metadata available
        tokenData = {
          value: cookieValue,
          type,
          encrypted: true,
          created: Date.now(),
          expires: Date.now() + 3600000 // 1 hour default
        };
        this.memoryCache.set(type, tokenData);
        return tokenData;
      }
    }

    // Check IndexedDB for non-sensitive tokens
    if (this.initialized) {
      tokenData = await this.encryptedDB.getItem(`token_${type}`);
      if (tokenData) {
        this.memoryCache.set(type, tokenData);
        return tokenData;
      }
    }

    return null;
  }

  /**
   * Remove token from all storage layers
   * @param {string} type - Token type
   */
  async removeToken(type) {
    // Remove from memory
    this.memoryCache.delete(type);

    // Remove from cookies if applicable
    if (this.isCookieStored(type)) {
      await httpOnlyCookies.removeToken(type);
    }

    // Remove from IndexedDB
    if (this.initialized) {
      await this.encryptedDB.removeItem(`token_${type}`);
    }
  }

  /**
   * Get all stored tokens
   * @returns {object} - Object with token types as keys
   */
  async getAllTokens() {
    const allTokens = {};

    if (this.initialized) {
      // This is a simplified implementation - in production, you'd iterate through the DB
      // For now, return memory cache
      for (const [type, tokenData] of this.memoryCache.cache.entries()) {
        allTokens[type] = tokenData;
      }
    }

    return allTokens;
  }

  /**
   * Clear all storage
   */
  async clear() {
    this.memoryCache.clear();

    if (this.initialized) {
      await this.encryptedDB.clear();
    }

    // Note: HTTP-only cookies should be cleared via API call
    // await httpOnlyCookies.clearAll();
  }

  /**
   * Determine if token type should be stored in cookies
   * @param {string} type - Token type
   * @returns {boolean} - True if should use cookies
   */
  isCookieStored(type) {
    // Store sensitive tokens in HTTP-only cookies
    return ['api_key', 'jwt', 'refresh'].includes(type);
  }

  /**
   * Get storage statistics
   * @returns {object} - Storage stats
   */
  getStats() {
    return {
      memoryCacheSize: this.memoryCache.size(),
      encryptedDBInitialized: this.initialized,
      cookieStorage: 'external'
    };
  }
}

// Export singleton instance
export const hybridStorage = new HybridStorage();