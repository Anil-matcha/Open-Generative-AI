import { useState } from 'react';

/**
 * Timeline Store Hook
 * Manages timeline-specific state
 */
export const useTimelineStore = () => {
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    posX: 0,
    posY: 0,
    buttons: []
  });
  const [isActiveTimeline, setIsActiveTimelineState] = useState(false);
  const [timelineHeight, setTimelineHeight] = useState(300);
  const [copiedItems, setCopiedItems] = useState([]);

  const setIsActiveTimeline = (active) => {
    setIsActiveTimelineState(active);
  };

  const setContextMenu = (menu) => {
    setContextMenu(menu);
  };

  const setCopiedItems = (items) => {
    setCopiedItems(items);
  };

  const pasteElement = () => {
    // Implementation for pasting elements
    console.log('Pasting elements:', copiedItems);
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  return {
    contextMenu,
    isActiveTimeline,
    timelineHeight,
    copiedItems,
    setIsActiveTimeline,
    setContextMenu,
    setTimelineHeight,
    setCopiedItems,
    pasteElement
  };
};

export default useTimelineStore;