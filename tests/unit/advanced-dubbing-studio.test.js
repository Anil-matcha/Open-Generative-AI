import { AdvancedDubbingStudio } from '../../src/components/AdvancedDubbingStudio.js';

describe('AdvancedDubbingStudio', () => {
  test('should create component with required sections', () => {
    const component = AdvancedDubbingStudio();

    // Check if component is created
    expect(component).toBeDefined();
    expect(component.tagName).toBe('DIV');
    expect(component.className).toContain('w-full');

    // Check for hero section
    const heroSection = component.querySelector('.animate-fade-in-up');
    expect(heroSection).toBeTruthy();

    // Check for main form card
    const formCard = component.querySelector('.bg-\\[\\#111\\]');
    expect(formCard).toBeTruthy();

    // Check for language selectors
    const sourceLangSelect = component.querySelector('select');
    expect(sourceLangSelect).toBeTruthy();

    // Check for voice section
    const voiceSection = component.querySelector('#voice-list');
    expect(voiceSection).toBeTruthy();

    // Check for quality controls
    const lipSyncSelect = component.querySelector('select[value="high"]');
    expect(lipSyncSelect).toBeTruthy();

    // Check for action buttons
    const translateBtn = component.querySelector('button');
    expect(translateBtn).toBeTruthy();
  });

  test('should have proper form structure', () => {
    const component = AdvancedDubbingStudio();

    // Check for video upload section
    const videoUploadSection = component.querySelector('label');
    expect(videoUploadSection).toBeTruthy();

    // Check for multiple language selects
    const selects = component.querySelectorAll('select');
    expect(selects.length).toBeGreaterThan(2); // Source, target, voice style, lip sync

    // Check for voice cloning toggle
    const voiceCloneToggle = component.querySelector('button');
    expect(voiceCloneToggle).toBeTruthy();
  });

  test('should initialize with default values', () => {
    const component = AdvancedDubbingStudio();

    // Check default language selections
    const selects = component.querySelectorAll('select');
    expect(selects[0].value).toBe('en'); // Source language
    expect(selects[1].value).toBe('es'); // Target language
  });

  test('should have preview and action functionality', () => {
    const component = AdvancedDubbingStudio();

    // Check for preview button
    const previewBtn = component.querySelector('button');
    expect(previewBtn.textContent).toContain('Preview');

    // Check for translate and dub buttons
    const actionButtons = component.querySelectorAll('button');
    const translateBtn = Array.from(actionButtons).find(btn => btn.textContent.includes('Translate Only'));
    const dubBtn = Array.from(actionButtons).find(btn => btn.textContent.includes('Translate & Dub'));

    expect(translateBtn).toBeTruthy();
    expect(dubBtn).toBeTruthy();
  });
});