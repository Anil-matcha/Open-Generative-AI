import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { assetStore } from '../../src/lib/assets/assetStore.js';
import { 
  saveGeneratedAsset, 
  openInDirector, 
  openInTimeline, 
  downloadAsset,
  deleteAsset,
  duplicateAsset,
  sendToRenderQueue
} from '../../src/lib/assets/assetActions.js';

describe('Asset Pipeline - Production Ready', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Asset Storage', () => {
    it('should save and retrieve assets from localStorage', async () => {
      const asset = await saveGeneratedAsset('video', {
        title: 'Test Video',
        media: { url: 'https://example.com/video.mp4', type: 'video/mp4' },
        metadata: { duration: 10 },
        sourceApp: 'test-app'
      });

      expect(asset.id).toBeDefined();
      expect(asset.title).toBe('Test Video');
      expect(asset.type).toBe('video');
      expect(asset.sourceApp).toBe('test-app');
      expect(asset.createdAt).toBeDefined();
      expect(asset.updatedAt).toBeDefined();

      const retrieved = await assetStore.getAsset(asset.id);
      expect(retrieved.title).toBe('Test Video');
    });

    it('should list all assets', async () => {
      await saveGeneratedAsset('video', { title: 'Video 1', sourceApp: 'app1' });
      await saveGeneratedAsset('image', { title: 'Image 1', sourceApp: 'app2' });

      const assets = await assetStore.getAssets();
      expect(assets.length).toBe(2);
    });

    it('should filter assets by type', async () => {
      await saveGeneratedAsset('video', { title: 'Video 1', sourceApp: 'app1' });
      await saveGeneratedAsset('image', { title: 'Image 1', sourceApp: 'app2' });

      const videos = await assetStore.getAssets({ type: 'video' });
      expect(videos.length).toBe(1);
      expect(videos[0].type).toBe('video');
    });

    it('should filter assets by source app', async () => {
      await saveGeneratedAsset('video', { title: 'Video 1', sourceApp: 'app1' });
      await saveGeneratedAsset('video', { title: 'Video 2', sourceApp: 'app2' });

      const app1Videos = await assetStore.getAssets({ sourceApp: 'app1' });
      expect(app1Videos.length).toBe(1);
      expect(app1Videos[0].sourceApp).toBe('app1');
    });

    it('should search assets by title and metadata', async () => {
      await saveGeneratedAsset('video', { 
        title: 'Cinematic Action', 
        metadata: { prompt: 'explosions and car chases' },
        sourceApp: 'app1' 
      });
      await saveGeneratedAsset('video', { 
        title: 'Nature Documentary', 
        metadata: { prompt: 'wildlife and forests' },
        sourceApp: 'app2' 
      });

      const results = await assetStore.getAssets({ search: 'explosions' });
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Cinematic Action');
    });
  });

  describe('Asset Updates', () => {
    it('should update existing assets', async () => {
      const asset = await saveGeneratedAsset('video', {
        title: 'Original Title',
        sourceApp: 'test'
      });

      const updated = await assetStore.updateAsset(asset.id, {
        title: 'Updated Title'
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.updatedAt).toBeDefined();
    });

    it('should delete assets', async () => {
      const asset = await saveGeneratedAsset('video', { title: 'To Delete', sourceApp: 'test' });
      
      await deleteAsset(asset.id);
      
      const retrieved = await assetStore.getAsset(asset.id);
      expect(retrieved).toBeNull();
    });

    it('should duplicate assets with new IDs', async () => {
      const original = await saveGeneratedAsset('video', { 
        title: 'Original', 
        sourceApp: 'test' 
      });

      const copy = await duplicateAsset(original.id);
      
      expect(copy.id).not.toBe(original.id);
      expect(copy.title).toBe('Original (Copy)');
    });
  });

  describe('Render Queue', () => {
    it('should add items to render queue', async () => {
      const asset = await saveGeneratedAsset('video', { title: 'Queue Test', sourceApp: 'test' });
      
      const queueKey = 'render_queue';
      const beforeQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
      expect(beforeQueue.length).toBe(0);
      
      await sendToRenderQueue(asset.id);
      
      const afterQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
      expect(afterQueue.length).toBe(1);
      expect(afterQueue[0].assetId).toBe(asset.id);
      expect(afterQueue[0].status).toBe('queued');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required parameters gracefully', async () => {
      await expect(saveGeneratedAsset(null, null)).rejects.toThrow();
    });

    it('should handle invalid asset type gracefully', async () => {
      const asset = await saveGeneratedAsset('invalid_type', { title: 'Test', sourceApp: 'test' });
      expect(asset.type).toBe('invalid_type');
    });

    it('should return null for non-existent assets', async () => {
      const asset = await assetStore.getAsset('non-existent-id');
      expect(asset).toBeNull();
    });
  });

  describe('Event System', () => {
    it('should emit events when assets are created', async () => {
      let eventReceived = false;
      let eventDetail = null;

      window.addEventListener('asset:created', (e) => {
        eventReceived = true;
        eventDetail = e.detail;
      });

      await saveGeneratedAsset('video', {
        title: 'Event Test',
        media: { url: 'https://example.com/video.mp4' },
        sourceApp: 'test'
      });

      expect(eventReceived).toBe(true);
      expect(eventDetail.asset.title).toBe('Event Test');
    });
  });

  describe('Storage Robustness', () => {
    it('should handle corrupted storage gracefully', async () => {
      localStorage.setItem('universal_assets', 'not valid json');
      
      const assets = await assetStore.getAssets();
      expect(assets).toEqual([]);
    });

    it('should generate unique IDs', async () => {
      const assets = [];
      for (let i = 0; i < 10; i++) {
        const asset = await saveGeneratedAsset('video', { title: `Test ${i}`, sourceApp: 'test' });
        assets.push(asset.id);
      }
      
      const uniqueIds = new Set(assets);
      expect(uniqueIds.size).toBe(10);
    });
  });
});