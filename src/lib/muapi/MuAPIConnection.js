/**
 * MuAPI Connection Management System
 * Handles authentication, retries, bandwidth management, and connection resilience
 * for all MuAPI operations in the Open-Higgsfield-AI application.
 */

export class MuAPIConnection {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'https://muapi.ai/api/v1';
    this.apiKey = config.apiKey || (typeof process !== 'undefined' && process.env ? process.env.MUAPI_API_KEY : null);
    this.retryConfig = {
      maxRetries: config.maxRetries || 3,
      backoff: config.backoff || 1000,
      maxBackoff: config.maxBackoff || 30000,
      ...config.retryConfig
    };
    this.bandwidthLimit = config.bandwidthLimit; // bytes per second
    this.requestQueue = [];
    this.activeRequests = new Map();
    this.rateLimiter = {
      requestsPerMinute: config.requestsPerMinute || 60,
      lastRequestTime: 0,
      requestCount: 0
    };
  }

  /**
   * Generate authentication token
   */
  _generateToken() {
    if (!this.apiKey) {
      throw new Error('MuAPI API key not configured. Set MUAPI_API_KEY environment variable or pass apiKey in config.');
    }
    return this.apiKey;
  }

  /**
   * Make authenticated request with retry logic and bandwidth management
   */
  async _makeRequest(endpoint, options = {}) {
    const headers = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add bandwidth limiting header if configured
    if (this.bandwidthLimit) {
      headers['X-Bandwidth-Limit'] = this.bandwidthLimit.toString();
    }

    const url = `${this.baseURL}${endpoint}`;
    const requestOptions = {
      ...options,
      headers
    };

    // Apply rate limiting
    await this._applyRateLimit();

    let lastError;
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);

        if (response.ok) {
          return await this._handleResponse(response);
        }

        // Handle specific error codes
        if (response.status === 429) { // Rate limited
          const retryAfter = response.headers.get('Retry-After') || this.retryConfig.backoff;
          await this._delay(parseInt(retryAfter) * 1000);
          continue;
        }

        if (response.status >= 500) { // Server error, retry
          if (attempt < this.retryConfig.maxRetries) {
            await this._delay(this._calculateBackoff(attempt));
            continue;
          }
        }

        // Client errors (4xx) - don't retry
        throw new Error(`MuAPI request failed: ${response.status} ${response.statusText}`);

      } catch (error) {
        lastError = error;

        if (attempt < this.retryConfig.maxRetries && this._shouldRetry(error)) {
          await this._delay(this._calculateBackoff(attempt));
          continue;
        }

        break;
      }
    }

    throw lastError;
  }

  /**
   * Handle API response
   */
  async _handleResponse(response) {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return {
        success: response.ok,
        status: response.status,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      };
    }

    // Handle binary responses (images, videos)
    const buffer = await response.arrayBuffer();
    return {
      success: response.ok,
      status: response.status,
      data: buffer,
      contentType: contentType,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  /**
   * Apply rate limiting
   */
  async _applyRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.rateLimiter.lastRequestTime;

    // Reset counter if a minute has passed
    if (timeSinceLastRequest >= 60000) {
      this.rateLimiter.requestCount = 0;
      this.rateLimiter.lastRequestTime = now;
    }

    // Check if we're within the limit
    if (this.rateLimiter.requestCount >= this.rateLimiter.requestsPerMinute) {
      const waitTime = 60000 - timeSinceLastRequest;
      await this._delay(waitTime);
      this.rateLimiter.requestCount = 0;
      this.rateLimiter.lastRequestTime = Date.now();
    }

    this.rateLimiter.requestCount++;
    this.rateLimiter.lastRequestTime = now;
  }

  /**
   * Calculate exponential backoff delay
   */
  _calculateBackoff(attempt) {
    const delay = this.retryConfig.backoff * Math.pow(2, attempt);
    return Math.min(delay, this.retryConfig.maxBackoff);
  }

  /**
   * Check if error should trigger retry
   */
  _shouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx errors
    return error.name === 'TypeError' || // Network errors
           error.message.includes('fetch') ||
           error.message.includes('timeout');
  }

  /**
   * Delay utility
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Core API Methods
   */

  /**
   * Generate image from text prompt
   */
  async generateImage(prompt, options = {}) {
    const payload = {
      prompt,
      model: options.model || 'flux-dev',
      width: options.width || 1024,
      height: options.height || 1024,
      steps: options.steps || 20,
      guidance_scale: options.guidanceScale || 7.5,
      ...options
    };

    return await this._makeRequest('/generation/image', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Generate video from text prompt
   */
  async generateVideo(prompt, options = {}) {
    const payload = {
      prompt,
      model: options.model || 'kling-v2',
      duration: options.duration || 5,
      resolution: options.resolution || '1080p',
      aspect_ratio: options.aspectRatio || '16:9',
      ...options
    };

    return await this._makeRequest('/generation/video', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Convert image to video
   */
  async imageToVideo(imageUrl, prompt, options = {}) {
    const payload = {
      image_url: imageUrl,
      prompt,
      model: options.model || 'kling-v2',
      duration: options.duration || 5,
      motion_strength: options.motionStrength || 'medium',
      ...options
    };

    return await this._makeRequest('/generation/image-to-video', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Generate music/audio
   */
  async generateMusic(prompt, options = {}) {
    const payload = {
      prompt,
      model: options.model || 'suno-v5',
      duration: options.duration || 30,
      genre: options.genre || 'electronic',
      ...options
    };

    return await this._makeRequest('/generation/music', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Apply video effects
   */
  async applyVideoEffects(videoUrl, effects, options = {}) {
    const payload = {
      video_url: videoUrl,
      effects: Array.isArray(effects) ? effects : [effects],
      intensity: options.intensity || 'medium',
      ...options
    };

    return await this._makeRequest('/effects/video', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Upload file and get CDN URL
   */
  async uploadFile(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', options.type || 'auto');

    return await this._makeRequest('/upload', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey
        // Don't set Content-Type, let browser set it with boundary
      },
      body: formData
    });
  }

  /**
   * Get generation status/result
   */
  async getResult(requestId) {
    return await this._makeRequest(`/result/${requestId}`, {
      method: 'GET'
    });
  }

  /**
   * Check API health and credits
   */
  async getHealth() {
    return await this._makeRequest('/health', {
      method: 'GET'
    });
  }

  /**
   * Get available models
   */
  async getModels(category = null) {
    const endpoint = category ? `/models?category=${category}` : '/models';
    return await this._makeRequest(endpoint, {
      method: 'GET'
    });
  }
}

/**
 * Global MuAPI instance
 */
let muAPIInstance = null;

export const getMuAPIInstance = (config) => {
  if (!muAPIInstance) {
    muAPIInstance = new MuAPIConnection(config);
  }
  return muAPIInstance;
};

export default MuAPIConnection;