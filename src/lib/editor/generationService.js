/* global FileReader */

/**
 * Generation Service
 * Unified abstraction layer for AI video generation
 * Combines LTX-Desktop generation logic with web-compatible API calls
 */

import { GenerationModes, GenerationProviders, createDefaultProject } from './types.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
  ltx: {
    baseUrl: 'http://localhost:8000',
    timeout: 300000, // 5 minutes
  },
  fal: {
    baseUrl: 'https://queue.fal.run',
    timeout: 300000,
  },
  seedance: {
    baseUrl: 'https://api.seedance.com',
    timeout: 300000,
  },
  veo: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    timeout: 300000,
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    timeout: 120000, // 2 minutes
    model: 'gemini-1.5-flash', // or pro for better quality
  },
};

// ============================================================================
// GENERATION REQUEST/RESULT
// ============================================================================

/**
 * @typedef {Object} GenerationRequest
 * @property {'text-to-video' | 'image-to-video' | 'audio-to-video' | 'retake' | 'extend' | 'broll' | 'variation'} mode
 * @property {string} prompt
 * @property {string} [negativePrompt]
 * @property {number} [duration]
 * @property {string} [aspectRatio]
 * @property {number} [fps]
 * @property {string[]} [references]
 * @property {string} [sourceAssetId]
 * @property {string} [selectedClipId]
 * @property {Object} [selectedRange]
 * @property {number} [selectedRange.start]
 * @property {number} [selectedRange.end]
 * @property {string} [stylePreset]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} GenerationResult
 * @property {string} generationId
 * @property {'queued' | 'processing' | 'completed' | 'failed'} status
 * @property {string[]} [assetIds]
 * @property {string} [previewUrl]
 * @property {string} [error]
 * @property {Object} [metadata]
 */

// ============================================================================
// LTX PROVIDER
// ============================================================================

/**
 * LTX Video Generation Provider
 * Implements generation using LTX-Desktop backend API
 */
