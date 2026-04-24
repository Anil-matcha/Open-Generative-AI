export interface Model {
  id: string;
  name: string;
  type: string;
  provider: string;
  parameters?: Record<string, any>;
  description?: string;
  supportedFormats?: string[];
  maxResolution?: string;
  pricing?: {
    currency: string;
    amount: number;
    unit: string;
  };
}

export class ModelRegistry {
  private models: Map<string, Model> = new Map();

  registerModel(model: Model): void {
    if (this.models.has(model.id)) {
      throw new Error(`Model with id '${model.id}' already registered`);
    }
    this.models.set(model.id, model);
  }

  unregisterModel(modelId: string): void {
    this.models.delete(modelId);
  }

  getModel(modelId: string): Model | undefined {
    return this.models.get(modelId);
  }

  getAllModels(): Model[] {
    return Array.from(this.models.values());
  }

  getModelsByType(type: string): Model[] {
    return this.getAllModels().filter(model => model.type === type);
  }

  getModelsByProvider(provider: string): Model[] {
    return this.getAllModels().filter(model => model.provider === provider);
  }

  searchModels(query: string): Model[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllModels().filter(model =>
      model.name.toLowerCase().includes(lowerQuery) ||
      model.description?.toLowerCase().includes(lowerQuery) ||
      model.type.toLowerCase().includes(lowerQuery)
    );
  }

  async loadMuapiModels(): Promise<void> {
    try {
      // Import the models from the existing muapi infrastructure
      const { getModelById, getVideoModelById, getI2IModelById, getI2VModelById, getV2VModelById } = await import('../models.js');

      // Get available model IDs (this is a simplified approach - in reality you'd need to enumerate all models)
      const modelIds = [
        // Add known model IDs from the codebase
        // This would need to be expanded based on actual available models
      ];

      for (const modelId of modelIds) {
        try {
          const modelData = getModelById(modelId);
          if (modelData) {
            this.registerModel({
              id: modelData.id,
              name: modelData.name || modelData.id,
              type: 'image-generation', // Default type
              provider: 'muapi',
              parameters: modelData,
              description: modelData.description
            });
          }
        } catch (error) {
          console.warn(`Failed to load model ${modelId}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to load MuAPI models:', error);
    }
  }

  // Initialize with some default models for the workflow system
  initializeDefaults(): void {
    const defaultModels: Model[] = [
      {
        id: 'text-to-image-basic',
        name: 'Text to Image (Basic)',
        type: 'text-to-image',
        provider: 'muapi',
        description: 'Generate images from text prompts',
        supportedFormats: ['png', 'jpg'],
        maxResolution: '1024x1024'
      },
      {
        id: 'image-to-image',
        name: 'Image to Image',
        type: 'image-to-image',
        provider: 'muapi',
        description: 'Transform existing images based on prompts',
        supportedFormats: ['png', 'jpg'],
        maxResolution: '1024x1024'
      },
      {
        id: 'text-to-video',
        name: 'Text to Video',
        type: 'text-to-video',
        provider: 'muapi',
        description: 'Generate videos from text prompts',
        supportedFormats: ['mp4'],
        maxResolution: '1024x576'
      },
      {
        id: 'image-to-video',
        name: 'Image to Video',
        type: 'image-to-video',
        provider: 'muapi',
        description: 'Animate images into videos',
        supportedFormats: ['mp4'],
        maxResolution: '1024x576'
      },
      {
        id: 'video-to-video',
        name: 'Video to Video',
        type: 'video-to-video',
        provider: 'muapi',
        description: 'Transform existing videos',
        supportedFormats: ['mp4'],
        maxResolution: '1024x576'
      }
    ];

    for (const model of defaultModels) {
      this.registerModel(model);
    }
  }
}