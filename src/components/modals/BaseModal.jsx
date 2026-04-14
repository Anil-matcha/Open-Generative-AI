// BaseModal.jsx - Foundation for all modal dialogs
// Follows Timeline Design System with exact CSS variables and styling

import { createElementFromHTML } from '../../utils/jsx.js';

const DESIGN_SYSTEM = {
  colors: {
    bg: 'var(--bg)',
    panel: 'var(--panel)',
    panelSoft: 'var(--panel-soft)',
    border: 'var(--border)',
    borderSoft: 'var(--border-soft)',
    text: 'var(--text)',
    muted: 'var(--muted)',
    dim: 'var(--dim)',
    cyan: 'var(--cyan)',
    cyanSoft: 'var(--cyan-soft)',
    emerald: 'var(--emerald)',
    danger: 'var(--danger)',
    dangerSoft: 'rgba(239,68,68,0.2)'
  },
  radii: {
    xl: 'var(--radius-xl)',
    lg: 'var(--radius-lg)',
    md: 'var(--radius-md)',
    sm: 'var(--radius-sm)'
  },
  shadow: 'var(--shadow)',
  font: 'var(--font)',
  durations: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms'
  }
};

const SIZES = {
  small: { maxWidth: '400px' },
  medium: { maxWidth: '600px' },
  large: { maxWidth: '800px' },
  full: { maxWidth: '90vw' }
};

