/**
 * Centralized API Key Manager for muapi.ai
 * 
 * All parts of the app should use this to get/set the API key
 * to ensure consistency across all clients.
 * 
 * SECURITY: Uses SecurityService for encrypted storage
 */

import { SecurityService } from './services/SecurityService.js';

const MUAPI_KEY_STORAGE = 'muapi_key_encrypted';

// Singleton instance
let securityService = null;

/**
 * Get or create security service instance
 */
async function getSecurityService() {
  if (!securityService) {
    securityService = new SecurityService();
    await securityService.initialize();
  }
  return securityService;
}

const muapiKeyManager = {
  /**
   * Set the API key with encryption
   * @param {string} key - The API key to store
   */
  async setKey(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid API key: must be a non-empty string');
    }
    
    const trimmedKey = key.trim();
    if (trimmedKey.length < 10) {
      throw new Error('Invalid API key: too short (minimum 10 characters)');
    }
    
    if (trimmedKey.length > 200) {
      throw new Error('Invalid API key: too long (maximum 200 characters)');
    }
    
    try {
      const service = await getSecurityService();
      await service.storeEncryptedKey(trimmedKey);
      // Set flag for backward compatibility
      window.__MUAPI_KEY__ = true;
    } catch (error) {
      console.error('[muapiKeyManager] Failed to save API key:', error);
      throw new Error('Failed to save API key securely');
    }
  },

  /**
   * Get the API key with decryption
   * @returns {string|null} The API key or null if not set
   */
  async getKey() {
    try {
      // Check if flagged as set
      if (!window.__MUAPI_KEY__) {
        return null;
      }
      
      const service = await getSecurityService();
      return await service.getDecryptedKey();
    } catch (error) {
      console.error('[muapiKeyManager] Failed to get API key:', error);
      return null;
    }
  },

  /**
   * Check if API key is set
   * @returns {boolean}
   */
  async hasKey() {
    const key = await this.getKey();
    return !!key;
  },

  /**
   * Remove the API key securely
   */
  async removeKey() {
    try {
      const service = await getSecurityService();
      await service.clearEncryptedKey();
      delete window.__MUAPI_KEY__;
    } catch (error) {
      console.error('[muapiKeyManager] Failed to remove API key:', error);
    }
  },

  /**
   * Get the API key for use in request headers
   * @returns {string} The API key
   * @throws {Error} If API key is not set
   */
  async getKeyForHeader() {
    const key = await this.getKey();
    if (!key) {
      throw new Error('API Key missing. Please set it in Settings.');
    }
    return key;
  },

  /**
   * Validate API key format (basic check)
   * @param {string} key - The API key to validate
   * @returns {boolean}
   */
  validateKeyFormat(key) {
    if (!key || typeof key !== 'string') return false;
    const trimmed = key.trim();
    if (trimmed.length < 10) return false;
    if (trimmed.length > 200) return false;
    // Check for suspicious patterns
    if (trimmed.includes(' ') || trimmed.includes('\n') || trimmed.includes('\r')) {
      return false;
    }
    return true;
  },

  /**
   * Migrate from legacy storage locations
   */
  async migrateLegacyKeys() {
    try {
      // Check for openhiggsfield_api_key
      const legacyKey = localStorage.getItem('openhiggsfield_api_key');
      if (legacyKey && !(await this.hasKey())) {
        console.log('[muapiKeyManager] Migrating from openhiggsfield_api_key');
        await this.setKey(legacyKey);
        localStorage.removeItem('openhiggsfield_api_key');
      }
      
      // Check for muapi_user_api_key
      const workflowKey = localStorage.getItem('muapi_user_api_key');
      if (workflowKey && !(await this.hasKey())) {
        console.log('[muapiKeyManager] Migrating from muapi_user_api_key');
        await this.setKey(workflowKey);
        localStorage.removeItem('muapi_user_api_key');
      }
    } catch (error) {
      console.error('[muapiKeyManager] Migration failed:', error);
    }
  }
};

// Auto-migrate on load
muapiKeyManager.migrateLegacyKeys();

export default muapiKeyManager;
export { muapiKeyManager };