class LtxProvider {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG.ltx, ...config };
    this.baseUrl = this.config.baseUrl;
    this.timeout = this.config.timeout;
  }

  /**
   * Submit a generation request
   * @param {GenerationRequest} request
   * @returns {Promise<GenerationResult>}
   */
  async submit(request) {
    // Input validation
    if (!request || typeof request !== 'object') {
      throw new Error('Invalid request: must be an object');
    }
    if (!request.mode || !['text-to-video', 'image-to-video', 'audio-to-video', 'retake', 'extend', 'broll', 'variation'].includes(request.mode)) {
      throw new Error('Invalid mode: must be one of text-to-video, image-to-video, audio-to-video, retake, extend, broll, variation');
    }
    if (!request.prompt || typeof request.prompt !== 'string' || request.prompt.trim().length === 0) {
      throw new Error('Invalid prompt: must be a non-empty string');
    }
    if (request.prompt.length > 1000) {
      throw new Error('Prompt too long: maximum 1000 characters');
    }

    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[LtxProvider] Starting generation ${generationId} for mode: ${request.mode}`);

    try {
      let endpoint = '';
      let body = {};

      switch (request.mode) {
        case 'text-to-video':
          endpoint = '/api/generate';
          body = {
            prompt: request.prompt,
            negative_prompt: request.negativePrompt || '',
            duration: request.duration || 5,
            aspect_ratio: request.aspectRatio || '16:9',
            fps: request.fps || 24,
            style_preset: request.stylePreset || 'cinematic',
          };
          break;

        case 'image-to-video':
          endpoint = '/api/i2v';
          body = {
            prompt: request.prompt,
            negative_prompt: request.negativePrompt || '',
            image_path: request.references?.[0] || '',
            duration: request.duration || 5,
            aspect_ratio: request.aspectRatio || '16:9',
            fps: request.fps || 24,
          };
          break;

        case 'retake':
          endpoint = '/api/retake';
          body = {
            prompt: request.prompt,
            negative_prompt: request.negativePrompt || '',
            source_video_path: request.sourceAssetId || '',
            start_time: request.selectedRange?.start || 0,
            end_time: request.selectedRange?.end || 0,
            duration: request.duration || 5,
            style_preset: request.stylePreset || 'cinematic',
          };
          break;

        case 'extend':
          endpoint = '/api/extend';
          body = {
            prompt: request.prompt,
            source_video_path: request.sourceAssetId || '',
            extend_duration: request.duration || 5,
          };
          break;

        case 'broll':
          endpoint = '/api/generate';
          body = {
            prompt: request.prompt,
            negative_prompt: request.negativePrompt || '',
            duration: request.duration || 3,
            aspect_ratio: request.aspectRatio || '16:9',
            style_preset: 'broll',
          };
          break;

        default:
          throw new Error(`Unsupported generation mode: ${request.mode}`);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Generation failed: ${error}`);
      }

      const result = await response.json();

      return {
        generationId,
        status: 'queued',
        previewUrl: result.preview_url || result.output_path || null,
        metadata: result,
      };
    } catch (error) {
      return {
        generationId,
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Poll for generation status
   * @param {string} generationId
   * @returns {Promise<GenerationResult>}
   */
  async poll(generationId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/status/${generationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        generationId,
        status: result.status || 'processing',
        previewUrl: result.preview_url || result.output_path || null,
        assetIds: result.asset_ids || [],
        error: result.error || null,
        metadata: result,
      };
    } catch (error) {
      console.error(`[LtxProvider] Generation ${generationId} failed:`, error);
      return {
        generationId,
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Cancel a generation job
   * @param {string} generationId
   */
  async cancel(generationId) {
    await fetch(`${this.baseUrl}/api/cancel/${generationId}`, {
      method: 'POST',
    });
  }
}

// ============================================================================
// FAL PROVIDER (Alternative)
// ============================================================================

class FalProvider {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG.fal, ...config };
    this.baseUrl = this.config.baseUrl;
    this.timeout = this.config.timeout;
    this.apiKey = config.apiKey || '';
  }

  async submit(request) {
    const generationId = `fal_${Date.now()}`;

    try {
      const response = await fetch(`${this.baseUrl}/ltx-production/t2v`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          negative_prompt: request.negativePrompt,
          duration: Math.min(request.duration || 5, 10),
          aspect_ratio: request.aspectRatio || '16:9',
        }),
      });

      if (!response.ok) {
        throw new Error(`FAL API error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        generationId,
        status: 'queued',
        previewUrl: result.request_id,
        metadata: result,
      };
    } catch (error) {
      return {
        generationId,
        status: 'failed',
        error: error.message,
      };
    }
  }

  async poll(generationId) {
    try {
      const response = await fetch(`${this.baseUrl}/ltx-production/requests/${generationId}`, {
        headers: {
          'Authorization': `Key ${this.apiKey}`,
        },
      });

      const result = await response.json();

      return {
        generationId,
        status: result.status === 'COMPLETED' ? 'completed' : result.status === 'FAILED' ? 'failed' : 'processing',
        previewUrl: result.output?.video_url || null,
        error: result.error || null,
      };
    } catch (error) {
      return {
        generationId,
        status: 'failed',
        error: error.message,
      };
    }
  }
}

// ============================================================================
// GEMINI PROVIDER (Comprehensive AI Integration)
// ============================================================================

// Helper to convert Blob to Base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      // Remove data url prefix if present (e.g. "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Audio decoding helpers
function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data, ctx, sampleRate, numChannels) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

class GeminiProvider {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG.gemini, ...config };
    this.baseUrl = this.config.baseUrl;
    this.timeout = this.config.timeout;
    this.apiKey = config.apiKey || '';
    this.model = this.config.model;
  }

  async getApiKey() {
    const win = window;
    if (win.aistudio && win.aistudio.getSelectedApiKey) {
      const key = await win.aistudio.getSelectedApiKey();
      if (key) return key;
    }
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) return stored;
    return '';
  }

  async getAiClient() {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('No API key configured. Please add your Google AI API key.');
    }
    // For this implementation, we'll use fetch directly since @google/genai may not be available
    return { apiKey, baseUrl: this.baseUrl };
  }

  async checkApiKey() {
    const win = window;
    if (win.aistudio && win.aistudio.hasSelectedApiKey) {
      return await win.aistudio.hasSelectedApiKey();
    }
    const stored = localStorage.getItem('gemini_api_key');
    return !!stored;
  }

  async openKeySelection() {
    const win = window;
    if (win.aistudio && win.aistudio.openSelectKey) {
      await win.aistudio.openSelectKey();
    } else {
      const key = prompt('Enter your Google AI API key:\n\nGet one at: https://aistudio.google.com/apikey');
      if (key) {
        localStorage.setItem('gemini_api_key', key);
      }
    }
  }

  // Image Generation (Imagen)
  async generateImage(request) {
    const generationId = `gemini_img_${Date.now()}`;

    try {
      const { apiKey } = await this.getAiClient();
      const aspectRatio = request.aspectRatio || '1:1';

      // Use Imagen API for image generation
      const response = await fetch(`${this.baseUrl}/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          sampleCount: 1,
          aspectRatio: aspectRatio,
        }),
      });

      if (!response.ok) {
        throw new Error(`Imagen API error: ${response.statusText}`);
      }

      const result = await response.json();
      const imageUrl = result.predictions[0]?.bytesBase64Encoded;

      return {
        generationId,
        status: 'completed',
        assetIds: [generationId],
        previewUrl: `data:image/jpeg;base64,${imageUrl}`,
        metadata: result,
      };
    } catch (error) {
      return {
        generationId,
        status: 'failed',
        error: error.message,
      };
    }
  }

  // Image Editing
  async editImage(imageBlob, prompt) {
    const generationId = `gemini_edit_${Date.now()}`;

    try {
      const { apiKey } = await this.getAiClient();
      const base64Data = await blobToBase64(imageBlob);

      const response = await fetch(`${this.baseUrl}/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: imageBlob.type,
                },
              },
              {
                text: prompt,
              },
            ],
          }],
          generationConfig: {
            responseModalities: ['image'],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const result = await response.json();
      const imagePart = result.candidates[0]?.content?.parts?.find(p => p.inlineData);
      if (imagePart) {
        const imageData = `data:image/png;base64,${imagePart.inlineData.data}`;
        return {
          generationId,
          status: 'completed',
          assetIds: [generationId],
          previewUrl: imageData,
          metadata: result,
        };
      } else {
        throw new Error('No image generated in response');
      }
    } catch (error) {
      return {
        generationId,
        status: 'failed',
        error: error.message,
      };
    }
  }

  // Video Generation (Veo)
  async generateVideo(request) {
    const generationId = `gemini_video_${Date.now()}`;

    try {
      const { apiKey } = await this.getAiClient();
      const aspectRatio = request.aspectRatio || '16:9';
      const body = {
        prompt: request.prompt,
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      };

      if (request.references && request.references[0]) {
        // Image-to-video
        const imageBlob = await fetch(request.references[0]).then(r => r.blob());
        const base64Data = await blobToBase64(imageBlob);
        body.image = {
          imageBytes: base64Data,
          mimeType: imageBlob.type,
        };
      }

      const response = await fetch(`${this.baseUrl}/v1beta/models/veo-3.1-fast-generate-preview:predict?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Veo API error: ${response.statusText}`);
      }

      const result = await response.json();
      const operationId = result.name;

      // Poll for completion
      let attempts = 0;
      while (attempts < 60) { // Max 5 minutes
        await new Promise(resolve => setTimeout(resolve, 5000));
        const pollResponse = await fetch(`${this.baseUrl}/v1beta/${operationId}?key=${apiKey}`);
        const pollResult = await pollResponse.json();

        if (pollResult.done) {
          if (pollResult.response && pollResult.response.generatedVideos) {
            const videoUrl = pollResult.response.generatedVideos[0].video.uri;
            return {
              generationId,
              status: 'completed',
              assetIds: [generationId],
              previewUrl: videoUrl,
              metadata: pollResult,
            };
          } else {
            throw new Error('Video generation failed');
          }
        }
        attempts++;
      }

      throw new Error('Video generation timeout');
    } catch (error) {
      return {
        generationId,
        status: 'failed',
        error: error.message,
      };
    }
  }

  // Text to Speech
  async generateSpeech(text) {
    const generationId = `tts_${Date.now()}`;

    try {
      const { apiKey } = await this.getAiClient();

      const response = await fetch(`${this.baseUrl}/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text }],
          }],
          generationConfig: {
            responseModalities: ['audio'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      const result = await response.json();
      const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error('No audio generated');

      const outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        outputAudioContext,
        24000,
        1,
      );

      return {
        generationId,
        status: 'completed',
        assetIds: [generationId],
        previewUrl: 'audio-generated',
        metadata: { audioBuffer },
      };
    } catch (error) {
      return {
        generationId,
        status: 'failed',
        error: error.message,
      };
    }
  }

  // Submit method for compatibility
  async submit(request) {
    switch (request.mode) {
      case 'generate-image':
        return this.generateImage(request);
      case 'remove-background':
      case 'replace-bg':
      case 'enhance':
      case 'colorize':
      case 'cartoon':
        // For image editing, we need the image file
        if (request.references && request.references[0]) {
          const imageBlob = await fetch(request.references[0]).then(r => r.blob());
          return this.editImage(imageBlob, request.prompt || request.defaultPrompt);
        }
        return {
          generationId: `gemini_${Date.now()}`,
          status: 'failed',
          error: 'Image required for editing',
        };
      case 'generate-video':
        return this.generateVideo(request);
      case 'text-to-speech':
        return this.generateSpeech(request.text || request.prompt);
      default:
        return {
          generationId: `gemini_${Date.now()}`,
          status: 'failed',
          error: `Unsupported mode: ${request.mode}`,
        };
    }
  }

  async poll(generationId) {
    // For most Gemini operations, they're synchronous
    return {
      generationId,
      status: 'completed',
      previewUrl: null,
    };
  }
}

