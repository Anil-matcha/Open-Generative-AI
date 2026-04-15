/**
 * MuAPI Media Processing Integration
 * Integrates MuAPI advanced capabilities into existing Open-Higgsfield-AI media settings
 * Provides enhanced video/image processing with AI-powered features, batch operations,
 * and real-time effects while maintaining backward compatibility.
 */

import MuAPIConnection, { getMuAPIInstance } from './MuAPIConnection.js';

export class MuAPIMediaProcessingManager {
  constructor(config = {}) {
    this.muapi = getMuAPIInstance(config);
    this.processingQueue = [];
    this.activeJobs = new Map();
    this.cache = new Map();
    this.featureFlags = {
      aiEnhancement: config.enableAIEnhancement || true,
      batchProcessing: config.enableBatchProcessing || true,
      realTimeProcessing: config.enableRealTimeProcessing || false,
      advancedEffects: config.enableAdvancedEffects || false,
      ...config.featureFlags
    };

    // Performance monitoring
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastHealthCheck: null
    };
  }

  /**
   * Enhanced media processing with AI capabilities
   */
  async processMedia(mediaData, options = {}) {
    const startTime = Date.now();

    try {
      // Apply AI enhancement if enabled
      const enhancedData = options.skipAIEnhancement || !this.featureFlags.aiEnhancement
        ? mediaData
        : await this._applyAIEnhancement(mediaData, options);

      // Apply adaptive transcoding
      const transcodedData = await this._adaptiveTranscode(enhancedData, options);

      // Apply post-processing effects
      const processedData = await this._applyPostProcessing(transcodedData, options.effects);

      this._recordMetrics(startTime, true);
      return {
        success: true,
        data: processedData,
        processingTime: Date.now() - startTime,
        features: this._getAppliedFeatures(options)
      };

    } catch (error) {
      this._recordMetrics(startTime, false);
      return this._handleProcessingError(error, mediaData, options);
    }
  }

  /**
   * Apply AI-powered enhancement
   */
  async _applyAIEnhancement(mediaData, options) {
    if (!mediaData.url) return mediaData;

    try {
      if (this._isImage(mediaData)) {
        const result = await this.muapi.generateImage(
          `Enhance this image with better quality, colors, and details: ${options.prompt || 'professional enhancement'}`,
          {
            model: 'flux-dev',
            width: options.width || 1024,
            height: options.height || 1024,
            reference_image: mediaData.url
          }
        );

        if (result.success && result.data?.url) {
          return {
            ...mediaData,
            url: result.data.url,
            enhanced: true,
            enhancementType: 'ai-super-resolution'
          };
        }
      } else if (this._isVideo(mediaData)) {
        // For videos, apply AI enhancement effects
        const result = await this.muapi.applyVideoEffects(mediaData.url, ['enhance', 'stabilize'], {
          intensity: 'medium'
        });

        if (result.success && result.data?.url) {
          return {
            ...mediaData,
            url: result.data.url,
            enhanced: true,
            enhancementType: 'ai-video-enhancement'
          };
        }
      }
    } catch (error) {
      console.warn('AI enhancement failed, using original:', error.message);
    }

    return mediaData;
  }

  /**
   * Adaptive transcoding based on device capabilities and bandwidth
   */
  async _adaptiveTranscode(mediaData, options) {
    if (!mediaData.url || !this._isVideo(mediaData)) return mediaData;

    try {
      const deviceCapabilities = this._detectDeviceCapabilities();
      const bandwidthEstimate = this._estimateBandwidth();

      // Determine optimal format and quality
      const optimalSettings = this._calculateOptimalSettings(deviceCapabilities, bandwidthEstimate, options);

      if (optimalSettings.needsTranscoding) {
        const result = await this.muapi.generateVideo(
          `Transcode video to optimal format for ${deviceCapabilities.type} device`,
          {
            model: 'wan-2.1',
            duration: mediaData.duration || 5,
            resolution: optimalSettings.resolution,
            aspect_ratio: optimalSettings.aspectRatio,
            quality: optimalSettings.quality
          }
        );

        if (result.success && result.data?.url) {
          return {
            ...mediaData,
            url: result.data.url,
            transcoded: true,
            optimalFormat: optimalSettings
          };
        }
      }
    } catch (error) {
      console.warn('Adaptive transcoding failed:', error.message);
    }

    return mediaData;
  }

  /**
   * Apply post-processing effects
   */
  async _applyPostProcessing(mediaData, effects = []) {
    if (!mediaData.url || effects.length === 0 || !this.featureFlags.advancedEffects) {
      return mediaData;
    }

    try {
      if (this._isVideo(mediaData)) {
        const muapiEffects = this._mapEffectsToMuAPI(effects);
        if (muapiEffects.length > 0) {
          const result = await this.muapi.applyVideoEffects(mediaData.url, muapiEffects, {
            intensity: 'medium'
          });

          if (result.success && result.data?.url) {
            return {
              ...mediaData,
              url: result.data.url,
              effectsApplied: muapiEffects
            };
          }
        }
      }
    } catch (error) {
      console.warn('Post-processing effects failed:', error.message);
    }

    return mediaData;
  }

  /**
   * Batch processing for multiple media files
   */
  async batchProcess(mediaFiles, options = {}) {
    if (!this.featureFlags.batchProcessing || mediaFiles.length <= 1) {
      // Fall back to individual processing
      const results = [];
      for (const file of mediaFiles) {
        results.push(await this.processMedia(file, options));
      }
      return results;
    }

    const batchJob = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      files: mediaFiles,
      options,
      status: 'processing',
      createdAt: new Date(),
      results: []
    };

    this.activeJobs.set(batchJob.id, batchJob);

    try {
      // Process in parallel with concurrency control
      const concurrencyLimit = options.concurrency || 3;
      const results = [];

      for (let i = 0; i < mediaFiles.length; i += concurrencyLimit) {
        const batch = mediaFiles.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(file => this.processMedia(file, options));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      batchJob.status = 'completed';
      batchJob.results = results;
      batchJob.completedAt = new Date();

      return {
        success: true,
        batchId: batchJob.id,
        totalFiles: mediaFiles.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };

    } catch (error) {
      batchJob.status = 'failed';
      batchJob.error = error.message;
      batchJob.failedAt = new Date();

      return {
        success: false,
        batchId: batchJob.id,
        error: error.message,
        partialResults: batchJob.results || []
      };
    }
  }

  /**
   * Real-time processing for live effects
   */
  async processFrame(frameData, effects = []) {
    if (!this.featureFlags.realTimeProcessing) {
      return frameData; // Pass through
    }

    try {
      // For real-time processing, we'd typically use WebGL or Canvas API
      // This is a placeholder for frame-by-frame processing
      return await this._applyRealTimeEffects(frameData, effects);
    } catch (error) {
      console.warn('Real-time processing failed:', error.message);
      return frameData;
    }
  }

  /**
   * Generate image thumbnails with AI optimization
   */
  async generateThumbnails(mediaData, options = {}) {
    const thumbnails = [];

    try {
      if (this._isVideo(mediaData)) {
        // Generate multiple thumbnails at different timestamps
        const timestamps = options.timestamps || [0, 25, 50, 75, 100]; // percentage

        for (const timestamp of timestamps) {
          const result = await this.muapi.generateImage(
            `Extract high-quality thumbnail from video at ${timestamp}% timestamp`,
            {
              model: 'flux-dev',
              width: options.width || 320,
              height: options.height || 180,
              reference_video: mediaData.url,
              timestamp: timestamp
            }
          );

          if (result.success && result.data?.url) {
            thumbnails.push({
              url: result.data.url,
              timestamp: timestamp,
              width: options.width || 320,
              height: options.height || 180
            });
          }
        }
      } else if (this._isImage(mediaData)) {
        // Generate different sized thumbnails
        const sizes = options.sizes || [
          { width: 150, height: 150 },
          { width: 320, height: 240 },
          { width: 640, height: 480 }
        ];

        for (const size of sizes) {
          const result = await this.muapi.generateImage(
            `Create ${size.width}x${size.height} thumbnail of image`,
            {
              model: 'flux-dev',
              width: size.width,
              height: size.height,
              reference_image: mediaData.url
            }
          );

          if (result.success && result.data?.url) {
            thumbnails.push({
              url: result.data.url,
              width: size.width,
              height: size.height
            });
          }
        }
      }
    } catch (error) {
      console.warn('Thumbnail generation failed:', error.message);
    }

    return thumbnails;
  }

  /**
   * Upload file to MuAPI CDN
   */
  async uploadToCDN(file, options = {}) {
    try {
      const result = await this.muapi.uploadFile(file, options);

      if (result.success && result.data?.url) {
        return {
          success: true,
          url: result.data.url,
          cdnUrl: result.data.url,
          fileId: result.data.id,
          metadata: result.data.metadata
        };
      }
    } catch (error) {
      console.error('CDN upload failed:', error);
    }

    return { success: false, error: 'Upload failed' };
  }

  /**
   * Check processing status for async operations
   */
  async getProcessingStatus(requestId) {
    try {
      const result = await this.muapi.getResult(requestId);
      return {
        status: result.success ? 'completed' : 'failed',
        progress: result.data?.progress || 0,
        result: result.data,
        estimatedTimeRemaining: result.data?.eta || null
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Utility Methods
   */

  _isImage(mediaData) {
    return mediaData.type?.includes('image') || mediaData.mimeType?.includes('image') ||
           mediaData.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  }

  _isVideo(mediaData) {
    return mediaData.type?.includes('video') || mediaData.mimeType?.includes('video') ||
           mediaData.url?.match(/\.(mp4|webm|avi|mov)$/i);
  }

  _detectDeviceCapabilities() {
    // Simple device detection - in production, use more sophisticated detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasWebGL = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
      } catch (e) {
        return false;
      }
    })();

    return {
      type: isMobile ? 'mobile' : 'desktop',
      hasWebGL,
      supportsH264: true, // Most browsers support H.264
      supportsWebM: true,  // Most modern browsers support WebM
      maxResolution: isMobile ? '720p' : '4K'
    };
  }

  _estimateBandwidth() {
    // Simple bandwidth estimation - in production, use more accurate methods
    return navigator.connection?.effectiveType || '4g'; // 'slow-2g', '2g', '3g', '4g'
  }

  _calculateOptimalSettings(deviceCapabilities, bandwidth, options) {
    const settings = {
      needsTranscoding: false,
      resolution: '1080p',
      aspectRatio: '16:9',
      quality: 'high'
    };

    // Adjust based on device and bandwidth
    if (deviceCapabilities.type === 'mobile') {
      settings.resolution = bandwidth === 'slow-2g' || bandwidth === '2g' ? '480p' : '720p';
      settings.needsTranscoding = true;
    }

    if (!deviceCapabilities.hasWebGL) {
      settings.quality = 'medium';
      settings.needsTranscoding = true;
    }

    return settings;
  }

  _mapEffectsToMuAPI(effects) {
    const effectMap = {
      'blur': 'blur',
      'sharpen': 'sharpen',
      'denoise': 'denoise',
      'stabilize': 'stabilize',
      'color-grade': 'color-grade',
      'enhance': 'enhance'
    };

    return effects
      .map(effect => effectMap[effect])
      .filter(Boolean);
  }

  async _applyRealTimeEffects(frameData, effects) {
    // Placeholder for real-time effects processing
    // In production, this would use WebGL shaders or Canvas API
    return frameData;
  }

  _getAppliedFeatures(options) {
    const features = [];

    if (this.featureFlags.aiEnhancement && !options.skipAIEnhancement) {
      features.push('ai-enhancement');
    }

    if (options.effects && options.effects.length > 0) {
      features.push('post-processing');
    }

    return features;
  }

  _recordMetrics(startTime, success) {
    const duration = Date.now() - startTime;
    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + duration;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
  }

  _handleProcessingError(error, mediaData, options) {
    // Provide fallback processing
    console.error('MuAPI processing failed:', error);

    return {
      success: false,
      data: mediaData, // Return original data
      error: error.message,
      fallback: true,
      processingTime: 0,
      features: []
    };
  }

  /**
   * Health check and diagnostics
   */
  async getHealthStatus() {
    try {
      const health = await this.muapi.getHealth();
      this.metrics.lastHealthCheck = new Date();

      return {
        muapi: health.success,
        metrics: { ...this.metrics },
        featureFlags: { ...this.featureFlags },
        activeJobs: this.activeJobs.size
      };
    } catch (error) {
      return {
        muapi: false,
        error: error.message,
        metrics: { ...this.metrics },
        featureFlags: { ...this.featureFlags }
      };
    }
  }

  /**
   * Configuration and feature management
   */
  updateFeatureFlags(flags) {
    this.featureFlags = { ...this.featureFlags, ...flags };
  }

  getFeatureFlags() {
    return { ...this.featureFlags };
  }
}

/**
 * Global instance
 */
let mediaProcessingManagerInstance = null;

export const getMediaProcessingManager = (config) => {
  if (!mediaProcessingManagerInstance) {
    mediaProcessingManagerInstance = new MuAPIMediaProcessingManager(config);
  }
  return mediaProcessingManagerInstance;
};

export default MuAPIMediaProcessingManager;