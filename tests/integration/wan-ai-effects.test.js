import { describe, it, expect, vi } from 'vitest';
import { applyWanAIEffect, WAN_AI_EFFECTS } from '../../src/lib/muapiEnhanced.js';

describe('Wan AI Effects', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should support all 6 Wan AI effect types', () => {
    expect(Object.keys(WAN_AI_EFFECTS)).toHaveLength(6);
    expect(WAN_AI_EFFECTS.cakeify.name).toBe('Cakeify');
    expect(WAN_AI_EFFECTS.vhs.name).toBe('VHS Footage');
    expect(WAN_AI_EFFECTS.samurai.name).toBe('Samurai It');
    expect(WAN_AI_EFFECTS['film-noir'].name).toBe('Film Noir');
    expect(WAN_AI_EFFECTS.animal.name).toBe('Animal Transformation');
    expect(WAN_AI_EFFECTS.rotation.name).toBe('Rotation Effect');
  });

  it('should apply Cakeify effect successfully', async () => {
    // Mock successful API responses
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ data: { request_id: 'test-123' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({
          data: {
            status: 'completed',
            outputs: ['https://cdn.example.com/result.mp4']
          }
        })
      });

    const result = await applyWanAIEffect(
      { url: 'https://example.com/video.mp4' },
      'cakeify'
    );

    expect(result.success).toBe(true);
    expect(result.url).toBe('https://cdn.example.com/result.mp4');
  });

  it('should handle API errors gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    const result = await applyWanAIEffect(
      { url: 'https://example.com/video.mp4' },
      'cakeify'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should reject invalid effect types', async () => {
    await expect(applyWanAIEffect(
      { url: 'https://example.com/video.mp4' },
      'invalid-effect'
    )).rejects.toThrow('Unknown Wan AI effect');
  });

  it('should handle processing failures', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ data: { request_id: 'test-123' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({
          data: {
            status: 'failed',
            error: 'Processing failed on server'
          }
        })
      });

    const result = await applyWanAIEffect(
      { url: 'https://example.com/video.mp4' },
      'vhs'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Processing failed on server');
  });

  it('should handle polling timeout', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ data: { request_id: 'test-123' } })
      })
      // Mock 60 failed polling attempts
      .mockResolvedValue({
        ok: true,
        json: () => ({ data: { status: 'processing' } })
      });

    const result = await applyWanAIEffect(
      { url: 'https://example.com/video.mp4' },
      'samurai'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Polling timeout');
  });

  it('should use custom prompts when provided', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ data: { request_id: 'test-123' } })
      });

    await applyWanAIEffect(
      { url: 'https://example.com/video.mp4' },
      'cakeify',
      { prompt: 'Custom cakeify prompt' }
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('generate_wan_ai_effects'),
      expect.objectContaining({
        body: expect.stringContaining('Custom cakeify prompt')
      })
    );
  });

  it('should use default options when not specified', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ data: { request_id: 'test-123' } })
      });

    await applyWanAIEffect(
      { url: 'https://example.com/video.mp4' },
      'film-noir'
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('generate_wan_ai_effects'),
      expect.objectContaining({
        body: expect.stringContaining('"aspect_ratio":"16:9"')
      })
    );
  });
});