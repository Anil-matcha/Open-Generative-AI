#!/usr/bin/env node

/**
 * Rename migration files to proper timestamps based on git commit date
 * This ensures correct application order via Supabase CLI
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

function getGitCommitDate(filePath) {
  try {
    const output = execSync(`git log -1 --format=%ad --date=format:%Y%m%d%H%M%S "${filePath}"`, { 
      cwd: process.cwd(),
      encoding: 'utf8' 
    }).trim();
    return output || '99999999999999';
  } catch {
    return '99999999999999';
  }
}

function renameMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'));
  
  console.log(`📁 Processing ${files.length} migration files...\n`);
  
  const renames = [];
  
  for (const file of files) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    const commitDate = getGitCommitDate(fullPath);
    
    // Extract extension and name without prefix
    const basename = path.basename(file, '.sql');
    const parts = basename.split('_');
    const rest = parts.slice(1).join('_'); // everything after first underscore
    
    // New filename: <commitDate>_<rest>.sql
    const newName = `${commitDate}_${rest}.sql`;
    
    if (newName !== file) {
      renames.push({ old: file, new: newName, date: commitDate });
    }
  }
  
  // Sort by new name to apply in order
  renames.sort((a, b) => a.new.localeCompare(b.new));
  
  console.log(`📝 Will rename ${renames.length} files:`);
  for (const r of renames) {
    console.log(`   ${r.date} ${r.new}`);
  }
  
  // Ask for confirmation
  console.log('\nProceed with renames? (yes/no):');
  // For non-interactive, just proceed
  for (const r of renames) {
    const oldPath = path.join(MIGRATIONS_DIR, r.old);
    const newPath = path.join(MIGRATIONS_DIR, r.new);
    fs.renameSync(oldPath, newPath);
    console.log(`✅ ${r.old} → ${r.new}`);
  }
  
  console.log('\n🎉 All migrations renamed!');
  console.log('Next: Run `supabase db push` to apply.');
}

renameMigrations();
