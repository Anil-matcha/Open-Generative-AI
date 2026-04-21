/**
 * MuAPI Advanced Effects & Post-Processing System
 * Provides comprehensive visual effects, color grading, filters, and AI-powered
 * enhancements for Open-Higgsfield-AI media processing.
 */

import MuAPIConnection, { getMuAPIInstance } from './MuAPIConnection.js';

export class MuAPIAdvancedEffects {
  constructor(config = {}) {
    this.muapi = getMuAPIInstance(config);
    this.effectsCache = new Map();
    this.lutCache = new Map();
    this.webglContext = null;
    this.canvas = null;

    // Initialize WebGL if available
    this._initializeWebGL();
  }

  /**
   * Apply visual filters and effects
   */
  async applyFilter(mediaData, filterName, options = {}) {
    if (!mediaData.url) return mediaData;

    try {
      const filterConfig = this._getFilterConfig(filterName, options);

      if (this._supportsWebGL() && filterConfig.webgl) {
        return await this._applyWebGLEffect(mediaData, filterConfig);
      } else {
        return await this._applyAPIEffect(mediaData, filterName, options);
      }
    } catch (error) {
      console.warn(`Filter ${filterName} failed:`, error.message);
      return mediaData;
    }
  }

  /**
   * Apply multiple filters in sequence
   */
  async applyFilters(mediaData, filters = []) {
    let processedData = mediaData;

    for (const filter of filters) {
      const filterName = typeof filter === 'string' ? filter : filter.name;
      const options = typeof filter === 'object' ? filter : {};

      processedData = await this.applyFilter(processedData, filterName, options);
    }

    return {
      ...processedData,
      appliedFilters: filters
    };
  }

  /**
   * Color grading and LUT application
   */
  async applyColorGrading(mediaData, gradingOptions = {}) {
    try {
      const payload = {
        image_url: mediaData.url,
        grading: {
          brightness: gradingOptions.brightness || 0,
          contrast: gradingOptions.contrast || 0,
          saturation: gradingOptions.saturation || 0,
          hue: gradingOptions.hue || 0,
          temperature: gradingOptions.temperature || 0,
          tint: gradingOptions.tint || 0,
          ...gradingOptions
        }
      };

      const result = await this.muapi._makeRequest('/effects/color-grade', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          ...mediaData,
          url: result.data.url,
          colorGrading: gradingOptions
        };
      }
    } catch (error) {
      console.warn('Color grading failed:', error.message);
    }

