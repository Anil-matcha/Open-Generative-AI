/**
 * Pure JavaScript PNG Thumbnail Generator
 * Creates professional cinematic thumbnails without external dependencies
 * Following the "Centered Luminance" design philosophy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../public/thumbnails/studios');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const APPS = [
  { id: 'ai-headshot-studio', name: 'AI Headshot Studio', icon: '👤', bg: [26, 54, 93], accent: [49, 130, 206] },
  { id: 'unified-studio', name: 'Unified Studio', icon: '✨', bg: [45, 27, 78], accent: [128, 90, 213] },
  { id: 'workflow-builder', name: 'Workflow Builder', icon: '🔗', bg: [13, 61, 86], accent: [49, 151, 149] },
  { id: 'ai-agent', name: 'AI Agent', icon: '🤖', bg: [26, 32, 44], accent: [214, 158, 46] },
  { id: 'design-agent', name: 'Design Agent', icon: '🎨', bg: [60, 42, 77], accent: [213, 63, 140] },
  { id: 'marketing-studio', name: 'Marketing Studio', icon: '📈', bg: [26, 60, 52], accent: [56, 161, 105] },
  { id: 'apps-studio', name: 'Apps Studio', icon: '📱', bg: [26, 42, 74], accent: [90, 103, 216] }
];

function createPNG(width, height, drawFn) {
  const imageData = new Uint8Array(width * height * 4);

  // Initialize with transparent
  for (let i = 0; i < imageData.length; i += 4) {
    imageData[i] = 0;     // R
    imageData[i + 1] = 0; // G
    imageData[i + 2] = 0; // B
    imageData[i + 3] = 255; // A
  }

  drawFn(imageData, width, height);

  // Create PNG
  const crc32 = (buf) => {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };

  const chunks = [];

  // PNG signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 1);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdr]));
  chunks.push(Buffer.from([0, 0, 0, 13]));
  chunks.push(Buffer.from('IHDR'));
  chunks.push(ihdr);
  chunks.push(Buffer.alloc(4));
  chunks[chunks.length - 1].writeUInt32BE(ihdrCrc, 0);

  // IDAT (compressed image data)
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (width * 4 + 1) + 1 + x * 4;
      rawData[dstIdx] = imageData[srcIdx];
      rawData[dstIdx + 1] = imageData[srcIdx + 1];
      rawData[dstIdx + 2] = imageData[srcIdx + 2];
      rawData[dstIdx + 3] = imageData[srcIdx + 3];
    }
  }

  const compressed = deflateSync(rawData, { level: 9 });
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), compressed]));
  chunks.push(Buffer.alloc(4));
  chunks[chunks.length - 1].writeUInt32BE(compressed.length, 0);
  chunks.push(Buffer.from('IDAT'));
  chunks.push(compressed);
  chunks.push(Buffer.alloc(4));
  chunks[chunks.length - 1].writeUInt32BE(idatCrc, 0);

  // IEND
  const iendCrc = crc32(Buffer.from('IEND'));
  chunks.push(Buffer.from([0, 0, 0, 0]));
  chunks.push(Buffer.from('IEND'));
  chunks.push(Buffer.alloc(4));
  chunks[chunks.length - 1].writeUInt32BE(iendCrc, 0);

  return Buffer.concat(chunks);
}

function drawCinematicThumbnail(imageData, width, height, app) {
  const [bgR, bgG, bgB] = app.bg;
  const [accentR, accentG, accentB] = app.accent;

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2) - 10;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Create gradient background
      const gradientFactor = y / height;
      const radialDist = Math.sqrt(
        Math.pow((x - centerX) / width, 2) +
        Math.pow((y - centerY) / height, 2)
      );

      let r = Math.floor(bgR * (1 - gradientFactor * 0.3) + bgR * 0.5 * gradientFactor);
      let g = Math.floor(bgG * (1 - gradientFactor * 0.3) + bgG * 0.5 * gradientFactor);
      let b = Math.floor(bgB * (1 - gradientFactor * 0.3) + bgB * 0.5 * gradientFactor);

      // Add atmospheric depth
      const depth = Math.max(0, 1 - radialDist * 0.8);
      r = Math.floor(r * depth + r * 0.3 * (1 - depth));
      g = Math.floor(g * depth + g * 0.3 * (1 - depth));
      b = Math.floor(b * depth + b * 0.3 * (1 - depth));

      // Draw central luminous orb
      const distToCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      if (distToCenter < 80) {
        const orbFactor = 1 - (distToCenter / 80);
        const highlight = orbFactor * orbFactor;

        // Main orb with gradient
        r = Math.floor(r * (1 - highlight) + 255 * highlight * 0.9);
        g = Math.floor(g * (1 - highlight) + 255 * highlight * 0.9);
        b = Math.floor(b * (1 - highlight) + 255 * highlight * 0.9);

        // Accent color tint
        if (distToCenter < 60) {
          const accentFactor = (60 - distToCenter) / 60;
          r = Math.floor(r * (1 - accentFactor * 0.3) + accentR * accentFactor * 0.7);
          g = Math.floor(g * (1 - accentFactor * 0.3) + accentG * accentFactor * 0.7);
          b = Math.floor(b * (1 - accentFactor * 0.3) + accentB * accentFactor * 0.7);
        }
      }

      // Add subtle corner accents
      if ((x < 50 && y < 50) || (x > width - 50 && y > height - 50)) {
        const cornerDist = Math.min(
          Math.sqrt(x * x + y * y),
          Math.sqrt(Math.pow(width - x, 2) + Math.pow(height - y, 2))
        );
        if (cornerDist < 40) {
          const cornerAlpha = (40 - cornerDist) / 40 * 0.3;
          r = Math.floor(r + (255 - r) * cornerAlpha);
          g = Math.floor(g + (255 - g) * cornerAlpha);
          b = Math.floor(b + (255 - b) * cornerAlpha);
        }
      }

      imageData[idx] = Math.max(0, Math.min(255, r));
      imageData[idx + 1] = Math.max(0, Math.min(255, g));
      imageData[idx + 2] = Math.max(0, Math.min(255, b));
      imageData[idx + 3] = 255;
    }
  }
}

function main() {
  console.log('🎨 Creating Cinematic Thumbnails');
  console.log('================================');
  console.log('Following "Centered Luminance" Design Philosophy');
  console.log('');

  const width = 640;
  const height = 360;

  APPS.forEach((app, index) => {
    console.log(`[${index + 1}/${APPS.length}] ${app.name}`);

    const png = createPNG(width, height, (data, w, h) => {
      drawCinematicThumbnail(data, w, h, app);
    });

    const outputPath = path.join(OUTPUT_DIR, `${app.id}.png`);
    fs.writeFileSync(outputPath, png);
    console.log(`  ✅ Saved: ${outputPath}`);
  });

  console.log('');
  console.log('================================');
  console.log('All thumbnails created successfully!');
}

main();
