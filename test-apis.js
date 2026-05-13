#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const results = {
  supabase: { status: 'pending', message: '' },
  muapi: { status: 'pending', message: '' },
  openai: { status: 'pending', message: '' }
};

async function testSupabase() {
  console.log('\n🔍 Testing Supabase (DB API)...');
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('your-project')) {
    results.supabase = { status: 'failed', message: 'Missing or invalid Supabase credentials' };
    return;
  }

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('projects').select('count').limit(1);

    if (error) {
      // If table doesn't exist, that's OK - we just want to test auth
      if (error.message.includes('does not exist')) {
        results.supabase = { status: 'passed', message: 'Connection successful (table not found, but auth works)' };
      } else {
        results.supabase = { status: 'failed', message: error.message };
      }
    } else {
      results.supabase = { status: 'passed', message: 'Connection successful' };
    }
  } catch (err) {
    results.supabase = { status: 'failed', message: err.message };
  }
}

async function testMuAPI() {
  console.log('\n🔍 Testing MuAPI...');
  const apiKey = process.env.MUAPI_API_KEY;
  const baseURL = process.env.MUAPI_API_URL || 'https://api.muapi.ai';

  if (!apiKey || apiKey === 'your_muapi_api_key_here') {
    results.muapi = { status: 'failed', message: 'Missing MuAPI API key' };
    return;
  }

  try {
    const response = await fetch(`${baseURL}/api/v1/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      results.muapi = { status: 'passed', message: `Connection successful (${response.status})` };
    } else if (response.status === 401) {
      results.muapi = { status: 'failed', message: 'Invalid API key (401 Unauthorized)' };
    } else {
      results.muapi = { status: 'failed', message: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (err) {
    results.muapi = { status: 'failed', message: err.message };
  }
}

async function testOpenAI() {
  console.log('\n🔍 Testing OpenAI API...');
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    results.openai = { status: 'failed', message: 'API key not configured (using placeholder)' };
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      results.openai = { status: 'passed', message: `Connection successful (${response.status})` };
    } else if (response.status === 401) {
      results.openai = { status: 'failed', message: 'Invalid API key (401 Unauthorized)' };
    } else {
      results.openai = { status: 'failed', message: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (err) {
    results.openai = { status: 'failed', message: err.message };
  }
}

async function runTests() {
  console.log('🚀 Starting API Configuration Tests...\n');
  console.log('=' .repeat(50));

  await testSupabase();
  await testMuAPI();
  await testOpenAI();

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 TEST RESULTS SUMMARY:\n');

  for (const [api, result] of Object.entries(results)) {
    const icon = result.status === 'passed' ? '✅' : '❌';
    console.log(`${icon} ${api.toUpperCase()}: ${result.status.toUpperCase()}`);
    console.log(`   ${result.message}\n`);
  }

  console.log('='.repeat(50));

  const failed = Object.values(results).filter(r => r.status === 'failed').length;
  if (failed > 0) {
    console.log(`\n⚠️  ${failed} API(s) need attention before demo.\n`);
    process.exit(1);
  } else {
    console.log('\n🎉 All APIs are configured and working! Ready for demo.\n');
  }
}

runTests();
