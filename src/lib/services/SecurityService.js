/**
 * Security Service - Advanced API key management with encryption, key rotation, and authentication
 * Uses Web Crypto API for client-side encryption and implements secure key lifecycle management
 */
export class SecurityService {
  constructor() {
    this.keyName = 'muapi_key_encrypted_v2';
    this.saltName = 'muapi_key_salt_v2';
    this.metadataName = 'muapi_key_metadata_v2';
    this.masterKeyName = 'muapi_master_key_v2';

    this.initialized = false;
    this.keyRotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days
    this.maxKeyAge = 90 * 24 * 60 * 60 * 1000; // 90 days
    this.minKeyLength = 20;
    this.maxKeyLength = 200;

    // Authentication state
    this.authTokens = new Map();
    this.tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Initialize the security service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await this.initializeMasterKey();
      await this.checkKeyRotation();
      this.startKeyRotationTimer();
      this.initialized = true;
    } catch (error) {
      console.error('[SecurityService] Initialization failed:', error);
      throw new Error('Failed to initialize security service');
    }
  }

  /**
   * Initialize or retrieve master encryption key
   */
  async initializeMasterKey() {
    try {
      let masterKeyData = localStorage.getItem(this.masterKeyName);

      if (masterKeyData) {
        const { key, created, version } = JSON.parse(masterKeyData);

        // Check if master key needs rotation
        const age = Date.now() - created;
        if (age > this.maxKeyAge) {
          console.warn('[SecurityService] Master key expired, generating new one');
          await this.rotateMasterKey();
          return;
        }

        this.masterKey = await crypto.subtle.importKey(
          'raw',
          this.base64ToArrayBuffer(key),
          'AES-GCM',
          false,
          ['encrypt', 'decrypt']
        );
        this.masterKeyVersion = version;
      } else {
        // Generate new master key
        await this.generateMasterKey();
      }
    } catch (error) {
      console.error('[SecurityService] Failed to initialize master key:', error);
      // Clear corrupted data and regenerate
      this.clearAllSecurityData();
      await this.generateMasterKey();
    }
  }

  /**
   * Generate a new master encryption key
   */
  async generateMasterKey() {
    this.masterKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    this.masterKeyVersion = Date.now().toString();

    // Store master key with metadata
    const exportedKey = await crypto.subtle.exportKey('raw', this.masterKey);
    const keyData = {
      key: this.arrayBufferToBase64(exportedKey),
      created: Date.now(),
      version: this.masterKeyVersion
    };

    localStorage.setItem(this.masterKeyName, JSON.stringify(keyData));
  }

  /**
   * Check if key rotation is needed and perform rotation
   */
  async checkKeyRotation() {
    const metadata = this.getKeyMetadata();
    if (!metadata) return;

    const age = Date.now() - metadata.created;
    if (age > this.keyRotationInterval) {
      console.log('[SecurityService] Rotating encryption keys');
      await this.rotateKeys();
    }
  }

  /**
   * Rotate encryption keys for enhanced security
   */
  async rotateKeys() {
    try {
      const currentKey = await this.getDecryptedKey();
      if (currentKey) {
        // Generate new master key
        await this.generateMasterKey();

        // Re-encrypt the API key with the new master key
        await this.storeEncryptedKey(currentKey);

        // Update metadata
        this.updateKeyMetadata({
          rotated: Date.now(),
          version: this.masterKeyVersion
        });
      }
    } catch (error) {
      console.error('[SecurityService] Key rotation failed:', error);
      throw new Error('Failed to rotate encryption keys');
    }
  }

  /**
   * Rotate master key (more aggressive rotation)
   */
  async rotateMasterKey() {
    const currentKey = await this.getDecryptedKey();
    if (currentKey) {
      await this.generateMasterKey();
      await this.storeEncryptedKey(currentKey);
    }
  }

  /**
   * Store API key encrypted with current master key
   */
  async storeEncryptedKey(apiKey) {
    if (!this.masterKey) {
      await this.initialize();
    }

    const validation = this.validateApiKey(apiKey);
    if (!validation.valid) {
      throw new Error(`Invalid API key: ${validation.reason}`);
    }

    try {
      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt the API key
      const encodedKey = new TextEncoder().encode(apiKey);
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.masterKey,
        encodedKey
      );

      // Store encrypted key, salt, and IV
      const encryptedData = {
        encrypted: this.arrayBufferToBase64(encrypted),
        salt: this.arrayBufferToBase64(salt),
        iv: this.arrayBufferToBase64(iv),
        version: this.masterKeyVersion
      };

      localStorage.setItem(this.keyName, JSON.stringify(encryptedData));

      // Update metadata
      this.updateKeyMetadata({
        created: Date.now(),
        lastUpdated: Date.now(),
        version: this.masterKeyVersion
      });

      // Clear any auth tokens that might be cached
      this.authTokens.clear();

    } catch (error) {
      console.error('[SecurityService] Failed to encrypt API key:', error);
      throw new Error('Failed to securely store API key');
    }
  }

  /**
   * Retrieve and decrypt API key
   */
  async getDecryptedKey() {
    if (!this.masterKey) {
      await this.initialize();
    }

    try {
      const encryptedDataStr = localStorage.getItem(this.keyName);
      if (!encryptedDataStr) {
        return null;
      }

      const encryptedData = JSON.parse(encryptedDataStr);

      // Check if we need to migrate from old format
      if (!encryptedData.version) {
        console.log('[SecurityService] Migrating from legacy encryption format');
        return await this.migrateLegacyKey(encryptedData);
      }

      // Verify key version matches master key
      if (encryptedData.version !== this.masterKeyVersion) {
        console.warn('[SecurityService] Key version mismatch, attempting re-encryption');
        // This might happen during key rotation, try to recover
        return null;
      }

      // Decrypt the API key
      const encrypted = this.base64ToArrayBuffer(encryptedData.encrypted);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.masterKey,
        encrypted
      );

      return new TextDecoder().decode(decrypted);

    } catch (error) {
      console.error('[SecurityService] Failed to decrypt API key:', error);
      // Clear corrupted data
      this.clearStoredKey();
      return null;
    }
  }

  /**
   * Migrate from legacy encryption format (without version)
   */
  async migrateLegacyKey(legacyData) {
    try {
      // Try to decrypt with current master key
      const encrypted = this.base64ToArrayBuffer(legacyData.encrypted);
      const salt = this.base64ToArrayBuffer(legacyData.salt);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: salt // Legacy format used salt as IV
        },
        this.masterKey,
        encrypted
      );

      const apiKey = new TextDecoder().decode(decrypted);

      // Re-store with new format
      await this.storeEncryptedKey(apiKey);
      return apiKey;

    } catch (error) {
      console.error('[SecurityService] Legacy key migration failed:', error);
      return null;
    }
  }

  /**
   * Validate API key format and security requirements
   */
  validateApiKey(key) {
    if (!key || typeof key !== 'string') {
      return { valid: false, reason: 'Key must be a non-empty string' };
    }

    if (key.length < this.minKeyLength) {
      return { valid: false, reason: `Key is too short (minimum ${this.minKeyLength} characters)` };
    }

    if (key.length > this.maxKeyLength) {
      return { valid: false, reason: `Key is too long (maximum ${this.maxKeyLength} characters)` };
    }

    // Check for common insecure patterns
    if (key.includes('test') || key.includes('example') || key.includes('12345') ||
        key.includes('demo') || key.includes('sample')) {
      return { valid: false, reason: 'Key appears to be a test/example/demo key' };
    }

    // Basic format validation (adjust based on your API key format)
    const keyPattern = /^[A-Za-z0-9\-_\.]+$/;
    if (!keyPattern.test(key)) {
      return { valid: false, reason: 'Key contains invalid characters' };
    }

    // Check for repeated characters (weak keys)
    if (/(.)\1{10,}/.test(key)) {
      return { valid: false, reason: 'Key contains too many repeated characters' };
    }

    return { valid: true };
  }

  /**
   * Generate authentication token for secure API access
   */
  async generateAuthToken(scope = 'api') {
    const apiKey = await this.getDecryptedKey();
    if (!apiKey) {
      throw new Error('No API key configured');
    }

    const tokenId = crypto.randomUUID();
    const expiresAt = Date.now() + this.tokenExpiry;

    // Create token payload
    const payload = {
      id: tokenId,
      scope: scope,
      exp: expiresAt,
      iat: Date.now()
    };

    // Encrypt the payload
    const payloadStr = JSON.stringify(payload);
    const encryptedPayload = await this.encryptData(payloadStr);

    const token = {
      id: tokenId,
      payload: encryptedPayload,
      expiresAt: expiresAt,
      scope: scope
    };

    this.authTokens.set(tokenId, token);

    // Auto-cleanup expired tokens
    setTimeout(() => {
      this.authTokens.delete(tokenId);
    }, this.tokenExpiry);

    return tokenId;
  }

  /**
   * Validate authentication token
   */
  async validateAuthToken(tokenId) {
    const token = this.authTokens.get(tokenId);
    if (!token) {
      return { valid: false, reason: 'Token not found' };
    }

    if (Date.now() > token.expiresAt) {
      this.authTokens.delete(tokenId);
      return { valid: false, reason: 'Token expired' };
    }

    try {
      const decrypted = await this.decryptData(token.payload);
      const payload = JSON.parse(decrypted);

      return {
        valid: true,
        scope: payload.scope,
        expiresAt: payload.exp
      };
    } catch (error) {
      this.authTokens.delete(tokenId);
      return { valid: false, reason: 'Token corrupted' };
    }
  }

  /**
   * Encrypt arbitrary data using master key
   */
  async encryptData(data) {
    if (!this.masterKey) {
      await this.initialize();
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      this.masterKey,
      encoded
    );

    return JSON.stringify({
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv)
    });
  }

  /**
   * Decrypt arbitrary data using master key
   */
  async decryptData(encryptedDataStr) {
    if (!this.masterKey) {
      await this.initialize();
    }

    const data = JSON.parse(encryptedDataStr);
    const encrypted = this.base64ToArrayBuffer(data.encrypted);
    const iv = this.base64ToArrayBuffer(data.iv);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      this.masterKey,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Check if API key is configured
   */
  async isKeyConfigured() {
    const key = await this.getDecryptedKey();
    return key !== null;
  }

  /**
   * Get key metadata
   */
  getKeyMetadata() {
    try {
      const metadataStr = localStorage.getItem(this.metadataName);
      return metadataStr ? JSON.parse(metadataStr) : null;
    } catch (error) {
      console.error('[SecurityService] Failed to read key metadata:', error);
      return null;
    }
  }

  /**
   * Update key metadata
   */
  updateKeyMetadata(updates) {
    const current = this.getKeyMetadata() || {};
    const updated = { ...current, ...updates };
    localStorage.setItem(this.metadataName, JSON.stringify(updated));
  }

  /**
   * Clear stored API key
   */
  clearStoredKey() {
    localStorage.removeItem(this.keyName);
    localStorage.removeItem(this.saltName);
    localStorage.removeItem(this.metadataName);
    this.authTokens.clear();
  }

  /**
   * Clear all security data (for reset scenarios)
   */
  clearAllSecurityData() {
    this.clearStoredKey();
    localStorage.removeItem(this.masterKeyName);
    this.masterKey = null;
    this.masterKeyVersion = null;
    this.authTokens.clear();
    this.initialized = false;
  }

  /**
   * Start automatic key rotation timer
   */
  startKeyRotationTimer() {
    // Check every 24 hours
    setInterval(async () => {
      try {
        await this.checkKeyRotation();
      } catch (error) {
        console.error('[SecurityService] Automatic key rotation failed:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Get security status and health information
   */
  async getSecurityStatus() {
    const metadata = this.getKeyMetadata();
    const keyConfigured = await this.isKeyConfigured();

    return {
      keyConfigured,
      masterKeyExists: !!this.masterKey,
      encryptionEnabled: this.initialized,
      secureStorage: typeof crypto !== 'undefined' && crypto.subtle,
      keyMetadata: metadata,
      activeTokens: this.authTokens.size,
      lastRotation: metadata?.rotated || null,
      nextRotation: metadata ? metadata.created + this.keyRotationInterval : null,
      keyAge: metadata ? Date.now() - metadata.created : null
    };
  }

  /**
   * Utility: ArrayBuffer to base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Export security configuration (for backup/debugging)
   */
  async exportSecurityConfig() {
    const status = await this.getSecurityStatus();
    const metadata = this.getKeyMetadata();

    return {
      status,
      metadata,
      masterKeyVersion: this.masterKeyVersion,
      keyRotationInterval: this.keyRotationInterval,
      maxKeyAge: this.maxKeyAge
    };
  }
}

// Singleton instance
export const securityService = new SecurityService();</content>
<parameter name="filePath">src/lib/services/SecurityService.js