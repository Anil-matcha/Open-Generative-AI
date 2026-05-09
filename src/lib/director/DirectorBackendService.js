/**
 * Director Backend Service
 * Connects frontend to Director Python backend agents via REST API
 */

import { getLLMKeyManager, LLM_PROVIDERS } from './LLMKeyManager.js';
import { getVideoDBInstance } from '../videodb/VideoDBService.js';

export const DIRECTOR_AGENTS = {
  SUMMARIZE: 'SummarizeVideoAgent',
  SEARCH: 'SearchAgent',
  SUBTITLE: 'SubtitleAgent',
  DUBBING: 'DubbingAgent',
  VIDEO_GENERATION: 'VideoGenerationAgent',
  IMAGE_GENERATION: 'ImageGenerationAgent',
  AUDIO_GENERATION: 'AudioGenerationAgent',
  CLONE_VOICE: 'CloneVoiceAgent',
  VOICE_REPLACEMENT: 'VoiceReplacementAgent',
  EDITING: 'EditingAgent',
  TEXT_TO_MOVIE: 'TextToMovieAgent',
  STREAM_VIDEO: 'StreamVideoAgent',
  CENSOR: 'CensorAgent',
  PROMPT_CLIP: 'PromptClipAgent',
  INDEX: 'IndexAgent'
};

export const AGENT_CATEGORIES = {
  VIDEO_ANALYSIS: ['summarize', 'search', 'subtitle', 'scenes', 'highlights'],
  VIDEO_EDITING: ['dubbing', 'editing', 'censor', 'prompt_clip'],
  GENERATION: ['video_generation', 'image_generation', 'audio_generation', 'text_to_movie'],
  VOICE: ['clone_voice', 'voice_replacement']
};

export class DirectorBackendService {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'https://api.director.ai/v1';
    this.apiKey = config.apiKey || null;
    this.videoDBKey = config.videoDBKey || null;
    this.llmKeyManager = getLLMKeyManager();
    this.videoDBService = getVideoDBInstance();
    this.timeout = config.timeout || 60000;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  setVideoDBKey(videoDBKey) {
    this.videoDBKey = videoDBKey;
    this.videoDBService.setApiKey(videoDBKey);
  }

  async _makeRequest(endpoint, options = {}) {
    if (!this.apiKey) {
      throw new Error('Director API key not configured');
    }

    const provider = this.llmKeyManager.getActiveProvider();
    const apiKey = this.llmKeyManager.getApiKey(provider);
    const model = this.llmKeyManager.getModelForProvider(provider);

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-llm-provider': provider,
      'x-llm-model': model,
      'x-videodb-api-key': this.videoDBKey,
      ...options.headers
    };

    const url = `${this.baseURL}${endpoint}`;
    const requestOptions = {
      method: options.method || 'GET',
      headers,
      signal: options.signal || null
    };

    if (options.body) {
      requestOptions.body = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      requestOptions.signal = controller.signal;
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Director API failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Director request timed out');
      }
      throw error;
    }
  }

  async healthCheck() {
    return this._makeRequest('/health', { method: 'GET' });
  }

  async getAgents() {
    return this._makeRequest('/agents', { method: 'GET' });
  }

  async chat(message, params = {}) {
    const body = {
      message,
      collection_id: params.collectionId || null,
      video_id: params.videoId || null,
      agents: params.agents || [],
      llm_provider: this.llmKeyManager.getActiveProvider(),
      llm_model: this.llmKeyManager.getModelForProvider(this.llmKeyManager.getActiveProvider()),
      ...params
    };

    return this._makeRequest('/chat', {
      method: 'POST',
      body
    });
  }

  async executeAgent(agentId, params = {}) {
    const body = {
      agent_id: agentId,
      video_id: params.videoId || null,
      collection_id: params.collectionId || null,
      prompt: params.prompt || '',
      settings: params.settings || {},
      llm_provider: this.llmKeyManager.getActiveProvider(),
      llm_model: this.llmKeyManager.getModelForProvider(this.llmKeyManager.getActiveProvider()),
      ...params
    };

    return this._makeRequest('/agents/execute', {
      method: 'POST',
      body
    });
  }

  async summarizeVideo(videoId, options = {}) {
    return this.executeAgent(DIRECTOR_AGENTS.SUMMARIZE, {
      videoId,
      ...options
    });
  }

  async searchVideo(videoId, query, options = {}) {
    return this.executeAgent(DIRECTOR_AGENTS.SEARCH, {
      videoId,
      prompt: query,
      ...options
    });
  }

  async detectScenes(videoId, options = {}) {
    return this.videoDBService.getVideoScenes(videoId, options);
  }

  async extractHighlights(videoId, options = {}) {
    return this.videoDBService.getVideoHighlights(videoId, options);
  }

  async generateSubtitles(videoId, options = {}) {
    return this.videoDBService.generateSubtitles(videoId, options);
  }

  async transcribeVideo(videoId, options = {}) {
    return this.videoDBService.transcribeVideo(videoId, options);
  }

  async generateVideo(prompt, options = {}) {
    return this.executeAgent(DIRECTOR_AGENTS.VIDEO_GENERATION, {
      prompt,
      ...options
    });
  }

  async generateImage(prompt, options = {}) {
    return this.executeAgent(DIRECTOR_AGENTS.IMAGE_GENERATION, {
      prompt,
      ...options
    });
  }

  async createClip(videoId, startTime, endTime, options = {}) {
    return this.executeAgent(DIRECTOR_AGENTS.PROMPT_CLIP, {
      videoId,
      prompt: `Create clip from ${startTime} to ${endTime}`,
      settings: { start_time: startTime, end_time: endTime, ...options }
    });
  }

  async dubVideo(videoId, targetLanguage, options = {}) {
    return this.executeAgent(DIRECTOR_AGENTS.DUBBING, {
      videoId,
      prompt: `Dub video to ${targetLanguage}`,
      settings: { target_language: targetLanguage, ...options }
    });
  }

  async indexVideo(videoId, options = {}) {
    return this.videoDBService.indexVideo(videoId, options);
  }

  async uploadAndIndex(file, options = {}) {
    const uploadResult = await this.videoDBService.uploadVideo(file, options);
    if (uploadResult.video_id) {
      await this.indexVideo(uploadResult.video_id, options);
    }
    return uploadResult;
  }
}

let directorBackendInstance = null;

export const getDirectorBackendInstance = (config) => {
  if (!directorBackendInstance) {
    directorBackendInstance = new DirectorBackendService(config);
  }
  return directorBackendInstance;
};

export default DirectorBackendService;
