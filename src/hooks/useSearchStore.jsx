import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} SearchResult
 * @property {string} id - Unique result identifier
 * @property {string} type - Result type ('clip', 'asset', 'template', 'scene')
 * @property {string} title - Result title
 * @property {string} description - Result description
 * @property {string} thumbnail - Thumbnail URL
 * @property {Object} metadata - Additional metadata
 * @property {number} relevance - Search relevance score (0-1)
 */

/**
 * @typedef {Object} SearchFilter
 * @property {string} type - Filter type ('type', 'category', 'date', 'duration')
 * @property {string} value - Filter value
 * @property {string} operator - Filter operator ('equals', 'contains', 'range')
 */

/**
 * @typedef {Object} SearchState
 * @property {string} query - Current search query
 * @property {SearchResult[]} results - Search results
 * @property {SearchFilter[]} filters - Active filters
 * @property {string} sortBy - Sort field ('relevance', 'date', 'name')
 * @property {string} sortOrder - Sort order ('asc', 'desc')
 * @property {boolean} isSearching - Whether search is in progress
 * @property {string|null} error - Search error message
 * @property {string[]} recentSearches - Recent search queries
 * @property {Object} searchOptions - Search configuration
 */

/**
 * Search functionality state hook
 * @returns {Object} Search store with state and actions
 */
export const useSearchStore = () => {
  const [state, setState] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('search-state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved search state:', e);
      }
    }

    // Default state
    return {
      query: '',
      results: [],
      filters: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
      isSearching: false,
      error: null,
      recentSearches: [],
      searchOptions: {
        fuzzySearch: true,
        caseSensitive: false,
        wholeWords: false,
        maxResults: 50
      }
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('search-state', JSON.stringify(state));
  }, [state]);

  // Actions
  const setQuery = useCallback((query) => {
    setState(prev => ({ ...prev, query: query.trim() }));
  }, []);

  const performSearch = useCallback(async (searchData = []) => {
    if (!state.query && state.filters.length === 0) {
      setState(prev => ({ ...prev, results: [], isSearching: false }));
      return;
    }

    setState(prev => ({ ...prev, isSearching: true, error: null }));

    try {
      // Simulate search - replace with actual search logic
      await new Promise(resolve => setTimeout(resolve, 300));

      // Mock search results based on query
      const mockResults = searchData
        .filter(item => {
          // Apply filters
          for (const filter of state.filters) {
            if (!matchesFilter(item, filter)) {
              return false;
            }
          }

          // Apply text search
          if (state.query) {
            const query = state.searchOptions.caseSensitive ? state.query : state.query.toLowerCase();
            const searchableText = state.searchOptions.caseSensitive
              ? `${item.title} ${item.description}`
              : `${item.title} ${item.description}`.toLowerCase();

            if (state.searchOptions.wholeWords) {
              const words = query.split(/\s+/);
              return words.every(word => searchableText.includes(word));
            } else {
              return searchableText.includes(query);
            }
          }

          return true;
        })
        .map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description || '',
          thumbnail: item.thumbnail || null,
          metadata: item.metadata || {},
          relevance: calculateRelevance(item, state.query)
        }))
        .sort((a, b) => {
          // Sort by relevance or other criteria
          if (state.sortBy === 'relevance') {
            return state.sortOrder === 'desc' ? b.relevance - a.relevance : a.relevance - b.relevance;
          }

          const aVal = a[state.sortBy]?.toLowerCase?.() || a[state.sortBy];
          const bVal = b[state.sortBy]?.toLowerCase?.() || b[state.sortBy];

          if (state.sortOrder === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
          }
        })
        .slice(0, state.searchOptions.maxResults);

      setState(prev => ({
        ...prev,
        results: mockResults,
        isSearching: false,
        recentSearches: [
          state.query,
          ...prev.recentSearches.filter(q => q !== state.query).slice(0, 9) // Keep last 10
        ].filter(q => q) // Remove empty queries
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: error.message || 'Search failed'
      }));
    }
  }, [state.query, state.filters, state.sortBy, state.sortOrder, state.searchOptions]);

  const addFilter = useCallback((filter) => {
    setState(prev => ({
      ...prev,
      filters: [...prev.filters, { ...filter, id: `filter-${Date.now()}` }]
    }));
  }, []);

  const removeFilter = useCallback((filterId) => {
    setState(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.id !== filterId)
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: [] }));
  }, []);

  const setSortBy = useCallback((sortBy) => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  const setSortOrder = useCallback((sortOrder) => {
    setState(prev => ({ ...prev, sortOrder }));
  }, []);

  const updateSearchOptions = useCallback((options) => {
    setState(prev => ({
      ...prev,
      searchOptions: { ...prev.searchOptions, ...options }
    }));
  }, []);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      error: null
    }));
  }, []);

  const useRecentSearch = useCallback((query) => {
    setQuery(query);
    // Trigger search if needed
  }, [setQuery]);

  const clearRecentSearches = useCallback(() => {
    setState(prev => ({ ...prev, recentSearches: [] }));
  }, []);

  // Helper functions
  const matchesFilter = (item, filter) => {
    const { type, value, operator } = filter;
    const itemValue = item[type];

    switch (operator) {
      case 'equals':
        return itemValue === value;
      case 'contains':
        return String(itemValue).toLowerCase().includes(value.toLowerCase());
      case 'range':
        // Assume value is [min, max]
        return itemValue >= value[0] && itemValue <= value[1];
      default:
        return true;
    }
  };

  const calculateRelevance = (item, query) => {
    if (!query) return 1;

    const queryLower = query.toLowerCase();
    const titleLower = item.title.toLowerCase();
    const descLower = item.description?.toLowerCase() || '';

    // Exact title match gets highest score
    if (titleLower === queryLower) return 1;

    // Title starts with query
    if (titleLower.startsWith(queryLower)) return 0.9;

    // Title contains query
    if (titleLower.includes(queryLower)) return 0.8;

    // Description contains query
    if (descLower.includes(queryLower)) return 0.6;

    // Fuzzy match
    return 0.3;
  };

  return {
    // State
    ...state,

    // Actions
    setQuery,
    performSearch,
    addFilter,
    removeFilter,
    clearFilters,
    setSortBy,
    setSortOrder,
    updateSearchOptions,
    clearSearch,
    useRecentSearch,
    clearRecentSearches,

    // Computed
    hasActiveSearch: state.query.length > 0 || state.filters.length > 0,
    resultCount: state.results.length,

    // Utilities
    getResultById: (id) => state.results.find(r => r.id === id),
    getResultsByType: (type) => state.results.filter(r => r.type === type)
  };
};