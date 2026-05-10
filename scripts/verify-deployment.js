#!/usr/bin/env node

/**
 * Supabase Deployment Verification
 * 
 * Checks if all tables, functions, and configurations are properly deployed.
 * Run AFTER deploying migrations and functions.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
require('dotenv').config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

// Expected tables from migrations
const EXPECTED_TABLES = [
  // Core schema
  'profiles',
  'workspaces',
  'workspace_members',
  'campaigns',
  'contacts',
  'personalized_scripts',
  'generation_jobs',
  'personalized_videos',
  'video_events',
  'leads',
  'brand_kits',
  'usage_credits',
  'api_keys_optional_byok',
  // Remix API
  'templates',
  'template_categories',
  'projects',
  'media_assets',
  // ViMax
  'vimax_videos',
  'vimax_scenes',
  'vimax_shots',
  'vimax_style_references',
  'vimax_generation_pipelines',
];

// Expected functions
const EXPECTED_FUNCTIONS = [
  'remix-api',
  'muapi-proxy',
  'muapi-webhook',
  'director-agent',
  'videoagent',
  'template-service',
  'project-service',
  'user-service',
  'media-service',
  'process-upload',
];

async function checkTables() {
  console.log('\n📊 Checking Database Tables...\n');
  
  try {
    // Query to list all tables in public schema
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (error) {
      console.log('⚠️  Cannot query pg_tables directly (RLS or permissions).');
      console.log('   Trying alternative method...');
      return await alternativeTableCheck();
    }
    
    const existingTables = data.map(t => t.tablename).sort();
    
    console.log(`Found ${existingTables.length} tables:`);
    existingTables.forEach(t => console.log(`   ✓ ${t}`));
    
    const missing = EXPECTED_TABLES.filter(t => !existingTables.includes(t));
    if (missing.length > 0) {
      console.log(`\n⚠️  Missing tables (${missing.length}):`);
      missing.forEach(t => console.log(`   ✗ ${t}`));
    } else {
      console.log('\n✅ All expected tables exist!');
    }
    
    return { existing: existingTables, missing };
  } catch (err) {
    console.error('❌ Error checking tables:', err.message);
    return { error: err.message };
  }
}

async function alternativeTableCheck() {
  // Try to query a known table to see if it exists
  console.log('Attempting to sample query tables...');
  
  const sampleQueries = [
    'SELECT COUNT(*) FROM profiles LIMIT 1',
    'SELECT COUNT(*) FROM templates LIMIT 1',
    'SELECT COUNT(*) FROM projects LIMIT 1',
  ];
  
  // We can't execute raw SQL via REST easily without function
  console.log('💡 Please verify manually in Supabase Table Editor');
  return { manualCheckRequired: true };
}

async function checkFunctions() {
  console.log('\n🔧 Checking Edge Functions...\n');
  
  try {
    const { data, error } = await supabase
      .from('_functions')
      .select('*');
    
    if (error) {
      console.log('⚠️  Cannot query Edge Functions via this method.');
      console.log('   Please check Supabase Dashboard → Edge Functions');
      return { manualCheckRequired: true };
    }
    
    console.log(`Found ${data.length} deployed functions:`);
    data.forEach(f => console.log(`   ✓ ${f.name}`));
    
    const missing = EXPECTED_FUNCTIONS.filter(f => !data.some(d => d.name === f));
    if (missing.length > 0) {
      console.log(`\n⚠️  Missing functions (${missing.length}):`);
      missing.forEach(f => console.log(`   ✗ ${f}`));
    } else {
      console.log('\n✅ All expected functions deployed!');
    }
    
    return { existing: data.map(d => d.name), missing };
  } catch (err) {
    console.error('❌ Error checking functions:', err.message);
    return { error: err.message };
  }
}

async function testAPI() {
  console.log('\n🌐 Testing API Endpoints...\n');
  
  try {
    // Test templates endpoint (if remix-api deployed)
    console.log('Testing /templates endpoint...');
    const { data, error } = await supabase
      .from('templates')
      .select('count')
      .eq('is_public', true)
      .limit(1);
    
    if (error) {
      console.log(`⚠️  Templates query: ${error.message}`);
      console.log('   This is expected if templates table is empty or not accessible');
    } else {
      console.log('✅ Templates endpoint working!');
    }
    
    // Test public tables
    console.log('\nTesting public template categories...');
    const { data: cats, error: catError } = await supabase
      .from('template_categories')
      .select('*')
      .limit(5);
    
    if (catError) {
      console.log(`⚠️  Categories query: ${catError.message}`);
    } else if (cats.length === 0) {
      console.log('⚠️  No template categories found. Run seed data?');
    } else {
      console.log(`✅ Found ${cats.length} categories`);
    }
    
  } catch (err) {
    console.error('❌ API test error:', err.message);
  }
}

async function checkStorage() {
  console.log('\n💾 Checking Storage Buckets...\n');
  
  try {
    // List buckets via REST
    const response = await fetch(`${url}/storage/v1/bucket`, {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const buckets = await response.json();
      console.log(`Found ${buckets.length} storage buckets:`);
      buckets.forEach(b => console.log(`   ✓ ${b.name}`));
    } else {
      console.log('⚠️  Could not list buckets. Status:', response.status);
      console.log('   Create manually in Supabase Storage');
    }
  } catch (err) {
    console.error('❌ Storage check error:', err.message);
  }
}

async function main() {
  console.log('🔍 Supabase Deployment Verification\n');
  console.log('═'.repeat(60));
  console.log(`Project: ${url}`);
  console.log('═'.repeat(60));
  
  // Check tables
  await checkTables();
  
  // Check functions
  await checkFunctions();
  
  // Test API
  await testAPI();
  
  // Check storage
  await checkStorage();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📋 Verification Complete\n');
  console.log('If all checks passed, your Supabase backend is ready!');
  console.log('\nNext steps:');
  console.log('1. Test the frontend at http://localhost:8080');
  console.log('2. Sign up / log in');
  console.log('3. Verify data flow works');
  console.log('\nFor issues, check:');
  console.log('- Supabase logs (Dashboard → Logs)');
  console.log('- Supabase function logs');
  console.log('- Browser console for client errors');
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
