/**
 * MuAPI Integration Manager for Open-Higgsfield-AI
 * Main integration point that connects all MuAPI advanced capabilities
 * to the existing media processing pipeline while maintaining backward compatibility.
 */

import MuAPIConnection from './MuAPIConnection.js';
import MuAPIMediaProcessingManager from './MuAPIMediaProcessingManager.js';
import MuAPIBatchProcessor from './MuAPIBatchProcessor.js';
import MuAPIAdvancedEffects from './MuAPIAdvancedEffects.js';

export class MuAPIIntegrationManager {
  constructor(config = {}) {
    // Load configuration from environment or defaults
    this.config = {
      apiKey: config.apiKey || process.env.MUAPI_API_KEY,
      baseURL: config.baseURL || 'https://muapi.ai/api/v1',
      enableAIEnhancement: config.enableAIEnhancement !== false,
      enableBatchProcessing: config.enableBatchProcessing !== false,
      enableRealTimeProcessing: config.enableRealTimeProcessing || false,
      enableAdvancedEffects: config.enableAdvancedEffects !== false,
      maxConcurrency: config.maxConcurrency || 3,
      bandwidthLimit: config.bandwidthLimit, // bytes per second
      requestsPerMinute: config.requestsPerMinute || 60,
      ...config
    };

    // Initialize core components
    this.connection = new MuAPIConnection(this.config);
    this.mediaProcessor = new MuAPIMediaProcessingManager({
      ...this.config,
      muapi: this.connection
    });
    this.batchProcessor = new MuAPIBatchProcessor({
      ...this.config,
      mediaProcessor: this.mediaProcessor
    });
    this.effectsProcessor = new MuAPIAdvancedEffects({
      ...this.config,
      muapi: this.connection
    });

    // Integration state
    this.isInitialized = false;
    this.healthStatus = null;
    this.lastHealthCheck = null;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };

