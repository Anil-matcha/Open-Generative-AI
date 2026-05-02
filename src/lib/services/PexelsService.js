/**
 * PexelsService - Production-grade Pexels API integration
 * Provides search for photos and videos with caching, rate limiting, circuit breaker
 */
import { RateLimiter } from './RateLimiter.js';
import { CircuitBreaker } from './CircuitBreaker.js';
import { CacheService } from './CacheService.js';
import { ErrorBoundary } from './ErrorBoundary.js';

export class PexelsService {
  constructor() {
    // Initialize configuration from environment or localStorage
    this.apiKey = this.getApiKey();
    this.enabled = this.isEnabled();
    
    // Initialize supporting services
    this.rateLimiter = new RateLimiter({ rate: 200, duration: 3600000 });
    this.breaker = new CircuitBreaker({ 
      failureThreshold: 5, 
      recoveryTimeout: 60000 
    });
    this.cache = new CacheService({ defaultTTL: 300000 }); // 5 min cache
    this.errorBoundary = new ErrorBoundary({ service: 'Pexels' });
    
    // Statistics tracking
    this.stats = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };

    // Add pexels service to circuit breaker
    this.breaker.addService('pexels', { 
      failureThreshold: 3,
      recoveryTimeout: 30000
    });
  }
  
  /**
   * Get API key from environment or localStorage
   */
  getApiKey() {
    let key = import.meta.env.VITE_PEXELS_API_KEY;
    if (!key) {
      key = localStorage.getItem('pexels_api_key');
    }
    return key || '';
  }
  
  /**
   * Check if service is enabled
   */
  isEnabled() {
    const envEnabled = import.meta.env.VITE_PEXELS_ENABLED;
    if (envEnabled !== undefined) {
      return envEnabled === 'true';
    }
    return true; // default enabled
  }
  
  /**
   * Search photos on Pexels
   * @param {string} query - Search query
   * @param {Object} options - Search options (per_page, orientation, etc.)
   * @returns {Promise<Array>} - Array of photo assets
   */
  async searchPhotos(query, options = {}) {
    if (!this.enabled) {
      throw new Error('Pexels service is disabled');
    }
    
    // Circuit breaker check
    if (!this.breaker.canProceed('pexels')) {
      throw new Error('Circuit breaker is OPEN for pexels');
    }
    
    // Build cache key
    const cacheKey = this.buildCacheKey('photos', query, options);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }
    
    this.stats.cacheMisses++;
    
    // Rate limit check
    if (!this.rateLimiter.canProceed()) {
      throw new Error('Rate limit exceeded');
    }
    
    // Build URL
    const url = this.buildPhotoUrl(query, options);
    
    try {
      // Execute request wrapped with error boundary
      const response = await this.errorBoundary.wrap(() =>
        fetch(url, {
          headers: {
            Authorization: this.apiKey
          }
        })
      )();
      
      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform photos
      const photos = this.transformPhotos(data.photos || []);
      
      // Cache results
      this.cache.set(cacheKey, photos);
      
      // Record success
      this.breaker.recordSuccess('pexels');
      this.stats.requests++;
      
      return photos;
    } catch (error) {
      this.breaker.recordFailure('pexels');
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Search videos on Pexels
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of video assets
   */
  async searchVideos(query, options = {}) {
    if (!this.enabled) {
      throw new Error('Pexels service is disabled');
    }
    
    if (!this.breaker.canProceed('pexels')) {
      throw new Error('Circuit breaker is OPEN for pexels');
    }
    
    const cacheKey = this.buildCacheKey('videos', query, options);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }
    
    this.stats.cacheMisses++;
    
    if (!this.rateLimiter.canProceed()) {
      throw new Error('Rate limit exceeded');
    }
    
    const url = this.buildVideoUrl(query, options);
    
    try {
      const response = await this.errorBoundary.wrap(() =>
        fetch(url, {
          headers: {
            Authorization: this.apiKey
          }
        })
      )();
      
      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }
      
      const data = await response.json();
      const videos = this.transformVideos(data.videos || []);
      
      this.cache.set(cacheKey, videos);
      this.breaker.recordSuccess('pexels');
      this.stats.requests++;
      
      return videos;
    } catch (error) {
      this.breaker.recordFailure('pexels');
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Build photo search URL
   */
  buildPhotoUrl(query, options) {
    const params = new URLSearchParams();
    params.set('query', query);
    
    if (options.per_page) params.set('per_page', options.per_page);
    if (options.orientation) params.set('orientation', options.orientation);
    if (options.size) params.set('size', options.size);
    if (options.color) params.set('color', options.color);
    if (options.page) params.set('page', options.page);
    
    return `https://api.pexels.com/v1/search?${params.toString()}`;
  }
  
  /**
   * Build video search URL
   */
  buildVideoUrl(query, options) {
    const params = new URLSearchParams();
    params.set('query', query);
    
    if (options.per_page) params.set('per_page', options.per_page);
    if (options.size) params.set('size', options.size);
    if (options.orientation) params.set('orientation', options.orientation);
    if (options.page) params.set('page', options.page);
    if (options.min_duration) params.set('min_duration', options.min_duration);
    if (options.max_duration) params.set('max_duration', options.max_duration);
    
    return `https://api.pexels.com/videos/search?${params.toString()}`;
  }
  
  /**
   * Build cache key from query and options
   */
  buildCacheKey(type, query, options) {
    const opts = Object.keys(options).sort().map(k => `${k}=${options[k]}`).join('&');
    return `pexels:${type}:${query}:${opts}`;
  }
  
  /**
   * Transform Pexels photo response to internal asset format
   * @param {Array} photos - Raw photo objects from Pexels API
   * @returns {Array} - Transformed assets
   */
  transformPhotos(photos) {
    return photos.map(photo => ({
      id: `pexels-photo-${photo.id}`,
      type: 'photo',
      url: photo.src?.large || photo.src?.large2x || '',
      originalUrl: photo.src?.original || '',
      alt: photo.alt || '',
      photographer: photo.photographer || '',
      width: photo.width || 0,
      height: photo.height || 0,
      source: 'pexels'
    }));
  }
  
  /**
   * Transform Pexels video response to internal asset format
   * @param {Array} videos - Raw video objects from Pexels API
   * @returns {Array} - Transformed video assets
   */
  transformVideos(videos) {
    return videos.map(video => {
      // Select best quality video file (prefer highest resolution)
      let bestFile = null;
      const priority = { '4k': 4, 'hd': 3, 'sd': 2, 'original': 1 };
      
      if (video.video_files && video.video_files.length > 0) {
        bestFile = video.video_files.reduce((best, current) => {
          const bestPriority = priority[best.quality] || 0;
          const currentPriority = priority[current.quality] || 0;
          return currentPriority > bestPriority ? current : best;
        });
      }
      
      return {
        id: `pexels-video-${video.id}`,
        type: 'video',
        url: bestFile?.link || '',
        quality: bestFile?.quality || '',
        width: bestFile?.width || video.width || 0,
        height: bestFile?.height || video.height || 0,
        duration: video.duration || 0,
        source: 'pexels'
      };
    });
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.stats.cacheHits + this.stats.cacheMisses > 0
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100
        : 0,
      rateLimitAvailable: this.rateLimiter.getAvailableTokens(),
      circuitBreakerState: this.breaker.getServiceStatus('pexels')?.state || 'UNKNOWN'
    };
  }
}
