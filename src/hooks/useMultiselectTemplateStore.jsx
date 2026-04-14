import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} Template
 * @property {string} id - Unique template identifier
 * @property {string} name - Template name
 * @property {string} category - Template category
 * @property {string} thumbnail - Thumbnail URL
 * @property {Object} config - Template configuration
 * @property {boolean} isPremium - Whether template requires premium
 * @property {Date} createdAt - Template creation date
 */

/**
 * @typedef {Object} TemplateSelectionState
 * @property {Set} selectedTemplateIds - Set of selected template IDs
 * @property {string|null} activeTemplateId - Currently active template ID
 * @property {string} currentCategory - Current category filter
 * @property {string} searchQuery - Search query
 * @property {string} sortBy - Sort field ('name', 'date', 'category')
 * @property {string} sortOrder - Sort order ('asc', 'desc')
 * @property {boolean} showPremiumOnly - Whether to show only premium templates
 */

/**
 * Template selection state hook
 * @returns {Object} Template selection store with state and actions
 */
export const useMultiselectTemplateStore = () => {
  const [state, setState] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('template-selection-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert Set back from array
        parsed.selectedTemplateIds = new Set(parsed.selectedTemplateIds);
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved template selection state:', e);
      }
    }

    // Default state
    return {
      selectedTemplateIds: new Set(),
      activeTemplateId: null,
      currentCategory: 'all',
      searchQuery: '',
      sortBy: 'name',
      sortOrder: 'asc',
      showPremiumOnly: false
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('template-selection-state', JSON.stringify({
      ...state,
      selectedTemplateIds: Array.from(state.selectedTemplateIds) // Convert Set to array for JSON
    }));
  }, [state]);

  // Mock templates data (in real app, this would come from API)
  const [templates] = useState([
    {
      id: 'template-1',
      name: 'Business Presentation',
      category: 'business',
      thumbnail: '/templates/business-presentation.jpg',
      config: { duration: 60, slides: 5 },
      isPremium: false,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'template-2',
      name: 'Product Demo',
      category: 'marketing',
      thumbnail: '/templates/product-demo.jpg',
      config: { duration: 120, interactive: true },
      isPremium: true,
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'template-3',
      name: 'Social Media Story',
      category: 'social',
      thumbnail: '/templates/social-story.jpg',
      config: { duration: 15, vertical: true },
      isPremium: false,
      createdAt: new Date('2024-02-01')
    }
  ]);

  // Actions
  const selectTemplate = useCallback((templateId, multiSelect = false) => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedTemplateIds);

      if (multiSelect) {
        if (newSelectedIds.has(templateId)) {
          newSelectedIds.delete(templateId);
        } else {
          newSelectedIds.add(templateId);
        }
      } else {
        newSelectedIds.clear();
        newSelectedIds.add(templateId);
      }

      return {
        ...prev,
        selectedTemplateIds: newSelectedIds,
        activeTemplateId: templateId
      };
    });
  }, []);

  const deselectTemplate = useCallback((templateId) => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedTemplateIds);
      newSelectedIds.delete(templateId);
      return {
        ...prev,
        selectedTemplateIds: newSelectedIds,
        activeTemplateId: prev.activeTemplateId === templateId ? null : prev.activeTemplateId
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedTemplateIds: new Set(),
      activeTemplateId: null
    }));
  }, []);

  const setActiveTemplate = useCallback((templateId) => {
    setState(prev => ({ ...prev, activeTemplateId: templateId }));
  }, []);

  const setCategory = useCallback((category) => {
    setState(prev => ({ ...prev, currentCategory: category }));
  }, []);

  const setSearchQuery = useCallback((query) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setSortBy = useCallback((sortBy) => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  const setSortOrder = useCallback((sortOrder) => {
    setState(prev => ({ ...prev, sortOrder }));
  }, []);

  const togglePremiumOnly = useCallback(() => {
    setState(prev => ({ ...prev, showPremiumOnly: !prev.showPremiumOnly }));
  }, []);

  // Computed values
  const filteredTemplates = templates.filter(template => {
    // Category filter
    if (state.currentCategory !== 'all' && template.category !== state.currentCategory) {
      return false;
    }

    // Premium filter
    if (state.showPremiumOnly && !template.isPremium) {
      return false;
    }

    // Search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      return template.name.toLowerCase().includes(query) ||
             template.category.toLowerCase().includes(query);
    }

    return true;
  }).sort((a, b) => {
    let aVal, bVal;

    switch (state.sortBy) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'date':
        aVal = a.createdAt.getTime();
        bVal = b.createdAt.getTime();
        break;
      case 'category':
        aVal = a.category.toLowerCase();
        bVal = b.category.toLowerCase();
        break;
      default:
        return 0;
    }

    if (state.sortOrder === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  const selectedTemplates = templates.filter(template =>
    state.selectedTemplateIds.has(template.id)
  );

  const activeTemplate = templates.find(template => template.id === state.activeTemplateId);

  const categories = [...new Set(templates.map(t => t.category))];

  return {
    // State
    ...state,
    templates,
    filteredTemplates,
    selectedTemplates,
    activeTemplate,
    categories,

    // Actions
    selectTemplate,
    deselectTemplate,
    clearSelection,
    setActiveTemplate,
    setCategory,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    togglePremiumOnly,

    // Utilities
    isTemplateSelected: (templateId) => state.selectedTemplateIds.has(templateId),
    getTemplateById: (id) => templates.find(t => t.id === id),
    getTemplatesByCategory: (category) => templates.filter(t => t.category === category)
  };
};