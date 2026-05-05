#!/usr/bin/env node

/**
 * Generate AI-Style SVG Thumbnails for All Apps
 *
 * Creates cinematic SVG thumbnails for all apps with professional design
 * that mimics AI-generated thumbnail aesthetics.
 *
 * Run with: node scripts/generate-all-app-thumbnails-svg.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Comprehensive thumbnail definitions with cinematic color schemes
const THUMBNAIL_DEFINITIONS = {
  // Core Studios - Vibrant professional colors
  image: {
    name: 'Image Studio',
    colors: ['#667eea', '#764ba2'],
    icon: '🎨'
  },
  video: {
    name: 'Video Studio',
    colors: ['#f093fb', '#f5576c'],
    icon: '🎬'
  },
  cinema: {
    name: 'Cinema Studio',
    colors: ['#4facfe', '#00f2fe'],
    icon: '🎥'
  },

  // Tools & Editors - Professional tech colors
  storyboard: {
    name: 'Storyboard Studio',
    colors: ['#43e97b', '#38f9d7'],
    icon: '📋'
  },
  effects: {
    name: 'Effects Studio',
    colors: ['#fa709a', '#fee140'],
    icon: '✨'
  },
  edit: {
    name: 'Edit Studio',
    colors: ['#a8edea', '#fed6e3'],
    icon: '✂️'
  },
  upscale: {
    name: 'Upscale Suite',
    colors: ['#ff9a9e', '#fecfef'],
    icon: '🔍'
  },
  character: {
    name: 'Character Studio',
    colors: ['#ffecd2', '#fcb69f'],
    icon: '🧑'
  },
  commercial: {
    name: 'Commercial Studio',
    colors: ['#a8c0ff', '#3f2b96'],
    icon: '💼'
  },

  // AI Apps - Futuristic AI colors
  audio: {
    name: 'Audio Studio',
    colors: ['#667eea', '#764ba2'],
    icon: '🎵'
  },
  avatar: {
    name: 'Avatar Studio',
    colors: ['#f093fb', '#f5576c'],
    icon: '👤'
  },
  training: {
    name: 'Training Studio',
    colors: ['#4facfe', '#00f2fe'],
    icon: '🏋️'
  },
  videotools: {
    name: 'Video Tools',
    colors: ['#43e97b', '#38f9d7'],
    icon: '🔧'
  },
  chat: {
    name: 'Chat Studio',
    colors: ['#fa709a', '#fee140'],
    icon: '💬'
  },
  'runway-motion': {
    name: 'Motion Controls',
    colors: ['#a8edea', '#fed6e3'],
    icon: '🎬'
  },
  'tiktok-carousel': {
    name: 'TikTok Carousel',
    colors: ['#ff9a9e', '#fecfef'],
    icon: '📱'
  },
  'advanced-dubbing': {
    name: 'Advanced Dubbing',
    colors: ['#ffecd2', '#fcb69f'],
    icon: '🎤'
  }
};

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'thumbnails', 'studios');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate cinematic SVG thumbnail
function generateCinematicSvgThumbnail(appId, app) {
  // Create a more sophisticated cinematic design with gradients and effects
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="grad_${appId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${app.colors[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${app.colors[1]};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="shine_${appId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.3" />
      <stop offset="50%" style="stop-color:#ffffff;stop-opacity:0" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.1" />
    </linearGradient>
    <filter id="glow_${appId}">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Main background -->
  <rect width="640" height="360" rx="24" fill="url(#grad_${appId})"/>

  <!-- Subtle shine effect -->
  <rect width="640" height="360" rx="24" fill="url(#shine_${appId})"/>

  <!-- Central icon area with glow -->
  <circle cx="320" cy="160" r="80" fill="#ffffff" opacity="0.95" filter="url(#glow_${appId})"/>
  <circle cx="320" cy="160" r="75" fill="#ffffff" opacity="0.9"/>

  <!-- Icon -->
  <text x="320" y="185" text-anchor="middle" fill="${app.colors[0]}" font-family="Arial, sans-serif" font-size="48" font-weight="bold">${app.icon}</text>

  <!-- Decorative elements -->
  <circle cx="120" cy="80" r="20" fill="#ffffff" opacity="0.6"/>
  <circle cx="520" cy="60" r="15" fill="#ffffff" opacity="0.4"/>
  <circle cx="580" cy="280" r="25" fill="#ffffff" opacity="0.3"/>
  <circle cx="60" cy="300" r="18" fill="#ffffff" opacity="0.5"/>

  <!-- Subtle geometric shapes -->
  <rect x="50" y="50" width="40" height="4" rx="2" fill="#ffffff" opacity="0.3"/>
  <rect x="550" y="200" width="30" height="4" rx="2" fill="#ffffff" opacity="0.4"/>
  <rect x="100" y="280" width="35" height="4" rx="2" fill="#ffffff" opacity="0.25"/>
</svg>`;

  return svg;
}

// Main execution
function main() {
  console.log('🎨 Cinematic SVG App Thumbnail Generator');
  console.log('======================================');
  console.log(`Generating ${Object.keys(THUMBNAIL_DEFINITIONS).length} professional thumbnails...`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log('');

  let successCount = 0;
  const appIds = Object.keys(THUMBNAIL_DEFINITIONS);

  appIds.forEach((appId, index) => {
    const app = THUMBNAIL_DEFINITIONS[appId];

    console.log(`[${index + 1}/${appIds.length}] ${app.name} (${appId})`);

    try {
      const svgContent = generateCinematicSvgThumbnail(appId, app);
      const outputPath = path.join(OUTPUT_DIR, `${appId}.webp.png`);
      fs.writeFileSync(outputPath, svgContent);

      console.log(`  ✅ Created: ${outputPath}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error creating ${appId}:`, error.message);
    }
  });

  console.log('');
  console.log('======================================');
  console.log('Generation complete!');
  console.log(`✅ Success: ${successCount}/${appIds.length}`);

  if (successCount === appIds.length) {
    console.log('');
    console.log('Next steps:');
    console.log('1. Run the development server: npm run dev');
    console.log('2. Visit http://localhost:5173/apps to see the cinematic thumbnails');
    console.log('3. All apps now have professional, consistent thumbnail designs');
    console.log('4. Replace with AI-generated images when API keys are available');
  }
}

main();