const BASE_MODAL_STYLES = `
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    opacity: 0;
    transition: opacity ${DESIGN_SYSTEM.durations.normal} ease-out;
  }
  
  .modal-overlay.active {
    opacity: 1;
  }
  
  .modal-content {
    position: relative;
    width: 90%;
    max-width: ${SIZES.medium.maxWidth};
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    border-radius: ${DESIGN_SYSTEM.radii.lg};
    border: 1px solid ${DESIGN_SYSTEM.colors.border};
    background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
    box-shadow: ${DESIGN_SYSTEM.shadow};
    font-family: ${DESIGN_SYSTEM.font};
    color: ${DESIGN_SYSTEM.colors.text};
    overflow: hidden;
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
    transition: all ${DESIGN_SYSTEM.durations.normal} ease-out;
  }
  
  .modal-overlay.active .modal-content {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  
  .modal-content.modal-small { max-width: ${SIZES.small.maxWidth}; }
  .modal-content.modal-medium { max-width: ${SIZES.medium.maxWidth}; }
  .modal-content.modal-large { max-width: ${SIZES.large.maxWidth}; }
  .modal-content.modal-full { max-width: ${SIZES.full.maxWidth}; width: ${SIZES.full.maxWidth}; }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 24px;
    border-bottom: 1px solid ${DESIGN_SYSTEM.colors.borderSoft};
    flex-shrink: 0;
  }
  
  .modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: ${DESIGN_SYSTEM.colors.text};
    letter-spacing: -0.01em;
  }
  
  .modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid ${DESIGN_SYSTEM.colors.border};
    border-radius: ${DESIGN_SYSTEM.radii.sm};
    background: ${DESIGN_SYSTEM.colors.panel};
    color: ${DESIGN_SYSTEM.colors.muted};
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    transition: all ${DESIGN_SYSTEM.durations.fast} ease;
  }
  
  .modal-close:hover {
    border-color: ${DESIGN_SYSTEM.colors.cyan};
    background: ${DESIGN_SYSTEM.colors.cyanSoft};
    color: ${DESIGN_SYSTEM.colors.cyan};
    transform: translateY(-1px);
  }
  
  .modal-body {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  
  .modal-body::-webkit-scrollbar {
    width: 6px;
  }
  
  .modal-body::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .modal-body::-webkit-scrollbar-thumb {
    background: ${DESIGN_SYSTEM.colors.border};
    border-radius: 3px;
  }
  
  .modal-body::-webkit-scrollbar-thumb:hover {
    background: ${DESIGN_SYSTEM.colors.muted};
  }
  
  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid ${DESIGN_SYSTEM.colors.borderSoft};
    background: ${DESIGN_SYSTEM.colors.panelSoft};
    flex-shrink: 0;
  }
  
  .modal-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: ${DESIGN_SYSTEM.radii.sm};
    font-family: ${DESIGN_SYSTEM.font};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all ${DESIGN_SYSTEM.durations.fast} ease;
    border: 1px solid transparent;
  }
  
  .modal-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${DESIGN_SYSTEM.colors.bg}, 0 0 0 4px ${DESIGN_SYSTEM.colors.cyan};
  }
  
  .modal-btn-primary {
    background: linear-gradient(135deg, ${DESIGN_SYSTEM.colors.cyan}, ${DESIGN_SYSTEM.colors.emerald});
    color: #03131a;
    border-color: transparent;
  }
  
  .modal-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(34,211,238,0.25);
  }
  
  .modal-btn-primary:active {
    transform: translateY(0);
  }
  
  .modal-btn-secondary {
    background: ${DESIGN_SYSTEM.colors.panel};
    color: ${DESIGN_SYSTEM.colors.text};
    border-color: ${DESIGN_SYSTEM.colors.border};
  }
  
  .modal-btn-secondary:hover {
    border-color: ${DESIGN_SYSTEM.colors.cyan};
    background: ${DESIGN_SYSTEM.colors.cyanSoft};
    color: ${DESIGN_SYSTEM.colors.cyan};
    transform: translateY(-1px);
  }
  
  .modal-btn-danger {
    background: ${DESIGN_SYSTEM.colors.dangerSoft};
    color: ${DESIGN_SYSTEM.colors.danger};
    border-color: rgba(239,68,68,0.3);
  }
  
  .modal-btn-danger:hover {
    background: ${DESIGN_SYSTEM.colors.danger};
    color: white;
    transform: translateY(-1px);
  }
  
  .modal-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
  
  /* Loading State */
  .modal-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 48px 24px;
  }
  
  .modal-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid ${DESIGN_SYSTEM.colors.border};
    border-top-color: ${DESIGN_SYSTEM.colors.cyan};
    border-radius: 50%;
    animation: modal-spin 0.8s linear infinite;
  }
  
  @keyframes modal-spin {
    to { transform: rotate(360deg); }
  }
  
  .modal-loading-text {
    font-size: 14px;
    color: ${DESIGN_SYSTEM.colors.muted};
  }
  
  /* Error State */
  .modal-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 24px;
    text-align: center;
  }
  
  .modal-error-icon {
    font-size: 48px;
  }
  
  .modal-error-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: ${DESIGN_SYSTEM.colors.danger};
  }
  
  .modal-error-message {
    margin: 0;
    font-size: 14px;
    color: ${DESIGN_SYSTEM.colors.muted};
    max-width: 300px;
  }
  
  .modal-error-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }
  
  /* Responsive */
  @media (max-width: 640px) {
    .modal-overlay {
      padding: 12px;
      align-items: flex-end;
    }
    
    .modal-content {
      width: 100%;
      max-width: 100%;
      border-radius: ${DESIGN_SYSTEM.radii.lg} ${DESIGN_SYSTEM.radii.lg} 0 0;
      max-height: 85vh;
    }
    
    .modal-content.modal-full {
      border-radius: 0;
      max-height: 100vh;
      height: 100vh;
    }
    
    .modal-header {
      padding: 16px 20px;
    }
    
    .modal-body {
      padding: 20px;
    }
    
    .modal-footer {
      padding: 12px 20px;
      flex-wrap: wrap;
    }
    
    .modal-btn {
      flex: 1;
      min-width: 100px;
    }
  }
`;

let stylesInjected = false;
let modalStylesInjected = false;

