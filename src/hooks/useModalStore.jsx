import { useState, useCallback } from 'react';

/**
 * @typedef {Object} ModalConfig
 * @property {string} id - Unique modal identifier
 * @property {string} type - Modal type/component name
 * @property {Object} props - Props to pass to modal component
 * @property {Object} options - Modal display options
 * @property {boolean} options.persistent - Whether modal can be closed by backdrop click
 * @property {boolean} options.fullscreen - Whether modal should be fullscreen
 * @property {string} options.size - Modal size ('sm', 'md', 'lg', 'xl')
 */

/**
 * @typedef {Object} ModalState
 * @property {ModalConfig[]} stack - Stack of open modals
 * @property {boolean} isTransitioning - Whether a modal transition is in progress
 */

/**
 * Modal state management hook
 * @returns {Object} Modal store with state and actions
 */
export const useModalStore = () => {
  const [state, setState] = useState({
    stack: [],
    isTransitioning: false
  });

  // Actions
  const openModal = useCallback((type, props = {}, options = {}) => {
    const modal = {
      id: `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      props,
      options: {
        persistent: false,
        fullscreen: false,
        size: 'md',
        ...options
      }
    };

    setState(prev => ({
      ...prev,
      stack: [...prev.stack, modal],
      isTransitioning: true
    }));

    // Reset transitioning after animation
    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);

    return modal.id;
  }, []);

  const closeModal = useCallback((modalId = null) => {
    setState(prev => {
      if (prev.stack.length === 0) return prev;

      const targetId = modalId || prev.stack[prev.stack.length - 1].id;

      return {
        ...prev,
        stack: prev.stack.filter(m => m.id !== targetId),
        isTransitioning: true
      };
    });

    // Reset transitioning after animation
    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, []);

  const closeAllModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      stack: [],
      isTransitioning: true
    }));

    // Reset transitioning after animation
    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, []);

  const updateModalProps = useCallback((modalId, props) => {
    setState(prev => ({
      ...prev,
      stack: prev.stack.map(m =>
        m.id === modalId ? { ...m, props: { ...m.props, ...props } } : m
      )
    }));
  }, []);

  const bringToFront = useCallback((modalId) => {
    setState(prev => {
      const modal = prev.stack.find(m => m.id === modalId);
      if (!modal) return prev;

      return {
        ...prev,
        stack: [...prev.stack.filter(m => m.id !== modalId), modal]
      };
    });
  }, []);

  // Computed values
  const isAnyModalOpen = state.stack.length > 0;
  const topModal = state.stack.length > 0 ? state.stack[state.stack.length - 1] : null;
  const modalCount = state.stack.length;

  return {
    // State
    ...state,
    isAnyModalOpen,
    topModal,
    modalCount,

    // Actions
    openModal,
    closeModal,
    closeAllModals,
    updateModalProps,
    bringToFront,

    // Utilities
    isModalOpen: (type) => state.stack.some(m => m.type === type),
    getModalById: (id) => state.stack.find(m => m.id === id),
    getModalsByType: (type) => state.stack.filter(m => m.type === type)
  };
};