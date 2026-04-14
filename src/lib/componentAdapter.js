/**
 * Component Adaptation Framework
 * Adapts external components from remix-new-editor repositories
 * to work seamlessly within our timeline editor
 */

import { isFeatureEnabled } from './featureFlags.js';

/**
 * Base adapter class for external components
 */
export class ComponentAdapter {
  constructor(componentPath, featureFlag, options = {}) {
    this.componentPath = componentPath;
    this.featureFlag = featureFlag;
    this.options = {
      lazyLoad: true,
      adaptStyling: true,
      adaptProps: true,
      ...options
    };
  }

  /**
   * Check if this component can be loaded
   */
  canLoad() {
    return isFeatureEnabled(this.featureFlag);
  }

  /**
   * Load the external component dynamically
   */
  async loadComponent() {
    if (!this.canLoad()) {
      throw new Error(`Feature ${this.featureFlag} is not enabled`);
    }

    try {
      const module = await import(this.componentPath);
      return module.default || module;
    } catch (error) {
      console.error(`Failed to load component from ${this.componentPath}:`, error);
      throw error;
    }
  }

  /**
   * Adapt component props to match our interface
   */
  adaptProps(originalProps) {
    if (!this.options.adaptProps) return originalProps;

    // Default prop adaptation - can be overridden by subclasses
    return {
      ...originalProps,
      className: this.adaptClassName(originalProps.className),
      style: this.adaptStyle(originalProps.style),
      onClose: originalProps.onClose || originalProps.onCancel
    };
  }

  /**
   * Adapt CSS class names to match our design system
   */
  adaptClassName(className) {
    if (!className || !this.options.adaptStyling) return className;

    // Map external class names to our design system
    const classMap = {
      'modal': 'modal-overlay',
      'modal-content': 'modal-content',
      'modal-header': 'modal-header',
      'modal-body': 'modal-body',
      'btn': 'primary-btn',
      'button': 'primary-btn',
      'close': 'modal-close',
      'form-control': 'text-input',
      'card': 'side-card',
      'panel': 'side-card',
      'toolbar': 'toolbar-left',
      'menu': 'floating-rail'
    };

    return className.split(' ')
      .map(cls => classMap[cls] || cls)
      .join(' ');
  }

  /**
   * Adapt styles to match our design system
   */
  adaptStyle(style) {
    if (!style || !this.options.adaptStyling) return style;

    // Apply our CSS custom properties
    const adaptedStyle = { ...style };

    // Convert common style properties
    if (adaptedStyle.backgroundColor) {
      adaptedStyle.backgroundColor = this.adaptColor(adaptedStyle.backgroundColor);
    }
    if (adaptedStyle.borderColor) {
      adaptedStyle.borderColor = this.adaptColor(adaptedStyle.borderColor);
    }
    if (adaptedStyle.color) {
      adaptedStyle.color = this.adaptColor(adaptedStyle.color);
    }

    return adaptedStyle;
  }

  /**
   * Adapt colors to match our design system
   */
  adaptColor(color) {
    const colorMap = {
      '#fff': 'var(--text)',
      '#000': 'var(--bg)',
      '#333': 'var(--muted)',
      '#666': 'var(--dim)',
      '#007bff': 'var(--cyan)',
      '#28a745': 'var(--emerald)',
      '#f8f9fa': 'var(--panel)',
      '#e9ecef': 'var(--border)',
      '#6c757d': 'var(--border-soft)'
    };

    return colorMap[color] || color;
  }

  /**
   * Create an adapted component wrapper
   */
  createAdaptedComponent() {
    const self = this;

    return function AdaptedComponent(props) {
      const adaptedProps = self.adaptProps(props);

      // For now, return a placeholder - actual loading will be implemented
      // when we integrate with React components
      return {
        type: 'adapted-component',
        componentPath: self.componentPath,
        adaptedProps,
        originalProps: props
      };
    };
  }
}

/**
 * Modal Adapter - specializes in modal components
 */