    return mediaData;
  }

  /**
   * Apply Look-Up Table (LUT) transformation
   */
  async applyLUT(mediaData, lutData, options = {}) {
    try {
      const cacheKey = this._getLUTCacheKey(lutData);

      if (!this.lutCache.has(cacheKey)) {
        // Upload LUT to MuAPI if not cached
        const lutUpload = await this.muapi.uploadFile(lutData, {
          type: 'lut',
          name: options.name || 'custom-lut'
        });

        if (lutUpload.success) {
          this.lutCache.set(cacheKey, lutUpload.data);
        }
      }

      const cachedLUT = this.lutCache.get(cacheKey);
      if (cachedLUT) {
        const result = await this.muapi._makeRequest('/effects/apply-lut', {
          method: 'POST',
          body: JSON.stringify({
            image_url: mediaData.url,
            lut_url: cachedLUT.url,
            intensity: options.intensity || 1.0
          })
        });

        if (result.success && result.data?.url) {
          return {
            ...mediaData,
            url: result.data.url,
            appliedLUT: lutData.name || 'custom',
            lutIntensity: options.intensity || 1.0
          };
        }
      }
    } catch (error) {
      console.warn('LUT application failed:', error.message);
    }

    return mediaData;
  }

  /**
   * Add watermark overlay
   */
  async addWatermark(mediaData, watermarkOptions = {}) {
    try {
      const payload = {
        media_url: mediaData.url,
        watermark: {
          text: watermarkOptions.text,
          image_url: watermarkOptions.imageUrl,
          position: watermarkOptions.position || 'bottom-right',
          opacity: watermarkOptions.opacity || 0.8,
          size: watermarkOptions.size || 'medium',
          color: watermarkOptions.color || '#ffffff',
          font: watermarkOptions.font || 'Arial',
          ...watermarkOptions
        }
      };

      const result = await this.muapi._makeRequest('/effects/watermark', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          ...mediaData,
          url: result.data.url,
          watermark: watermarkOptions
        };
      }
    } catch (error) {
      console.warn('Watermark addition failed:', error.message);
    }

    return mediaData;
  }

  /**
   * Add border effects
   */
  async addBorder(mediaData, borderOptions = {}) {
    try {
      const payload = {
        media_url: mediaData.url,
        border: {
          style: borderOptions.style || 'solid',
          width: borderOptions.width || 10,
          color: borderOptions.color || '#ffffff',
          radius: borderOptions.radius || 0,
          shadow: borderOptions.shadow || false,
          ...borderOptions
        }
      };

      const result = await this.muapi._makeRequest('/effects/border', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          ...mediaData,
          url: result.data.url,
          border: borderOptions
        };
      }
    } catch (error) {
      console.warn('Border addition failed:', error.message);
    }

    return mediaData;
  }

  /**
   * AI-powered background removal
   */
  async removeBackground(mediaData, options = {}) {
    try {
      const payload = {
        image_url: mediaData.url,
        background_removal: {
          model: options.model || 'u2net',
          threshold: options.threshold || 0.5,
          smooth_edges: options.smoothEdges !== false,
          ...options
        }
      };

      const result = await this.muapi._makeRequest('/effects/remove-background', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          ...mediaData,
          url: result.data.url,
          backgroundRemoved: true,
          backgroundRemovalOptions: options
        };
      }
    } catch (error) {
      console.warn('Background removal failed:', error.message);
    }

    return mediaData;
  }

  /**
   * Face swap functionality
   */
  async faceSwap(sourceImage, targetImage, options = {}) {
    try {
      const payload = {
        source_image: sourceImage.url,
        target_image: targetImage.url,
        face_swap: {
          model: options.model || 'simswap',
          enhance_result: options.enhanceResult !== false,
          keep_target_expression: options.keepTargetExpression || false,
          ...options
        }
      };

      const result = await this.muapi._makeRequest('/effects/face-swap', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          url: result.data.url,
          type: 'image',
          sourceImage: sourceImage,
          targetImage: targetImage,
          faceSwap: true,
          faceSwapOptions: options
        };
      }
    } catch (error) {
      console.warn('Face swap failed:', error.message);
    }

    return null;
  }

  /**
   * Dress change functionality
   */
  async dressChange(personImage, clothingImage, options = {}) {
    try {
      const payload = {
        person_image: personImage.url,
        clothing_image: clothingImage.url,
        dress_change: {
          model: options.model || 'viton',
          category: options.category || 'upper_body',
          preserve_pose: options.preservePose !== false,
          ...options
        }
      };

      const result = await this.muapi._makeRequest('/effects/dress-change', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          url: result.data.url,
          type: 'image',
          personImage: personImage,
          clothingImage: clothingImage,
          dressChange: true,
          dressChangeOptions: options
        };
      }
    } catch (error) {
      console.warn('Dress change failed:', error.message);
    }

    return null;
  }

  /**
   * Generate and apply text overlays
   */
  async addTextOverlay(mediaData, textOptions = {}) {
    try {
      const payload = {
        media_url: mediaData.url,
        text_overlay: {
          text: textOptions.text || '',
          font: textOptions.font || 'Arial',
          size: textOptions.size || 48,
          color: textOptions.color || '#ffffff',
          position: textOptions.position || 'center',
          stroke: textOptions.stroke || false,
          stroke_color: textOptions.strokeColor || '#000000',
          stroke_width: textOptions.strokeWidth || 2,
          shadow: textOptions.shadow || false,
          animation: textOptions.animation || null,
          ...textOptions
        }
      };

      const result = await this.muapi._makeRequest('/effects/text-overlay', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          ...mediaData,
          url: result.data.url,
          textOverlays: [...(mediaData.textOverlays || []), textOptions]
        };
      }
    } catch (error) {
      console.warn('Text overlay failed:', error.message);
    }

    return mediaData;
  }

  /**
   * Video effects and transitions
   */
  async applyVideoEffect(videoData, effectName, options = {}) {
    try {
      const payload = {
        video_url: videoData.url,
        effect: {
          name: effectName,
          parameters: options,
          intensity: options.intensity || 'medium'
        }
      };

      const result = await this.muapi._makeRequest('/effects/video', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          ...videoData,
          url: result.data.url,
          appliedEffects: [...(videoData.appliedEffects || []), {
            name: effectName,
            options: options,
            timestamp: new Date()
          }]
        };
      }
    } catch (error) {
      console.warn(`Video effect ${effectName} failed:`, error.message);
    }

    return videoData;
  }

  /**
   * Batch effects application
   */
  async applyBatchEffects(mediaFiles, effects = []) {
    const results = [];

    for (const mediaData of mediaFiles) {
      let processedData = mediaData;

      for (const effect of effects) {
        if (typeof effect === 'string') {
          processedData = await this.applyFilter(processedData, effect);
        } else {
          const { name, options = {} } = effect;
          if (name === 'color-grade') {
            processedData = await this.applyColorGrading(processedData, options);
          } else if (name === 'watermark') {
            processedData = await this.addWatermark(processedData, options);
          } else if (name === 'text-overlay') {
            processedData = await this.addTextOverlay(processedData, options);
          } else {
            processedData = await this.applyFilter(processedData, name, options);
          }
        }
      }

      results.push(processedData);
    }

    return results;
  }

  /**
   * Utility Methods
   */

  _getFilterConfig(filterName, options) {
    const filterConfigs = {
      'blur': {
        api: true,
        webgl: true,
        parameters: { radius: options.radius || 5 }
      },
      'sharpen': {
        api: true,
        webgl: true,
        parameters: { intensity: options.intensity || 1.0 }
      },
      'denoise': {
        api: true,
        webgl: false,
        parameters: { strength: options.strength || 0.5 }
      },
      'vignette': {
        api: true,
        webgl: true,
        parameters: { amount: options.amount || 0.5, color: options.color || '#000000' }
      },
      'sepia': {
        api: true,
        webgl: true,
        parameters: { intensity: options.intensity || 1.0 }
      },
      'grayscale': {
        api: true,
        webgl: true,
        parameters: {}
      },
      'invert': {
        api: true,
        webgl: true,
        parameters: {}
      }
    };

    return filterConfigs[filterName] || { api: true, webgl: false, parameters: options };
  }

  async _applyAPIEffect(mediaData, filterName, options) {
    const payload = {
      media_url: mediaData.url,
      filter: filterName,
      parameters: options
    };

    const result = await this.muapi._makeRequest('/effects/filter', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (result.success && result.data?.url) {
      return {
        ...mediaData,
        url: result.data.url,
        appliedFilters: [...(mediaData.appliedFilters || []), {
          name: filterName,
          options: options,
          timestamp: new Date()
        }]
      };
    }

    return mediaData;
  }

  async _applyWebGLEffect(mediaData, filterConfig) {
    // WebGL-based effect processing would go here
    // This is a placeholder for hardware-accelerated effects
    return await this._applyAPIEffect(mediaData, filterConfig.name, filterConfig.parameters);
  }

  _initializeWebGL() {
    try {
      this.canvas = document.createElement('canvas');
      this.webglContext = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    } catch (error) {
      console.warn('WebGL initialization failed:', error.message);
      this.webglContext = null;
    }
  }

  _supportsWebGL() {
    return !!this.webglContext;
  }

  _getLUTCacheKey(lutData) {
    return `${lutData.name || 'unnamed'}_${lutData.size || 'unknown'}`;
  }

  /**
   * Apply AI Video Effects (Wan AI Effects)
   */
  async applyAIVideoEffect(videoData, options = {}) {
    const payload = {
      prompt: options.prompt || 'apply cinematic video effect',
      image_url: videoData.url,
      name: options.effectName || 'Cakeify',
      aspect_ratio: options.aspectRatio || '16:9',
      resolution: options.resolution || '480p',
      quality: options.quality || 'medium',
      duration: options.duration || 5
    };

    const result = await this.muapi._makeRequest('/api/v1/generate_wan_ai_effects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (result.success && result.data?.request_id) {
      return await this.pollForResult(result.data.request_id);
    }
    return videoData;
  }

  /**
   * Apply Motion Controls
   */
  async applyMotionControl(mediaData, motionType, options = {}) {
    const motionEffects = {
      zoom: 'Zoom In/Out',
      spin: '360 Spin',
      shake: 'Camera Shake',
      bounce: 'Bounce Effect',
      pan: 'Pan Movement',
      orbit: '360 Orbit'
    };

    const payload = {
      prompt: options.prompt || `apply ${motionType} motion effect`,
      image_url: mediaData.url,
      name: motionEffects[motionType] || 'Custom Motion',
      aspect_ratio: options.aspectRatio || '16:9',
      resolution: options.resolution || '480p',
      quality: options.quality || 'medium',
      duration: options.duration || 5
    };

    const result = await this.muapi._makeRequest('/api/v1/generate_wan_ai_effects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (result.success && result.data?.request_id) {
      return await this.pollForResult(result.data.request_id);
    }
    return mediaData;
  }

  /**
   * Apply VFX Effects
   */
  async applyVFX(mediaData, vfxType, options = {}) {
    const vfxEffects = {
      explosion: 'Building Explosion',
      lightning: 'Lightning Effect',
      tornado: 'Tornado Force',
      disintegration: 'Disintegrate',
      levitation: 'Levitation',
      particles: 'Particle System'
    };

    const payload = {
      prompt: options.prompt || `add ${vfxType} visual effect`,
      image_url: mediaData.url,
      name: vfxEffects[vfxType] || 'Custom VFX',
      aspect_ratio: options.aspectRatio || '16:9',
      resolution: options.resolution || '480p',
      quality: options.quality || 'medium',
      duration: options.duration || 5
    };

    const result = await this.muapi._makeRequest('/api/v1/generate_wan_ai_effects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (result.success && result.data?.request_id) {
      return await this.pollForResult(result.data.request_id);
    }
    return mediaData;
  }

  /**
   * Generate Music with Suno
   */
  async generateMusic(prompt, options = {}) {
    const payload = {
      prompt: prompt,
      duration: options.duration || 30,
      genre: options.genre || 'electronic',
      mood: options.mood,
      instruments: options.instruments,
      ...options
    };

    const result = await this.muapi._makeRequest('/api/v1/suno-create-music', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (result.success && result.data?.request_id) {
      return await this.pollForResult(result.data.request_id);
    }
    return null;
  }

  /**
   * Lip Synchronization
   */
  async lipSync(videoData, audioData, options = {}) {
    const payload = {
      video_url: videoData.url,
      audio_url: audioData.url,
      model: options.model || 'sync-lipsync',
      enhance_audio: options.enhanceAudio !== false,
      ...options
    };

    const result = await this.muapi._makeRequest('/api/v1/sync-lipsync', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (result.success && result.data?.request_id) {
      return await this.pollForResult(result.data.request_id);
    }
    return videoData;
  }

  /**
   * Create Storyboard
   */
  async createStoryboard(projectData, options = {}) {
    const payload = {
      project_name: projectData.name,
      characters: projectData.characters,
      episodes: projectData.episodes,
      scenes: projectData.scenes,
      shots: projectData.shots,
      ...options
    };

    const result = await this.muapi._makeRequest('/api/storyboard/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (result.success && result.data?.request_id) {
      return await this.pollForResult(result.data.request_id);
    }
    return null;
  }

  /**
   * Execute Workflow
   */
  async executeWorkflow(workflowData, options = {}) {
    const payload = {
      workflow_id: workflowData.id,
      inputs: workflowData.inputs,
      webhook_url: options.webhookUrl,
      ...options
    };

    const result = await this.muapi._makeRequest(`/api/workflow/${workflowData.id}/run`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (result.success && result.data?.request_id) {
      return await this.pollForResult(result.data.request_id);
    }
    return null;
  }

  /**
   * Poll for async results
   */
  async pollForResult(requestId, maxAttempts = 60, interval = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.muapi._makeRequest(`/api/v1/predictions/${requestId}/result`);

        if (result.success && result.data) {
          const status = result.data.status;
          if (status === 'completed') {
            return {
              success: true,
              data: result.data,
              outputs: result.data.outputs,
              url: result.data.outputs?.[0]
            };
          } else if (status === 'failed') {
            return {
              success: false,
              error: result.data.error || 'Processing failed'
            };
          }
        }
      } catch (error) {
        console.warn(`Polling attempt ${attempt + 1} failed:`, error.message);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return {
      success: false,
      error: 'Polling timeout exceeded'
    };
  }

  /**
   * Apply preset effects collections (Enhanced)
   */
  static getPresets() {
    return {
      // Original presets
      'vintage-film': [
        'sepia',
        { name: 'color-grade', options: { contrast: 0.2, saturation: -0.1 } },
        { name: 'vignette', options: { amount: 0.3 } }
      ],
      'cyberpunk': [
        { name: 'color-grade', options: { saturation: 0.3, temperature: 2000 } },
        'sharpen',
        { name: 'vignette', options: { amount: 0.2, color: '#00ffff' } }
      ],
      'moody-drama': [
        { name: 'color-grade', options: { contrast: 0.3, brightness: -0.1 } },
        'blur',
        { name: 'vignette', options: { amount: 0.4 } }
      ],
      'clean-minimal': [
        'sharpen',
        { name: 'color-grade', options: { contrast: 0.1, saturation: -0.1 } }
      ],
      'vibrant-social': [
        { name: 'color-grade', options: { saturation: 0.2, contrast: 0.1 } },
        'sharpen'
      ],
      // New AI-powered presets using MuAPI advanced features
      'cinematic-vfx': [
        { name: 'applyVFX', vfxType: 'explosion' },
        { name: 'applyMotionControl', motionType: 'shake' },
        { name: 'color-grade', options: { contrast: 0.4, saturation: 0.1 } }
      ],
      'character-animation': [
        { name: 'applyAIVideoEffect', effectName: 'animal' },
        { name: 'applyMotionControl', motionType: 'bounce' },
        'sharpen'
      ],
      'hollywood-blockbuster': [
        { name: 'applyVFX', vfxType: 'lightning' },
        { name: 'applyMotionControl', motionType: 'orbit' },
        { name: 'color-grade', options: { contrast: 0.3, temperature: 2500 } }
      ]
    };
  }

  /**
   * Apply preset effect collection
   */
  async applyPreset(mediaData, presetName, customOptions = {}) {
    const presets = MuAPIAdvancedEffects.getPresets();
    const preset = presets[presetName];

    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`);
    }

    return await this.applyFilters(mediaData, preset);
  }
}

  /**
   * Upscale image using AI/ML models
   */
  async upscaleImage(imageData, scale = 2, options = {}) {
    try {
      const payload = {
        image_url: imageData.url,
        upscale: {
          scale: Math.min(Math.max(scale, 1), 4), // Limit to reasonable range
          method: options.method || 'ai',
          model: options.model || 'esrgan',
          enhance_details: options.enhanceDetails !== false,
          ...options
        }
      };

      const result = await this.muapi._makeRequest('/effects/upscale', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          ...imageData,
          url: result.data.url,
          upscaled: true,
          upscaleOptions: { scale, ...options }
        };
      }
    } catch (error) {
      console.warn('Image upscaling failed:', error.message);
      // Return original image data for graceful degradation
      return {
        ...imageData,
        upscaled: false,
        upscaleError: error.message
      };
    }

    return imageData;
  }

  /**
   * Upscale video using AI/ML models
   */
  async upscaleVideo(videoData, scale = 2, options = {}) {
    try {
      const payload = {
        video_url: videoData.url,
        upscale: {
          scale: Math.min(Math.max(scale, 1), 2), // Video upscale is more limited
          method: options.method || 'ai',
          model: options.model || 'topaz-video',
          frame_interpolation: options.frameInterpolation || false,
          ...options
        }
      };

      const result = await this.muapi._makeRequest('/effects/upscale-video', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          ...videoData,
          url: result.data.url,
          upscaled: true,
          upscaleOptions: { scale, ...options }
        };
      }
    } catch (error) {
      console.warn('Video upscaling failed:', error.message);
      // Return original video data for graceful degradation
      return {
        ...videoData,
        upscaled: false,
        upscaleError: error.message
      };
    }

    return videoData;
  }

  /**
   * Apply video color correction
   */
  async applyVideoColorCorrection(videoData, options = {}) {
    try {
      const payload = {
        video_url: videoData.url,
        color_correction: {
          brightness: options.brightness || 0,
          contrast: options.contrast || 0,
          saturation: options.saturation || 0,
          hue: options.hue || 0,
          temperature: options.temperature || 0,
          tint: options.tint || 0,
          ...options
        }
      };

      const result = await this.muapi._makeRequest('/effects/color-correct-video', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          ...videoData,
          url: result.data.url,
          colorCorrected: true,
          colorCorrectionOptions: options
        };
      }
    } catch (error) {
      console.warn('Video color correction failed:', error.message);
    }

    return videoData;
  }

  /**
   * Apply multiple video effects in sequence
   */
  async applyVideoEffects(videoData, effects = []) {
    let processedData = videoData;

    for (const effect of effects) {
      const effectName = typeof effect === 'string' ? effect : effect.name;
      const options = typeof effect === 'object' ? effect : {};

      switch (effectName) {
        case 'stabilize':
          processedData = await this.applyVideoStabilization(processedData, options);
          break;
        case 'denoise':
          processedData = await this.applyVideoDenoise(processedData, options);
          break;
        case 'color-correct':
          processedData = await this.applyVideoColorCorrection(processedData, options);
          break;
        case 'upscale':
          processedData = await this.upscaleVideo(processedData, options.scale || 2, options);
          break;
        default:
          console.warn(`Unknown video effect: ${effectName}`);
      }
    }

    return {
      ...processedData,
      appliedEffects: effects
    };
  }

  /**
   * Compress and optimize video
   */
  async compressVideo(videoData, options = {}) {
    try {
      const payload = {
        video_url: videoData.url,
        compression: {
          quality: options.quality || 'medium',
          format: options.format || 'mp4',
          bitrate: options.bitrate || 'auto',
          resolution: options.resolution || 'original',
          ...options
        }
      };

      const result = await this.muapi._makeRequest('/effects/compress-video', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          ...videoData,
          url: result.data.url,
          compressed: true,
          compressionOptions: options,
          originalSize: videoData.size,
          compressedSize: result.data.size
        };
      }
    } catch (error) {
      console.warn('Video compression failed:', error.message);
    }

    return videoData;
  }

  /**
   * Apply video stabilization
   */
  async applyVideoStabilization(videoData, options = {}) {
    try {
      const payload = {
        video_url: videoData.url,
        stabilization: {
          method: options.method || 'optical-flow',
          smoothing: options.smoothing || 0.5,
          crop_to_stable: options.cropToStable !== false,
          ...options
        }
      };

      const result = await this.muapi._makeRequest('/effects/stabilize-video', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          ...videoData,
          url: result.data.url,
          stabilized: true,
          stabilizationOptions: options
        };
      }
    } catch (error) {
      console.warn('Video stabilization failed:', error.message);
    }

    return videoData;
  }

  /**
   * Apply video denoising
   */
  async applyVideoDenoise(videoData, options = {}) {
    try {
      const payload = {
        video_url: videoData.url,
        denoise: {
          strength: options.strength || 0.5,
          method: options.method || 'temporal',
          preserve_details: options.preserveDetails !== false,
          ...options
        }
      };

      const result = await this.muapi._makeRequest('/effects/denoise-video', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success && result.data?.url) {
        return {
          ...videoData,
          url: result.data.url,
          denoised: true,
          denoiseOptions: options
        };
      }
    } catch (error) {
      console.warn('Video denoising failed:', error.message);
    }

    return videoData;
  }

  /**
   * Optimize processing for different file sizes
   */
  async optimizeProcessing(mediaData, options = {}) {
    const fileSize = mediaData.size || 0;

    // For large files, apply preprocessing optimizations
    if (fileSize > 100 * 1024 * 1024) { // > 100MB
      console.log('Large file detected, applying preprocessing optimizations');
      options.preprocess = true;
      options.chunked = true;
    }

    return options;
  }

  /**
   * Process large files with memory management
   */
  async processLargeFile(mediaData, options = {}) {
    try {
      // Implement chunked processing for large files
      const chunkSize = options.chunkSize || 50 * 1024 * 1024; // 50MB chunks
      const totalSize = mediaData.size || 0;

      if (totalSize <= chunkSize) {
        // Process normally
        return await this.applyFilter(mediaData, 'optimize', options);
      }

      // For very large files, we'd implement chunked processing here
      // For now, return as-is with a warning
      console.warn('Large file processing not fully implemented yet');
      return mediaData;

    } catch (error) {
      console.warn('Large file processing failed:', error.message);
      return mediaData;
    }
  }

  /**
   * Implement caching for repeated operations
   */
  async getCachedResult(cacheKey, operation, ttl = 3600000) { // 1 hour default
    const cached = this.effectsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < ttl) {
      return cached.result;
    }

    const result = await operation();
    this.effectsCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    return result;
  }

/**
 * Global instance
 */
let advancedEffectsInstance = null;

export const getAdvancedEffects = (config) => {
  if (!advancedEffectsInstance) {
    advancedEffectsInstance = new MuAPIAdvancedEffects(config);
  }
  return advancedEffectsInstance;
};

export default MuAPIAdvancedEffects;