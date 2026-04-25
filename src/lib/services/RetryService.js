/**
 * Security Service - Handles secure API key management with encryption
 * Uses Web Crypto API for client-side encryption
 */
export class SecurityService {
  constructor() {
    this.keyName = 'muapi_key_encrypted';
    this.saltName = 'muapi_key_salt';
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Generate or retrieve master key for encryption
    this.masterKey = await this.getMasterKey();
    this.initialized = true;
  }

  /**
   * Generate or retrieve master key for encryption
   */
  async getMasterKey() {
    try {
      // Try to get existing key
      let keyData = localStorage.getItem('muapi_master_key');
      if (keyData) {
        const key = await crypto.subtle.importKey(
          'raw',
          this.base64ToArrayBuffer(keyData),
          'AES-GCM',
          false,
          ['encrypt', 'decrypt']
        );
        return key;
      }

      // Generate new master key
      const key = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      // Store the key
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      const keyString = this.arrayBufferToBase64(exportedKey);
      localStorage.setItem('muapi_master_key', keyString);

      return key;
    } catch (error) {
      console.error('[SecurityService] Failed to initialize master key:', error);
      throw new Error('Failed to initialize encryption');
    }
  }

  /**
   * Store API key encrypted
   */
  async storeEncryptedKey(apiKey) {
    if (!this.masterKey) {
      await this.initialize();
    }

    try {
      // Generate random salt
      const salt = crypto.getRandomValues(new Uint8Array(16));

      // Encrypt the API key
      const encodedKey = new TextEncoder().encode(apiKey);
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: salt
        },
        this.masterKey,
        encodedKey
      );

      // Store encrypted key and salt
      const encryptedBase64 = this.arrayBufferToBase64(encrypted);
      const saltBase64 = this.arrayBufferToBase64(salt);

      localStorage.setItem(this.keyName, encryptedBase64);
      localStorage.setItem(this.saltName, saltBase64);

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
      const encryptedBase64 = localStorage.getItem(this.keyName);
      const saltBase64 = localStorage.getItem(this.saltName);

      if (!encryptedBase64 || !saltBase64) {
        return null;
      }

      // Decrypt the API key
      const encrypted = this.base64ToArrayBuffer(encryptedBase64);
      const salt = this.base64ToArrayBuffer(saltBase64);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: salt
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
   * Validate API key format and security
   */
  validateApiKey(key) {
    if (!key || typeof key !== 'string') {
      return { valid: false, reason: 'Key must be a non-empty string' };
    }

    if (key.length < 20) {
      return { valid: false, reason: 'Key is too short' };
    }

    if (key.length > 200) {
      return { valid: false, reason: 'Key is too long' };
    }

    // Check for common insecure patterns
    if (key.includes('test') || key.includes('example') || key.includes('12345')) {
      return { valid: false, reason: 'Key appears to be a test/example key' };
    }

    // Basic format validation (adjust based on your API key format)
    const keyPattern = /^[A-Za-z0-9\-_\.]+$/;
    if (!keyPattern.test(key)) {
      return { valid: false, reason: 'Key contains invalid characters' };
    }

    return { valid: true };
  }

  /**
   * Check if API key is configured
   */
  async isKeyConfigured() {
    const key = await this.getDecryptedKey();
    return key !== null;
  }

  /**
   * Clear stored API key
   */
  clearStoredKey() {
    localStorage.removeItem(this.keyName);
    localStorage.removeItem(this.saltName);
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
   * Get security status
   */
  async getSecurityStatus() {
    const keyConfigured = await this.isKeyConfigured();
    const masterKeyExists = !!localStorage.getItem('muapi_master_key');

    return {
      keyConfigured,
      masterKeyExists,
      encryptionEnabled: this.initialized,
      secureStorage: typeof crypto !== 'undefined' && crypto.subtle
    };
  }
}</content>
<parameter name="filePath">src/lib/services/SecurityService.js