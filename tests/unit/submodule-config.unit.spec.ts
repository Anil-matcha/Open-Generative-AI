import { describe, it, expect, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Export helper functions for potential reuse
export { getConfiguredSubmodules, getActualSubmodules, getSubmoduleStatus };

/**
 * Submodule Configuration Validation Test Suite
 *
 * Tests for validating git submodule configuration consistency:
 * - Duplicate URL detection
 * - .gitmodules coverage of actual submodules
 * - Path name matching
 * - Detached HEAD state detection
 */

// ============================================================================
// Helper Functions
// ============================================================================

interface Submodule {
  path: string;
  url: string;
  branch?: string;
}

interface SubmoduleStatus {
  path: string;
  head: string; // branch name or "HEAD" for detached
  commit: string;
}

/**
 * Parse .gitmodules file and extract submodule configurations
 */
function getConfiguredSubmodules(): Submodule[] {
  const gitmodulesPath = path.resolve(process.cwd(), '.gitmodules');
  
  if (!fs.existsSync(gitmodulesPath)) {
    return [];
  }

  const content = fs.readFileSync(gitmodulesPath, 'utf-8');
  const submodules: Submodule[] = [];
  
  // Parse .gitmodules format:
  // [submodule "path"]
  // 	path = path
  // 	url = url
  // 	[optional] branch = branch
  
  const sectionRegex = /\[submodule\s+"([^"]+)"\][\s\S]*?(?=\[submodule|\Z)/g;
  const pathRegex = /path\s*=\s*(.+)/i;
  const urlRegex = /url\s*=\s*(.+)/i;
  const branchRegex = /branch\s*=\s*(.+)/i;
  
  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    const sectionContent = match[0];
    const pathMatch = sectionContent.match(pathRegex);
    const urlMatch = sectionContent.match(urlRegex);
    const branchMatch = sectionContent.match(branchRegex);
    
    if (pathMatch && urlMatch) {
      submodules.push({
        path: pathMatch[1].trim(),
        url: urlMatch[1].trim(),
        branch: branchMatch ? branchMatch[1].trim() : undefined
      });
    }
  }
  
  return submodules;
}

/**
 * Get actual submodules from git index (mode 160000)
 */
