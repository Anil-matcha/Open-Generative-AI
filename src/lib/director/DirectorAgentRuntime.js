/**
 * Director Agent Runtime - Unified controller for Director operations
 * Integrates VideoDB, LLM Key Management, and Director Backend services
 */

import { getVideoDBInstance } from '../videodb/VideoDBService.js';
import { getLLMKeyManager, LLM_PROVIDERS } from './LLMKeyManager.js';
import { getDirectorBackendInstance, DIRECTOR_AGENTS } from './DirectorBackendService.js';

const STORYBOARD_PRESETS = [
  { id: 'cinematic-story', label: 'Cinematic Story', aspectRatio: '16:9', visualStyle: 'Cinematic', mood: 'Dramatic', generationMode: 'Storyboard Frames' },
  { id: 'commercial-ad', label: 'Commercial Ad', aspectRatio: '16:9', visualStyle: 'Commercial', mood: 'Aspirational', generationMode: 'Storyboard Frames' },
  { id: 'documentary-flow', label: 'Documentary Flow', aspectRatio: '16:9', visualStyle: 'Documentary', mood: 'Emotional', generationMode: 'Scene Beats' },
  { id: 'social-shorts', label: 'Social Shorts', aspectRatio: '9:16', visualStyle: 'Stylized', mood: 'Energetic', generationMode: 'Shot Plan' },
];

const SHOT_TYPES = ['Wide Shot', 'Medium Shot', 'Close-Up', 'Extreme Close-Up', 'POV', 'Overhead', 'Low Angle'];

const AGENTS = [
  { id: 'summarizer', name: 'Video Summarizer', icon: '📝', description: 'Summarize video content', category: 'video-analysis' },
  { id: 'search', name: 'Video Search', icon: '🔍', description: 'Search and index media library', category: 'video-analysis' },
  { id: 'clipper', name: 'Clip Creator', icon: '✂️', description: 'Extract and create clips', category: 'video-editing' },
  { id: 'dubbing', name: 'Video Dubbing', icon: '🎤', description: 'Translate and dub audio/video', category: 'video-editing' },
  { id: 'subtitler', name: 'Subtitle Generator', icon: '💬', description: 'Add subtitles in any language', category: 'video-analysis' },
  { id: 'highlighter', name: 'Highlight Extractor', icon: '⚡', description: 'Find key moments automatically', category: 'video-analysis' },
  { id: 'scenes', name: 'Scene Detector', icon: '🎬', description: 'Identify scene boundaries', category: 'video-analysis' },
  { id: 'broll', name: 'B-Roll Adder', icon: '🎞️', description: 'Add overlay footage', category: 'video-editing' },
  { id: 'voiceover', name: 'Voiceover', icon: '🎙️', description: 'Add AI voiceover', category: 'voice' },
  { id: 'editor', name: 'Video Editor', icon: '✏️', description: 'Edit and enhance video', category: 'video-editing' },
  { id: 'enhancer', name: 'Video Enhancer', icon: '✨', description: 'Quality enhancement', category: 'video-editing' },
  { id: 'compiler', name: 'Content Compiler', icon: '📚', description: 'Compile multiple videos', category: 'video-editing' },
];

export class DirectorAgentRuntime {
  constructor() {
    this.videoDB = getVideoDBInstance();
    this.llmKeyManager = getLLMKeyManager();
    this.directorBackend = getDirectorBackendInstance();
    this.onStateChange = null;
    this.isProcessing = false;
    this.currentOperation = null;
    this.videoUrl = null;
    this.videoMetadata = null;
  }

  setStateChangeCallback(callback) {
    this.onStateChange = callback;
  }

  notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  getVideoDB() {
    return this.videoDB;
  }

  getLLMKeyManager() {
    return this.llmKeyManager;
  }

  getDirectorBackend() {
    return this.directorBackend;
  }

  configureVideoDB(apiKey) {
    this.videoDB.setApiKey(apiKey);
  }

  configureDirectorBackend(apiKey, videoDBKey) {
    this.directorBackend.setApiKey(apiKey);
    if (videoDBKey) {
      this.directorBackend.setVideoDBKey(videoDBKey);
    }
  }

