/**
 * Asset Import Service
 * Handles importing generated images into the timeline as clips
 */

import { openaiConfig } from './config/openaiConfig.js';

class AssetImportService {
  constructor() {
    this.supportedFormats = ['png', 'jpg', 'jpeg', 'webp'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB limit
  }

  /**
   * Import a generated image into the timeline
   * @param {string} base64Image - Base64 encoded image data
   * @param {Object} metadata - Image metadata (size, format, etc.)
   * @param {Object} timelineState - Current timeline state
   * @param {number} insertPosition - Position to insert the clip (optional)
   * @returns {Object} New clip object
   */
  async importImageToTimeline(base64Image, metadata = {}, timelineState, insertPosition = null) {
    try {
      // Validate the image data
      this.validateImageData(base64Image);

      // Process the image (convert format, optimize if needed)
      const processedImage = await this.processImage(base64Image, metadata);

      // Create timeline clip
      const clip = this.createTimelineClip(processedImage, metadata, timelineState, insertPosition);

      // Add to media library
      await this.addToMediaLibrary(clip, metadata);

      return clip;
    } catch (error) {
      console.error('Failed to import image to timeline:', error);
      throw new Error(`Image import failed: ${error.message}`);
    }
  }

  /**
   * Validate base64 image data
   * @param {string} base64Image - Base64 encoded image
   */
  validateImageData(base64Image) {
    if (!base64Image || typeof base64Image !== 'string') {
      throw new Error('Invalid image data: must be a non-empty string');
    }

    if (!base64Image.startsWith('data:image/')) {
      throw new Error('Invalid image format: must be base64 data URL');
    }

    // Extract and validate base64 content
    const base64Content = base64Image.split(',')[1];
    if (!base64Content) {
      throw new Error('Invalid base64 image data');
    }

    // Check file size (rough estimate)
    const fileSizeBytes = (base64Content.length * 3) / 4;
    if (fileSizeBytes > this.maxFileSize) {
      throw new Error(`Image too large: ${(fileSizeBytes / (1024 * 1024)).toFixed(1)}MB exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`);
    }
  }

  /**
   * Process image for timeline use (format conversion, optimization)
   * @param {string} base64Image - Base64 image data
   * @param {Object} metadata - Image metadata
   * @returns {Object} Processed image data
   */
  async processImage(base64Image, metadata) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Set canvas size to image size
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image to canvas
          ctx.drawImage(img, 0, 0);

          // Determine output format
          const outputFormat = this.determineOutputFormat(metadata.format);

          // Determine quality/compression
          let quality = 0.9; // Default
          if (metadata.output_compression !== undefined && ['image/jpeg', 'image/webp'].includes(outputFormat)) {
            quality = metadata.output_compression / 100; // Convert percentage to 0-1
          }

          // Convert to desired format with specified quality
          const processedBase64 = canvas.toDataURL(outputFormat, quality);

          resolve({
            base64: processedBase64,
            width: img.width,
            height: img.height,
            format: outputFormat,
            size: this.estimateFileSize(processedBase64),
            compression: metadata.output_compression,
            quality: metadata.quality
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64Image;
    });
  }

  /**
   * Determine output format based on metadata
   * @param {string} requestedFormat - Requested format
   * @returns {string} MIME type
   */
  determineOutputFormat(requestedFormat) {
    const formatMap = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp'
    };

