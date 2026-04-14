import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} Notification
 * @property {string} id - Unique notification ID
 * @property {string} type - Notification type ('success', 'error', 'warning', 'info')
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {Date} timestamp - When notification was created
 * @property {boolean} read - Whether notification has been read
 * @property {number} duration - Auto-dismiss duration in milliseconds
 */

/**
 * @typedef {Object} CommonState
 * @property {Notification[]} notifications - Array of notifications
 * @property {boolean} isOnline - Online status
 * @property {Date} lastSync - Last synchronization timestamp
 * @property {Object} cache - In-memory cache for shared data
 * @property {Set} activeOperations - Set of active operation IDs
 */

/**
 * Shared state across components
 * @returns {Object} Common store with shared state and actions
 */
export const useCommonStore = () => {
  const [state, setState] = useState({
    notifications: [],
    isOnline: navigator.onLine,
    lastSync: null,
    cache: {},
    activeOperations: new Set()
  });

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Actions
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'info',
      timestamp: new Date(),
      read: false,
      duration: 5000, // 5 seconds default
      ...notification
    };

    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, newNotification]
    }));

    // Auto-dismiss if duration is set
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== notificationId)
    }));
  }, []);

  const markNotificationRead = useCallback((notificationId) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    }));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
  }, []);

  const setCacheItem = useCallback((key, value, ttl = null) => {
    setState(prev => ({
      ...prev,
      cache: {
        ...prev.cache,
        [key]: {
          value,
          timestamp: Date.now(),
          ttl
        }
      }
    }));
  }, []);

  const getCacheItem = useCallback((key) => {
    const item = state.cache[key];
    if (!item) return null;

    // Check TTL
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      // Remove expired item
      setState(prev => {
        const newCache = { ...prev.cache };
        delete newCache[key];
        return { ...prev, cache: newCache };
      });
      return null;
    }

    return item.value;
  }, [state.cache]);

  const clearCache = useCallback((key = null) => {
    setState(prev => ({
      ...prev,
      cache: key ? (() => {
        const newCache = { ...prev.cache };
        delete newCache[key];
        return newCache;
      })() : {}
    }));
  }, []);

  const startOperation = useCallback((operationId) => {
    setState(prev => ({
      ...prev,
      activeOperations: new Set([...prev.activeOperations, operationId])
    }));
  }, []);

  const endOperation = useCallback((operationId) => {
    setState(prev => {
      const newOperations = new Set(prev.activeOperations);
      newOperations.delete(operationId);
      return { ...prev, activeOperations: newOperations };
    });
  }, []);

  const isOperationActive = useCallback((operationId) => {
    return state.activeOperations.has(operationId);
  }, [state.activeOperations]);

  const updateLastSync = useCallback(() => {
    setState(prev => ({ ...prev, lastSync: new Date() }));
  }, []);

  // Computed values
  const unreadNotifications = state.notifications.filter(n => !n.read);
  const hasActiveOperations = state.activeOperations.size > 0;

  return {
    // State
    ...state,
    unreadNotifications,
    hasActiveOperations,

    // Actions
    addNotification,
    removeNotification,
    markNotificationRead,
    clearAllNotifications,
    setCacheItem,
    getCacheItem,
    clearCache,
    startOperation,
    endOperation,
    isOperationActive,
    updateLastSync,

    // Utilities
    notifySuccess: (title, message) => addNotification({ type: 'success', title, message }),
    notifyError: (title, message) => addNotification({ type: 'error', title, message }),
    notifyWarning: (title, message) => addNotification({ type: 'warning', title, message }),
    notifyInfo: (title, message) => addNotification({ type: 'info', title, message })
  };
};