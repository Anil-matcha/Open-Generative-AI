// Modal Integration Test - Verify all modals are properly extracted and integrated
// This test ensures all 22 target modal components can be imported and instantiated

import { describe, test, expect } from 'vitest';
import { BaseModal } from './BaseModal';

// Import all modal components
import { AdvanceImageEditorModal } from './AdvanceImageEditorModal.jsx';
import { BillingModal } from './BillingModal.jsx';
import { ConnectModal } from './ConnectModal.jsx';
import { ContactImporterModal } from './ContactImporterModal.jsx';
import { EmailCampaignModal } from './EmailCampaignModal.jsx';
import { EndScreenModal } from './EndScreenModal.jsx';
import { EnhancedRecorderModal } from './EnhancedRecorderModal.jsx';
import { ImageCropperModal } from './ImageCropperModal.jsx';
import { ImglyImageEditorModal } from './ImglyImageEditorModal.jsx';
import { PageShotModal } from './PageShotModal.jsx';
import { PersonalizationModal } from './PersonalizationModal.jsx';
import { PreviewMediaModal } from './PreviewMediaModal.jsx';
import { RecorderModal } from './RecorderModal.jsx';
import { SaveProjectModal } from './SaveProjectModal.jsx';
import { SettingsModal } from './SettingsModal.jsx';
import { SocialPublisherModal } from './SocialPublisherModal.jsx';
import { TemplateGeneratorModal } from './TemplateGeneratorModal.jsx';
import { TemplatePreviewModal } from './TemplatePreviewModal.jsx';
import { TeleprompterModal } from './TeleprompterModal.jsx';
import { UrlVideoModal } from './UrlVideoModal.jsx';
import { VideoPlayerModal } from './VideoPlayerModal.jsx';
import { VoiceModal } from './VoiceModal.jsx';

const MODAL_COMPONENTS = [
  AdvanceImageEditorModal,
  BillingModal,
  ConnectModal,
  ContactImporterModal,
  EmailCampaignModal,
  EndScreenModal,
  EnhancedRecorderModal,
  ImageCropperModal,
  ImglyImageEditorModal,
  PageShotModal,
  PersonalizationModal,
  PreviewMediaModal,
  RecorderModal,
  SaveProjectModal,
  SettingsModal,
  SocialPublisherModal,
  TemplateGeneratorModal,
  TemplatePreviewModal,
  TeleprompterModal,
  UrlVideoModal,
  VideoPlayerModal,
  VoiceModal
];

describe('Modal Integration Tests', () => {
  test('All modal components can be imported and instantiated', () => {
    const results = {
      total: MODAL_COMPONENTS.length,
      passed: 0,
      failed: 0,
      errors: []
    };

    MODAL_COMPONENTS.forEach((ModalClass) => {
      try {
        // Test instantiation
        const modal = new ModalClass();

        // Verify it extends BaseModal
        expect(modal).toBeInstanceOf(BaseModal);

        // Verify required methods exist
        expect(typeof modal.renderBody).toBe('function');
        expect(typeof modal.open).toBe('function');
        expect(typeof modal.close).toBe('function');

        results.passed++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          modal: ModalClass.name,
          error: error.message
        });
      }
    });

    // Log results
    console.log(`📊 Results: ${results.passed}/${results.total} modals passed`);

    if (results.failed > 0) {
      console.error('❌ Integration test failed:', results.errors);
    } else {
      console.log('✅ All modal components successfully integrated!');
    }

    expect(results.failed).toBe(0);
    expect(results.passed).toBe(results.total);
  });

  test('All modal components have unique names', () => {
    const names = MODAL_COMPONENTS.map(ModalClass => ModalClass.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  test('BaseModal foundation is intact', () => {
    expect(BaseModal).toBeDefined();
    expect(BaseModal.SIZES).toBeDefined();
    expect(BaseModal.DESIGN_SYSTEM).toBeDefined();
  });

  test('Modal components render basic HTML structure', () => {
    // Test a few key modals for basic rendering
    const testModals = [SettingsModal, BillingModal, ConnectModal];

    testModals.forEach((ModalClass) => {
      const modal = new ModalClass();
      const bodyContent = modal.renderBody();

      // Verify renderBody returns a string (HTML)
      expect(typeof bodyContent).toBe('string');
      expect(bodyContent.length).toBeGreaterThan(0);

      // Verify modal has expected properties
      expect(modal.title).toBeDefined();
      expect(modal.size).toBeDefined();
    });
  });

  test('Modal components have proper state management', () => {
    const modal = new SettingsModal();

    // Test initial state
    expect(modal.state).toBe('closed');

    // Test state changes (without DOM)
    modal.state = 'opening';
    expect(modal.state).toBe('opening');

    modal.state = 'open';
    expect(modal.state).toBe('open');
  });

  test('Modal components handle options correctly', () => {
    const modal = new SettingsModal({
      title: 'Test Title',
      size: 'large',
      closable: false
    });

    expect(modal.title).toBe('Test Title');
    expect(modal.size).toBe('large');
    expect(modal.closable).toBe(false);
  });
});

// Export for use in main application
export { MODAL_COMPONENTS };