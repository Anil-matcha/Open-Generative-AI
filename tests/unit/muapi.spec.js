import { describe, it, expect, vi } from 'vitest';
import { muapi } from '../../src/lib/muapi.js';

describe('MuAPI applyWanAIEffect', () => {
  it('should apply Wan AI effect to video successfully', async () => {
    // Mock fetch for submit request
    const submitResponse = { request_id: 'test-request-123' };
    const resultResponse = { outputs: ['https://example.com/processed-video.mp4'] };

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(submitResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(resultResponse)
      });

    global.fetch = mockFetch;

    const result = await muapi.applyWanAIEffect(
      'https://example.com/input-video.mp4',
      'cakeify',
      { prompt: 'Apply cakeify style transformation' }
    );

    expect(result).toEqual({
      success: true,
      url: 'https://example.com/processed-video.mp4'
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, muapi.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'generate_wan_ai_effects',
        params: {
          video_url: 'https://example.com/input-video.mp4',
          effect_type: 'cakeify',
          prompt: 'Apply cakeify style transformation'
        },
        generationType: 'video-effect',
        studioType: 'video'
      })
    });
  });

  it('should handle API errors', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve('Invalid effect type')
    });

    global.fetch = mockFetch;

    await expect(muapi.applyWanAIEffect('video_url', 'invalid', {})).rejects.toThrow(
      'API Request Failed: 400 Bad Request - Invalid effect type'
    );
  });

  it('should use default prompt when not provided', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ request_id: '123' })
    });

    global.fetch = mockFetch;

    await muapi.applyWanAIEffect('video_url', 'vhs', {});

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('Apply vhs style transformation')
      })
    );
  });
});