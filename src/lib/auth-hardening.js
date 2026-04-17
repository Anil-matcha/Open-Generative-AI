/**
 * Authentication Token Hardening
 * Provides secure token storage, validation, and lifecycle management
 */

import { secureStorage } from './security/index.js';
import { SecurityError, NetworkError } from './error-handling.js';

// Token types
export const TOKEN_TYPES = {
  API_KEY: 'api_key',
  JWT: 'jwt',
  SESSION: 'session',
  REFRESH: 'refresh'
};

// Token storage with encryption and validation
export class SecureTokenManager {
  constructor() {
    this.tokens = new Map();
    this.tokenValidators = new Map();
    this.refreshTimers = new Map();
  }

  // Store token securely
  setToken(type, token, options = {}) {
    if (!token) {
      throw new SecurityError('Cannot store empty token', 'empty_token');
    }

    // Validate token format
    if (!this.validateTokenFormat(type, token)) {
      throw new SecurityError(`Invalid ${type} token format`, 'invalid_format');
    }

    const tokenData = {
      value: token,
      type,
      created: Date.now(),
      expires: options.expires || this.calculateExpiry(type, options),
      metadata: options.metadata || {}
    };

    // Encrypt sensitive tokens
    if (this.isSensitiveToken(type)) {
      tokenData.encrypted = true;
      tokenData.value = this.encryptToken(token);
    }

    this.tokens.set(type, tokenData);
    secureStorage.setItem(`auth_token_${type}`, tokenData);

    // Setup auto-refresh if configured
    if (options.autoRefresh && type === TOKEN_TYPES.REFRESH) {
      this.setupAutoRefresh(type, options.refreshInterval || 300000); // 5 minutes
    }

    console.log(`[Auth] Token ${type} stored securely`);
  }

  // Retrieve token securely
  getToken(type) {
    let tokenData = this.tokens.get(type);
    
    if (!tokenData) {
      tokenData = secureStorage.getItem(`auth_token_${type}`);
      if (tokenData) {
        this.tokens.set(type, tokenData);
      }
    }

    if (!tokenData) {
      return null;
    }

    // Check expiry
    if (this.isTokenExpired(tokenData)) {
      this.removeToken(type);
      return null;
    }

    // Decrypt if necessary
    let token = tokenData.value;
    if (tokenData.encrypted) {
      token = this.decryptToken(token);
    }

    return token;
  }

  // Remove token securely
  removeToken(type) {
    this.tokens.delete(type);
    secureStorage.removeItem(`auth_token_${type}`);
    
    // Clear auto-refresh timer
    if (this.refreshTimers.has(type)) {
      clearInterval(this.refreshTimers.get(type));
      this.refreshTimers.delete(type);
    }

    console.log(`[Auth] Token ${type} removed`);
  }

  // Clear all tokens
  clearAllTokens() {
    for (const type of this.tokens.keys()) {
      this.removeToken(type);
    }
    console.log('[Auth] All tokens cleared');
  }

  // Validate token format
  validateTokenFormat(type, token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    switch (type) {
      case TOKEN_TYPES.JWT:
        // Basic JWT format validation (header.payload.signature)
        return token.split('.').length === 3;
      
      case TOKEN_TYPES.API_KEY:
        // API keys should be reasonably long and not contain spaces
        return token.length >= 20 && !token.includes(' ');
      
      case TOKEN_TYPES.SESSION:
        // Session tokens should be UUID-like
        return /^[a-f0-9-]{36}$/i.test(token) || token.length >= 32;
      
      default:
        return token.length > 0;
    }
  }

  // Check if token is expired
  isTokenExpired(tokenData) {
    return tokenData.expires && Date.now() > tokenData.expires;
  }

  // Calculate token expiry
  calculateExpiry(type, options) {
    const now = Date.now();
    const defaultExpiry = {
      [TOKEN_TYPES.JWT]: now + (60 * 60 * 1000), // 1 hour
      [TOKEN_TYPES.API_KEY]: now + (24 * 60 * 60 * 1000), // 24 hours
      [TOKEN_TYPES.SESSION]: now + (8 * 60 * 60 * 1000), // 8 hours
      [TOKEN_TYPES.REFRESH]: now + (7 * 24 * 60 * 60 * 1000) // 7 days
    };

    return options.expires || defaultExpiry[type] || now + (60 * 60 * 1000);
  }

