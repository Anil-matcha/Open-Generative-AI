/**
 * Feature Flags for Unified Timeline Editor Integration
 * Controls rollout of 14 categories (A-N) to ensure stability
 */
export const FEATURE_FLAGS = {
  // === EXISTING FEATURES ===
  VIDEO_CREATION_PERSONALIZATION: true,
  ADVANCED_IMAGE_EDITING: true,
  VIDEO_RECORDING: true,
  TEMPLATE_SYSTEM: true,
  TEXT_TO_SPEECH: true,
  ENHANCED_MEDIA_LIBRARY: true,

  // === CATEGORY A-N INTEGRATION FLAGS ===

  // A. Runtime/Platform/Setup Integration
  CATEGORY_A_RUNTIME_PLATFORM: true,

  // B. Route/Screen Entry Layer Integration
  CATEGORY_B_ROUTE_ENTRY_LAYER: false,

  // C. Main Editor Surfaces Integration
  CATEGORY_C_MAIN_EDITOR_SURFACES: true,

  // D. Timeline Engine Integration (Core)
  CATEGORY_D_TIMELINE_ENGINE_CORE: true,

  // E. Timeline-Supporting State Layer Integration
  CATEGORY_E_STATE_LAYER: true,

  // F. Toolbar/Editing Controls Integration
  CATEGORY_F_TOOLBAR_CONTROLS: true,

  // G. Media Ingest/Asset Input Integration
  CATEGORY_G_MEDIA_INGEST: true,

  // H. Library/Asset Browsing Layer Integration
  CATEGORY_H_LIBRARY_BROWSING: false,

  // I. Settings/Inspector Layer Integration
  CATEGORY_I_SETTINGS_INSPECTOR: true,

  // J. Modals/Editing Workflows Integration
  CATEGORY_J_MODALS_WORKFLOWS: true,

  // K. Image/Creative Editing Support Integration
  CATEGORY_K_IMAGE_EDITING: true,

  // L. Thumbnail/Canvas/Graphics Subsystem Integration
  CATEGORY_L_THUMBNAIL_GRAPHICS: false,

  // M. Form/Base/HOC Infrastructure Integration
  CATEGORY_M_FORM_INFRASTRUCTURE: true,

  // N. Publisher/Distribution Layer Integration
  CATEGORY_N_PUBLISHER_DISTRIBUTION: false,

  // === LEGACY FLAGS (for backward compatibility) ===
  LANDING_PAGE_BUILDER: false,
  THUMBNAIL_CREATIVE_ASSETS: false,
  VIDEO_ANALYTICS: false,
  SOCIAL_PUBLISHING: false
};

/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature flag
 * @returns {boolean} - Whether the feature is enabled
 */
export function isFeatureEnabled(featureName) {
  return FEATURE_FLAGS[featureName] === true;
}

/**
 * Enable a feature flag
 * @param {string} featureName - Name of the feature flag
 */
export function enableFeature(featureName) {
  if (FEATURE_FLAGS.hasOwnProperty(featureName)) {
    FEATURE_FLAGS[featureName] = true;
    console.log(`Feature ${featureName} enabled`);
  }
}

/**
 * Disable a feature flag
 * @param {string} featureName - Name of the feature flag
 */
export function disableFeature(featureName) {
  if (FEATURE_FLAGS.hasOwnProperty(featureName)) {
    FEATURE_FLAGS[featureName] = false;
    console.log(`Feature ${featureName} disabled`);
  }
}

/**
 * Get all feature flags status
 * @returns {object} - Object with all feature flags and their status
 */
export function getAllFeatureFlags() {
  return { ...FEATURE_FLAGS };
}