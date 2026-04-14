import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} MediaAsset
 * @property {string} id - Unique asset identifier
 * @property {string} type - Asset type ('video', 'image', 'audio')
 * @property {string} name - Asset name
 * @property {string} url - Asset URL or path
 * @property {string} thumbnailUrl - Thumbnail URL
 * @property {number} duration - Duration in seconds (for video/audio)
 * @property {Object} dimensions - Width/height for images/videos
 * @property {number} size - File size in bytes
 * @property {Date} uploadedAt - Upload timestamp
 * @property {string[]} tags - Asset tags
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {Object} UploadProgress
 * @property {string} id - Upload identifier
 * @property {number} progress - Upload progress (0-100)
 * @property {string} status - Upload status ('uploading', 'completed', 'error')
 * @property {string|null} error - Error message
 */

/**
 * @typedef {Object} MediaState
 * @property {MediaAsset[]} assets - Array of media assets
 * @property {UploadProgress[]} uploads - Current uploads
 * @property {string[]} selectedAssetIds - Selected asset IDs
 * @property {string} currentFolder - Current folder path
 * @property {string} searchQuery - Search query
 * @property {string} sortBy - Sort field ('name', 'date', 'size', 'type')
 * @property {string} sortOrder - Sort order ('asc', 'desc')
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Error message
 */

/**
 * Media asset management hook
 * @returns {Object} Media store with state and actions
 */
export const useMediaStore = () => {
  const [state, setState] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('media-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        parsed.assets = parsed.assets.map(a => ({
          ...a,
          uploadedAt: new Date(a.uploadedAt)
        }));
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved media state:', e);
      }
    }

    // Default state
    return {
      assets: [],
      uploads: [],
      selectedAssetIds: [],
      currentFolder: '/',
      searchQuery: '',
      sortBy: 'date',
      sortOrder: 'desc',
      isLoading: false,
      error: null
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('media-state', JSON.stringify(state));
  }, [state]);

  // Actions
  const addAsset = useCallback((asset) => {
    const newAsset = {
      ...asset,
      id: asset.id || `asset-${Date.now()}`,
      uploadedAt: asset.uploadedAt || new Date()
    };

    setState(prev => ({
      ...prev,
      assets: [...prev.assets, newAsset]
    }));

    return newAsset;
  }, []);

  const removeAsset = useCallback((assetId) => {
    setState(prev => ({
      ...prev,
      assets: prev.assets.filter(a => a.id !== assetId),
      selectedAssetIds: prev.selectedAssetIds.filter(id => id !== assetId)
    }));
  }, []);

  const updateAsset = useCallback((assetId, updates) => {
    setState(prev => ({
      ...prev,
      assets: prev.assets.map(a => a.id === assetId ? { ...a, ...updates } : a)
    }));
  }, []);

  const uploadAsset = useCallback(async (file, metadata = {}) => {
    const uploadId = `upload-${Date.now()}`;

    // Add to uploads
    setState(prev => ({
      ...prev,
      uploads: [...prev.uploads, {
        id: uploadId,
        progress: 0,
        status: 'uploading',
        error: null
      }]
    }));

    try {
      // Simulate upload - replace with actual upload logic
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setState(prev => ({
          ...prev,
          uploads: prev.uploads.map(u =>
            u.id === uploadId ? { ...u, progress } : u
          )
        }));
      }

      // Create asset from uploaded file
      const asset = {
        id: `asset-${Date.now()}`,
        type: file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' :
              file.type.startsWith('image/') ? 'image' : 'unknown',
        name: file.name,
        url: URL.createObjectURL(file), // In real app, this would be the uploaded URL
        thumbnailUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        size: file.size,
        uploadedAt: new Date(),
        tags: [],
        metadata: {
          originalName: file.name,
          mimeType: file.type,
          ...metadata
        }
      };

      // Add asset and complete upload
      setState(prev => ({
        ...prev,
        assets: [...prev.assets, asset],
        uploads: prev.uploads.map(u =>
          u.id === uploadId ? { ...u, progress: 100, status: 'completed' } : u
        )
      }));

      return asset;
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploads: prev.uploads.map(u =>
          u.id === uploadId ? { ...u, status: 'error', error: error.message } : u
        )
      }));
      throw error;
    }
  }, []);

  const selectAsset = useCallback((assetId, multiSelect = false) => {
    setState(prev => {
      if (multiSelect) {
        const isSelected = prev.selectedAssetIds.includes(assetId);
        return {
          ...prev,
          selectedAssetIds: isSelected
            ? prev.selectedAssetIds.filter(id => id !== assetId)
            : [...prev.selectedAssetIds, assetId]
        };
      } else {
        return {
          ...prev,
          selectedAssetIds: prev.selectedAssetIds.includes(assetId) ? [] : [assetId]
        };
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedAssetIds: [] }));
  }, []);

  const setSearchQuery = useCallback((query) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setSortBy = useCallback((sortBy) => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  const setSortOrder = useCallback((sortOrder) => {
    setState(prev => ({ ...prev, sortOrder }));
  }, []);

  const setCurrentFolder = useCallback((folder) => {
    setState(prev => ({ ...prev, currentFolder: folder }));
  }, []);

  // Computed values
  const filteredAssets = state.assets.filter(asset => {
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      return asset.name.toLowerCase().includes(query) ||
             asset.tags.some(tag => tag.toLowerCase().includes(query));
    }
    return true;
  }).sort((a, b) => {
    let aVal, bVal;

    switch (state.sortBy) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'date':
        aVal = a.uploadedAt.getTime();
        bVal = b.uploadedAt.getTime();
        break;
      case 'size':
        aVal = a.size;
        bVal = b.size;
        break;
      case 'type':
        aVal = a.type;
        bVal = b.type;
        break;
      default:
        return 0;
    }

    if (state.sortOrder === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  const selectedAssets = state.assets.filter(asset =>
    state.selectedAssetIds.includes(asset.id)
  );

  return {
    // State
    ...state,
    filteredAssets,
    selectedAssets,

    // Actions
    addAsset,
    removeAsset,
    updateAsset,
    uploadAsset,
    selectAsset,
    clearSelection,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    setCurrentFolder,

    // Utilities
    getAssetById: (id) => state.assets.find(a => a.id === id),
    getAssetsByType: (type) => state.assets.filter(a => a.type === type),
    getAssetsByTag: (tag) => state.assets.filter(a => a.tags.includes(tag))
  };
};