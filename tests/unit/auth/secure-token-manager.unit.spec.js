/**
 * Secure Token Manager - Unit Tests
 * Tests the secure token encryption and management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SecureTokenManager } from '../../src/lib/auth/secure-token-manager.js';

// Mock the crypto utilities
vi.mock('../../src/lib/crypto/web-crypto.js', () => ({
  WebCryptoWrapper: {
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    generateKey: vi.fn(),
    importKey: vi.fn()
  }
}));

vi.mock('../../src/lib/crypto/pbkdf2.js', () => ({
  deriveKeyFromPassword: vi.fn()
}));

vi.mock('../../src/lib/crypto/random.js', () => ({
  generateSalt: vi.fn(),
  generateNonce: vi.fn()
}));

vi.mock('../src/lib/crypto/pbkdf2.js', () => ({
  deriveKeyFromPassword: vi.fn()
}));

vi.mock('../src/lib/crypto/random.js', () => ({
  generateSalt: vi.fn(),
  generateNonce: vi.fn()
}));

describe('SecureTokenManager', () => {
  let tokenManager;
  let mockWebCrypto;
  let mockPBKDF2;
  let mockRandom;

  beforeEach(() => {
    // Reset mocks
    mockWebCrypto = {
      encrypt: vi.fn().mockResolvedValue('encrypted_data'),
      decrypt: vi.fn().mockResolvedValue('decrypted_token'),
      generateKey: vi.fn().mockResolvedValue('mock_key'),
      importKey: vi.fn().mockResolvedValue('imported_key')
    };

    mockPBKDF2 = {
      deriveKeyFromPassword: vi.fn().mockResolvedValue('derived_key')
    };

    mockRandom = {
      generateSalt: vi.fn().mockReturnValue(new Uint8Array(16)),
      generateNonce: vi.fn().mockReturnValue(new Uint8Array(12))
    };

    // Apply mocks
    vi.mocked(require('../src/lib/crypto/web-crypto.js').WebCryptoWrapper).mockReturnValue(mockWebCrypto);
    vi.mocked(require('../src/lib/crypto/pbkdf2.js').deriveKeyFromPassword).mockResolvedValue('derived_key');
    vi.mocked(require('../src/lib/crypto/random.js').generateSalt).mockReturnValue(new Uint8Array(16));
    vi.mocked(require('../src/lib/crypto/random.js').generateNonce).mockReturnValue(new Uint8Array(12));

    tokenManager = new SecureTokenManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Storage and Retrieval', () => {
    it('should encrypt sensitive tokens before storage', async () => {
      const apiKey = 'test-api-key-12345';

      await tokenManager.setToken('api_key', apiKey);

      expect(mockWebCrypto.encrypt).toHaveBeenCalledWith(
        expect.any(String),
        apiKey,
        expect.any(Uint8Array)
      );
    });

    it('should decrypt tokens when retrieving', async () => {
      const apiKey = 'test-api-key-12345';
      mockWebCrypto.decrypt.mockResolvedValue(apiKey);

      await tokenManager.setToken('api_key', apiKey);
      const retrieved = await tokenManager.getToken('api_key');

      expect(mockWebCrypto.decrypt).toHaveBeenCalled();
      expect(retrieved).toBe(apiKey);
    });

    it('should not encrypt non-sensitive tokens', async () => {
      const sessionId = 'session-123';

      await tokenManager.setToken('session', sessionId);

      expect(mockWebCrypto.encrypt).not.toHaveBeenCalled();
    });

    it('should validate token format', async () => {
      await expect(tokenManager.setToken('api_key', '')).rejects.toThrow('Invalid token format');
      await expect(tokenManager.setToken('api_key', 'short')).rejects.toThrow('Invalid token format');
      await expect(tokenManager.setToken('jwt', 'invalid.jwt')).rejects.toThrow('Invalid token format');
    });
  });

  describe('Key Management', () => {
    it('should derive encryption key from password', async () => {
      const password = 'user-password';
      const salt = new Uint8Array(16);

      await tokenManager.initializeKey(password);

      expect(mockPBKDF2.deriveKeyFromPassword).toHaveBeenCalledWith(password, salt);
    });

    it('should generate unique salt for each key derivation', async () => {
      const password = 'user-password';

      await tokenManager.initializeKey(password);

      expect(mockRandom.generateSalt).toHaveBeenCalled();
    });

    it('should require key initialization before sensitive operations', async () => {
      const apiKey = 'test-api-key';

      await expect(tokenManager.setToken('api_key', apiKey)).rejects.toThrow('Key not initialized');
    });
  });

  describe('Token Types', () => {
    it('should handle API key tokens', async () => {
      await tokenManager.initializeKey('password');
      const apiKey = 'sk-12345678901234567890123456789012';

      await tokenManager.setToken('api_key', apiKey);
      const retrieved = await tokenManager.getToken('api_key');

      expect(retrieved).toBe(apiKey);
    });

    it('should handle JWT tokens', async () => {
      await tokenManager.initializeKey('password');
      const jwt = 'header.payload.signature';

      await tokenManager.setToken('jwt', jwt);
      const retrieved = await tokenManager.getToken('jwt');

      expect(retrieved).toBe(jwt);
    });

    it('should handle session tokens', async () => {
      const sessionId = '12345678-1234-1234-1234-123456789012';

      await tokenManager.setToken('session', sessionId);
      const retrieved = await tokenManager.getToken('session');

      expect(retrieved).toBe(sessionId);
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption failures', async () => {
      await tokenManager.initializeKey('password');
      mockWebCrypto.encrypt.mockRejectedValue(new Error('Encryption failed'));

      await expect(tokenManager.setToken('api_key', 'test-key')).rejects.toThrow('Encryption failed');
    });

    it('should handle decryption failures', async () => {
      await tokenManager.initializeKey('password');
      mockWebCrypto.decrypt.mockRejectedValue(new Error('Decryption failed'));

      await expect(tokenManager.getToken('api_key')).rejects.toThrow('Decryption failed');
    });

    it('should handle key derivation failures', async () => {
      mockPBKDF2.deriveKeyFromPassword.mockRejectedValue(new Error('Derivation failed'));

      await expect(tokenManager.initializeKey('password')).rejects.toThrow('Derivation failed');
    });
  });

  describe('Security Features', () => {
    it('should use unique nonces for each encryption', async () => {
      await tokenManager.initializeKey('password');

      await tokenManager.setToken('api_key', 'key1');
      await tokenManager.setToken('api_key', 'key2');

      expect(mockRandom.generateNonce).toHaveBeenCalledTimes(2);
    });

    it('should clear sensitive data from memory', async () => {
      await tokenManager.initializeKey('password');
      await tokenManager.setToken('api_key', 'sensitive-key');

      tokenManager.clear();

      expect(tokenManager.encryptionKey).toBeNull();
      expect(tokenManager.tokens.size).toBe(0);
    });

    it('should validate token expiry', async () => {
      const expiredToken = {
        value: 'encrypted-token',
        encrypted: true,
        expires: Date.now() - 1000,
        type: 'api_key'
      };

      tokenManager.tokens.set('api_key', expiredToken);
      const retrieved = await tokenManager.getToken('api_key');

      expect(retrieved).toBeNull();
    });
  });
});