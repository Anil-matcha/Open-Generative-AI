import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} Project
 * @property {string} id - Unique project identifier
 * @property {string} title - Project title
 * @property {string} description - Project description
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {Object} settings - Project settings
 * @property {string} status - Project status ('draft', 'in-progress', 'completed')
 */

/**
 * @typedef {Object} ProjectState
 * @property {Project|null} currentProject - Currently loaded project
 * @property {Project[]} projects - List of all projects
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Error message
 */

/**
 * Project-level state management hook
 * @returns {Object} Project store with state and actions
 */
export const useProjectStore = () => {
  const [state, setState] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('project-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        if (parsed.currentProject) {
          parsed.currentProject.createdAt = new Date(parsed.currentProject.createdAt);
          parsed.currentProject.updatedAt = new Date(parsed.currentProject.updatedAt);
        }
        parsed.projects = parsed.projects.map(p => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }));
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved project state:', e);
      }
    }

    // Default state
    return {
      currentProject: null,
      projects: [],
      isLoading: false,
      error: null
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('project-state', JSON.stringify(state));
  }, [state]);

  // Actions
  const createProject = useCallback((title, description = '') => {
    const now = new Date();
    const project = {
      id: `project-${Date.now()}`,
      title: title || 'Untitled Project',
      description,
      createdAt: now,
      updatedAt: now,
      settings: {
        fps: 30,
        resolution: '1920x1080',
        aspectRatio: '16:9'
      },
      status: 'draft'
    };

    setState(prev => ({
      ...prev,
      projects: [...prev.projects, project],
      currentProject: project,
      error: null
    }));

    return project;
  }, []);

  const loadProject = useCallback((projectId) => {
    setState(prev => {
      const project = prev.projects.find(p => p.id === projectId);
      if (!project) {
        return { ...prev, error: 'Project not found' };
      }
      return { ...prev, currentProject: project, error: null };
    });
  }, []);

  const updateProject = useCallback((updates) => {
    setState(prev => {
      if (!prev.currentProject) return prev;

      const updatedProject = {
        ...prev.currentProject,
        ...updates,
        updatedAt: new Date()
      };

      return {
        ...prev,
        currentProject: updatedProject,
        projects: prev.projects.map(p =>
          p.id === updatedProject.id ? updatedProject : p
        )
      };
    });
  }, []);

  const saveProject = useCallback(async () => {
    if (!state.currentProject) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call - replace with actual save logic
      await new Promise(resolve => setTimeout(resolve, 1000));

      const savedProject = {
        ...state.currentProject,
        updatedAt: new Date()
      };

      setState(prev => ({
        ...prev,
        currentProject: savedProject,
        projects: prev.projects.map(p =>
          p.id === savedProject.id ? savedProject : p
        ),
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to save project'
      }));
    }
  }, [state.currentProject]);

  const deleteProject = useCallback((projectId) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== projectId),
      currentProject: prev.currentProject?.id === projectId ? null : prev.currentProject
    }));
  }, []);

  const exportProject = useCallback(async (format = 'json') => {
    if (!state.currentProject) return;

    try {
      const exportData = {
        ...state.currentProject,
        exportedAt: new Date(),
        format
      };

      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.currentProject.title.replace(/[^a-z0-9]/gi, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to export project' }));
    }
  }, [state.currentProject]);

  return {
    // State
    ...state,

    // Actions
    createProject,
    loadProject,
    updateProject,
    saveProject,
    deleteProject,
    exportProject,

    // Utilities
    getProjectById: (id) => state.projects.find(p => p.id === id),
    getProjectsByStatus: (status) => state.projects.filter(p => p.status === status),
    hasUnsavedChanges: () => {
      if (!state.currentProject) return false;
      return state.currentProject.updatedAt > (state.currentProject.savedAt || 0);
    }
  };
};