import { i18nService } from '../i18n/i18nService.js';

/**
 * TranslatedText Component - Wrapper for translated text with interpolation
 * @param {string} key - Translation key
 * @param {Object} params - Interpolation parameters
 * @param {string} fallback - Fallback text if translation not found
 * @param {string} tagName - HTML tag name (default: 'span')
 * @param {Object} attributes - Additional HTML attributes
 */
export function TranslatedText(key, params = {}, fallback = '', tagName = 'span', attributes = {}) {
  const element = document.createElement(tagName);

  // Apply attributes
  Object.entries(attributes).forEach(([attr, value]) => {
    if (attr === 'className') {
      element.className = value;
    } else {
      element.setAttribute(attr, value);
    }
  });

  // Set initial text
  element.textContent = i18nService.t(key, params) || fallback || key;

  // Listen for locale changes
  const updateText = () => {
    element.textContent = i18nService.t(key, params) || fallback || key;
  };

  window.addEventListener('locale-changed', updateText);

  // Store cleanup function for potential removal
  element._cleanup = () => {
    window.removeEventListener('locale-changed', updateText);
  };

  return element;
}

/**
 * Create a translated text element with React-like API
 * @param {Object} props - Component props
 * @param {string} props.key - Translation key
 * @param {Object} props.params - Interpolation parameters
 * @param {string} props.fallback - Fallback text
 * @param {string} props.tagName - HTML tag name
 * @param {Object} props.attributes - Additional attributes
 * @param {Array} props.children - Child elements (ignored, for compatibility)
 */
export function createTranslatedText(props) {
  const {
    key,
    params = {},
    fallback = '',
    tagName = 'span',
    attributes = {},
    children,
    ...otherProps
  } = props;

  // Merge other props into attributes
  Object.assign(attributes, otherProps);

  return TranslatedText(key, params, fallback, tagName, attributes);
}

/**
 * Translate function for use in templates
 * @param {string} key - Translation key
 * @param {Object} params - Interpolation parameters
 * @returns {string} Translated text
 */
export function t(key, params = {}) {
  return i18nService.t(key, params);
}

/**
 * Translate and interpolate HTML (be careful with XSS)
 * @param {string} key - Translation key
 * @param {Object} params - Interpolation parameters
 * @returns {string} Translated HTML
 */
export function tHtml(key, params = {}) {
  const translated = i18nService.t(key, params);
  // Note: In a real implementation, you'd want to sanitize HTML
  return translated;
}

/**
 * Get current locale
 * @returns {string} Current locale code
 */
export function getCurrentLocale() {
  return i18nService.getCurrentLocale();
}

/**
 * Check if current locale is RTL
 * @returns {boolean} Whether locale is RTL
 */
export function isRTL() {
  return i18nService.isRTL();
}

/**
 * Format date according to current locale
 * @param {Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date
 */
export function formatDate(date, options = {}) {
  return i18nService.formatDate(date, options);
}

/**
 * Format number according to current locale
 * @param {number} number - Number to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted number
 */
export function formatNumber(number, options = {}) {
  return i18nService.formatNumber(number, options);
}

/**
 * Format currency according to current locale
 * @param {number} amount - Amount
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency
 */
export function formatCurrency(amount, currency = 'USD') {
  return i18nService.formatCurrency(amount, currency);
}