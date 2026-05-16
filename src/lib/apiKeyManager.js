import { securityService } from './services/SecurityService.js';

/**
 * API Key Manager - Wrapper around SecurityService
 *
 * Supports multiple named API keys (openai, muapi, videodb, etc.)
 * using the secure SecurityService for storage.
 */

const API_KEY_PREFIX = 'openhiggsfield_api_key_';
const API_KEY_HASH_PREFIX = 'openhiggsfield_api_key_hash_';

async function hashKey(key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function storageKey(name) {
    return `${API_KEY_PREFIX}${name}`;
}

function hashStorageKey(name) {
    return `${API_KEY_HASH_PREFIX}${name}`;
}

export class ApiKeyManager {
    constructor() {
        this._cachedKeys = {};
        this._cachedHashes = {};
        this._listeners = new Set();
    }

    /**
     * Set an API key for a specific service
     * @param {string} key - The API key
     * @param {string} name - Service name (e.g. 'openai', 'muapi', 'videodb')
     */
    async setKey(key, name = 'default') {
        if (!key || typeof key !== 'string') {
            throw new Error('Invalid API key');
        }

        const trimmedKey = key.trim();
        if (trimmedKey.length < 10) {
            throw new Error('API key too short');
        }

        await securityService.storeEncryptedKey(trimmedKey, storageKey(name));

        this._cachedKeys[name] = trimmedKey;
        this._cachedHashes[name] = await hashKey(trimmedKey);

        this._notifyListeners();
    }

    /**
     * Get an API key for a specific service
     * @param {string} name - Service name
     * @returns {Promise<string|null>}
     */
    async getKey(name = 'default') {
        if (this._cachedKeys[name]) {
            return this._cachedKeys[name];
        }

        const key = await securityService.getDecryptedKey(storageKey(name));
        if (key) {
            this._cachedKeys[name] = key;
            this._cachedHashes[name] = await hashKey(key);
        }

        return key || null;
    }

    /**
     * Check if a specific API key exists
     * @param {string} name - Service name
     */
    hasKey(name = 'default') {
        if (this._cachedKeys[name]) return true;
        return !!(
            sessionStorage.getItem(storageKey(name)) ||
            localStorage.getItem(storageKey(name))
        );
    }

    /**
     * Validate a key against stored hash for a service
     */
    async validateKey(key, name = 'default') {
        const hash = await hashKey(key);
        const storedHash = this._getStoredHash(name);
        return hash === storedHash;
    }

    _getStoredHash(name) {
        return sessionStorage.getItem(hashStorageKey(name)) ||
               localStorage.getItem(hashStorageKey(name));
    }

    /**
     * Clear a specific API key
     * @param {string} name - Service name
     */
    clearKey(name = 'default') {
        delete this._cachedKeys[name];
        delete this._cachedHashes[name];
        sessionStorage.removeItem(storageKey(name));
        sessionStorage.removeItem(hashStorageKey(name));
        localStorage.removeItem(storageKey(name));
        localStorage.removeItem(hashStorageKey(name));
        this._notifyListeners();
    }

    /**
     * Clear all API keys
     */
    clearAllKeys() {
        this._cachedKeys = {};
        this._cachedHashes = {};
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith(API_KEY_PREFIX) || k.startsWith(API_KEY_HASH_PREFIX))) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && (k.startsWith(API_KEY_PREFIX) || k.startsWith(API_KEY_HASH_PREFIX))) {
                sessionKeysToRemove.push(k);
            }
        }
        sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));
        this._notifyListeners();
    }

    /**
     * Get all configured key names
     */
    getConfiguredKeyNames() {
        const names = new Set();
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(API_KEY_PREFIX)) {
                names.add(k.replace(API_KEY_PREFIX, ''));
            }
        }
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith(API_KEY_PREFIX)) {
                names.add(k.replace(API_KEY_PREFIX, ''));
            }
        }
        return Array.from(names);
    }

    addListener(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    _notifyListeners() {
        for (const callback of this._listeners) {
            try {
                callback();
            } catch (e) {
                console.error('[ApiKeyManager] Listener error:', e);
            }
        }
    }

    migrateFromLegacy() {
        const legacyKey = localStorage.getItem('muapi_key');
        if (legacyKey && !localStorage.getItem(storageKey('muapi'))) {
            localStorage.removeItem('muapi_key');
            this.setKey(legacyKey, 'muapi').catch(console.error);
            return true;
        }
        return false;
    }
}

export const apiKeyManager = new ApiKeyManager();

apiKeyManager.migrateFromLegacy();
