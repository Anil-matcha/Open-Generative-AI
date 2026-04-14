/**
 * Internationalization (i18n) Service - Client-side translation management
 */
export class I18nService {
  constructor() {
    this.currentLocale = this.getStoredLocale() || this.detectBrowserLocale() || 'en';
    this.translations = {};
    this.isLoaded = false;
    this.fallbackLocale = 'en';
  }

  /**
   * Initialize i18n service
   * @param {Object} options - Initialization options
   */
  async initialize(options = {}) {
    this.fallbackLocale = options.fallbackLocale || 'en';
    this.supportedLocales = options.supportedLocales || ['en', 'es', 'fr', 'de'];

    // Load current locale translations
    await this.loadLocale(this.currentLocale);

    // Setup locale change listeners
    this.setupListeners();

    console.log('[I18nService] Initialized with locale:', this.currentLocale);
  }

  /**
   * Get stored locale preference
   * @returns {string|null} Stored locale or null
   */
  getStoredLocale() {
    try {
      return localStorage.getItem('locale');
    } catch (error) {
      return null;
    }
  }

  /**
   * Store locale preference
   * @param {string} locale - Locale to store
   */
  setStoredLocale(locale) {
    try {
      localStorage.setItem('locale', locale);
    } catch (error) {
      console.warn('[I18nService] Failed to store locale preference:', error);
    }
  }

  /**
   * Detect browser locale
   * @returns {string|null} Detected locale or null
   */
  detectBrowserLocale() {
    try {
      const browserLang = navigator.language || navigator.userLanguage;
      if (!browserLang) return null;

      // Extract language code (e.g., 'en-US' -> 'en')
      const langCode = browserLang.split('-')[0].toLowerCase();

      // Check if we support this language
      if (this.supportedLocales && this.supportedLocales.includes(langCode)) {
        return langCode;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Load translations for a locale
   * @param {string} locale - Locale to load
   */
  async loadLocale(locale) {
    try {
      // Try to load locale file
      const module = await import(`../locales/${locale}.js`);
      this.translations = { ...this.translations, ...module.default };

      // Also try to load fallback locale if different
      if (locale !== this.fallbackLocale) {
        try {
          const fallbackModule = await import(`../locales/${this.fallbackLocale}.js`);
          this.translations = { ...fallbackModule.default, ...this.translations };
        } catch (error) {
          // Fallback locale not available, continue
        }
      }

      this.isLoaded = true;
      console.log('[I18nService] Loaded locale:', locale);
    } catch (error) {
      console.warn(`[I18nService] Failed to load locale ${locale}:`, error);

      // Try fallback locale
      if (locale !== this.fallbackLocale) {
        await this.loadLocale(this.fallbackLocale);
      } else {
        // No translations available
        this.translations = {};
        this.isLoaded = true;
      }
    }
  }

  /**
   * Change current locale
   * @param {string} locale - New locale
   */
  async setLocale(locale) {
    if (locale === this.currentLocale) return;

    this.currentLocale = locale;
    this.setStoredLocale(locale);
    this.translations = {};

    await this.loadLocale(locale);

    // Dispatch locale change event
    window.dispatchEvent(new CustomEvent('locale-changed', {
      detail: { locale }
    }));

    console.log('[I18nService] Changed locale to:', locale);
  }

  /**
   * Get current locale
   * @returns {string} Current locale
   */
  getCurrentLocale() {
    return this.currentLocale;
  }

  /**
   * Get supported locales
   * @returns {Array} Array of supported locale codes
   */
  getSupportedLocales() {
    return this.supportedLocales || ['en'];
  }

  /**
   * Get available locales with names
   * @returns {Array} Array of locale objects with names
   */
  getAvailableLocales() {
    const localeNames = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文'
    };

    return this.getSupportedLocales().map(locale => ({
      code: locale,
      name: localeNames[locale] || locale.toUpperCase(),
      nativeName: this.getNativeName(locale)
    }));
  }

  /**
   * Get native name for locale
   * @param {string} locale - Locale code
   * @returns {string} Native name
   */
  getNativeName(locale) {
    const nativeNames = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文'
    };

    return nativeNames[locale] || locale.toUpperCase();
  }

  /**
   * Translate a key
   * @param {string} key - Translation key
   * @param {Object} params - Interpolation parameters
   * @returns {string} Translated string
   */
  t(key, params = {}) {
    if (!this.isLoaded) {
      return key; // Return key if translations not loaded yet
    }

    let translation = this.getTranslation(key);

    // Interpolate parameters
    if (params && Object.keys(params).length > 0) {
      translation = this.interpolate(translation, params);
    }

    return translation;
  }

  /**
   * Get translation for key
   * @param {string} key - Translation key
   * @returns {string} Translation or key if not found
   */
  getTranslation(key) {
    // Support nested keys with dot notation
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      value = value && value[k];
    }

    return value || key;
  }

  /**
   * Interpolate parameters into translation string
   * @param {string} text - Text to interpolate
   * @param {Object} params - Parameters
   * @returns {string} Interpolated text
   */
  interpolate(text, params) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Check if a translation exists
   * @param {string} key - Translation key
   * @returns {boolean} Whether translation exists
   */
  hasTranslation(key) {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      value = value && value[k];
    }

    return value !== undefined;
  }

  /**
   * Setup event listeners
   */
  setupListeners() {
    // Listen for visibility changes to potentially reload translations
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isLoaded) {
        // Page became visible and translations aren't loaded, try again
        this.loadLocale(this.currentLocale);
      }
    });
  }

  /**
   * Format date according to locale
   * @param {Date} date - Date to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted date
   */
  formatDate(date, options = {}) {
    try {
      return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
    } catch (error) {
      // Fallback to default formatting
      return date.toLocaleDateString();
    }
  }

  /**
   * Format number according to locale
   * @param {number} number - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number
   */
  formatNumber(number, options = {}) {
    try {
      return new Intl.NumberFormat(this.currentLocale, options).format(number);
    } catch (error) {
      // Fallback to default formatting
      return number.toString();
    }
  }

  /**
   * Format currency according to locale
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} Formatted currency
   */
  formatCurrency(amount, currency = 'USD') {
    try {
      return new Intl.NumberFormat(this.currentLocale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      // Fallback
      return `${currency} ${amount}`;
    }
  }

  /**
   * Get text direction for current locale
   * @returns {string} 'ltr' or 'rtl'
   */
  getTextDirection() {
    const rtlLocales = ['ar', 'he', 'fa', 'ur', 'yi'];
    return rtlLocales.includes(this.currentLocale) ? 'rtl' : 'ltr';
  }

  /**
   * Check if current locale is RTL
   * @returns {boolean} Whether locale is RTL
   */
  isRTL() {
    return this.getTextDirection() === 'rtl';
  }

  /**
   * Export current translation data
   * @returns {Object} Translation data
   */
  exportTranslations() {
    return {
      locale: this.currentLocale,
      translations: { ...this.translations },
      supportedLocales: this.getSupportedLocales(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Get plural form for current locale
   * @param {number} count - Count for pluralization
   * @param {Array} forms - Array of plural forms [singular, plural, ...]
   * @returns {string} Appropriate plural form
   */
  getPluralForm(count, forms) {
    // Simple pluralization - can be extended for more complex rules
    if (!forms || forms.length === 0) return '';

    if (count === 1) return forms[0];
    return forms[1] || forms[0];
  }

  /**
   * Reset to default locale
   */
  resetToDefault() {
    this.setLocale(this.fallbackLocale);
  }
}

// Export singleton instance
export const i18nService = new I18nService();