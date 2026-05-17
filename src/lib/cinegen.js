/**
 * CineGen Integration Layer
 * Maps CineGen Elements + AI Edit Tools to MuAPI + existing Higgsfield stack
 * No demo modes. Real calls only.
 */
import { muapi } from './muapi.js';

export const cinegen = {
  async generateElement(params) {
    // Use MuAPI for element generation (image/video asset)
    return muapi.generateImage({
      prompt: params.prompt,
      model: params.model || 'flux-dev',
      ...params
    });
  },

  async applyEditTool(tool, params) {
    // Map CineGen AI Edit Tools (GapFill, Extend, Music) to MuAPI/Render
    switch (tool) {
      case 'gap-fill':
        return muapi.generateVideoEffect({ type: 'gap-fill', ...params });
      case 'extend':
        return muapi.generateVideo({ prompt: params.prompt, duration: params.extendDuration, ...params });
      case 'music':
        return muapi.generateAudio({ type: 'music', prompt: params.prompt, ...params });
      default:
        throw new Error(`Unknown CineGen edit tool: ${tool}`);
    }
  },

  async getElementsForTimeline(projectId) {
    // Fetch CineGen-style elements and map to timeline clips
    const elements = await muapi.listAssets({ project: projectId, category: 'element' });
    return elements.map(el => ({ ...el, source: 'cinegen', editable: true }));
  }
};

export default cinegen;
