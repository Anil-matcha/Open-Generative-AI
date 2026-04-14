/**
 * Store System for Centralized State Management
 * Provides observable state with subscription capabilities
 */

const stores = new Map();

/**
 * Get a store instance by name
 * @param {string} name - Store name
 * @returns {Object} Store instance
 */
export function getStore(name) {
  if (!stores.has(name)) {
    throw new Error(`Store '${name}' not found. Make sure it's registered.`);
  }
  return stores.get(name);
}

/**
 * Register a store instance
 * @param {string} name - Store name
 * @param {Object} store - Store instance
 */
export function registerStore(name, store) {
  stores.set(name, store);
}

/**
 * Create a basic store with state management
 * @param {Object} initialState - Initial state object
 * @returns {Object} Store instance with state management methods
 */
export function createStore(initialState = {}) {
  let state = { ...initialState };
  const listeners = new Set();

  const store = {
    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
      return { ...state };
    },

    /**
     * Set new state (replaces entire state)
     * @param {Object} newState - New state object
     */
    setState(newState) {
      state = { ...newState };
      this.notify();
    },

    /**
     * Update state (merges with existing state)
     * @param {Object|Function} updates - Updates to apply
     */
    updateState(updates) {
      if (typeof updates === 'function') {
        state = { ...state, ...updates(state) };
      } else {
        state = { ...state, ...updates };
      }
      this.notify();
    },

    /**
     * Subscribe to state changes
     * @param {Function} listener - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /**
     * Notify all listeners of state changes
     */
    notify() {
      listeners.forEach(listener => listener(this.getState()));
    },

    /**
     * Reset state to initial values
     */
    reset() {
      state = { ...initialState };
      this.notify();
    }
  };

  return store;
}

/**
 * Create an enhanced store with action dispatching
 * @param {Object} initialState - Initial state
 * @param {Object} actions - Action functions
 * @returns {Object} Enhanced store with dispatch method
 */
export function createActionStore(initialState = {}, actions = {}) {
  const store = createStore(initialState);

  const boundActions = {};
  Object.keys(actions).forEach(actionName => {
    boundActions[actionName] = (...args) => {
      const result = actions[actionName](store.getState(), ...args);
      if (result && typeof result === 'object') {
        store.updateState(result);
      }
    };
  });

  return {
    ...store,
    actions: boundActions,
    dispatch: (actionName, ...args) => {
      if (boundActions[actionName]) {
        boundActions[actionName](...args);
      } else {
        console.warn(`Action '${actionName}' not found`);
      }
    }
  };
}