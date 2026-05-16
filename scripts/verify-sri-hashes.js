#!/usr/bin/env node

/**
 * Verify SRI hashes for CDN scripts
 * Used in CI/CD to ensure integrity hashes are valid
 */

import crypto from 'crypto';
import https from 'https';
import { SRIManager, SRI_HASHES } from '../src/lib/services/SRIManager.js';

const VERIFICATION_TIMEOUT = 10000;

async function verifyHashes() {
  console.log('🔐 Verifying SRI hashes for CDN scripts...\n');
  const sriManager = new SRIManager();
  let allValid = true;
  const results = [];

  for (const [url, expectedHash] of Object.entries(SRI_HASHES)) {
    try {
      console.log(`Checking: ${url.split('/').pop()}`);

      const buffer = await downloadFile(url);
      const computedHash = 'sha384-' + crypto.createHash('sha384').update(buffer).digest('base64');

      const isValid = computedHash === expectedHash;

      if (isValid) {
        console.log(`  ✅ Hash matches\n`);
        results.push({ url, status: 'valid' });
      } else {
        console.log(`  ❌ Hash mismatch!`);
        console.log(`     Expected: ${expectedHash.substring(0, 32)}...`);
        console.log(`     Computed: ${computedHash.substring(0, 32)}...\n`);
        results.push({ url, status: 'mismatch', expected: expectedHash, computed: computedHash });
        allValid = false;
      }
    } catch (error) {
      console.log(`  ❌ Failed to download: ${error.message}\n`);
      results.push({ url, status: 'error', error: error.message });
      allValid = false;
    }
  }

  console.log('='.repeat(60));
  console.log('Verification Summary:');
  console.log(`  Total: ${Object.keys(SRI_HASHES).length}`);
  console.log(`  Valid: ${results.filter(r => r.status === 'valid').length}`);
  console.log(`  Invalid: ${results.filter(r => r.status !== 'valid').length}`);
  console.log('='.repeat(60));

  if (!allValid) {
    console.error('\n❌ SRI verification failed!');
    console.error('Run: node scripts/generate-sri-hashes.js to update hashes\n');
    process.exit(1);
  }

  console.log('\n✅ All SRI hashes verified successfully!\n');
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout'));
    }, VERIFICATION_TIMEOUT);

    https.get(url, (res) => {
      clearTimeout(timeout);

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

verifyHashes().catch(error => {
  console.error('Verification script error:', error);
  process.exit(1);
});
