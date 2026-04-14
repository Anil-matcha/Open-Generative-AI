/**
 * Accessibility Utilities
 * Provides ARIA labels, keyboard navigation, and screen reader support
 */

export class AccessibilityUtils {
  constructor() {
    this.liveRegion = null;
    this.focusTraps = new Map();
    this.announcements = [];
    this.init();
  }

  /**
   * Initialize accessibility utilities
   */
  init() {
    // Create live region for screen reader announcements
    this.createLiveRegion();
    
    // Set up keyboard event handlers
    this.setupKeyboardHandlers();
    
    console.log('[AccessibilityUtils] Initialized');
  }

  /**
   * Create live region for screen reader announcements
   */
  createLiveRegion() {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.id = 'accessibility-live-region';
    
    document.body.appendChild(this.liveRegion);
  }

  /**
   * Setup global keyboard handlers
   */
  setupKeyboardHandlers() {
    document.addEventListener('keydown', (event) => {
      // Skip link functionality
      if (event.key === 'Tab' && event.shiftKey) {
        this.handleSkipLink(event);
      }
      
      // Escape key handling for modals
      if (event.key === 'Escape') {
        this.handleEscapeKey(event);
      }
    });
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    if (!this.liveRegion) return;
    
    // Clear previous announcements
    this.liveRegion.textContent = '';
    
    // Set priority
    this.liveRegion.setAttribute('aria-live', priority);
    
    // Announce message
    setTimeout(() => {
      this.liveRegion.textContent = message;
    }, 100);
    
    // Store for debugging
    this.announcements.push({
      message,
      priority,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 announcements
    if (this.announcements.length > 10) {
      this.announcements = this.announcements.slice(-10);
    }
  }

  /**
   * Set focus on element with proper announcement
   * @param {HTMLElement} element - Element to focus
   * @param {string} announcement - Announcement message
   */
  setFocus(element, announcement = '') {
    if (!element) return;
    
    element.focus();
    
    if (announcement) {
      this.announce(announcement);
    }
  }

  /**
   * Create accessible button
   * @param {Object} options - Button options
   * @returns {HTMLElement} Accessible button
   */
  createAccessibleButton(options = {}) {
    const button = document.createElement('button');
    
    // Basic attributes
    button.textContent = options.label || '';
    button.type = options.type || 'button';
    
    // ARIA attributes
    if (options.ariaLabel) {
      button.setAttribute('aria-label', options.ariaLabel);
    }
    
    if (options.ariaDescribedBy) {
      button.setAttribute('aria-describedby', options.ariaDescribedBy);
    }
    
    if (options.disabled) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    }
    
    // Keyboard handling
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (options.onActivate) {
          options.onActivate(event);
        }
      }
    });
    
    // Click handler
    if (options.onClick) {
      button.addEventListener('click', options.onClick);
    }
    
    // Classes
    button.className = options.className || 'focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    return button;
  }

  /**
   * Create accessible modal
   * @param {Object} options - Modal options
   * @returns {Object} Modal elements
   */
  createAccessibleModal(options = {}) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', options.titleId || 'modal-title');
    
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto';
    modal.setAttribute('role', 'document');
    
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between p-4 border-b';
    
    const title = document.createElement('h2');
    title.id = options.titleId || 'modal-title';
    title.className = 'text-lg font-semibold';
    title.textContent = options.title || 'Modal';
    
    const closeButton = this.createAccessibleButton({
      ariaLabel: 'Close modal',
      className: 'text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500',
      onClick: () => {
        if (options.onClose) options.onClose();
        this.closeModal(overlay);
      },
      onActivate: (event) => {
        if (options.onClose) options.onClose();
        this.closeModal(overlay);
      }
    });
    
    closeButton.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    `;
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    const content = document.createElement('div');
    content.className = 'p-4';
    if (options.content) {
      content.appendChild(options.content);
    }
    
    modal.appendChild(header);
    modal.appendChild(content);
    overlay.appendChild(modal);
    
    // Focus trap
    this.setupFocusTrap(overlay, modal);
    
    // Close on overlay click
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        if (options.onClose) options.onClose();
        this.closeModal(overlay);
      }
    });
    
    return { overlay, modal, content };
  }

  /**
   * Close modal with proper cleanup
   * @param {HTMLElement} overlay - Modal overlay
   */
  closeModal(overlay) {
    // Remove focus trap
    this.removeFocusTrap(overlay);
    
    // Announce closure
    this.announce('Modal closed');
    
    // Remove from DOM
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  /**
   * Setup focus trap for modal
   * @param {HTMLElement} overlay - Modal overlay
   * @param {HTMLElement} modal - Modal content
   */
  setupFocusTrap(overlay, modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const trapFocus = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    overlay.addEventListener('keydown', trapFocus);
    this.focusTraps.set(overlay, trapFocus);
    
    // Focus first element
    if (firstElement) {
      setTimeout(() => firstElement.focus(), 100);
    }
  }

  /**
   * Remove focus trap
   * @param {HTMLElement} overlay - Modal overlay
   */
  removeFocusTrap(overlay) {
    const trapHandler = this.focusTraps.get(overlay);
    if (trapHandler) {
      overlay.removeEventListener('keydown', trapHandler);
      this.focusTraps.delete(overlay);
    }
  }

  /**
   * Handle skip link functionality
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleSkipLink(event) {
    // Focus main content
    const mainContent = document.querySelector('main, [role="main"], #main-content');
    if (mainContent) {
      event.preventDefault();
      this.setFocus(mainContent, 'Skipped to main content');
    }
  }

  /**
   * Handle escape key for modals
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleEscapeKey(event) {
    // Close any open modals
    const openModals = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
    if (openModals.length > 0) {
      const lastModal = openModals[openModals.length - 1];
      const closeButton = lastModal.querySelector('[aria-label="Close modal"], .modal-close');
      if (closeButton) {
        closeButton.click();
      }
    }
  }

  /**
   * Make element draggable with keyboard support
   * @param {HTMLElement} element - Element to make draggable
   * @param {Object} options - Draggable options
   */
  makeDraggable(element, options = {}) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    // Mouse events
    element.addEventListener('mousedown', startDrag);
    
    // Touch events
    element.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startDrag({
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => e.preventDefault()
      });
    });
    
    // Keyboard events
    element.addEventListener('keydown', (event) => {
      if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        
        const step = options.keyboardStep || 10;
        const currentLeft = parseInt(element.style.left) || 0;
        const currentTop = parseInt(element.style.top) || 0;
        
        let newLeft = currentLeft;
        let newTop = currentTop;
        
        switch (event.key) {
          case 'ArrowLeft':
            newLeft = Math.max(0, currentLeft - step);
            break;
          case 'ArrowRight':
            newLeft = Math.min(window.innerWidth - element.offsetWidth, currentLeft + step);
            break;
          case 'ArrowUp':
            newTop = Math.max(0, currentTop - step);
            break;
          case 'ArrowDown':
            newTop = Math.min(window.innerHeight - element.offsetHeight, currentTop + step);
            break;
        }
        
        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
        
        this.announce(`Moved to position ${newLeft}, ${newTop}`);
        
        if (options.onMove) {
          options.onMove({ left: newLeft, top: newTop });
        }
      }
    });
    
    function startDrag(event) {
      isDragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = parseInt(element.style.left) || 0;
      startTop = parseInt(element.style.top) || 0;
      
      element.style.cursor = 'grabbing';
      element.setAttribute('aria-grabbed', 'true');
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchmove', drag);
      document.addEventListener('touchend', stopDrag);
      
      if (event.preventDefault) event.preventDefault();
    }
    
    function drag(event) {
      if (!isDragging) return;
      
      const clientX = event.clientX || (event.touches && event.touches[0].clientX);
      const clientY = event.clientY || (event.touches && event.touches[0].clientY);
      
      if (clientX === undefined || clientY === undefined) return;
      
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      
      const newLeft = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, startLeft + deltaX));
      const newTop = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, startTop + deltaY));
      
      element.style.left = `${newLeft}px`;
      element.style.top = `${newTop}px`;
      
      if (options.onMove) {
        options.onMove({ left: newLeft, top: newTop });
      }
    }
    
    function stopDrag() {
      if (!isDragging) return;
      
      isDragging = false;
      element.style.cursor = '';
      element.setAttribute('aria-grabbed', 'false');
      
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('touchend', stopDrag);
      
      this.announce('Finished dragging');
    }
    
    // Make keyboard focusable
    element.setAttribute('tabindex', '0');
    element.setAttribute('aria-label', options.ariaLabel || 'Draggable element');
    element.setAttribute('aria-describedby', 'drag-instructions');
    
    // Add hidden instructions
    const instructions = document.createElement('div');
    instructions.id = 'drag-instructions';
    instructions.className = 'sr-only';
    instructions.textContent = 'Use arrow keys to move this element. Press Tab to navigate away.';
    element.appendChild(instructions);
  }

  /**
   * Create accessible tooltip
   * @param {HTMLElement} trigger - Trigger element
   * @param {string} content - Tooltip content
   * @returns {HTMLElement} Tooltip element
   */
  createTooltip(trigger, content) {
    const tooltip = document.createElement('div');
    tooltip.className = 'absolute z-50 px-2 py-1 text-sm text-white bg-black rounded shadow-lg opacity-0 invisible transition-opacity duration-200';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = content;
    
    trigger.setAttribute('aria-describedby', `tooltip-${Date.now()}`);
    tooltip.id = trigger.getAttribute('aria-describedby');
    
    let showTimeout, hideTimeout;
    
    const showTooltip = () => {
      clearTimeout(hideTimeout);
      showTimeout = setTimeout(() => {
        tooltip.classList.remove('opacity-0', 'invisible');
        tooltip.classList.add('opacity-100', 'visible');
        this.announce(content);
      }, 500);
    };
    
    const hideTooltip = () => {
      clearTimeout(showTimeout);
      hideTimeout = setTimeout(() => {
        tooltip.classList.add('opacity-0', 'invisible');
        tooltip.classList.remove('opacity-100', 'visible');
      }, 150);
    };
    
    trigger.addEventListener('mouseenter', showTooltip);
    trigger.addEventListener('mouseleave', hideTooltip);
    trigger.addEventListener('focus', showTooltip);
    trigger.addEventListener('blur', hideTooltip);
    
    // Position tooltip
    const updatePosition = () => {
      const rect = trigger.getBoundingClientRect();
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top - 30}px`;
      tooltip.style.transform = 'translateX(-50%)';
    };
    
    trigger.addEventListener('mouseenter', updatePosition);
    trigger.addEventListener('focus', updatePosition);
    
    document.body.appendChild(tooltip);
    
    return tooltip;
  }

  /**
   * Get accessibility statistics
   * @returns {Object} Accessibility stats
   */
  getStats() {
    return {
      announcements: this.announcements.length,
      focusTraps: this.focusTraps.size,
      liveRegion: !!this.liveRegion
    };
  }
}

// Export singleton instance
export const accessibilityUtils = new AccessibilityUtils();