// ============================================================================
// GENERATION SERVICE
// ============================================================================

/**
 * Unified Generation Service
 * Manages multiple providers and handles job lifecycle
 */
class GenerationService {
  constructor() {
    this.providers = {
      ltx: new LtxProvider(),
      fal: new FalProvider(),
      gemini: new GeminiProvider(),
    };
    this.activeJobs = new Map();
    this.listeners = new Map();
  }

  /**
   * Set provider configuration
   * @param {'ltx' | 'fal' | 'gemini'} name
   * @param {Object} config
   */
  configureProvider(name, config) {
    if (name === 'ltx') {
      this.providers.ltx = new LtxProvider(config);
    } else if (name === 'fal') {
      this.providers.fal = new FalProvider(config);
    } else if (name === 'gemini') {
      this.providers.gemini = new GeminiProvider(config);
    }
  }

  /**
   * Get available providers
   * @returns {string[]}
   */
  getAvailableProviders() {
    return Object.keys(this.providers);
  }

  /**
   * Submit a generation job
   * @param {GenerationRequest} request
   * @param {'ltx' | 'fal' | 'gemini'} [provider]
   * @returns {Promise<GenerationResult>}
   */
  async submit(request, provider = 'ltx') {
    const providerInstance = this.providers[provider];
    if (!providerInstance) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const result = await providerInstance.submit(request);

    if (result.status !== 'failed') {
      this.activeJobs.set(result.generationId, {
        request,
        provider,
        status: result.status,
        createdAt: Date.now(),
      });

      this.emit('job-created', {
        generationId: result.generationId,
        provider,
        mode: request.mode,
      });
    }

    return result;
  }

