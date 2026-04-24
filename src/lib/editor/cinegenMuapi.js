import { muapi } from '../muapi.js';

export class CineGenMuAPI {
  static async generateVideo(prompt, model = 'wan-2.1') {
    return muapi.applyWanAIEffect(prompt, model, {});
  }

  static async generateImage(prompt, model = 'flux-dev') {
    return muapi.generateImage(prompt, model, {});
  }

  static async applySAM3Segmentation(imageData, prompts) {
    return muapi.applySAM3Segmentation(imageData, prompts);
  }

  static async generateMusic(context, options) {
    return muapi.generateMusic({ ...context, ...options });
  }
}