import { i18nService } from './i18nService.js';

/**
 * Translation Loader - Handles loading and caching of translation files
 */
export class TranslationLoader {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
  }

  /**
   * Load translations for a locale
   * @param {string} locale - Locale code
   * @returns {Promise<Object>} Translation object
   */
  async loadLocale(locale) {
    // Check cache first
    if (this.cache.has(locale)) {
      return this.cache.get(locale);
    }

    // Check if already loading
    if (this.loadingPromises.has(locale)) {
      return this.loadingPromises.get(locale);
    }

    // Start loading
    const loadingPromise = this._loadLocaleFile(locale);
    this.loadingPromises.set(locale, loadingPromise);

    try {
      const translations = await loadingPromise;
      this.cache.set(locale, translations);
      return translations;
    } finally {
      this.loadingPromises.delete(locale);
    }
  }

  /**
   * Load locale file from filesystem
   * @param {string} locale - Locale code
   * @returns {Promise<Object>} Translation object
   */
  async _loadLocaleFile(locale) {
    try {
      // Dynamic import of locale file
      const module = await import(`./locales/${locale}.js`);
      return module.default || {};
    } catch (error) {
      console.warn(`[TranslationLoader] Failed to load locale file for ${locale}:`, error);
      return {};
    }
  }

  /**
   * Preload multiple locales
   * @param {Array<string>} locales - Array of locale codes
   * @returns {Promise<Array>} Array of loading promises
   */
  async preloadLocales(locales) {
    const promises = locales.map(locale => this.loadLocale(locale));
    return Promise.allSettled(promises);
  }

  /**
   * Check if locale is cached
   * @param {string} locale - Locale code
   * @returns {boolean} Whether locale is cached
   */
  isCached(locale) {
    return this.cache.has(locale);
  }

  /**
   * Clear cache for specific locale
   * @param {string} locale - Locale code (optional, clears all if not provided)
   */
  clearCache(locale) {
    if (locale) {
      this.cache.delete(locale);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache size
   * @returns {number} Number of cached locales
   */
  getCacheSize() {
    return this.cache.size;
  }

  /**
   * Get available locales by scanning filesystem
   * @returns {Promise<Array<string>>} Array of available locale codes
   */
  async getAvailableLocales() {
    // In a real implementation, you might scan the locales directory
    // For now, return a hardcoded list based on what we know exists
    return ['en', 'es'];
  }

  /**
   * Validate translation object structure
   * @param {Object} translations - Translation object
   * @returns {boolean} Whether structure is valid
   */
  validateTranslations(translations) {
    // Basic validation - check if it's an object
    return translations && typeof translations === 'object';
  }

  /**
   * Merge translation objects (useful for fallbacks)
   * @param {Object} base - Base translations
   * @param {Object} override - Override translations
   * @returns {Object} Merged translations
   */
  mergeTranslations(base, override) {
    return this._deepMerge(base, override);
  }

  /**
   * Deep merge objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  _deepMerge(target, source) {
    const result = { ...target };

    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });

    return result;
  }

  /**
   * Export cache contents (for debugging)
   * @returns {Object} Cache contents
   */
  exportCache() {
    const cache = {};
    for (const [locale, translations] of this.cache.entries()) {
      cache[locale] = translations;
    }
    return cache;
  }

  /**
   * Get loading status
   * @returns {Object} Loading status
   */
  getLoadingStatus() {
    return {
      cacheSize: this.getCacheSize(),
      currentlyLoading: Array.from(this.loadingPromises.keys()),
      cachedLocales: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const translationLoader = new TranslationLoader();