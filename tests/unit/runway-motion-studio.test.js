import { RunwayMotionStudio } from '../src/components/RunwayMotionStudio.js';

describe('RunwayMotionStudio', () => {
  test('should create component with required sections', () => {
    const component = RunwayMotionStudio();

    // Check if component is created
    expect(component).toBeDefined();
    expect(component.tagName).toBe('DIV');
    expect(component.className).toContain('w-full');

    // Check for main sections
    const heroSection = component.querySelector('.animate-fade-in-up');
    expect(heroSection).toBeTruthy();

    // Check for upload section
    const uploadSection = component.querySelector('h2');
    expect(uploadSection).toBeTruthy();

    // Check for motion controls section
    const controlsSection = component.querySelector('#motion-controls-section');
    expect(controlsSection).toBeTruthy();

    // Check for preview section
    const previewSection = component.querySelector('#preview-video-container');
    expect(previewSection).toBeTruthy();
  });

  test('should have motion type buttons', () => {
    const component = RunwayMotionStudio();

    const motionButtons = component.querySelectorAll('.motion-type-btn');
    expect(motionButtons.length).toBe(5); // zoom, spin, shake, orbit, pan

    const buttonTexts = Array.from(motionButtons).map(btn =>
      btn.querySelector('.text-sm').textContent
    );
    expect(buttonTexts).toContain('Zoom');
    expect(buttonTexts).toContain('Spin');
    expect(buttonTexts).toContain('Shake');
    expect(buttonTexts).toContain('Orbit');
    expect(buttonTexts).toContain('Pan');
  });

  test('should have parameter controls', () => {
    const component = RunwayMotionStudio();

    const speedSlider = component.querySelector('#speed-slider');
    const intensitySlider = component.querySelector('#intensity-slider');
    const blurToggle = component.querySelector('#blur-toggle');
    const stabilizationToggle = component.querySelector('#stabilization-toggle');

    expect(speedSlider).toBeTruthy();
    expect(intensitySlider).toBeTruthy();
    expect(blurToggle).toBeTruthy();
    expect(stabilizationToggle).toBeTruthy();
  });

  test('should have preview and generate functionality', () => {
    const component = RunwayMotionStudio();

    const previewBtn = component.querySelector('#preview-btn');
    const generateBtn = component.querySelector('button:last-child');

    expect(previewBtn).toBeTruthy();
    expect(generateBtn).toBeTruthy();
    expect(previewBtn.disabled).toBe(true); // Should be disabled initially
    expect(generateBtn.disabled).toBe(true); // Should be disabled initially
  });
});