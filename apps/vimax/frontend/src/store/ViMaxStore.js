/**
 * ViMax Store - State Management for ViMax Application
 *
 * A lightweight, observable store pattern with immutable updates
 * and subscription-based state change notifications.
 *
 * @module ViMaxStore
 */

/**
 * Default form configuration for ViMax pipelines.
 * @type {Object}
 */
const DEFAULT_FORM = {
  pipeline: 'idea2video',
  idea: '',
  script: '',
  requirement: '',
  style: 'Cinematic',
  quality: 'standard',
  resolution: '1080p',
  format: 'mp4',
  imageGenerator: 'google',
  videoGenerator: 'google',
  scriptFile: null,
  novelFile: null,
  photoFile: null,
  referenceVideoFile: null,
};

/**
 * Initial state shape for ViMax application.
 * @type {Object}
 */
const INITIAL_STATE = {
  activeView: 'wizard',
  currentStep: 0,
  formData: { ...DEFAULT_FORM },
  apiKey: '',
  userId: '',
  userHistory: [],
  userStats: {},
  userBatches: [],
  showAIAssistant: false,
  isEnhancing: false,
  jobId: null,
  jobStatus: null,
  wsStatus: 'disconnected',
  scenes: [],
};

/**
 * Action type constants for ViMax store operations.
 *
 * These constants ensure consistent action naming across
 * action creators and can be used for middleware/analytics.
 *
 * @enum {string}
 */
export const Actions = {
  // Navigation
  SET_ACTIVE_VIEW: 'SET_ACTIVE_VIEW',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',

  // Form
  UPDATE_FORM: 'UPDATE_FORM',

  // API & User
  SET_API_KEY: 'SET_API_KEY',
  SET_USER_ID: 'SET_USER_ID',
  SET_USER_HISTORY: 'SET_USER_HISTORY',
  SET_USER_STATS: 'SET_USER_STATS',
  SET_USER_BATCHES: 'SET_USER_BATCHES',

  // Job State
  SET_JOB_ID: 'SET_JOB_ID',
  SET_JOB_STATUS: 'SET_JOB_STATUS',

  // WebSocket
  SET_WS_STATUS: 'SET_WS_STATUS',

  // UI State
  SET_SHOW_AI_ASSISTANT: 'SET_SHOW_AI_ASSISTANT',
  SET_IS_ENHANCING: 'SET_IS_ENHANCING',

  // Scenes
  SET_SCENES: 'SET_SCENES',

  // Reset
  HANDLE_NEW_VIDEO: 'HANDLE_NEW_VIDEO',
};

/**
 * Creates a generic observable store with immutable updates.
 *
 * The store maintains private state and subscriber list via closure.
 * All updates are shallow-merged or replaced based on key overlap detection,
 * ensuring predictable state transitions while preserving immutability.
 *
 * The returned store object exposes:
 * - `state`: Direct read access to current state (immutable - do not modify directly)
 * - `subscribe(callback)`: Register state change listener
 * - `update(partial)`: Apply state changes (merge or replace based on overlap)
 *
 * @template T The state object type
 * @param {T} [initialState={}] - Initial state for the store
 * @returns {{ state: T, subscribe: (callback: (state: T) => void) => () => void, update: (partial: Partial<T>) => void }}
 *   Store instance with direct state property and methods
 *
 * @example
 * const store = createStore({ count: 0, name: 'test' });
 * store.subscribe(state => console.log(state));
 * store.update({ count: 1 }); // state becomes { count: 1, name: 'test' } (merge)
 * store.update({ newKey: 'value' }); // state becomes { newKey: 'value' } (replace)
 */
