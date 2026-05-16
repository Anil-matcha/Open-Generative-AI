#!/usr/bin/env node

/**
 * Verify Content Security Policy configuration
 * Checks for common CSP issues and best practices
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CSP_ISSUES = [];

function checkCSP(csp, source) {
  // Check for unsafe directives
  if (csp.includes("'unsafe-inline'")) {
    CSP_ISSUES.push({
      source,
      severity: 'high',
      issue: 'CSP contains unsafe-inline',
      recommendation: 'Use nonces or hashes instead'
    });
  }

  if (csp.includes("'unsafe-eval'")) {
    CSP_ISSUES.push({
      source,
      severity: 'high',
      issue: 'CSP contains unsafe-eval',
      recommendation: 'Avoid eval() and use safe alternatives'
    });
  }

  // Check for strict-dynamic (good practice)
  if (!csp.includes("'strict-dynamic'")) {
    CSP_ISSUES.push({
      source,
      severity: 'medium',
      issue: 'Missing strict-dynamic directive',
      recommendation: 'Add strict-dynamic for better script control with nonces'
    });
  }

  // Check for report-uri or report-to for CSP violations
  if (!csp.includes('report-uri') && !csp.includes('report-to')) {
    CSP_ISSUES.push({
      source,
      severity: 'low',
      issue: 'No CSP violation reporting configured',
      recommendation: 'Add report-uri or report-to for monitoring violations'
    });
  }

  // Check for frame-ancestors (clickjacking protection)
  if (!csp.includes("frame-ancestors")) {
    CSP_ISSUES.push({
      source,
      severity: 'medium',
      issue: 'Missing frame-ancestors directive',
      recommendation: 'Add frame-ancestors \'none\' or specific origins'
    });
  }

  // Check if default-src is restrictive
  if (!csp.includes("default-src 'self'")) {
    CSP_ISSUES.push({
      source,
      severity: 'medium',
      issue: 'default-src might not be restrictive enough',
      recommendation: 'Set default-src to self or specific origins'
    });
  }
}

async function verifyCSP() {
  console.log('🔍 Verifying Content Security Policy configuration...\n');

  // Check netlify.toml
  try {
    const netlifyToml = await readFile(join(__dirname, '../netlify.toml'), 'utf-8');
    const cspMatch = netlifyToml.match(/Content-Security-Policy\s*=\s*"([^"]+)"/);

    if (cspMatch) {
      console.log('Found CSP in netlify.toml:');
      checkCSP(cspMatch[1], 'netlify.toml');
    } else {
      console.warn('⚠️  No CSP found in netlify.toml');
    }
  } catch (error) {
    console.error('Error reading netlify.toml:', error.message);
  }

  // Check vite.config.js
  try {
    const viteConfig = await readFile(join(__dirname, '../vite.config.js'), 'utf-8');
    const cspMatch = viteConfig.match(/PRODUCTION_CSP\s*=\s*\[([\s\S]*?)\]\.join/);
    const devCspMatch = viteConfig.match(/DEVELOPMENT_CSP\s*=\s*\[([\s\S]*?)\]\.join/);

    if (cspMatch) {
      console.log('\nFound PRODUCTION CSP in vite.config.js:');
      const productionCSP = cspMatch[0];
      checkCSP(productionCSP, 'vite.config.js (production)');
    }

    if (devCspMatch) {
      console.log('\nFound DEVELOPMENT CSP in vite.config.js:');
      const devCSP = devCspMatch[0];
      checkCSP(devCSP, 'vite.config.js (development)');
    }
  } catch (error) {
    console.error('Error reading vite.config.js:', error.message);
  }

  // Check index.html for meta CSP
  try {
    const indexHtml = await readFile(join(__dirname, '../index.html'), 'utf-8');
    const metaCsp = indexHtml.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i);

    if (metaCsp) {
      console.log('\nFound CSP meta tag in index.html:');
      // Extract content attribute
      const contentMatch = metaCsp[0].match(/content=["']([^"']+)["']/i);
      if (contentMatch) {
        checkCSP(contentMatch[1], 'index.html');
      }
    }
  } catch (error) {
    console.error('Error reading index.html:', error.message);
  }

  // Report findings
  console.log('\n' + '='.repeat(60));
  console.log('CSP Verification Report');
  console.log('='.repeat(60));

  if (CSP_ISSUES.length === 0) {
    console.log('✅ No CSP issues detected!');
    console.log('\nRecommendations:');
    console.log('1. Add CSP violation reporting (report-uri or report-to)');
    console.log('2. Consider adding strict-dynamic for nonce-based scripts');
    console.log('3. Regularly review CSP reports for violations');
  } else {
    console.log(`❌ Found ${CSP_ISSUES.length} CSP issue(s):\n`);

    const bySeverity = {
      high: CSP_ISSUES.filter(i => i.severity === 'high'),
      medium: CSP_ISSUES.filter(i => i.severity === 'medium'),
      low: CSP_ISSUES.filter(i => i.severity === 'low')
    };

    Object.entries(bySeverity).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        console.log(`${severity.toUpperCase()} (${issues.length}):`);
        issues.forEach((issue, i) => {
          console.log(`  ${i + 1}. [${issue.source}] ${issue.issue}`);
          console.log(`     💡 ${issue.recommendation}`);
        });
        console.log('');
      }
    });

    // Exit with error code for CI
    if (CSP_ISSUES.some(i => i.severity === 'high')) {
      console.log('❌ CRITICAL: High severity CSP issues found!');
      process.exit(1);
    }
  }

  console.log('='.repeat(60) + '\n');
}

verifyCSP().catch(error => {
  console.error('CSP verification failed:', error);
  process.exit(1);
});
