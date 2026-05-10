#!/usr/bin/env node

/**
 * Deploy combined migrations to Supabase via REST API
 * Uses the Service Role Key to execute SQL directly
 */

import fs from 'fs';
import https from 'https';

const SUPABASE_URL = 'https://bzxohkrxcwodllketcpz.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: SUPABASE_URL.replace('https://', ''),
      port: 443,
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function deployMigrations() {
  const sql = fs.readFileSync('combined-migrations.sql', 'utf8');

  console.log(`📦 Loading combined migrations (${sql.length} characters)...`);
  
  try {
    console.log('🚀 Executing migrations on Supabase...');
    const result = await executeSQL(sql);
    console.log('✅ Migrations deployed successfully!');
    console.log('Response:', JSON.stringify(result.body, null, 2));
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Try to extract useful error info
    if (error.message.includes('HTTP')) {
      console.log('\n📋 This is expected if migrations were already applied.');
      console.log('   Check the database schema in Supabase dashboard to verify.');
    }
    process.exit(1);
  }
}

deployMigrations();
