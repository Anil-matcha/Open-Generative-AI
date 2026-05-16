/**
 * Unit tests for SRIManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SRIManager, SRI_HASHES, getScriptWithSRI, getStyleWithSRI } from '../src/lib/services/SRIManager.js';

describe('SRIManager', () => {
  let sriManager;

  beforeEach(() => {
    sriManager = new SRIManager();
  });

  describe('SRI_HASHES', () => {
    it('should have valid SHA-384 hashes for all CDN scripts', () => {
      expect(SRI_HASHES).toBeDefined();
      expect(Object.keys(SRI_HASHES).length).toBeGreaterThan(0);

      // Each hash should start with 'sha384-'
      Object.entries(SRI_HASHES).forEach(([url, hash]) => {
        expect(hash).toMatch(/^sha384-[A-Za-z0-9+/=]+$/);
        expect(hash.length).toBeGreaterThan(50); // SHA-384 base64 is ~77 chars
      });
    });

    it('should include required CDN scripts', () => {
      const requiredScripts = [
        'framer-motion',
        'lucide-react',
        'canvas-confetti'
      ];

      requiredScripts.forEach(script => {
        const found = Object.keys(SRI_HASHES).some(url =>
          url.includes(script)
        );
        expect(found).toBe(true);
      });
    });
  });

  describe('getSRI', () => {
    it('should return integrity attribute for known URLs', () => {
      const url = 'https://cdn.jsdelivr.net/npm/framer-motion@12.38.0/dist/framer-motion.umd.js';
      const result = sriManager.getSRI(url);
      expect(result).toContain('integrity="sha384-');
    });

    it('should return empty string for unknown URLs', () => {
      const result = sriManager.getSRI('https://unknown.com/script.js');
      expect(result).toBe('');
    });

    it('should return empty string when SRI is disabled', () => {
      sriManager.sriEnabled = false;
      const url = 'https://cdn.jsdelivr.net/npm/framer-motion@12.38.0/dist/framer-motion.umd.js';
      const result = sriManager.getSRI(url);
      expect(result).toBe('');
    });
  });

  describe('generateNonce', () => {
    it('should generate a 32-character hex nonce', () => {
      const nonce = sriManager.generateNonce();
      expect(nonce).toHaveLength(32);
      expect(nonce).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique nonces', () => {
      const nonce1 = sriManager.generateNonce();
      const nonce2 = sriManager.generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('getNonce', () => {
    it('should return a nonce', () => {
      const nonce = sriManager.getNonce();
      expect(nonce).toHaveLength(32);
    });
  });

  describe('getScriptWithSRI', () => {
    it('should return script attributes with integrity and nonce', () => {
      const url = 'https://cdn.jsdelivr.net/npm/framer-motion@12.38.0/dist/framer-motion.umd.js';
      const attrs = getScriptWithSRI(url);

      expect(attrs.src).toBe(url);
      expect(attrs.crossorigin).toBe('anonymous');
      expect(attrs.integrity).toMatch(/^sha384-[A-Za-z0-9+/=]+$/);
      expect(attrs.nonce).toHaveLength(32);
    });

    it('should merge custom attributes', () => {
      const url = 'https://cdn.jsdelivr.net/npm/framer-motion@12.38.0/dist/framer-motion.umd.js';
      const attrs = getScriptWithSRI(url, { async: true, defer: true });

      expect(attrs.async).toBe(true);
      expect(attrs.defer).toBe(true);
    });

    it('should work without SRI for unknown URLs', () => {
      const attrs = getScriptWithSRI('https://example.com/script.js');
      expect(attrs.src).toBe('https://example.com/script.js');
      expect(attrs.crossorigin).toBe('anonymous');
      expect(attrs.nonce).toBeDefined();
      expect(attrs.integrity).toBeUndefined();
    });
  });

  describe('getStyleWithSRI', () => {
    it('should return style attributes with integrity', () => {
      const url = 'https://fonts.googleapis.com/css2?family=Roboto';
      const attrs = getStyleWithSRI(url);

      expect(attrs.href).toBe(url);
      expect(attrs.rel).toBe('stylesheet');
      expect(attrs.crossorigin).toBe('anonymous');
    });
  });
});

describe('SRI Hash Generation', () => {
  it('should verify hash against actual file content', async () => {
    // This test ensures our recorded hashes match the actual files
    // Run this test in CI to catch CDN tampering

    const https = await import('https');
    const crypto = await import('crypto');

    const testUrl = 'https://cdn.jsdelivr.net/npm/framer-motion@12.38.0/dist/framer-motion.umd.js';
    const expectedHash = SRI_HASHES[testUrl];

    expect(expectedHash).toBeDefined();

    // Compute hash from CDN
    const buffer = await new Promise((resolve, reject) => {
      https.get(testUrl, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    });

    const computedHash = 'sha384-' + crypto.createHash('sha384').update(buffer).digest('base64');

    expect(computedHash).toBe(expectedHash);
  });
});
