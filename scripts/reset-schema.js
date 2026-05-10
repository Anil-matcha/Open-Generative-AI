#!/usr/bin/env node

/**
 * Reset Supabase public schema via direct PostgreSQL connection
 */

import { Client } from 'pg';

const CONNECTION_STRING = 'postgresql://postgres:VideoRemix2026@db.bzxohkrxcwodllketcpz.supabase.co:5432/postgres';

async function resetSchema() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  console.log('📌 Connected.');
  
  try {
    console.log('🧹 Dropping public schema...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    console.log('✅ Schema reset completed.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetSchema();