  /**
   * Poll for job status
   * @param {string} generationId
   * @returns {Promise<GenerationResult>}
   */
  async poll(generationId) {
    const job = this.activeJobs.get(generationId);
    if (!job) {
      throw new Error(`Unknown job: ${generationId}`);
    }

    const provider = this.providers[job.provider];
    const result = await provider.poll(generationId);

    this.activeJobs.set(generationId, {
      ...job,
      status: result.status,
    });

    if (result.status === 'completed' || result.status === 'failed') {
      this.emit('job-completed', {
        generationId,
        status: result.status,
        result,
      });
    } else {
      this.emit('job-progress', {
        generationId,
        status: result.status,
        result,
      });
    }

    return result;
  }

  /**
   * Start polling for a job
   * @param {string} generationId
   * @param {Function} onUpdate
   * @param {number} interval
   */
  startPolling(generationId, onUpdate, interval = 2000) {
    const poll = async () => {
      const result = await this.poll(generationId);
      onUpdate(result);

      if (result.status === 'processing' || result.status === 'queued') {
        setTimeout(poll, interval);
      }
    };

    setTimeout(poll, interval);
  }

  /**
   * Cancel a job
   * @param {string} generationId
   */
  async cancel(generationId) {
    const job = this.activeJobs.get(generationId);
    if (!job) {
      throw new Error(`Unknown job: ${generationId}`);
    }

    const provider = this.providers[job.provider];
    if (provider.cancel) {
      await provider.cancel(generationId);
    }

    this.activeJobs.delete(generationId);
    this.emit('job-cancelled', { generationId });
  }

