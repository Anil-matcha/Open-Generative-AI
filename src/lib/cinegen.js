/**
 * CineGen Integration Layer
 * Maps CineGen Elements + AI Edit Tools to MuAPI + existing Higgsfield stack
 * Production-ready with error handling
 */
import { muapi } from './muapi.js';

export const cinegen = {
  async generateElement(params) {
    try {
      const result = await muapi.generateImage({
        prompt: params.prompt,
        model: params.model || 'flux-dev',
        ...params
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error) {
      console.error('[CineGen] Element generation failed:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Element generation failed'
      };
    }
  },

  async applyEditTool(tool, params) {
    try {
      let result;
      switch (tool) {
        case 'gap-fill':
          result = await muapi.generateVideoEffect({ type: 'gap-fill', ...params });
          break;
        case 'extend':
          result = await muapi.generateVideo({ prompt: params.prompt, duration: params.extendDuration, ...params });
          break;
        case 'music':
          result = await muapi.generateAudio({ type: 'music', prompt: params.prompt, ...params });
          break;
        default:
          throw new Error(`Unknown CineGen edit tool: ${tool}`);
      }
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error) {
      console.error(`[CineGen] Edit tool "${tool}" failed:`, error);
      return {
        success: false,
        data: null,
        error: error.message || `Edit tool "${tool}" failed`
      };
    }
  },

  async getElementsForTimeline(projectId) {
    try {
      const elements = await muapi.listAssets({ project: projectId, category: 'element' });
      return {
        success: true,
        data: elements.map(el => ({ ...el, source: 'cinegen', editable: true })),
        error: null
      };
    } catch (error) {
      console.error('[CineGen] Failed to fetch elements:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch elements'
      };
    }
  }
};

export default cinegen;