    return formatMap[requestedFormat] || 'image/png';
  }

  /**
   * Estimate file size from base64 string
   * @param {string} base64Data - Base64 data
   * @returns {number} Size in bytes
   */
  estimateFileSize(base64Data) {
    const base64Content = base64Data.split(',')[1] || base64Data;
    return (base64Content.length * 3) / 4;
  }

  /**
   * Create a timeline clip from processed image
   * @param {Object} processedImage - Processed image data
   * @param {Object} metadata - Image metadata
   * @param {Object} timelineState - Timeline state
   * @param {number} insertPosition - Insert position
   * @returns {Object} Timeline clip
   */
  createTimelineClip(processedImage, metadata, timelineState, insertPosition) {
    const clipId = this.generateClipId();
    const duration = this.calculateClipDuration(metadata, processedImage);

    // Find the active track or use the first video track
    const targetTrack = this.findTargetTrack(timelineState);

    // Calculate insert position
    const startTime = insertPosition !== null ? insertPosition :
                      this.findNextAvailablePosition(targetTrack, duration);

    const clip = {
      id: clipId,
      type: 'image',
      src: processedImage.base64,
      name: metadata.name || `AI Generated Image ${clipId}`,
      startTime,
      duration,
      endTime: startTime + duration,
      width: processedImage.width,
      height: processedImage.height,
      format: processedImage.format,
      fileSize: processedImage.size,
      trackId: targetTrack.id,

      // AI-specific metadata
      aiGenerated: true,
      generationModel: metadata.model || openaiConfig.getImageModel(),
      prompt: metadata.prompt,
      revisedPrompt: metadata.revisedPrompt,
      generationSettings: {
        size: metadata.size,
        quality: metadata.quality,
        style: metadata.style,
        format: metadata.format
      },
      createdAt: new Date().toISOString(),

      // Timeline properties
      opacity: 1.0,
      scale: 1.0,
      position: { x: 0, y: 0 },
      effects: [],
      transitions: {}
    };

    return clip;
  }

  /**
   * Generate unique clip ID
   * @returns {string} Unique ID
   */
  generateClipId() {
    return `ai-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate appropriate clip duration based on metadata
   * @param {Object} metadata - Image metadata
   * @param {Object} processedImage - Processed image data
   * @returns {number} Duration in seconds
   */
  calculateClipDuration(metadata, processedImage) {
    // Default to 5 seconds for images, can be customized based on use case
    const defaultDuration = 5.0;

    // Adjust based on aspect ratio (taller images might need more time)
    const aspectRatio = processedImage.width / processedImage.height;
    if (aspectRatio < 0.8) { // Portrait orientation
      return defaultDuration * 1.2; // Slightly longer for portrait
    } else if (aspectRatio > 1.3) { // Landscape orientation
      return defaultDuration * 0.9; // Slightly shorter for landscape
    }

    return defaultDuration;
  }

  /**
   * Find the appropriate track for the image clip
   * @param {Object} timelineState - Timeline state
   * @returns {Object} Target track
   */
  findTargetTrack(timelineState) {
    if (!timelineState.tracks || timelineState.tracks.length === 0) {
      throw new Error('No tracks available in timeline');
    }

    // Prefer the first video track, or create a new image track
    const videoTrack = timelineState.tracks.find(track => track.type === 'video');
    if (videoTrack) {
      return videoTrack;
    }

    // Find or create an image track
    let imageTrack = timelineState.tracks.find(track => track.type === 'image');
    if (!imageTrack) {
      // In a real implementation, this would create a new track
      // For now, return the first available track
      return timelineState.tracks[0];
    }

    return imageTrack;
  }

  /**
   * Find the next available position in the track
   * @param {Object} track - Target track
   * @param {number} duration - Clip duration
   * @returns {number} Start time
   */
  findNextAvailablePosition(track, duration) {
    if (!track.clips || track.clips.length === 0) {
      return 0; // Start at beginning
    }

    // Find gaps in the track or append to the end
    const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime);

    // Check for gaps between clips
    for (let i = 0; i < sortedClips.length - 1; i++) {
      const currentClip = sortedClips[i];
      const nextClip = sortedClips[i + 1];
      const gap = nextClip.startTime - currentClip.endTime;

      if (gap >= duration) {
        return currentClip.endTime;
      }
    }

    // No gaps found, append to the end
    const lastClip = sortedClips[sortedClips.length - 1];
    return lastClip.endTime;
  }

  /**
   * Add the clip to the media library
   * @param {Object} clip - Timeline clip
   * @param {Object} metadata - Image metadata
   */
  async addToMediaLibrary(clip, metadata) {
    try {
      // Create media library entry
      const mediaItem = {
        id: clip.id,
        type: 'image',
        name: clip.name,
        src: clip.src,
        thumbnail: clip.src, // Use the image itself as thumbnail
        width: clip.width,
        height: clip.height,
        format: clip.format,
        fileSize: clip.fileSize,
        duration: clip.duration,
        aiGenerated: true,
        tags: ['ai-generated', 'openai', clip.generationModel],
        metadata: {
          ...clip.generationSettings,
          prompt: clip.prompt,
          revisedPrompt: clip.revisedPrompt,
          createdAt: clip.createdAt
        }
      };

      // In a real implementation, this would save to a media library database
      // For now, we'll emit an event or call a callback
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        const event = new CustomEvent('mediaLibrary:addItem', {
          detail: { item: mediaItem }
        });
        window.dispatchEvent(event);
      }

      console.log('Added to media library:', mediaItem);
    } catch (error) {
      console.warn('Failed to add to media library:', error);
      // Don't throw - media library addition is not critical
    }
  }

  /**
   * Batch import multiple images
   * @param {Array} images - Array of {base64, metadata} objects
   * @param {Object} timelineState - Timeline state
   * @returns {Array} Array of created clips
   */
  async batchImport(images, timelineState) {
    const results = [];
    const errors = [];

    for (const image of images) {
      try {
        const clip = await this.importImageToTimeline(
          image.base64,
          image.metadata,
          timelineState
        );
        results.push(clip);
      } catch (error) {
        errors.push({ image, error: error.message });
      }
    }

    return { clips: results, errors };
  }

  /**
   * Get import statistics and recommendations
   * @param {Array} images - Images to analyze
   * @returns {Object} Statistics and recommendations
   */
  getImportAnalysis(images) {
    const stats = {
      totalImages: images.length,
      totalSize: 0,
      formats: {},
      recommendations: []
    };

    images.forEach(image => {
      const size = this.estimateFileSize(image.base64);
      stats.totalSize += size;

      const format = this.extractFormatFromBase64(image.base64);
      stats.formats[format] = (stats.formats[format] || 0) + 1;
    });

    // Generate recommendations
    if (stats.totalSize > 50 * 1024 * 1024) { // 50MB
      stats.recommendations.push('Consider compressing images to reduce total size');
    }

    if (Object.keys(stats.formats).length > 1) {
      stats.recommendations.push('Multiple formats detected - consider standardizing');
    }

    return stats;
  }

  /**
   * Extract format from base64 data URL
   * @param {string} base64Data - Base64 data
   * @returns {string} Format
   */
  extractFormatFromBase64(base64Data) {
    const match = base64Data.match(/^data:image\/(\w+);base64,/);
    return match ? match[1] : 'unknown';
  }
}

// Export singleton instance
export const assetImportService = new AssetImportService();
export default assetImportService;