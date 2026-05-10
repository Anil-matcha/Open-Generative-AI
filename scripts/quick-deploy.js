#!/usr/bin/env node

/**
 * One-Command Supabase Deployment
 * 
 * After you've filled in your .env file with Supabase credentials,
 * run this script to:
 * 1. Verify connection
 * 2. Generate combined SQL
 * 3. Provide deployment instructions
 * 4. Optionally auto-deploy (if Supabase CLI is installed)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Open-Higgsfield-AI Supabase Deployment\n');
console.log('═'.repeat(60));

// Check .env
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const hasUrl = envContent.includes('VITE_SUPABASE_URL=') && 
  !envContent.includes('your-project-ref.supabase.co');
const hasAnon = envContent.includes('VITE_SUPABASE_ANON_KEY=') && 
  !envContent.includes('your_supabase_anon_key_here');
const hasService = envContent.includes('SUPABASE_SERVICE_ROLE_KEY=') && 
  !envContent.includes('your_supabase_service_role_key_here');

console.log('📋 Credential Check:\n');
console.log(`   ${hasUrl ? '✅' : '❌'} VITE_SUPABASE_URL`);
console.log(`   ${hasAnon ? '✅' : '❌'} VITE_SUPABASE_ANON_KEY`);
console.log(`   ${hasService ? '✅' : '❌'} SUPABASE_SERVICE_ROLE_KEY`);

if (!hasUrl || !hasAnon || !hasService) {
  console.log('\n❌ Missing credentials in .env!');
  console.log('Please edit .env and replace placeholders with actual values from');
  console.log('Supabase Dashboard → Settings → API');
  process.exit(1);
}

console.log('\n✅ Credentials found!');
console.log('\n📦 Step 1: Generating combined SQL...');

try {
  execSync('node scripts/combine-migrations.js > combined-migrations.sql', {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('✅ Generated combined-migrations.sql');
} catch (err) {
  console.error('❌ Error generating SQL:', err.message);
  process.exit(1);
}

// Check if file was created
const sqlPath = path.join(__dirname, '..', 'combined-migrations.sql');
if (fs.existsSync(sqlPath)) {
  const stats = fs.statSync(sqlPath);
  console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
} else {
  console.error('❌ Failed to create combined-migrations.sql');
  process.exit(1);
}

console.log('\n📋 Step 2: Deployment Instructions\n');
console.log('┌─ Option A: SQL Editor (Easiest) ──────────────────────────────┐');
console.log('│ 1. Open https://supabase.com/dashboard                        │');
console.log('│ 2. Select your project                                        │');
console.log('│ 3. Go to SQL Editor                                          │');
console.log('│ 4. Copy contents of combined-migrations.sql                  │');
console.log('│ 5. Paste and click "Run"                                      │');
console.log('│ 6. Wait for completion (30-60 seconds)                       │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

console.log('┌─ Option B: Supabase CLI ───────────────────────────────────────┐');
console.log('│ supabase login                                                │');
console.log('│ cd /Users/shasheemoore/Downloads/Higgsfield                    │');
console.log('│ supabase link --project-ref YOUR_PROJECT_REF                  │');
console.log('│ supabase db push                                              │');
console.log('└───────────────────────────────────────────────────────────────┘\n');

// Check if supabase CLI is installed
try {
  execSync('which supabase', { stdio: 'pipe' });
  console.log('✅ Supabase CLI is installed');
  
  console.log('\n🚀 Would you like to auto-deploy using Supabase CLI?');
  console.log('   This will:');
  console.log('   1. Link your project (if not already linked)');
  console.log('   2. Push all migrations');
  console.log('   3. Deploy edge functions');
  console.log('\n   Press Ctrl+C to cancel, or wait 5 seconds...');
  
  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n⚡ Attempting auto-deploy...\n');
  
  try {
    // Try to link
    console.log('Linking project...');
    execSync('supabase link --project-ref ' + getProjectRefFromUrl(envContent), {
      stdio: 'inherit'
    });
    
    console.log('\n📦 Pushing migrations...');
    execSync('supabase db push', { stdio: 'inherit' });
    
    console.log('\n🔧 Deploying edge functions...');
    execSync('supabase functions deploy --all', { stdio: 'inherit' });
    
    console.log('\n✅ Deployment complete!');
  } catch (err) {
    console.log('\n⚠️  Auto-deploy requires project link. Please run manually:');
    console.log('   supabase link --project-ref YOUR_PROJECT_REF');
    console.log('   supabase db push');
    console.log('   supabase functions deploy --all');
  }
  
} catch (err) {
  console.log('ℹ️  Supabase CLI not installed.');
  console.log('   Install with: npm i -g supabase');
  console.log('   Or use the SQL Editor method (Option A)');
}

console.log('\n' + '═'.repeat(60));
console.log('📌 Next Steps:\n');
console.log('1. Verify in Supabase Dashboard:');
console.log('   - Tables exist (Table Editor)');
console.log('   - Functions deployed (Edge Functions page)');
console.log('   - Storage buckets created (Storage page)\n');
console.log('2. Set Edge Function environment variables:');
console.log('   - OPENAI_API_KEY (optional)');
console.log('   - MUAPI_API_KEY (optional)');
console.log('   - PUBLIC_SITE_URL\n');
console.log('3. Test your app at http://localhost:8080\n');
console.log('4. Deploy to production when ready:\n');
console.log('   pnpm run build:all\n');
console.log('═'.repeat(60));
console.log('✅ Setup preparation complete!');

function getProjectRefFromUrl(env) {
  const match = env.match(/VITE_SUPABASE_URL=https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'YOUR_PROJECT_REF';
}
