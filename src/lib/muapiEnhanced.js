/**
 * MuAPI Advanced Integration Bridge
 * Connects the new advanced MuAPI system to the existing Open-Higgsfield-AI application
 * Provides seamless integration while maintaining backward compatibility
 */

import MuAPIIntegrationManager from './muapi/MuAPIIntegrationManager.js';
import { MuapiClient } from './muapi.js';
import { WAN_AI_EFFECTS } from './muapiConfig.js';

// Global instance for backward compatibility
let muapiClient = null;
let advancedIntegrationManager = null;

/**
 * Initialize the enhanced MuAPI integration
 */
export async function initializeEnhancedMuAPI(config = {}) {
  try {
    // Initialize the advanced integration manager
    advancedIntegrationManager = await MuAPIIntegrationManager.create({
      apiKey: config.apiKey || localStorage.getItem('muapi_key'),
      enableAIEnhancement: config.enableAIEnhancement !== false,
      enableBatchProcessing: config.enableBatchProcessing !== false,
      enableAdvancedEffects: config.enableAdvancedEffects !== false,
      ...config
    });

    // Keep the existing client for backward compatibility
    muapiClient = new MuapiClient();

    console.log('[Enhanced MuAPI] Initialized successfully');
    return true;
  } catch (error) {
    console.warn('[Enhanced MuAPI] Initialization failed, falling back to basic client:', error.message);

    // Fallback to basic client
    muapiClient = new MuapiClient();
    return false;
  }
}

/**
 * Enhanced media processing with AI capabilities
 */
export async function processMediaEnhanced(mediaData, options = {}) {
  if (advancedIntegrationManager) {
    try {
      return await advancedIntegrationManager.processMedia(mediaData, {
        ...options,
        // Map legacy options to new system
        skipAIEnhancement: options.skipAIEnhancement,
        generateThumbnails: options.generateThumbnails,
        thumbnailSizes: options.thumbnailSizes
      });
    } catch (error) {
      console.warn('[Enhanced MuAPI] Advanced processing failed, using fallback:', error.message);
    }
  }

  // Fallback to basic processing
  return processMediaBasic(mediaData, options);
}

/**
 * Basic media processing (existing functionality)
 */
export async function processMediaBasic(mediaData, options = {}) {
  // Placeholder for existing processing logic
  // This would integrate with the current media processing pipeline
  return {
    success: true,
    data: mediaData,
    processed: false,
    fallback: true
  };
}

/**
 * Enhanced batch processing
 */
export async function processBatchEnhanced(mediaFiles, options = {}) {
  if (advancedIntegrationManager) {
    try {
      const batchId = await advancedIntegrationManager.processBatch(mediaFiles, {
        ...options,
        progressCallback: options.onProgress,
        completionCallback: options.onComplete,
        errorCallback: options.onError
      });

      return {
        batchId,
        getStatus: () => advancedIntegrationManager.getBatchStatus(batchId),
        getResults: () => advancedIntegrationManager.getBatchResults(batchId),
        cancel: () => advancedIntegrationManager.cancelBatch(batchId)
      };
    } catch (error) {
      console.warn('[Enhanced MuAPI] Batch processing failed:', error.message);
    }
  }

  // Fallback to individual processing
  const results = [];
  for (const file of mediaFiles) {
    results.push(await processMediaEnhanced(file, options));
  }

  return {
    batchId: null,
    results,
    completed: true
  };
}

/**
 * Enhanced effects and post-processing
 */
export async function applyEffectsEnhanced(mediaData, effects = []) {
  if (advancedIntegrationManager) {
    try {
      return await advancedIntegrationManager.applyEffects(mediaData, effects);
    } catch (error) {
      console.warn('[Enhanced MuAPI] Effects processing failed:', error.message);
    }
  }

  // Fallback - return unchanged media
  return mediaData;
}

/**
 * Enhanced image generation with AI capabilities
 */
