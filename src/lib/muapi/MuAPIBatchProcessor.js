/**
 * MuAPI Batch Processing System
 * Handles large-scale media processing operations with progress tracking,
 * error recovery, and resource management for Open-Higgsfield-AI.
 */

import MuAPIMediaProcessingManager from './MuAPIMediaProcessingManager.js';

export class MuAPIBatchProcessor {
  constructor(config = {}) {
    this.mediaProcessor = config.mediaProcessor || new MuAPIMediaProcessingManager(config);
    this.maxConcurrency = config.maxConcurrency || 3;
    this.maxRetries = config.maxRetries || 3;
    this.progressCallback = config.progressCallback || null;
    this.errorCallback = config.errorCallback || null;
    this.completionCallback = config.completionCallback || null;

    this.activeBatches = new Map();
    this.batchQueue = [];
    this.isProcessing = false;
  }

  /**
   * Create and start a new batch processing job
   */
  async createBatch(files, options = {}) {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const batch = {
      id: batchId,
      files: [...files],
      options,
      status: 'pending',
      progress: {
        total: files.length,
        completed: 0,
        failed: 0,
        current: 0
      },
      results: [],
      errors: [],
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      estimatedTimeRemaining: null
    };

    this.activeBatches.set(batchId, batch);
    this.batchQueue.push(batch);

    // Auto-start if not already processing
    if (!this.isProcessing) {
      this._startProcessing();
    }

    return batchId;
  }