export function createStore(initialState = {}) {
  // Private state - managed via closure, exposed as read-only property
  let _state = initialState;

  // Private subscriber registry
  const _subscribers = new Set();

  // Public read-only state accessor (getter)
  const store = {
    get state() {
      return _state;
    },
  };

  /**
   * Determines if `newState` represents a partial or full state replacement.
   *
   * Merge Logic:
   * - If ANY key in `newState` exists in `_state` → merge (shallow)
   * - If NO keys overlap → replace entire state
   *
   * This "smart merge" allows both partial updates (form changes) and
   * full state resets (new video workflow) to work naturally.
   *
   * @param {Partial<T>} newState - New state values to apply
   * @private
   */
  function update(newState) {
    const newKeys = Object.keys(newState);

    // Check if there's at least one overlapping key
    const hasOverlap = newKeys.some(key => Object.prototype.hasOwnProperty.call(_state, key));

    if (hasOverlap) {
      // Shallow merge: keep existing keys, override overlapping ones
      _state = { ..._state, ...newState };
    } else {
      // Full replace: no key overlap means intent is to replace state entirely
      _state = newState;
    }

    // Notify all subscribers with new state (immutable snapshot)
    _subscribers.forEach(cb => cb(_state));
  }

  /**
   * Subscribe to state changes.
   *
   * Registers a callback that fires on every state update.
   * Returns an unsubscribe function for cleanup.
   *
   * @param {(state: typeof _state) => void} callback - Function called with new state on updates
   * @returns {() => void} Unsubscribe function
   */
  function subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Subscribe callback must be a function');
    }
    _subscribers.add(callback);
    return () => {
      _subscribers.delete(callback);
    };
  }

  // Attach methods to store object
  store.update = update;
  store.subscribe = subscribe;

  return store;
}

/**
 * Creates the ViMax application store with all state and actions.
 *
 * This factory function:
 * 1. Initializes store with ViMax-specific state shape
 * 2. Attaches bound action creator methods (store.updateForm, store.setCurrentStep, etc.)
 * 3. Adds computed/derived methods (store.canProceedFromContent)
 *
 * All actions use immutable updates via the underlying store.update() method.
 *
 * @param {Partial<typeof INITIAL_STATE>} [customInitialState={}] - Custom initial state overrides
 * @returns {ViMaxStore} Configured ViMax store instance
 *
 * @example
 * const store = createViMaxStore();
 * store.updateForm({ pipeline: 'script2video', script: 'My script' });
 * store.setCurrentStep(2);
 * const canProceed = store.canProceedFromContent();
 */
