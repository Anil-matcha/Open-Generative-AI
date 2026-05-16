export const ASSET_TYPES = {
  VIDEO: 'video',
  IMAGE: 'image',
  AUDIO: 'audio',
  TEXT: 'text',
  STORYBOARD: 'storyboard',
  SCENE: 'scene',
  UNKNOWN: 'unknown'
};

export const ASSET_TYPE_VALUES = Object.values(ASSET_TYPES);

export const ASSET_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const DEFAULT_ASSET_SCHEMA = {
  id: '',
  type: 'unknown',
  title: 'Untitled Asset',
  sourceApp: 'unknown',
  createdAt: '',
  updatedAt: '',
  media: {
    url: '',
    thumbnail: '',
    type: 'unknown'
  },
  metadata: {},
  routing: {
    canOpenInDirector: false,
    canOpenInTimeline: false,
    canOpenInEditor: false,
    canOpenInRender: false
  }
};

export function validateAsset(asset) {
  if (!asset || typeof asset !== 'object') {
    return { valid: false, error: 'Asset must be an object' };
  }
  
  if (!asset.id) {
    return { valid: false, error: 'Asset must have an id' };
  }
  
  if (!ASSET_TYPE_VALUES.includes(asset.type)) {
    return { valid: false, error: `Invalid asset type: ${asset.type}` };
  }
  
  return { valid: true };
}

export function normalizeAsset(asset) {
  return {
    ...DEFAULT_ASSET_SCHEMA,
    ...asset,
    media: {
      ...DEFAULT_ASSET_SCHEMA.media,
      ...(asset.media || {})
    },
    metadata: {
      ...DEFAULT_ASSET_SCHEMA.metadata,
      ...(asset.metadata || {})
    },
    routing: {
      ...DEFAULT_ASSET_SCHEMA.routing,
      ...(asset.routing || {})
    }
  };
}