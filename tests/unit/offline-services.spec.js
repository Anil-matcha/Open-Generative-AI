import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalAIService } from '../../src/lib/local-ai.js';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

// Mock Blob
global.Blob = vi.fn().mockImplementation((parts, options) => ({
  size: parts ? parts.join('').length : 0,
  type: options?.type || '',
  text: () => Promise.resolve(parts ? parts.join('') : ''),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
}));

describe('Local AI Service', () => {
  let ai;

  beforeEach(async () => {
    ai = new LocalAIService();
    await ai.ensureInit();
  });

  describe('Initialization', () => {
    it('should initialize available models', () => {
      expect(ai.models.size).toBeGreaterThan(0);
      expect(ai.models.has('text-to-image')).toBe(true);
      expect(ai.models.has('text-to-video')).toBe(true);
    });

    it('should report available models', () => {
      const models = ai.getAvailableModels();
      expect(models).toContain('text-to-image');
      expect(models).toContain('video-processing');
    });
  });

  describe('Text-to-Image Generation', () => {
    it('should generate images from text prompts', async () => {
      const params = {
        prompt: 'a beautiful sunset',
        aspect_ratio: '16:9',
        resolution: '1024x576'
      };

      const result = await ai.processTextToImage(params);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('width', 1024);
      expect(result).toHaveProperty('height', 576);
      expect(result.prompt).toBe(params.prompt);
      expect(result.model).toBe('local-text-to-image-v1');
    });
  });

  describe('Image-to-Image Processing', () => {
    it('should process image transformations', async () => {
      // Create a test canvas as input
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
      }
      const inputUrl = canvas.toDataURL();

      const params = {
        image_url: inputUrl,
        prompt: 'make it blue',
        strength: 0.8
      };

      const result = await ai.processImageToImage(params);

      expect(result).toHaveProperty('url');
      expect(result.prompt).toBe(params.prompt);
      expect(result.strength).toBe(params.strength);
    });
  });

  describe('Text-to-Video Generation', () => {
    it('should generate videos from text prompts', async () => {
      const params = {
        prompt: 'a butterfly flying through a garden',
        duration: 5,
        resolution: '1024x576'
      };

      const result = await ai.processTextToVideo(params);

      expect(result).toHaveProperty('url');
      expect(result.duration).toBe(params.duration);
      expect(result.model).toBe('local-text-to-video-v1');
      expect(result.note).toContain('placeholder');
    });
  });

  describe('Video Processing', () => {
    it('should process video transformations', async () => {
      const params = {
        video_url: 'blob:test-video-url',
        action: 'stabilize'
      };

      const result = await ai.processVideo(params);

      expect(result.action).toBe(params.action);
      expect(result.processed).toBe(true);
    });
  });

  describe('Audio Generation', () => {
    it('should generate audio content', async () => {
      const params = {
        prompt: 'upbeat electronic music',
        duration: 30,
        style: 'electronic'
      };

      const result = await ai.processAudio(params);

      expect(result).toHaveProperty('url');
      expect(result.duration).toBe(params.duration);
      expect(result.style).toBe(params.style);
    });
  });

  describe('Text Generation', () => {
    it('should generate text responses', async () => {
      const params = {
        prompt: 'Hello, how are you?',
        temperature: 0.7,
        max_tokens: 100
      };

      const result = await ai.processText(params);

      expect(result).toHaveProperty('text');
      expect(result.prompt).toBe(params.prompt);
      expect(result.temperature).toBe(params.temperature);
      expect(result.tokens_used).toBeGreaterThan(0);
    });
  });

  describe('Generic Processing', () => {
    it('should process requests through generic interface', async () => {
      const params = { prompt: 'test' };
      const result = await ai.processRequest('text-to-image', params);

      expect(result).toHaveProperty('url');
      expect(result.prompt).toBe(params.prompt);
    });

    it('should reject unknown model types', async () => {
      await expect(ai.processRequest('unknown-model', {})).rejects.toThrow();
    });
  });
});

  describe('Project Operations', () => {
    it('should save and load a project', async () => {
      const project = {
        name: 'Test Project',
        description: 'A test project',
        user_id: 'user123'
      };

      const saved = await storage.saveProject(project);
      expect(saved.id).toBeDefined();
      expect(saved.name).toBe('Test Project');

      const loaded = await storage.loadProject(saved.id);
      expect(loaded.name).toBe('Test Project');
    });

    it('should list projects for a user', async () => {
      const userId = 'user123';

      await storage.saveProject({ name: 'Project 1', user_id: userId });
      await storage.saveProject({ name: 'Project 2', user_id: userId });
      await storage.saveProject({ name: 'Project 3', user_id: 'other_user' });

      const projects = await storage.listProjects(userId);
      expect(projects.length).toBe(2);
      expect(projects[0].name).toBe('Project 2'); // Most recent first
      expect(projects[1].name).toBe('Project 1');
    });

    it('should delete a project', async () => {
      const project = await storage.saveProject({ name: 'Test Project', user_id: 'user123' });

      await storage.deleteProject(project.id);

      const loaded = await storage.loadProject(project.id);
      expect(loaded).toBeNull();
    });
  });

  describe('Media Operations', () => {
    it('should save and load media files', async () => {
      // Create a test blob
      const testData = 'test image data';
      const blob = new Blob([testData], { type: 'image/png' });

      const mediaData = {
        name: 'test.png',
        type: 'image/png',
        project_id: 'project123'
      };

      const saved = await storage.saveMedia(mediaData, blob);
      expect(saved.id).toBeDefined();
      expect(saved.name).toBe('test.png');

      const loaded = await storage.loadMedia(saved.id);
      expect(loaded.name).toBe('test.png');
      expect(loaded.blob).toBeInstanceOf(Blob);
    });

    it('should list media for a project', async () => {
      const projectId = 'project123';
      const blob = new Blob(['test'], { type: 'image/png' });

      await storage.saveMedia({ name: 'image1.png', project_id: projectId }, blob);
      await storage.saveMedia({ name: 'image2.png', project_id: projectId }, blob);
      await storage.saveMedia({ name: 'image3.png', project_id: 'other_project' }, blob);

      const media = await storage.listMedia(projectId);
      expect(media.length).toBe(2);
    });
  });

  describe('Settings Operations', () => {
    it('should save and load settings', async () => {
      await storage.saveSetting('theme', 'dark');
      await storage.saveSetting('language', 'en');

      const theme = await storage.loadSetting('theme');
      const language = await storage.loadSetting('language');

      expect(theme).toBe('dark');
      expect(language).toBe('en');
    });
  });

  describe('Generations Operations', () => {
    it('should save and list generations', async () => {
      const generation = {
        type: 'image',
        input: { prompt: 'test' },
        output: { url: 'test-url' },
        user_id: 'user123'
      };

      const saved = await storage.saveGeneration(generation);
      expect(saved.id).toBeDefined();

      const generations = await storage.listGenerations('user123');
      expect(generations.length).toBe(1);
      expect(generations[0].type).toBe('image');
    });
  });

  describe('Data Export/Import', () => {
    it('should export all data', async () => {
      await storage.saveProject({ name: 'Test Project', user_id: 'user123' });
      await storage.saveSetting('test', 'value');

      const data = await storage.exportData();
      expect(data.projects).toBeDefined();
      expect(data.settings).toBeDefined();
    });

    it('should import data', async () => {
      const importData = {
        projects: [{ id: 'test-project', name: 'Imported Project', user_id: 'user123' }],
        settings: [{ key: 'imported', value: 'setting' }]
      };

      await storage.importData(importData);

      const project = await storage.loadProject('test-project');
      expect(project.name).toBe('Imported Project');

      const setting = await storage.loadSetting('imported');
      expect(setting).toBe('setting');
    });
  });
});

