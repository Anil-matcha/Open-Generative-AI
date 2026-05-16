import { assetStore } from './assetStore.js';
import { ASSET_TYPE_VALUES } from './assetSchema.js';

export async function saveGeneratedAsset(type, data, sourceApp) {
  try {
    if (!type || !data) {
      throw new Error('Missing required parameters: type and data are required');
    }

    if (!ASSET_TYPE_VALUES.includes(type)) {
      console.warn(`Unknown asset type: ${type}. Using 'unknown' type.`);
    }

    const asset = await assetStore.saveAsset({
      type: type || 'unknown',
      sourceApp: sourceApp || 'unknown',
      title: data.title || `Generated ${type}`,
      media: data.media || {},
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
      ...data
    });

    window.dispatchEvent(new CustomEvent('asset:created', { 
      detail: { asset } 
    }));

    return asset;
  } catch (error) {
    console.error('Failed to save asset:', error);
    throw error;
  }
}

export async function openInDirector(assetId) {
  try {
    const asset = await assetStore.getAsset(assetId);
    if (!asset) {
      console.warn(`Asset not found: ${assetId}`);
      return;
    }
    
    window.open(`/director?asset=${assetId}`, '_blank');
    
    await assetStore.updateAsset(assetId, {
      routing: {
        ...asset.routing,
        canOpenInDirector: true
      }
    });
  } catch (error) {
    console.error('Failed to open in Director:', error);
  }
}

export async function openInTimeline(assetId) {
  try {
    const asset = await assetStore.getAsset(assetId);
    if (!asset) {
      console.warn(`Asset not found: ${assetId}`);
      return;
    }
    
    window.location.hash = `/timeline?asset=${assetId}`;
    
    await assetStore.updateAsset(assetId, {
      routing: {
        ...asset.routing,
        canOpenInTimeline: true
      }
    });
  } catch (error) {
    console.error('Failed to open in Timeline:', error);
  }
}

export async function openInEditor(assetId) {
  try {
    const asset = await assetStore.getAsset(assetId);
    if (!asset) {
      console.warn(`Asset not found: ${assetId}`);
      return;
    }
    
    window.location.hash = `/edit?asset=${assetId}`;
    
    await assetStore.updateAsset(assetId, {
      routing: {
        ...asset.routing,
        canOpenInEditor: true
      }
    });
  } catch (error) {
    console.error('Failed to open in Editor:', error);
  }
}

export async function openInRender(assetId) {
  try {
    const asset = await assetStore.getAsset(assetId);
    if (!asset) {
      console.warn(`Asset not found: ${assetId}`);
      return;
    }
    
    window.location.hash = `/render?asset=${assetId}`;
    
    await assetStore.updateAsset(assetId, {
      routing: {
        ...asset.routing,
        canOpenInRender: true
      }
    });
  } catch (error) {
    console.error('Failed to open in Render:', error);
  }
}

export async function sendToRenderQueue(assetId) {
  try {
    const asset = await assetStore.getAsset(assetId);
    if (!asset) {
      console.warn(`Asset not found: ${assetId}`);
      return;
    }
    
    const queueKey = 'render_queue';
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
    queue.push({
      id: `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assetId,
      status: 'queued',
      addedAt: new Date().toISOString()
    });
    localStorage.setItem(queueKey, JSON.stringify(queue));
    
    window.dispatchEvent(new CustomEvent('render:queued', { 
      detail: { assetId } 
    }));
  } catch (error) {
    console.error('Failed to add to render queue:', error);
  }
}

export async function downloadAsset(assetId) {
  try {
    const asset = await assetStore.getAsset(assetId);
    if (!asset || !asset.media?.url) {
      console.warn(`Asset or URL not found: ${assetId}`);
      return;
    }
    
    const a = document.createElement('a');
    a.href = asset.media.url;
    a.download = asset.title || 'asset';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Failed to download asset:', error);
  }
}

export async function deleteAsset(assetId) {
  try {
    await assetStore.deleteAsset(assetId);
    window.dispatchEvent(new CustomEvent('asset:deleted', { 
      detail: { assetId } 
    }));
  } catch (error) {
    console.error('Failed to delete asset:', error);
  }
}

export async function duplicateAsset(assetId) {
  try {
    const original = await assetStore.getAsset(assetId);
    if (!original) {
      console.warn(`Asset not found: ${assetId}`);
      return null;
    }
    
    const copy = await assetStore.saveAsset({
      ...original,
      id: undefined,
      title: `${original.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return copy;
  } catch (error) {
    console.error('Failed to duplicate asset:', error);
    throw error;
  }
}