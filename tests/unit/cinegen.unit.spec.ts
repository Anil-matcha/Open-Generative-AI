import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { runCineGenTool, CINEGEN_TOOLS, getCineGenTools, getCineGenFeatureSummary } from '../../src/lib/cinegenIntegration.js';

describe('CineGen Integration Unit Tests', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runCineGenTool for each tool type', () => {
    const tools = Object.values(CINEGEN_TOOLS);

    tools.forEach(tool => {
      it(`should call runCineGenTool with ${tool}`, async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, tool, result: 'mocked' })
        });

        const result = await runCineGenTool(tool, { clipId: 'test-clip' });
        expect(fetchMock).toHaveBeenCalledWith('/.netlify/functions/cinegen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool, params: { clipId: 'test-clip' } })
        });
        expect(result.success).toBe(true);
      });
    });

    it('should handle GAP_FILL specifically', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, message: 'Gap filled' }) });
      const res = await runCineGenTool(CINEGEN_TOOLS.GAP_FILL, { clipId: 'c1' });
      expect(res.message).toBe('Gap filled');
    });

    it('should handle EXTEND', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      await runCineGenTool(CINEGEN_TOOLS.EXTEND, { clipId: 'c2' });
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should handle MUSIC', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      await runCineGenTool(CINEGEN_TOOLS.MUSIC, {});
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should handle MASK, ELEMENT, SAM3, AUDIO_SYNC, LAYER, SHOT, PROXY, PLAN, POLISH', async () => {
      const extraTools = ['mask_tool', 'element_create', 'sam3_segment', 'audio_sync', 'layer_decompose', 'shot_board', 'proxy_playback', 'composition_plan'];
      for (const t of extraTools) {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
        await runCineGenTool(t, { clipId: 'c' });
      }
      expect(fetchMock).toHaveBeenCalledTimes(extraTools.length);
    });
  });

  describe('Error cases', () => {
    it('should return error object on fetch failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      const result = await runCineGenTool(CINEGEN_TOOLS.GAP_FILL, {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle non-ok response', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Server error' });
      const result = await runCineGenTool('invalid', {});
      expect(result.success).toBe(false);
    });
  });

  describe('getCineGenTools and summary', () => {
    it('should return all tool values', () => {
      const tools = getCineGenTools();
      expect(tools).toContain(CINEGEN_TOOLS.GAP_FILL);
      expect(tools.length).toBeGreaterThan(10);
    });

    it('should return feature summary with all tools', () => {
      const summary = getCineGenFeatureSummary();
      expect(summary.version).toBe('1.1');
      expect(summary.availableTools.length).toBe(14);
    });
  });
});
