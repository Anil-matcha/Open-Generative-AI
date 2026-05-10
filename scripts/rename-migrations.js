#!/usr/bin/env node

/**
 * Rename migration files to use proper timestamp prefixes based on git commit date.
 * This ensures correct application order for Supabase db push.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

function isTimestampPrefix(name) {
  // Check if filename starts with 14-digit timestamp followed by underscore
  return /^\d{14}_/.test(name);
}

function getCommitDate(file) {
  try {
    // Get author date in YYYYMMDDHHMMSS format
    const date = execSync(`git log -1 --format=%ad --date=format:%Y%m%d%H%M%S "${path.join(MIGRATIONS_DIR, file)}"`, {
      cwd: process.cwd(),
      encoding: 'utf8'
    }).trim();
    if (date && date.length === 14 && !isNaN(Date.parse(date.slice(0,8)))) {
      return date;
    }
  } catch (e) {}
  return null;
}

function getCommitTimestamp(file) {
  try {
    // Get Unix timestamp for sorting
    const ts = execSync(`git log -1 --format=%at "${path.join(MIGRATIONS_DIR, file)}"`, {
      cwd: process.cwd(),
      encoding: 'utf8'
    }).trim();
    return parseInt(ts, 10);
  } catch (e) {}
  return 0;
}

function padSequence(n) {
  return String(n).padStart(6, '0');
}

function renameMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'));
  
  // Group files by commit date (YYYYMMDD) to assign times within the day
  const groups = new Map();
  
  for (const file of files) {
    const commitTs = getCommitTimestamp(file);
    const dateStr = getCommitDate(file); // e.g., 20260414
    if (!dateStr) {
      console.warn(`⚠️  Could not get date for ${file}, skipping`);
      continue;
    }
    const dateKey = dateStr.slice(0, 8); // YYYYMMDD
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey).push({ file, commitTs, dateStr });
  }
  
  // For each date, sort by commit timestamp then by filename to assign sequence within day
  const renames = [];
  
  for (const [dateKey, items] of groups.entries()) {
    // Sort by commitTs (should be same for many) then filename
    items.sort((a, b) => {
      if (a.commitTs !== b.commitTs) return a.commitTs - b.commitTs;
      return a.file.localeCompare(b.file);
    });
    
    // Assign times within the day using incremental HHMMSS starting from 000000
    for (let i = 0; i < items.length; i++) {
      const { file, dateStr } = items[i];
      if (isTimestampPrefix(file)) {
        // Already has timestamp; keep it unless duplicate conflict? 
        // But if multiple files have same timestamp (commit together), we may need to adjust to avoid duplicate prefix
        // We'll check for duplicates later
        renames.push({ old: file, new: file, date: dateStr, seq: i });
      } else {
        // Need to rename: use date at end of day plus sequence? Better: use date with time offset.
        // Use base time 120000 (noon) plus i*100 seconds to ensure uniqueness and ordering within date
        // Actually simplest: use date with base time 000000 + i*100 (i.e., seconds). 
        // But we need 6-digit HHMMSS. Let's compute:
        const timeOffset = i * 100; // seconds, formatted as HHMMSS
        const timeStr = String(120000 + timeOffset).padStart(6, '0'); // start at 12:00:00
        const newPrefix = dateStr + timeStr;
        const basename = path.basename(file, '.sql');
        const parts = basename.split('_');
        const rest = parts.slice(1).join('_');
        const newName = `${newPrefix}_${rest}.sql`;
        renames.push({ old: file, new: newName, date: dateStr, seq: i });
      }
    }
  }
  
  // Now check for duplicate new names across all renames (possible if two files from different dates map to same newName? Shouldn't happen)
  const nameCount = new Map();
  for (const r of renames) {
    const count = nameCount.get(r.new) || 0;
    if (count > 0) {
      console.error(`❌ Duplicate target name: ${r.new} from ${r.old} and previous`);
    }
    nameCount.set(r.new, count + 1);
  }
  
  console.log(`📁 Processing ${renames.length} migration files`);
  console.log(`\nProposed renames:`);
  for (const r of renames) {
    if (r.old !== r.new) {
      console.log(`   ${r.old} → ${r.new}`);
    }
  }
  
  // Ask for confirmation or auto-approve
  console.log('\nApply renames? (auto-yes)');
  
  for (const r of renames) {
    if (r.old === r.new) continue;
    const oldPath = path.join(MIGRATIONS_DIR, r.old);
    const newPath = path.join(MIGRATIONS_DIR, r.new);
    fs.renameSync(oldPath, newPath);
    console.log(`✅ ${r.old} → ${r.new}`);
  }
  
  console.log('\n🎉 All migrations renamed with proper timestamps.');
  console.log('Next: run `supabase db push` to apply');
}

renameMigrations();