  /**
   * Start processing batches from the queue
   */
  async _startProcessing() {
    if (this.isProcessing || this.batchQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.batchQueue.length > 0) {
      const batch = this.batchQueue.shift();
      if (batch) {
        await this._processBatch(batch);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Process a single batch
   */
  async _processBatch(batch) {
    batch.status = 'processing';
    batch.startedAt = new Date();

    this._notifyProgress(batch);

    try {
      // Process files in concurrent chunks
      const chunks = this._chunkArray(batch.files, this.maxConcurrency);

      for (const chunk of chunks) {
        if (batch.status === 'cancelled') {
          break;
        }

        const promises = chunk.map(async (file, index) => {
          const fileIndex = batch.progress.current + index;
          return this._processFile(batch, file, fileIndex);
        });

        await Promise.allSettled(promises);
        batch.progress.current += chunk.length;
      }

      // Mark batch as completed
      batch.status = batch.progress.failed > 0 ? 'completed_with_errors' : 'completed';
      batch.completedAt = new Date();

    } catch (error) {
      batch.status = 'failed';
      batch.error = error.message;
      batch.completedAt = new Date();

      if (this.errorCallback) {
        this.errorCallback(batch.id, error);
      }
    }

    this._notifyCompletion(batch);
  }

  /**
   * Process a single file within a batch
   */
  async _processFile(batch, file, fileIndex) {
    let attempts = 0;
    let lastError = null;

    while (attempts <= this.maxRetries) {
      try {
        const result = await this.mediaProcessor.processMedia(file, batch.options);

        batch.results[fileIndex] = result;

        if (result.success) {
          batch.progress.completed++;
        } else {
          batch.progress.failed++;
          batch.errors.push({
            file: file,
            index: fileIndex,
            error: result.error
          });
        }

        this._notifyProgress(batch);
        return result;

      } catch (error) {
        lastError = error;
        attempts++;

        if (attempts <= this.maxRetries) {
          // Wait before retry with exponential backoff
          await this._delay(Math.pow(2, attempts) * 1000);
        }
      }
    }

    // All retries failed
    batch.progress.failed++;
    batch.errors.push({
      file: file,
      index: fileIndex,
      error: lastError.message
    });

    this._notifyProgress(batch);
    return { success: false, error: lastError.message };
  }

  /**
   * Cancel a batch processing job
   */
  cancelBatch(batchId) {
    const batch = this.activeBatches.get(batchId);
    if (batch && batch.status === 'processing') {
      batch.status = 'cancelled';
      batch.completedAt = new Date();
      this._notifyCompletion(batch);
      return true;
    }
    return false;
  }

  /**
   * Get batch status and progress
   */
  getBatchStatus(batchId) {
    const batch = this.activeBatches.get(batchId);
    if (!batch) {
      return null;
    }

    const progressPercent = batch.progress.total > 0
      ? (batch.progress.completed + batch.progress.failed) / batch.progress.total * 100
      : 0;

    // Estimate time remaining
    if (batch.startedAt && batch.progress.current > 0) {
      const elapsed = Date.now() - batch.startedAt.getTime();
      const avgTimePerFile = elapsed / (batch.progress.completed + batch.progress.failed);
      const remainingFiles = batch.progress.total - (batch.progress.completed + batch.progress.failed);
      batch.estimatedTimeRemaining = avgTimePerFile * remainingFiles;
    }

    return {
      id: batch.id,
      status: batch.status,
      progress: {
        ...batch.progress,
        percentage: Math.round(progressPercent)
      },
      estimatedTimeRemaining: batch.estimatedTimeRemaining,
      createdAt: batch.createdAt,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt,
      errors: batch.errors.length
    };
  }

  /**
   * Get batch results
   */
  getBatchResults(batchId) {
    const batch = this.activeBatches.get(batchId);
    if (!batch) {
      return null;
    }

    return {
      id: batch.id,
      status: batch.status,
      results: batch.results,
      errors: batch.errors,
      summary: {
        total: batch.progress.total,
        successful: batch.progress.completed,
        failed: batch.progress.failed,
        successRate: batch.progress.total > 0
          ? (batch.progress.completed / batch.progress.total * 100).toFixed(1) + '%'
          : '0%'
      }
    };
  }

  /**
   * Clean up completed batches (keep last N batches for history)
   */
  cleanupCompletedBatches(maxHistory = 10) {
    const activeBatches = Array.from(this.activeBatches.values());
    const completedBatches = activeBatches.filter(batch =>
      ['completed', 'completed_with_errors', 'failed', 'cancelled'].includes(batch.status)
    );

    if (completedBatches.length > maxHistory) {
      completedBatches
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(maxHistory)
        .forEach(batch => this.activeBatches.delete(batch.id));
    }
  }

  /**
   * Utility Methods
   */

  _chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _notifyProgress(batch) {
    if (this.progressCallback) {
      this.progressCallback(batch.id, this.getBatchStatus(batch.id));
    }
  }

  _notifyCompletion(batch) {
    if (this.completionCallback) {
      this.completionCallback(batch.id, this.getBatchResults(batch.id));
    }
  }

  /**
   * Batch processing presets for common use cases
   */
  static getPresets() {
    return {
      'image-batch': {
        maxConcurrency: 5,
        options: {
          enableAIEnhancement: true,
          generateThumbnails: true,
          thumbnailSizes: [
            { width: 150, height: 150 },
            { width: 320, height: 240 },
            { width: 640, height: 480 }
          ]
        }
      },
      'video-batch': {
        maxConcurrency: 2,
        options: {
          enableAIEnhancement: true,
          adaptiveTranscoding: true,
          targetFormats: ['mp4', 'webm']
        }
      },
      'mixed-media': {
        maxConcurrency: 3,
        options: {
          enableAIEnhancement: true,
          generateThumbnails: true,
          adaptiveTranscoding: true
        }
      },
      'quick-process': {
        maxConcurrency: 10,
        options: {
          enableAIEnhancement: false,
          skipPostProcessing: true
        }
      }
    };
  }

  /**
   * Create batch with preset configuration
   */
  async createBatchWithPreset(files, presetName, customOptions = {}) {
    const presets = MuAPIBatchProcessor.getPresets();
    const preset = presets[presetName];

    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`);
    }

    const options = {
      ...preset.options,
      ...customOptions
    };

    const config = {
      ...preset,
      ...customOptions.config
    };

    return await this.createBatch(files, options, config);
  }
}

/**
 * MuAPI Real-Time Processing System
 * Handles live frame-by-frame processing for real-time effects and preview
 */
export class MuAPIRealTimeProcessor {
  constructor(config = {}) {
    this.mediaProcessor = config.mediaProcessor || new MuAPIMediaProcessingManager(config);
    this.frameBuffer = [];
    this.maxBufferSize = config.maxBufferSize || 30; // frames
    this.processingDelay = config.processingDelay || 16; // ~60fps
    this.isProcessing = false;
    this.onFrameProcessed = config.onFrameProcessed || null;
    this.onError = config.onError || null;
  }

  /**
   * Start real-time processing pipeline
   */
  async startRealTimeProcessing(options = {}) {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    // Initialize processing pipeline
    this._initializePipeline(options);

    // Start processing loop
    this._processingLoop();
  }

  /**
   * Stop real-time processing
   */
  stopRealTimeProcessing() {
    this.isProcessing = false;
    this.frameBuffer = [];
  }

  /**
   * Add frame to processing queue
   */
  addFrame(frameData) {
    if (this.frameBuffer.length >= this.maxBufferSize) {
      // Remove oldest frame if buffer is full
      this.frameBuffer.shift();
    }

    this.frameBuffer.push({
      data: frameData,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    });
  }

  /**
   * Apply real-time effects to current frame
   */
  async applyRealTimeEffect(frameData, effectName, parameters = {}) {
    try {
      // Use MuAPI for AI-powered real-time effects
      const processedFrame = await this.mediaProcessor.processFrame(frameData, [effectName]);

      if (this.onFrameProcessed) {
        this.onFrameProcessed(processedFrame, effectName);
      }

      return processedFrame;
    } catch (error) {
      if (this.onError) {
        this.onError(error, effectName);
      }
      return frameData; // Return original frame on error
    }
  }

  /**
   * Get current processing statistics
   */
  getProcessingStats() {
    return {
      isProcessing: this.isProcessing,
      bufferSize: this.frameBuffer.length,
      maxBufferSize: this.maxBufferSize,
      processingDelay: this.processingDelay,
      averageProcessingTime: this._calculateAverageProcessingTime()
    };
  }

  /**
   * Initialize processing pipeline
   */
  _initializePipeline(options) {
    // Set up WebGL context for hardware acceleration if available
    this.canvas = document.createElement('canvas');
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');

    // Initialize effect shaders
    this._setupShaders(options);
  }

  /**
   * Main processing loop
   */
  async _processingLoop() {
    while (this.isProcessing) {
      const startTime = performance.now();

      if (this.frameBuffer.length > 0) {
        const frame = this.frameBuffer.shift();
        await this._processFrame(frame);
      }

      // Maintain target frame rate
      const processingTime = performance.now() - startTime;
      const remainingTime = this.processingDelay - processingTime;

      if (remainingTime > 0) {
        await this._delay(remainingTime);
      }
    }
  }

  /**
   * Process individual frame
   */
  async _processFrame(frame) {
    try {
      // Apply real-time effects using MuAPI
      const processedFrame = await this.mediaProcessor.processFrame(frame.data, ['enhance', 'stabilize']);

      if (this.onFrameProcessed) {
        this.onFrameProcessed(processedFrame, frame.id);
      }

      // Update processing statistics
      this._updateProcessingStats(performance.now() - frame.timestamp);

    } catch (error) {
      if (this.onError) {
        this.onError(error, frame.id);
      }
    }
  }

  /**
   * Set up WebGL shaders for hardware-accelerated effects
   */
  _setupShaders(options) {
    if (!this.gl) return;

    // Basic effect shaders
    this.shaders = {
      enhance: this._createEnhanceShader(),
      stabilize: this._createStabilizeShader(),
      colorGrade: this._createColorGradeShader()
    };
  }

  /**
   * Create enhancement shader
   */
  _createEnhanceShader() {
    // WebGL shader for real-time enhancement
    // This is a simplified example - in production, use more sophisticated shaders
    const vertexShader = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_position * 0.5 + 0.5;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_image;
      varying vec2 v_texCoord;
      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        // Simple enhancement - increase contrast and saturation
        color.rgb = (color.rgb - 0.5) * 1.2 + 0.5;
        gl_FragColor = color;
      }
    `;

    return { vertexShader, fragmentShader };
  }

  _createStabilizeShader() {
    // Stabilization shader would go here
    return { vertexShader: '', fragmentShader: '' };
  }

  _createColorGradeShader() {
    // Color grading shader would go here
    return { vertexShader: '', fragmentShader: '' };
  }

  _calculateAverageProcessingTime() {
    // Calculate rolling average of processing times
    // Implementation would track recent processing times
    return 16; // Placeholder - ~60fps
  }

  _updateProcessingStats(processingTime) {
    // Update rolling statistics
    if (!this.processingStats) {
      this.processingStats = {
        times: [],
        maxSamples: 100
      };
    }

    this.processingStats.times.push(processingTime);
    if (this.processingStats.times.length > this.processingStats.maxSamples) {
      this.processingStats.times.shift();
    }
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Global instances
 */
let batchProcessorInstance = null;
let realTimeProcessorInstance = null;

export const getBatchProcessor = (config) => {
  if (!batchProcessorInstance) {
    batchProcessorInstance = new MuAPIBatchProcessor(config);
  }
  return batchProcessorInstance;
};

export const getRealTimeProcessor = (config) => {
  if (!realTimeProcessorInstance) {
    realTimeProcessorInstance = new MuAPIRealTimeProcessor(config);
  }
  return realTimeProcessorInstance;
};

export default MuAPIBatchProcessor;