async function injectStyles() {
  if (stylesInjected) return;
  
  const styleEl = document.createElement('style');
  styleEl.id = 'base-modal-styles';
  styleEl.textContent = BASE_MODAL_STYLES;
  document.head.appendChild(styleEl);
  stylesInjected = true;
  
  if (!modalStylesInjected) {
    try {
      const response = await fetch('./modal-styles.css');
      const css = await response.text();
      const modalStyleEl = document.createElement('style');
      modalStyleEl.id = 'modal-component-styles';
      modalStyleEl.textContent = css;
      document.head.appendChild(modalStyleEl);
      modalStylesInjected = true;
    } catch (e) {
      console.warn('Could not load modal component styles');
    }
  }
}

export class BaseModal {
  static SIZES = SIZES;
  static DESIGN_SYSTEM = DESIGN_SYSTEM;

  constructor(options = {}) {
    this.id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.title = options.title || 'Modal';
    this.size = options.size || 'medium';
    this.closable = options.closable !== false;
    this.closeOnEscape = options.closeOnEscape !== false;
    this.closeOnBackdrop = options.closeOnBackdrop !== false;
    this.showFooter = options.showFooter !== false;
    this.footerContent = options.footerContent || null;
    this.onOpen = options.onOpen || (() => {});
    this.onClose = options.onClose || (() => {});
    this.onConfirm = options.onConfirm || (() => {});
    this.onCancel = options.onCancel || (() => {});
    
    this.state = 'closed';
    this.loading = options.loading || false;
    this.error = options.error || null;
    this.errorMessage = options.errorMessage || 'Something went wrong';
    
    this.overlay = null;
    this.content = null;
    this.previousActiveElement = null;
    this.focusableElements = [];
    this.boundHandlers = {};
  }

  static small(content, options = {}) {
    return new ConfirmModal({ ...options, size: 'small', content });
  }

  static medium(content, options = {}) {
    return new ConfirmModal({ ...options, size: 'medium', content });
  }

  static large(content, options = {}) {
    return new ConfirmModal({ ...options, size: 'large', content });
  }

  static alert(message, options = {}) {
    return new Promise((resolve) => {
      const modal = new ConfirmModal({
        title: options.title || 'Alert',
        content: `<p style="margin:0;font-size:15px;color:${DESIGN_SYSTEM.colors.text};line-height:1.5;">${message}</p>`,
        confirmText: options.confirmText || 'OK',
        cancelText: null,
        size: 'small',
        ...options,
        onConfirm: () => { resolve(true); modal.close(); },
        onCancel: () => { resolve(true); modal.close(); }
      });
      modal.open();
    });
  }

  static confirm(message, options = {}) {
    return new Promise((resolve) => {
      const modal = new ConfirmModal({
        title: options.title || 'Confirm',
        content: `<p style="margin:0;font-size:15px;color:${DESIGN_SYSTEM.colors.text};line-height:1.5;">${message}</p>`,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        size: 'small',
        ...options,
        onConfirm: () => { resolve(true); modal.close(); },
        onCancel: () => { resolve(false); modal.close(); }
      });
      modal.open();
    });
  }

  static prompt(question, defaultValue = '', options = {}) {
    return new Promise((resolve) => {
      const inputId = `prompt-input-${Date.now()}`;
      const modal = new ConfirmModal({
        title: options.title || 'Input',
        content: `
          <p style="margin:0 0 12px;font-size:14px;color:${DESIGN_SYSTEM.colors.muted};line-height:1.4;">${question}</p>
          <input 
            id="${inputId}" 
            type="${options.type || 'text'}" 
            value="${defaultValue}" 
            placeholder="${options.placeholder || ''}"
            style="
              width:100%;
              padding:12px 14px;
              border-radius:${DESIGN_SYSTEM.radii.sm};
              border:1px solid ${DESIGN_SYSTEM.colors.border};
              background:rgba(0,0,0,0.4);
              color:${DESIGN_SYSTEM.colors.text};
              font-size:14px;
              font-family:${DESIGN_SYSTEM.font};
              outline:none;
              transition:border-color ${DESIGN_SYSTEM.durations.fast} ease;
            "
            onfocus="this.style.borderColor='${DESIGN_SYSTEM.colors.cyan}'"
            onblur="this.style.borderColor='${DESIGN_SYSTEM.colors.border}'"
          />
        `,
        confirmText: options.confirmText || 'Submit',
        cancelText: options.cancelText || 'Cancel',
        size: 'small',
        ...options,
        onConfirm: () => {
          const input = document.getElementById(inputId);
          resolve(input ? input.value : '');
          modal.close();
        },
        onCancel: () => { resolve(null); modal.close(); }
      });
      modal.open();
      
      setTimeout(() => {
        const input = document.getElementById(inputId);
        if (input) input.focus();
      }, 100);
    });
  }