  setLLMProvider(provider) {
    this.llmKeyManager.setActiveProvider(provider);
  }

  getLLMProvider() {
    return this.llmKeyManager.getActiveProvider();
  }

  getAvailableProviders() {
    return this.llmKeyManager.getAvailableProviders();
  }

  async searchVideos(query, options = {}) {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'search';
    this.notifyStateChange();

    try {
      const results = await this.videoDB.searchVideos(query, options);
      return results;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  async getVideoDetails(videoId) {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'fetching-details';
    this.notifyStateChange();

    try {
      const details = await this.videoDB.getVideo(videoId);
      this.videoMetadata = details;
      return details;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  async detectScenes(videoId, options = {}) {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'detecting-scenes';
    this.notifyStateChange();

    try {
      const scenes = await this.videoDB.getVideoScenes(videoId, options);
      return scenes;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  async extractHighlights(videoId, options = {}) {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'extracting-highlights';
    this.notifyStateChange();

    try {
      const highlights = await this.videoDB.getVideoHighlights(videoId, options);
      return highlights;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  async summarizeVideo(videoId, options = {}) {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'summarizing';
    this.notifyStateChange();

    try {
      const result = await this.directorBackend.summarizeVideo(videoId, options);
      return result;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  async searchInVideo(videoId, query, options = {}) {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'searching-video';
    this.notifyStateChange();

    try {
      const results = await this.videoDB.searchInVideo(videoId, query, options);
      return results;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  async transcribeVideo(videoId, options = {}) {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'transcribing';
    this.notifyStateChange();

    try {
      const result = await this.videoDB.transcribeVideo(videoId, options);
      return result;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  async generateSubtitles(videoId, options = {}) {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'generating-subtitles';
    this.notifyStateChange();

    try {
      const result = await this.videoDB.generateSubtitles(videoId, options);
      return result;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  async chatWithDirector(message, params = {}) {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'chat';
    this.notifyStateChange();

    try {
      const result = await this.directorBackend.chat(message, params);
      return result;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  async executeAgent(agentId, params = {}) {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'agent-execution';
    this.notifyStateChange();

    try {
      const result = await this.directorBackend.executeAgent(agentId, params);
      return result;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  async getCollections() {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'fetching-collections';
    this.notifyStateChange();

    try {
      const collections = await this.videoDB.getCollections();
      return collections;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  async getCollectionVideos(collectionId, options = {}) {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'fetching-videos';
    this.notifyStateChange();

    try {
      const videos = await this.videoDB.getCollectionVideos(collectionId, options);
      return videos;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  async uploadVideo(file, options = {}) {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }
    this.isProcessing = true;
    this.currentOperation = 'uploading';
    this.notifyStateChange();

    try {
      const result = await this.videoDB.uploadVideo(file, options);
      if (result.video_id) {
        await this.videoDB.indexVideo(result.video_id, options);
      }
      return result;
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      this.notifyStateChange();
    }
  }

  isConfigured() {
    return this.videoDB.apiKey || this.directorBackend.apiKey;
  }

  hasVideoDBConfigured() {
    return !!this.videoDB.apiKey;
  }

  hasDirectorBackendConfigured() {
    return !!this.directorBackend.apiKey;
  }

  hasAnyLLMConfigured() {
    return this.llmKeyManager.getAvailableProviders().length > 0;
  }

  getConfigurationStatus() {
    return {
      videoDB: this.hasVideoDBConfigured(),
      directorBackend: this.hasDirectorBackendConfigured(),
      llmProviders: this.llmKeyManager.getKeyStatus(),
      activeLLM: this.llmKeyManager.getActiveProvider()
    };
  }
}

let directorRuntimeInstance = null;

export const getDirectorRuntime = () => {
  if (!directorRuntimeInstance) {
    directorRuntimeInstance = new DirectorAgentRuntime();
  }
  return directorRuntimeInstance;
};

export {
  STORYBOARD_PRESETS,
  SHOT_TYPES,
  AGENTS,
  DIRECTOR_AGENTS
};
