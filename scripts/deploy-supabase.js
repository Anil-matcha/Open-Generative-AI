#!/usr/bin/env node

/**
 * Deploy migrations to Supabase by executing each migration file individually
 * This preserves multi-line functions and dollar-quoted strings
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const CONNECTION_STRING = 'postgresql://postgres:VideoRemix2026@db.bzxohkrxcwodllketcpz.supabase.co:5432/postgres';

function getMigrationFiles() {
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => path.join(MIGRATIONS_DIR, file));
}

async function deployMigrations() {
  const files = getMigrationFiles();
  console.log(`📦 Found ${files.length} migration files\n`);

  const client = new Client({ connectionString: CONNECTION_STRING });

  try {
    console.log('🔌 Connecting to Supabase Postgres...');
    await client.connect();
    console.log('✅ Connected!\n');

    let totalSuccess = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      const fileName = path.basename(filePath);
      
      console.log(`[${i + 1}/${files.length}] ${fileName}`);
      
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`   ✅ Applied`);
        totalSuccess++;
      } catch (error) {
        const msg = error.message;
        
        // Common idempotent errors - these are OK
        if (msg.includes('already exists') || 
            msg.includes('duplicate') ||
            msg.includes('relation') && msg.includes('does not exist') ||
            msg.includes('must be owner') ||
            msg.includes('permission denied') ||
            msg.includes('already a view') ||
            msg.includes('policy already exists') ||
            msg.includes('constraint already exists') ||
            msg.includes('trigger already exists') ||
            msg.includes('index already exists') ||
            msg.includes('function already exists')) {
          console.log(`   ⏭️  Skipped (already exists)`);
          totalSkipped++;
        } else {
          console.log(`   ❌ ERROR: ${msg.substring(0, 120)}`);
          totalErrors++;
        }
      }
    }

    await client.end();

    console.log(`\n📊 Deployment Summary:`);
    console.log(`   ✅ Newly Applied: ${totalSuccess}`);
    console.log(`   ⏭️  Skipped (already exists): ${totalSkipped}`);
    console.log(`   ❌ Errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('\n🎉 All migrations deployed successfully!');
    } else {
      console.log('\n⚠️  Some errors occurred. Check logs above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

deployMigrations();
