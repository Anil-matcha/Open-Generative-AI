import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} Preset
 * @property {string} id - Unique preset identifier
 * @property {string} name - Preset name
 * @property {string} category - Preset category ('effect', 'transition', 'filter', etc.)
 * @property {string} type - Preset type ('video-effect', 'audio-effect', 'transition', etc.)
 * @property {Object} settings - Preset settings/configuration
 * @property {string} thumbnail - Thumbnail URL
 * @property {boolean} isDefault - Whether this is a default preset
 * @property {boolean} isPremium - Whether preset requires premium
 * @property {Date} createdAt - Preset creation timestamp
 */

/**
 * @typedef {Object} PresetState
 * @property {Preset[]} presets - Array of all presets
 * @property {string|null} activePresetId - Currently active preset ID
 * @property {string} currentCategory - Current category filter
 * @property {string} searchQuery - Search query
 * @property {Object} userPresets - User-created presets
 * @property {boolean} showUserPresetsOnly - Whether to show only user presets
 */

/**
 * Preset management hook
 * @returns {Object} Preset store with state and actions
 */
export const usePresetStore = () => {
  const [state, setState] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('preset-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        parsed.presets = parsed.presets.map(p => ({
          ...p,
          createdAt: new Date(p.createdAt)
        }));
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved preset state:', e);
      }
    }

    // Default state with some built-in presets
    return {
      presets: [
        {
          id: 'preset-fade-in',
          name: 'Fade In',
          category: 'transition',
          type: 'video-effect',
          settings: { duration: 0.5, easing: 'ease-in' },
          thumbnail: '/presets/fade-in.jpg',
          isDefault: true,
          isPremium: false,
          createdAt: new Date('2024-01-01')
        },
        {
          id: 'preset-blur',
          name: 'Gaussian Blur',
          category: 'effect',
          type: 'video-effect',
          settings: { radius: 5, sigma: 2 },
          thumbnail: '/presets/blur.jpg',
          isDefault: true,
          isPremium: false,
          createdAt: new Date('2024-01-01')
        },
        {
          id: 'preset-echo',
          name: 'Echo',
          category: 'effect',
          type: 'audio-effect',
          settings: { delay: 0.3, feedback: 0.4, mix: 0.5 },
          thumbnail: '/presets/echo.jpg',
          isDefault: true,
          isPremium: false,
          createdAt: new Date('2024-01-01')
        }
      ],
      activePresetId: null,
      currentCategory: 'all',
      searchQuery: '',
      userPresets: {},
      showUserPresetsOnly: false
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('preset-state', JSON.stringify(state));
  }, [state]);

  // Actions
  const addPreset = useCallback((presetData) => {
    const preset = {
      id: `preset-${Date.now()}`,
      name: presetData.name,
      category: presetData.category,
      type: presetData.type,
      settings: presetData.settings || {},
      thumbnail: presetData.thumbnail || null,
      isDefault: false,
      isPremium: false,
      createdAt: new Date(),
      ...presetData
    };

    setState(prev => ({
      ...prev,
      presets: [...prev.presets, preset],
      userPresets: {
        ...prev.userPresets,
        [preset.id]: preset
      }
    }));

    return preset.id;
  }, []);

  const updatePreset = useCallback((presetId, updates) => {
    setState(prev => ({
      ...prev,
      presets: prev.presets.map(p =>
        p.id === presetId ? { ...p, ...updates } : p
      ),
      userPresets: {
        ...prev.userPresets,
        [presetId]: prev.userPresets[presetId] ? { ...prev.userPresets[presetId], ...updates } : undefined
      }
    }));
  }, []);

  const deletePreset = useCallback((presetId) => {
    setState(prev => {
      const preset = prev.presets.find(p => p.id === presetId);
      if (!preset || preset.isDefault) return; // Don't delete default presets

      return {
        ...prev,
        presets: prev.presets.filter(p => p.id !== presetId),
        userPresets: {
          ...prev.userPresets,
          [presetId]: undefined
        },
        activePresetId: prev.activePresetId === presetId ? null : prev.activePresetId
      };
    });
  }, []);

  const setActivePreset = useCallback((presetId) => {
    setState(prev => ({ ...prev, activePresetId: presetId }));
  }, []);

  const applyPreset = useCallback((presetId, targetId) => {
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return null;

    // Return preset settings for application
    return {
      presetId,
      targetId,
      settings: preset.settings,
      type: preset.type
    };
  }, [state.presets]);

  const duplicatePreset = useCallback((presetId) => {
    const originalPreset = state.presets.find(p => p.id === presetId);
    if (!originalPreset) return null;

    const duplicatedPreset = {
      ...originalPreset,
      id: `preset-${Date.now()}`,
      name: `${originalPreset.name} Copy`,
      isDefault: false,
      createdAt: new Date()
    };

    setState(prev => ({
      ...prev,
      presets: [...prev.presets, duplicatedPreset],
      userPresets: {
        ...prev.userPresets,
        [duplicatedPreset.id]: duplicatedPreset
      }
    }));

    return duplicatedPreset.id;
  }, [state.presets]);

  const setCategory = useCallback((category) => {
    setState(prev => ({ ...prev, currentCategory: category }));
  }, []);

  const setSearchQuery = useCallback((query) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const toggleUserPresetsOnly = useCallback(() => {
    setState(prev => ({ ...prev, showUserPresetsOnly: !prev.showUserPresetsOnly }));
  }, []);

  const importPreset = useCallback((presetData) => {
    try {
      const preset = {
        ...presetData,
        id: `preset-${Date.now()}`,
        isDefault: false,
        createdAt: new Date()
      };

      setState(prev => ({
        ...prev,
        presets: [...prev.presets, preset],
        userPresets: {
          ...prev.userPresets,
          [preset.id]: preset
        }
      }));

      return preset.id;
    } catch (error) {
      console.error('Failed to import preset:', error);
      return null;
    }
  }, []);

  const exportPreset = useCallback((presetId) => {
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return null;

    const exportData = {
      ...preset,
      exportedAt: new Date()
    };

    // Create download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name.replace(/[^a-z0-9]/gi, '_')}.preset.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return exportData;
  }, [state.presets]);

  // Computed values
  const filteredPresets = state.presets.filter(preset => {
    // User presets filter
    if (state.showUserPresetsOnly && preset.isDefault) {
      return false;
    }

    // Category filter
    if (state.currentCategory !== 'all' && preset.category !== state.currentCategory) {
      return false;
    }

    // Search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      return preset.name.toLowerCase().includes(query) ||
             preset.category.toLowerCase().includes(query) ||
             preset.type.toLowerCase().includes(query);
    }

    return true;
  });

  const categories = [...new Set(state.presets.map(p => p.category))];
  const activePreset = state.presets.find(p => p.id === state.activePresetId);
  const userCreatedPresets = state.presets.filter(p => !p.isDefault);

  return {
    // State
    ...state,
    filteredPresets,
    categories,
    activePreset,
    userCreatedPresets,

    // Actions
    addPreset,
    updatePreset,
    deletePreset,
    setActivePreset,
    applyPreset,
    duplicatePreset,
    setCategory,
    setSearchQuery,
    toggleUserPresetsOnly,
    importPreset,
    exportPreset,

    // Utilities
    getPresetById: (id) => state.presets.find(p => p.id === id),
    getPresetsByCategory: (category) => state.presets.filter(p => p.category === category),
    getPresetsByType: (type) => state.presets.filter(p => p.type === type)
  };
};