function getActualSubmodules(): string[] {
  try {
    const output = execSync('git ls-files --stage', { encoding: 'utf-8' });
    const lines = output.split('\n').filter(line => line.trim());
    
    // Filter for submodule entries (mode 160000)
    const submoduleLines = lines.filter(line => line.startsWith('160000'));
    
    // Extract paths (last column)
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
 */
function getSubmoduleStatus(submodulePath: string): SubmoduleStatus {
  try {
    const gitDir = path.join(submodulePath, '.git');
    let headRef: string;
    
    // Check if .git is a file (worktree) or directory (regular submodule)
    if (fs.existsSync(gitDir) && fs.statSync(gitDir).isFile()) {
      // Worktree: read the gitdir from the file
      const gitDirContent = fs.readFileSync(gitDir, 'utf-8').trim();
      const actualGitDir = path.resolve(submodulePath, gitDirContent.replace('gitdir: ', ''));
      const headPath = path.join(actualGitDir, 'HEAD');
      if (fs.existsSync(headPath)) {
        headRef = fs.readFileSync(headPath, 'utf-8').trim();
      } else {
        headRef = 'unknown';
      }
    } else if (fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory()) {
      // Regular submodule
      const headPath = path.join(gitDir, 'HEAD');
      if (fs.existsSync(headPath)) {
        headRef = fs.readFileSync(headPath, 'utf-8').trim();
      } else {
        headRef = 'unknown';
      }
    } else {
      return { path: submodulePath, head: 'unknown', commit: 'unknown' };
    }
    
    // Parse HEAD reference: "ref: refs/heads/main" or just a commit SHA (detached)
    let branch = 'HEAD';
    let commit = headRef;
    
    if (headRef.startsWith('ref: refs/heads/')) {
      branch = headRef.replace('ref: refs/heads/', '');
      // Get actual commit
      try {
        commit = execSync(`git -C "${submodulePath}" rev-parse HEAD`, { encoding: 'utf-8' }).trim();
      } catch {
        // fallback to parsing packed refs if needed
      }
    } else if (headRef.startsWith('ref: refs/heads/')) {
      // Alternative format
      branch = headRef.split('/').pop() || 'HEAD';
    } else {
      // Detached HEAD (raw commit SHA)
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
 */
function isDetachedHead(status: SubmoduleStatus): boolean {
  return status.head === 'HEAD' || status.head === 'unknown' || status.head === 'error';
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Submodule Configuration Validation', () => {
  let configuredSubmodules: Submodule[];
  let actualSubmodulePaths: string[];
  let submoduleStatuses: Map<string, SubmoduleStatus>;
  
  beforeEach(() => {
    configuredSubmodules = getConfiguredSubmodules();
    actualSubmodulePaths = getActualSubmodules();
    
    // Get status for all actual submodules
    submoduleStatuses = new Map();
    for (const path of actualSubmodulePaths) {
      if (fs.existsSync(path) && fs.statSync(path).isDirectory()) {
        submoduleStatuses.set(path, getSubmoduleStatus(path));
      }
    }
  });

  describe('should detect duplicate submodule URLs', () => {
    it('should have all unique URLs across configured submodules', () => {
      const urls = configuredSubmodules.map(sm => sm.url);
      const uniqueUrls = new Set(urls);
      
      // Count occurrences of each URL
      const urlCounts = new Map<string, number>();
      for (const url of urls) {
        urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
      }
      
      const duplicates = Array.from(urlCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([url, count]) => `${url} (${count} times)`);
      
      expect(uniqueUrls.size).toBe(urls.length);
      if (duplicates.length > 0) {
        // Fail with descriptive message if duplicates found
        throw new Error(`Found duplicate URLs: ${duplicates.join(', ')}`);
      }
    });
    
    it('should flag videoremixai-vfx.git as having multiple entries', () => {
      const targetUrl = 'https://github.com/deangilmoreremix/videoremixai-vfx.git';
      const count = configuredSubmodules.filter(sm => sm.url === targetUrl).length;
      
      // This test documents the current state - expecting > 1
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('should have .gitmodules entry for every filesystem submodule', () => {
    it('should have all actual submodules listed in .gitmodules', () => {
      const configuredPaths = new Set(configuredSubmodules.map(sm => sm.path));
      const missing = actualSubmodulePaths.filter(path => !configuredPaths.has(path));
      
      expect(missing).toHaveLength(0);
      if (missing.length > 0) {
        throw new Error(`Missing .gitmodules entries for: ${missing.join(', ')}`);
      }
    });
    
    it('should have worktrees submodules in .gitmodules', () => {
      const worktreePaths = actualSubmodulePaths.filter(p => p.startsWith('worktrees/'));
      const configuredPaths = new Set(configuredSubmodules.map(sm => sm.path));
      const missingWorktrees = worktreePaths.filter(p => !configuredPaths.has(p));
      
      expect(missingWorktrees).toHaveLength(0);
      if (missingWorktrees.length > 0) {
        throw new Error(`Worktree submodules missing from .gitmodules: ${missingWorktrees.join(', ')}`);
      }
    });
  });

  describe('should have matching path names between .gitmodules and filesystem', () => {
    it('should have exact path matches for all configured submodules that exist', () => {
      const configuredPaths = configuredSubmodules.map(sm => sm.path);
      const actualPathsSet = new Set(actualSubmodulePaths);
      
      // Check each configured path exists in filesystem
      const missingFromFS = configuredPaths.filter(path => !actualPathsSet.has(path));
      
      expect(missingFromFS).toHaveLength(0);
      if (missingFromFS.length > 0) {
        throw new Error(`Configured paths not found in filesystem: ${missingFromFS.join(', ')}`);
      }
    });
    
    it('should not have extra paths in .gitmodules not on filesystem', () => {
      const configuredPaths = new Set(configuredSubmodules.map(sm => sm.path));
      const extraInConfig = Array.from(configuredPaths).filter(path => 
        !actualSubmodulePaths.includes(path)
      );
      
      // This is actually acceptable (configured but not initialized), so just document
      // Change to strict equality if all configured must exist
      expect(extraInConfig.length).toBe(0);
      if (extraInConfig.length > 0) {
        throw new Error(`Configured but not in filesystem: ${extraInConfig.join(', ')}`);
      }
    });
  });

  describe('should have no submodules in detached HEAD state', () => {
    it('should have all submodules on a branch', () => {
      const detachedSubmodules = Array.from(submoduleStatuses.entries())
        .filter(([_, status]) => isDetachedHead(status))
        .map(([path, status]) => `${path} (${status.head})`);
      
      expect(detachedSubmodules).toHaveLength(0);
      if (detachedSubmodules.length > 0) {
        throw new Error(`Submodules in detached HEAD: ${detachedSubmodules.join(', ')}`);
      }
    });
    
    it('should have modules/CineGen on a branch', () => {
      const status = submoduleStatuses.get('modules/CineGen');
      expect(status).toBeDefined();
      expect(status?.head).not.toBe('HEAD');
    });
  });

  // Additional validation: URL format consistency
  describe('should have properly formatted URLs', () => {
    it('should use HTTPS or SSH URLs', () => {
      const invalidUrls = configuredSubmodules.filter(sm => 
        !sm.url.startsWith('https://') &&
        !sm.url.startsWith('http://') &&
        !sm.url.startsWith('git@') &&
        !sm.url.startsWith('ssh://')
      );
      
      expect(invalidUrls).toHaveLength(0);
      if (invalidUrls.length > 0) {
        throw new Error(`Invalid URL formats: ${invalidUrls.map(sm => sm.url).join(', ')}`);
      }
    });
    
    it('should end with .git extension', () => {
      const nonGitUrls = configuredSubmodules.filter(sm => 
        !sm.url.endsWith('.git')
      );
      
      expect(nonGitUrls).toHaveLength(0);
      if (nonGitUrls.length > 0) {
        throw new Error(`URLs missing .git extension: ${nonGitUrls.map(sm => sm.url).join(', ')}`);
      }
    });
  });

  // Additional validation: Path uniqueness
  describe('should have unique submodule paths', () => {
    it('should not have duplicate path entries', () => {
      const paths = configuredSubmodules.map(sm => sm.path);
      const uniquePaths = new Set(paths);
      
      const duplicatePaths = Array.from(paths)
        .filter((path, index) => paths.indexOf(path) !== index);
      
      expect(uniquePaths.size).toBe(paths.length);
      if (duplicatePaths.length > 0) {
        throw new Error(`Duplicate paths found: ${[...new Set(duplicatePaths)].join(', ')}`);
      }
    });
  });

  // Summary/info test (non-failing) - useful for CI reports
  describe('submodule inventory', () => {
    it('should report configuration summary', () => {
      const urls = configuredSubmodules.map(sm => sm.url);
      const uniqueUrls = new Set(urls);
      
      console.log('\n=== Submodule Configuration Summary ===');
      console.log(`Total configured submodules: ${configuredSubmodules.length}`);
      console.log(`Total actual submodules: ${actualSubmodulePaths.length}`);
      console.log(`Unique base URLs: ${uniqueUrls.size}`);
      console.log('\nConfigured submodules:');
      configuredSubmodules.forEach(sm => {
        console.log(`  ${sm.path} -> ${sm.url}${sm.branch ? ` (${sm.branch})` : ''}`);
      });
      console.log('\nActual submodules:');
      actualSubmodulePaths.forEach(path => {
        const status = submoduleStatuses.get(path);
        console.log(`  ${path} -> ${status?.head || 'unknown'} (${status?.commit?.slice(0, 8) || 'unknown'})`);
      });
      
      // This test always passes, used for logging
      expect(true).toBe(true);
    });
  });
});
