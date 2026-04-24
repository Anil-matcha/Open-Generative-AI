import { muapi } from '../muapi.js';

export class AiMuAPI {
  static async generateVideo(prompt, model = 'wan2.1-text-to-video') {
    return muapi.generateVideo({ prompt, model });
  }

  static async generateImage(prompt, model = 'flux-dev') {
    return muapi.generateImage({ prompt, model });
  }

  static async applySAM3Segmentation(imageData, prompts) {
    throw new Error('SAM3 segmentation not yet implemented - requires video frame extraction first');
  }

  static async generateMusic(context, options) {
    return muapi.generateMusic({ ...context, ...options });
  }
}