#!/usr/bin/env node

/**
 * Environment Configuration Verification Script
 * Checks that all required API keys and endpoints are properly configured
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function success(msg) { log(`✓ ${msg}`, 'green'); }
function error(msg) { log(`✗ ${msg}`, 'red'); }
function warning(msg) { log(`⚠ ${msg}`, 'yellow'); }
function info(msg) { log(`ℹ ${msg}`, 'blue'); }

let hasErrors = false;
let hasWarnings = false;

function checkEnvVar(name, value, description) {
  if (!value || value.trim() === '' || value.includes('your_') || value.includes('placeholder')) {
    error(`${name} is not set or contains placeholder value`);
    error(`   → ${description}`);
    hasErrors = true;
    return false;
  } else {
    success(`${name} configured`);
    return true;
  }
}

function main() {
  console.log('\n' + '='.repeat(60));
  log('API Configuration Verification', 'bold');
  console.log('='.repeat(60) + '\n');

  // Check for .env file
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    error('.env file not found');
    error('   → Create .env file from .env.example');
    hasErrors = true;
    return;
  } else {
    success('.env file exists');
  }

  // Parse .env file
  let envContent;
  try {
    envContent = readFileSync(envPath, 'utf-8');
  } catch (e) {
    error('Failed to read .env file');
    hasErrors = true;
    return;
  }

  const envVars = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });

  console.log('\n--- Frontend Environment Variables ---\n');

  // Check Supabase URL
  checkEnvVar(
    'VITE_SUPABASE_URL',
    envVars.VITE_SUPABASE_URL,
    'Get from Supabase dashboard: Settings → API → URL'
  );

  // Check Supabase Anon Key
  checkEnvVar(
    'VITE_SUPABASE_ANON_KEY',
    envVars.VITE_SUPABASE_ANON_KEY,
    'Get from Supabase dashboard: Settings → API → anon public key'
  );

  // Optional: MUAPI_URL (usually fine with default)
  if (envVars.VITE_MUAPI_URL) {
    success('VITE_MUAPI_URL configured');
  } else {
    info('VITE_MUAPI_URL not set (will use default https://api.muapi.ai)');
  }

  console.log('\n--- Edge Function Environment Variables ---\n');
  info('These must be set in Supabase dashboard (Edge Functions → Settings)');
  console.log('');

  // Check if they seem to have these set
  // We can't read Supabase env from client, so we check .env for user reference
  // But we can look for documentation of required vars

  const muapiKeyConfigured = envVars.MUAPI_API_KEY && 
    !envVars.MUAPI_API_KEY.includes('your_') && 
    envVars.MUAPI_API_KEY.length > 20;
  
  if (muapiKeyConfigured) {
    success('MUAPI_API_KEY is defined in .env (though should be in Supabase edge function)');
  } else {
    warning('MUAPI_API_KEY not in .env (may still be set in Supabase edge function)');
    info('   → Add MUAPI_API_KEY to Supabase muapi-proxy edge function environment variables');
    hasWarnings = true;
  }

  const openaiKeyConfigured = envVars.OPENAI_API_KEY &&
    !envVars.OPENAI_API_KEY.includes('your_') &&
    envVars.OPENAI_API_KEY.startsWith('sk-');
  
  if (openaiKeyConfigured) {
    success('OPENAI_API_KEY is defined in .env (though should be in Supabase edge function)');
  } else {
    warning('OPENAI_API_KEY not in .env (may still be set in Supabase edge function)');
    info('   → Add OPENAI_API_KEY to Supabase ai-video-prompt-generator edge function environment variables');
    hasWarnings = true;
  }

  console.log('\n--- Connectivity Tests ---\n');

  // Test Supabase connection (basic fetch)
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      // Just test if URL is reachable (CORS will block from Node, but we can check DNS)
      // We'll just validate format
      new URL(supabaseUrl);
      success('Supabase URL format is valid');
    } catch (e) {
      error('Supabase URL is malformed');
      hasErrors = true;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (hasErrors) {
    log('CONFIGURATION FAILED: Fix errors above before using the app', 'red');
  } else if (hasWarnings) {
    log('CONFIGURATION INCOMPLETE: Address warnings for full functionality', 'yellow');
  } else {
    log('CONFIGURATION OK: All required environment variables are set', 'green');
  }
  console.log('='.repeat(60) + '\n');

  // Print next steps
  if (hasErrors || hasWarnings) {
    info('Next steps:');
    console.log('1. Edit .env file in project root with your credentials');
    console.log('2. Set edge function env vars in Supabase dashboard');
    console.log('3. Redeploy edge functions (Supabase → Edge Functions → Deploy)');
    console.log('4. Restart your dev server');
    console.log('');
    info('See ENVIRONMENT_SETUP.md for detailed instructions\n');
  }

  process.exit(hasErrors ? 1 : 0);
}

main();
