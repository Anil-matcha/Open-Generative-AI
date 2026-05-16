/**
 * Secure Token Manager Unit Tests
 * Tests secure token encryption/decryption using Web Crypto API with AES-GCM
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SecureTokenManager } from '../../src/lib/auth/secure-token-manager.js';

// Mock Web Crypto API
const mockCrypto = {
  subtle: {
    generateKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    exportKey: vi.fn(),
    importKey: vi.fn()
  },
  getRandomValues: vi.fn()
};

// Setup crypto mock
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

describe('SecureTokenManager', () => {
  let tokenManager;
  let mockLocalStorage;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    // Reset crypto mocks
    mockCrypto.subtle.generateKey.mockReset();
    mockCrypto.subtle.encrypt.mockReset();
    mockCrypto.subtle.decrypt.mockReset();
    mockCrypto.subtle.exportKey.mockReset();
    mockCrypto.subtle.importKey.mockReset();
    mockCrypto.getRandomValues.mockReset();

    // Create token manager instance
    tokenManager = new SecureTokenManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      expect(tokenManager).toBeDefined();
      expect(tokenManager.keyName).toBe('secure_tokens_v1');
      expect(tokenManager.metadataName).toBe('secure_tokens_metadata_v1');
      expect(tokenManager.masterKeyName).toBe('secure_master_key_v1');
    });

    it('should initialize master key on first use', async () => {
      // Mock master key not existing
      mockLocalStorage.getItem.mockReturnValue(null);

      // Mock key generation
      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } };
      const mockExportedKey = new Uint8Array([1, 2, 3, 4]);
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(mockExportedKey);

      await tokenManager.initialize();

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        tokenManager.masterKeyName,
        expect.any(String)
      );
    });

    it('should load existing master key', async () => {
      // Mock existing master key
      const mockKeyData = {
        key: btoa('mock-key-data'),
        created: Date.now(),
        version: 'test-version'
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockKeyData));

      const mockKey = { type: 'secret' };
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);

      await tokenManager.initialize();

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        'AES-GCM',
        false,
        ['encrypt', 'decrypt']
      );
    });
  });

  describe('token encryption', () => {
    beforeEach(async () => {
      // Setup initialized state
      const mockKey = { type: 'secret' };
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(new Uint8Array([1, 2, 3]));
      mockLocalStorage.getItem.mockReturnValue(null);

      await tokenManager.initialize();
    });

    it('should encrypt tokens with unique nonces', async () => {
      const testToken = 'sensitive-api-token';
      const mockEncrypted = new Uint8Array([4, 5, 6]);
      const mockIv = new Uint8Array([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]); // 12 bytes for AES-GCM

      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);

      await tokenManager.storeToken('api-token', testToken);

      // Verify unique IV generation
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(new Uint8Array(12));

      // Verify encryption call
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: mockIv },
        expect.objectContaining({ type: 'secret' }),
        expect.any(Uint8Array)
      );

      // Verify storage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        tokenManager.keyName,
        expect.stringContaining('api-token')
      );
    });

    it('should generate different IVs for each encryption', async () => {
      const testToken1 = 'token1';
      const testToken2 = 'token2';
      const mockIv1 = new Uint8Array([1, 2, 3]);
      const mockIv2 = new Uint8Array([4, 5, 6]);

      mockCrypto.getRandomValues
        .mockReturnValueOnce(mockIv1)
        .mockReturnValueOnce(mockIv2);

      mockCrypto.subtle.encrypt
        .mockResolvedValueOnce(new Uint8Array([10, 11, 12]))
        .mockResolvedValueOnce(new Uint8Array([13, 14, 15]));

      await tokenManager.storeToken('token1', testToken1);
      await tokenManager.storeToken('token2', testToken2);

      // Verify different IVs were generated
      expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(2);
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledTimes(2);
    });

    it('should validate token before encryption', async () => {
      await expect(tokenManager.storeToken('test', '')).rejects.toThrow('Token cannot be empty');
      await expect(tokenManager.storeToken('test', null)).rejects.toThrow('Token cannot be empty');
      await expect(tokenManager.storeToken('test', undefined)).rejects.toThrow('Token cannot be empty');
    });

    it('should validate token name', async () => {
      await expect(tokenManager.storeToken('', 'token')).rejects.toThrow('Token name cannot be empty');
      await expect(tokenManager.storeToken(null, 'token')).rejects.toThrow('Token name cannot be empty');
    });
  });

  describe('token decryption', () => {
    beforeEach(async () => {
      // Setup initialized state
      const mockKey = { type: 'secret' };
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(new Uint8Array([1, 2, 3]));
      mockLocalStorage.getItem.mockReturnValue(null);

      await tokenManager.initialize();
    });

    it('should decrypt stored tokens correctly', async () => {
      const testToken = 'my-secret-token';
      const mockIv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const mockEncrypted = new Uint8Array([20, 21, 22]);

      // Setup encryption mocks
      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);

      // Store token first
      await tokenManager.storeToken('test-token', testToken);

      // Setup decryption mocks
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode(testToken));

      // Mock stored data retrieval
      const storedData = {
        'test-token': {
          encrypted: btoa(String.fromCharCode(...mockEncrypted)),
          iv: btoa(String.fromCharCode(...mockIv)),
          timestamp: Date.now()
        }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      const decrypted = await tokenManager.getToken('test-token');

      expect(decrypted).toBe(testToken);
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: mockIv },
        expect.any(Object),
        mockEncrypted
      );
    });

    it('should return null for non-existent tokens', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({}));

      const result = await tokenManager.getToken('non-existent');
      expect(result).toBeNull();
    });

    it('should handle decryption failures gracefully', async () => {
      const storedData = {
        'test-token': {
          encrypted: 'invalid-base64',
          iv: btoa('123456789012'),
          timestamp: Date.now()
        }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'));

      const result = await tokenManager.getToken('test-token');
      expect(result).toBeNull();
    });
  });

  describe('token management', () => {
    beforeEach(async () => {
      const mockKey = { type: 'secret' };
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(new Uint8Array([1, 2, 3]));
      mockLocalStorage.getItem.mockReturnValue(null);

      await tokenManager.initialize();
    });

    it('should list stored token names', async () => {
      const storedData = {
        'api-token': { encrypted: 'data1', iv: 'iv1', timestamp: 123 },
        'auth-token': { encrypted: 'data2', iv: 'iv2', timestamp: 456 }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      const tokens = await tokenManager.listTokens();
      expect(tokens).toEqual(['api-token', 'auth-token']);
    });

    it('should remove tokens', async () => {
      const storedData = {
        'api-token': { encrypted: 'data1', iv: 'iv1', timestamp: 123 },
        'auth-token': { encrypted: 'data2', iv: 'iv2', timestamp: 456 }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      await tokenManager.removeToken('api-token');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        tokenManager.keyName,
        JSON.stringify({
          'auth-token': { encrypted: 'data2', iv: 'iv2', timestamp: 456 }
        })
      );
    });

    it('should clear all tokens', async () => {
      await tokenManager.clearAllTokens();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(tokenManager.keyName);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(tokenManager.metadataName);
    });
  });

  describe('security features', () => {
    it('should use AES-GCM encryption', async () => {
      const mockKey = { type: 'secret' };
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(new Uint8Array([1, 2, 3]));
      mockLocalStorage.getItem.mockReturnValue(null);

      await tokenManager.initialize();

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    });

    it('should use cryptographically secure random values for IVs', async () => {
      const mockKey = { type: 'secret' };
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(new Uint8Array([1, 2, 3]));
      mockLocalStorage.getItem.mockReturnValue(null);

      await tokenManager.initialize();

      await tokenManager.storeToken('test', 'token');

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(new Uint8Array(12));
    });

    it('should handle crypto API unavailability', () => {
      // Temporarily remove crypto
      const originalCrypto = global.crypto;
      delete global.crypto;

      expect(() => new SecureTokenManager()).toThrow('Web Crypto API is not available');

      // Restore crypto
      global.crypto = originalCrypto;
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors during storage', async () => {
      const mockKey = { type: 'secret' };
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(new Uint8Array([1, 2, 3]));
      mockLocalStorage.getItem.mockReturnValue(null);

      await tokenManager.initialize();

      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      await expect(tokenManager.storeToken('test', 'token')).rejects.toThrow('Failed to securely store token');
    });

    it('should handle localStorage errors during retrieval', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const result = await tokenManager.getToken('test');
      expect(result).toBeNull();
    });
  });

  describe('token metadata', () => {
    beforeEach(async () => {
      const mockKey = { type: 'secret' };
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(new Uint8Array([1, 2, 3]));
      mockLocalStorage.getItem.mockReturnValue(null);

      await tokenManager.initialize();
    });

    it('should store token metadata', async () => {
      const mockIv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(new Uint8Array([20, 21, 22]));

      await tokenManager.storeToken('test-token', 'secret-value');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        tokenManager.metadataName,
        expect.stringContaining('test-token')
      );
    });

    it('should retrieve token metadata', async () => {
      const metadata = {
        'test-token': {
          created: Date.now(),
          lastAccessed: Date.now(),
          accessCount: 1
        }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(metadata));

      const result = await tokenManager.getTokenMetadata('test-token');
      expect(result).toEqual(metadata['test-token']);
    });
  });
});