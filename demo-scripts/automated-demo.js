// AI Video Agency Demo Automation Script
// Uses Playwright to automate feature demonstrations and capture screenshots

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class AIVideoAgencyDemo {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshotDir = 'demo-screenshots';
    this.demoSteps = [];
  }

  async initialize() {
    console.log('🚀 Initializing AI Video Agency Demo...');

    // Launch browser in headless mode for automation
    this.browser = await chromium.launch({
      headless: true, // Run headless for automation
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();

    // Set viewport for consistent screenshots
    await this.page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to the application
    console.log('📱 Navigating to AI Video Agency...');
    await this.page.goto('http://localhost:5173');

    // Wait for app to load
    await this.page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });

    console.log('✅ Demo environment ready!');
  }

  async takeScreenshot(stepName, description) {
    const timestamp = Date.now();
    const filename = `${stepName}-${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: true
    });

    this.demoSteps.push({
      step: stepName,
      description,
      screenshot: filename,
      timestamp: new Date().toISOString(),
      url: this.page.url()
    });

    console.log(`📸 Screenshot taken: ${filename} - ${description}`);
  }

  async demonstrateImageGeneration() {
    console.log('🎨 Demonstrating Image Generation Features...');

    // Navigate to Image section
    await this.page.click('text=Image');
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('image-generation-home', 'Image generation section loaded');

    // Try text-to-image
    await this.page.fill('[data-testid="prompt-input"]', 'A futuristic cityscape at sunset with flying cars');
    await this.page.selectOption('[data-testid="model-select"]', 'flux-dev');
    await this.page.click('[data-testid="generate-button"]');

    // Wait for generation to complete
    await this.page.waitForSelector('[data-testid="generated-image"]', { timeout: 30000 });
    await this.takeScreenshot('text-to-image-result', 'Text-to-image generation completed');

    // Try image-to-image
    await this.page.click('text=Image-to-Image');
    await this.page.setInputFiles('[data-testid="image-upload"]', 'path/to/sample/image.jpg');
    await this.page.fill('[data-testid="prompt-input"]', 'Transform this image into a cyberpunk style');
    await this.page.click('[data-testid="generate-button"]');

    await this.page.waitForSelector('[data-testid="generated-image"]', { timeout: 30000 });
    await this.takeScreenshot('image-to-image-result', 'Image-to-image transformation completed');
  }

  async demonstrateVideoGeneration() {
    console.log('🎬 Demonstrating Video Generation Features...');

    // Navigate to Video section
    await this.page.click('text=Video');
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('video-generation-home', 'Video generation section loaded');

    // Text-to-video
    await this.page.fill('[data-testid="video-prompt-input"]', 'A butterfly emerging from its chrysalis in slow motion');
    await this.page.selectOption('[data-testid="video-model-select"]', 'stability-ai');
    await this.page.click('[data-testid="generate-video-button"]');

    await this.page.waitForSelector('[data-testid="generated-video"]', { timeout: 60000 });
    await this.takeScreenshot('text-to-video-result', 'Text-to-video generation completed');
  }

  async demonstrateTimelineEditor() {
    console.log('🎥 Demonstrating Timeline Editor...');

    // Navigate to Timeline
    await this.page.click('text=Timeline');
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('timeline-editor-home', 'Timeline editor loaded');

    // Drag media to timeline
    const mediaItem = await this.page.locator('[data-testid="media-item"]').first();
    const timeline = await this.page.locator('[data-testid="timeline-track"]');

    await mediaItem.dragTo(timeline);
    await this.takeScreenshot('media-drag-to-timeline', 'Media dragged to timeline');

    // Demonstrate clip editing
    await this.page.click('[data-testid="timeline-clip"]');
    await this.page.drag('[data-testid="clip-resize-handle"]', { x: 50, y: 0 });
    await this.takeScreenshot('clip-editing', 'Clip resized in timeline');
  }

  async demonstrateAIStudios() {
    console.log('🎭 Demonstrating AI Studios...');

    // Character Studio
    await this.page.click('text=Character');
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('character-studio', 'Character creation studio');

    // Avatar Studio
    await this.page.click('text=Avatar');
    await this.takeScreenshot('avatar-studio', 'Talking avatar studio');

    // Audio Studio
    await this.page.click('text=Audio');
    await this.takeScreenshot('audio-studio', 'Voice generation and cloning studio');
  }

  async demonstrateAdvancedFeatures() {
    console.log('⚡ Demonstrating Advanced Features...');

    // Director Page
    await this.page.click('text=Director');
    await this.takeScreenshot('director-page', 'AI-powered video director');

    // Effects Studio
    await this.page.click('text=Effects');
    await this.takeScreenshot('effects-studio', 'Visual effects and color grading');

    // Cinema Studio
    await this.page.click('text=Cinema Studio');
    await this.takeScreenshot('cinema-studio', 'Cinematic presets and themes');
  }

  async generateDemoReport() {
    console.log('📊 Generating Demo Report...');

    const report = {
      title: 'AI Video Agency Demo Report',
      timestamp: new Date().toISOString(),
      totalSteps: this.demoSteps.length,
      steps: this.demoSteps,
      summary: {
        featuresDemonstrated: [
          'Image Generation (Text-to-Image, Image-to-Image)',
          'Video Generation (Text-to-Video)',
          'Timeline Editor (Drag & Drop, Clip Editing)',
          'AI Studios (Character, Avatar, Audio)',
          'Advanced Features (Director, Effects, Cinema)',
          'Media Library and Templates'
        ],
        screenshotsTaken: this.demoSteps.length,
        automationSuccessful: true
      }
    };

    fs.writeFileSync('demo-report.json', JSON.stringify(report, null, 2));
    console.log('✅ Demo report generated: demo-report.json');
  }

  async runFullDemo() {
    try {
      await this.initialize();

      // Run all demonstrations
      await this.demonstrateImageGeneration();
      await this.demonstrateVideoGeneration();
      await this.demonstrateTimelineEditor();
      await this.demonstrateAIStudios();
      await this.demonstrateAdvancedFeatures();

      // Generate report
      await this.generateDemoReport();

      console.log('🎉 Full demo completed successfully!');
      console.log(`📸 ${this.demoSteps.length} screenshots captured`);
      console.log('📊 Demo report generated');

    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Export for use in other scripts
module.exports = AIVideoAgencyDemo;

// Run demo if called directly
if (require.main === module) {
  const demo = new AIVideoAgencyDemo();
  demo.runFullDemo().catch(console.error);
}