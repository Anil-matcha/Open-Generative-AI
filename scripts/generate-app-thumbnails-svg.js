#!/usr/bin/env node

/**
 * Generate Missing App Thumbnails (SVG Placeholders)
 *
 * Creates SVG placeholder thumbnails for Motion Controls, TikTok Carousel, and Advanced Dubbing apps
 * that match the visual style of existing app thumbnails.
 *
 * Run with: node scripts/generate-app-thumbnails-svg.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thumbnail definitions for missing apps
const THUMBNAIL_DEFINITIONS = [
  {
    id: 'runway-motion',
    name: 'Motion Controls',
    color1: '#6c5ce7',
    color2: '#a29bfe',
    icon: '🎬'
  },
  {
    id: 'tiktok-carousel',
    name: 'TikTok Carousel',
    color1: '#fd79a8',
    color2: '#e84393',
    icon: '📱'
  },
  {
    id: 'advanced-dubbing',
    name: 'Advanced Dubbing',
    color1: '#00cec9',
    color2: '#81ecec',
    icon: '🎤'
  }
];

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'thumbnails', 'studios');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate SVG thumbnail
function generateSvgThumbnail(app) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="grad_${app.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${app.color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${app.color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="640" height="360" rx="16" fill="url(#grad_${app.id})"/>
  <circle cx="320" cy="150" r="60" fill="#fff" opacity="0.9"/>
  <ellipse cx="320" cy="220" rx="80" ry="50" fill="#fff" opacity="0.7"/>
  <text x="320" y="300" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${app.icon}</text>
</svg>`;

  return svg;
}

// Main execution
function main() {
  console.log('🎨 SVG App Thumbnail Generator');
  console.log('==============================');
  console.log(`Generating ${THUMBNAIL_DEFINITIONS.length} thumbnails...`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log('');

  let successCount = 0;

  THUMBNAIL_DEFINITIONS.forEach((app, index) => {
    console.log(`[${index + 1}/${THUMBNAIL_DEFINITIONS.length}] ${app.name} (${app.id})`);

    try {
      const svgContent = generateSvgThumbnail(app);
      const outputPath = path.join(OUTPUT_DIR, `${app.id}.webp.png`);
      fs.writeFileSync(outputPath, svgContent);

      console.log(`  ✅ Created: ${outputPath}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error creating ${app.id}:`, error.message);
    }
  });

  console.log('');
  console.log('==============================');
  console.log('Generation complete!');
  console.log(`✅ Success: ${successCount}/${THUMBNAIL_DEFINITIONS.length}`);

  if (successCount === THUMBNAIL_DEFINITIONS.length) {
    console.log('');
    console.log('Next steps:');
    console.log('1. Run the development server: npm run dev');
    console.log('2. Visit http://localhost:5173/apps to see the new thumbnails');
    console.log('3. All AI Apps should now display their thumbnails');
  }
}

main();