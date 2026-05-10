#!/usr/bin/env node

/**
 * Combine migrations in proper chronological order
 * - Extract dates from filenames (supports both YYYYMMDDHHMMSS and numeric prefixes)
 * - Sort by actual date, then by sequence within same date
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

function parseMigrationDate(filename) {
  // Match YYYYMMDDHHMMSS timestamp prefix
  const timestampMatch = filename.match(/^(\d{14})_/);
  if (timestampMatch) {
    return {
      date: timestampMatch[1],
      sequence: 0,
      name: filename
    };
  }
  
  // Handle numeric prefixes (001_, 002_, etc) - assign synthetic dates based on prefix order
  const numericMatch = filename.match(/^(\d{3})_/);
  if (numericMatch) {
    const prefix = parseInt(numericMatch[1], 10);
    // Map numeric prefixes to dates in order: 001 -> 20260101, 002 -> 20260201, etc
    // This ensures 001_, 002_, 003_ sort before the 2026 migrations
    const syntheticDate = `20260${prefix}01`.padStart(14, '0');
    return {
      date: syntheticDate,
      sequence: 0,
      name: filename
    };
  }
  
  // Other files - sort last
  return {
    date: '99999999999999',
    sequence: 0,
    name: filename
  };
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`❌ Migrations directory not found: ${MIGRATIONS_DIR}`);
    return [];
  }

  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .map(file => {
      const info = parseMigrationDate(file);
      return {
        path: path.join(MIGRATIONS_DIR, file),
        ...info
      };
    })
    .sort((a, b) => {
      // Compare by date string (lexicographic works for YYYYMMDDHHMMSS)
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // Same date - compare by full name
      return a.name.localeCompare(b.name);
    });
}

function combineMigrations() {
  const files = getMigrationFiles();
  
  console.log(`-- Combined Supabase Migrations`);
  console.log(`-- Generated: ${new Date().toISOString()}`);
  console.log(`-- Total files: ${files.length}`);
  console.log(`-- Order:`);
  files.forEach((f, i) => {
    console.log(`--   ${i + 1}. ${f.name}`);
  });
  console.log(`-- ===========================================`);
  console.log('');
  
  for (const file of files) {
    const fileName = path.basename(file.path);
    console.log(`-- ───────────────────────────────────────────`);
    console.log(`-- Migration: ${fileName}`);
    console.log(`-- ───────────────────────────────────────────`);
    
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      console.log(content);
      console.log('');
    } catch (err) {
      console.error(`-- ❌ Error reading ${fileName}: ${err.message}`);
    }
  }
  
  console.log(`-- ===========================================`);
  console.log(`-- All migrations combined successfully`);
  console.log(`-- Total migrations: ${files.length}`);
}

combineMigrations();
