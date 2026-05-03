/**
 * TimelineState - Unified State Manager for Timeline Editor
 *
 * Consolidates timelineEditorState.js and TimelineEngine state management
 * Provides centralized state with subscription pattern, persistence, and
 * backward compatibility with legacy project data.
 */

import { createCameraState } from './cameraState';

export class TimelineState {
  /**
   * Create TimelineState instance
   * @param {Object} options - Configuration options
   * @param {Storage} options.storage - Storage backend (default: localStorage)
   * @param {boolean} options.autopersist - Enable auto-persistence (default: true)
   * @param {string} options.storageKey - Key for localStorage (default: 'timeline-state')
   */
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.autopersist = options.autopersist !== false;
    this.storageKey = options.storageKey || 'timeline-state';

    this.subscribers = new Set();
    this._state = null;
    this._pendingState = null;

    // Initialize state
    this._initializeState();
  }

  /**
   * Initialize state with defaults or from persistence
   */
  _initializeState() {
    const defaultState = this._getDefaultState();

    // Try to load from storage
    if (this.storage) {
      try {
        const saved = this.storage.getItem(this.storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Merge with defaults to handle missing properties
          this._state = this._deepMerge(defaultState, parsed);
          // Validate integrity
          if (!this._validateState(this._state)) {
            console.warn('[TimelineState] Invalid persisted state, using defaults');
            this._state = defaultState;
          }
        } else {
          this._state = defaultState;
        }
      } catch (error) {
        console.error('[TimelineState] Failed to load persisted state:', error);
        this._state = defaultState;
      }
    } else {
      this._state = defaultState;
    }
  }

  /**
   * Get default state structure
   */
  _getDefaultState() {
    return {
      project: {
        id: `project-${Date.now()}`,
        fps: 30,
        duration: 60,
        aspectRatio: '16:9',
        tracks: [
          {
            id: 'video-1',
            type: 'video',
            name: 'Video',
            locked: false,
            muted: false,
            solo: false,
            visible: true,
            height: 80,
            color: '#3b82f6',
            items: [
              {
                id: 1,
                assetId: 'asset-1',
                type: 'video',
                start: 4.8,
                end: 22.8,
                sourceStart: 0,
                sourceEnd: 18,
                lane: 0,
                trimIn: 0,
                trimOut: 18,
                volume: 1,
                playbackRate: 1,
                effects: [],
                opacity: 1,
                transform: { x: 0, y: 0, scale: 1, rotation: 0 },
                name: 'Opening Shot'
              },
              {
                id: 2,
                assetId: 'asset-2',
                type: 'video',
                start: 20.4,
                end: 32.4,
                sourceStart: 0,
                sourceEnd: 12,
                lane: 0,
                trimIn: 0,
                trimOut: 12,
                volume: 1,
                playbackRate: 1,
                effects: [],
                opacity: 1,
                transform: { x: 0, y: 0, scale: 1, rotation: 0 },
                name: 'Generated Clip'
              }
            ]
          },
          {
            id: 'audio-1',
            type: 'audio',
            name: 'Audio',
            locked: false,
            muted: false,
            solo: false,
            visible: true,
            height: 60,
            color: '#10b981',
            items: [
              {
                id: 3,
                assetId: 'asset-3',
                type: 'audio',
                start: 3,
                end: 45,
                sourceStart: 0,
                sourceEnd: 42,
                lane: 0,
                trimIn: 0,
                trimOut: 42,
                volume: 0.8,
                playbackRate: 1,
                effects: [],
                opacity: 1,
                waveformData: [0.1, 0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.2, 0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.2, 0.1],
                name: 'Music Bed'
              }
            ]
          },
          {
            id: 'text-1',
            type: 'text',
            name: 'Text',
            locked: false,
            muted: false,
            solo: false,
            visible: true,
            height: 50,
            color: '#f59e0b',
            items: [
              {
                id: 4,
                assetId: 'asset-4',
                type: 'text',
                start: 8.4,
                end: 16.8,
                sourceStart: 0,
                sourceEnd: 8.4,
                lane: 0,
                trimIn: 0,
                trimOut: 8.4,
                volume: 1,
                playbackRate: 1,
                effects: [],
                opacity: 1,
                text: 'Welcome to our enhanced timeline editor',
                style: {
                  fontSize: 24,
                  color: '#ffffff',
                  background: 'rgba(0,0,0,0.7)',
                  fontFamily: 'Inter',
                  textAlign: 'center'
                },
                name: 'Title Card'
              }
            ]
          },
          {
            id: 'broll-1',
            type: 'video',
            name: 'B-Roll',
            locked: false,
            muted: false,
            solo: false,
            visible: true,
            height: 60,
            color: '#8b5cf6',
            items: [
              {
                id: 5,
                assetId: 'asset-5',
                type: 'video',
                start: 31.2,
                end: 43.2,
                sourceStart: 0,
                sourceEnd: 12,
                lane: 0,
                trimIn: 0,
                trimOut: 12,
                volume: 1,
                playbackRate: 1,
                effects: [],
                opacity: 1,
                transform: { x: 0, y: 0, scale: 1, rotation: 0 },
                name: 'City Cutaway'
              }
            ]
          }
        ],
        assets: [
          { id: 'asset-1', type: 'video', name: 'Opening Shot', duration: 18, url: null, thumbnail: null },
          { id: 'asset-2', type: 'video', name: 'Generated Clip', duration: 12, url: null, thumbnail: null },
          { id: 'asset-3', type: 'audio', name: 'Music Bed', duration: 42, url: null, waveformData: [0.1, 0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.2, 0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.2, 0.1] },
          { id: 'asset-4', type: 'text', name: 'Title Card', duration: 8.4, url: null },
          { id: 'asset-5', type: 'video', name: 'City Cutaway', duration: 12, url: null, thumbnail: null }
        ],
        markers: [],
        captions: [],
        effects: []
      },
      projectTitle: 'Untitled Project',
      timelineSeconds: 60,
      zoom: 1.0,
      pan: 0,
      isTimelineOpen: true,
      timelineHeight: 300,
      playheadPercent: 0,
      selectedTool: 'Select',
      selectedClipId: null,
      selectedClipIds: new Set(),
      generateType: 'Text',
      playing: false,
      snapEnabled: true,
      autoScrollEnabled: true,
      showRuler: true,
      showWaveforms: true,
      selectedRange: null,
      clipboard: null,
      multiCameraMode: false,
      pipMode: false,
      splitScreenMode: false,
      cameraAngles: [],
      activeCameraAngle: null,
      compositingMode: 'normal'
      // Note: No top-level 'tracks' anymore; tracks live in project.tracks
    };
  }

  /**
   * Deep merge utility for state initialization
   */
  _deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this._isObject(target) && this._isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this._isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this._deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  _isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Validate state structure integrity
   */
  _validateState(state) {
    if (!state || typeof state !== 'object') return false;
    if (!state.project) return false;
    if (!Array.isArray(state.project.tracks)) return false;
    if (typeof state.zoom !== 'number' || isNaN(state.zoom)) return false;
    if (typeof state.playheadPercent !== 'number' || isNaN(state.playheadPercent)) return false;
    return true;
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Get current state (read-only copy)
   * @returns {Object} Deep clone of current state with compatibility properties
   */
  getState() {
    const clone = JSON.parse(JSON.stringify(this._state));
    // Backward compatibility: root-level tracks and duration for TimelineEngine
    if (clone.project) {
      clone.tracks = clone.project.tracks;
      clone.duration = clone.project.duration;
    }
    return clone;
  }

  /**
   * Get raw state reference (use with caution)
   * @returns {Object} Raw state object
   */
  getRawState() {
    return this._state;
  }

  /**
   * Update state immutably and notify subscribers
   * @param {Object} updates - Partial state updates (only known top-level keys allowed)
   */
  setState(updates) {
    // Guard: if state destroyed, ignore
    if (!this._state) return;

    // Filter updates to only allow known top-level keys (prevent adding arbitrary properties)
    const allowedKeys = Object.keys(this._state);
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedKeys.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) return;

    // Check if any actual change would occur
    const hasChanges = this._hasChanges(this._state, filteredUpdates);
    if (!hasChanges) {
      return; // No changes, skip merge and notification
    }

    // Capture previous state before modification
    const previousState = this.getState();

    // Apply updates immutably
    this._state = this._deepMerge(this._state, filteredUpdates);

    // Normalize state (clamp values, validate, etc.)
    this._normalizeState();

    // Notify subscribers with (previous, current)
    this._notify(previousState, this.getState());

    // Persist if auto-persist enabled
    if (this.autopersist && this.storage) {
      this._persist();
    }
  }

  /**
   * Get state before any modifications (for notification)
   */
  getStateBeforeUpdate() {
    // We need a copy of state before it was modified; but we already have previous state before merge?
    // Actually we need to capture previous before modification; we'll refactor to capture earlier.
    return this._lastStateBeforeUpdate;
  }

  /**
   * Check if updates contain any actual changes
   */
  _hasChanges(current, updates) {
    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        const newVal = updates[key];
        const oldVal = current[key];
        if (oldVal !== newVal) {
          // For objects, check nested equality if both are objects (non-null)
          if (typeof newVal === 'object' && newVal !== null && !Array.isArray(newVal) && !(newVal instanceof Set) &&
              typeof oldVal === 'object' && oldVal !== null && !Array.isArray(oldVal) && !(oldVal instanceof Set)) {
            // Recursively check nested object changes
            if (!this._objectsEqual(oldVal, newVal)) {
              return true;
            }
          } else {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Shallow equality for plain objects
   */
  _objectsEqual(a, b) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (a[key] !== b[key]) return false;
    }
    return true;
  }

  /**
   * Normalize state values (clamping, validation)
   */
  _normalizeState() {
    // Clamp zoom
    this._state.zoom = Math.max(0.1, Math.min(10, this._state.zoom));

    // Clamp playhead percent
    this._state.playheadPercent = Math.max(0, Math.min(100, this._state.playheadPercent));

    // Clamp pan
    this._state.pan = Math.max(0, this._state.pan);

    // Ensure arrays exist
    if (!Array.isArray(this._state.project.tracks)) {
      this._state.project.tracks = [];
    }
    if (!Array.isArray(this._state.project.assets)) {
      this._state.project.assets = [];
    }
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Called with (previousState, currentState)
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of state change
   */
  _notify(previousState, currentState) {
    this.subscribers.forEach(callback => {
      try {
        callback(previousState, currentState);
      } catch (error) {
        console.error('[TimelineState] Subscriber error:', error);
      }
    });
  }

  /**
   * Persist state to storage
   */
  _persist() {
    if (!this.storage) return;
    try {
      // Convert Sets to arrays for JSON serialization
      const serializableState = this._prepareForSerialization(this._state);
      this.storage.setItem(this.storageKey, JSON.stringify(serializableState));
    } catch (error) {
      console.error('[TimelineState] Persistence error:', error);
    }
  }

  /**
   * Prepare state for JSON serialization (convert Sets, etc.)
   */
  _prepareForSerialization(state) {
    const copy = JSON.parse(JSON.stringify(state));
    // Convert Set properties back to arrays if needed
    if (copy.selectedClipIds && copy.selectedClipIds instanceof Set) {
      copy.selectedClipIds = Array.from(copy.selectedClipIds);
    }
    return copy;
  }

  /**
   * Manually persist state (alias for _persist)
   */
  persist() {
    this._persist();
  }

  /**
   * Clear persisted state from storage
   */
  clearPersistence() {
    if (this.storage) {
      this.storage.removeItem(this.storageKey);
    }
  }

  /**
   * Destroy state manager and clean up
   */
  destroy() {
    this.subscribers.clear();
    this._state = null;
  }

  // ============================================
  // DOMAIN-SPECIFIC OPERATIONS
  // ============================================

  /**
   * Update playhead position
   * @param {number} percent - Playhead percent (0-100)
   */
  updatePlayhead(percent) {
    this.setState({ playheadPercent: Math.max(0, Math.min(100, percent)) });
  }

  /**
   * Set zoom level with clamping
   * @param {number} zoom - Zoom level (0.1-10)
   */
  setZoom(zoom) {
    this.setState({ zoom });
  }

  /**
   * Zoom in by increment
   */
  zoomIn() {
    this.setState({ zoom: Math.min(10, this._state.zoom + 0.1) });
  }

  /**
   * Zoom out by decrement
   */
  zoomOut() {
    this.setState({ zoom: Math.max(0.1, this._state.zoom - 0.1) });
  }

  /**
   * Set selected tool
   * @param {string} tool - Tool name
   */
  setSelectedTool(tool) {
    this.setState({ selectedTool: tool });
  }

  /**
   * Update track property
   * @param {string} trackId - Track ID
   * @param {Object} updates - Property updates
   */
  updateTrack(trackId, updates) {
    const tracks = this._state.project.tracks.map(track =>
      track.id === trackId ? { ...track, ...updates } : track
    );
    this.setState({ project: { ...this._state.project, tracks } });
  }

  /**
   * Add a new track
   * @param {Object} trackData - Track definition
   * @returns {string} New track ID
   */
  addTrack(trackData) {
    const track = {
      id: trackData.id || `${trackData.type || 'track'}-${Date.now()}`,
      type: trackData.type || 'video',
      name: trackData.name || `${trackData.type || 'Track'} Track`,
      locked: false,
      muted: false,
      solo: false,
      visible: true,
      height: trackData.height || 80,
      color: trackData.color || '#3b82f6',
      items: []
    };

    const tracks = [...this._state.project.tracks, track];
    this.setState({ project: { ...this._state.project, tracks } });
    return track.id;
  }

  /**
   * Remove a track
   * @param {string} trackId - Track ID to remove
   * @returns {boolean} Success
   */
  removeTrack(trackId) {
    const tracks = this._state.project.tracks.filter(track => track.id !== trackId);
    if (tracks.length === this._state.project.tracks.length) {
      return false; // Not found
    }
    this.setState({ project: { ...this._state.project, tracks } });
    return true;
  }

  /**
   * Add clip to track
   * @param {string} trackId - Track ID
   * @param {Object} clipData - Clip definition
   * @returns {string} New clip ID
   */
  addClip(trackId, clipData) {
    const clip = {
      id: clipData.id || `clip-${Date.now()}`,
      assetId: clipData.assetId || null,
      type: clipData.type || 'video',
      start: clipData.start || 0,
      end: clipData.end || (clipData.start || 0) + (clipData.duration || 5),
      sourceStart: clipData.sourceStart || 0,
      sourceEnd: clipData.sourceEnd || clipData.duration || 5,
      lane: clipData.lane || 0,
      trimIn: clipData.trimIn ?? 0,
      trimOut: clipData.trimOut ?? (clipData.duration || 5),
      volume: clipData.volume ?? 1,
      playbackRate: clipData.playbackRate ?? 1,
      effects: clipData.effects || [],
      opacity: clipData.opacity ?? 1,
      transform: clipData.transform || { x: 0, y: 0, scale: 1, rotation: 0 },
      name: clipData.name || 'Untitled Clip',
      ...(clipData.text && { text: clipData.text }),
      ...(clipData.style && { style: clipData.style })
    };

    const tracks = this._state.project.tracks.map(track => {
      if (track.id === trackId) {
        return { ...track, items: [...track.items, clip] };
      }
      return track;
    });

    this.setState({ project: { ...this._state.project, tracks } });
    return clip.id;
  }

  /**
   * Remove clip from track
   * @param {string} trackId - Track ID
   * @param {string} clipId - Clip ID
   * @returns {boolean} Success
   */
  removeClip(trackId, clipId) {
    const tracks = this._state.project.tracks.map(track => {
      if (track.id === trackId) {
        const items = track.items.filter(clip => clip.id !== clipId);
        return { ...track, items };
      }
      return track;
    });

    const changed = tracks.some(track => track.id === trackId && track.items.length !== this._getTrackById(trackId)?.items?.length);
    if (changed) {
      this.setState({ project: { ...this._state.project, tracks } });
      return true;
    }
    return false;
  }

  /**
   * Update clip properties
   * @param {string} trackId - Track ID
   * @param {string} clipId - Clip ID
   * @param {Object} updates - Property updates
   * @returns {boolean} Success
   */
  updateClip(trackId, clipId, updates) {
    const tracks = this._state.project.tracks.map(track => {
      if (track.id === trackId) {
        const items = track.items.map(clip =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        );
        return { ...track, items };
      }
      return track;
    });

    const changed = tracks.some(track => track.id === trackId);
    if (changed) {
      this._recalculateDuration(tracks);
      this.setState({ project: { ...this._state.project, tracks } });
      return true;
    }
    return false;
  }

  /**
   * Recalculate project duration from all clips
   */
  _recalculateDuration(tracks) {
    let maxEnd = 0;
    tracks.forEach(track => {
      track.items.forEach(clip => {
        maxEnd = Math.max(maxEnd, clip.end || 0);
      });
    });
    this._state.project.duration = maxEnd;
  }

  /**
   * Get track by ID
   */
  _getTrackById(trackId) {
    return this._state.project.tracks.find(track => track.id === trackId);
  }

  /**
   * Get clip by ID
   * @returns {Object|null} Clip or null
   */
  getClip(trackId, clipId) {
    const track = this._getTrackById(trackId);
    if (!track) return null;
    return track.items.find(clip => clip.id === clipId) || null;
  }

  /**
   * Import legacy project format (from timelineEditorState.js style)
   * @param {Object} legacyProject - Legacy project structure
   */
  importLegacyProject(legacyProject) {
    const legacy = legacyProject || {};

    // Convert tracks: if legacy.tracks exist, map each track to new format
    const convertedTracks = (legacy.tracks || []).map(track => {
      // Preserve track properties but ensure items
      const baseTrack = { ...track };
      // If track has 'clips' property, convert to 'items' using convertClipFormat
      if (track.clips && Array.isArray(track.clips)) {
        delete baseTrack.clips;
        return {
          ...baseTrack,
          items: track.clips.map(clip => this.convertClipFormat(clip))
        };
      }
      // If already has items, keep as is
      return baseTrack;
    });

    // Merge project metadata
    const projectUpdates = {
      ...this._state.project,
      ...(legacy.project || legacy), // top-level fields may represent project
      tracks: convertedTracks
    };

    // Update state
    this._state = {
      ...this._state,
      project: projectUpdates
    };

    // Copy root-level timeline fields if present
    const rootFields = ['timelineSeconds', 'playheadPercent', 'zoom', 'selectedTool', 'pan', 'playing', 'selectedClipId'];
    rootFields.forEach(field => {
      if (legacy[field] !== undefined) {
        this._state[field] = legacy[field];
      }
    });

    this._normalizeState();
    this._persist();
    this._notify({}, this.getState());
  }

  /**
   * Export state in legacy-compatible format (with root-level tracks and clips)
   * @returns {Object} Legacy-format project data
   */
  exportForLegacy() {
    const s = this._state;
    // Convert project.tracks to legacy tracks with clips
    const tracks = s.project.tracks.map(track => ({
      ...track,
      clips: track.items || [], // legacy used clips
      items: undefined
    }));
    return {
      project: { ...s.project, tracks: [] }, // project.tracks can be empty in legacy
      tracks,
      timelineSeconds: s.timelineSeconds,
      playheadPercent: s.playheadPercent,
      zoom: s.zoom,
      selectedTool: s.selectedTool,
      pan: s.pan,
      playing: s.playing,
      selectedClipId: s.selectedClipId
    };
  }

  /**
   * Convert legacy clip format (left/width) to new format (start/end/assetId/etc)
   * @param {Object} legacyClip - Legacy clip with left, width, etc.
   * @returns {Object} New-format clip
   */
  convertClipFormat(legacyClip) {
    const start = legacyClip.left ?? legacyClip.start ?? 0;
    const width = legacyClip.width ?? ((legacyClip.end || 10) - (legacyClip.start || start));
    return {
      id: legacyClip.id,
      assetId: legacyClip.id,
      name: legacyClip.name || 'Untitled',
      type: legacyClip.type || 'video',
      start: start,
      end: start + width,
      sourceStart: legacyClip.sourceStart ?? 0,
      sourceEnd: legacyClip.sourceEnd ?? width,
      lane: legacyClip.lane ?? 0,
      trimIn: legacyClip.trimIn ?? 0,
      trimOut: legacyClip.trimOut ?? width,
      volume: legacyClip.volume ?? 1,
      playbackRate: legacyClip.playbackRate ?? 1,
      effects: legacyClip.effects || [],
      opacity: legacyClip.opacity ?? 1,
      transform: legacyClip.transform || { x: 0, y: 0, scale: 1, rotation: 0 },
      ...(legacyClip.text && { text: legacyClip.text }),
      ...(legacyClip.style && { style: legacyClip.style })
    };
  }
}
