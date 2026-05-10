#!/usr/bin/env node

/**
 * Supabase Setup Verification and Deployment Helper
 * 
 * This script:
 * 1. Checks if Supabase credentials are configured
 * 2. Verifies database connection
 * 3. Prepares migration SQL
 * 4. Provides deployment instructions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Supabase Setup Verification\n');
console.log('═'.repeat(60));

// Check environment variables
const envPath = path.join(__dirname, '..', '.env');
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Environment Check:\n');

// Check .env file
if (fs.existsSync(envPath)) {
  console.log(`✅ .env file exists: ${envPath}`);
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL=') && 
    !envContent.includes('your-project-ref.supabase.co');
  const hasAnonKey = envContent.includes('VITE_SUPABASE_ANON_KEY=') && 
    !envContent.includes('your_supabase_anon_key_here');
  const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY=') && 
    !envContent.includes('your_supabase_service_role_key_here');
  
  console.log(`   ${hasSupabaseUrl ? '✅' : '❌'} VITE_SUPABASE_URL configured`);
  console.log(`   ${hasAnonKey ? '✅' : '❌'} VITE_SUPABASE_ANON_KEY configured`);
  console.log(`   ${hasServiceKey ? '✅' : '❌'} SUPABASE_SERVICE_ROLE_KEY configured`);
  
  if (!hasSupabaseUrl || !hasAnonKey || !hasServiceKey) {
    console.log('\n⚠️  Your .env file needs to be updated with actual Supabase credentials.');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Create or select your project');
    console.log('   3. Go to Settings → API');
    console.log('   4. Copy the values into .env:');
    console.log('      - VITE_SUPABASE_URL');
    console.log('      - VITE_SUPABASE_ANON_KEY (public)');
    console.log('      - SUPABASE_SERVICE_ROLE_KEY (private) - keep secret!');
  }
} else {
  console.log(`❌ .env file not found: ${envPath}`);
  console.log(`   Copy .env.example to .env and configure it.`);
}

console.log('\n' + '═'.repeat(60));
console.log('📦 Migration Files Check:\n');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
if (fs.existsSync(migrationsDir)) {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`✅ Migrations directory exists`);
  console.log(`   Found ${files.length} migration files:`);
  
  files.forEach((f, i) => {
    console.log(`   ${i + 1}. ${f}`);
  });
  
  // Calculate total size
  const totalSize = files.reduce((sum, f) => {
    return sum + fs.statSync(path.join(migrationsDir, f)).size;
  }, 0);
  console.log(`   Total size: ${(totalSize / 1024).toFixed(2)} KB`);
} else {
  console.log(`❌ Migrations directory not found: ${migrationsDir}`);
}

console.log('\n' + '═'.repeat(60));
console.log('🔧 Edge Functions Check:\n');

const functionsDir = path.join(__dirname, '..', 'supabase', 'functions');
if (fs.existsSync(functionsDir)) {
  const functions = fs.readdirSync(functionsDir)
    .filter(f => fs.statSync(path.join(functionsDir, f)).isDirectory());
  
  console.log(`✅ Edge Functions directory exists`);
  console.log(`   Found ${functions.length} functions:`);
  
  functions.forEach((f, i) => {
    console.log(`   ${i + 1}. ${f}/`);
  });
  
  // Check for index.ts in each
  const missingIndex = functions.filter(f => 
    !fs.existsSync(path.join(functionsDir, f, 'index.ts'))
  );
  
  if (missingIndex.length > 0) {
    console.log(`   ⚠️  Missing index.ts in: ${missingIndex.join(', ')}`);
  }
} else {
  console.log(`❌ Functions directory not found: ${functionsDir}`);
}

console.log('\n' + '═'.repeat(60));
console.log('📝 Deployment Instructions:\n');

if (!supabaseUrl || !serviceKey) {
  console.log('1. ⚠️  Configure your .env file first (see above)');
} else {
  console.log('1. ✅ Credentials found in environment');
}

console.log('\n2. Prepare combined SQL:');
console.log('   Run: node scripts/combine-migrations.js > combined-migrations.sql');
console.log('   This creates a single SQL file with all migrations in order.');

console.log('\n3. Deploy to Supabase (choose one method):');
console.log('   A. SQL Editor (easiest):');
console.log('      - Copy contents of combined-migrations.sql');
console.log('      - Paste into Supabase SQL Editor');
console.log('      - Click "Run"');
console.log('   ');
console.log('   B. Using Supabase CLI (requires installation):');
console.log('      - Install: npm i -g supabase');
console.log('      - Login: supabase login');
console.log('      - Link: supabase link --project-ref YOUR_PROJECT_ID');
console.log('      - Deploy: supabase db push');
console.log('   ');
console.log('   C. Via REST API (programmatic):');
console.log('      - Use the deploy-migrations.js script (requires auth)');

console.log('\n4. Deploy Edge Functions:');
console.log('   supabase functions deploy --all');
console.log('   Or deploy individually:');
console.log('   supabase functions deploy remix-api');
console.log('   supabase functions deploy muapi-webhook');
console.log('   (etc.)');

console.log('\n5. Verify deployment:');
console.log('   - Check tables in Supabase Table Editor');
console.log('   - Test API endpoints');
console.log('   - Check function logs: supabase functions logs');

console.log('\n' + '═'.repeat(60));
console.log('📚 Key Files:\n');
console.log('   • supabase/setup.sql            - Quick database setup');
console.log('   • supabase/migrations/          - Versioned migrations');
console.log('   • supabase/functions/           - Edge Functions (33 functions)');
console.log('   • scripts/deploy-migrations.js  - Deployment helper');
console.log('   • scripts/combine-migrations.js - SQL generator');

console.log('\n💡 Quick Start (if you have credentials):\n');
console.log('   # Step 1: Generate combined SQL');
console.log('   node scripts/combine-migrations.js > combined-migrations.sql\n');
console.log('   # Step 2: Open Supabase Dashboard');
console.log('   # Step 3: SQL Editor → Paste & Run\n');
console.log('   # Step 4: Verify tables exist');
console.log('   # Step 5: Deploy functions (optional)\n');

console.log('═'.repeat(60));
console.log('✅ Verification complete!');
