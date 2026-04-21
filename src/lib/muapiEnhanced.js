// MuAPI Configuration
const MUAPI_BASE_URL = 'https://api.muapi.ai';

/**
 * Get API key from localStorage
 * @returns {string} API key
 */
function getApiKey() {
  const key = localStorage.getItem('muapi_key');
  if (!key) {
    throw new Error('MuAPI key not configured. Please set your API key in settings.');
  }
  // Validate key format (basic check) - allow test keys
  if (key.length < 10) {
    throw new Error('Invalid MuAPI key format. Please check your API key.');
  }
  return key;
}

/**
 * TikTok Carousel Generation Functions
 */

/**
 * Generate TikTok-style carousel video from images
 * @param {Array} imageUrls - Array of image URLs (up to 10)
 * @param {Object} options - Carousel generation options
 * @returns {Promise<Object>} Result with success/error status
 */
export async function generateTikTokCarousel(imageUrls, options = {}) {
  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new Error('At least one image URL is required');
  }

  if (imageUrls.length > 10) {
    throw new Error('Maximum 10 images allowed for carousel generation');
  }

  const {
    layout = 'horizontal', // 'horizontal', 'vertical', 'grid'
    transitions = 'slide', // 'slide', 'fade', 'zoom'
    timings = [], // Array of timing durations per slide (seconds)
    musicUrl = null, // Background music URL
    resolution = '1080p',
    aspectRatio = '9:16', // TikTok aspect ratio
    duration = 5 // Total duration in seconds
  } = options;

  // Validate and prepare timing array
  const slideCount = imageUrls.length;
  let slideTimings = timings.length > 0 ? timings : new Array(slideCount).fill(duration / slideCount);

  // Ensure timing array matches slide count and sums to total duration
  if (slideTimings.length !== slideCount) {
    slideTimings = new Array(slideCount).fill(duration / slideCount);
  }

  // Normalize timings to ensure they sum to total duration
  const totalTiming = slideTimings.reduce((sum, t) => sum + t, 0);
  if (Math.abs(totalTiming - duration) > 0.1) {
    const ratio = duration / totalTiming;
    slideTimings = slideTimings.map(t => t * ratio);
  }

  const payload = {
    images: imageUrls,
    layout,
    transition_effect: transitions,
    slide_timings: slideTimings,
    background_music: musicUrl,
    resolution,
    aspect_ratio: aspectRatio,
    total_duration: duration,
    optimize_for_tiktok: true
  };

  try {
    const result = await fetch(`${MUAPI_BASE_URL}/api/v1/generate_tiktok_carousel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': getApiKey() },
      body: JSON.stringify(payload)
    });

    if (result.ok) {
      const response = await result.json();
      return await pollForCarouselResult(response.data.request_id);
    }

    const errorData = await result.json().catch(() => ({}));
    throw new Error(errorData.message || 'Carousel generation failed');
  } catch (error) {
    console.error('[MuAPI] TikTok carousel generation failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Poll for TikTok carousel generation result
 * @param {string} requestId - Request ID from initial API call
 * @returns {Promise<Object>} Processing result
 */
async function pollForCarouselResult(requestId) {
  for (let attempt = 0; attempt < 90; attempt++) { // 3 minutes timeout
    try {
      const result = await fetch(`${MUAPI_BASE_URL}/api/v1/predictions/${requestId}/result`, {
        headers: { 'x-api-key': getApiKey() }
      });

      if (result.ok) {
        const data = await result.json();
        if (data.data?.status === 'completed') {
          return {
            success: true,
            url: data.data.outputs?.[0],
            data: data.data,
            optimized: true
          };
        } else if (data.data?.status === 'failed') {
          return {
            success: false,
            error: data.data.error || 'Carousel generation failed'
          };
        }
      }
    } catch (error) {
      console.warn('[MuAPI] Carousel polling error:', error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { success: false, error: 'Carousel generation timeout' };
}

/**
 * Upload background music for carousel
 * @param {File} musicFile - Audio file to upload
 * @returns {Promise<Object>} Upload result with URL
 */
export async function uploadCarouselMusic(musicFile) {
  if (!musicFile || !musicFile.type?.startsWith('audio/')) {
    throw new Error('Valid audio file required');
  }

  try {
    const formData = new FormData();
    formData.append('file', musicFile);
    formData.append('type', 'carousel_music');

    const result = await fetch(`${MUAPI_BASE_URL}/api/v1/upload`, {
      method: 'POST',
      headers: { 'x-api-key': getApiKey() },
      body: formData
    });

    if (result.ok) {
      const data = await result.json();
      return {
        success: true,
        url: data.url,
        duration: data.duration,
        format: data.format
      };
    }

    const errorData = await result.json().catch(() => ({}));
    throw new Error(errorData.message || 'Music upload failed');
  } catch (error) {
    console.error('[MuAPI] Music upload failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get carousel preview (thumbnail generation)
 * @param {Array} imageUrls - Array of image URLs
 * @param {Object} options - Preview options
 * @returns {Promise<Object>} Preview result with thumbnail URL
 */
export async function generateCarouselPreview(imageUrls, options = {}) {
  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return { success: false, error: 'No images provided' };
  }

  const {
    layout = 'horizontal',
    transitions = 'slide',
    width = 300,
    height = 500 // TikTok aspect ratio
  } = options;

  try {
    const payload = {
      images: imageUrls.slice(0, 4), // Preview with first 4 images
      layout,
      transition_effect: transitions,
      width,
      height,
      preview_only: true
    };

    const result = await fetch(`${MUAPI_BASE_URL}/api/v1/generate_carousel_preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': getApiKey() },
      body: JSON.stringify(payload)
    });

    if (result.ok) {
      const data = await result.json();
      return {
        success: true,
        thumbnailUrl: data.thumbnail_url,
        layout,
        imageCount: imageUrls.length
      };
    }

    return { success: false, error: 'Preview generation failed' };
  } catch (error) {
    console.error('[MuAPI] Preview generation failed:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// ADVANCED VIDEO TRANSLATION & DUBBING FUNCTIONS
// =============================================================================

import { muapi } from './muapi.js';

// Enhanced MuAPI functions for advanced video translation and dubbing
export class MuapiEnhancedClient {
    constructor() {
        this.client = muapi;
    }

    // Language detection for video audio
    async detectLanguage(videoUrl) {
        try {
            const response = await this.client.makeRequest('detect-language', {
                video_url: videoUrl
            });
            return response.language || 'en';
        } catch (error) {
            console.warn('[MuapiEnhanced] Language detection failed:', error);
            return 'en'; // fallback
        }
    }

    // Video translation with multiple language support
    async translateVideo(videoUrl, sourceLanguage, targetLanguage, options = {}) {
        const params = {
            video_url: videoUrl,
            source_language: sourceLanguage,
            target_language: targetLanguage,
            preserve_tone: options.preserveTone || true,
            quality: options.quality || 'high',
            sync_audio: options.syncAudio || true
        };

        return await this.client.makeRequest('video-translate', params);
    }

    // Advanced dubbing with voice cloning
    async dubVideo(videoUrl, sourceLanguage, targetLanguage, voiceOptions = {}) {
        const params = {
            video_url: videoUrl,
            source_language: sourceLanguage,
            target_language: targetLanguage,
            voice_clone: voiceOptions.clone || false,
            voice_id: voiceOptions.voiceId || null,
            voice_style: voiceOptions.style || 'natural',
            lip_sync_quality: voiceOptions.lipSyncQuality || 'high',
            preserve_emotion: voiceOptions.preserveEmotion || true,
            speed_adjustment: voiceOptions.speedAdjustment || 1.0
        };

        return await this.client.makeRequest('video-dub', params);
    }

    // Voice cloning from reference audio
    async cloneVoice(referenceAudioUrl, voiceName) {
        const params = {
            reference_audio: referenceAudioUrl,
            voice_name: voiceName,
            quality: 'premium'
        };

        return await this.client.makeRequest('voice-clone', params);
    }

    // Get available voices for dubbing
    async getAvailableVoices(language) {
        try {
            const response = await this.client.makeRequest('get-voices', {
                language: language
            });
            return response.voices || [];
        } catch (error) {
            console.warn('[MuapiEnhanced] Failed to get voices:', error);
            return this.getDefaultVoices(language);
        }
    }

    // Get supported languages for translation/dubbing
    getSupportedLanguages() {
        return [
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'es', name: 'Spanish', flag: '🇪🇸' },
            { code: 'fr', name: 'French', flag: '🇫🇷' },
            { code: 'de', name: 'German', flag: '🇩🇪' },
            { code: 'it', name: 'Italian', flag: '🇮🇹' },
            { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
            { code: 'ru', name: 'Russian', flag: '🇷🇺' },
            { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
            { code: 'ko', name: 'Korean', flag: '🇰🇷' },
            { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
            { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
            { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
            { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
            { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
            { code: 'da', name: 'Danish', flag: '🇩🇰' },
            { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
            { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
            { code: 'pl', name: 'Polish', flag: '🇵🇱' },
            { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
            { code: 'th', name: 'Thai', flag: '🇹🇭' },
            { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' }
        ];
    }

    // Get default voices for fallback
    getDefaultVoices(language) {
        const defaultVoices = {
            en: [
                { id: 'en-male-1', name: 'American Male', gender: 'male', style: 'natural' },
                { id: 'en-female-1', name: 'American Female', gender: 'female', style: 'natural' },
                { id: 'en-male-2', name: 'British Male', gender: 'male', style: 'professional' },
                { id: 'en-female-2', name: 'British Female', gender: 'female', style: 'professional' }
            ],
            es: [
                { id: 'es-male-1', name: 'Spanish Male', gender: 'male', style: 'natural' },
                { id: 'es-female-1', name: 'Spanish Female', gender: 'female', style: 'natural' }
            ]
        };
        return defaultVoices[language] || defaultVoices.en;
    }

    // Preview audio generation for dubbing
    async generatePreviewAudio(text, voiceId, language) {
        const params = {
            text: text,
            voice_id: voiceId,
            language: language,
            preview: true
        };

        return await this.client.makeRequest('generate-preview-audio', params);
    }

    // Lip-sync quality analysis
    async analyzeLipSync(videoUrl, audioUrl) {
        const params = {
            video_url: videoUrl,
            audio_url: audioUrl
        };

        return await this.client.makeRequest('analyze-lip-sync', params);
    }

    // Apply advanced Pixverse effects
    async applyPixverseAdvancedEffect(videoUrl, effectType, options = {}) {
        const params = {
            video_url: videoUrl,
            effect_type: effectType,
            intensity: options.intensity || 5,
            duration: options.duration || null,
            style: options.style || 'cinematic',
            ...options
        };

        return await this.client.makeRequest('pixverse-advanced-effect', params);
    }

    // Apply advanced Veo image-to-video
    async applyVeoAdvancedI2V(imageUrl, options = {}) {
        const params = {
            image_url: imageUrl,
            prompt: options.prompt || '',
            motion_strength: options.motionStrength || 5,
            camera_movement: options.cameraMovement || 'subtle',
            duration: options.duration || 5,
            resolution: options.resolution || '1080p',
            aspect_ratio: options.aspectRatio || '16:9',
            style: options.style || 'realistic'
        };

        return await this.client.makeRequest('veo-advanced-i2v', params);
    }

    // Apply Runway motion effects
    async applyRunwayMotion(videoUrl, motionConfig = {}) {
        const params = {
            video_url: videoUrl,
            motion_type: motionConfig.type || 'pan',
            direction: motionConfig.direction || 'left',
            speed: motionConfig.speed || 5,
            intensity: motionConfig.intensity || 5,
            stabilization: motionConfig.stabilization || false,
            motion_blur: motionConfig.motionBlur || false
        };

        return await this.client.makeRequest('runway-motion', params);
    }
}

// Export singleton instance
export const muapiEnhanced = new MuapiEnhancedClient();

// Export individual functions for backward compatibility
export async function applyPixverseAdvancedEffect(videoUrl, effectType, options = {}) {
    return await muapiEnhanced.applyPixverseAdvancedEffect(videoUrl, effectType, options);
}

export async function applyVeoAdvancedI2V(imageUrl, options = {}) {
    return await muapiEnhanced.applyVeoAdvancedI2V(imageUrl, options);
}

export async function applyRunwayMotion(videoUrl, motionConfig = {}) {
    return await muapiEnhanced.applyRunwayMotion(videoUrl, motionConfig);
}

/**
 * Initialize enhanced MuAPI features
 * @param {Object} config - Configuration object
 * @returns {Promise<boolean>} Success status
 */
export async function initializeEnhancedMuAPI(config) {
    try {
        // Initialize enhanced features if available
        console.log('[MuAPI Enhanced] Initializing with config:', config);
        // For now, return true as enhanced features are not yet implemented
        return true;
    } catch (error) {
        console.error('[MuAPI Enhanced] Initialization failed:', error);
        return false;
    }
}