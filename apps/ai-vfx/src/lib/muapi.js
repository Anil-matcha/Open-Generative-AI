const MUAPI_BASE_URL = 'https://api.muapi.ai/api/v1';
const MUAPI_VFX_ENDPOINT = `${MUAPI_BASE_URL}/vfx`;

/**
 * MuAPI Client for AI-VFX Application
 * Handles authentication, request generation, and polling
 */
class MuAPIClient {
  constructor() {
    this.apiKey = null;
    this.isAuthenticated = false;
  }

  /**
   * Set API key for authentication
   * @param {string} apiKey - MuAPI authentication key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.isAuthenticated = !!apiKey;
  }

  /**
   * Get stored API key from localStorage
   */
  loadApiKey() {
    try {
      const stored = localStorage.getItem('muapi_key');
      if (stored) {
        this.setApiKey(stored);
      }
    } catch (error) {
      console.warn('Failed to load API key from localStorage:', error);
    }
  }

  /**
   * Save API key to localStorage
   */
  saveApiKey() {
    try {
      if (this.apiKey) {
        localStorage.setItem('muapi_key', this.apiKey);
      }
    } catch (error) {
      console.warn('Failed to save API key to localStorage:', error);
    }
  }

  /**
   * Generate VFX video from image
   * @param {Object} params - Generation parameters
   * @param {string} params.imageUrl - Source image URL
   * @param {string} params.effect - Effect ID to apply
   * @param {number} params.duration - Video duration in seconds (2-10)
   * @param {string} params.resolution - Video resolution (720p, 1080p, 4k)
   * @param {string} params.aspectRatio - Aspect ratio (16:9, 9:16, 1:1)
   * @param {string} params.quality - Quality setting (standard, premium, ultra)
   * @returns {Promise<Object>} - Generation request response
   */
  async generateVFX(params) {
    if (!this.isAuthenticated || !this.apiKey) {
      throw new Error('API key not set. Please configure your MuAPI key first.');
    }

    const requestBody = {
      image_url: params.imageUrl,
      effect: params.effect,
      duration: Math.max(2, Math.min(10, params.duration || 5)), // 2-10 seconds
      resolution: params.resolution || '1080p',
      aspect_ratio: params.aspectRatio || '16:9',
      quality: params.quality || 'premium'
    };

    try {
      const response = await fetch(`${MUAPI_VFX_ENDPOINT}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`MuAPI Error (${response.status}): ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        requestId: data.request_id,
        status: data.status || 'processing',
        estimatedTime: data.estimated_time || 120, // 2 minutes default
        ...data
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to MuAPI. Please check your internet connection.');
      }
      throw error;
    }
  }

  /**
   * Check generation status
   * @param {string} requestId - Generation request ID
   * @returns {Promise<Object>} - Status response
   */
  async checkStatus(requestId) {
    if (!this.isAuthenticated || !this.apiKey) {
      throw new Error('API key not set. Please configure your MuAPI key first.');
    }

    if (!requestId) {
      throw new Error('Request ID is required');
    }

    try {
      const response = await fetch(`${MUAPI_VFX_ENDPOINT}/status/${requestId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Generation request not found. It may have expired.');
        }
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`MuAPI Error (${response.status}): ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        requestId,
        status: data.status || 'unknown',
        progress: data.progress || 0,
        videoUrl: data.video_url,
        error: data.error,
        completedAt: data.completed_at,
        ...data
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to MuAPI. Please check your internet connection.');
      }
      throw error;
    }
  }

  /**
   * Poll for generation completion
   * @param {string} requestId - Generation request ID
   * @param {Object} options - Polling options
   * @param {number} options.interval - Polling interval in milliseconds (default: 5000)
   * @param {number} options.timeout - Maximum polling time in milliseconds (default: 300000)
   * @param {Function} options.onProgress - Callback for progress updates
   * @returns {Promise<Object>} - Final status response
   */
  async pollForCompletion(requestId, options = {}) {
    const {
      interval = 5000, // 5 seconds
      timeout = 300000, // 5 minutes
      onProgress
    } = options;

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.checkStatus(requestId);

          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'completed' && status.videoUrl) {
            resolve(status);
            return;
          }

          if (status.status === 'failed' || status.error) {
            reject(new Error(status.error || 'Generation failed'));
            return;
          }

          // Check timeout
          if (Date.now() - startTime > timeout) {
            reject(new Error('Generation timeout: Process took too long to complete'));
            return;
          }

          // Continue polling
          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      // Start polling
      poll();
    });
  }

  /**
   * Validate API key
   * @returns {Promise<boolean>} - Whether API key is valid
   */
  async validateApiKey() {
    if (!this.apiKey) {
      return false;
    }

    try {
      // Make a simple status check to validate the key
      const response = await fetch(`${MUAPI_BASE_URL}/status`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey
        }
      });

      return response.ok;
    } catch (error) {
      console.warn('API key validation failed:', error);
      return false;
    }
  }

  /**
   * Get available effects (mock data since MuAPI doesn't provide this endpoint)
   * @returns {Array} - List of available effects
   */
  getAvailableEffects() {
    // This would ideally come from MuAPI, but for now we'll use our local effects library
    return [
      '360-orbit', 'arc-shot', 'hero-run', 'crash-zoom-in', 'crash-zoom-out',
      'dolly-in', 'dolly-out', 'crane-up', 'crane-down', 'overhead-crane',
      'matrix-shot', 'car-chase', 'vertigo-effect', 'spinning-orbit', 'tracking-shot',
      'disintegration', 'decay-time-lapse', 'building-explosion', 'car-explosion',
      'huge-explosion', 'fire', 'electricity', 'tornado', 'tsunami', 'lightning',
      'venom', 'hulk', 'zombie', 'robot', 'superhero'
    ];
  }

  /**
   * Clear stored API key
   */
  clearApiKey() {
    this.apiKey = null;
    this.isAuthenticated = false;
    try {
      localStorage.removeItem('muapi_key');
    } catch (error) {
      console.warn('Failed to clear API key from localStorage:', error);
    }
  }
}

// Export singleton instance
export const muAPIClient = new MuAPIClient();
export default muAPIClient;