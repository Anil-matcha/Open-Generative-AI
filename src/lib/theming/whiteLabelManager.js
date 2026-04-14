import { supabase } from '../supabase.js';

/**
 * White Label Manager - Handles multi-tenant theming and branding
 */
export class WhiteLabelManager {
  constructor() {
    this.currentWhiteLabel = null;
    this.isInitialized = false;
  }

  /**
   * Initialize white label system
   * @param {string} domain - Domain to load white label for
   */
  async initialize(domain = null) {
    try {
      // Determine domain
      const currentDomain = domain || window.location.hostname;

      // Load white label configuration
      await this.loadWhiteLabelConfig(currentDomain);

      // Apply theming
      this.applyTheming();

      this.isInitialized = true;
      console.log('[WhiteLabelManager] Initialized for domain:', currentDomain);
    } catch (error) {
      console.error('[WhiteLabelManager] Failed to initialize:', error);
      // Continue with default theming
    }
  }

  /**
   * Load white label configuration from Supabase
   * @param {string} domain - Domain to load config for
   */
  async loadWhiteLabelConfig(domain) {
    try {
      const { data, error } = await supabase
        .from('white_labels')
        .select('*')
        .eq('domain', domain)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      this.currentWhiteLabel = data || null;

      if (this.currentWhiteLabel) {
        console.log('[WhiteLabelManager] Loaded white label config:', this.currentWhiteLabel.name);
      } else {
        console.log('[WhiteLabelManager] No white label config found, using defaults');
      }
    } catch (error) {
      console.error('[WhiteLabelManager] Failed to load white label config:', error);
      this.currentWhiteLabel = null;
    }
  }

  /**
   * Apply theming based on current white label configuration
   */
  applyTheming() {
    const root = document.documentElement;
    const branding = this.currentWhiteLabel?.branding || {};

    // Apply CSS custom properties
    if (branding.colors) {
      Object.entries(branding.colors).forEach(([key, value]) => {
        root.style.setProperty(`--wl-${key}`, value);
      });
    }

    // Apply brand name and logo
    this.applyBranding();

    // Apply custom styles if provided
    if (branding.customCSS) {
      this.applyCustomCSS(branding.customCSS);
    }
  }

  /**
   * Apply branding elements (logo, name, etc.)
   */
  applyBranding() {
    const branding = this.currentWhiteLabel?.branding || {};

    // Update page title
    if (branding.name) {
      document.title = `${branding.name} - Video Editor`;
    }

    // Update favicon if provided
    if (branding.favicon) {
      this.updateFavicon(branding.favicon);
    }

    // Update logo in header if exists
    const logoElements = document.querySelectorAll('[data-wl-logo]');
    logoElements.forEach(element => {
      if (branding.logo) {
        element.src = branding.logo;
        element.alt = branding.name || 'Logo';
      }
    });

    // Update brand name elements
    const nameElements = document.querySelectorAll('[data-wl-name]');
    nameElements.forEach(element => {
      if (branding.name) {
        element.textContent = branding.name;
      }
    });
  }

  /**
   * Update favicon
   * @param {string} faviconUrl - URL of the favicon
   */
  updateFavicon(faviconUrl) {
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = faviconUrl;
  }

  /**
   * Apply custom CSS
   * @param {string} customCSS - Custom CSS string
   */
  applyCustomCSS(customCSS) {
    let styleElement = document.getElementById('wl-custom-css');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'wl-custom-css';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = customCSS;
  }

  /**
   * Get current white label configuration
   * @returns {Object|null} White label config or null
   */
  getCurrentWhiteLabel() {
    return this.currentWhiteLabel;
  }

  /**
   * Check if white labeling is active
   * @returns {boolean} Whether white labeling is active
   */
  isWhiteLabelActive() {
    return this.currentWhiteLabel !== null;
  }

  /**
   * Get white label brand name
   * @returns {string} Brand name or default
   */
  getBrandName() {
    return this.currentWhiteLabel?.branding?.name || 'Open Higgsfield AI';
  }

  /**
   * Get white label logo URL
   * @returns {string|null} Logo URL or null
   */
  getLogoUrl() {
    return this.currentWhiteLabel?.branding?.logo || null;
  }

  /**
   * Get white label colors
   * @returns {Object} Color configuration
   */
  getColors() {
    return this.currentWhiteLabel?.branding?.colors || {};
  }

  /**
   * Get white label features
   * @returns {Object} Feature configuration
   */
  getFeatures() {
    return this.currentWhiteLabel?.features || {};
  }

  /**
   * Check if a feature is enabled for this white label
   * @param {string} featureName - Feature name
   * @returns {boolean} Whether the feature is enabled
   */
  isFeatureEnabled(featureName) {
    const features = this.getFeatures();
    return features[featureName] === true;
  }

  /**
   * Get white label settings
   * @returns {Object} Settings configuration
   */
  getSettings() {
    return this.currentWhiteLabel?.settings || {};
  }

  /**
   * Get support link for this white label
   * @returns {string} Support link
   */
  getSupportLink() {
    return this.currentWhiteLabel?.settings?.supportLink ||
           'https://github.com/deangilmoreremix/remix-projects/issues';
  }

  /**
   * Get privacy policy link
   * @returns {string} Privacy policy link
   */
  getPrivacyPolicyLink() {
    return this.currentWhiteLabel?.settings?.privacyPolicyLink ||
           'https://github.com/deangilmoreremix/remix-projects/blob/develop/PRIVACY.md';
  }

  /**
   * Get terms of service link
   * @returns {string} Terms link
   */
  getTermsOfServiceLink() {
    return this.currentWhiteLabel?.settings?.termsOfServiceLink ||
           'https://github.com/deangilmoreremix/remix-projects/blob/develop/TERMS.md';
  }

  /**
   * Reset to default theming
   */
  resetToDefaults() {
    const root = document.documentElement;

    // Remove white label CSS variables
    const wlVars = Array.from(root.style);
    wlVars.forEach(varName => {
      if (varName.startsWith('--wl-')) {
        root.style.removeProperty(varName);
      }
    });

    // Remove custom CSS
    const customCSS = document.getElementById('wl-custom-css');
    if (customCSS) {
      customCSS.remove();
    }

    // Reset title
    document.title = 'Open Higgsfield AI - Video Editor';

    // Reset favicon
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.href = '/favicon.ico';
    }

    console.log('[WhiteLabelManager] Reset to defaults');
  }

  /**
   * Refresh white label configuration
   * @param {string} domain - Domain to refresh for (optional)
   */
  async refresh(domain = null) {
    const targetDomain = domain || window.location.hostname;
    await this.loadWhiteLabelConfig(targetDomain);
    this.applyTheming();
    console.log('[WhiteLabelManager] Refreshed white label config');
  }
}

// Export singleton instance
export const whiteLabelManager = new WhiteLabelManager();