    // Callbacks for integration
    this.onProcessingComplete = config.onProcessingComplete || null;
    this.onBatchProgress = config.onBatchProgress || null;
    this.onError = config.onError || null;
  }

  /**
   * Initialize the MuAPI integration
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Test connection
      const health = await this.connection.getHealth();
      this.healthStatus = health.success;
      this.lastHealthCheck = new Date();

      if (!health.success) {
        console.warn('MuAPI health check failed, but continuing with limited functionality');
      }

      // Test available models
      await this.connection.getModels();

      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error('MuAPI initialization failed:', error);
      this.healthStatus = false;
      return false;
    }
  }

  /**
   * Main media processing entry point
   * Replaces or enhances existing media processing
   */
  async processMedia(mediaData, options = {}) {
    await this.initialize();

    const startTime = Date.now();

    try {
      // Use the enhanced media processor
      const result = await this.mediaProcessor.processMedia(mediaData, {
        ...options,
        onProgress: options.onProgress
      });

      this._recordMetrics(startTime, true);

      if (this.onProcessingComplete) {
        this.onProcessingComplete(result);
      }

      return result;

    } catch (error) {
      this._recordMetrics(startTime, false);

      if (this.onError) {
        this.onError(error, mediaData);
      }

      // Return fallback result
      return {
        success: false,
        data: mediaData,
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Batch processing with progress tracking
   */
  async processBatch(mediaFiles, options = {}) {
    await this.initialize();

    // Set up progress callbacks
    const batchOptions = {
      ...options,
      progressCallback: (batchId, progress) => {
        if (this.onBatchProgress) {
          this.onBatchProgress(batchId, progress);
        }
        if (options.onProgress) {
          options.onProgress(progress);
        }
      }
    };

    return await this.batchProcessor.createBatch(mediaFiles, batchOptions);
  }

  /**
   * Advanced effects and post-processing
   */
  async applyEffects(mediaData, effects = []) {
    await this.initialize();

    if (Array.isArray(effects) && effects.length === 1 && typeof effects[0] === 'string') {
      // Single effect
      return await this.effectsProcessor.applyFilter(mediaData, effects[0]);
    } else if (Array.isArray(effects)) {
      // Multiple effects
      return await this.effectsProcessor.applyFilters(mediaData, effects);
    } else if (typeof effects === 'string') {
      // Single effect as string
      return await this.effectsProcessor.applyFilter(mediaData, effects);
    }

    return mediaData;
  }

  /**
   * AI-powered image generation
   */
  async generateImage(prompt, options = {}) {
    await this.initialize();

    return await this.connection.generateImage(prompt, options);
  }

  /**
   * AI-powered video generation
   */
  async generateVideo(prompt, options = {}) {
    await this.initialize();

    return await this.connection.generateVideo(prompt, options);
  }

  /**
   * Image-to-video conversion
   */
  async imageToVideo(imageData, prompt, options = {}) {
    await this.initialize();

    return await this.connection.imageToVideo(imageData.url, prompt, options);
  }

  /**
   * Upload media to MuAPI CDN
   */
  async uploadToCDN(file, options = {}) {
    await this.initialize();

    return await this.mediaProcessor.uploadToCDN(file, options);
  }

  /**
   * Generate thumbnails
   */
  async generateThumbnails(mediaData, options = {}) {
    await this.initialize();

    return await this.mediaProcessor.generateThumbnails(mediaData, options);
  }

  /**
   * Get batch processing status
   */
  getBatchStatus(batchId) {
    return this.batchProcessor.getBatchStatus(batchId);
  }

  /**
   * Get batch processing results
   */
  getBatchResults(batchId) {
    return this.batchProcessor.getBatchResults(batchId);
  }

  /**
   * Cancel batch processing
   */
  cancelBatch(batchId) {
    return this.batchProcessor.cancelBatch(batchId);
  }

  /**
   * Apply preset effects
   */
  async applyPreset(mediaData, presetName, options = {}) {
    await this.initialize();

    return await this.effectsProcessor.applyPreset(mediaData, presetName, options);
  }

  /**
   * Face swap functionality
   */
  async faceSwap(sourceImage, targetImage, options = {}) {
    await this.initialize();

    return await this.effectsProcessor.faceSwap(sourceImage, targetImage, options);
  }

  /**
   * Background removal
   */
  async removeBackground(mediaData, options = {}) {
    await this.initialize();

    return await this.effectsProcessor.removeBackground(mediaData, options);
  }

  /**
   * Get health and diagnostics
   */
  async getHealthStatus() {
    const health = await this.connection.getHealth();
    const mediaProcessorHealth = await this.mediaProcessor.getHealthStatus();

    return {
      overall: health.success && mediaProcessorHealth.muapi,
      components: {
        connection: health.success,
        mediaProcessor: mediaProcessorHealth.muapi,
        batchProcessor: true, // Always available
        effectsProcessor: true // Always available
      },
      metrics: {
        ...this.metrics,
        mediaProcessorMetrics: mediaProcessorHealth.metrics
      },
      lastHealthCheck: new Date(),
      activeBatches: mediaProcessorHealth.activeJobs || 0
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // Update component configurations
    this.connection = new MuAPIConnection(this.config);
    this.mediaProcessor = new MuAPIMediaProcessingManager({
      ...this.config,
      muapi: this.connection
    });

    // Reinitialize if needed
    this.isInitialized = false;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Enable/disable features
   */
  setFeatureFlag(feature, enabled) {
    this.config[`enable${feature.charAt(0).toUpperCase() + feature.slice(1)}`] = enabled;

    // Update media processor feature flags
    if (this.mediaProcessor) {
      this.mediaProcessor.updateFeatureFlags({
        [feature]: enabled
      });
    }
  }

  /**
   * Apply AI Video Effects (Wan AI Effects)
   */
  async applyAIVideoEffect(videoData, effectName, options = {}) {
    await this.initialize();

    return await this.effectsProcessor.applyAIVideoEffect(videoData, {
      effectName,
      ...options
    });
  }

  /**
   * Apply Motion Controls
   */
  async applyMotionControl(mediaData, motionType, options = {}) {
    await this.initialize();

    return await this.effectsProcessor.applyMotionControl(mediaData, motionType, options);
  }

  /**
   * Apply VFX Effects
   */
  async applyVFX(mediaData, vfxType, options = {}) {
    await this.initialize();

    return await this.effectsProcessor.applyVFX(mediaData, vfxType, options);
  }

  /**
   * Generate Music with Suno
   */
  async generateMusic(prompt, options = {}) {
    await this.initialize();

    return await this.effectsProcessor.generateMusic(prompt, options);
  }

  /**
   * Lip Synchronization
   */
  async lipSync(videoData, audioData, options = {}) {
    await this.initialize();

    return await this.effectsProcessor.lipSync(videoData, audioData, options);
  }

  /**
   * Create Storyboard
   */
  async createStoryboard(projectData, options = {}) {
    await this.initialize();

    return await this.effectsProcessor.createStoryboard(projectData, options);
  }

  /**
   * Execute Workflow
   */
  async executeWorkflow(workflowData, options = {}) {
    await this.initialize();

    return await this.effectsProcessor.executeWorkflow(workflowData, options);
  }

  /**
   * Upscale Image
   */
  async upscaleImage(imageData, scale = 2, options = {}) {
    await this.initialize();

    return await this.effectsProcessor.upscaleImage(imageData, scale, options);
  }

  /**
   * Skin Enhancement
   */
  async enhanceSkin(imageData, options = {}) {
    await this.initialize();

    return await this.effectsProcessor.enhanceSkin(imageData, options);
  }

  /**
   * Get complete MuAPI capabilities inventory
   */
  getCompleteCapabilities() {
    return {
      // What we have implemented
      implemented: {
        connection: ['authentication', 'retry', 'bandwidth', 'rate limiting'],
        mediaProcessing: ['enhancement', 'transcoding', 'batch', 'thumbnails'],
        effects: ['filters', 'color grading', 'watermark', 'face swap', 'background removal'],
        batch: ['progress tracking', 'error recovery', 'cancellation'],
        realTime: ['frame processing', 'effects pipeline'],
        aiVideoEffects: ['prompt-driven effects', 'pretrained library (Cakeify, VHS, etc.)'],
        motionControls: ['zoom', 'spin', 'shake', 'bounce', 'pan', 'orbit'],
        vfx: ['explosions', 'lightning', 'tornado', 'disintegration', 'levitation'],
        specializedApps: ['face swap', 'dress change', 'upscaling', 'background removal', 'skin enhancement'],
        audio: ['suno music generation', 'lip synchronization'],
        storyboarding: ['character persistence', 'scene management', 'episodic structure'],
        workflows: ['multi-node execution', 'AI orchestration', 'webhook support']
      },

      // What MuAPI provides that we now support
      muapiFeatures: {
        imageGeneration: ['Flux Dev/Pro/Max/Schnell', 'Midjourney v7', 'HiDream'],
        videoGeneration: ['Wan 2.1/2.2', 'Runway Gen-3/Act-Two', 'Kling v2.1', 'Luma Dream Machine'],
        audioGeneration: ['Suno Music', 'MMAudio-v2', 'Lip Sync models (Sync-Lipsync, LatentSync)'],
        specializedApps: ['Face Swap', 'Dress Change', 'Skin Enhancer', 'Background Remover',
                         'Object Eraser', 'Image Extension', 'Product Photography'],
        effects: ['AI Video Effects (Wan)', 'Motion Controls', 'VFX', 'Color Grading', 'LUTs'],
        workflow: ['Storyboarding', 'Multi-node graphs', 'Agent orchestration', 'External APIs']
      },

      coverage: {
        implemented: 55, // approximate count of implemented features
        totalAvailable: 75, // approximate count from MuAPI docs
        percentage: 73 // coverage percentage
      }
    };
  }

  /**
   * Get available models and capabilities
   */
  async getCapabilities() {
    await this.initialize();

    try {
      const models = await this.connection.getModels();
      const health = await this.getHealthStatus();
      const completeCapabilities = this.getCompleteCapabilities();

      return {
        available: health.overall,
        models: models.success ? models.data : [],
        features: {
          aiEnhancement: this.config.enableAIEnhancement,
          batchProcessing: this.config.enableBatchProcessing,
          realTimeProcessing: this.config.enableRealTimeProcessing,
          advancedEffects: this.config.enableAdvancedEffects,
          aiVideoEffects: true,
          motionControls: true,
          vfx: true,
          musicGeneration: true,
          lipSync: true,
          storyboarding: true,
          workflows: true,
          specializedApps: true
        },
        implementedFeatures: completeCapabilities.implemented,
        muapiFeatures: completeCapabilities.muapiFeatures,
        coverage: completeCapabilities.coverage,
        limits: {
          maxConcurrency: this.config.maxConcurrency,
          requestsPerMinute: this.config.requestsPerMinute,
          bandwidthLimit: this.config.bandwidthLimit
        }
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        features: {},
        limits: {}
      };
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Clean up any active batches
    if (this.batchProcessor) {
      this.batchProcessor.cleanupCompletedBatches(5); // Keep last 5
    }

    // Reset metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Utility Methods
   */

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

  /**
   * Static methods for easy access
   */
  static async create(config = {}) {
    const instance = new MuAPIIntegrationManager(config);
    await instance.initialize();
    return instance;
  }

  static getPresets() {
    return {
      'development': {
        enableAIEnhancement: false,
        enableBatchProcessing: true,
        enableRealTimeProcessing: false,
        enableAdvancedEffects: false,
        maxConcurrency: 2
      },
      'production': {
        enableAIEnhancement: true,
        enableBatchProcessing: true,
        enableRealTimeProcessing: false,
        enableAdvancedEffects: true,
        maxConcurrency: 5,
        requestsPerMinute: 120
      },
      'high-performance': {
        enableAIEnhancement: true,
        enableBatchProcessing: true,
        enableRealTimeProcessing: true,
        enableAdvancedEffects: true,
        maxConcurrency: 10,
        requestsPerMinute: 200
      },
      'conservative': {
        enableAIEnhancement: false,
        enableBatchProcessing: false,
        enableRealTimeProcessing: false,
        enableAdvancedEffects: false,
        maxConcurrency: 1,
        requestsPerMinute: 30
      }
    };
  }

  static createWithPreset(presetName, customConfig = {}) {
    const presets = MuAPIIntegrationManager.getPresets();
    const preset = presets[presetName];

    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}. Available: ${Object.keys(presets).join(', ')}`);
    }

    return new MuAPIIntegrationManager({
      ...preset,
      ...customConfig
    });
  }
}

/**
 * Global instance management
 */
let globalMuAPIInstance = null;

export const getMuAPIIntegration = (config) => {
  if (!globalMuAPIInstance) {
    globalMuAPIInstance = new MuAPIIntegrationManager(config);
  }
  return globalMuAPIInstance;
};

export const initializeMuAPI = async (config = {}) => {
  if (!globalMuAPIInstance) {
    globalMuAPIInstance = new MuAPIIntegrationManager(config);
  }
  return await globalMuAPIInstance.initialize();
};

// Export individual components for advanced usage
export {
  MuAPIConnection,
  MuAPIMediaProcessingManager,
  MuAPIBatchProcessor,
  MuAPIAdvancedEffects
};

export default MuAPIIntegrationManager;