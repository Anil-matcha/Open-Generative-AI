import { useState, useCallback, useEffect } from 'react';

/**
 * Base store utilities and common functionality
 * Provides common patterns for state management across stores
 */

/**
 * @typedef {Object} BaseStoreConfig
 * @property {string} storageKey - localStorage key for persistence
 * @property {Object} defaultState - Default state object
 * @property {boolean} persist - Whether to persist to localStorage
 * @property {Function} stateValidator - Optional state validation function
 */

/**
 * Generic store creator with common functionality
 * @param {BaseStoreConfig} config - Store configuration
 * @returns {Object} Base store with state and utilities
 */
export const createBaseStore = (config) => {
  const {
    storageKey,
    defaultState,
    persist = true,
    stateValidator = null
  } = config;

  return () => {
    const [state, setState] = useState(() => {
      if (!persist) return { ...defaultState };

      // Load from localStorage if available
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Validate state if validator provided
          if (stateValidator && !stateValidator(parsed)) {
            console.warn(`Invalid saved state for ${storageKey}, using defaults`);
            return { ...defaultState };
          }
          return parsed;
        } catch (e) {
          console.warn(`Failed to parse saved state for ${storageKey}:`, e);
        }
      }

      return { ...defaultState };
    });

    // Persist to localStorage
    useEffect(() => {
      if (persist) {
        localStorage.setItem(storageKey, JSON.stringify(state));
      }
    }, [state, persist]);

    // Actions
    const updateState = useCallback((updates) => {
      setState(prev => {
        const newState = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };

        // Validate new state if validator provided
        if (stateValidator && !stateValidator(newState)) {
          console.warn(`Invalid state update for ${storageKey}, ignoring`);
          return prev;
        }

        return newState;
      });
    }, [stateValidator]);

    const resetState = useCallback(() => {
      setState({ ...defaultState });
      if (persist) {
        localStorage.removeItem(storageKey);
      }
    }, [defaultState, persist]);

    const setLoading = useCallback((isLoading) => {
      setState(prev => ({ ...prev, isLoading }));
    }, []);

    const setError = useCallback((error) => {
      setState(prev => ({ ...prev, error }));
    }, []);

    const clearError = useCallback(() => {
      setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
      // State
      ...state,

      // Actions
      updateState,
      resetState,
      setLoading,
      setError,
      clearError,

      // Utilities
      isValid: () => !stateValidator || stateValidator(state),
      exportState: () => JSON.stringify(state, null, 2),
      importState: (jsonString) => {
        try {
          const imported = JSON.parse(jsonString);
          if (stateValidator && !stateValidator(imported)) {
            throw new Error('Invalid imported state');
          }
          setState(imported);
          return true;
        } catch (error) {
          console.error('Failed to import state:', error);
          return false;
        }
      }
    };
  };
};

/**
 * Hook for managing asynchronous operations with loading/error states
 * @param {Function} asyncFn - Async function to execute
 * @param {Object} options - Options for the operation
 * @returns {Object} Operation state and execute function
 */
export const useAsyncOperation = (asyncFn, options = {}) => {
  const { onSuccess, onError, initialData = null } = options;

  const [state, setState] = useState({
    data: initialData,
    isLoading: false,
    error: null
  });

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await asyncFn(...args);
      setState(prev => ({ ...prev, data: result, isLoading: false }));

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, error, isLoading: false }));

      if (onError) {
        onError(error);
      }

      throw error;
    }
  }, [asyncFn, onSuccess, onError]);

  return {
    ...state,
    execute,
    reset: () => setState({ data: initialData, isLoading: false, error: null })
  };
};

/**
 * Hook for debounced values
 * @param {any} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for managing form state
 * @param {Object} initialValues - Initial form values
 * @returns {Object} Form state and handlers
 */
export const useFormState = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const setFieldError = useCallback((field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const setFieldTouched = useCallback((field, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = Object.keys(errors).every(key => !errors[key]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    isValid,
    isDirty: JSON.stringify(values) !== JSON.stringify(initialValues)
  };
};

/**
 * Hook for event-based communication between stores
 * @returns {Object} Event emitter interface
 */
export const useEventEmitter = () => {
  const [listeners, setListeners] = useState(new Map());

  const on = useCallback((event, callback) => {
    setListeners(prev => {
      const newListeners = new Map(prev);
      if (!newListeners.has(event)) {
        newListeners.set(event, new Set());
      }
      newListeners.get(event).add(callback);
      return newListeners;
    });

    // Return unsubscribe function
    return () => {
      setListeners(prev => {
        const newListeners = new Map(prev);
        const eventListeners = newListeners.get(event);
        if (eventListeners) {
          eventListeners.delete(callback);
          if (eventListeners.size === 0) {
            newListeners.delete(event);
          }
        }
        return newListeners;
      });
    };
  }, []);

  const emit = useCallback((event, data) => {
    setListeners(prev => {
      const eventListeners = prev.get(event);
      if (eventListeners) {
        eventListeners.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in event listener for ${event}:`, error);
          }
        });
      }
      return prev;
    });
  }, []);

  const removeAllListeners = useCallback((event) => {
    setListeners(prev => {
      const newListeners = new Map(prev);
      if (event) {
        newListeners.delete(event);
      } else {
        newListeners.clear();
      }
      return newListeners;
    });
  }, []);

  return {
    on,
    emit,
    removeAllListeners,
    listenerCount: (event) => listeners.get(event)?.size || 0
  };
};

/**
 * Base store hook that combines common functionality
 * @param {BaseStoreConfig} config - Store configuration
 * @returns {Object} Base store with common functionality
 */
export const useBaseStore = (config) => {
  const store = createBaseStore(config)();
  const asyncOp = useAsyncOperation(() => Promise.resolve());
  const eventEmitter = useEventEmitter();

  return {
    ...store,
    ...asyncOp,
    events: eventEmitter
  };
};