describe('Local AI Service', () => {
  let ai;

  beforeEach(async () => {
    ai = new LocalAIService();
    await ai.ensureInit();
  });

  describe('Initialization', () => {
    it('should initialize available models', () => {
      expect(ai.models.size).toBeGreaterThan(0);
      expect(ai.models.has('text-to-image')).toBe(true);
      expect(ai.models.has('text-to-video')).toBe(true);
    });

    it('should report available models', () => {
      const models = ai.getAvailableModels();
      expect(models).toContain('text-to-image');
      expect(models).toContain('video-processing');
    });
  });

  describe('Text-to-Image Generation', () => {
    it('should generate images from text prompts', async () => {
      const params = {
        prompt: 'a beautiful sunset',
        aspect_ratio: '16:9',
        resolution: '1024x576'
      };

      const result = await ai.processTextToImage(params);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('width', 1024);
      expect(result).toHaveProperty('height', 576);
      expect(result.prompt).toBe(params.prompt);
      expect(result.model).toBe('local-text-to-image-v1');
    });
  });

  describe('Image-to-Image Processing', () => {
    it('should process image transformations', async () => {
      // Create a test canvas as input
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 100, 100);
      const inputUrl = canvas.toDataURL();

      const params = {
        image_url: inputUrl,
        prompt: 'make it blue',
        strength: 0.8
      };

      const result = await ai.processImageToImage(params);

      expect(result).toHaveProperty('url');
      expect(result.prompt).toBe(params.prompt);
      expect(result.strength).toBe(params.strength);
    });
  });

  describe('Text-to-Video Generation', () => {
    it('should generate videos from text prompts', async () => {
      const params = {
        prompt: 'a car driving through the city',
        duration: 5,
        resolution: '1024x576'
      };

      const result = await ai.processTextToVideo(params);

      expect(result).toHaveProperty('url');
      expect(result.duration).toBe(params.duration);
      expect(result.model).toBe('local-text-to-video-v1');
      expect(result.note).toContain('placeholder');
    });
  });

  describe('Video Processing', () => {
    it('should process video transformations', async () => {
      const params = {
        video_url: 'blob:test-video-url',
        action: 'stabilize'
      };

      const result = await ai.processVideo(params);

      expect(result.action).toBe(params.action);
      expect(result.processed).toBe(true);
    });
  });

  describe('Audio Generation', () => {
    it('should generate audio content', async () => {
      const params = {
        prompt: 'upbeat electronic music',
        duration: 30,
        style: 'electronic'
      };

      const result = await ai.processAudio(params);

      expect(result).toHaveProperty('url');
      expect(result.duration).toBe(params.duration);
      expect(result.style).toBe(params.style);
    });
  });

  describe('Text Generation', () => {
    it('should generate text responses', async () => {
      const params = {
        prompt: 'Hello, how are you?',
        temperature: 0.7,
        max_tokens: 100
      };

      const result = await ai.processText(params);

      expect(result).toHaveProperty('text');
      expect(result.prompt).toBe(params.prompt);
      expect(result.temperature).toBe(params.temperature);
      expect(result.tokens_used).toBeGreaterThan(0);
    });
  });

  describe('Generic Processing', () => {
    it('should process requests through generic interface', async () => {
      const params = { prompt: 'test' };
      const result = await ai.processRequest('text-to-image', params);

      expect(result).toHaveProperty('url');
      expect(result.prompt).toBe(params.prompt);
    });

    it('should reject unknown model types', async () => {
      await expect(ai.processRequest('unknown-model', {})).rejects.toThrow();
    });
  });
});