import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} MakeTask
 * @property {string} id - Unique task identifier
 * @property {string} type - Task type ('text-to-video', 'image-to-video', etc.)
 * @property {Object} params - Task parameters
 * @property {string} status - Task status ('pending', 'processing', 'completed', 'failed')
 * @property {number} progress - Task progress (0-100)
 * @property {string|null} result - Task result URL or data
 * @property {string|null} error - Error message
 * @property {Date} createdAt - Task creation timestamp
 * @property {Date} updatedAt - Task update timestamp
 */

/**
 * @typedef {Object} MakeState
 * @property {MakeTask[]} tasks - Array of make tasks
 * @property {string|null} activeTaskId - Currently active task ID
 * @property {boolean} isGenerating - Whether generation is in progress
 * @property {Object} generationSettings - Default generation settings
 * @property {string[]} recentPrompts - Recently used prompts
 */

/**
 * Content generation state hook
 * @returns {Object} Make store with state and actions
 */
export const useMakeStore = () => {
  const [state, setState] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('make-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        parsed.tasks = parsed.tasks.map(t => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        }));
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved make state:', e);
      }
    }

    // Default state
    return {
      tasks: [],
      activeTaskId: null,
      isGenerating: false,
      generationSettings: {
        model: 'default',
        duration: 30,
        resolution: '1920x1080',
        style: 'realistic'
      },
      recentPrompts: []
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('make-state', JSON.stringify(state));
  }, [state]);

  // Actions
  const createTask = useCallback((type, params) => {
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      params,
      status: 'pending',
      progress: 0,
      result: null,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, task]
    }));

    return task.id;
  }, []);

  const updateTask = useCallback((taskId, updates) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates, updatedAt: new Date() } : t
      )
    }));
  }, []);

  const startGeneration = useCallback((taskId) => {
    setState(prev => ({
      ...prev,
      activeTaskId: taskId,
      isGenerating: true
    }));

    updateTask(taskId, { status: 'processing', progress: 0 });
  }, [updateTask]);

  const updateProgress = useCallback((taskId, progress) => {
    updateTask(taskId, { progress: Math.max(0, Math.min(100, progress)) });
  }, [updateTask]);

  const completeTask = useCallback((taskId, result) => {
    updateTask(taskId, {
      status: 'completed',
      progress: 100,
      result
    });

    setState(prev => ({
      ...prev,
      activeTaskId: prev.activeTaskId === taskId ? null : prev.activeTaskId,
      isGenerating: prev.activeTaskId === taskId ? false : prev.isGenerating
    }));
  }, [updateTask]);

  const failTask = useCallback((taskId, error) => {
    updateTask(taskId, {
      status: 'failed',
      error: error.message || 'Task failed'
    });

    setState(prev => ({
      ...prev,
      activeTaskId: prev.activeTaskId === taskId ? null : prev.activeTaskId,
      isGenerating: prev.activeTaskId === taskId ? false : prev.isGenerating
    }));
  }, [updateTask]);

  const cancelTask = useCallback((taskId) => {
    updateTask(taskId, { status: 'cancelled' });

    setState(prev => ({
      ...prev,
      activeTaskId: prev.activeTaskId === taskId ? null : prev.activeTaskId,
      isGenerating: prev.activeTaskId === taskId ? false : prev.isGenerating
    }));
  }, [updateTask]);

  const deleteTask = useCallback((taskId) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
      activeTaskId: prev.activeTaskId === taskId ? null : prev.activeTaskId
    }));
  }, []);

  const clearCompletedTasks = useCallback(() => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.status !== 'completed')
    }));
  }, []);

  const addRecentPrompt = useCallback((prompt) => {
    setState(prev => ({
      ...prev,
      recentPrompts: [
        prompt,
        ...prev.recentPrompts.filter(p => p !== prompt).slice(0, 9) // Keep last 10, no duplicates
      ]
    }));
  }, []);

  const updateGenerationSettings = useCallback((settings) => {
    setState(prev => ({
      ...prev,
      generationSettings: {
        ...prev.generationSettings,
        ...settings
      }
    }));
  }, []);

  // Computed values
  const activeTask = state.tasks.find(t => t.id === state.activeTaskId);
  const pendingTasks = state.tasks.filter(t => t.status === 'pending');
  const completedTasks = state.tasks.filter(t => t.status === 'completed');
  const failedTasks = state.tasks.filter(t => t.status === 'failed');

  return {
    // State
    ...state,
    activeTask,
    pendingTasks,
    completedTasks,
    failedTasks,

    // Actions
    createTask,
    updateTask,
    startGeneration,
    updateProgress,
    completeTask,
    failTask,
    cancelTask,
    deleteTask,
    clearCompletedTasks,
    addRecentPrompt,
    updateGenerationSettings,

    // Utilities
    getTaskById: (id) => state.tasks.find(t => t.id === id),
    getTasksByType: (type) => state.tasks.filter(t => t.type === type),
    getTasksByStatus: (status) => state.tasks.filter(t => t.status === status)
  };
};