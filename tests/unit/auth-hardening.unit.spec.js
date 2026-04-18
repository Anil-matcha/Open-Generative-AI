/**
 * Authentication Hardening Unit Tests
 * Tests secure token storage, validation, and lifecycle management
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import {
  SecureTokenManager,
  AuthenticatedApiClient,
  tokenManager,
  apiClient,
  TOKEN_TYPES,
  setApiKey,
  getApiKey,
  clearAuthTokens,
  isAuthenticated,
  initializeAuthHardening
} from '../../src/lib/auth-hardening.js';

describe('SecureTokenManager', () => {
  let tokenManager;
  let mockSecureStorage;

  beforeEach(() => {
    // Mock secureStorage
    mockSecureStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn()
    };

    // Create a new instance for each test
    tokenManager = new SecureTokenManager();
    tokenManager.secureStorage = mockSecureStorage;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Storage', () => {
    it('should store API key token securely', () => {
      const apiKey = 'test-api-key-12345';
      tokenManager.setToken(TOKEN_TYPES.API_KEY, apiKey);

      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        'auth_token_api_key',
        expect.objectContaining({
          value: expect.any(String),
          type: TOKEN_TYPES.API_KEY,
          encrypted: true
        })
      );
    });

    it('should store JWT token securely', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      tokenManager.setToken(TOKEN_TYPES.JWT, jwt);

      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        'auth_token_jwt',
        expect.objectContaining({
          value: expect.any(String),
          type: TOKEN_TYPES.JWT,
          encrypted: true
        })
      );
    });

    it('should reject empty tokens', () => {
      expect(() => tokenManager.setToken(TOKEN_TYPES.API_KEY, '')).toThrow('Cannot store empty token');
      expect(() => tokenManager.setToken(TOKEN_TYPES.JWT, null)).toThrow('Cannot store empty token');
    });

    it('should validate token formats', () => {
      // Valid JWT format
      const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      expect(() => tokenManager.setToken(TOKEN_TYPES.JWT, validJwt)).not.toThrow();

      // Invalid JWT format
      const invalidJwt = 'not-a-jwt';
      expect(() => tokenManager.setToken(TOKEN_TYPES.JWT, invalidJwt)).toThrow('Invalid JWT token format');

      // Valid API key
      const validApiKey = 'sk-12345678901234567890123456789012';
      expect(() => tokenManager.setToken(TOKEN_TYPES.API_KEY, validApiKey)).not.toThrow();

      // Invalid API key (too short)
      const invalidApiKey = 'short';
      expect(() => tokenManager.setToken(TOKEN_TYPES.API_KEY, invalidApiKey)).toThrow('Invalid API key token format');
    });
  });

  describe('Token Retrieval', () => {
    it('should retrieve and decrypt stored tokens', () => {
      const apiKey = 'test-api-key-12345';
      tokenManager.setToken(TOKEN_TYPES.API_KEY, apiKey);

      // Mock the encrypted value retrieval
      const storedData = {
        value: tokenManager.encryptToken(apiKey),
        type: TOKEN_TYPES.API_KEY,
        encrypted: true,
        expires: Date.now() + 3600000
      };
      mockSecureStorage.getItem.mockReturnValue(storedData);

      const retrieved = tokenManager.getToken(TOKEN_TYPES.API_KEY);
      expect(retrieved).toBe(apiKey);
    });

    it('should return null for expired tokens', () => {
      const expiredData = {
        value: 'encrypted-token',
        type: TOKEN_TYPES.JWT,
        encrypted: true,
        expires: Date.now() - 1000 // Expired 1 second ago
      };
      mockSecureStorage.getItem.mockReturnValue(expiredData);

      const retrieved = tokenManager.getToken(TOKEN_TYPES.JWT);
      expect(retrieved).toBeNull();
      expect(mockSecureStorage.removeItem).toHaveBeenCalledWith('auth_token_jwt');
    });

    it('should return null for non-existent tokens', () => {
      mockSecureStorage.getItem.mockReturnValue(null);
      const retrieved = tokenManager.getToken(TOKEN_TYPES.SESSION);
      expect(retrieved).toBeNull();
    });
  });

  describe('Token Removal', () => {
    it('should remove tokens and clear timers', () => {
      // Setup a token with auto-refresh
      tokenManager.setToken(TOKEN_TYPES.REFRESH, 'refresh-token', { autoRefresh: true });

      tokenManager.removeToken(TOKEN_TYPES.REFRESH);

      expect(mockSecureStorage.removeItem).toHaveBeenCalledWith('auth_token_refresh');
      expect(tokenManager.tokens.has(TOKEN_TYPES.REFRESH)).toBe(false);
    });

    it('should clear all tokens', () => {
      tokenManager.setToken(TOKEN_TYPES.API_KEY, 'api-key');
      tokenManager.setToken(TOKEN_TYPES.JWT, 'jwt-token');

      tokenManager.clearAllTokens();

      expect(tokenManager.tokens.size).toBe(0);
      expect(mockSecureStorage.removeItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('Auto Refresh', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should setup auto-refresh for refresh tokens', () => {
      const refreshToken = 'refresh-token-123';
      tokenManager.setToken(TOKEN_TYPES.REFRESH, refreshToken, {
        autoRefresh: true,
        refreshInterval: 5000
      });

      expect(tokenManager.refreshTimers.has(TOKEN_TYPES.REFRESH)).toBe(true);

      // Fast-forward time
      vi.advanceTimersByTime(5000);

      // Should attempt refresh (though refreshToken method is not implemented)
      expect(tokenManager.refreshTimers.get(TOKEN_TYPES.REFRESH)).toBeDefined();
    });
  });

  describe('Token Status', () => {
    it('should return correct token status', () => {
      const tokenData = {
        value: 'encrypted-token',
        type: TOKEN_TYPES.JWT,
        created: Date.now() - 1800000, // 30 minutes ago
        expires: Date.now() + 1800000, // 30 minutes from now
        encrypted: true
      };
      mockSecureStorage.getItem.mockReturnValue(tokenData);

      const status = tokenManager.getTokenStatus(TOKEN_TYPES.JWT);

      expect(status).toEqual({
        exists: true,
        expired: false,
        timeToExpiry: expect.any(Number),
        type: TOKEN_TYPES.JWT,
        created: tokenData.created
      });
    });

    it('should handle non-existent tokens', () => {
      mockSecureStorage.getItem.mockReturnValue(null);
      const status = tokenManager.getTokenStatus(TOKEN_TYPES.API_KEY);

      expect(status).toEqual({ exists: false });
    });
  });
});

describe('AuthenticatedApiClient', () => {
  let apiClient;
  let mockTokenManager;
  let mockFetch;

  beforeEach(() => {
    mockTokenManager = {
      getToken: vi.fn()
    };

    mockFetch = vi.fn();
    global.fetch = mockFetch;

    apiClient = new AuthenticatedApiClient('https://api.example.com');
    apiClient.tokenManager = mockTokenManager;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Request Headers', () => {
    it('should include JWT token in Authorization header', async () => {
      const jwt = 'jwt-token-123';
      mockTokenManager.getToken.mockReturnValue(jwt);
      mockFetch.mockResolvedValue({ ok: true, json: () => ({}) });

      await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer jwt-token-123',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should include API key when no JWT available', async () => {
      const apiKey = 'api-key-123';
      mockTokenManager.getToken
        .mockReturnValueOnce(null) // JWT
        .mockReturnValueOnce(apiKey); // API key

      mockFetch.mockResolvedValue({ ok: true, json: () => ({}) });

      await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer api-key-123'
          })
        })
      );
    });

    it('should not include Authorization header when no tokens available', async () => {
      mockTokenManager.getToken.mockReturnValue(null);
      mockFetch.mockResolvedValue({ ok: true, json: () => ({}) });

      await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
            // No Authorization header
          })
        })
      );
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({ ok: true, json: () => ({ success: true }) });
    });

    it('should support GET requests', async () => {
      await apiClient.get('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should support POST requests with data', async () => {
      const data = { name: 'John', email: 'john@example.com' };
      await apiClient.post('/users', data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data)
        })
      );
    });

    it('should support PUT requests', async () => {
      const data = { name: 'Updated Name' };
      await apiClient.put('/users/1', data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data)
        })
      );
    });

    it('should support DELETE requests', async () => {
      await apiClient.delete('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 responses by removing JWT token', async () => {
      mockTokenManager.getToken.mockReturnValue('jwt-token');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(apiClient.get('/protected')).rejects.toThrow('Authentication token expired');

      expect(mockTokenManager.removeToken).toHaveBeenCalledWith(TOKEN_TYPES.JWT);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });
  });
});

describe('Authentication Utility Functions', () => {
  let mockSecureStorage;

  beforeEach(() => {
    mockSecureStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn()
    };

    // Mock the global tokenManager
    global.tokenManager = {
      setToken: vi.fn(),
      getToken: vi.fn(),
      clearAllTokens: vi.fn()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('API Key Management', () => {
    it('should set API key using token manager', () => {
      const apiKey = 'test-api-key';
      setApiKey(apiKey);

      expect(global.tokenManager.setToken).toHaveBeenCalledWith(
        TOKEN_TYPES.API_KEY,
        apiKey,
        { metadata: { source: 'user_input' } }
      );
    });

    it('should get API key from token manager', () => {
      const apiKey = 'retrieved-api-key';
      global.tokenManager.getToken.mockReturnValue(apiKey);

      const result = getApiKey();
      expect(result).toBe(apiKey);
      expect(global.tokenManager.getToken).toHaveBeenCalledWith(TOKEN_TYPES.API_KEY);
    });
  });

  describe('Authentication State', () => {
    it('should return true when JWT is available', () => {
      global.tokenManager.getToken
        .mockReturnValueOnce('jwt-token') // JWT
        .mockReturnValueOnce(null); // API key

      expect(isAuthenticated()).toBe(true);
    });

    it('should return true when API key is available', () => {
      global.tokenManager.getToken
        .mockReturnValueOnce(null) // JWT
        .mockReturnValueOnce('api-key'); // API key

      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no tokens available', () => {
      global.tokenManager.getToken.mockReturnValue(null);

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('Token Clearing', () => {
    it('should clear all authentication tokens', () => {
      clearAuthTokens();

      expect(global.tokenManager.clearAllTokens).toHaveBeenCalled();
    });
  });
});

describe('Initialization', () => {
  let mockWindow;

  beforeAll(() => {
    mockWindow = {
      addEventListener: vi.fn()
    };
    global.window = mockWindow;
  });

  it('should initialize auth hardening and setup cleanup', () => {
    const result = initializeAuthHardening();

    expect(result).toHaveProperty('tokenManager');
    expect(result).toHaveProperty('apiClient');
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });
});