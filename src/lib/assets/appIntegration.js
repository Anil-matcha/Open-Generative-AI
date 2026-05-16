import { saveGeneratedAsset } from './assetActions.js';

export class AIGenerationIntegration {
  constructor(appName) {
    this.appName = appName;
  }

  async saveVideo(result, prompt, options = {}) {
    return saveGeneratedAsset('video', {
      title: options.title || 'Generated Video',
      media: { url: result.videoUrl },
      metadata: {
        duration: result.duration,
        width: result.width,
        height: result.height,
        prompt: prompt,
        model: options.model || 'default',
        generationSettings: options
      }
    }, this.appName);
  }

  async saveImage(result, prompt, options = {}) {
    return saveGeneratedAsset('image', {
      title: options.title || 'Generated Image',
      media: { 
        url: result.imageUrl,
        thumbnail: result.thumbnailUrl 
      },
      metadata: {
        width: result.width,
        height: result.height,
        prompt: prompt,
        model: options.model || 'default'
      }
    }, this.appName);
  }

  async saveAudio(result, prompt, options = {}) {
    return saveGeneratedAsset('audio', {
      title: options.title || 'Generated Audio',
      media: { url: result.audioUrl },
      metadata: {
        duration: result.duration,
        prompt: prompt,
        model: options.model || 'default'
      }
    }, this.appName);
  }

  async saveStoryboard(result, prompt, options = {}) {
    return saveGeneratedAsset('storyboard', {
      title: options.title || 'Generated Storyboard',
      media: { url: result.url },
      metadata: {
        sceneCount: result.scenes?.length || 0,
        prompt: prompt,
        model: options.model || 'default'
      },
      editing: {
        scenes: result.scenes || []
      }
    }, this.appName);
  }
}

export function createAppAdapter(appName) {
  return new AIGenerationIntegration(appName);
}