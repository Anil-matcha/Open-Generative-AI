import { whiteLabelManager } from './whiteLabelManager.js';

/**
 * Theme Service - Utilities for theme management and application
 */
export class ThemeService {
  constructor() {
    this.currentTheme = this.getStoredTheme() || 'dark';
    this.whiteLabelManager = whiteLabelManager;
  }

  /**
   * Initialize theme system
   */
  async initialize() {
    // Apply stored theme
    this.applyTheme(this.currentTheme);

    // Initialize white labeling
    await this.whiteLabelManager.initialize();

    // Listen for theme changes
    this.setupThemeListeners();

    console.log('[ThemeService] Initialized with theme:', this.currentTheme);
  }

  /**
   * Get stored theme preference
   * @returns {string} Stored theme or null
   */
  getStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (error) {
      return null;
    }
  }

  /**
   * Store theme preference
   * @param {string} theme - Theme to store
   */
  setStoredTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('[ThemeService] Failed to store theme preference:', error);
    }
  }

  /**
   * Apply theme to document
   * @param {string} theme - Theme to apply ('light', 'dark', 'auto')
   */
  applyTheme(theme) {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-auto');

    // Add new theme class
    root.classList.add(`theme-${theme}`);

    // Set CSS custom properties based on theme
    if (theme === 'auto') {
      this.applyAutoTheme();
    } else {
      this.applyExplicitTheme(theme);
    }

    this.currentTheme = theme;
    this.setStoredTheme(theme);

    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme }
    }));

    console.log('[ThemeService] Applied theme:', theme);
  }

  /**
   * Apply explicit theme (light or dark)
   * @param {string} theme - Theme to apply
   */
  applyExplicitTheme(theme) {
    const root = document.documentElement;
    const isDark = theme === 'dark';

    // Override CSS variables for explicit theme
    root.style.setProperty('--bg-app', isDark ? '#050505' : '#ffffff');
    root.style.setProperty('--bg-panel', isDark ? '#0a0a0a' : '#f8f9fa');
    root.style.setProperty('--bg-card', isDark ? '#141414' : '#ffffff');
    root.style.setProperty('--text-primary', isDark ? '#ffffff' : '#1a1a1a');
    root.style.setProperty('--text-secondary', isDark ? '#a1a1aa' : '#6b7280');
    root.style.setProperty('--text-muted', isDark ? '#52525b' : '#9ca3af');
    root.style.setProperty('--border-color', isDark ? '#27272a' : '#e5e7eb');
  }

  /**
   * Apply auto theme based on system preference
   */
  applyAutoTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyExplicitTheme(prefersDark ? 'dark' : 'light');

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (this.currentTheme === 'auto') {
        this.applyExplicitTheme(e.matches ? 'dark' : 'light');
      }
    };

    // Remove existing listener if any
    if (this.systemThemeListener) {
      mediaQuery.removeEventListener('change', this.systemThemeListener);
    }

    this.systemThemeListener = handleChange;
    mediaQuery.addEventListener('change', handleChange);
  }

  /**
   * Setup theme-related event listeners
   */
  setupThemeListeners() {
    // Listen for white label changes that might affect theming
    window.addEventListener('wl-config-changed', () => {
      // Re-apply current theme to ensure white label colors are respected
      this.applyTheme(this.currentTheme);
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }

  /**
   * Set theme to auto (follow system preference)
   */
  setAutoTheme() {
    this.applyTheme('auto');
  }

  /**
   * Get current theme
   * @returns {string} Current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Check if current theme is dark
   * @returns {boolean} Whether current theme is dark
   */
  isDarkTheme() {
    if (this.currentTheme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return this.currentTheme === 'dark';
  }

  /**
   * Get available themes
   * @returns {Array} Array of available theme options
   */
  getAvailableThemes() {
    return [
      { id: 'light', name: 'Light', icon: '☀️' },
      { id: 'dark', name: 'Dark', icon: '🌙' },
      { id: 'auto', name: 'Auto', icon: '🖥️' }
    ];
  }

  /**
   * Apply white label overrides to current theme
   */
  applyWhiteLabelOverrides() {
    const wlColors = this.whiteLabelManager.getColors();
    const root = document.documentElement;

    // Apply white label color overrides
    Object.entries(wlColors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }

  /**
   * Reset theme to defaults (remove all customizations)
   */
  resetToDefaults() {
    const root = document.documentElement;

    // Remove theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-auto');

    // Reset CSS variables to original values
    root.style = '';

    // Clear stored theme
    try {
      localStorage.removeItem('theme');
    } catch (error) {
      // Ignore
    }

    // Reset to dark theme (default)
    this.currentTheme = 'dark';
    root.classList.add('theme-dark');

    console.log('[ThemeService] Reset to defaults');
  }

  /**
   * Export current theme configuration
   * @returns {Object} Theme configuration object
   */
  exportThemeConfig() {
    return {
      currentTheme: this.currentTheme,
      isDark: this.isDarkTheme(),
      whiteLabelActive: this.whiteLabelManager.isWhiteLabelActive(),
      whiteLabelConfig: this.whiteLabelManager.getCurrentWhiteLabel(),
      availableThemes: this.getAvailableThemes(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import theme configuration
   * @param {Object} config - Theme configuration to import
   */
  importThemeConfig(config) {
    if (config.currentTheme && this.getAvailableThemes().find(t => t.id === config.currentTheme)) {
      this.applyTheme(config.currentTheme);
    }
  }

  /**
   * Get theme-aware colors for UI elements
   * @param {string} element - Element name (button, input, etc.)
   * @returns {Object} Color configuration for the element
   */
  getElementColors(element) {
    const isDark = this.isDarkTheme();

    const colorSchemes = {
      button: {
        primary: {
          background: isDark ? '#d9ff00' : '#d9ff00',
          text: '#000000',
          hover: isDark ? '#c4e600' : '#c4e600'
        },
        secondary: {
          background: isDark ? '#0a0a0a' : '#f8f9fa',
          text: isDark ? '#ffffff' : '#1a1a1a',
          border: isDark ? '#27272a' : '#e5e7eb',
          hover: isDark ? '#141414' : '#ffffff'
        }
      },
      input: {
        background: isDark ? '#0a0a0a' : '#ffffff',
        text: isDark ? '#ffffff' : '#1a1a1a',
        border: isDark ? '#27272a' : '#e5e7eb',
        focus: '#d9ff00'
      },
      card: {
        background: isDark ? '#141414' : '#ffffff',
        border: isDark ? '#27272a' : '#e5e7eb'
      }
    };

    return colorSchemes[element] || {};
  }
}

// Export singleton instance
export const themeService = new ThemeService();