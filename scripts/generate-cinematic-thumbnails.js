/**
 * Canvas-based Thumbnail Generator
 * Creates cinematic thumbnails matching the "Centered Luminance" design philosophy
 * Uses Node.js canvas to generate PNG files
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../public/thumbnails/studios');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const APPS = [
  {
    id: 'ai-headshot-studio',
    name: 'AI Headshot Studio',
    icon: '👤',
    primaryColor: '#1a365d',
    accentColor: '#3182ce',
    description: 'Professional Headshots'
  },
  {
    id: 'unified-studio',
    name: 'Unified Studio',
    icon: '✨',
    primaryColor: '#2d1b4e',
    accentColor: '#805ad5',
    description: 'All Creative Tools'
  },
  {
    id: 'workflow-builder',
    name: 'Workflow Builder',
    icon: '🔗',
    primaryColor: '#0d3d56',
    accentColor: '#319795',
    description: 'AI Pipelines'
  },
  {
    id: 'ai-agent',
    name: 'AI Agent',
    icon: '🤖',
    primaryColor: '#1a202c',
    accentColor: '#d69e2e',
    description: 'Intelligent Assistant'
  },
  {
    id: 'design-agent',
    name: 'Design Agent',
    icon: '🎨',
    primaryColor: '#3c2a4d',
    accentColor: '#d53f8c',
    description: 'Creative Assistant'
  },
  {
    id: 'marketing-studio',
    name: 'Marketing Studio',
    icon: '📈',
    primaryColor: '#1a3c34',
    accentColor: '#38a169',
    description: 'Brand Campaigns'
  },
  {
    id: 'apps-studio',
    name: 'Apps Studio',
    icon: '📱',
    primaryColor: '#1a2a4a',
    accentColor: '#5a67d8',
    description: 'Creative Gallery'
  }
];

/**
 * Creates a cinematic thumbnail following the "Centered Luminance" philosophy
 * - Centered subject with architectural precision
 * - Deep, atmospheric dark backgrounds
 * - Sculpted lighting with key, rim, and fill
 * - Restrained sophisticated color palette
 * - 16:9 cinematic aspect ratio
 */
function createCinematicThumbnail(app) {
  const width = 640;
  const height = 360;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Create deep atmospheric background gradient (charcoal to midnight)
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#0a0a0f');
  bgGradient.addColorStop(0.3, app.primaryColor);
  bgGradient.addColorStop(0.7, app.primaryColor);
  bgGradient.addColorStop(1, '#050508');

  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Add subtle atmospheric depth with radial gradient
  const atmosphereGradient = ctx.createRadialGradient(
    width / 2, height / 2, 50,
    width / 2, height / 2, 400
  );
  atmosphereGradient.addColorStop(0, 'rgba(0,0,0,0)');
  atmosphereGradient.addColorStop(1, 'rgba(0,0,0,0.6)');

  ctx.fillStyle = atmosphereGradient;
  ctx.fillRect(0, 0, width, height);

  // Create the central luminous orb (representing the subject)
  const centerX = width / 2;
  const centerY = height / 2 - 20;

  // Outer glow (rim lighting effect)
  const outerGlow = ctx.createRadialGradient(
    centerX, centerY, 60,
    centerX, centerY, 140
  );
  outerGlow.addColorStop(0, app.accentColor + '40');
  outerGlow.addColorStop(0.5, app.accentColor + '20');
  outerGlow.addColorStop(1, 'transparent');

  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 140, 0, Math.PI * 2);
  ctx.fill();

  // Main central form (the subject)
  const mainGradient = ctx.createRadialGradient(
    centerX - 20, centerY - 20, 20,
    centerX, centerY, 70
  );
  mainGradient.addColorStop(0, '#ffffff');
  mainGradient.addColorStop(0.3, '#f0f0f5');
  mainGradient.addColorStop(0.6, app.accentColor);
  mainGradient.addColorStop(1, app.primaryColor);

  ctx.fillStyle = mainGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
  ctx.fill();

  // Inner highlight (key light reflection)
  const highlightGradient = ctx.createRadialGradient(
    centerX - 25, centerY - 25, 5,
    centerX - 15, centerY - 15, 35
  );
  highlightGradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  highlightGradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  highlightGradient.addColorStop(1, 'transparent');

  ctx.fillStyle = highlightGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
  ctx.fill();

  // Subtle geometric accent elements (architectural framing)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;

  // Top left corner accent
  ctx.beginPath();
  ctx.moveTo(40, 40);
  ctx.lineTo(80, 40);
  ctx.moveTo(40, 40);
  ctx.lineTo(40, 80);
  ctx.stroke();

  // Bottom right corner accent
  ctx.beginPath();
  ctx.moveTo(width - 40, height - 40);
  ctx.lineTo(width - 80, height - 40);
  ctx.moveTo(width - 40, height - 40);
  ctx.lineTo(width - 40, height - 80);
  ctx.stroke();

  // Add the icon/symbol in the center
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(app.icon, centerX, centerY);

  // Add subtle bottom label
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText(app.description.toUpperCase(), centerX, height - 35);

  // Add fine grain texture for cinematic quality
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillRect(x, y, 1, 1);
  }

  // Save as PNG
  const outputPath = path.join(OUTPUT_DIR, `${app.id}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Created: ${app.name} (${app.id}.png)`);

  return outputPath;
}

// Main execution
console.log('🎨 Cinematic Thumbnail Generator');
console.log('================================');
console.log('Following "Centered Luminance" Design Philosophy');
console.log('');

APPS.forEach(app => {
  createCinematicThumbnail(app);
});

console.log('');
console.log('================================');
console.log('All thumbnails generated successfully!');
console.log(`Output: ${OUTPUT_DIR}`);
