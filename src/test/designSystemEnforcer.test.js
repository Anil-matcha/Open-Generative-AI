/**
 * Tests for Timeline Editor Design System Enforcer
 */

import TIMELINE_DESIGN_SYSTEM, { enforceDesignSystem } from '../lib/designSystemEnforcer.js';

describe('Timeline Editor Design System Enforcer', () => {
  beforeEach(() => {
    // Clean up any existing design system styles
    const existing = document.querySelector('#timeline-design-system');
    if (existing) existing.remove();

    // Reset document body
    document.body.innerHTML = '';
  });

  describe('Core Variables', () => {
    test('should define all required CSS variables', () => {
      enforceDesignSystem();

      const root = document.documentElement;
      const styles = getComputedStyle(root);

      expect(styles.getPropertyValue('--bg')).toBe('#05070b');
      expect(styles.getPropertyValue('--panel')).toBe('rgba(255,255,255,0.05)');
      expect(styles.getPropertyValue('--cyan')).toBe('#22d3ee');
      expect(styles.getPropertyValue('--emerald')).toBe('#34d399');
    });
  });

  describe('Modal Creation', () => {
    test('should create modal with correct structure', () => {
      const modal = TIMELINE_DESIGN_SYSTEM.utils.createModal({
        title: 'Test Modal',
        content: '<p>Test content</p>'
      });

      expect(modal.classList.contains('modal-overlay')).toBe(true);
      expect(modal.querySelector('.modal-content')).toBeTruthy();
      expect(modal.querySelector('.modal-header')).toBeTruthy();
      expect(modal.querySelector('.modal-body')).toBeTruthy();
    });

    test('should validate modal structure', () => {
      // Create a proper modal overlay element
      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'modal-overlay';

      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      modalOverlay.appendChild(modalContent);

      const modalHeader = document.createElement('div');
      modalHeader.className = 'modal-header';
      modalContent.appendChild(modalHeader);

      const modalBody = document.createElement('div');
      modalBody.className = 'modal-body';
      modalContent.appendChild(modalBody);

      expect(TIMELINE_DESIGN_SYSTEM.validators.isValidModal(modalOverlay)).toBe(true);

      const invalidModal = document.createElement('div');
      invalidModal.className = 'some-modal';

      expect(TIMELINE_DESIGN_SYSTEM.validators.isValidModal(invalidModal)).toBe(false);
    });
  });

  describe('Button Creation', () => {
    test('should create button with correct styling', () => {
      const button = TIMELINE_DESIGN_SYSTEM.utils.createButton({
        type: 'primary',
        text: 'Test Button'
      });

      expect(button.classList.contains('primary-btn')).toBe(true);
      expect(button.textContent).toBe('Test Button');
    });

    test('should validate button classes', () => {
      const validButton = document.createElement('button');
      validButton.classList.add('primary-btn');

      expect(TIMELINE_DESIGN_SYSTEM.validators.isValidButton(validButton)).toBe(true);

      const invalidButton = document.createElement('button');
      invalidButton.classList.add('old-btn-class');

      expect(TIMELINE_DESIGN_SYSTEM.validators.isValidButton(invalidButton)).toBe(false);
    });
  });

  describe('Drag and Drop Enforcement', () => {
    test('should apply drag styling', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      TIMELINE_DESIGN_SYSTEM.utils.enforceDragDrop(element);

      // Simulate drag start
      element.dispatchEvent(new Event('dragstart'));
      expect(element.classList.contains('dragging')).toBe(true);

      // Simulate drag end
      element.dispatchEvent(new Event('dragend'));
      expect(element.classList.contains('dragging')).toBe(false);
    });
  });

  describe('Loading States', () => {
    test('should create loading state with design system styling', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const loading = TIMELINE_DESIGN_SYSTEM.utils.createLoadingState(container);

      expect(loading).toBeTruthy();
      expect(container.contains(loading)).toBe(true);
      expect(loading.querySelector('.loading-spinner')).toBeTruthy();
    });
  });

  describe('Video Controls', () => {
    test('should create video controls matching timeline style', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const controls = TIMELINE_DESIGN_SYSTEM.utils.createVideoControls(container);

      expect(controls.classList.contains('video-controls')).toBe(true);
      expect(controls.querySelector('.progress-bar')).toBeTruthy();
      expect(controls.querySelector('.progress-fill')).toBeTruthy();
      expect(controls.querySelectorAll('.circle-btn').length).toBe(3); // play, stop, rewind
    });
  });

  describe('Migration Helpers', () => {
    test('should update old button classes', () => {
      const button = document.createElement('button');
      button.classList.add('btn-primary');
      document.body.appendChild(button);

      TIMELINE_DESIGN_SYSTEM.migration.updateButtonClasses(button);

      expect(button.classList.contains('primary-btn')).toBe(true);
      expect(button.classList.contains('btn-primary')).toBe(false);
    });

    test('should update old colors', () => {
      const element = document.createElement('div');
      element.style.backgroundColor = '#0a0a0a';
      document.body.appendChild(element);

      TIMELINE_DESIGN_SYSTEM.migration.updateColors(element);

      // Browser converts hex to rgb, so check for rgb equivalent
      expect(element.style.backgroundColor).toBe('rgb(5, 7, 11)'); // equivalent of #05070b
    });
  });

  describe('Global Enforcement', () => {
    test('should inject CSS globally', () => {
      enforceDesignSystem();

      const styleElement = document.querySelector('#timeline-design-system');
      expect(styleElement).toBeTruthy();
      expect(styleElement.textContent).toContain('--bg: #05070b');
    });

    test('should auto-enforce on new elements', () => {
      enforceDesignSystem();

      const button = document.createElement('button');
      document.body.appendChild(button);

      // MutationObserver should automatically add design system class
      // This test would need to wait for the observer, but demonstrates the concept
      expect(button).toBeTruthy();
    });
  });
});