  // Check if token type is sensitive
  isSensitiveToken(type) {
    return [TOKEN_TYPES.API_KEY, TOKEN_TYPES.JWT, TOKEN_TYPES.REFRESH].includes(type);
  }

  // Basic encryption/decryption (in production, use proper crypto)
  encryptToken(token) {
    // Simple obfuscation - NOT secure for production
    return btoa(token.split('').reverse().join(''));
  }

  decryptToken(encryptedToken) {
    // Reverse the obfuscation
    return atob(encryptedToken).split('').reverse().join('');
  }

  // Setup automatic token refresh
  setupAutoRefresh(type, interval) {
    const timer = setInterval(async () => {
      try {
        const refreshToken = this.getToken(TOKEN_TYPES.REFRESH);
        if (!refreshToken) {
          this.removeToken(type);
          return;
        }

        // Attempt to refresh token
        const newToken = await this.refreshToken(refreshToken);
        if (newToken) {
          this.setToken(TOKEN_TYPES.JWT, newToken);
        }
      } catch (error) {
        console.error('[Auth] Token refresh failed:', error);
        // Don't remove tokens on refresh failure - let them expire naturally
      }
    }, interval);

    this.refreshTimers.set(type, timer);
  }

  // Token refresh logic (to be implemented based on API)
  async refreshToken(refreshToken) {
    try {
      // This would call your refresh endpoint
      // const response = await fetch('/api/auth/refresh', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${refreshToken}` }
      // });
      // return response.json().then(data => data.token);
      
      console.log('[Auth] Token refresh attempted (not implemented)');
      return null;
    } catch (error) {
      throw new NetworkError('Token refresh failed', 0, '/api/auth/refresh');
    }
  }

  // Validate token with server
  async validateTokenWithServer(type, token) {
    try {
      // This would call your token validation endpoint
      // const response = await fetch('/api/auth/validate', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // return response.ok;
      
      console.log(`[Auth] Server validation for ${type} (not implemented)`);
      return true; // Assume valid for now
    } catch (error) {
      return false;
    }
  }

  // Get token status
  getTokenStatus(type) {
    const tokenData = this.tokens.get(type) || secureStorage.getItem(`auth_token_${type}`);
    
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
      created: tokenData.created
    };
  }
}

// API request wrapper with automatic token handling
export class AuthenticatedApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.tokenManager = new SecureTokenManager();
  }

  async request(endpoint, options = {}) {
    const url = this.baseUrl + endpoint;
    const token = this.tokenManager.getToken(TOKEN_TYPES.JWT) || 
                  this.tokenManager.getToken(TOKEN_TYPES.API_KEY);

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle token expiry
      if (response.status === 401) {
        this.tokenManager.removeToken(TOKEN_TYPES.JWT);
        throw new SecurityError('Authentication token expired', 'token_expired');
      }

      return response;
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new NetworkError(error.message, 0, url);
    }
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Global instances
export const tokenManager = new SecureTokenManager();
export const apiClient = new AuthenticatedApiClient();

// Initialize authentication hardening
export function initializeAuthHardening() {
  // Setup token cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      // Clear sensitive tokens from memory (they remain in secureStorage)
      tokenManager.tokens.clear();
    });
  }

  console.log('[Auth] Authentication hardening initialized');
  return { tokenManager, apiClient };
}

// Utility functions for common auth operations
export function setApiKey(apiKey) {
  tokenManager.setToken(TOKEN_TYPES.API_KEY, apiKey, {
    metadata: { source: 'user_input' }
  });
}

export function getApiKey() {
  return tokenManager.getToken(TOKEN_TYPES.API_KEY);
}

export function clearAuthTokens() {
  tokenManager.clearAllTokens();
}

export function isAuthenticated() {
  return !!(tokenManager.getToken(TOKEN_TYPES.JWT) || tokenManager.getToken(TOKEN_TYPES.API_KEY));
}
