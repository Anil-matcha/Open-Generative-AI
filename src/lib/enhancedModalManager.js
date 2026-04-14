/**
 * Enhanced Modal Management System for Timeline Integration
 * Manages 22+ modals with unified interface and state synchronization
 */

import { componentAdapter } from './enhancedComponentAdapter.js';
import { isFeatureEnabled } from './featureFlags.js';

class EnhancedModalManager {
  constructor(container) {
    this.container = container;
    this.activeModals = new Map();
    this.modalStack = [];
    this.eventListeners = new Map();
  }

  /**
   * Open a modal with enhanced integration
   */
  async openModal(modalName, props = {}, options = {}) {
    try {
      // Check feature flag for modal category
      const categoryFlag = this.getCategoryFlagForModal(modalName);
      if (categoryFlag && !isFeatureEnabled(categoryFlag)) {
        throw new Error(`Feature ${categoryFlag} is disabled`);
      }

      // Load adapted component
      const { Component, adaptedProps } = await componentAdapter.loadAdaptedComponent(modalName, {
        ...props,
        onClose: () => this.closeModal(modalName),
        modalManager: this
      });

      // Create modal wrapper
      const modalWrapper = this.createModalWrapper(modalName, adaptedProps, options);

      // Add to container
      this.container.appendChild(modalWrapper);
      this.activeModals.set(modalName, modalWrapper);
      this.modalStack.push(modalName);

      // Trigger open animation
      setTimeout(() => modalWrapper.classList.add('modal-open'), 10);

      // Emit event
      this.emit('modalOpened', { modalName, props: adaptedProps });

      return modalWrapper;

    } catch (error) {
      console.error(`Failed to open modal ${modalName}:`, error);
      throw error;
    }
  }

  /**
   * Close a specific modal
   */
  closeModal(modalName) {
    const modal = this.activeModals.get(modalName);
    if (!modal) return;

    // Trigger close animation
    modal.classList.remove('modal-open');
    modal.classList.add('modal-closing');

    // Remove after animation
    setTimeout(() => {
      modal.remove();
      this.activeModals.delete(modalName);
      this.modalStack = this.modalStack.filter(name => name !== modalName);

      // Emit event
      this.emit('modalClosed', { modalName });
    }, 300);
  }

  /**
   * Close all modals
   */
  closeAllModals() {
    const modalNames = Array.from(this.activeModals.keys());
    modalNames.forEach(name => this.closeModal(name));
  }

  /**
   * Get the top modal (last opened)
   */
  getTopModal() {
    return this.modalStack.length > 0 ? this.modalStack[this.modalStack.length - 1] : null;
  }

  /**
   * Check if a modal is currently open
   */
  isModalOpen(modalName) {
    return this.activeModals.has(modalName);
  }

