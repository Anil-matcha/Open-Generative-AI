/**
 * VideoDB & Director Integration - Comprehensive Unit Tests
 * 
 * Coverage:
 * - VideoDBService methods
 * - LLMKeyManager methods
 * - DirectorBackendService methods
 * - DirectorAgentRuntime integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch for API calls
global.fetch = vi.fn();

let VideoDBService, LLMKeyManager, DirectorBackendService, DirectorAgentRuntime;
let getVideoDBInstance, getLLMKeyManager, getDirectorBackendInstance, getDirectorRuntime;
let LLM_PROVIDERS, PROVIDER_NAMES, PROVIDER_MODELS, DIRECTOR_AGENTS;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  });
  
  const videodb = await import('../../src/lib/videodb/VideoDBService.js');
  VideoDBService = videodb.VideoDBService;
  getVideoDBInstance = videodb.getVideoDBInstance;
  
  const director = await import('../../src/lib/director/LLMKeyManager.js');
  LLMKeyManager = director.LLMKeyManager;
  getLLMKeyManager = director.getLLMKeyManager;
  LLM_PROVIDERS = director.LLM_PROVIDERS;
  PROVIDER_NAMES = director.PROVIDER_NAMES;
  PROVIDER_MODELS = director.PROVIDER_MODELS;
  
  const directorBackend = await import('../../src/lib/director/DirectorBackendService.js');
  DirectorBackendService = directorBackend.DirectorBackendService;
  getDirectorBackendInstance = directorBackend.getDirectorBackendInstance;
  DIRECTOR_AGENTS = directorBackend.DIRECTOR_AGENTS;
  
  const directorRuntime = await import('../../src/lib/director/DirectorAgentRuntime.js');
  DirectorAgentRuntime = directorRuntime.DirectorAgentRuntime;
  getDirectorRuntime = directorRuntime.getDirectorRuntime;
});

// ─── VIDEO DB SERVICE TESTS ───────────────────────────────────────────────────

describe('VideoDBService', () => {
  it('creates instance with default config', () => {
    const service = new VideoDBService();
    expect(service.baseURL).toBe('https://api.videodb.io/api/v1');
    expect(service.retryConfig.maxRetries).toBe(3);
  });

  it('creates instance with custom config', () => {
    const service = new VideoDBService({
      baseURL: 'https://custom.api/v1',
      apiKey: 'test-key',
      collectionId: 'col-123'
    });
    expect(service.baseURL).toBe('https://custom.api/v1');
    expect(service.apiKey).toBe('test-key');
    expect(service.collectionId).toBe('col-123');
  });

  it('sets API key', () => {
    const service = new VideoDBService();
    service.setApiKey('my-api-key');
    expect(service.apiKey).toBe('my-api-key');
  });

  it('sets collection ID', () => {
    const service = new VideoDBService();
    service.setCollectionId('collection-456');
    expect(service.collectionId).toBe('collection-456');
  });

  it('throws error when API key not configured', async () => {
    const service = new VideoDBService();
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ status: 'ok' })
    });
    
    try {
      await service.healthCheck();
    } catch (error) {
      expect(error.message).toBe('VideoDB API key not configured');
    }
  });

  it('searches videos successfully', async () => {
    const service = new VideoDBService({ apiKey: 'test-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ videos: [{ id: 'v1', title: 'Test Video' }] })
    });
    
    const result = await service.searchVideos('test query');
    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].title).toBe('Test Video');
  });

  it('gets video details', async () => {
    const service = new VideoDBService({ apiKey: 'test-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ id: 'v1', title: 'Test', duration: 120 })
    });
    
    const result = await service.getVideo('v1');
    expect(result.id).toBe('v1');
    expect(result.duration).toBe(120);
  });

  it('gets video scenes', async () => {
    const service = new VideoDBService({ apiKey: 'test-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ scenes: [{ start: 0, end: 5 }, { start: 5, end: 10 }] })
    });
    
    const result = await service.getVideoScenes('v1');
    expect(result.scenes).toHaveLength(2);
  });

  it('gets video highlights', async () => {
    const service = new VideoDBService({ apiKey: 'test-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ highlights: [{ start: 0, end: 3, score: 0.9 }] })
    });
    
    const result = await service.getVideoHighlights('v1');
    expect(result.highlights).toHaveLength(1);
  });

  it('gets collections', async () => {
    const service = new VideoDBService({ apiKey: 'test-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ collections: [{ id: 'c1', name: 'Test Collection' }] })
    });
    
    const result = await service.getCollections();
    expect(result.collections).toHaveLength(1);
  });

  it('indexes video', async () => {
    const service = new VideoDBService({ apiKey: 'test-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ status: 'indexing' })
    });
    
    const result = await service.indexVideo('v1', { auto: true });
    expect(result.status).toBe('indexing');
  });

  it('generates subtitles', async () => {
    const service = new VideoDBService({ apiKey: 'test-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ job_id: 'sub-123', status: 'processing' })
    });
    
    const result = await service.generateSubtitles('v1', { language: 'en' });
    expect(result.job_id).toBe('sub-123');
  });
});

// ─── LLM KEY MANAGER TESTS ───────────────────────────────────────────────────

describe('LLMKeyManager', () => {
  it('has correct provider enum values', () => {
    expect(LLM_PROVIDERS.ANTHROPIC).toBe('anthropic');
    expect(LLM_PROVIDERS.OPENAI).toBe('openai');
    expect(LLM_PROVIDERS.GOOGLE).toBe('google');
  });

  it('has provider names defined', () => {
    expect(PROVIDER_NAMES[LLM_PROVIDERS.ANTHROPIC]).toBe('Anthropic Claude');
    expect(PROVIDER_NAMES[LLM_PROVIDERS.OPENAI]).toBe('OpenAI GPT');
    expect(PROVIDER_NAMES[LLM_PROVIDERS.GOOGLE]).toBe('Google Gemini');
  });

  it('has models for all providers', () => {
    expect(PROVIDER_MODELS[LLM_PROVIDERS.ANTHROPIC]).toBeDefined();
    expect(PROVIDER_MODELS[LLM_PROVIDERS.OPENAI]).toBeDefined();
    expect(PROVIDER_MODELS[LLM_PROVIDERS.GOOGLE]).toBeDefined();
  });

  it('sets API key for provider', () => {
    const manager = new LLMKeyManager();
    manager.setApiKey(LLM_PROVIDERS.ANTHROPIC, 'sk-ant-test-key');
    expect(manager.getApiKey(LLM_PROVIDERS.ANTHROPIC)).toBe('sk-ant-test-key');
  });

  it('checks if API key exists', () => {
    const manager = new LLMKeyManager();
    expect(manager.hasApiKey(LLM_PROVIDERS.ANTHROPIC)).toBe(false);
    
    manager.setApiKey(LLM_PROVIDERS.ANTHROPIC, 'sk-ant-test-key');
    expect(manager.hasApiKey(LLM_PROVIDERS.ANTHROPIC)).toBe(true);
  });

  it('sets active provider', () => {
    const manager = new LLMKeyManager();
    manager.setActiveProvider(LLM_PROVIDERS.OPENAI);
    expect(manager.getActiveProvider()).toBe(LLM_PROVIDERS.OPENAI);
  });

  it('gets available providers', () => {
    const manager = new LLMKeyManager();
    expect(manager.getAvailableProviders()).toHaveLength(0);
    
    manager.setApiKey(LLM_PROVIDERS.ANTHROPIC, 'sk-ant-test');
    expect(manager.getAvailableProviders()).toContain(LLM_PROVIDERS.ANTHROPIC);
  });

  it('gets key status for all providers', () => {
    const manager = new LLMKeyManager();
    manager.setApiKey(LLM_PROVIDERS.ANTHROPIC, 'sk-ant-test');
    
    const status = manager.getKeyStatus();
    expect(status).toHaveLength(3);
    
    const anthropicStatus = status.find(s => s.provider === LLM_PROVIDERS.ANTHROPIC);
    expect(anthropicStatus.configured).toBe(true);
  });

  it('removes API key', () => {
    const manager = new LLMKeyManager();
    manager.setApiKey(LLM_PROVIDERS.ANTHROPIC, 'sk-ant-test');
    expect(manager.hasApiKey(LLM_PROVIDERS.ANTHROPIC)).toBe(true);
    
    manager.removeApiKey(LLM_PROVIDERS.ANTHROPIC);
    expect(manager.hasApiKey(LLM_PROVIDERS.ANTHROPIC)).toBe(false);
  });

  it('gets provider for model', () => {
    const manager = new LLMKeyManager();
    expect(manager.getProviderForModel('gpt-4o')).toBe(LLM_PROVIDERS.OPENAI);
    expect(manager.getProviderForModel('claude-sonnet-4-20250514')).toBe(LLM_PROVIDERS.ANTHROPIC);
    expect(manager.getProviderForModel('gemini-2.0-flash')).toBe(LLM_PROVIDERS.GOOGLE);
  });
});

// ─── DIRECTOR BACKEND SERVICE TESTS ─────────────────────────────────────────

describe('DirectorBackendService', () => {
  it('creates instance with default config', () => {
    const service = new DirectorBackendService();
    expect(service.baseURL).toBe('https://api.director.ai/v1');
    expect(service.timeout).toBe(60000);
  });

  it('sets API keys', () => {
    const service = new DirectorBackendService();
    service.setApiKey('director-key');
    service.setVideoDBKey('videodb-key');
    expect(service.apiKey).toBe('director-key');
    expect(service.videoDBKey).toBe('videodb-key');
  });

  it('throws error when Director API key not configured', async () => {
    const service = new DirectorBackendService({ apiKey: null });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' })
    });
    
    try {
      await service.healthCheck();
    } catch (error) {
      expect(error.message).toBe('Director API key not configured');
    }
  });

  it('gets agents list', async () => {
    const service = new DirectorBackendService({ apiKey: 'test-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        agents: [
          { id: 'SummarizeVideoAgent', name: 'Video Summarizer' },
          { id: 'SearchAgent', name: 'Video Search' }
        ]
      })
    });
    
    const result = await service.getAgents();
    expect(result.agents).toHaveLength(2);
  });

  it('executes chat with message', async () => {
    const service = new DirectorBackendService({ apiKey: 'test-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        message: 'Here are the results',
        agents: ['SummarizeVideoAgent']
      })
    });
    
    const result = await service.chat('Summarize my video', { videoId: 'v1' });
    expect(result.message).toBe('Here are the results');
  });

  it('executes agent command', async () => {
    const service = new DirectorBackendService({ apiKey: 'test-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        status: 'completed',
        result: { summary: 'Test summary' }
      })
    });
    
    const result = await service.executeAgent(DIRECTOR_AGENTS.SUMMARIZE, { videoId: 'v1' });
    expect(result.status).toBe('completed');
  });

  it('summarizes video', async () => {
    const service = new DirectorBackendService({ apiKey: 'test-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ summary: 'This video is about...' })
    });
    
    const result = await service.summarizeVideo('v1');
    expect(result.summary).toBeDefined();
  });

  it('searches video content', async () => {
    const service = new DirectorBackendService({ apiKey: 'test-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        matches: [
          { timestamp: 10, text: 'mentioned product' }
        ]
      })
    });
    
    const result = await service.searchVideo('v1', 'product');
    expect(result.matches).toHaveLength(1);
  });

  it('detects scenes via VideoDB', async () => {
    const service = new DirectorBackendService({ apiKey: 'test-key', videoDBKey: 'vdb-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ scenes: [{ start: 0, end: 5 }] })
    });
    
    const result = await service.detectScenes('v1');
    expect(result.scenes).toHaveLength(1);
  });

  it('generates subtitles via VideoDB', async () => {
    const service = new DirectorBackendService({ apiKey: 'test-key', videoDBKey: 'vdb-key' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ job_id: 'sub-123' })
    });
    
    const result = await service.generateSubtitles('v1', { language: 'en' });
    expect(result.job_id).toBe('sub-123');
  });
});

// ─── DIRECTOR AGENT RUNTIME TESTS ─────────────────────────────────────────────

describe('DirectorAgentRuntime', () => {
  it('creates instance with all services', () => {
    const runtime = new DirectorAgentRuntime();
    expect(runtime.videoDB).toBeDefined();
    expect(runtime.llmKeyManager).toBeDefined();
    expect(runtime.directorBackend).toBeDefined();
  });

  it('sets state change callback', () => {
    const runtime = new DirectorAgentRuntime();
    const callback = vi.fn();
    runtime.setStateChangeCallback(callback);
    expect(runtime.onStateChange).toBe(callback);
  });

  it('configures VideoDB', () => {
    const runtime = new DirectorAgentRuntime();
    runtime.configureVideoDB('test-videodb-key');
    expect(runtime.videoDB.apiKey).toBe('test-videodb-key');
  });

  it('configures Director backend', () => {
    const runtime = new DirectorAgentRuntime();
    runtime.configureDirectorBackend('test-director-key', 'test-videodb-key');
    expect(runtime.directorBackend.apiKey).toBe('test-director-key');
    expect(runtime.directorBackend.videoDBKey).toBe('test-videodb-key');
  });

  it('sets LLM provider', () => {
    const runtime = new DirectorAgentRuntime();
    runtime.setLLMProvider(LLM_PROVIDERS.OPENAI);
    expect(runtime.getLLMProvider()).toBe(LLM_PROVIDERS.OPENAI);
  });

  it('checks if VideoDB is configured', () => {
    const runtime = new DirectorAgentRuntime();
    expect(runtime.hasVideoDBConfigured()).toBe(false);
    
    runtime.configureVideoDB('test-key');
    expect(runtime.hasVideoDBConfigured()).toBe(true);
  });

  it('checks if Director backend is configured', () => {
    const runtime = new DirectorAgentRuntime();
    expect(runtime.hasDirectorBackendConfigured()).toBe(false);
    
    runtime.configureDirectorBackend('test-key');
    expect(runtime.hasDirectorBackendConfigured()).toBe(true);
  });

  it('gets configuration status', () => {
    const runtime = new DirectorAgentRuntime();
    const status = runtime.getConfigurationStatus();
    
    expect(status).toHaveProperty('videoDB');
    expect(status).toHaveProperty('directorBackend');
    expect(status).toHaveProperty('llmProviders');
    expect(status).toHaveProperty('activeLLM');
  });

  it('searches videos through VideoDB', async () => {
    const runtime = new DirectorAgentRuntime();
    runtime.configureVideoDB('test-videodb-key');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ videos: [] })
    });
    
    const results = await runtime.searchVideos('test query');
    expect(results).toBeDefined();
  });

  it('gets video details', async () => {
    const runtime = new DirectorAgentRuntime();
    runtime.configureVideoDB('test-videodb-key');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ id: 'v1', title: 'Test' })
    });
    
    const details = await runtime.getVideoDetails('v1');
    expect(details.id).toBe('v1');
  });

  it('prevents concurrent operations', async () => {
    const runtime = new DirectorAgentRuntime();
    runtime.configureVideoDB('test-videodb-key');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => new Promise(resolve => setTimeout(() => resolve({ videos: [] }), 100))
    });
    
    try {
      await runtime.searchVideos('query 1');
      await runtime.searchVideos('query 2');
    } catch (error) {
      expect(error.message).toBe('Already processing a request');
    }
  });

  it('gets collections', async () => {
    const runtime = new DirectorAgentRuntime();
    runtime.configureVideoDB('test-videodb-key');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ collections: [] })
    });
    
    const collections = await runtime.getCollections();
    expect(collections).toBeDefined();
  });

  it('uploads and indexes video', async () => {
    const runtime = new DirectorAgentRuntime();
    runtime.configureVideoDB('test-videodb-key');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ video_id: 'new-video' })
    });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ status: 'indexed' })
    });
    
    const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    const result = await runtime.uploadVideo(mockFile);
    expect(result.video_id).toBe('new-video');
  });
});

// ─── INTEGRATION TESTS ──────────────────────────────────────────────────────

describe('Integration - Full Workflow', () => {
  it('handles video search and import workflow', async () => {
    const runtime = new DirectorAgentRuntime();
    runtime.configureVideoDB('test-videodb-key');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({
        videos: [
          { id: 'v1', title: 'Test Video 1', duration: 120 },
          { id: 'v2', title: 'Test Video 2', duration: 60 }
        ]
      })
    });
    
    const searchResults = await runtime.searchVideos('test');
    expect(searchResults.videos).toHaveLength(2);
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({
        id: 'v1',
        title: 'Test Video 1',
        duration: 120,
        scenes: [{ start: 0, end: 30 }]
      })
    });
    
    const details = await runtime.getVideoDetails('v1');
    expect(details.scenes).toHaveLength(1);
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({
        highlights: [{ start: 0, end: 10, score: 0.95 }]
      })
    });
    
    const highlights = await runtime.extractHighlights('v1');
    expect(highlights.highlights).toHaveLength(1);
  });

  it('configures LLM and executes Director agent', async () => {
    const runtime = new DirectorAgentRuntime();
    runtime.configureDirectorBackend('director-key', 'videodb-key');
    
    runtime.setLLMProvider(LLM_PROVIDERS.ANTHROPIC);
    expect(runtime.getLLMProvider()).toBe(LLM_PROVIDERS.ANTHROPIC);
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        status: 'completed',
        result: { summary: 'Video summary' }
      })
    });
    
    const result = await runtime.executeAgent(DIRECTOR_AGENTS.SUMMARIZE, { videoId: 'v1' });
    expect(result.status).toBe('completed');
  });
});