export class ModalAdapter extends ComponentAdapter {
  constructor(componentPath, featureFlag, options = {}) {
    super(componentPath, featureFlag, {
      modalContainer: '#modalOverlay',
      ...options
    });
  }

  adaptProps(originalProps) {
    const adapted = super.adaptProps(originalProps);

    // Ensure modal props match our modal system
    return {
      ...adapted,
      isOpen: adapted.isOpen || adapted.visible || true,
      onRequestClose: adapted.onRequestClose || adapted.onClose,
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEsc: true
    };
  }
}

/**
 * Panel Adapter - specializes in sidebar/panel components
 */
export class PanelAdapter extends ComponentAdapter {
  constructor(componentPath, featureFlag, options = {}) {
    super(componentPath, featureFlag, {
      panelContainer: '.side-col',
      ...options
    });
  }
}

/**
 * Toolbar Adapter - specializes in toolbar/menu components
 */
export class ToolbarAdapter extends ComponentAdapter {
  constructor(componentPath, featureFlag, options = {}) {
    super(componentPath, featureFlag, {
      toolbarContainer: '#topActions',
      ...options
    });
  }
}

/**
 * Registry of adapted components
 */
export const AdaptedComponents = {
  // Video Creation/Personalization
  AIVideoCreator: new ModalAdapter('../../remix-new-editor-dean/components/AIVideoCreator.jsx', 'VIDEO_CREATION_PERSONALIZATION'),
  VideoPersonalizer: new ModalAdapter('../../remix-new-editor-dean/components/VideoPersonalizer.jsx', 'VIDEO_CREATION_PERSONALIZATION'),

  // Image Editing
  AdvanceImageEditor: new ModalAdapter('../../remix-new-editor-strategic/components/common/AdvanceImageEditor/AdvanceEditor.jsx', 'ADVANCED_IMAGE_EDITING'),

  // Text-to-Speech
  TextToSpeechContent: new PanelAdapter('../../remix-new-editor-strategic/components/common/textToSpeech/TextToSpeechContent.jsx', 'TEXT_TO_SPEECH'),
  TextToSpeechLibrary: new PanelAdapter('../../remix-new-editor-strategic/components/common/textToSpeech/TextToSpeechLibrary.jsx', 'TEXT_TO_SPEECH'),

  // Media Library
  Library: new PanelAdapter('../../remix-new-editor-strategic/components/media/Library.jsx', 'ENHANCED_MEDIA_LIBRARY'),
  MediaLibrary: new PanelAdapter('../../remix-new-editor-strategic/components/media/MediaLibrary.jsx', 'ENHANCED_MEDIA_LIBRARY'),

  // Recording
  VideoRecorder: new ModalAdapter('../../remix-new-editor-strategic/components/VideoRecorder.jsx', 'VIDEO_RECORDING'),

  // Templates
  Templates: new ModalAdapter('../../remix-new-editor-strategic/components/Templates.jsx', 'TEMPLATE_SYSTEM'),

  // Publishing
  SocialPublisherModal: new ModalAdapter('../../remix-new-editor-strategic/components/modals/SocialPublisherModal.jsx', 'SOCIAL_PUBLISHING')
};

/**
 * Get an adapted component by name
 * @param {string} componentName - Name of the component
 * @returns {ComponentAdapter} - The adapted component
 */
export function getAdaptedComponent(componentName) {
  return AdaptedComponents[componentName];
}

/**
 * Load and adapt a component
 * @param {string} componentName - Name of the component
 * @param {object} props - Props to pass to the component
 * @returns {Promise} - Promise that resolves to the adapted component
 */
export async function loadAdaptedComponent(componentName, props = {}) {
  const adapter = getAdaptedComponent(componentName);
  if (!adapter) {
    throw new Error(`Component ${componentName} not found in registry`);
  }

  const Component = await adapter.loadComponent();
  const adaptedProps = adapter.adaptProps(props);

  return {
    Component,
    adaptedProps,
    adapter
  };
}