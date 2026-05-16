/**
 * Security Log Storage Service
 * Handles persistent storage of security events with retention policy
 */

import { writeFile, mkdir, readdir, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const LOG_DIR = process.env.LOG_DIR || join(__dirname, '../../logs', 'security');
const MAX_LOG_AGE_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || '90');
const LOG_FILE_PREFIX = 'security-';
const LOG_FILE_EXT = '.jsonl';

class SecurityLogStorage {
  constructor() {
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      await mkdir(LOG_DIR, { recursive: true });
      this.initialized = true;
      console.log('[SecurityLogStorage] Initialized:', LOG_DIR);

      // Clean up old logs on startup
      await this.cleanupOldLogs();
    } catch (error) {
      console.error('[SecurityLogStorage] Failed to initialize:', error);
    }
  }

  /**
   * Store a batch of security logs
   * @param {Array} logs - Array of log entries
   * @returns {Promise<{success: boolean, count: number}>}
   */
  async storeLogs(logs) {
    if (!this.initialized) {
      console.warn('[SecurityLogStorage] Not initialized, dropping logs');
      return { success: false, count: 0 };
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${LOG_FILE_PREFIX}${timestamp}${LOG_FILE_EXT}`;
      const filepath = join(LOG_DIR, filename);

      // Format logs as JSONL
      const content = logs.map(log => JSON.stringify({
        ...log,
        _storedAt: Date.now(),
        _id: this.generateLogId()
      })).join('\n');

      await writeFile(filepath, content + '\n', 'utf-8');

      // Trigger async cleanup (don't block)
      this.cleanupOldLogs().catch(console.error);

      return { success: true, count: logs.length };
    } catch (error) {
      console.error('[SecurityLogStorage] Failed to store logs:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Retrieve logs with filtering
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>}
   */
  async getLogs(filters = {}) {
    try {
      const files = await readdir(LOG_DIR);
      const logFiles = files
        .filter(f => f.startsWith(LOG_FILE_PREFIX) && f.endsWith(LOG_FILE_EXT))
        .sort()
        .reverse();

      const logs = [];
      const { level, event, startDate, endDate, limit = 1000 } = filters;

      let total = 0;
      for (const file of logFiles) {
        if (total >= limit) break;

        try {
          const content = await readFile(join(LOG_DIR, file), 'utf-8');
          const lines = content.trim().split('\n').filter(Boolean);

          for (const line of lines) {
            if (total >= limit) break;

            try {
              const log = JSON.parse(line);

              // Apply filters
              if (level && log.level !== level) continue;
              if (event && log.event !== event) continue;
              if (startDate && new Date(log.timestamp) < new Date(startDate)) continue;
              if (endDate && new Date(log.timestamp) > new Date(endDate)) continue;

              logs.push(log);
              total++;
            } catch (parseError) {
              console.error('[SecurityLogStorage] Failed to parse log line:', parseError);
            }
          }
        } catch (fileError) {
          console.error(`[SecurityLogStorage] Failed to read ${file}:`, fileError);
        }
      }

      return logs;
    } catch (error) {
      console.error('[SecurityLogStorage] Failed to retrieve logs:', error);
      return [];
    }
  }

  /**
   * Generate unique log ID
   * @private
   */
  generateLogId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Clean up logs older than retention period
   * @private
   */
  async cleanupOldLogs() {
    try {
      const files = await readdir(LOG_DIR);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - MAX_LOG_AGE_DAYS);

      let deletedCount = 0;
      for (const file of files) {
        if (!file.startsWith(LOG_FILE_PREFIX) || !file.endsWith(LOG_FILE_EXT)) {
          continue;
        }

        const filepath = join(LOG_DIR, file);
        const stats = await (await import('fs')).stat(filepath);
        const fileDate = new Date(stats.mtime);

        if (fileDate < cutoffDate) {
          await unlink(filepath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`[SecurityLogStorage] Cleaned up ${deletedCount} old log files`);
      }
    } catch (error) {
      console.error('[SecurityLogStorage] Cleanup failed:', error);
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    try {
      const files = await readdir(LOG_DIR);
      const logFiles = files.filter(f =>
        f.startsWith(LOG_FILE_PREFIX) && f.endsWith(LOG_FILE_EXT)
      );

      const totalSize = await Promise.all(
        logFiles.map(async f => {
          const stats = await (await import('fs')).stat(join(LOG_DIR, f));
          return stats.size;
        })
      );

      return {
        fileCount: logFiles.length,
        totalSizeBytes: totalSize.reduce((a, b) => a + b, 0),
        directory: LOG_DIR,
        retentionDays: MAX_LOG_AGE_DAYS
      };
    } catch (error) {
      console.error('[SecurityLogStorage] Stats failed:', error);
      return { fileCount: 0, totalSizeBytes: 0, error: error.message };
    }
  }
}

// Export singleton instance
export const securityLogStorage = new SecurityLogStorage();

// For Node.js require compatibility
export default SecurityLogStorage;