  open() {
    if (this.state === 'open') return;
    
    injectStyles();
    this.previousActiveElement = document.activeElement;
    this.state = 'opening';
    this.render();
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    this.state = 'open';
    this.setupAccessibility();
    this.setupEventListeners();
    this.animateIn();
    this.onOpen();
  }

  close() {
    if (this.state !== 'open') return;
    this.state = 'closing';
    this.animateOut();
    
    setTimeout(() => {
      this.destroy();
      this.state = 'closed';
      this.onClose();
    }, DESIGN_SYSTEM.durations.normal === '200ms' ? 200 : 300);
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    this.removeEventListeners();
    this.restoreFocus();
  }

  render() {
    const content = this.error ? this.renderError() : this.loading ? this.renderLoading() : this.renderBody();
    
    const footer = this.showFooter ? `
      <div class="modal-footer">
        ${this.footerContent || this.renderFooter()}
      </div>
    ` : '';

    this.overlay = createElementFromHTML(`
      <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-${this.id}">
        <div class="modal-content modal-${this.size}" role="document">
          <div class="modal-header">
            <h2 class="modal-title" id="modal-title-${this.id}">${this.title}</h2>
            ${this.closable ? `
              <button class="modal-close" aria-label="Close modal">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M1 1l12 12M13 1L1 13"/>
                </svg>
              </button>
            ` : ''}
          </div>
          <div class="modal-body">
            ${content}
          </div>
          ${footer}
        </div>
      </div>
    `);

    document.body.appendChild(this.overlay);
    this.content = this.overlay.querySelector('.modal-content');
  }

  renderBody() {
    return '<div class="modal-placeholder">Modal content goes here</div>';
  }

  renderLoading() {
    return `
      <div class="modal-loading">
        <div class="modal-spinner"></div>
        <span class="modal-loading-text">Loading...</span>
      </div>
    `;
  }

  renderError() {
    return `
      <div class="modal-error">
        <span class="modal-error-icon">⚠️</span>
        <h3 class="modal-error-title">Error</h3>
        <p class="modal-error-message">${this.errorMessage}</p>
        <div class="modal-error-actions">
          <button class="modal-btn modal-btn-secondary modal-retry">Try Again</button>
          <button class="modal-btn modal-btn-danger modal-dismiss">Dismiss</button>
        </div>
      </div>
    `;
  }

  renderFooter() {
    return `
      <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
      <button class="modal-btn modal-btn-primary modal-confirm">Confirm</button>
    `;
  }

