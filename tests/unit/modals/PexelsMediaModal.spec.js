import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PexelsMediaModal } from '../../../src/components/modals/PexelsMediaModal.jsx';

// Mock BaseModal methods and DOM
vi.mock('../../../src/components/modals/BaseModal.jsx', () => ({
  BaseModal: class {
    constructor(options = {}) {
      this.title = options.title || 'Modal';
      this.size = options.size || 'medium';
      this.closable = options.closable !== false;
      this.closeOnEscape = options.closeOnEscape !== false;
      this.closeOnBackdrop = options.closeOnBackdrop !== false;
      this.showFooter = options.showFooter !== false;
      this.onOpen = options.onOpen || (() => {});
      this.onClose = options.onClose || (() => {});
      this.onConfirm = options.onConfirm || (() => {});
      this.onCancel = options.onCancel || (() => {});
      this.state = 'closed';
      this.loading = false;
      this.error = null;
      this.overlay = null;
      this.content = null;
      this.previousActiveElement = null;
      this.focusableElements = [];
      this.boundHandlers = {};
    }
    open() { this.state = 'open'; }
    close() { this.state = 'closed'; }
    updateBody(html) { this.bodyHtml = html; }
    destroy() {}
    setupAccessibility() {}
    removeEventListeners() {}
    restoreFocus() {}
    animateIn() {}
    animateOut() {}
  }
}));

// Mock PexelsService
vi.mock('../../../src/lib/services/PexelsService.js', () => ({
  pexelsService: {
    isEnabled: vi.fn(() => true),
    searchPhotos: vi.fn(),
    searchVideos: vi.fn()
  }
}));