  /**
   * Create modal wrapper element
   */
  createModalWrapper(modalName, props, options) {
    const wrapper = document.createElement('div');
    wrapper.className = `enhanced-modal-wrapper ${options.className || ''}`;
    wrapper.setAttribute('data-modal', modalName);
    wrapper.setAttribute('role', 'dialog');
    wrapper.setAttribute('aria-modal', 'true');

    // Create modal structure
    wrapper.innerHTML = `
      <div class="modal-backdrop" data-action="close"></div>
      <div class="modal-container ${options.size || 'medium'}">
        <div class="modal-header">
          <h2 class="modal-title">${props.title || this.getModalTitle(modalName)}</h2>
          <button class="modal-close-btn" data-action="close" aria-label="Close modal">
            <span class="close-icon">✕</span>
          </button>
        </div>
        <div class="modal-content" id="modal-${modalName}-content">
          <div class="modal-loading">
            <div class="loading-spinner"></div>
            <p>Loading ${this.getModalTitle(modalName)}...</p>
          </div>
        </div>
        ${options.showFooter !== false ? `
          <div class="modal-footer">
            <button class="btn btn-secondary" data-action="cancel">Cancel</button>
            <button class="btn btn-primary" data-action="confirm">OK</button>
          </div>
        ` : ''}
      </div>
    `;

    // Add event listeners
    wrapper.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'close') {
        this.closeModal(modalName);
      } else if (e.target.dataset.action === 'cancel') {
        this.closeModal(modalName);
        props.onCancel && props.onCancel();
      } else if (e.target.dataset.action === 'confirm') {
        props.onConfirm && props.onConfirm();
      }
    });

    // Prevent backdrop clicks from closing if specified
    if (options.preventBackdropClose) {
      const backdrop = wrapper.querySelector('.modal-backdrop');
      backdrop.removeAttribute('data-action');
    }

    // Load modal content
    this.loadModalContent(modalName, props, wrapper);

    return wrapper;
  }

  /**
   * Load modal content dynamically
   */
  async loadModalContent(modalName, props, wrapper) {
    const contentEl = wrapper.querySelector('.modal-content');

    try {
      // Import modal component
      const modalModule = await this.importModalComponent(modalName);
      const ModalComponent = modalModule.default || modalModule[modalName];

      if (ModalComponent) {
        // For React components, create a mount point
        if (ModalComponent.prototype && ModalComponent.prototype.render) {
          contentEl.innerHTML = '<div id="react-modal-mount"></div>';
          // In a real implementation, this would render React component
          contentEl.innerHTML = '<div class="react-component-placeholder">' +
            '<h3>' + this.getModalTitle(modalName) + '</h3>' +
            '<p>React component would render here</p>' +
            '<pre>' + JSON.stringify(props, null, 2) + '</pre>' +
            '</div>';
        } else {
          // For vanilla JS components
          contentEl.innerHTML = ModalComponent.render(props);
        }
      } else {
        throw new Error(`Modal component ${modalName} not found`);
      }
    } catch (error) {
      contentEl.innerHTML = `
        <div class="modal-error">
          <h3>Failed to Load Modal</h3>
          <p>Error: ${error.message}</p>
          <button class="btn btn-secondary" data-action="close">Close</button>
        </div>
      `;
    }
  }

  /**
   * Import modal component dynamically
   */
  async importModalComponent(modalName) {
    try {
      // Map modal names to import paths
      const modalMap = {
        'AdvanceImageEditorModal': () => import('../components/modals/AdvanceImageEditorModal.jsx'),
        'AIVideoCreator': () => import('../components/modals/AIVideoCreator.jsx'),
        'BillingModal': () => import('../components/modals/BillingModal.jsx'),
        'ConnectModal': () => import('../components/modals/ConnectModal.jsx'),
        'ContactImporterModal': () => import('../components/modals/ContactImporterModal.jsx'),
        'EmailCampaignModal': () => import('../components/modals/EmailCampaignModal.jsx'),
        'EndScreenModal': () => import('../components/modals/EndScreenModal.jsx'),
        'EnhancedRecorderModal': () => import('../components/modals/EnhancedRecorderModal.jsx'),
        'ImageCropperModal': () => import('../components/modals/ImageCropperModal.jsx'),
        'ImglyImageEditorModal': () => import('../components/modals/ImglyImageEditorModal.jsx'),
        'PageShotModal': () => import('../components/modals/PageShotModal.jsx'),
        'PersonalizationModal': () => import('../components/modals/PersonalizationModal.jsx'),
        'PreviewMediaModal': () => import('../components/modals/PreviewMediaModal.jsx'),
        'RecorderModal': () => import('../components/modals/RecorderModal.jsx'),
        'SaveProjectModal': () => import('../components/modals/SaveProjectModal.jsx'),
        'SettingsModal': () => import('../components/modals/SettingsModal.jsx'),
        'SocialPublisherModal': () => import('../components/modals/SocialPublisherModal.jsx'),
        'TemplateGeneratorModal': () => import('../components/modals/TemplateGeneratorModal.jsx'),
        'TemplatePreviewModal': () => import('../components/modals/TemplatePreviewModal.jsx'),
        'UrlVideoModal': () => import('../components/modals/UrlVideoModal.jsx'),
        'VideoAnalytics': () => import('../components/modals/VideoAnalytics.jsx'),
        'VideoPersonalizer': () => import('../components/modals/VideoPersonalizer.jsx'),
        'VideoPlayerModal': () => import('../components/modals/VideoPlayerModal.jsx'),
        'VoiceModal': () => import('../components/modals/VoiceModal.jsx')
      };

      const importFn = modalMap[modalName];
      if (!importFn) {
        throw new Error(`No import mapping for modal: ${modalName}`);
      }

      return await importFn();
    } catch (error) {
      console.error(`Failed to import modal ${modalName}:`, error);
      // Return a fallback component
      return {
        default: {
          render: (props) => `
            <div class="fallback-modal">
              <h3>${modalName}</h3>
              <p>This modal is not yet integrated.</p>
              <p>Props: ${JSON.stringify(props, null, 2)}</p>
            </div>
          `
        }
      };
    }
  }

  /**
   * Get category flag for modal
   */
  getCategoryFlagForModal(modalName) {
    const modalCategories = {
      // Category C: Main Editor Surfaces
      'AIVideoCreator': 'CATEGORY_C_MAIN_EDITOR_SURFACES',
      'VideoPlayerModal': 'CATEGORY_C_MAIN_EDITOR_SURFACES',
      'PreviewMediaModal': 'CATEGORY_C_MAIN_EDITOR_SURFACES',
      'VideoPersonalizer': 'CATEGORY_C_MAIN_EDITOR_SURFACES',

      // Category J: Modals/Editing Workflows
      'AdvanceImageEditorModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'BillingModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'ConnectModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'ContactImporterModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'EmailCampaignModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'EndScreenModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'EnhancedRecorderModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'ImageCropperModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'ImglyImageEditorModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'PageShotModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'PersonalizationModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'RecorderModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'SaveProjectModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'SettingsModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'SocialPublisherModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'TemplateGeneratorModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'TemplatePreviewModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'UrlVideoModal': 'CATEGORY_J_MODALS_WORKFLOWS',
      'VideoAnalytics': 'CATEGORY_J_MODALS_WORKFLOWS',
      'VoiceModal': 'CATEGORY_J_MODALS_WORKFLOWS'
    };

    return modalCategories[modalName];
  }

  /**
   * Get modal title from name
   */
  getModalTitle(modalName) {
    const titles = {
      'AdvanceImageEditorModal': 'Advanced Image Editor',
      'AIVideoCreator': 'AI Video Creator',
      'BillingModal': 'Billing & Subscriptions',
      'ConnectModal': 'Connect Services',
      'ContactImporterModal': 'Import Contacts',
      'EmailCampaignModal': 'Email Campaign',
      'EndScreenModal': 'End Screen Editor',
      'EnhancedRecorderModal': 'Enhanced Recorder',
      'ImageCropperModal': 'Image Cropper',
      'ImglyImageEditorModal': 'Imgly Image Editor',
      'PageShotModal': 'Page Screenshot',
      'PersonalizationModal': 'Personalization',
      'PreviewMediaModal': 'Preview Media',
      'RecorderModal': 'Screen Recorder',
      'SaveProjectModal': 'Save Project',
      'SettingsModal': 'Settings',
      'SocialPublisherModal': 'Social Publisher',
      'TemplateGeneratorModal': 'Template Generator',
      'TemplatePreviewModal': 'Template Preview',
      'UrlVideoModal': 'URL Video',
      'VideoAnalytics': 'Video Analytics',
      'VideoPersonalizer': 'Video Personalizer',
      'VideoPlayerModal': 'Video Player',
      'VoiceModal': 'Voice Tools'
    };

    return titles[modalName] || modalName.replace(/([A-Z])/g, ' $1').trim();
  }

  /**
   * Event system for modal lifecycle
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

// Create global modal manager instance
let globalModalManager = null;

export function getModalManager(container) {
  if (!globalModalManager && container) {
    globalModalManager = new EnhancedModalManager(container);
  }
  return globalModalManager;
}

export { EnhancedModalManager };</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/src/lib/enhancedModalManager.js