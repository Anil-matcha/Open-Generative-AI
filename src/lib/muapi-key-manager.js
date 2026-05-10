/**
 * Centralized API Key Manager for muapi.ai
 * 
 * All parts of the app should use this to get/set the API key
 * to ensure consistency across all clients.
 * 
 * Storage location: localStorage['muapi_key']
 * Also supports: window.__MUAPI_KEY__ (for injection)
 */

const MUAPI_KEY_STORAGE = 'muapi_key';

const muapiKeyManager = {
  /**
   * Set the API key
   * @param {string} key - The API key to store
   */
  setKey(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid API key: must be a non-empty string');
    }
    
    const trimmedKey = key.trim();
    if (trimmedKey.length < 10) {
      throw new Error('Invalid API key: too short (minimum 10 characters)');
    }
    
    try {
      localStorage.setItem(MUAPI_KEY_STORAGE, trimmedKey);
      // Also set for backward compatibility
      window.__MUAPI_KEY__ = trimmedKey;
    } catch (error) {
      console.error('[muapiKeyManager] Failed to save API key:', error);
      throw new Error('Failed to save API key to localStorage');
    }
  },

  /**
   * Get the API key
   * @returns {string|null} The API key or null if not set
   */
  getKey() {
    try {
      // Check window.__MUAPI_KEY__ first (for injection)
      if (window.__MUAPI_KEY__) {
        return window.__MUAPI_KEY__;
      }
      
      // Then check localStorage
      const key = localStorage.getItem(MUAPI_KEY_STORAGE);
      if (key) {
        return key;
      }
      
      return null;
    } catch (error) {
      console.error('[muapiKeyManager] Failed to get API key:', error);
      return null;
    }
  },

  /**
   * Check if API key is set
   * @returns {boolean}
   */
  hasKey() {
    return !!this.getKey();
  },

  /**
   * Remove the API key
   */
  removeKey() {
    try {
      localStorage.removeItem(MUAPI_KEY_STORAGE);
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
  getKeyForHeader() {
    const key = this.getKey();
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
    if (trimmed.length > 200) return false; // Reasonable max length
    return true;
  },

  /**
   * Migrate from legacy storage locations
   */
  migrateLegacyKeys() {
    try {
      // Check for openhiggsfield_api_key
      const legacyKey = localStorage.getItem('openhiggsfield_api_key');
      if (legacyKey && !this.getKey()) {
        console.log('[muapiKeyManager] Migrating from openhiggsfield_api_key');
        this.setKey(legacyKey);
        localStorage.removeItem('openhiggsfield_api_key');
      }
      
      // Check for muapi_user_api_key
      const workflowKey = localStorage.getItem('muapi_user_api_key');
      if (workflowKey && !this.getKey()) {
        console.log('[muapiKeyManager] Migrating from muapi_user_api_key');
        this.setKey(workflowKey);
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