describe('PexelsMediaModal', () => {
  let modal;
  let mockOnSelect;
  
  beforeEach(() => {
    mockOnSelect = vi.fn();
    modal = new PexelsMediaModal({
      onSelect: mockOnSelect,
      initialQuery: 'nature',
      mediaType: 'photos'
    });
  });
  
  describe('Constructor', () => {
    it('should set default options', () => {
      expect(modal.title).toBe('Browse Pexels');
      expect(modal.size).toBe('large');
    });
    
    it('should accept initialQuery option', () => {
      expect(modal.initialQuery).toBe('nature');
    });
    
    it('should accept mediaType option (photos/videos)', () => {
      expect(modal.mediaType).toBe('photos');
    });
    
    it('should initialize state defaults', () => {
      expect(modal.currentQuery).toBe('nature');
      expect(modal.searchResults).toEqual([]);
      expect(modal.selectedItem).toBeNull();
      expect(modal.isLoading).toBe(false);
      expect(modal.page).toBe(1);
    });
  });
  
  describe('renderBody', () => {
    it('should render search input with value', () => {
      const html = modal.renderBody();
      expect(html).toContain('pexels-search-input');
      expect(html).toContain('value="nature"');
    });
    
    it('should render photos/videos toggle buttons', () => {
      const html = modal.renderBody();
      expect(html).toContain('Photos');
      expect(html).toContain('Videos');
      expect(html).toContain('data-type="photos"');
    });
    
    it('should render filter selects (orientation, size, color)', () => {
      const html = modal.renderBody();
      expect(html).toContain('pexels-filter-select');
      expect(html).toContain('orientation');
      expect(html).toContain('Landscape');
    });
    
    it('should render results grid container', () => {
      const html = modal.renderBody();
      expect(html).toContain('pexels-results-grid');
    });
    
    it('should show loading state when isLoading', () => {
      modal.isLoading = true;
      modal.searchResults = [];
      const html = modal.renderBody();
      expect(html).toContain('pexels-loading-state');
    });
    
    it('should show error state when error set', () => {
      modal.error = 'API error';
      const html = modal.renderBody();
      expect(html).toContain('pexels-error-state');
      expect(html).toContain('API error');
    });
    
    it('should show empty state when no results', () => {
      modal.searchResults = [];
      modal.isLoading = false;
      const html = modal.renderBody();
      expect(html).toContain('pexels-empty-state');
      expect(html).toContain('No results');
    });
    
    it('should render result items from searchResults', () => {
      modal.searchResults = [
        { id: '1', type: 'image', url: 'test.jpg', alt: 'Mountain', photographer: 'John', thumbnail: 'thumb.jpg' }
      ];
      const html = modal.renderBody();
      expect(html).toContain('pexels-result-item');
      expect(html).toContain('Mountain');
      expect(html).toContain('John');
    });
    
    it('should mark selected item with .selected class', () => {
      modal.searchResults = [
        { id: '1', type: 'image' },
        { id: '2', type: 'image' }
      ];
      modal.selectedItem = modal.searchResults[0];
      const html = modal.renderBody();
      expect(html).toContain('selected');
    });
    
    it('should show video duration badge for video items', () => {
      modal.searchResults = [
        { id: '1', type: 'video', duration: 12.5, thumbnail: 'thumb.jpg' }
      ];
      const html = modal.renderBody();
      expect(html).toContain('video-badge');
      expect(html).toContain('0:12');
    });
    
    it('should show preview panel when item selected', () => {
      modal.selectedItem = {
        id: '1',
        type: 'image',
        url: 'large.jpg',
        alt: 'Test',
        photographer: 'Jane',
        width: 1920,
        height: 1080
      };
      const html = modal.renderBody();
      expect(html).toContain('pexels-preview-panel');
      expect(html).toContain('Test');
      expect(html).toContain('1920 × 1080');
      expect(html).toContain('Add to Timeline');
    });
    
    it('should not show Add to Timeline button when no selection', () => {
      modal.selectedItem = null;
      const html = modal.renderBody();
      expect(html).not.toContain('Add to Timeline');
      expect(html).not.toContain('pexels-preview-panel');
    });
  });
  
  describe('Event handling', () => {
    beforeEach(() => {
      // Setup minimal DOM
      modal.overlay = document.createElement('div');
      modal.updateBody = vi.fn();
      modal.setupEventListeners();
    });
    
    afterEach(() => {
      if (modal.removeEventListeners) {
        modal.removeEventListeners();
      }
    });
    
    it('should handle search input with debounce (500ms)', async () => {
      const input = document.createElement('input');
      input.className = 'pexels-search-input';
      input.value = 'nature';
      modal.overlay.appendChild(input);
      
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
      
      // Should set timeout
      expect(modal.searchDebounce).toBeDefined();
      
      // Wait for debounce
      await new Promise(r => setTimeout(r, 550));
      
      // Should have called search
      expect(modal.currentQuery).toBe('nature');
    });
    
    it('should trigger search on Enter key', async () => {
      const input = document.createElement('input');
      input.className = 'pexels-search-input';
      modal.overlay.appendChild(input);
      
      const event = new KeyboardEvent('keypress', { key: 'Enter', bubbles: true });
      input.dispatchEvent(event);
      
      await new Promise(r => setTimeout(r, 50));
      
      expect(modal.currentQuery).toBe('nature');
      expect(modal.page).toBe(1);
    });
    
    it('should switch media type and refetch', async () => {
      modal.currentQuery = 'test';
      modal.mediaType = 'photos';
      
      // Simulate click on videos button
      const btn = document.createElement('button');
      btn.className = 'type-btn';
      btn.dataset.type = 'videos';
      modal.overlay.querySelector = vi.fn(() => btn);
      
      btn.click();
      
      expect(modal.mediaType).toBe('videos');
      expect(modal.page).toBe(1);
      expect(modal.selectedItem).toBeNull();
    });
    
    it('should select item on click', () => {
      modal.searchResults = [{ id: '1' }, { id: '2' }];
      
      modal.selectItem(modal.searchResults[0]);
      
      expect(modal.selectedItem).toBe(modal.searchResults[0]);
    });
    
    it('should call onSelect and close when Add to Timeline clicked', () => {
      modal.selectedItem = { id: '1' };
      modal.close = vi.fn();
      
      modal.addToTimeline();
      
      expect(mockOnSelect).toHaveBeenCalledWith(modal.selectedItem);
      expect(modal.close).toHaveBeenCalled();
    });
    
    it('should not add if no selection', () => {
      modal.selectedItem = null;
      mockOnSelect.mockClear();
      
      modal.addToTimeline();
      
      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });
  
  describe('Filter handling', () => {
    it('should detect when filters are active', () => {
      modal.currentFilters = { orientation: '', size: '', color: '' };
      expect(modal.isFilterActive()).toBe(false);
      
      modal.currentFilters.orientation = 'landscape';
      expect(modal.isFilterActive()).toBe(true);
    });
  });
  
  describe('Utility methods', () => {
    it('should format duration correctly', () => {
      expect(modal.formatDuration(0)).toBe('0:00');
      expect(modal.formatDuration(65)).toBe('1:05');
      expect(modal.formatDuration(125)).toBe('2:05');
    });
    
    it('should escape HTML to prevent XSS', () => {
      const dangerous = '<script>alert("xss")</script>';
      const escaped = modal.escapeHtml(dangerous);
      expect(escaped).not.toContain('<script>');
    });
  });
});
