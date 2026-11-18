import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Must mock window before importing muapi (BASE_URL depends on window)
const mockWindow = {
  location: { protocol: 'https:' },
  dispatchEvent: vi.fn(),
  localStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  sessionStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
Object.defineProperty(globalThis, 'window', {
  value: mockWindow,
  writable: true,
  configurable: true,
});

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import {
  generateImage,
  getUserBalance,
} from '../../packages/studio/src/muapi';

const TEST_API_KEY = 'test-key-123';

function mockFetchResponse(status, data, ok = true) {
  return {
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

describe('muapi API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getUserBalance', () => {
    it('fetches and returns user balance', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(200, { balance: 150.5, email: 'user@test.com' })
      );

      const result = await getUserBalance(TEST_API_KEY);

      expect(result.balance).toBe(150.5);
      expect(result.email).toBe('user@test.com');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, config] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/account/balance');
      expect(config.headers['x-api-key']).toBe(TEST_API_KEY);
    });

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(500, { error: 'Internal server error' }, false)
      );

      await expect(getUserBalance(TEST_API_KEY)).rejects.toThrow();
    });

    it('handles network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      await expect(getUserBalance(TEST_API_KEY)).rejects.toThrow('Network Error');
    });
  });

  describe('generateImage (submit + poll)', () => {
    it('submits to correct endpoint with prompt and polls for result', async () => {
      // Call 1: submit
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(200, { request_id: 'req-img-001', status: 'pending' })
      );
      // Call 2: poll → completed
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(200, {
          status: 'completed',
          output: { url: 'https://cdn.example.com/gen-image.png' },
        })
      );

      const promise = generateImage(
        TEST_API_KEY,
        { model: 'nano-banana', prompt: 'a beautiful sunset', aspect_ratio: '16:9' }
      );

      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.url).toBe('https://cdn.example.com/gen-image.png');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify submit call
      const [submitUrl, submitConfig] = mockFetch.mock.calls[0];
      expect(submitUrl).toContain('/api/v1/');
      expect(submitConfig.headers['x-api-key']).toBe(TEST_API_KEY);
      expect(submitConfig.headers['Content-Type']).toBe('application/json');
      const submitBody = JSON.parse(submitConfig.body);
      expect(submitBody.prompt).toBe('a beautiful sunset');

      // Verify poll call
      const [pollUrl] = mockFetch.mock.calls[1];
      expect(pollUrl).toContain('/api/v1/predictions/req-img-001/result');
    });

    it('polls multiple times when generation is processing', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(200, { request_id: 'req-poll-001' })
      );
      // Poll 1: processing
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(200, { status: 'processing' })
      );
      // Poll 2: still processing
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(200, { status: 'processing' })
      );
      // Poll 3: completed
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(200, {
          status: 'completed',
          output: { url: 'https://cdn.example.com/result.png' },
        })
      );

      const promise = generateImage(
        TEST_API_KEY,
        { model: 'nano-banana', prompt: 'test polling' }
      );

      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.status).toBe('completed');
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 submit + 3 polls
    });

    it('throws on API submit error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(401, { error: 'Invalid API key' }, false)
      );

      await expect(
        generateImage(TEST_API_KEY, { model: 'nano-banana', prompt: 'test' })
      ).rejects.toThrow();
    });

    it('throws on network error during submit', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      await expect(
        generateImage(TEST_API_KEY, { model: 'nano-banana', prompt: 'test' })
      ).rejects.toThrow('Network Error');
    });
  });

  describe('polling timeout', () => {
    it('throws after max polling attempts', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(200, { request_id: 'req-timeout' })
      );
      // Always return processing — provide enough mock responses
      for (let i = 0; i < 200; i++) {
        mockFetch.mockResolvedValueOnce(
          mockFetchResponse(200, { status: 'processing' })
        );
      }

      // Catch the rejection to prevent unhandled rejection
      const promise = generateImage(
        TEST_API_KEY,
        { model: 'nano-banana', prompt: 'test timeout' }
      );
      
      // Attach a noop catch handler to prevent unhandled rejection warnings
      promise.catch(() => {});

      await vi.runAllTimersAsync();
      
      // Verify the promise rejected
      await expect(promise).rejects.toThrow(/timeout|timed out/i);
    });
  });

  describe('prompt validation', () => {
    it('rejects empty prompt for video models that require it', async () => {
      const { generateVideo } = await import('../../packages/studio/src/muapi');
      
      // Use a t2v model that has promptRequired: true
      await expect(
        generateVideo(TEST_API_KEY, { model: 'grok-imagine-extend', prompt: '' })
      ).rejects.toThrow(/prompt/i);
    });
  });
});