export function createViMaxStore(customInitialState = {}) {
  // Deep merge formData: defaults < custom
  const mergedFormData = {
    ...DEFAULT_FORM,
    ...(customInitialState.formData || {}),
  };

  const initialState = {
    ...INITIAL_STATE,
    ...customInitialState,
    formData: mergedFormData,
  };

  const store = createStore(initialState);

  // ============================================
  // Action Creators - Bound Store Methods
  // Each action updates specific state slices immutably
  // ============================================

  /**
   * Sets the active view (wizard, library, settings, etc).
   * @param {string} view - View name
   */
  store.setActiveView = (view) => {
    store.update({ activeView: view });
  };

  /**
   * Sets the current wizard step index.
   * @param {number} step - Step number (0-based)
   */
  store.setCurrentStep = (step) => {
    store.update({ currentStep: step });
  };

  /**
   * Merges updates into formData (shallow merge within formData).
   * Preserves other formData fields not being updated.
   *
   * @param {Partial<typeof DEFAULT_FORM>} updates - Form field updates
   */
  store.updateForm = (updates) => {
    const current = store.state.formData;
    store.update({ formData: { ...current, ...updates } });
  };

  /**
   * Sets the API key for video generation service.
   * @param {string} key - API key
   */
  store.setApiKey = (key) => {
    store.update({ apiKey: key });
  };

  /**
   * Sets the authenticated user ID.
   * @param {string} id - User ID
   */
  store.setUserId = (id) => {
    store.update({ userId: id });
  };

  /**
   * Sets user's video generation history.
   * @param {Array} history - History array
   */
  store.setUserHistory = (history) => {
    store.update({ userHistory: history });
  };

  /**
   * Sets user statistics (usage metrics).
   * @param {Object} stats - Statistics object
   */
  store.setUserStats = (stats) => {
    store.update({ userStats: stats });
  };

  /**
   * Sets user's video batches.
   * @param {Array} batches - Batches array
   */
  store.setUserBatches = (batches) => {
    store.update({ userBatches: batches });
  };

  /**
   * Sets the AI assistant panel visibility.
   * @param {boolean} show - Show/hide flag
   */
  store.setShowAIAssistant = (show) => {
    store.update({ showAIAssistant: show });
  };

  /**
   * Sets the text enhancement in-progress state.
   * @param {boolean} enhancing - Enhancement state
   */
  store.setIsEnhancing = (enhancing) => {
    store.update({ isEnhancing: enhancing });
  };

  /**
   * Sets the current job ID for generation tracking.
   * @param {string|null} id - Job ID or null
   */
  store.setJobId = (id) => {
    store.update({ jobId: id });
  };

  /**
   * Sets the current job status (pending, processing, completed, etc).
   * @param {string|null} status - Job status
   */
  store.setJobStatus = (status) => {
    store.update({ jobStatus: status });
  };

  /**
   * Sets the WebSocket connection status.
   * @param {'disconnected'|'connecting'|'connected'|'error'} status - Connection status
   */
  store.setWsStatus = (status) => {
    store.update({ wsStatus: status });
  };

  /**
   * Sets the scenes array for multi-scene videos.
   * @param {Array} scenes - Scenes array
   */
  store.setScenes = (scenes) => {
    store.update({ scenes: scenes });
  };

  /**
   * Resets state to initial values for a new video generation.
   * Clears job, scenes, and form while preserving user data (apiKey, userId, history, stats).
   * Resets step to 0 and view to 'wizard'.
   *
   * This action REPLACES state entirely (no keys overlap with formData/pipeline fields).
   * The smart merge logic detects the replacement pattern and performs full state reset.
   */
  store.handleNewVideo = () => {
    const currentApiKey = store.state.apiKey;
    const currentUserId = store.state.userId;
    const currentHistory = store.state.userHistory;
    const currentStats = store.state.userStats;
    const currentBatches = store.state.userBatches;

    // Fresh initial state, preserving user credentials and history
    const freshState = {
      ...INITIAL_STATE,
      apiKey: currentApiKey,
      userId: currentUserId,
      userHistory: currentHistory,
      userStats: currentStats,
      userBatches: currentBatches,
    };

    store.update(freshState);
  };

  // ============================================
  // Computed / Derived Methods
  // Business logic based on current state
  // ============================================

  /**
   * Validates if user can proceed from current content step.
   *
   * Validation rules per pipeline:
   * - idea2video: idea must be > 10 characters
   * - script2video: script > 20 chars OR scriptFile provided
   * - novel2video: script > 20 chars OR scriptFile OR novelFile provided
   * - cameo: idea > 5 chars AND photoFile provided
   *
   * @returns {boolean} True if can proceed, false otherwise
   */
  store.canProceedFromContent = () => {
    const { pipeline, idea, script, photoFile } = store.state.formData;

    if (pipeline === 'idea2video') {
      return idea.trim().length > 10;
    }
    if (pipeline === 'script2video') {
      return script.trim().length > 20 || !!store.state.formData.scriptFile;
    }
    if (pipeline === 'novel2video') {
      return (
        script.trim().length > 20 ||
        !!store.state.formData.scriptFile ||
        !!store.state.formData.novelFile
      );
    }
    if (pipeline === 'cameo') {
      return idea.trim().length > 5 && !!photoFile;
    }
    return true;
  };

  return store;
}

// ============================================
// Type Definition for TypeScript/IDE support
// ============================================

/**
 * ViMax Store instance type definition.
 * Includes all state properties and bound action methods.
 *
 * @typedef {ReturnType<typeof createStore> & {
 *   setActiveView: (view: string) => void;
 *   setCurrentStep: (step: number) => void;
 *   updateForm: (updates: Partial<typeof DEFAULT_FORM>) => void;
 *   setApiKey: (key: string) => void;
 *   setUserId: (id: string) => void;
 *   setUserHistory: (history: Array) => void;
 *   setUserStats: (stats: Object) => void;
 *   setUserBatches: (batches: Array) => void;
 *   setShowAIAssistant: (show: boolean) => void;
 *   setIsEnhancing: (enhancing: boolean) => void;
 *   setJobId: (id: string | null) => void;
 *   setJobStatus: (status: string | null) => void;
 *   setWsStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
 *   setScenes: (scenes: Array) => void;
 *   handleNewVideo: () => void;
 *   canProceedFromContent: () => boolean;
 * }} ViMaxStore
 */

/**
 * Default export alias for createViMaxStore.
 * @alias createViMaxStore
 */
export { createViMaxStore as default };
