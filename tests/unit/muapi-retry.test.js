import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the fetchWithRetry function by importing it from muapi.js
// Since it's not exported, we test the behavior through generateImage

const mockWindow = {
  location: { protocol: 'https:' },
  dispatchEvent: vi.fn(),
  localStorage: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
  sessionStorage: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
Object.defineProperty(globalThis, 'window', { value: mockWindow, writable: true, configurable: true });

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockResponse(status, data, ok = true) {
  return { ok, status, json: async () => data, text: async () => JSON.stringify(data) };
}

import { generateImage } from '../../packages/studio/src/muapi';
const KEY = 'test-key';

describe('API Retry Logic (Exponential Backoff)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries on 429 Too Many Requests', async () => {
    // Attempt 0: 429
    mockFetch.mockResolvedValueOnce(mockResponse(429, { error: 'Rate limited' }, false));
    // Attempt 1 (retry): success
    mockFetch.mockResolvedValueOnce(mockResponse(200, { request_id: 'req-001' }));
    mockFetch.mockResolvedValueOnce(mockResponse(200, {
      status: 'completed',
      output: { url: 'https://cdn.example.com/img.png' },
    }));

    const promise = generateImage(KEY, { model: 'nano-banana', prompt: 'test retry' });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.url).toBe('https://cdn.example.com/img.png');
    // Should have been called 3 times: submit (429) + retry submit (200) + poll (200)
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('retries on 502 Bad Gateway', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(502, { error: 'Bad gateway' }, false));
    mockFetch.mockResolvedValueOnce(mockResponse(200, { request_id: 'req-002' }));
    mockFetch.mockResolvedValueOnce(mockResponse(200, {
      status: 'completed',
      output: { url: 'https://cdn.example.com/img2.png' },
    }));

    const promise = generateImage(KEY, { model: 'nano-banana', prompt: 'test 502' });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.url).toBe('https://cdn.example.com/img2.png');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('retries on 503 Service Unavailable', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(503, { error: 'Service unavailable' }, false));
    mockFetch.mockResolvedValueOnce(mockResponse(200, { request_id: 'req-003' }));
    mockFetch.mockResolvedValueOnce(mockResponse(200, {
      status: 'completed',
      output: { url: 'https://cdn.example.com/img3.png' },
    }));

    const promise = generateImage(KEY, { model: 'nano-banana', prompt: 'test 503' });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.url).toBe('https://cdn.example.com/img3.png');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry on 401 Unauthorized', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(401, { error: 'Invalid API key' }, false));

    await expect(
      generateImage(KEY, { model: 'nano-banana', prompt: 'test 401' })
    ).rejects.toThrow();

    // Should only be called once — no retry on 401
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on 400 Bad Request', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(400, { error: 'Bad request' }, false));

    await expect(
      generateImage(KEY, { model: 'nano-banana', prompt: 'test 400' })
    ).rejects.toThrow();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on network errors (TypeError from fetch)', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    mockFetch.mockResolvedValueOnce(mockResponse(200, { request_id: 'req-004' }));
    mockFetch.mockResolvedValueOnce(mockResponse(200, {
      status: 'completed',
      output: { url: 'https://cdn.example.com/img4.png' },
    }));

    const promise = generateImage(KEY, { model: 'nano-banana', prompt: 'test network' });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.url).toBe('https://cdn.example.com/img4.png');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('gives up after max retries on persistent 429', async () => {
    // All attempts return 429 — provide plenty of mock responses
    for (let i = 0; i < 50; i++) {
      mockFetch.mockResolvedValueOnce(mockResponse(429, { error: 'Rate limited' }, false));
    }

    const promise = generateImage(KEY, { model: 'nano-banana', prompt: 'test persistent' });
    
    // Run all fake timers to flush retry delays
    await vi.runAllTimersAsync();
    
    // Should eventually reject
    await expect(promise).rejects.toThrow();
  });
});
