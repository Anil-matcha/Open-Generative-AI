import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} SelectableItem
 * @property {string} id - Unique item identifier
 * @property {string} type - Item type ('clip', 'track', 'asset', etc.)
 * @property {Object} data - Item data
 */

/**
 * @typedef {Object} MultiSelectState
 * @property {Set} selectedIds - Set of selected item IDs
 * @property {string} selectionMode - Selection mode ('single', 'multi', 'range')
 * @property {string|null} lastSelectedId - Last selected item ID (for range selection)
 * @property {string|null} focusedId - Currently focused item ID
 * @property {boolean} isSelecting - Whether selection is in progress
 */

/**
 * Multi-selection management hook
 * @param {string} storeId - Unique identifier for this selection store
 * @returns {Object} Multi-select store with state and actions
 */
export const useMultiSelectStore = (storeId = 'default') => {
  const storageKey = `multiselect-${storeId}`;

  const [state, setState] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert Set back from array
        parsed.selectedIds = new Set(parsed.selectedIds);
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved multiselect state:', e);
      }
    }

    // Default state
    return {
      selectedIds: new Set(),
      selectionMode: 'multi',
      lastSelectedId: null,
      focusedId: null,
      isSelecting: false
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({
      ...state,
      selectedIds: Array.from(state.selectedIds) // Convert Set to array for JSON
    }));
  }, [state, storageKey]);

  // Actions
  const selectItem = useCallback((itemId, options = {}) => {
    const { multiSelect = false, rangeSelect = false } = options;

    setState(prev => {
      const newSelectedIds = new Set(prev.selectedIds);

      if (rangeSelect && prev.lastSelectedId) {
        // Range selection - select all items between lastSelectedId and itemId
        // This would need item ordering context, simplified here
        newSelectedIds.add(itemId);
      } else if (multiSelect) {
        // Multi-select: toggle selection
        if (newSelectedIds.has(itemId)) {
          newSelectedIds.delete(itemId);
        } else {
          newSelectedIds.add(itemId);
        }
      } else {
        // Single select: clear all and select this one
        newSelectedIds.clear();
        newSelectedIds.add(itemId);
      }

      return {
        ...prev,
        selectedIds: newSelectedIds,
        lastSelectedId: itemId,
        focusedId: itemId
      };
    });
  }, []);

  const selectAll = useCallback((itemIds) => {
    setState(prev => ({
      ...prev,
      selectedIds: new Set(itemIds),
      lastSelectedId: itemIds.length > 0 ? itemIds[itemIds.length - 1] : null
    }));
  }, []);

  const selectRange = useCallback((startId, endId, allItemIds) => {
    // Find indices in the full list
    const startIndex = allItemIds.indexOf(startId);
    const endIndex = allItemIds.indexOf(endId);

    if (startIndex === -1 || endIndex === -1) return;

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    const rangeIds = allItemIds.slice(minIndex, maxIndex + 1);

    setState(prev => ({
      ...prev,
      selectedIds: new Set(rangeIds),
      lastSelectedId: endId
    }));
  }, []);

  const deselectItem = useCallback((itemId) => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedIds);
      newSelectedIds.delete(itemId);
      return {
        ...prev,
        selectedIds: newSelectedIds,
        lastSelectedId: prev.lastSelectedId === itemId ? null : prev.lastSelectedId
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIds: new Set(),
      lastSelectedId: null
    }));
  }, []);

  const toggleSelection = useCallback((itemId) => {
    selectItem(itemId, { multiSelect: true });
  }, [selectItem]);

  const setFocusedItem = useCallback((itemId) => {
    setState(prev => ({ ...prev, focusedId: itemId }));
  }, []);

  const setSelectionMode = useCallback((mode) => {
    setState(prev => ({ ...prev, selectionMode: mode }));
  }, []);

  const invertSelection = useCallback((allItemIds) => {
    setState(prev => {
      const newSelectedIds = new Set();
      allItemIds.forEach(id => {
        if (!prev.selectedIds.has(id)) {
          newSelectedIds.add(id);
        }
      });
      return {
        ...prev,
        selectedIds: newSelectedIds
      };
    });
  }, []);

  const moveSelection = useCallback((direction, allItemIds) => {
    if (state.selectedIds.size === 0) return;

    // Get the first selected item for reference
    const firstSelected = Array.from(state.selectedIds)[0];
    const currentIndex = allItemIds.indexOf(firstSelected);

    if (currentIndex === -1) return;

    let newIndex;
    switch (direction) {
      case 'up':
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'down':
        newIndex = Math.min(allItemIds.length - 1, currentIndex + 1);
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = allItemIds.length - 1;
        break;
      default:
        return;
    }

    const newItemId = allItemIds[newIndex];
    selectItem(newItemId);
  }, [state.selectedIds, selectItem]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if we have a focused element
      if (!state.focusedId) return;

      if (e.key === 'Escape') {
        clearSelection();
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // This would need access to all item IDs - emit event or use callback
        // For now, just prevent default
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.focusedId, clearSelection]);

  // Computed values
  const selectedCount = state.selectedIds.size;
  const hasSelection = selectedCount > 0;
  const selectedIdsArray = Array.from(state.selectedIds);
  const isItemSelected = (itemId) => state.selectedIds.has(itemId);

  return {
    // State
    ...state,
    selectedCount,
    hasSelection,
    selectedIdsArray,

    // Actions
    selectItem,
    selectAll,
    selectRange,
    deselectItem,
    clearSelection,
    toggleSelection,
    setFocusedItem,
    setSelectionMode,
    invertSelection,
    moveSelection,

    // Utilities
    isItemSelected
  };
};