  /**
   * Get all active jobs
   * @returns {Object[]}
   */
  getActiveJobs() {
    return Array.from(this.activeJobs.entries()).map(([id, job]) => ({
      generationId: id,
      ...job,
    }));
  }

  /**
   * Clear completed/failed jobs
   */
  clearCompletedJobs() {
    for (const [id, job] of this.activeJobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        this.activeJobs.delete(id);
      }
    }
  }

  /**
   * Add event listener
   * @param {string} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   * @param {string} event
   * @param {Object} data
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }
}

// ============================================================================
// CONVENIENCE METHODS
// ============================================================================

/**
 * Create a text-to-video request
 * @param {string} prompt
 * @param {Object} options
 * @returns {GenerationRequest}
 */
export function createTextToVideoRequest(prompt, options = {}) {
  return {
    mode: 'text-to-video',
    prompt,
    negativePrompt: options.negativePrompt,
    duration: options.duration,
    aspectRatio: options.aspectRatio,
    fps: options.fps,
    stylePreset: options.stylePreset,
    metadata: options.metadata,
  };
}

/**
 * Create an image-to-video request
 * @param {string} imageUrl
 * @param {string} prompt
 * @param {Object} options
 * @returns {GenerationRequest}
 */
export function createImageToVideoRequest(imageUrl, prompt, options = {}) {
  return {
    mode: 'image-to-video',
    prompt,
    negativePrompt: options.negativePrompt,
    references: [imageUrl],
    duration: options.duration,
    aspectRatio: options.aspectRatio,
    fps: options.fps,
    stylePreset: options.stylePreset,
    metadata: options.metadata,
  };
}

/**
 * Create a retake request
 * @param {string} sourceAssetId
 * @param {string} prompt
 * @param {Object} range
 * @param {Object} options
 * @returns {GenerationRequest}
 */
export function createRetakeRequest(sourceAssetId, prompt, range, options = {}) {
  return {
    mode: 'retake',
    prompt,
    negativePrompt: options.negativePrompt,
    sourceAssetId,
    selectedRange: range,
    duration: options.duration,
    stylePreset: options.stylePreset,
    metadata: options.metadata,
  };
}

/**
 * Create an extend request
 * @param {string} sourceAssetId
 * @param {string} prompt
 * @param {number} duration
 * @param {Object} options
 * @returns {GenerationRequest}
 */
export function createExtendRequest(sourceAssetId, prompt, duration, options = {}) {
  return {
    mode: 'extend',
    prompt,
    sourceAssetId,
    duration,
    metadata: options.metadata,
  };
}

/**
 * Create a B-roll request
 * @param {string} prompt
 * @param {Object} options
 * @returns {GenerationRequest}
 */
export function createBrollRequest(prompt, options = {}) {
  return {
    mode: 'broll',
    prompt,
    negativePrompt: options.negativePrompt,
    duration: options.duration || 3,
    aspectRatio: options.aspectRatio,
    metadata: options.metadata,
  };
}

/**
 * Create a Gemini image generation request
 * @param {string} prompt
 * @param {Object} options
 * @returns {GenerationRequest}
 */
export function createGeminiImageRequest(prompt, options = {}) {
  return {
    mode: 'generate-image',
    prompt,
    aspectRatio: options.aspectRatio || '1:1',
    metadata: options.metadata,
  };
}

/**
 * Create a background removal request
 * @param {string} imageUrl
 * @param {Object} options
 * @returns {GenerationRequest}
 */
export function createBackgroundRemovalRequest(imageUrl, options = {}) {
  return {
    mode: 'remove-background',
    references: [imageUrl],
    metadata: options.metadata,
  };
}

/**
 * Create a text-to-speech request
 * @param {string} text
 * @param {Object} options
 * @returns {GenerationRequest}
 */
export function createTextToSpeechRequest(text, options = {}) {
  return {
    mode: 'text-to-speech',
    text,
    metadata: options.metadata,
  };
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const generationService = new GenerationService();
export { GenerationService, LtxProvider, FalProvider };
export default generationService;
