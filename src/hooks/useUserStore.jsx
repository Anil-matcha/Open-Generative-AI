import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} email - User email
 * @property {string} name - Display name
 * @property {string} avatar - Avatar URL
 * @property {Date} createdAt - Account creation date
 * @property {Date} lastLoginAt - Last login timestamp
 */

/**
 * @typedef {Object} UserPreferences
 * @property {string} theme - UI theme ('light', 'dark', 'auto')
 * @property {string} language - Interface language
 * @property {boolean} notifications - Enable notifications
 * @property {boolean} autoSave - Auto-save projects
 * @property {number} autoSaveInterval - Auto-save interval in minutes
 * @property {Object} keyboardShortcuts - Custom keyboard shortcuts
 * @property {boolean} showWelcome - Show welcome screen
 */

/**
 * @typedef {Object} UserState
 * @property {User|null} currentUser - Currently authenticated user
 * @property {boolean} isAuthenticated - Authentication status
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Error message
 * @property {UserPreferences} preferences - User preferences
 * @property {string|null} sessionToken - Current session token
 */

/**
 * User preferences and authentication state hook
 * @returns {Object} User store with state and actions
 */
export const useUserStore = () => {
  const [state, setState] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('user-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        if (parsed.currentUser) {
          parsed.currentUser.createdAt = new Date(parsed.currentUser.createdAt);
          parsed.currentUser.lastLoginAt = new Date(parsed.currentUser.lastLoginAt);
        }
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved user state:', e);
      }
    }

    // Default state
    return {
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      preferences: {
        theme: 'auto',
        language: 'en',
        notifications: true,
        autoSave: true,
        autoSaveInterval: 5,
        keyboardShortcuts: {},
        showWelcome: true
      },
      sessionToken: null
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('user-state', JSON.stringify(state));
  }, [state]);

  // Actions
  const login = useCallback(async (email, password) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call - replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user = {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
        avatar: null,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      const token = `token-${Date.now()}`;

      setState(prev => ({
        ...prev,
        currentUser: user,
        isAuthenticated: true,
        isLoading: false,
        sessionToken: token
      }));

      return { user, token };
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed'
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentUser: null,
      isAuthenticated: false,
      sessionToken: null,
      error: null
    }));

    // Clear all stored data
    localStorage.removeItem('timeline-state');
    localStorage.removeItem('project-state');
    localStorage.removeItem('media-state');
    localStorage.removeItem('ui-state');
  }, []);

  const register = useCallback(async (email, password, name) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call - replace with actual registration
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user = {
        id: `user-${Date.now()}`,
        email,
        name: name || email.split('@')[0],
        avatar: null,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      setState(prev => ({
        ...prev,
        currentUser: user,
        isAuthenticated: true,
        isLoading: false
      }));

      return user;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed'
      }));
      throw error;
    }
  }, []);

  const updateProfile = useCallback((updates) => {
    setState(prev => {
      if (!prev.currentUser) return prev;

      return {
        ...prev,
        currentUser: {
          ...prev.currentUser,
          ...updates,
          lastLoginAt: new Date() // Update last activity
        }
      };
    });
  }, []);

  const updatePreferences = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...updates
      }
    }));
  }, []);

  const resetPreferences = useCallback(() => {
    setState(prev => ({
      ...prev,
      preferences: {
        theme: 'auto',
        language: 'en',
        notifications: true,
        autoSave: true,
        autoSaveInterval: 5,
        keyboardShortcuts: {},
        showWelcome: true
      }
    }));
  }, []);

  const updateKeyboardShortcut = useCallback((action, shortcut) => {
    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        keyboardShortcuts: {
          ...prev.preferences.keyboardShortcuts,
          [action]: shortcut
        }
      }
    }));
  }, []);

  // Session management
  useEffect(() => {
    const checkSession = () => {
      if (state.sessionToken && state.currentUser) {
        // Check if session is still valid (simulate)
        const tokenAge = Date.now() - parseInt(state.sessionToken.split('-')[1]);
        if (tokenAge > 24 * 60 * 60 * 1000) { // 24 hours
          logout();
        }
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.sessionToken, state.currentUser, logout]);

  return {
    // State
    ...state,

    // Actions
    login,
    logout,
    register,
    updateProfile,
    updatePreferences,
    resetPreferences,
    updateKeyboardShortcut,

    // Utilities
    isAdmin: () => state.currentUser?.role === 'admin',
    hasPermission: (permission) => {
      // Simple permission check - extend as needed
      return state.isAuthenticated;
    },
    getKeyboardShortcut: (action) => state.preferences.keyboardShortcuts[action]
  };
};