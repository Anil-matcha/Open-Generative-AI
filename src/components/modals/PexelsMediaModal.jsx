import { BaseModal } from './BaseModal';
import { pexelsService } from '../lib/services/PexelsService.js';

export class PexelsMediaModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Browse Pexels',
      size: 'large',
      showFooter: false,
      ...options
    });

    this.onSelect = options.onSelect || (() => {});
    this.initialQuery = options.initialQuery || '';
    this.mediaType = options.mediaType || 'photos';

    // State
    this.currentQuery = this.initialQuery;
    this.searchResults = [];
    this.selectedItem = null;
    this.isLoading = false;
    this.page = 1;
    this.currentFilters = {
      orientation: '',
      size: '',
      color: ''
    };
    this.error = null;
    
    // Debounce tracking
    this.searchDebounce = null;
    this.searchTimeout = null;

    // Bound event handlers for cleanup
    this.boundHandlers = {
      onSearchInput: this.onSearchInput.bind(this),
      onSearchKeypress: this.onSearchKeypress.bind(this),
      onTypeChange: this.onTypeChange.bind(this),
      onFilterChange: this.onFilterChange.bind(this),
      onResultClick: this.onResultClick.bind(this),
      onAddToTimeline: this.onAddToTimeline.bind(this),
      onRetry: this.onRetry.bind(this)
    };
  }

  renderBody() {
    const { currentQuery, mediaType, currentFilters, searchResults, selectedItem, isLoading, error } = this;

    // Determine which state to show
    if (isLoading && searchResults.length === 0) {
      return this.renderLoadingState();
    }

    if (error) {
      return this.renderErrorState();
    }

    if (searchResults.length === 0 && !isLoading) {
      return this.renderEmptyState();
    }

    return `
      <div class="pexels-modal">
        <div class="pexels-search-bar">
          <input 
            type="text" 
            class="pexels-search-input" 
            placeholder="Search ${mediaType === 'photos' ? 'photos' : 'videos'}..."
            value="${this.escapeHtml(currentQuery)}"
            aria-label="Search Pexels"
          />
          <div class="pexels-type-toggles">
            <button 
              class="type-btn ${mediaType === 'photos' ? 'active' : ''}" 
              data-type="photos"
              aria-pressed="${mediaType === 'photos'}"
            >
              Photos
            </button>
            <button 
              class="type-btn ${mediaType === 'videos' ? 'active' : ''}" 
              data-type="videos"
              aria-pressed="${mediaType === 'videos'}"
            >
              Videos
            </button>
          </div>
        </div>

        <div class="pexels-filters">
          <select class="pexels-filter-select" data-filter="orientation" aria-label="Orientation">
            <option value="">Any Orientation</option>
            <option value="landscape" ${currentFilters.orientation === 'landscape' ? 'selected' : ''}>Landscape</option>
            <option value="portrait" ${currentFilters.orientation === 'portrait' ? 'selected' : ''}>Portrait</option>
            <option value="square" ${currentFilters.orientation === 'square' ? 'selected' : ''}>Square</option>
          </select>

          <select class="pexels-filter-select" data-filter="size" aria-label="Size">
            <option value="">Any Size</option>
            <option value="large" ${currentFilters.size === 'large' ? 'selected' : ''}>Large</option>
            <option value="medium" ${currentFilters.size === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="small" ${currentFilters.size === 'small' ? 'selected' : ''}>Small</option>
          </select>

          <select class="pexels-filter-select" data-filter="color" aria-label="Color">
            <option value="">Any Color</option>
            <option value="red" ${currentFilters.color === 'red' ? 'selected' : ''}>Red</option>
            <option value="orange" ${currentFilters.color === 'orange' ? 'selected' : ''}>Orange</option>
            <option value="yellow" ${currentFilters.color === 'yellow' ? 'selected' : ''}>Yellow</option>
            <option value="green" ${currentFilters.color === 'green' ? 'selected' : ''}>Green</option>
            <option value="cyan" ${currentFilters.color === 'cyan' ? 'selected' : ''}>Cyan</option>
            <option value="blue" ${currentFilters.color === 'blue' ? 'selected' : ''}>Blue</option>
            <option value="purple" ${currentFilters.color === 'purple' ? 'selected' : ''}>Purple</option>
            <option value="pink" ${currentFilters.color === 'pink' ? 'selected' : ''}>Pink</option>
            <option value="white" ${currentFilters.color === 'white' ? 'selected' : ''}>White</option>
            <option value="black" ${currentFilters.color === 'black' ? 'selected' : ''}>Black</option>
          </select>
        </div>

        <div class="pexels-results-grid">
          ${searchResults.map(item => this.renderResultItem(item, selectedItem === item)).join('')}
        </div>

        ${selectedItem ? this.renderPreviewPanel(selectedItem) : ''}
      </div>
    `;
  }

  renderLoadingState() {
    return `
      <div class="pexels-loading-state">
        <div class="pexels-spinner"></div>
        <p>Searching Pexels...</p>
      </div>
    `;
  }

  renderErrorState() {
    return `
      <div class="pexels-error-state">
        <div class="pexels-error-icon">⚠️</div>
        <p class="pexels-error-message">${this.escapeHtml(this.error)}</p>
        <button class="pexels-retry-btn modal-btn modal-btn-secondary">Retry</button>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="pexels-empty-state">
        <div class="pexels-empty-icon">🔍</div>
        <p>No results found</p>
        <p class="pexels-empty-hint">Try a different search term</p>
      </div>
    `;
  }

  renderResultItem(item, isSelected) {
    const isVideo = item.type === 'video';
    const durationBadge = isVideo ? `<span class="video-badge">${this.formatDuration(item.duration)}</span>` : '';
    
    return `
      <div 
        class="pexels-result-item ${isSelected ? 'selected' : ''}" 
        data-id="${item.id}"
        role="button"
        tabindex="0"
        aria-selected="${isSelected}"
      >
        <img src="${this.escapeHtml(item.thumbnail || item.url)}" alt="${this.escapeHtml(item.alt || '')}" loading="lazy" />
        ${durationBadge}
        <div class="pexels-result-info">
          <span class="pexels-result-photographer">${this.escapeHtml(item.photographer || '')}</span>
        </div>
      </div>
    `;
  }

  renderPreviewPanel(item) {
    const isVideo = item.type === 'video';
    const mediaElement = isVideo 
      ? `<video src="${this.escapeHtml(item.url)}" muted controls playsinline class="pexels-preview-video"></video>`
      : `<img src="${this.escapeHtml(item.url)}" alt="${this.escapeHtml(item.alt || '')}" class="pexels-preview-image" />`;
    
    return `
      <div class="pexels-preview-panel">
        <div class="pexels-preview-media">
          ${mediaElement}
        </div>
        <div class="pexels-preview-meta">
          <p><strong>Photographer:</strong> ${this.escapeHtml(item.photographer || 'Unknown')}</p>
          ${item.width && item.height ? `<p><strong>Dimensions:</strong> ${item.width} × ${item.height}</p>` : ''}
          ${isVideo && item.duration ? `<p><strong>Duration:</strong> ${this.formatDuration(item.duration)}</p>` : ''}
          <button class="pexels-add-btn modal-btn modal-btn-primary">Add to Timeline</button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    if (!this.overlay) return;

    // Search input with debounce
    const searchInput = this.overlay.querySelector('.pexels-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', this.boundHandlers.onSearchInput);
      searchInput.addEventListener('keypress', this.boundHandlers.onSearchKeypress);
    }

    // Media type toggle
    const typeButtons = this.overlay.querySelectorAll('.type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', this.boundHandlers.onTypeChange);
    });

    // Filter selects
    const filterSelects = this.overlay.querySelectorAll('.pexels-filter-select');
    filterSelects.forEach(select => {
      select.addEventListener('change', this.boundHandlers.onFilterChange);
    });

    // Result item clicks
    const resultItems = this.overlay.querySelectorAll('.pexels-result-item');
    resultItems.forEach(item => {
      item.addEventListener('click', this.boundHandlers.onResultClick);
    });

    // Add to timeline button
    const addBtn = this.overlay.querySelector('.pexels-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', this.boundHandlers.onAddToTimeline);
    }

    // Retry button
    const retryBtn = this.overlay.querySelector('.pexels-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', this.boundHandlers.onRetry);
    }

    // Base modal event listeners
    super.setupEventListeners();
  }

  removeEventListeners() {
    if (!this.overlay) return;

    const searchInput = this.overlay.querySelector('.pexels-search-input');
    if (searchInput) {
      searchInput.removeEventListener('input', this.boundHandlers.onSearchInput);
      searchInput.removeEventListener('keypress', this.boundHandlers.onSearchKeypress);
    }

    const typeButtons = this.overlay.querySelectorAll('.type-btn');
    typeButtons.forEach(btn => {
      btn.removeEventListener('click', this.boundHandlers.onTypeChange);
    });

    const filterSelects = this.overlay.querySelectorAll('.pexels-filter-select');
    filterSelects.forEach(select => {
      select.removeEventListener('change', this.boundHandlers.onFilterChange);
    });

    const resultItems = this.overlay.querySelectorAll('.pexels-result-item');
    resultItems.forEach(item => {
      item.removeEventListener('click', this.boundHandlers.onResultClick);
    });

    const addBtn = this.overlay.querySelector('.pexels-add-btn');
    if (addBtn) {
      addBtn.removeEventListener('click', this.boundHandlers.onAddToTimeline);
    }

    const retryBtn = this.overlay.querySelector('.pexels-retry-btn');
    if (retryBtn) {
      retryBtn.removeEventListener('click', this.boundHandlers.onRetry);
    }

    super.removeEventListeners();
  }

  onSearchInput(e) {
    const value = e.target.value;
    this.currentQuery = value;
    
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Set debounce (500ms)
    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 500);
  }

  onSearchKeypress(e) {
    if (e.key === 'Enter') {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      this.performSearch();
    }
  }

  onTypeChange(e) {
    const newType = e.target.dataset.type;
    if (newType && newType !== this.mediaType) {
      this.mediaType = newType;
      this.page = 1;
      this.selectedItem = null;
      this.performSearch();
    }
  }

  onFilterChange() {
    const orientation = this.overlay.querySelector('select[data-filter="orientation"]')?.value || '';
    const size = this.overlay.querySelector('select[data-filter="size"]')?.value || '';
    const color = this.overlay.querySelector('select[data-filter="color"]')?.value || '';
    
    this.currentFilters = { orientation, size, color };
    this.page = 1;
    this.selectedItem = null;
    this.performSearch();
  }

  onResultClick(e) {
    const itemEl = e.target.closest('.pexels-result-item');
    if (!itemEl) return;
    
    const id = itemEl.dataset.id;
    const item = this.searchResults.find(r => r.id === id);
    if (item) {
      this.selectItem(item);
    }
  }

  onAddToTimeline() {
    this.addToTimeline();
  }

  onRetry() {
    this.error = null;
    this.performSearch();
  }

  selectItem(item) {
    this.selectedItem = item;
    this.updateBody(this.renderBody());
  }

  addToTimeline() {
    if (this.selectedItem) {
      this.onSelect(this.selectedItem);
      this.close();
    }
  }

  isFilterActive() {
    return Object.values(this.currentFilters).some(v => v !== '');
  }

  formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '';
    const totalSec = Math.floor(seconds);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async performSearch() {
    if (!this.overlay) return;

    const query = this.currentQuery.trim();
    if (!query) {
      this.searchResults = [];
      this.updateBody(this.renderBody());
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.updateBody(this.renderBody());

    try {
      const options = {
        page: this.page,
        per_page: 20,
        ...(this.currentFilters.orientation && { orientation: this.currentFilters.orientation }),
        ...(this.currentFilters.size && { size: this.currentFilters.size }),
        ...(this.currentFilters.color && { color: this.currentFilters.color })
      };

      let results;
      if (this.mediaType === 'photos') {
        results = await pexelsService.searchPhotos(query, options);
      } else {
        results = await pexelsService.searchVideos(query, options);
      }

      this.searchResults = results;
      this.isLoading = false;
      this.updateBody(this.renderBody());
    } catch (err) {
      this.error = err.message || 'Failed to fetch results';
      this.isLoading = false;
      this.searchResults = [];
      this.updateBody(this.renderBody());
    }
  }
}

export default PexelsMediaModal;
