/**
 * Timeline Editor State Management (Legacy Wrapper)
 * 
 * DEPRECATED: This file is kept for backward compatibility.
 * All timeline state should now use TimelineState class from './TimelineState.js'
 * 
 * This wrapper creates a timeline state object that is compatible with the old
 * createTimelineState() API but delegates to TimelineState internally.
 */

import { TimelineState } from './TimelineState.js';

/**
 * Create a timeline state object (legacy API)
 * @returns {Object} Legacy-compatible timeline state object
 * @deprecated Use 'new TimelineState()' instead
 */
export const createTimelineState = () => {
  // Create new TimelineState instance
  const timelineState = new TimelineState({ autopersist: false });
  
  // Get the raw state and add legacy methods
  const state = timelineState.getRawState();
  
  // Add legacy updateClipDuration method
  state.updateClipDuration = function(clipId, updates) {
    // Find the track and clip
    for (const track of state.project.tracks) {
      const clipIndex = track.items ? track.items.findIndex(item => item.id === clipId) : -1;
      if (clipIndex !== -1) {
        const clip = track.items[clipIndex];
        
        // Update trim values
        if (updates.trimIn !== undefined) {
          clip.trimIn = Math.max(0, Math.min(updates.trimIn, clip.trimOut - 0.1));
        }
        if (updates.trimOut !== undefined) {
          clip.trimOut = Math.max(clip.trimIn + 0.1, Math.min(updates.trimOut, clip.sourceEnd));
        }
        
        // Update start/end times based on trim changes
        const trimmedDuration = clip.trimOut - clip.trimIn;
        if (updates.trimIn !== undefined || updates.trimOut !== undefined) {
          clip.end = clip.start + trimmedDuration;
        }
        
        return true;
      }
    }
    return false;
  };

  // Add multi-camera methods
  state.addCameraAngle = function(name, color = '#3b82f6') {
    const angle = {
      id: `angle-${Date.now()}`,
      name: name,
      color: color,
      tracks: []
    };
    state.cameraAngles.push(angle);
    return angle.id;
  };

  state.removeCameraAngle = function(angleId) {
    state.cameraAngles = state.cameraAngles.filter(angle => angle.id !== angleId);
    if (state.activeCameraAngle === angleId) {
      state.activeCameraAngle = state.cameraAngles[0]?.id || null;
    }
  };

  state.switchToCameraAngle = function(angleId) {
    state.activeCameraAngle = angleId;
  };

  state.addPipWindow = function(clipId, config = {}) {
    const pipWindow = {
      id: `pip-${Date.now()}`,
      clipId: clipId,
      position: config.position || 'top-right',
      size: config.size || { width: 0.3, height: 0.3 },
      x: config.x || 0.7,
      y: config.y || 0.1,
      opacity: config.opacity || 1.0,
      borderRadius: config.borderRadius || 8,
      shadow: config.shadow || true,
      blendMode: config.blendMode || 'normal'
    };
    state.pipWindows.push(pipWindow);
    return pipWindow.id;
  };

  state.removePipWindow = function(pipId) {
    state.pipWindows = state.pipWindows.filter(pip => pip.id !== pipId);
  };

  state.updatePipWindow = function(pipId, updates) {
    const pip = state.pipWindows.find(p => p.id === pipId);
    if (pip) {
      Object.assign(pip, updates);
    }
  };

  state.setSplitScreen = function(type, ratio = 0.5) {
    state.splitScreenMode = true;
    state.pipMode = false;
    state.splitScreenConfig = {
      type: type,
      ratio: ratio,
      transition: 'none'
    };
  };

  state.disableSplitScreen = function() {
    state.splitScreenMode = false;
  };

  state.togglePipMode = function() {
    state.pipMode = !state.pipMode;
    if (state.pipMode) {
      state.splitScreenMode = false;
    }
  };

  return state;
};