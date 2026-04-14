import { useState, useCallback } from 'react';

/**
 * Timeline Store Hook
 * Manages timeline-specific state including clip trimming and editing
 */
export const useTimelineStore = () => {
  const [contextMenu, setContextMenuState] = useState({
    isOpen: false,
    posX: 0,
    posY: 0,
    buttons: [],
    clipId: null
  });
  const [isActiveTimeline, setIsActiveTimelineState] = useState(false);
  const [timelineHeight, setTimelineHeightState] = useState(300);
  const [copiedItems, setCopiedItemsState] = useState([]);
  const [clips, setClips] = useState({});
  const [snapEnabled, setSnapEnabled] = useState(false);

  // Context menu management
  const setContextMenu = useCallback((menu) => {
    setContextMenuState(menu);
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuState({
      isOpen: false,
      posX: 0,
      posY: 0,
      buttons: [],
      clipId: null
    });
  }, []);

  // Timeline state management
  const setIsActiveTimeline = useCallback((active) => {
    setIsActiveTimelineState(active);
  }, []);

  const setTimelineHeight = useCallback((height) => {
    setTimelineHeightState(height);
  }, []);

  // Copied items management
  const setCopiedItems = useCallback((items) => {
    setCopiedItemsState(items);
  }, []);

  // Clip management
  const addClip = useCallback((clip) => {
    setClips(prev => ({
      ...prev,
      [clip.id]: {
        ...clip,
        // Ensure all required properties are present
        from: clip.from || 0,
        to: clip.to || clip.duration || 0,
        duration: clip.duration || (clip.to - clip.from) || 0,
        trimIn: clip.trimIn || 0,
        trimOut: clip.trimOut || clip.duration || clip.to || 0,
        // Clip editor properties
        volume: clip.volume !== undefined ? clip.volume : 1,
        mute: clip.mute || false,
        hidden: clip.hidden || false,
        fadeIn: clip.fadeIn || 0,
        fadeOut: clip.fadeOut || 0,
        fillMode: clip.fillMode || 'scale',
        is360: clip.is360 || false,
        title: clip.title || clip.name || 'Clip'
      }
    }));
  }, []);

  const removeClip = useCallback((clipId) => {
    setClips(prev => {
      const newClips = { ...prev };
      delete newClips[clipId];
      return newClips;
    });
  }, []);

  const getClip = useCallback((clipId) => {
    return clips[clipId] || null;
  }, [clips]);

  const getAllClips = useCallback(() => {
    return Object.values(clips);
  }, [clips]);

  const updateClipDuration = useCallback((clipId, updates) => {
    setClips(prev => {
      if (!prev[clipId]) return prev;

      const updatedClip = { ...prev[clipId] };

      if (updates.trimIn !== undefined) {
        updatedClip.trimIn = Math.max(0, Math.min(updates.trimIn, updatedClip.trimOut - 0.1));
      }

      if (updates.trimOut !== undefined) {
        updatedClip.trimOut = Math.max(updatedClip.trimIn + 0.1, Math.min(updates.trimOut, updatedClip.duration));
      }

      // Update duration if trim points changed
      if (updates.trimIn !== undefined || updates.trimOut !== undefined) {
        updatedClip.duration = updatedClip.trimOut - updatedClip.trimIn;
      }

      return {
        ...prev,
        [clipId]: updatedClip
      };
    });
  }, []);

  const setClipTrim = useCallback((clipId, trimIn, trimOut) => {
    updateClipDuration(clipId, { trimIn, trimOut });
  }, [updateClipDuration]);

  const updateClipPosition = useCallback((clipId, from, to) => {
    setClips(prev => {
      if (!prev[clipId]) return prev;

      const updatedClip = { ...prev[clipId] };
      const duration = to - from;

      updatedClip.from = from;
      updatedClip.to = to;
      updatedClip.duration = duration;

      // Adjust trim points if they exceed new bounds
      if (updatedClip.trimOut > duration) {
        updatedClip.trimOut = duration;
        if (updatedClip.trimIn >= updatedClip.trimOut) {
          updatedClip.trimIn = Math.max(0, updatedClip.trimOut - 0.1);
        }
      }

      return {
        ...prev,
        [clipId]: updatedClip
      };
    });
  }, []);

  const getTrimmedDuration = useCallback((clipId) => {
    const clip = clips[clipId];
    return clip ? clip.trimOut - clip.trimIn : 0;
  }, [clips]);

  // Update clip properties for editor
  const updateClipProperty = useCallback((clipId, property, value) => {
    setClips(prev => {
      if (!prev[clipId]) return prev;

      return {
        ...prev,
        [clipId]: {
          ...prev[clipId],
          [property]: value
        }
      };
    });
  }, []);

  // Context menu for clips
  const showClipContextMenu = useCallback((clipId, posX, posY) => {
    setContextMenuState({
      isOpen: true,
      posX,
      posY,
      clipId,
      buttons: ['trim', 'copy', 'delete', 'duplicate']
    });
  }, []);

  // Clip operations from context menu
  const trimClip = useCallback((clipId, trimIn, trimOut) => {
    setClipTrim(clipId, trimIn, trimOut);
    closeContextMenu();
  }, [setClipTrim, closeContextMenu]);

  const deleteClip = useCallback((clipId) => {
    removeClip(clipId);
    closeContextMenu();
  }, [removeClip, closeContextMenu]);

  const duplicateClip = useCallback((clipId) => {
    const originalClip = clips[clipId];
    if (!originalClip) return;

    const newClipId = Date.now(); // Simple ID generation
    const newClip = {
      ...originalClip,
      id: newClipId,
      from: originalClip.to + 0.1, // Place after original
      to: originalClip.to + originalClip.duration + 0.1
    };

    addClip(newClip);
    closeContextMenu();
  }, [clips, addClip, closeContextMenu]);

  const copyClip = useCallback((clipId) => {
    const clip = clips[clipId];
    if (clip) {
      setCopiedItemsState([clip]);
      closeContextMenu();
    }
  }, [clips, closeContextMenu]);

  // Paste functionality
  const pasteElement = useCallback(() => {
    if (copiedItems.length > 0) {
      const pastedClips = copiedItems.map(item => ({
        ...item,
        id: Date.now() + Math.random(), // Generate new IDs
        from: item.from + 0.1, // Slight offset to avoid overlap
        to: item.to + 0.1
      }));

      pastedClips.forEach(clip => addClip(clip));
    }
    closeContextMenu();
  }, [copiedItems, addClip, closeContextMenu]);

  // Snap functionality
  const toggleSnap = useCallback(() => {
    setSnapEnabled(prev => !prev);
  }, []);

  return {
    // Existing properties
    contextMenu,
    isActiveTimeline,
    timelineHeight,
    copiedItems,

    // New clip-related properties
    clips,
    snapEnabled,

    // Existing methods
    setIsActiveTimeline,
    setContextMenu,
    setTimelineHeight,
    setCopiedItems,
    pasteElement,

    // New clip methods
    addClip,
    removeClip,
    getClip,
    getAllClips,
    updateClipDuration,
    setClipTrim,
    updateClipPosition,
    getTrimmedDuration,
    updateClipProperty,

    // Context menu methods
    showClipContextMenu,
    closeContextMenu,

    // Clip operations
    trimClip,
    deleteClip,
    duplicateClip,
    copyClip,

    // Utility methods
    toggleSnap
  };
};

export default useTimelineStore;