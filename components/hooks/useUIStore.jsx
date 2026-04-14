import { useState } from 'react';

/**
 * UI Store Hook
 * Manages UI-related state
 */
export const useUIStore = () => {
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);

  const toggleTimeLine = (open) => {
    setIsTimelineOpen(open !== undefined ? open : !isTimelineOpen);
  };

  return {
    isTimelineOpen,
    toggleTimeLine,
    setIsTimelineOpen
  };
};

export default useUIStore;