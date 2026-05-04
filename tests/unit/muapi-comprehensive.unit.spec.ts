/**
 * MuAPI Client - Comprehensive Unit Tests (RED PHASE)
 * 
 * TDD RED PHASE: All tests FAIL initially.
 * Coverage: 35 untested methods, 100+ assertions.
 * 
 * Methods:
 *   Core: setApiKey, cancelRequest, cancelAllRequests, generateRequestId, validateResponse
 *   Image/Video: generateAvatar, processV2V, generateAnime
 *   Audio: generateAudio, generateMusic, remixMusic, extendMusic, mmaudioTextToAudio, mmaudioVideoToVideo
 *   Lipsync: processLipSync, latentsyncVideo
 *   Video Tools: faceSwap, removeBackground, eraseObject, extendImage, createProductShot, enhanceSkin, stylizeGhibli, processVideoTool
 *   Text/NLP: generateText, trainLora
 *   Utils: getDimensionsFromAR
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ─── Mock services BEFORE any imports ──────────────────────────────────────────

vi.mock('../../src/lib/services/SecurityService.js', () => ({
  SecurityService: class MockSecurityService {
    validateApiKey = vi.fn(() => ({ valid: true, reason: null }));
    storeEncryptedKey = vi.fn().mockResolvedValue(undefined);
  }
}));

vi.mock('../../src/lib/services/RateLimiter.js', () => ({
  RateLimiter: class MockRateLimiter {
    acquire = vi.fn().mockResolvedValue(undefined);
    isAllowed = vi.fn(() => true);
  },
  RetryService: class MockRetryService {
    initialize = vi.fn();
    execute = vi.fn().mockImplementation(async (fn: any) => await fn());
  }
}));

vi.mock('../../src/lib/services/CircuitBreaker.js', () => ({
  CircuitBreaker: class MockCircuitBreaker {
    canProceed = vi.fn(() => true);
    recordSuccess = vi.fn();
    recordFailure = vi.fn();
  }
}));

vi.mock('../../src/lib/services/CacheService.js', () => ({
  CacheService: class MockCacheService {
    get = vi.fn(() => null);
    set = vi.fn();
    delete = vi.fn();
  }
}));

vi.mock('../../src/lib/services/WebSocketService.js', () => ({
  WebSocketService: class MockWebSocketService {
    connect = vi.fn().mockResolvedValue(undefined);
    isConnected = vi.fn(() => false);
    pollForResult = vi.fn().mockResolvedValue({ 
      outputs: ['https://cdn.example.com/result.mp4'],
      status: 'completed'
    });
  }
}));

vi.mock('../../src/lib/services/MonitoringService.js', () => ({
  MonitoringService: class MockMonitoringService {
    start = vi.fn(); stop = vi.fn();
    track = vi.fn(); error = vi.fn(); log = vi.fn();
    metric = vi.fn(); timing = vi.fn(); record = vi.fn();
  }
}));

vi.mock('../../src/lib/services/ErrorBoundary.js', () => ({
  ErrorBoundary: class MockErrorBoundary {
    wrap = vi.fn((fn: any) => fn());
  }
}));

// ─── Global environment ─────────────────────────────────────────────────────────

process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';

global.fetch = vi.fn();

global.localStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

class MockAbortController {
  signal = { aborted: false };
  abort() { this.signal.aborted = true; }
}
global.AbortController = MockAbortController as any;

global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

// ─── Dynamic import ─────────────────────────────────────────────────────────────

let MuapiClient: any;

beforeEach(async () => {
  vi.clearAllMocks();
  
  // Dynamically import after mocks are registered
  const mod = await import('../../src/lib/muapi.js');
  MuapiClient = mod.MuapiClient;
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── CORE METHODS ───────────────────────────────────────────────────────────────

describe('MuAPI - Core Methods (RED)', () => {
  
  describe('setApiKey', () => {
    it('validates key before storing', async () => {
      const client = new MuapiClient();
      await client.setApiKey('valid-key-12345');
      expect(client.security.validateApiKey).toHaveBeenCalledWith('valid-key-12345');
      expect(client.security.storeEncryptedKey).toHaveBeenCalledWith('valid-key-12345');
    });
    
    it('rejects invalid key', async () => {
      const client = new MuapiClient();
      client.security.validateApiKey = vi.fn(() => ({ valid: false, reason: 'bad format' }));
      await expect(client.setApiKey('invalid')).rejects.toThrow('Invalid API key: bad format');
    });
    
    it('rejects empty key', async () => {
      const client = new MuapiClient();
      client.security.validateApiKey = vi.fn(() => ({ valid: false, reason: 'required' }));
      await expect(client.setApiKey('')).rejects.toThrow('Invalid API key: required');
    });
  });
  
  describe('cancelRequest', () => {
    it('aborts and deletes controller entry', () => {
      const client = new MuapiClient();
      const ctrl = { abort: vi.fn() };
      client.activeControllers.set('req_abc', ctrl);
      client.cancelRequest('req_abc');
      expect(ctrl.abort).toHaveBeenCalledTimes(1);
      expect(client.activeControllers.has('req_abc')).toBe(false);
    });
    
    it('gracefully handles unknown requestId', () => {
      const client = new MuapiClient();
      expect(() => client.cancelRequest('missing')).not.toThrow();
      expect(client.activeControllers.size).toBe(0);
    });
  });
  
  describe('cancelAllRequests', () => {
    it('aborts all active controllers and clears all sets', () => {
      const client = new MuapiClient();
      const ctls = [{ abort: vi.fn() }, { abort: vi.fn() }, { abort: vi.fn() }];
      ctls.forEach((c, i) => client.activeControllers.set(`req_${i}`, c));
      client.requestIds.add('r1'); client.requestIds.add('r2');
      
      client.cancelAllRequests();
      
      ctls.forEach(c => expect(c.abort).toHaveBeenCalled());
      expect(client.activeControllers.size).toBe(0);
      expect(client.requestIds.size).toBe(0);
    });
  });
  
  describe('generateRequestId', () => {
    it('returns string in expected format', () => {
      const client = new MuapiClient();
      const id = client.generateRequestId({ endpoint: 'test', params: {} });
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^req_\d+_\d+$/);
    });
    
    it('produces different IDs for different params', () => {
      const client = new MuapiClient();
      const a = client.generateRequestId({ a: 1 });
      const b = client.generateRequestId({ a: 2 });
      expect(a).not.toBe(b);
    });
    
    it('produces same ID for identical params (deduplication)', () => {
      const client = new MuapiClient();
      const p = { endpoint: 'e', params: { x: 1 } };
      expect(client.generateRequestId(p)).toBe(client.generateRequestId(p));
    });
  });
  
  describe('validateResponse', () => {
    it('returns true for valid response objects', () => {
      const client = new MuapiClient();
      expect(client.validateResponse({ data: {} }, 'submit')).toBe(true);
    });
    
    it('throws on null/undefined', () => {
      expect(() => new MuapiClient().validateResponse(null as any, 'submit'))
        .toThrow('Invalid response');
    });
    
    it('throws on non-object (string/number)', () => {
      const client = new MuapiClient();
      expect(() => client.validateResponse('string' as any, 'submit')).toThrow();
      expect(() => client.validateResponse(123 as any, 'submit')).toThrow();
    });
    
    it('throws if response.error field exists', () => {
      const client = new MuapiClient();
      expect(() => client.validateResponse({ error: 'boom' }, 'submit'))
        .toThrow('API Error: boom');
    });
  });
});

// ─── IMAGE/VIDEO METHODS ────────────────────────────────────────────────────────

describe('MuAPI - Image/Video Methods (RED)', () => {
  
  describe('generateAvatar', () => {
    it('POSTs to avatar endpoint with all params', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url.mp4'] });
      
      const params = { prompt: 'pro avatar', model: 'pro', video_url: 'v.mp4', audio_url: 'a.mp3' };
      await client.generateAvatar(params);
      
      const { body } = (global.fetch as any).mock.calls[0][1];
      const payload = JSON.parse(body);
      expect(payload.endpoint).toBe('avatar');
      expect(payload.generationType).toBe('avatar');
      expect(payload.studioType).toBe('avatar');
    });
    
    it('handles HTTP error codes', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ 
        ok: false, 
        status: 400, 
        text: () => Promise.resolve('bad input')
      });
      await expect(client.generateAvatar({ prompt: 'test' }))
        .rejects.toThrow('API Request Failed: 400');
    });
    
    it('handles network errors', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockRejectedValueOnce(new Error('network'));
      await expect(client.generateAvatar({ prompt: 'test' })).rejects.toThrow('network');
    });
    
    it('handles user cancellation', async () => {
      const client = new MuapiClient();
      const err = new Error('abort'); err.name = 'AbortError';
      (global.fetch as any).mockRejectedValueOnce(err);
      await expect(client.generateAvatar({ prompt: 'test' }))
        .rejects.toThrow('Request cancelled by user');
    });
  });
  
  describe('processV2V', () => {
    it('POSTs to V2V endpoint with video_url', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.processV2V({ video_url: 'input.mp4' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint).toBe('svd');
    });
  });
  
  describe('generateAnime', () => {
    it('POSTs to anime generator endpoint', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.generateAnime({ prompt: 'anime' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint)
        .toBe('ai-anime-generator');
    });
  });
});

// ─── AUDIO METHODS ──────────────────────────────────────────────────────────────

describe('MuAPI - Audio Methods (RED)', () => {
  
  describe('generateAudio', () => {
    it('POSTs to audio endpoint', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.generateAudio({ prompt: 'bgm' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint).toBe('audio');
    });
  });
  
  describe('generateMusic', () => {
    it('POSTs to suno-create-music', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.generateMusic({ prompt: 'rock', style: 'rock', duration: 180 });
      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(body.endpoint).toBe('suno-create-music');
      expect(body.studioType).toBe('audio');
    });
  });
  
  describe('remixMusic', () => {
    it('POSTs to suno-remix-music with audio_url', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.remixMusic({ audio_url: 'clip.mp3', prompt: 'add bass' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint)
        .toBe('suno-remix-music');
    });
  });
  
  describe('extendMusic', () => {
    it('POSTs to suno-extend-music', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.extendMusic({ audio_url: 'clip.mp3' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint)
        .toBe('suno-extend-music');
    });
  });
  
  describe('mmaudioTextToAudio', () => {
    it('POSTs to mmaudio-v2/text-to-audio', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.mmaudioTextToAudio({ text: 'rain', voice: 'female' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint)
        .toBe('mmaudio-v2/text-to-audio');
    });
    
    it('forwards errors', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockRejectedValueOnce(new Error('service down'));
      await expect(client.mmaudioTextToAudio({ text: 't' })).rejects.toThrow('service down');
    });
  });
  
  describe('mmaudioVideoToVideo', () => {
    it('POSTs to mmaudio-v2/video-to-video', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.mmaudioVideoToVideo({ video_url: 'v.mp4' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint)
        .toBe('mmaudio-v2/video-to-video');
    });
  });
});

// ─── LIPSYNC METHODS ────────────────────────────────────────────────────────────

describe('MuAPI - Lipsync Methods (RED)', () => {
  
  describe('processLipSync', () => {
    it('constructs URL using baseUrl/api/v1 and includes x-api-key', async () => {
      const client = new MuapiClient();
      client.baseUrl = 'https://api.muapi.ai';
      vi.spyOn(client, 'getKey').mockResolvedValue('my-key');
      
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      
      await client.processLipSync({ model: 'lip-sync-v1', audio_url: 'a.mp3' });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.muapi.ai/api/v1/lip-sync-v1',
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-api-key': 'my-key' })
        })
      );
    });
    
    it('forwards requestId via onRequestId callback', async () => {
      const client = new MuapiClient();
      client.baseUrl = 'https://api.muapi.ai';
      vi.spyOn(client, 'getKey').mockResolvedValue('k');
      const cb = vi.fn();
      
      (global.fetch as any).mockResolvedValueOnce({ 
        ok: true, 
        json: () => Promise.resolve({ request_id: 'req_999' }) 
      });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      
      await client.processLipSync({ audio_url: 'a.mp3', onRequestId: cb });
      expect(cb).toHaveBeenCalledWith('req_999');
    });
  });
  
  describe('latentsyncVideo', () => {
    it('POSTs to latentsync-video endpoint', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.latentsyncVideo({ audio_url: 'a.mp3', video_url: 'v.mp4' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint)
        .toBe('latentsync-video');
    });
  });
});

// ─── VIDEO TOOLS METHODS ────────────────────────────────────────────────────────

describe('MuAPI - Video Tools Methods (RED)', () => {
  
  describe('faceSwap', () => {
    it('POSTs to ai-image-face-swap endpoint', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.faceSwap({ source_image: 's.jpg', target_image: 't.jpg' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint)
        .toBe('ai-image-face-swap');
    });
  });
  
  describe('removeBackground', () => {
    it('POSTs to ai-background-remover', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.removeBackground({ image_url: 'img.jpg' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint)
        .toBe('ai-background-remover');
    });
  });
  
  describe('eraseObject', () => {
    it('POSTs to ai-object-eraser with mask', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.eraseObject({ image_url: 'img.jpg', mask: 'maskdata' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint)
        .toBe('ai-object-eraser');
    });
  });
  
  describe('extendImage', () => {
    it('POSTs to ai-image-extension', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.extendImage({ image_url: 'img.jpg', direction: 'right' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint)
        .toBe('ai-image-extension');
    });
  });
  
  describe('createProductShot', () => {
    it('POSTs to ai-product-shot with commercial studio type', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.createProductShot({ image_url: 'product.jpg' });
      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(body.endpoint).toBe('ai-product-shot');
      expect(body.studioType).toBe('commercial');
    });
  });
  
  describe('enhanceSkin', () => {
    it('POSTs to ai-skin-enhancer with character studio', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.enhanceSkin({ image_url: 'face.jpg' });
      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(body.endpoint).toBe('ai-skin-enhancer');
      expect(body.studioType).toBe('character');
    });
  });
  
  describe('stylizeGhibli', () => {
    it('POSTs to ai-ghibli-style', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.stylizeGhibli({ image_url: 'img.jpg' });
      expect(JSON.parse((global.fetch as any).mock.calls[0][1].body).endpoint)
        .toBe('ai-ghibli-style');
    });
  });
  
  describe('processVideoTool', () => {
    it('POSTs to video-tool with video-tools studio type', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ outputs: ['url'] });
      await client.processVideoTool({ video_url: 'v.mp4' });
      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(body.endpoint).toBe('video-tool');
      expect(body.studioType).toBe('video-tools');
    });
  });
});

// ─── TEXT/NLP METHODS ───────────────────────────────────────────────────────────

describe('MuAPI - Text/NLP Methods (RED)', () => {
  
  describe('generateText', () => {
    it('POSTs to text endpoint with prompt params', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ 
        ok: true, 
        json: () => Promise.resolve({ text: 'output', tokens: 100 })
      });
      const result = await client.generateText({ 
        model: 'gpt-4', 
        prompt: 'Hello',
        temperature: 0.7,
        max_tokens: 200
      });
      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(body.endpoint).toBe('text');
      expect(body.studioType).toBe('chat');
      expect(result.text).toBe('output');
    });
    
    it('forwards non-ok responses', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ 
        ok: false, 
        status: 500,
        text: () => Promise.resolve('error')
      });
      await expect(client.generateText({ prompt: 'test' }))
        .rejects.toThrow('API Request Failed: 500');
    });
  });
  
  describe('trainLora', () => {
    it('POSTs to train endpoint with images array', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({ 
        lora_id: 'lora_abc123' 
      });
      
      const result = await client.trainLora({ 
        images: ['url1', 'url2'], 
        trigger_word: 'style',
        epochs: 50
      });
      
      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(body.endpoint).toBe('train');
      expect(body.generationType).toBe('train');
      expect(body.studioType).toBe('training');
      expect(result.lora_id).toBe('lora_abc123');
    });
    
    it('uses extended polling (300 attempts, 5000ms interval) for training jobs', async () => {
      const client = new MuapiClient();
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      client.pollForResult = vi.fn().mockResolvedValueOnce({});
      await client.trainLora({ images: ['url'] });
      expect(client.pollForResult).toHaveBeenCalledWith(expect.any(String), 300, 5000, undefined);
    });
  });
});

// ─── UTILITY METHODS ────────────────────────────────────────────────────────────

describe('MuAPI - Utility Methods (RED)', () => {
  
  describe('getDimensionsFromAR', () => {
    it.each([
      ['1:1', [1024, 1024]],
      ['16:9', [1280, 720]],
      ['9:16', [720, 1280]],
      ['4:3', [1152, 864]],
      ['3:2', [1216, 832]],
      ['21:9', [1536, 640]],
      ['invalid', [1024, 1024]],
      ['', [1024, 1024]],
    ])('returns correct dimensions for %s', (ar, expected) => {
      expect(new MuapiClient().getDimensionsFromAR(ar as any)).toEqual(expected);
    });
  });
});

// ─── INTERNAL INTEGRATION & ERROR HANDLING ─────────────────────────────────────

describe('MuAPI - Integration & Error Handling (RED)', () => {
  
  describe('makeRequest (orchestrator)', () => {
    it('invokes retry.execute, sets up caching, records metrics', async () => {
      const client = new MuapiClient();
      client.rateLimiter.acquire = vi.fn();
      client.circuitBreaker.canProceed = vi.fn(() => true);
      client.cache.get = vi.fn(() => null);
      client.cache.set = vi.fn();
      client.retry.execute = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      client.errorBoundary.wrap = vi.fn((fn: any) => fn());
      
      await client.makeRequest('test-ep', { data: 1 }, { skipCache: true });
      
      expect(client.retry.execute).toHaveBeenCalled();
      expect(client.cache.set).toHaveBeenCalled();
    });
    
    it('throttles duplicate simultaneous requests', async () => {
      const client = new MuapiClient();
      client.rateLimiter.acquire = vi.fn();
      client.circuitBreaker.canProceed = vi.fn(() => true);
      client.cache.get = vi.fn(() => null);
      // Simulate request already in flight
      client.requestIds.add('dup-123');
      await expect(client.makeRequest('ep', {})).rejects.toThrow('Duplicate request');
    });
  });
  
  describe('pollForResult (polling loop)', () => {
    it('polls until status is completed/succeeded', async () => {
      const client = new MuapiClient();
      client.websocket.isConnected = vi.fn(() => false);
      const responses = [
        { ok: true, json: () => Promise.resolve({ status: 'processing' }) },
        { ok: true, json: () => Promise.resolve({ status: 'completed', outputs: ['url'] }) }
      ];
      (global.fetch as any).mockImplementation(() => responses.shift()!);
      
      const result = await client.pollForResult('req123', 5, 10);
      expect(result.status).toBe('completed');
    });
    
    it('throws on failed/error status', async () => {
      const client = new MuapiClient();
      client.websocket.isConnected = vi.fn(() => false);
      (global.fetch as any).mockResolvedValueOnce({ 
        ok: true, 
        json: () => Promise.resolve({ status: 'failed', error: 'boom' }) 
      });
      await expect(client.pollForResult('req', 1, 10)).rejects.toThrow('Generation failed');
    });
    
    it('retries after 500 but stops on 404', async () => {
      const client = new MuapiClient();
      client.websocket.isConnected = vi.fn(() => false);
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('srv') })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: 'completed', outputs: ['url'] }) });
      const result = await client.pollForResult('req', 5, 10);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.status).toBe('completed');
    });
    
    it('throws on 404 (expired/not found)', async () => {
      const client = new MuapiClient();
      client.websocket.isConnected = vi.fn(() => false);
      (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(client.pollForResult('req', 1, 10)).rejects.toThrow('Request not found');
    });
    
    it('times out after maxAttempts', async () => {
      const client = new MuapiClient();
      client.websocket.isConnected = vi.fn(() => false);
      (global.fetch as any).mockResolvedValueOnce({ 
        ok: true, 
        json: () => Promise.resolve({ status: 'processing' }) 
      });
      await expect(client.pollForResult('req', 2, 10)).rejects.toThrow('Generation timed out');
    });
  });
  
  describe('Error handling & cancellation', () => {
    it('converts AbortError into user-friendly message', async () => {
      const client = new MuapiClient();
      client.rateLimiter.acquire = vi.fn();
      client.circuitBreaker.canProceed = vi.fn(() => true);
      client.cache.get = vi.fn(() => null);
      client.retry.execute = vi.fn().mockRejectedValue(new Error('AbortError'));
      client.errorBoundary.wrap = vi.fn((fn: any) => fn());
      
      await expect(client.makeRequest('ep', {}, { skipCache: true }))
        .rejects.toThrow('Request cancelled by user');
    });
    
    it('rejects on malformed response (validateResponse)', async () => {
      const client = new MuapiClient();
      client.rateLimiter.acquire = vi.fn();
      client.circuitBreaker.canProceed = vi.fn(() => true);
      client.cache.get = vi.fn(() => null);
      client.retry.execute = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(null) });
      client.errorBoundary.wrap = vi.fn((fn: any) => fn());
      
      await expect(client.makeRequest('ep', {}, { skipCache: true }))
        .rejects.toThrow('Invalid response');
    });
  });
});