export async function generateImageEnhanced(prompt, options = {}) {
  if (advancedIntegrationManager) {
    try {
      const result = await advancedIntegrationManager.generateImage(prompt, {
        model: options.model || 'flux-dev',
        width: options.width || 1024,
        height: options.height || 1024,
        aspect_ratio: options.aspect_ratio,
        quality: options.quality,
        ...options
      });

      if (result.success && result.data?.url) {
        return {
          success: true,
          url: result.data.url,
          metadata: result.data.metadata || {},
          enhanced: true
        };
      }
    } catch (error) {
      console.warn('[Enhanced MuAPI] Enhanced image generation failed:', error.message);
    }
  }

  // Fallback to existing client
  try {
    const result = await muapiClient.generateImage({
      prompt,
      model: options.model,
      aspect_ratio: options.aspect_ratio,
      ...options
    });

    return {
      success: true,
      url: result.url || result,
      enhanced: false
    };
  } catch (error) {
    console.error('[MuAPI] Image generation failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enhanced video generation with AI capabilities
 */
export async function generateVideoEnhanced(prompt, options = {}) {
  if (advancedIntegrationManager) {
    try {
      const result = await advancedIntegrationManager.generateVideo(prompt, {
        model: options.model || 'kling-v2',
        duration: options.duration || 5,
        resolution: options.resolution || '1080p',
        aspect_ratio: options.aspect_ratio || '16:9',
        ...options
      });

      if (result.success && result.data?.url) {
        return {
          success: true,
          url: result.data.url,
          metadata: result.data.metadata || {},
          enhanced: true,
          duration: result.data.duration || options.duration
        };
      }
    } catch (error) {
      console.warn('[Enhanced MuAPI] Enhanced video generation failed:', error.message);
    }
  }

  // Fallback to existing client
  try {
    const result = await muapiClient.generateVideo({
      prompt,
      model: options.model,
      duration: options.duration,
      aspect_ratio: options.aspect_ratio,
      ...options
    });

    return {
      success: true,
      url: result.url || result,
      enhanced: false,
      duration: options.duration
    };
  } catch (error) {
    console.error('[MuAPI] Video generation failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enhanced image-to-video conversion
 */
export async function imageToVideoEnhanced(imageUrl, prompt, options = {}) {
  if (advancedIntegrationManager) {
    try {
      const result = await advancedIntegrationManager.imageToVideo({
        url: imageUrl,
        type: 'image'
      }, prompt, options);

      if (result.success && result.data?.url) {
        return {
          success: true,
          url: result.data.url,
          enhanced: true,
          motionStrength: options.motionStrength || 'medium'
        };
      }
    } catch (error) {
      console.warn('[Enhanced MuAPI] Image-to-video failed:', error.message);
    }
  }

  // Fallback - could implement basic version here
  return {
    success: false,
    error: 'Image-to-video not available in basic mode'
  };
}

/**
 * Enhanced face swap functionality
 */
export async function faceSwapEnhanced(sourceImage, targetImage, options = {}) {
  if (advancedIntegrationManager) {
    try {
      const result = await advancedIntegrationManager.faceSwap(sourceImage, targetImage, options);
      return result || { success: false, error: 'Face swap failed' };
    } catch (error) {
      console.warn('[Enhanced MuAPI] Face swap failed:', error.message);
    }
  }

  return { success: false, error: 'Face swap not available' };
}

/**
 * Enhanced background removal
 */
export async function removeBackgroundEnhanced(mediaData, options = {}) {
  if (advancedIntegrationManager) {
    try {
      const result = await advancedIntegrationManager.removeBackground(mediaData, options);
      return result;
    } catch (error) {
      console.warn('[Enhanced MuAPI] Background removal failed:', error.message);
    }
  }

  return mediaData;
}

/**
 * Apply preset effects collections
 */
export async function applyPresetEnhanced(mediaData, presetName, options = {}) {
  if (advancedIntegrationManager) {
    try {
      const result = await advancedIntegrationManager.applyPreset(mediaData, presetName, options);
      return result;
    } catch (error) {
      console.warn('[Enhanced MuAPI] Preset application failed:', error.message);
    }
  }

  return mediaData;
}

/**
 * Upload to MuAPI CDN
 */
export async function uploadToCDNEnhanced(file, options = {}) {
  if (advancedIntegrationManager) {
    try {
      const result = await advancedIntegrationManager.uploadToCDN(file, options);
      return result;
    } catch (error) {
      console.warn('[Enhanced MuAPI] CDN upload failed:', error.message);
    }
  }

  // Fallback to existing upload
  try {
    return await muapiClient.uploadFile(file, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get system health and capabilities
 */
export async function getEnhancedHealthStatus() {
  if (advancedIntegrationManager) {
    try {
      return await advancedIntegrationManager.getHealthStatus();
    } catch (error) {
      console.warn('[Enhanced MuAPI] Health check failed:', error.message);
    }
  }

  // Basic health check
  return {
    overall: false,
    components: {
      connection: false,
      mediaProcessor: false,
      batchProcessor: false,
      effectsProcessor: false
    },
    error: 'Enhanced MuAPI not initialized'
  };
}

/**
 * Get available capabilities and models
 */
export async function getEnhancedCapabilities() {
  if (advancedIntegrationManager) {
    try {
      return await advancedIntegrationManager.getCapabilities();
    } catch (error) {
      console.warn('[Enhanced MuAPI] Capabilities check failed:', error.message);
    }
  }

  return {
    available: false,
    features: {},
    limits: {}
  };
}

/**
 * Feature flag management
 */
export function setEnhancedFeature(feature, enabled) {
  if (advancedIntegrationManager) {
    advancedIntegrationManager.setFeatureFlag(feature, enabled);
    return true;
  }
  return false;
}

/**
 * Get current configuration
 */
export function getEnhancedConfig() {
  return advancedIntegrationManager ? advancedIntegrationManager.getConfig() : {};
}

/**
 * Update configuration
 */
export function updateEnhancedConfig(newConfig) {
  if (advancedIntegrationManager) {
    advancedIntegrationManager.updateConfig(newConfig);
    return true;
  }
  return false;
}

/**
 * Wan AI Effects Processing
 */
const MUAPI_BASE_URL = 'https://muapi.ai/api/v1';

/**
 * Get API key from localStorage (same as MuapiClient)
 */
function getApiKey() {
  const key = localStorage.getItem('muapi_key');
  if (!key) {
    throw new Error('API key not configured. Please set your API key in the application settings.');
  }
  if (key.length < 20) {
    throw new Error('Invalid API key format. Please check your API key.');
  }
  return key;
}

/**
 * Apply Wan AI video effect
 * @param {Object} videoData - Video data object with url property
 * @param {string} effectType - Effect type key from WAN_AI_EFFECTS
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} Result with success/error status
 */
export async function applyWanAIEffect(videoData, effectType, options = {}) {
  const effectConfig = WAN_AI_EFFECTS[effectType];
  if (!effectConfig) {
    throw new Error(`Unknown Wan AI effect: ${effectType}`);
  }

  const payload = {
    prompt: options.prompt || `apply ${effectConfig.description.toLowerCase()}`,
    image_url: videoData.url,
    name: effectConfig.name,
    aspect_ratio: options.aspectRatio || '16:9',
    resolution: options.resolution || '480p',
    quality: options.quality || 'medium',
    duration: options.duration || 5
  };

  const result = await fetch(`${MUAPI_BASE_URL}/api/v1/generate_wan_ai_effects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': getApiKey() },
    body: JSON.stringify(payload)
  });

  if (result.ok) {
    const response = await result.json();
    return await pollForWanResult(response.data.request_id);
  }

  throw new Error('Wan AI effect application failed');
}

/**
 * Poll for Wan AI effect processing result
 * @param {string} requestId - Request ID from initial API call
 * @returns {Promise<Object>} Processing result
 */
async function pollForWanResult(requestId) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const result = await fetch(`${MUAPI_BASE_URL}/api/v1/predictions/${requestId}/result`, {
      headers: { 'x-api-key': getApiKey() }
    });

    if (result.ok) {
      const data = await result.json();
      if (data.data?.status === 'completed') {
        return {
          success: true,
          url: data.data.outputs?.[0],
          data: data.data
        };
      } else if (data.data?.status === 'failed') {
        return {
          success: false,
          error: data.data.error || 'Processing failed'
        };
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { success: false, error: 'Polling timeout' };
}