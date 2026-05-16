import { describe, it, expect, beforeEach } from 'vitest';
import { assetStore } from '../../src/lib/assets/assetStore.js';
import { ASSET_TYPES, ASSET_STATUS } from '../../src/lib/assets/assetSchema.js';

describe('AssetStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and retrieve an asset', async () => {
    const asset = {
      id: 'test-asset-1',
      type: ASSET_TYPES.VIDEO,
      title: 'Test Video',
      sourceApp: 'test-app',
      status: ASSET_STATUS.READY,
      media: { url: 'https://example.com/video.mp4' },
      metadata: { duration: 10 }
    };

    await assetStore.saveAsset(asset);
    const retrieved = await assetStore.getAsset('test-asset-1');

    expect(retrieved).toBeDefined();
    expect(retrieved.title).toBe('Test Video');
    expect(retrieved.type).toBe(ASSET_TYPES.VIDEO);
  });

  it('should update an existing asset', async () => {
    const asset = {
      id: 'test-asset-2',
      type: ASSET_TYPES.VIDEO,
      title: 'Original Title',
      sourceApp: 'test-app'
    };

    await assetStore.saveAsset(asset);
    await assetStore.updateAsset('test-asset-2', { title: 'Updated Title' });
    
    const updated = await assetStore.getAsset('test-asset-2');
    expect(updated.title).toBe('Updated Title');
  });

  it('should delete an asset', async () => {
    const asset = {
      id: 'test-asset-3',
      type: ASSET_TYPES.VIDEO,
      title: 'To Delete',
      sourceApp: 'test-app'
    };

    await assetStore.saveAsset(asset);
    await assetStore.deleteAsset('test-asset-3');
    
    const retrieved = await assetStore.getAsset('test-asset-3');
    expect(retrieved).toBeNull();
  });

  it('should filter assets by type', async () => {
    await assetStore.saveAsset({
      id: 'asset-1',
      type: ASSET_TYPES.VIDEO,
      title: 'Video 1',
      sourceApp: 'test-app'
    });
    
    await assetStore.saveAsset({
      id: 'asset-2',
      type: ASSET_TYPES.IMAGE,
      title: 'Image 1',
      sourceApp: 'test-app'
    });

    const videos = await assetStore.getAssets({ type: ASSET_TYPES.VIDEO });
    expect(videos.length).toBe(1);
    expect(videos[0].type).toBe(ASSET_TYPES.VIDEO);
  });

  it('should search assets by title', async () => {
    await assetStore.saveAsset({
      id: 'asset-1',
      type: ASSET_TYPES.VIDEO,
      title: 'My Great Video',
      sourceApp: 'test-app'
    });

    const results = await assetStore.getAssets({ search: 'Great' });
    expect(results.length).toBe(1);
  });
});