  animateIn() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.overlay) {
          this.overlay.classList.add('active');
        }
      });
    });
  }

  animateOut() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
  }

  setupAccessibility() {
    if (!this.content) return;

    this.focusableElements = Array.from(
      this.content.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.disabled);

    if (this.focusableElements.length > 0) {
      setTimeout(() => this.focusableElements[0].focus(), 50);
    }

    this.boundHandlers.keydown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.boundHandlers.keydown);
  }

  handleKeyDown(e) {
    if (e.key === 'Escape' && this.closable && this.closeOnEscape) {
      e.preventDefault();
      this.close();
      return;
    }

    if (e.key === 'Tab') {
      this.handleTabNavigation(e);
    }
  }

  handleTabNavigation(e) {
    if (this.focusableElements.length === 0) return;

    const first = this.focusableElements[0];
    const last = this.focusableElements[this.focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  setupEventListeners() {
    if (!this.overlay) return;

    this.boundHandlers.closeBtn = () => this.close();
    const closeBtn = this.overlay.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', this.boundHandlers.closeBtn);
    }

    if (this.closeOnBackdrop) {
      this.boundHandlers.backdrop = (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      };
      this.overlay.addEventListener('click', this.boundHandlers.backdrop);
    }

    this.boundHandlers.confirm = () => {
      this.onConfirm();
      this.close();
    };
    const confirmBtn = this.overlay.querySelector('.modal-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', this.boundHandlers.confirm);
    }

    this.boundHandlers.cancel = () => {
      this.onCancel();
      this.close();
    };
    const cancelBtn = this.overlay.querySelector('.modal-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', this.boundHandlers.cancel);
    }

    const retryBtn = this.overlay.querySelector('.modal-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.error = null;
        this.updateBody(this.renderBody());
      });
    }

    const dismissBtn = this.overlay.querySelector('.modal-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => this.close());
    }
  }

  removeEventListeners() {
    if (this.boundHandlers.keydown) {
      document.removeEventListener('keydown', this.boundHandlers.keydown);
    }
    
    const closeBtn = this.overlay?.querySelector('.modal-close');
    if (closeBtn && this.boundHandlers.closeBtn) {
      closeBtn.removeEventListener('click', this.boundHandlers.closeBtn);
    }

    const confirmBtn = this.overlay?.querySelector('.modal-confirm');
    if (confirmBtn && this.boundHandlers.confirm) {
      confirmBtn.removeEventListener('click', this.boundHandlers.confirm);
    }

    const cancelBtn = this.overlay?.querySelector('.modal-cancel');
    if (cancelBtn && this.boundHandlers.cancel) {
      cancelBtn.removeEventListener('click', this.boundHandlers.cancel);
    }

    this.boundHandlers = {};
  }

  restoreFocus() {
    if (this.previousActiveElement && this.previousActiveElement.focus) {
      this.previousActiveElement.focus();
    }
  }

  setLoading(loading) {
    this.loading = loading;
    this.updateBody(loading ? this.renderLoading() : this.renderBody());
  }

  setError(error, message = 'Something went wrong') {
    this.error = error;
    this.errorMessage = message;
    this.updateBody(this.renderError());
  }

  updateBody(content) {
    const body = this.overlay?.querySelector('.modal-body');
    if (body) {
      body.innerHTML = content;
      this.setupAccessibility();
      this.setupEventListeners();
    }
  }

  setTitle(title) {
    this.title = title;
    const titleEl = this.overlay?.querySelector('.modal-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }

  getBodyElement() {
    return this.overlay?.querySelector('.modal-body');
  }

  setBodyContent(html) {
    const body = this.getBodyElement();
    if (body) {
      body.innerHTML = html;
    }
  }
}

export class ConfirmModal extends BaseModal {
  constructor(options = {}) {
    super(options);
    this.content = options.content || '';
    this.confirmText = options.confirmText || 'Confirm';
    this.cancelText = options.cancelText !== undefined ? options.cancelText : 'Cancel';
    this.dangerous = options.dangerous || false;
  }

  renderBody() {
    return typeof this.content === 'function' ? this.content() : this.content;
  }

  renderFooter() {
    if (!this.cancelText) {
      return `<button class="modal-btn ${this.dangerous ? 'modal-btn-danger' : 'modal-btn-primary'} modal-confirm">${this.confirmText}</button>`;
    }
    return `
      ${this.cancelText ? `<button class="modal-btn modal-btn-secondary modal-cancel">${this.cancelText}</button>` : ''}
      <button class="modal-btn ${this.dangerous ? 'modal-btn-danger' : 'modal-btn-primary'} modal-confirm">${this.confirmText}</button>
`;
  }
}

export default BaseModal;
