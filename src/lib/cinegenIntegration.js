/**
 * CineGen Integration Layer (v1.1)
 * Provides unified access to CineGen Elements, AI Edit Tools, and workflows
 * for use in Timeline Editor, Video Agent, and Render pipeline.
 *
 * Supported tools: gap_fill, extend, music_generation, mask_tool, element_create, llm_chat
 */

export const CINEGEN_TOOLS = {
  GAP_FILL: 'gap_fill',
  EXTEND: 'extend',
  MUSIC: 'music_generation',
  MASK: 'mask_tool',
  ELEMENT_CREATE: 'element_create',
  LLM_CHAT: 'llm_chat',
  FILL_GAP: 'fill_gap',
  EXTEND_CLIP: 'extend_clip',
  SAM3_SEGMENT: 'sam3_segment',
  AUDIO_SYNC: 'audio_sync',
  LAYER_DECOMPOSE: 'layer_decompose',
  SHOT_BOARD: 'shot_board',
  PROXY_PLAYBACK: 'proxy_playback',
  COMPOSITION_PLAN: 'composition_plan'
};

export async function runCineGenTool(tool, params = {}) {
  console.log(`[CineGen] Running tool: ${tool}`, params);

  try {
    const res = await fetch('/.netlify/functions/cinegen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, params })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`CineGen function error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`[CineGen] Error in ${tool}:`, error);
    return { success: false, error: error.message || 'Tool execution failed' };
  }
}

export function getCineGenTools() {
  return Object.values(CINEGEN_TOOLS);
}

export function getCineGenFeatureSummary() {
  return {
    version: '1.1',
    availableTools: Object.values(CINEGEN_TOOLS),
    description: 'CineGen AI Edit Tools for Timeline Editor',
    tools: {
      gap_fill: 'AI-powered gap filling between clips',
      extend: 'Extend clips forward or backward with AI',
      music_generation: 'Generate background music from scene context',
      mask_tool: 'AI object masking and removal',
      element_create: 'Create reusable elements from clips',
      llm_chat: 'Context-aware AI assistant',
      fill_gap: 'Alias for gap_fill',
      extend_clip: 'Alias for extend',
      sam3_segment: 'SAM3 object segmentation',
      audio_sync: 'Auto-sync audio to video',
      layer_decompose: 'Separate foreground/background layers',
      shot_board: 'Generate story shot board',
      proxy_playback: 'Toggle proxy/low-res playback',
      composition_plan: 'Create AI composition plan'
    }
  };
}
