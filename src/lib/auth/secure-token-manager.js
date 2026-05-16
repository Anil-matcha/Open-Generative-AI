/**
 * Secure Token Manager
 * Provides secure token storage, validation, and lifecycle management using Web Crypto API
 */

import { WebCryptoWrapper } from '../crypto/web-crypto.js';
import { deriveKeyFromPassword } from '../crypto/pbkdf2.js';
import { generateSalt, generateNonce } from '../crypto/random.js';
import { hybridStorage } from '../storage/hybrid-storage.js';

// Token types
export const TOKEN_TYPES = {
  API_KEY: 'api_key',
  JWT: 'jwt',
  SESSION: 'session',
  REFRESH: 'refresh'
};

// Security configuration
const SECURITY_CONFIG = {
  PBKDF2_ITERATIONS: 150000,
  KEY_LENGTH: 256,
  SALT_LENGTH: 16,
  NONCE_LENGTH: 12,
  TOKEN_EXPIRY: {
    [TOKEN_TYPES.JWT]: 60 * 60 * 1000, // 1 hour
    [TOKEN_TYPES.API_KEY]: 24 * 60 * 60 * 1000, // 24 hours
    [TOKEN_TYPES.SESSION]: 8 * 60 * 60 * 1000, // 8 hours
    [TOKEN_TYPES.REFRESH]: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

/**
 * Secure Token Manager with Web Crypto API encryption
 */
export class SecureTokenManager {
  constructor() {
    this.crypto = new WebCryptoWrapper();
    this.encryptionKey = null;
    this.keySalt = null;
    this.tokens = new Map();
    this.initialized = false;

    // Bind methods to maintain context
    this.initializeKey = this.initializeKey.bind(this);
    this.setToken = this.setToken.bind(this);
    this.getToken = this.getToken.bind(this);
    this.removeToken = this.removeToken.bind(this);
    this.clear = this.clear.bind(this);
  }

  /**
   * Initialize encryption key from user password
   * @param {string} password - User password for key derivation
   * @param {Uint8Array} salt - Optional salt (generated if not provided)
   */
  async initializeKey(password, salt = null) {
    try {
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }

      this.keySalt = salt || generateSalt(SECURITY_CONFIG.SALT_LENGTH);

      // Derive encryption key using PBKDF2
      this.encryptionKey = await deriveKeyFromPassword(
        password,
        this.keySalt,
        SECURITY_CONFIG.PBKDF2_ITERATIONS,
        SECURITY_CONFIG.KEY_LENGTH
      );

      this.initialized = true;

      // Load any existing tokens from secure storage
      await this.loadStoredTokens();

    } catch (error) {
      this.clear();
      throw new Error(`Key initialization failed: ${error.message}`);
    }
  }

  /**
   * Store token securely with encryption for sensitive types
   * @param {string} type - Token type (api_key, jwt, session, refresh)
   * @param {string} token - Token value
   * @param {object} options - Additional options
   */
  async setToken(type, token, options = {}) {
    if (!this.initialized) {
      throw new Error('Key not initialized. Call initializeKey() first.');
    }

    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string');
    }

    // Validate token format
    this.validateTokenFormat(type, token);

    const now = Date.now();
    const tokenData = {
      type,
      created: now,
      expires: options.expires || this.calculateExpiry(type, options),
      encrypted: this.isSensitiveToken(type),
      metadata: options.metadata || {}
    };

    // Encrypt sensitive tokens
    if (tokenData.encrypted) {
      const nonce = generateNonce(SECURITY_CONFIG.NONCE_LENGTH);
      tokenData.value = await this.crypto.encrypt(this.encryptionKey, token, nonce);
      tokenData.nonce = nonce;
    } else {
      tokenData.value = token;
    }

    // Store in memory and persistent storage
    this.tokens.set(type, tokenData);
    await hybridStorage.setToken(type, tokenData);

    return tokenData;
  }

  /**
   * Retrieve token securely with decryption if needed
   * @param {string} type - Token type
   * @returns {string|null} - Decrypted token or null if not found/expired
   */
  async getToken(type) {
    if (!this.initialized) {
      throw new Error('Key not initialized. Call initializeKey() first.');
    }

    // Check memory cache first
    let tokenData = this.tokens.get(type);

    // Load from persistent storage if not in memory
    if (!tokenData) {
      tokenData = await hybridStorage.getToken(type);
      if (tokenData) {
        this.tokens.set(type, tokenData);
      }
    }

    if (!tokenData) {
      return null;
    }

    // Check expiry
    if (this.isTokenExpired(tokenData)) {
      await this.removeToken(type);
      return null;
    }

    // Decrypt if necessary
    if (tokenData.encrypted) {
      try {
        return await this.crypto.decrypt(this.encryptionKey, tokenData.value, tokenData.nonce);
      } catch (error) {
        // Decryption failed - token may be corrupted or key changed
        await this.removeToken(type);
        throw new Error(`Token decryption failed: ${error.message}`);
      }
    }

    return tokenData.value;
  }

  /**
   * Remove token securely
   * @param {string} type - Token type to remove
   */
  async removeToken(type) {
    this.tokens.delete(type);
    await hybridStorage.removeToken(type);
  }

  /**
   * Clear all tokens and encryption keys from memory
   */
  clear() {
    this.tokens.clear();
    this.encryptionKey = null;
    this.keySalt = null;
    this.initialized = false;
  }

  /**
   * Validate token format based on type
   * @param {string} type - Token type
   * @param {string} token - Token value
   * @throws {Error} - If token format is invalid
   */
  validateTokenFormat(type, token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format: must be non-empty string');
    }

    switch (type) {
      case TOKEN_TYPES.JWT:
        // JWT format: header.payload.signature
        if (token.split('.').length !== 3) {
          throw new Error('Invalid JWT format');
        }
        break;

      case TOKEN_TYPES.API_KEY:
        // API keys should be reasonably long and not contain spaces
        if (token.length < 20 || token.includes(' ')) {
          throw new Error('Invalid API key format');
        }
        break;

      case TOKEN_TYPES.SESSION:
        // Session tokens should be UUID-like or sufficiently long
        const uuidRegex = /^[a-f0-9-]{36}$/i;
        if (!uuidRegex.test(token) && token.length < 32) {
          throw new Error('Invalid session token format');
        }
        break;

      case TOKEN_TYPES.REFRESH:
        // Refresh tokens should be secure random strings
        if (token.length < 32) {
          throw new Error('Invalid refresh token format');
        }
        break;

      default:
        if (token.length === 0) {
          throw new Error('Invalid token format');
        }
    }
  }

  /**
   * Check if token type requires encryption
   * @param {string} type - Token type
   * @returns {boolean} - True if token should be encrypted
   */
  isSensitiveToken(type) {
    return [TOKEN_TYPES.API_KEY, TOKEN_TYPES.JWT, TOKEN_TYPES.REFRESH].includes(type);
  }

  /**
   * Check if token is expired
   * @param {object} tokenData - Token data object
   * @returns {boolean} - True if token is expired
   */
  isTokenExpired(tokenData) {
    return tokenData.expires && Date.now() > tokenData.expires;
  }

  /**
   * Calculate token expiry time
   * @param {string} type - Token type
   * @param {object} options - Options with custom expiry
   * @returns {number} - Expiry timestamp
   */
  calculateExpiry(type, options = {}) {
    const now = Date.now();
    return options.expires || (now + (SECURITY_CONFIG.TOKEN_EXPIRY[type] || 3600000));
  }

  /**
   * Load stored tokens from persistent storage
   * @private
   */
  async loadStoredTokens() {
    try {
      const storedTokens = await hybridStorage.getAllTokens();
      for (const [type, tokenData] of Object.entries(storedTokens)) {
        if (!this.isTokenExpired(tokenData)) {
          this.tokens.set(type, tokenData);
        } else {
          // Clean up expired tokens
          await hybridStorage.removeToken(type);
        }
      }
    } catch (error) {
      // Log but don't fail initialization
      console.warn('Failed to load stored tokens:', error);
    }
  }

  /**
   * Get token status information
   * @param {string} type - Token type
   * @returns {object} - Token status
   */
  async getTokenStatus(type) {
    const tokenData = this.tokens.get(type) || await hybridStorage.getToken(type);

    if (!tokenData) {
      return { exists: false };
    }

    const isExpired = this.isTokenExpired(tokenData);
    const timeToExpiry = tokenData.expires - Date.now();

    return {
      exists: true,
      expired: isExpired,
      timeToExpiry: Math.max(0, timeToExpiry),
      type: tokenData.type,
      created: tokenData.created,
      encrypted: tokenData.encrypted
    };
  }
}

// Export singleton instance
export const secureTokenManager = new SecureTokenManager();