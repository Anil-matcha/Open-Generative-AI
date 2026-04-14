import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} PanelConfig
 * @property {boolean} visible - Whether panel is visible
 * @property {number} width - Panel width in pixels
 * @property {boolean} collapsed - Whether panel is collapsed
 * @property {string} position - Panel position ('left', 'right', 'bottom')
 */

/**
 * @typedef {Object} ToolbarState
 * @property {boolean} visible - Whether toolbar is visible
 * @property {string} activeTool - Currently active tool
 * @property {Object} toolStates - State of individual tools
 */

/**
 * @typedef {Object} LayoutState
 * @property {string} mode - Layout mode ('timeline', 'preview', 'split')
 * @property {number} timelineHeight - Timeline panel height
 * @property {number} previewWidth - Preview panel width
 * @property {boolean} fullscreen - Whether in fullscreen mode
 */

/**
 * @typedef {Object} UIState
 * @property {PanelConfig} timelinePanel - Timeline panel configuration
 * @property {PanelConfig} mediaPanel - Media library panel configuration
 * @property {PanelConfig} propertiesPanel - Properties panel configuration
 * @property {ToolbarState} toolbar - Toolbar state
 * @property {LayoutState} layout - Layout state
 * @property {Object} preferences - User UI preferences
 * @property {boolean} darkMode - Whether dark mode is enabled
 * @property {string} theme - Current theme name
 */

/**
 * UI state management hook
 * @returns {Object} UI store with state and actions
 */
export const useUIStore = () => {
  const [state, setState] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('ui-state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved UI state:', e);
      }
    }

    // Default state
    return {
      timelinePanel: {
        visible: true,
        width: 400,
        collapsed: false,
        position: 'bottom'
      },
      mediaPanel: {
        visible: true,
        width: 300,
        collapsed: false,
        position: 'left'
      },
      propertiesPanel: {
        visible: true,
        width: 300,
        collapsed: false,
        position: 'right'
      },
      toolbar: {
        visible: true,
        activeTool: 'select',
        toolStates: {}
      },
      layout: {
        mode: 'split',
        timelineHeight: 300,
        previewWidth: 600,
        fullscreen: false
      },
      preferences: {
        autoSave: true,
        showTooltips: true,
        snapToGrid: true,
        gridSize: 10
      },
      darkMode: false,
      theme: 'default'
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('ui-state', JSON.stringify(state));
  }, [state]);

  // Actions
  const togglePanel = useCallback((panelName) => {
    setState(prev => ({
      ...prev,
      [panelName]: {
        ...prev[panelName],
        visible: !prev[panelName].visible
      }
    }));
  }, []);

  const setPanelWidth = useCallback((panelName, width) => {
    setState(prev => ({
      ...prev,
      [panelName]: {
        ...prev[panelName],
        width: Math.max(200, Math.min(width, 800))
      }
    }));
  }, []);

  const collapsePanel = useCallback((panelName, collapsed) => {
    setState(prev => ({
      ...prev,
      [panelName]: {
        ...prev[panelName],
        collapsed
      }
    }));
  }, []);

  const setActiveTool = useCallback((tool) => {
    setState(prev => ({
      ...prev,
      toolbar: {
        ...prev.toolbar,
        activeTool: tool
      }
    }));
  }, []);

  const setLayoutMode = useCallback((mode) => {
    setState(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        mode
      }
    }));
  }, []);

  const setTimelineHeight = useCallback((height) => {
    setState(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        timelineHeight: Math.max(200, Math.min(height, 600))
      }
    }));
  }, []);

  const setPreviewWidth = useCallback((width) => {
    setState(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        previewWidth: Math.max(400, Math.min(width, 1000))
      }
    }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    setState(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        fullscreen: !prev.layout.fullscreen
      }
    }));
  }, []);

  const updatePreference = useCallback((key, value) => {
    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      darkMode: !prev.darkMode
    }));
  }, []);

  const setTheme = useCallback((theme) => {
    setState(prev => ({
      ...prev,
      theme
    }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + T: Toggle timeline panel
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        togglePanel('timelinePanel');
      }

      // Ctrl/Cmd + M: Toggle media panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        togglePanel('mediaPanel');
      }

      // Ctrl/Cmd + P: Toggle properties panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        togglePanel('propertiesPanel');
      }

      // F11: Toggle fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePanel, toggleFullscreen]);

  return {
    // State
    ...state,

    // Actions
    togglePanel,
    setPanelWidth,
    collapsePanel,
    setActiveTool,
    setLayoutMode,
    setTimelineHeight,
    setPreviewWidth,
    toggleFullscreen,
    updatePreference,
    toggleDarkMode,
    setTheme,

    // Computed
    isCompactMode: state.layout.mode === 'compact',
    totalPanelWidth: state.mediaPanel.visible ? state.mediaPanel.width : 0 +
                    state.propertiesPanel.visible ? state.propertiesPanel.width : 0
  };
};