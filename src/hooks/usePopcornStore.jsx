import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} PopcornElement
 * @property {string} id - Unique element identifier
 * @property {string} type - Element type ('text', 'image', 'video', 'shape')
 * @property {Object} position - Element position {x, y}
 * @property {Object} size - Element size {width, height}
 * @property {Object} properties - Element-specific properties
 * @property {number} zIndex - Element z-index
 * @property {boolean} visible - Whether element is visible
 * @property {number} startTime - Start time in timeline
 * @property {number} endTime - End time in timeline
 */

/**
 * @typedef {Object} PopcornScene
 * @property {string} id - Unique scene identifier
 * @property {string} name - Scene name
 * @property {PopcornElement[]} elements - Scene elements
 * @property {number} duration - Scene duration in seconds
 * @property {Object} background - Scene background settings
 * @property {Date} createdAt - Scene creation timestamp
 */

/**
 * @typedef {Object} PopcornState
 * @property {PopcornScene[]} scenes - Array of scenes
 * @property {string|null} activeSceneId - Currently active scene ID
 * @property {string|null} selectedElementId - Currently selected element ID
 * @property {Object} canvas - Canvas settings {width, height, zoom}
 * @property {boolean} previewMode - Whether in preview mode
 * @property {Object} timeline - Timeline settings
 */

/**
 * Popcorn timeline state management hook
 * @returns {Object} Popcorn store with state and actions
 */
export const usePopcornStore = () => {
  const [state, setState] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('popcorn-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        parsed.scenes = parsed.scenes.map(s => ({
          ...s,
          createdAt: new Date(s.createdAt)
        }));
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved popcorn state:', e);
      }
    }

    // Default state
    return {
      scenes: [
        {
          id: 'scene-1',
          name: 'Scene 1',
          elements: [],
          duration: 30,
          background: { type: 'color', value: '#ffffff' },
          createdAt: new Date()
        }
      ],
      activeSceneId: 'scene-1',
      selectedElementId: null,
      canvas: {
        width: 1920,
        height: 1080,
        zoom: 1,
        panX: 0,
        panY: 0
      },
      previewMode: false,
      timeline: {
        zoom: 1,
        currentTime: 0,
        playing: false
      }
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('popcorn-state', JSON.stringify(state));
  }, [state]);

  // Actions
  const addScene = useCallback((sceneData = {}) => {
    const scene = {
      id: `scene-${Date.now()}`,
      name: sceneData.name || `Scene ${state.scenes.length + 1}`,
      elements: [],
      duration: sceneData.duration || 30,
      background: sceneData.background || { type: 'color', value: '#ffffff' },
      createdAt: new Date(),
      ...sceneData
    };

    setState(prev => ({
      ...prev,
      scenes: [...prev.scenes, scene]
    }));

    return scene.id;
  }, [state.scenes.length]);

  const updateScene = useCallback((sceneId, updates) => {
    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(s =>
        s.id === sceneId ? { ...s, ...updates } : s
      )
    }));
  }, []);

  const deleteScene = useCallback((sceneId) => {
    setState(prev => {
      const newScenes = prev.scenes.filter(s => s.id !== sceneId);
      const newActiveSceneId = prev.activeSceneId === sceneId
        ? (newScenes.length > 0 ? newScenes[0].id : null)
        : prev.activeSceneId;

      return {
        ...prev,
        scenes: newScenes,
        activeSceneId: newActiveSceneId,
        selectedElementId: null // Clear selection when scene changes
      };
    });
  }, []);

  const setActiveScene = useCallback((sceneId) => {
    setState(prev => ({
      ...prev,
      activeSceneId: sceneId,
      selectedElementId: null // Clear element selection when changing scenes
    }));
  }, []);

  const addElement = useCallback((elementData) => {
    if (!state.activeSceneId) return null;

    const element = {
      id: `element-${Date.now()}`,
      type: 'text',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 50 },
      properties: {},
      zIndex: 1,
      visible: true,
      startTime: 0,
      endTime: state.scenes.find(s => s.id === state.activeSceneId)?.duration || 30,
      ...elementData
    };

    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(s =>
        s.id === prev.activeSceneId
          ? { ...s, elements: [...s.elements, element] }
          : s
      ),
      selectedElementId: element.id
    }));

    return element.id;
  }, [state.activeSceneId, state.scenes]);

  const updateElement = useCallback((elementId, updates) => {
    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => ({
        ...s,
        elements: s.elements.map(e =>
          e.id === elementId ? { ...e, ...updates } : e
        )
      }))
    }));
  }, []);

  const deleteElement = useCallback((elementId) => {
    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => ({
        ...s,
        elements: s.elements.filter(e => e.id !== elementId)
      })),
      selectedElementId: prev.selectedElementId === elementId ? null : prev.selectedElementId
    }));
  }, []);

  const selectElement = useCallback((elementId) => {
    setState(prev => ({ ...prev, selectedElementId: elementId }));
  }, []);

  const clearElementSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedElementId: null }));
  }, []);

  const updateCanvas = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      canvas: { ...prev.canvas, ...updates }
    }));
  }, []);

  const setPreviewMode = useCallback((previewMode) => {
    setState(prev => ({ ...prev, previewMode }));
  }, []);

  const updateTimeline = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      timeline: { ...prev.timeline, ...updates }
    }));
  }, []);

  // Computed values
  const activeScene = state.scenes.find(s => s.id === state.activeSceneId);
  const selectedElement = activeScene?.elements.find(e => e.id === state.selectedElementId);
  const totalDuration = state.scenes.reduce((sum, scene) => sum + scene.duration, 0);

  return {
    // State
    ...state,
    activeScene,
    selectedElement,
    totalDuration,

    // Actions
    addScene,
    updateScene,
    deleteScene,
    setActiveScene,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    clearElementSelection,
    updateCanvas,
    setPreviewMode,
    updateTimeline,

    // Utilities
    getSceneById: (id) => state.scenes.find(s => s.id === id),
    getElementById: (id) => {
      for (const scene of state.scenes) {
        const element = scene.elements.find(e => e.id === id);
        if (element) return element;
      }
      return null;
    },
    getElementsByType: (type) => {
      const elements = [];
      state.scenes.forEach(scene => {
        elements.push(...scene.elements.filter(e => e.type === type));
      });
      return elements;
    }
  };
};