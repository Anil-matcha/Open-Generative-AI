#!/usr/bin/env node

/**
 * Submodule Configuration Validation CLI
 *
 * Validates git submodule configuration consistency:
 * - Duplicate URL detection
 * - .gitmodules coverage of actual submodules
 * - Path name matching
 * - Detached HEAD state detection
 * - URL format validation (HTTPS/SSH, .git extension)
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - One or more validation failures
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types (JSDoc for documentation)
// ============================================================================

/**
 * @typedef {Object} Submodule
 * @property {string} path
 * @property {string} url
 * @property {string} [branch]
 */

/**
 * @typedef {Object} SubmoduleStatus
 * @property {string} path
 * @property {string} head - branch name or "HEAD" for detached
 * @property {string} commit
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse .gitmodules file using git config for reliability
 * @returns {Submodule[]}
 */
function getConfiguredSubmodules() {
  try {
    const cmd = "git config -f .gitmodules --get-regexp 'submodule\\.'";
    const output = execSync(cmd, { encoding: 'utf-8' });

    const lines = output.split('\n').filter(line => line.trim());
    const submap = new Map();

    for (const line of lines) {
      const match = line.match(/^submodule\.([^.]+)\.(path|url)\s+(.+)$/);
      if (!match) continue;

      const name = match[1];
      const key = match[2];
      const value = match[3];

      if (!submap.has(name)) submap.set(name, { path: '', url: '' });
      const sm = submap.get(name);
      if (key === 'path') sm.path = value;
      if (key === 'url') sm.url = value;
    }

    return Array.from(submap.values()).filter(sm => sm.path && sm.url);
  } catch (error) {
    if (error.status && error.status !== 1) {
      console.error('Error parsing .gitmodules:', error.message);
    }
    return [];
  }
}

/**
 * Get actual submodules from git index (mode 160000)
 * @returns {string[]}
 */
function getActualSubmodules() {
  try {
    const output = execSync('git ls-files --stage', { encoding: 'utf-8' });
    const lines = output.split('\n').filter(line => line.trim());

    const submoduleLines = lines.filter(line => line.startsWith('160000'));

    const paths = submoduleLines.map(line => {
      const parts = line.split('\t');
      return parts[parts.length - 1]?.trim() || '';
    }).filter(path => path.length > 0);

    return paths;
  } catch (error) {
    console.error('Error getting actual submodules:', error);
    return [];
  }
}

/**
 * Get HEAD status for a specific submodule
 * @param {string} submodulePath
 * @returns {SubmoduleStatus}
 */
function getSubmoduleStatus(submodulePath) {
  try {
    const gitDir = path.join(submodulePath, '.git');
    let headRef;

    if (fs.existsSync(gitDir) && fs.statSync(gitDir).isFile()) {
      const gitDirContent = fs.readFileSync(gitDir, 'utf-8').trim();
      const actualGitDir = path.resolve(submodulePath, gitDirContent.replace('gitdir: ', ''));
      const headPath = path.join(actualGitDir, 'HEAD');
      if (fs.existsSync(headPath)) {
        headRef = fs.readFileSync(headPath, 'utf-8').trim();
      } else {
        headRef = 'unknown';
      }
    } else if (fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory()) {
      const headPath = path.join(gitDir, 'HEAD');
      if (fs.existsSync(headPath)) {
        headRef = fs.readFileSync(headPath, 'utf-8').trim();
      } else {
        headRef = 'unknown';
      }
    } else {
      return { path: submodulePath, head: 'unknown', commit: 'unknown' };
    }

    let branch = 'HEAD';
    let commit = headRef;

    if (headRef.startsWith('ref: refs/heads/')) {
      branch = headRef.replace('ref: refs/heads/', '');
      try {
        commit = execSync(`git -C "${submodulePath}" rev-parse HEAD`, { encoding: 'utf-8' }).trim();
      } catch {
        // fallback
      }
    } else if (headRef.startsWith('ref: refs/heads/')) {
      branch = headRef.split('/').pop() || 'HEAD';
    } else {
      branch = 'HEAD';
      commit = headRef;
    }

    return { path: submodulePath, head: branch, commit };
  } catch (error) {
    console.error(`Error checking submodule ${submodulePath}:`, error);
    return { path: submodulePath, head: 'error', commit: 'error' };
  }
}

/**
 * Check if a submodule is in detached HEAD state
 * @param {SubmoduleStatus} status
 * @returns {boolean}
 */
function isDetachedHead(status) {
  return status.head === 'HEAD' || status.head === 'unknown' || status.head === 'error';
}

// ============================================================================
// CLI & Validation Logic
// ============================================================================

function printSummary(configured, actual, statuses) {
  console.log('\n=== Submodule Configuration Summary ===');
  console.log(`Total configured submodules: ${configured.length}`);
  console.log(`Total actual submodules: ${actual.length}`);

  const uniqueUrls = new Set(configured.map(sm => sm.url));
  console.log(`Unique base URLs: ${uniqueUrls.size}`);

  console.log('\nConfigured submodules:');
  configured.forEach(sm => {
    console.log(`  ${sm.path} -> ${sm.url}${sm.branch ? ` (${sm.branch})` : ''}`);
  });

  console.log('\nActual submodules:');
  actual.forEach(path => {
    const status = statuses.get(path);
    console.log(`  ${path} -> ${status?.head || 'unknown'} (${status?.commit?.slice(0, 8) || 'unknown'})`);
  });
  console.log('');
}

