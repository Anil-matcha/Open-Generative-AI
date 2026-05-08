/**
 * WhisperService - Speech-to-Text Transcription Client
 * Handles audio transcription using MuAPI or local Whisper fallback
 * Provides word-level timestamps and multi-language support
 */

import { RateLimiter } from '../lib/services/RateLimiter.js';
import { CircuitBreaker } from '../lib/services/CircuitBreaker.js';

class WhisperService {
  constructor(options = {}) {
    // Configuration
    this.muapiUrl = options.muapiUrl || import.meta.env.VITE_MUAPI_URL || 'https://api.muapi.ai';
    this.apiKey = options.apiKey || import.meta.env.VITE_MUAPI_KEY || '';
    this.useMuAPI = options.useMuAPI !== false && Boolean(this.apiKey);
    this.localWhisperUrl = options.localWhisperUrl || import.meta.env.VITE_WHISPER_LOCAL_URL || 'http://localhost:8080';

    // Initialize supporting services
    this.rateLimiter = new RateLimiter({
      rate: options.rateLimit || 10, // 10 transcription requests per minute
      duration: 60000
    });

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 30000
    });

    // Add services to circuit breaker
    this.circuitBreaker.addService('muapi', {
      failureThreshold: 3,
      recoveryTimeout: 30000
    });

    this.circuitBreaker.addService('local-whisper', {
      failureThreshold: 5,
      recoveryTimeout: 60000
    });

    // Statistics tracking
    this.stats = {
      requests: 0,
      muapiRequests: 0,
      localRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      fallbacks: 0
    };

    console.log(`[WhisperService] Initialized - MuAPI: ${this.useMuAPI}, Local: ${this.localWhisperUrl}`);
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.useMuAPI || this.localWhisperUrl;
  }

  /**
   * Transcribe audio file to text with timestamps
   * @param {File|Blob|string} audioSource - Audio file, blob, or URL
   * @param {Object} options - Transcription options
   * @returns {Promise<Object>} Transcription result with segments and words
   */
  async transcribe(audioSource, options = {}) {
    const {
      language = 'auto',
      model = 'base',
      wordTimestamps = true,
      maxDuration = 3600, // 1 hour max
      onProgress
    } = options;

    this.stats.requests++;

    try {
      // Try MuAPI first if available
      if (this.useMuAPI && this.circuitBreaker.isAvailable('muapi')) {
        return await this._transcribeWithMuAPI(audioSource, { language, model, wordTimestamps, onProgress });
      }

      // Fallback to local Whisper
      if (this.circuitBreaker.isAvailable('local-whisper')) {
        return await this._transcribeWithLocalWhisper(audioSource, { language, model, wordTimestamps, onProgress });
      }

      throw new Error('No transcription service available');
    } catch (error) {
      this.stats.errors++;
      console.error('[WhisperService] Transcription failed:', error);
      throw error;
    }
  }

  /**
   * Transcribe using MuAPI
   */
  async _transcribeWithMuAPI(audioSource, options) {
    await this.rateLimiter.waitForSlot();

    const formData = new FormData();

    if (audioSource instanceof File || audioSource instanceof Blob) {
      formData.append('audio', audioSource);
    } else if (typeof audioSource === 'string') {
      // Assume it's a URL - download first
      const response = await fetch(audioSource);
      const blob = await response.blob();
      formData.append('audio', blob);
    }

    formData.append('language', options.language);
    formData.append('model', options.model);
    formData.append('word_timestamps', options.wordTimestamps.toString());

    const response = await fetch(`${this.muapiUrl}/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`MuAPI transcription failed: ${response.status}`);
    }

    const result = await response.json();
    this.stats.muapiRequests++;

    return this._normalizeMuAPIResult(result);
  }

  /**
   * Transcribe using local Whisper
   */
  async _transcribeWithLocalWhisper(audioSource, options) {
    await this.rateLimiter.waitForSlot();

    const formData = new FormData();

    if (audioSource instanceof File || audioSource instanceof Blob) {
      formData.append('audio', audioSource);
    } else if (typeof audioSource === 'string') {
      const response = await fetch(audioSource);
      const blob = await response.blob();
      formData.append('audio', blob);
    }

    formData.append('language', options.language);
    formData.append('model', options.model);
    formData.append('word_timestamps', 'true');

    const response = await fetch(`${this.localWhisperUrl}/transcribe`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Local Whisper transcription failed: ${response.status}`);
    }

    const result = await response.json();
    this.stats.localRequests++;

    return this._normalizeLocalResult(result);
  }

  /**
   * Normalize MuAPI result to standard format
   */
  _normalizeMuAPIResult(result) {
    return {
      text: result.text || '',
      language: result.language || 'unknown',
      segments: (result.segments || []).map(segment => ({
        start: segment.start,
        end: segment.end,
        text: segment.text,
        words: (segment.words || []).map(word => ({
          word: word.word,
          start: word.start,
          end: word.end,
          confidence: word.confidence || 1.0
        }))
      })),
      duration: result.duration || 0
    };
  }

  /**
   * Normalize local Whisper result to standard format
   */
  _normalizeLocalResult(result) {
    return {
      text: result.text || '',
      language: result.language || 'unknown',
      segments: (result.segments || []).map(segment => ({
        start: segment.start,
        end: segment.end,
        text: segment.text,
        words: (segment.words || []).map(word => ({
          word: word.word,
          start: word.start,
          end: word.end,
          confidence: word.confidence || 1.0
        }))
      })),
      duration: result.duration || 0
    };
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return [
      { code: 'auto', name: 'Auto Detect' },
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'nl', name: 'Dutch' },
      { code: 'pl', name: 'Polish' },
      { code: 'tr', name: 'Turkish' },
      { code: 'sv', name: 'Swedish' },
      { code: 'da', name: 'Danish' },
      { code: 'no', name: 'Norwegian' },
      { code: 'fi', name: 'Finnish' }
    ];
  }

  /**
   * Get service statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      requests: 0,
      muapiRequests: 0,
      localRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      fallbacks: 0
    };
  }
}

// Create default instance
const whisperService = new WhisperService();

export { WhisperService, whisperService };