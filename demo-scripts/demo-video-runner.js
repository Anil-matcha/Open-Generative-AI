#!/usr/bin/env node

// AI Video Agency Demo Video Runner
// Runs all demo tests and collects generated videos

import { execSync, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

class DemoVideoRunner {
  constructor() {
    this.demoDir = 'demo-output';
    this.videosDir = path.join(this.demoDir, 'videos');
    this.screenshotsDir = path.join(this.demoDir, 'screenshots');
    this.reportsDir = path.join(this.demoDir, 'reports');
  }

  async setup() {
    console.log('🎬 Setting up Demo Video Runner...');

    // Create directories
    await fs.mkdir(this.demoDir, { recursive: true });
    await fs.mkdir(this.videosDir, { recursive: true });
    await fs.mkdir(this.screenshotsDir, { recursive: true });
    await fs.mkdir(this.reportsDir, { recursive: true });

    console.log('✅ Demo directories created');
  }

  async startDevServer() {
    console.log('🚀 Starting development server...');

    // Start the dev server in background
    this.devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      detached: true
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('✅ Dev server started');
  }

  async runDemoTests() {
    console.log('🎯 Running demo tests...');

    try {
      // Run Playwright tests for demo project
      execSync('npx playwright test --project=demo-videos --output=./test-results/demo', {
        stdio: 'inherit',
        env: { ...process.env, DEMO_MODE: 'true' }
      });

      console.log('✅ Demo tests completed');
    } catch (error) {
      console.error('❌ Demo tests failed:', error.message);
      throw error;
    }
  }

  async collectVideos() {
    console.log('📹 Collecting demo videos...');

    try {
      // Playwright saves videos in test-results/demo-videos/
      const testResultsDir = 'test-results/demo-videos';

      // Copy videos to our demo output
      const videoFiles = await this.findFiles(testResultsDir, '.webm');

      for (const video of videoFiles) {
        const filename = path.basename(video);
        const dest = path.join(this.videosDir, filename);
        await fs.copyFile(video, dest);
        console.log(`📁 Collected video: ${filename}`);
      }

      console.log(`✅ Collected ${videoFiles.length} demo videos`);
    } catch (error) {
      console.error('❌ Video collection failed:', error.message);
    }
  }

  async collectScreenshots() {
    console.log('📸 Collecting demo screenshots...');

    try {
      // Copy screenshots from demo-screenshots to our output
      const screenshotFiles = await this.findFiles('demo-screenshots', '.png');

      for (const screenshot of screenshotFiles) {
        const filename = path.basename(screenshot);
        const dest = path.join(this.screenshotsDir, filename);
        await fs.copyFile(screenshot, dest);
        console.log(`📁 Collected screenshot: ${filename}`);
      }

      console.log(`✅ Collected ${screenshotFiles.length} demo screenshots`);
    } catch (error) {
      console.error('❌ Screenshot collection failed:', error.message);
    }
  }

  async generateReport() {
    console.log('📊 Generating demo report...');

    const videoFiles = await this.listFiles(this.videosDir);
    const screenshotFiles = await this.listFiles(this.screenshotsDir);

    const report = {
      title: 'AI Video Agency Demo Video Report',
      generated: new Date().toISOString(),
      summary: {
        totalVideos: videoFiles.length,
        totalScreenshots: screenshotFiles.length,
        featuresCovered: [
          'Runtime & App Setup',
          'Route Navigation & URL Handling',
          'App Shell Components',
          'Timeline Engine',
          'State Management',
          'Toolbar & Editing Controls',
          'Media Ingest',
          'Library & Asset Browsing',
          'Settings & Inspector'
          // Add remaining features as tests are created
        ]
      },
      videos: videoFiles.map(f => ({ filename: f, path: path.join(this.videosDir, f) })),
      screenshots: screenshotFiles.map(f => ({ filename: f, path: path.join(this.screenshotsDir, f) })),
      instructions: {
        viewVideos: `Open videos in ${this.videosDir}`,
        viewScreenshots: `Open screenshots in ${this.screenshotsDir}`,
        combineVideos: 'Use video editing software to combine clips in order'
      }
    };

    const reportPath = path.join(this.reportsDir, 'demo-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`✅ Demo report generated: ${reportPath}`);
  }

  async findFiles(dir, extension) {
    try {
      const files = await fs.readdir(dir, { recursive: true });
      return files.filter(file => file.endsWith(extension)).map(file => path.join(dir, file));
    } catch (error) {
      return [];
    }
  }

  async listFiles(dir) {
    try {
      return await fs.readdir(dir);
    } catch (error) {
      return [];
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');

    if (this.devServer) {
      process.kill(-this.devServer.pid);
    }

    // Clean up test results if needed
    // await fs.rm('test-results', { recursive: true, force: true });
  }

  async run() {
    try {
      await this.setup();
      await this.startDevServer();
      await this.runDemoTests();
      await this.collectVideos();
      await this.collectScreenshots();
      await this.generateReport();

      console.log('🎉 Demo video generation completed!');
      console.log(`📁 Demo output: ${this.demoDir}`);
      console.log(`📹 Videos: ${this.videosDir}`);
      console.log(`📸 Screenshots: ${this.screenshotsDir}`);

    } catch (error) {
      console.error('❌ Demo generation failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the demo runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new DemoVideoRunner();
  runner.run().catch(console.error);
}

export default DemoVideoRunner;