function validate(verbose = false) {
  const errors = [];
  let configuredSubmodules = [];
  let actualSubmodulePaths = [];
  let submoduleStatuses = new Map();

  // Gather data
  try {
    configuredSubmodules = getConfiguredSubmodules();
    if (verbose) console.log(`Found ${configuredSubmodules.length} configured submodules`);
  } catch (e) {
    errors.push(`Failed to parse .gitmodules: ${e.message}`);
  }

  try {
    actualSubmodulePaths = getActualSubmodules();
    if (verbose) console.log(`Found ${actualSubmodulePaths.length} actual submodules`);
  } catch (e) {
    errors.push(`Failed to get actual submodules: ${e.message}`);
  }

  // Build status map for existing directories only
  for (const p of actualSubmodulePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      submoduleStatuses.set(p, getSubmoduleStatus(p));
    }
  }

  // ------------------------------------------------------------------------
  // Validation 1: Duplicate URL detection
  // ------------------------------------------------------------------------
  const urls = configuredSubmodules.map(sm => sm.url);
  const urlCounts = new Map();
  for (const url of urls) {
    urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
  }
  const duplicateUrls = Array.from(urlCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([url, count]) => `${url} (${count} times)`);

  if (duplicateUrls.length > 0) {
    errors.push(`Found duplicate URLs: ${duplicateUrls.join(', ')}`);
  } else if (verbose) {
    console.log('✓ No duplicate URLs found');
  }

  // ------------------------------------------------------------------------
  // Validation 2: .gitmodules entry for every filesystem submodule
  // ------------------------------------------------------------------------
  const configuredPaths = new Set(configuredSubmodules.map(sm => sm.path));
  const missing = actualSubmodulePaths.filter(path => !configuredPaths.has(path));

  if (missing.length > 0) {
    errors.push(`Missing .gitmodules entries for: ${missing.join(', ')}`);
  } else if (verbose) {
    console.log('✓ All actual submodules have .gitmodules entries');
  }

  // Worktree checking
  const worktreePaths = actualSubmodulePaths.filter(p => p.startsWith('worktrees/'));
  const missingWorktrees = worktreePaths.filter(p => !configuredPaths.has(p));
  if (missingWorktrees.length > 0) {
    errors.push(`Worktree submodules missing from .gitmodules: ${missingWorktrees.join(', ')}`);
  } else if (verbose) {
    console.log('✓ All worktree submodules accounted for');
  }

  // Validation 3: Path name matching (configured paths exist in filesystem)
  const configuredPathArray = configuredSubmodules.map(sm => sm.path);
  const actualPathsSet = new Set(actualSubmodulePaths);
  const missingFromFS = configuredPathArray.filter(path => !actualPathsSet.has(path));

  if (missingFromFS.length > 0) {
    console.warn(`Note: Configured submodules not found in filesystem (may need initialization): ${missingFromFS.join(', ')}`);
  } else if (verbose) {
    console.log('✓ All configured paths exist in filesystem');
  }

  // Validation 4: Detached HEAD state detection
  const detachedSubmodules = Array.from(submoduleStatuses.entries())
    .filter(([_, status]) => isDetachedHead(status))
    .map(([path, status]) => `${path} (${status.head})`);

  if (detachedSubmodules.length > 0) {
    errors.push(`Submodules in detached HEAD: ${detachedSubmodules.join(', ')}`);
  } else if (verbose) {
    console.log('✓ No submodules in detached HEAD state');
  }

  // Validation 5: URL format - HTTPS/SSH
  const invalidUrls = configuredSubmodules.filter(sm =>
    !sm.url.startsWith('https://') &&
    !sm.url.startsWith('http://') &&
    !sm.url.startsWith('git@') &&
    !sm.url.startsWith('ssh://')
  );

  if (invalidUrls.length > 0) {
    errors.push(`Invalid URL formats (must be https://, http://, git@, or ssh://): ${invalidUrls.map(sm => sm.url).join(', ')}`);
  } else if (verbose) {
    console.log('✓ All URLs use valid protocols (HTTPS/SSH)');
  }

  // Validation 6: URL format - .git extension
  const nonGitUrls = configuredSubmodules.filter(sm => !sm.url.endsWith('.git'));

  if (nonGitUrls.length > 0) {
    errors.push(`URLs missing .git extension: ${nonGitUrls.map(sm => sm.url).join(', ')}`);
  } else if (verbose) {
    console.log('✓ All URLs end with .git extension');
  }

  // Validation 7: Unique submodule paths
  const paths = configuredSubmodules.map(sm => sm.path);
  const duplicatePaths = paths.filter((path, index) => paths.indexOf(path) !== index);

  if (duplicatePaths.length > 0) {
    errors.push(`Duplicate paths found: ${[...new Set(duplicatePaths)].join(', ')}`);
  } else if (verbose) {
    console.log('✓ All submodule paths are unique');
  }

  // Reporting
  if (verbose) {
    printSummary(configuredSubmodules, actualSubmodulePaths, submoduleStatuses);
  }

  if (errors.length > 0) {
    console.error('\n❌ Submodule validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  } else {
    console.log('✅ All submodule validations passed');
    process.exit(0);
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');

validate(verbose);
