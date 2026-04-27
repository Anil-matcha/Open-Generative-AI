import { securityService } from './services/SecurityService.js';

/**
 * API Key Manager - Wrapper around SecurityService
 *
 * Provides a simplified interface for API key management
 * using the secure SecurityService for storage.
 */

// Hash the key for quick validation without exposing it
async function hashKey(key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class ApiKeyManager {
    constructor() {
        this._cachedKey = null;
        this._cachedHash = null;
        this._listeners = new Set();
    }

    /**
     * Set the API key using SecurityService
     * @param {string} key - The API key
     */
    async setKey(key) {
        if (!key || typeof key !== 'string') {
            throw new Error('Invalid API key');
        }

        const trimmedKey = key.trim();
        if (trimmedKey.length < 10) {
            throw new Error('API key too short');
        }

        // Store using SecurityService (includes validation)
        await securityService.storeEncryptedKey(trimmedKey);

        this._cachedKey = trimmedKey;
        this._cachedHash = await hashKey(trimmedKey);

        this._notifyListeners();
    }

    /**
     * Get the API key from SecurityService
     * @returns {Promise<string|null>}
     */
    async getKey() {
        if (this._cachedKey) {
            return this._cachedKey;
        }

        // Get from SecurityService
        this._cachedKey = await securityService.getDecryptedKey();
        if (this._cachedKey) {
            this._cachedHash = await hashKey(this._cachedKey);
        }

        return this._cachedKey || null;
    }


    /**
     * Check if API key exists (sync, fast)
     */
    hasKey() {
        if (this._cachedKey) return true;
        
        return !!(
            sessionStorage.getItem(API_KEY_STORAGE) ||
            localStorage.getItem(API_KEY_STORAGE)
        );
    }

    /**
     * Validate a key against stored hash
     */
    async validateKey(key) {
        const hash = await hashKey(key);
        const storedHash = this._getStoredHash();
        return hash === storedHash;
    }

    _getStoredHash() {
        return sessionStorage.getItem(API_KEY_HASH_STORAGE) ||
               localStorage.getItem(API_KEY_HASH_STORAGE);
    }

    /**
     * Clear the API key
     */
    clearKey() {
        this._cachedKey = null;
        this._cachedHash = null;
        sessionStorage.removeItem(API_KEY_STORAGE);
        sessionStorage.removeItem(API_KEY_HASH_STORAGE);
        localStorage.removeItem(API_KEY_STORAGE);
        localStorage.removeItem(API_KEY_HASH_STORAGE);
        this._notifyListeners();
    }

    /**
     * Add a listener for key changes
     */
    addListener(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    _notifyListeners() {
        for (const callback of this._listeners) {
            try {
                callback(this.hasKey());
            } catch (e) {
                console.error('[ApiKeyManager] Listener error:', e);
            }
        }
    }

    /**
     * Migrate old localStorage key to new format
     */
    migrateFromLegacy() {
        const legacyKey = localStorage.getItem('muapi_key');
        if (legacyKey && !localStorage.getItem(API_KEY_STORAGE)) {
            // Clear legacy key first
            localStorage.removeItem('muapi_key');
            // Set in new format
            this.setKey(legacyKey, true).catch(console.error);
            return true;
        }
        return false;
    }
}

export const apiKeyManager = new ApiKeyManager();

// Auto-migrate on load
apiKeyManager.migrateFromLegacy();
