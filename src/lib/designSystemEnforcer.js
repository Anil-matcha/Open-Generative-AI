/**
 * Timeline Editor Design System Enforcer
 * Ensures ALL integrated features follow the exact timeline editor design system
 */

export const TIMELINE_DESIGN_SYSTEM = {
  // Core CSS Variables - MUST be used by all components
  variables: {
    // Backgrounds
    '--bg': '#05070b',
    '--panel': 'rgba(255,255,255,0.05)',
    '--panel-soft': 'rgba(255,255,255,0.03)',
    '--border': 'rgba(255,255,255,0.1)',
    '--border-soft': 'rgba(255,255,255,0.08)',

    // Text Colors
    '--text': '#ffffff',
    '--muted': 'rgba(255,255,255,0.6)',
    '--dim': 'rgba(255,255,255,0.4)',

    // Accent Colors
    '--cyan': '#22d3ee',
    '--emerald': '#34d399',

    // Effects
    '--shadow': '0 20px 60px rgba(0,0,0,0.45)',
    '--radius-xl': '28px',
  },

  // Component Styles - Predefined classes that enforce consistency
  styles: {
    // Modal System - Exact structure required
    modal: {
      overlay: 'modal-overlay',
      content: 'modal-content',
      header: 'modal-header',
      body: 'modal-body'
    },

    // Button Types - Must use these exact classes
    buttons: {
      primary: 'primary-btn',
      icon: 'icon-btn',
      circle: 'circle-btn',
      tool: 'tool-btn',
      mini: 'mini-btn'
    },

    // Card Types
    cards: {
      timeline: 'timeline-card',
      side: 'side-card',
      preview: 'preview-card'
    },

    // Interactive Elements
    interactive: {
      hover: 'interactive-glow',
      dragReady: 'drag-ready',
      dropHighlight: 'drop-highlight'
    }
  },

  // Animation Classes
  animations: {
    fadeIn: 'animate-fade-in-up',
    skeleton: 'thumb-skeleton'
  },

  // Utility Functions
  utils: {
    // Apply design system variables to an element
    applyVariables: (element) => {
      Object.entries(TIMELINE_DESIGN_SYSTEM.variables).forEach(([key, value]) => {
        element.style.setProperty(key, value);
      });
    },

    // Create a modal with enforced design system
    createModal: (options = {}) => {
      const {
        title = '',
        content = '',
        onClose = () => {},
        size = 'medium'
      } = options;

      // Modal overlay
      const overlay = document.createElement('div');
      overlay.className = TIMELINE_DESIGN_SYSTEM.styles.modal.overlay;

      // Modal content
      const modalContent = document.createElement('div');
      modalContent.className = TIMELINE_DESIGN_SYSTEM.styles.modal.content;

      // Modal header
      const header = document.createElement('div');
      header.className = TIMELINE_DESIGN_SYSTEM.styles.modal.header;

      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      header.appendChild(titleEl);

      const closeBtn = document.createElement('button');
      closeBtn.className = 'modal-close';
      closeBtn.innerHTML = '×';
      closeBtn.onclick = () => {
        overlay.remove();
        onClose();
      };
      header.appendChild(closeBtn);

      // Modal body
      const body = document.createElement('div');
      body.className = TIMELINE_DESIGN_SYSTEM.styles.modal.body;
      if (typeof content === 'string') {
        body.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        body.appendChild(content);
      }

      modalContent.appendChild(header);
      modalContent.appendChild(body);
      overlay.appendChild(modalContent);

      // Close on overlay click
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
          onClose();
        }
      };

      return overlay;
    },

    // Create a button with enforced styling
    createButton: (options = {}) => {
      const {
        type = 'primary',
        text = '',
        icon = '',
        onClick = () => {},
        className = ''
      } = options;

      const button = document.createElement('button');
      button.className = `${TIMELINE_DESIGN_SYSTEM.styles.buttons[type]} ${className}`.trim();
      button.onclick = onClick;

      if (icon) {
        button.innerHTML = `${icon} ${text}`;
      } else {
        button.textContent = text;
      }

      return button;
    },

    // Apply drag-and-drop styling enforcement
    enforceDragDrop: (element) => {
      // Ensure drag feedback uses design system colors
      element.addEventListener('dragstart', (e) => {
        e.target.classList.add('dragging');
        e.target.style.setProperty('--drag-color', TIMELINE_DESIGN_SYSTEM.variables['--cyan']);
      });

      element.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
      });

      // Add drop zone styling
      element.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.target.classList.add('drop-highlight');
      });

      element.addEventListener('dragleave', (e) => {
        e.target.classList.remove('drop-highlight');
      });
    },

    // Create loading state with design system styling
    createLoadingState: (element) => {
      const loading = document.createElement('div');
      loading.className = 'loading-state';
      loading.innerHTML = `
        <div class="loading-spinner" style="
          width: 24px;
          height: 24px;
          border: 2px solid ${TIMELINE_DESIGN_SYSTEM.variables['--border']};
          border-top: 2px solid ${TIMELINE_DESIGN_SYSTEM.variables['--cyan']};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
      `;

      // Add spin animation if not exists
      if (!document.querySelector('#loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: ${TIMELINE_DESIGN_SYSTEM.variables['--muted']};
          }
        `;
        document.head.appendChild(style);
      }

      element.appendChild(loading);
      return loading;
    },

    // Enforce video playback controls styling
    createVideoControls: (container) => {
      const controls = document.createElement('div');
      controls.className = 'video-controls';
      controls.innerHTML = `
        <div class="control-row">
          <button class="circle-btn" aria-label="Rewind">⏮</button>
          <button class="circle-btn primary" aria-label="Play/Pause">▶</button>
          <button class="circle-btn" aria-label="Stop">⏹</button>
        </div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      `;

      // Apply design system styles
      controls.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 16px;
        background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
      `;

      container.appendChild(controls);
      return controls;
    }
  },

  // Validation Functions - Check compliance
  validators: {
    // Check if element uses design system variables
    hasDesignSystemVariables: (element) => {
      const computedStyle = getComputedStyle(element);
      return Object.keys(TIMELINE_DESIGN_SYSTEM.variables).every(key =>
        computedStyle.getPropertyValue(key) !== ''
      );
    },

    // Check if modal follows design system structure
    isValidModal: (modalElement) => {
      const hasOverlay = modalElement.classList.contains(TIMELINE_DESIGN_SYSTEM.styles.modal.overlay);
      const hasContent = !!modalElement.querySelector(`.${TIMELINE_DESIGN_SYSTEM.styles.modal.content}`);
      const hasHeader = !!modalElement.querySelector(`.${TIMELINE_DESIGN_SYSTEM.styles.modal.header}`);
      const hasBody = !!modalElement.querySelector(`.${TIMELINE_DESIGN_SYSTEM.styles.modal.body}`);

      return hasOverlay && hasContent && hasHeader && hasBody;
    },

    // Check if button uses correct design system class
    isValidButton: (buttonElement) => {
      const validClasses = Object.values(TIMELINE_DESIGN_SYSTEM.styles.buttons);
      return validClasses.some(cls => buttonElement.classList.contains(cls));
    }
  },

  // Migration Helpers - Update existing components
  migration: {
    // Update old color values to design system
    updateColors: (element) => {
      const oldColors = {
        '#0a0a0a': TIMELINE_DESIGN_SYSTEM.variables['--bg'],
        'rgb(10, 10, 10)': TIMELINE_DESIGN_SYSTEM.variables['--bg'],
        'rgba(10, 10, 10, 0.8)': TIMELINE_DESIGN_SYSTEM.variables['--panel'],
        '#22d3ee': TIMELINE_DESIGN_SYSTEM.variables['--cyan'],
        'rgb(34, 211, 238)': TIMELINE_DESIGN_SYSTEM.variables['--cyan'],
        '#34d399': TIMELINE_DESIGN_SYSTEM.variables['--emerald'],
        'rgb(52, 211, 153)': TIMELINE_DESIGN_SYSTEM.variables['--emerald']
      };

      // Update inline styles
      Object.entries(oldColors).forEach(([old, new_]) => {
        if (element.style.backgroundColor === old) {
          element.style.backgroundColor = new_;
        }
        if (element.style.borderColor === old) {
          element.style.borderColor = new_;
        }
        if (element.style.color === old) {
          element.style.color = new_;
        }
      });
    },

    // Convert old button classes to new ones
    updateButtonClasses: (element) => {
      const classMappings = {
        'btn-primary': TIMELINE_DESIGN_SYSTEM.styles.buttons.primary,
        'btn-icon': TIMELINE_DESIGN_SYSTEM.styles.buttons.icon,
        'btn-circle': TIMELINE_DESIGN_SYSTEM.styles.buttons.circle
      };

      Object.entries(classMappings).forEach(([old, new_]) => {
        if (element.classList.contains(old)) {
          element.classList.remove(old);
          element.classList.add(new_);
        }
      });
    }
  }
};

