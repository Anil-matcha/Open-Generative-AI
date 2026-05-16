import { saveGeneratedAsset } from './assetActions.js';
import { ASSET_TYPES } from './assetSchema.js';

export class AssetAdapter {
  constructor(appName) {
    this.appName = appName;
  }

  async saveVideo(data) {
    return saveGeneratedAsset(ASSET_TYPES.VIDEO, {
      ...data,
      type: ASSET_TYPES.VIDEO
    }, this.appName);
  }

  async saveImage(data) {
    return saveGeneratedAsset(ASSET_TYPES.IMAGE, {
      ...data,
      type: ASSET_TYPES.IMAGE
    }, this.appName);
  }

  async saveAudio(data) {
    return saveGeneratedAsset(ASSET_TYPES.AUDIO, {
      ...data,
      type: ASSET_TYPES.AUDIO
    }, this.appName);
  }

  async saveStoryboard(data) {
    return saveGeneratedAsset(ASSET_TYPES.STORYBOARD, {
      ...data,
      type: ASSET_TYPES.STORYBOARD
    }, this.appName);
  }

  async saveScene(data) {
    return saveGeneratedAsset(ASSET_TYPES.SCENE, {
      ...data,
      type: ASSET_TYPES.SCENE
    }, this.appName);
  }
}

export class AIVFXAdapter extends AssetAdapter {
  constructor() {
    super('ai-vfx');
  }

  async saveFromGeneration(result, prompt, options = {}) {
    return this.saveVideo({
      title: options.title || 'Generated Video',
      media: { url: result.videoUrl },
      metadata: {
        duration: result.duration,
        width: result.width,
        height: result.height,
        prompt: prompt,
        model: options.model || 'muapi-v2',
        generationSettings: options
      }
    });
  }
}

export class HeadshotAdapter extends AssetAdapter {
  constructor() {
    super('ai-headshot-generator');
  }

  async saveFromGeneration(result, prompt, options = {}) {
    return this.saveImage({
      title: 'Headshot',
      media: { 
        url: result.imageUrl,
        thumbnail: result.thumbnailUrl 
      },
      metadata: {
        width: result.width,
        height: result.height,
        prompt: prompt,
        model: 'headshot-v2'
      }
    });
  }
}

export class StoryboarderAdapter extends AssetAdapter {
  constructor() {
    super('ai-storyboarder');
  }

  async saveFromGeneration(result, prompt, options = {}) {
    return this.saveStoryboard({
      title: options.title || 'Storyboard',
      media: { url: result.url },
      metadata: {
        sceneCount: result.scenes?.length || 0,
        prompt: prompt,
        model: options.model || 'storyboarder-v1'
      },
      editing: {
        scenes: result.scenes || []
      }
    });
  }
}

export class VimaxAdapter extends AssetAdapter {
  constructor() {
    super('vimax');
  }

  async saveFromEditor(result, options = {}) {
    return this.saveVideo({
      title: options.title || 'Edited Video',
      media: { url: result.outputUrl },
      metadata: {
        duration: result.duration,
        prompt: options.prompt || '',
        model: options.model || 'vimax-editor'
      },
      editing: {
        effects: options.effects || []
      }
    });
  }
}

export const assetAdapters = {
  aiVFX: new AIVFXAdapter(),
  headshot: new HeadshotAdapter(),
  storyboarder: new StoryboarderAdapter(),
  vimax: new VimaxAdapter()
};