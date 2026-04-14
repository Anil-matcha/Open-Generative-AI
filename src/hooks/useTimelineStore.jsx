import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} Clip
 * @property {string} id - Unique clip identifier
 * @property {string} type - Clip type ('video', 'image', 'audio', 'text')
 * @property {number} startTime - Start time in seconds
 * @property {number} endTime - End time in seconds
 * @property {number} duration - Clip duration in seconds
 * @property {string} trackId - Parent track ID
 * @property {Object} properties - Clip-specific properties
 */

/**
 * @typedef {Object} Track
 * @property {string} id - Unique track identifier
 * @property {string} type - Track type ('video', 'audio')
 * @property {number} index - Track index/order
 * @property {boolean} muted - Whether track is muted
 * @property {boolean} solo - Whether track is soloed
 * @property {number} volume - Track volume (0-1)
 */

/**
 * @typedef {Object} TimelineState
 * @property {Clip[]} clips - Array of clips
 * @property {Track[]} tracks - Array of tracks
 * @property {number} currentTime - Current playhead position in seconds
 * @property {number} zoom - Timeline zoom level
 * @property {number} duration - Total timeline duration in seconds
 * @property {boolean} playing - Whether timeline is playing
 * @property {string|null} selectedClipId - Currently selected clip ID
 */

/**
 * Core timeline state management hook
 * @returns {Object} Timeline store with state and actions
 */
export const useTimelineStore = () => {
  const [state, setState] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('timeline-state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved timeline state:', e);
      }
    }

    // Default state
    return {
      clips: [],
      tracks: [
        { id: 'video-1', type: 'video', index: 0, muted: false, solo: false, volume: 1 },
        { id: 'audio-1', type: 'audio', index: 1, muted: false, solo: false, volume: 1 }
      ],
      currentTime: 0,
      zoom: 1,
      duration: 60,
      playing: false,
      selectedClipId: null
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('timeline-state', JSON.stringify(state));
  }, [state]);

  // Actions
  const addClip = useCallback((clip) => {
    setState(prev => ({
      ...prev,
      clips: [...prev.clips, { ...clip, id: clip.id || `clip-${Date.now()}` }]
    }));
  }, []);

  const removeClip = useCallback((clipId) => {
    setState(prev => ({
      ...prev,
      clips: prev.clips.filter(c => c.id !== clipId),
      selectedClipId: prev.selectedClipId === clipId ? null : prev.selectedClipId
    }));
  }, []);

  const updateClip = useCallback((clipId, updates) => {
    setState(prev => ({
      ...prev,
      clips: prev.clips.map(c => c.id === clipId ? { ...c, ...updates } : c)
    }));
  }, []);

  const addTrack = useCallback((track) => {
    setState(prev => ({
      ...prev,
      tracks: [...prev.tracks, { ...track, id: track.id || `track-${Date.now()}` }]
    }));
  }, []);

  const removeTrack = useCallback((trackId) => {
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId),
      clips: prev.clips.filter(c => c.trackId !== trackId)
    }));
  }, []);

  const setCurrentTime = useCallback((time) => {
    setState(prev => ({ ...prev, currentTime: Math.max(0, Math.min(time, prev.duration)) }));
  }, []);

  const setZoom = useCallback((zoom) => {
    setState(prev => ({ ...prev, zoom: Math.max(0.1, Math.min(zoom, 10)) }));
  }, []);

  const setPlaying = useCallback((playing) => {
    setState(prev => ({ ...prev, playing }));
  }, []);

  const setSelectedClip = useCallback((clipId) => {
    setState(prev => ({ ...prev, selectedClipId: clipId }));
  }, []);

  const setDuration = useCallback((duration) => {
    setState(prev => ({ ...prev, duration: Math.max(1, duration) }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    addClip,
    removeClip,
    updateClip,
    addTrack,
    removeTrack,
    setCurrentTime,
    setZoom,
    setPlaying,
    setSelectedClip,
    setDuration,

    // Utilities
    getClipsByTrack: (trackId) => state.clips.filter(c => c.trackId === trackId),
    getSelectedClip: () => state.clips.find(c => c.id === state.selectedClipId)
  };
};