// Global enforcement - automatically apply to new elements
export const enforceDesignSystem = () => {
  // Inject design system CSS variables globally
  if (!document.querySelector('#timeline-design-system')) {
    const style = document.createElement('style');
    style.id = 'timeline-design-system';
    style.textContent = `
      :root {
        ${Object.entries(TIMELINE_DESIGN_SYSTEM.variables)
          .map(([key, value]) => `${key}: ${value};`)
          .join('\n        ')}
      }

      /* Enforce modal structure */
      .${TIMELINE_DESIGN_SYSTEM.styles.modal.overlay} {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.8);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px);
      }

      .${TIMELINE_DESIGN_SYSTEM.styles.modal.content} {
        background: linear-gradient(135deg, ${TIMELINE_DESIGN_SYSTEM.variables['--panel']}, ${TIMELINE_DESIGN_SYSTEM.variables['--panel-soft']});
        border: 1px solid ${TIMELINE_DESIGN_SYSTEM.variables['--border']};
        border-radius: ${TIMELINE_DESIGN_SYSTEM.variables['--radius-xl']};
        box-shadow: ${TIMELINE_DESIGN_SYSTEM.variables['--shadow']};
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
      }

      .${TIMELINE_DESIGN_SYSTEM.styles.modal.header} {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid ${TIMELINE_DESIGN_SYSTEM.variables['--border']};
        background: rgba(0,0,0,0.2);
      }

      .${TIMELINE_DESIGN_SYSTEM.styles.modal.body} {
        padding: 24px;
        max-height: 60vh;
        overflow-y: auto;
      }

      /* Enforce button styling */
      .${TIMELINE_DESIGN_SYSTEM.styles.buttons.primary} {
        background: linear-gradient(to right, ${TIMELINE_DESIGN_SYSTEM.variables['--cyan']}, ${TIMELINE_DESIGN_SYSTEM.variables['--emerald']});
        color: #03131a;
        border: 1px solid ${TIMELINE_DESIGN_SYSTEM.variables['--border']};
        padding: 11px 14px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 700;
        transition: all 0.15s ease;
      }

      .${TIMELINE_DESIGN_SYSTEM.styles.buttons.icon} {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        border: 1px solid ${TIMELINE_DESIGN_SYSTEM.variables['--border']};
        background: ${TIMELINE_DESIGN_SYSTEM.variables['--panel']};
        color: ${TIMELINE_DESIGN_SYSTEM.variables['--text']};
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
      }

      .${TIMELINE_DESIGN_SYSTEM.styles.buttons.circle} {
        width: 40px;
        height: 40px;
        border-radius: 999px;
        border: 1px solid transparent;
        background: ${TIMELINE_DESIGN_SYSTEM.variables['--panel']};
        color: ${TIMELINE_DESIGN_SYSTEM.variables['--text']};
        cursor: pointer;
      }

      .${TIMELINE_DESIGN_SYSTEM.styles.buttons.circle}.primary {
        width: 48px;
        height: 48px;
        background: white;
        color: black;
        box-shadow: 0 10px 30px rgba(255,255,255,0.15);
      }

      /* Enhanced drag-and-drop with visual feedback */
      .dragging-ghost {
        transform: rotate(2deg);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        border-color: ${TIMELINE_DESIGN_SYSTEM.variables['--cyan']} !important;
        background: rgba(34, 211, 238, 0.1) !important;
      }

      .drop-highlight {
        background: rgba(34, 211, 238, 0.1) !important;
        border: 2px dashed ${TIMELINE_DESIGN_SYSTEM.variables['--cyan']} !important;
        transition: all 0.2s ease;
      }

      /* Loading states and animations */
      .loading-pulse {
        animation: loading-pulse 1.5s ease-in-out infinite;
      }

      @keyframes loading-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      /* Video playback controls matching timeline style */
      .video-controls .progress-bar {
        height: 6px;
        border-radius: 999px;
        background: ${TIMELINE_DESIGN_SYSTEM.variables['--panel']};
        overflow: hidden;
        margin-bottom: 12px;
      }

      .video-controls .progress-fill {
        height: 100%;
        width: 28%;
        border-radius: inherit;
        background: linear-gradient(to right, ${TIMELINE_DESIGN_SYSTEM.variables['--cyan']}, ${TIMELINE_DESIGN_SYSTEM.variables['--emerald']});
      }
    `;
    document.head.appendChild(style);
  }

  // Auto-enforce on new elements (using MutationObserver)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Auto-apply design system to buttons
          if (node.tagName === 'BUTTON') {
            if (!TIMELINE_DESIGN_SYSTEM.validators.isValidButton(node)) {
              node.classList.add(TIMELINE_DESIGN_SYSTEM.styles.buttons.primary);
            }
          }

          // Auto-apply to modals
          if (node.classList.contains('modal')) {
            if (!TIMELINE_DESIGN_SYSTEM.validators.isValidModal(node)) {
              console.warn('Modal does not follow design system structure:', node);
            }
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

// Export everything needed for components
export default TIMELINE_DESIGN_SYSTEM;