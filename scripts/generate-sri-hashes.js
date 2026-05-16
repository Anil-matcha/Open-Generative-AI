#!/usr/bin/env node

/**
 * Generate real SRI hashes for CDN scripts
 * Downloads scripts and computes SHA-384 hashes
 */

import crypto from 'crypto';
import https from 'https';
import { writeFile } from 'fs';

const SCRIPTS = [
  {
    name: 'framer-motion',
    url: 'https://cdn.jsdelivr.net/npm/framer-motion@12.38.0/dist/framer-motion.js'
  },
  {
    name: 'lucide-react',
    url: 'https://cdn.jsdelivr.net/npm/lucide-react@1.8.0/dist/lucide-react.js'
  },
  {
    name: 'canvas-confetti',
    url: 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js'
  }
];

function computeSHA384(buffer) {
  return crypto.createHash('sha384').update(buffer).digest('base64');
}

async function downloadScript(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function generateHashes() {
  const hashes = {};

  for (const script of SCRIPTS) {
    try {
      console.log(`Downloading ${script.name}...`);
      const buffer = await downloadScript(script.url);
  const hash = 'sha384-' + crypto.createHash('sha384').update(buffer).digest('base64');
  hashes[script.url] = hash;
  console.log(`✅ ${script.name}: ${hash}`);
    } catch (error) {
      console.error(`❌ Failed to download ${script.name}:`, error.message);
      process.exit(1);
    }
  }

  // Generate SRIManager.js content
  const sriManagerContent = `export const SRI_HASHES = {
${Object.entries(hashes).map(([url, hash]) => `  '${url}': '${hash}',`).join('\n')}
};

export class SRIManager {
  constructor() {
    this.sriEnabled = true;
  }

  getSRI(url) {
    if (!this.sriEnabled) return '';
    const hash = SRI_HASHES[url];
    return hash ? \` integrity="\${hash}"\` : '';
  }

  generateNonce() {
    if (typeof crypto === 'undefined') return '';
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  getNonce() {
    return this.generateNonce();
  }
}

export const sriManager = new SRIManager();

export function getScriptWithSRI(url, attributes = {}) {
  const sriAttrs = sriManager.getSRI(url);
  const nonce = sriManager.getNonce();
  const attrs = {
    src: url,
    crossorigin: 'anonymous',
    ...attributes
  };
  if (sriAttrs) {
    const hash = SRI_HASHES[url];
    if (hash) attrs.integrity = hash;
  }
  attrs.nonce = nonce;
  return attrs;
}

export function getStyleWithSRI(url) {
  const sriAttrs = sriManager.getSRI(url);
  return {
    href: url,
    rel: 'stylesheet',
    crossorigin: 'anonymous',
    integrity: sriAttrs
  };
}
`;

  // Write to file
  const fs = await import('fs');
  fs.writeFileSync('src/lib/services/SRIManager.js', sriManagerContent);
  console.log('✅ SRIManager.js updated with real hashes');

  // Also update vite.config.js hashes
  await updateViteConfig(hashes);
}

async function updateViteConfig(hashes) {
  const fs = await import('fs');
  const path = await import('path');

  const viteConfigPath = 'vite.config.js';
  const config = fs.readFileSync(viteConfigPath, 'utf8');

  // Replace placeholder hashes
  let updatedConfig = config;
  Object.entries(hashes).forEach(([url, hash], index) => {
    const scriptName = Object.keys(hashes)[index];
    const placeholder = new RegExp(`'${scriptName}': 'sha384-[^']+'`);
    const replacement = `'${scriptName}': '${hash}'`;
    updatedConfig = updatedConfig.replace(placeholder, replacement);
  });

  fs.writeFileSync(viteConfigPath, updatedConfig);
  console.log('✅ vite.config.js SRI hashes updated');
}

generateHashes().catch(console.error);
