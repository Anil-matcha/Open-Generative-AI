/**
 * AI Apps Thumbnail Generation Script
 *
 * Generates AI thumbnails for apps module:
 * - ai-headshot-studio
 * - unified-studio
 * - workflow-builder
 * - ai-agent
 * - design-agent
 * - marketing-studio
 * - apps-studio
 *
 * Run with: MUAPI_KEY=your_key node scripts/generate-apps-thumbnails.js
 * Output: .webp files in public/thumbnails/studios/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS = [
  {
    id: 'ai-headshot-studio',
    name: 'AI Headshot Studio',
    prompt: 'Professional AI-generated headshot photography, photorealistic portrait of a confident business professional, studio lighting with softbox, dark moody background with blue undertones, professional headshot style, centered subject, high quality, cinematic lighting'
  },
  {
    id: 'unified-studio',
    name: 'Unified Studio',
    prompt: 'Creative studio workspace with multiple monitors displaying design tools, sleek modern desk setup, cinematic lighting with purple and blue tones, centered workspace view, professional environment, high-end creative studio aesthetic'
  },
  {
    id: 'workflow-builder',
    name: 'Workflow Builder',
    prompt: 'Abstract visualization of AI workflow pipeline, interconnected nodes and data flow, futuristic interface with glowing connections, centered composition, tech blue and purple color scheme, digital art style'
  },
  {
    id: 'ai-agent',
    name: 'AI Agent',
    prompt: 'Futuristic AI robot assistant with holographic display, sleek chrome and glass design, centered subject with glowing neural network patterns, blue cyan lighting, sci-fi aesthetic, professional AI agent visualization'
  },
  {
    id: 'design-agent',
    name: 'Design Agent',
    prompt: 'Creative design workspace with floating UI elements, modern flat design interface, centered composition with color palette swatches, pink and purple gradient background, design tool aesthetic, centered abstract designer figure'
  },
  {
    id: 'marketing-studio',
    name: 'Marketing Studio',
    prompt: 'Professional marketing creative workspace with brand mockups, sleek desk with laptop and design tools, centered composition with warm golden hour lighting, marketing campaign aesthetic, centered confident professional'
  },
  {
    id: 'apps-studio',
    name: 'Apps Studio',
    prompt: 'Gallery of creative apps icons floating in grid formation, modern app launcher interface, dark background with vibrant app icons, centered app showcase, technology gallery aesthetic, centered composition'
  }
];

const OUTPUT_DIR = path.join(__dirname, '../public/thumbnails/studios');
const BASE_URL = 'https://api.muapi.ai';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const API_KEY = process.env.MUAPI_KEY;

if (!API_KEY) {
  console.error('❌ Error: MUAPI_KEY environment variable is required');
  console.log('');
  console.log('Usage:');
  console.log('  MUAPI_KEY=your_key node scripts/generate-apps-thumbnails.js');
  console.log('');
  console.log('Get your API key at: https://muapi.ai');
  process.exit(1);
}

console.log('🎨 AI Apps Thumbnail Generator');
console.log('====================================');
console.log(`Total apps: ${APPS.length}`);
console.log(`Output directory: ${OUTPUT_DIR}`);
console.log('');

// Poll for results
async function pollForResult(requestId, apiKey) {
  const maxAttempts = 60;
  const delay = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const response = await fetch(`${BASE_URL}/api/v1/requests/${requestId}`, {
        headers: { 'x-api-key': apiKey }
      });

      if (!response.ok) continue;
      const data = await response.json();

      if (data.status === 'completed') {
        return data;
      } else if (data.status === 'failed') {
        throw new Error(`Generation failed: ${data.error || 'Unknown error'}`);
      }
      console.log(`  ⏳ Status: ${data.status} (attempt ${attempt + 1}/${maxAttempts})`);
    } catch (e) {
      console.log(`  ⏳ Waiting... (attempt ${attempt + 1})`);
    }
  }

  throw new Error('Timeout waiting for generation');
}

// Generate thumbnail using MuAPI
async function generateThumbnail(app, index) {
  console.log(`[${index + 1}/${APPS.length}] Generating: ${app.name} (${app.id})`);

  try {
    // Use 16:9 aspect ratio for consistency with existing thumbnails
    const submitResponse = await fetch(`${BASE_URL}/api/v1/flux-schnell-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        prompt: app.prompt + ', cinematic quality, professional photography, 16:9 aspect ratio, centered subject, high resolution',
        aspect_ratio: '16:9'
      })
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`API Error: ${submitResponse.status} - ${errorText}`);
    }

    const submitData = await submitResponse.json();
    console.log(`  📤 Submitted, request_id: ${submitData.request_id || submitData.id}`);

    const result = await pollForResult(submitData.request_id || submitData.id, API_KEY);

    if (!result.url) {
      throw new Error('No URL in response');
    }

    console.log(`  ✅ Generated, downloading...`);

    const imageResponse = await fetch(result.url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Save as .webp
    const outputPath = path.join(OUTPUT_DIR, `${app.id}.webp`);
    fs.writeFileSync(outputPath, buffer);

    console.log(`  💾 Saved: ${outputPath}`);
    console.log(`  📏 Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.log('');

    return { success: true, id: app.id, path: outputPath };
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    console.log('');
    return { success: false, id: app.id, error: error.message };
  }
}

// Main execution
async function main() {
  const results = [];
  const failed = [];

  for (let i = 0; i < APPS.length; i++) {
    const app = APPS[i];
    const result = await generateThumbnail(app, i);
    results.push(result);

    if (!result.success) {
      failed.push(result);
    }

    if (i < APPS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('====================================');
  console.log('Generation complete!');
  console.log(`✅ Success: ${results.filter(r => r.success).length}/${APPS.length}`);
  console.log(`❌ Failed: ${failed.length}/${APPS.length}`);

  if (failed.length > 0) {
    console.log('');
    console.log('Failed apps:');
    failed.forEach(f => console.log(`  - ${f.id}: ${f.error}`));
  }
}

main().catch(console.error);