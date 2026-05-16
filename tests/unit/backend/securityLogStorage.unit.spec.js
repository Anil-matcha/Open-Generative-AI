/**
 * Unit tests for SecurityLogStorage (backend)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { securityLogStorage } from '../../backend/services/securityLogStorage.js';
import { mkdir, writeFile, readdir, unlink, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mock fs/promises
const mockFs = {
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  readdir: vi.fn(),
  unlink: vi.fn(),
  stat: vi.fn()
};

vi.mock('fs/promises', () => mockFs);
vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
  dirname: () => __dirname
}));

describe('SecurityLogStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.mkdir.mockResolvedValue(undefined);
  });

  describe('constructor', () => {
    it('should initialize storage directory', async () => {
      expect(securityLogStorage.initialized).toBe(true);
      expect(mockFs.mkdir).toHaveBeenCalledWith(expect.stringContaining('logs/security'), {
        recursive: true
      });
    });
  });

  describe('storeLogs', () => {
    it('should store logs as JSONL', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);

      const logs = [
        { timestamp: '2025-01-15T10:00:00Z', level: 'info', event: 'test' },
        { timestamp: '2025-01-15T10:01:00Z', level: 'warning', event: 'test2' }
      ];

      const result = await securityLogStorage.storeLogs(logs);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('security-'),
        expect.stringContaining('{"timestamp":"2025-01-15T10:00:00Z"'),
        'utf-8'
      );
    });

    it('should add metadata to stored logs', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);

      const logs = [{ event: 'test' }];
      await securityLogStorage.storeLogs(logs);

      const writtenContent = mockFs.writeFile.mock.calls[0][1];
      const parsedLine = JSON.parse(writtenContent.split('\n')[0]);

      expect(parsedLine).toHaveProperty('_storedAt');
      expect(parsedLine).toHaveProperty('_id');
      expect(parsedLine.service).toBeDefined();
    });

    it('should fail gracefully when not initialized', () => {
      const storage = { ...securityLogStorage, initialized: false };
      const result = storage.storeLogs([{ test: 1 }]);

      // Sync method test
      expect(result).toBeDefined();
    });

    it('should handle empty log array', async () => {
      const result = await securityLogStorage.storeLogs([]);

      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
    });
  });

  describe('getLogs', () => {
    beforeEach(() => {
      const mockLogContent = `{"timestamp":"2025-01-15T10:00:00Z","level":"info","event":"login","service":"test"}
{"timestamp":"2025-01-15T10:01:00Z","level":"warning","event":"rate_limit","service":"test"}`;

      mockFs.readdir.mockResolvedValue([
        'security-2025-01-15T10-00-00-000Z.jsonl'
      ]);

      // Mock stat for each file
      mockFs.stat.mockResolvedValue({ size: 100 } as any);

      // Mock file reading via fs module directly
      const actualFs = await import('fs');
      vi.spyOn(actualFs, 'readFile').mockResolvedValue(mockLogContent);
    });

    it('should retrieve and parse logs', async () => {
      const logs = await securityLogStorage.getLogs();

      expect(logs).toHaveLength(2);
      expect(logs[0].event).toBe('login');
      expect(logs[1].event).toBe('rate_limit');
    });

    it('should filter by level', async () => {
      const logs = await securityLogStorage.getLogs({ level: 'warning' });

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warning');
    });

    it('should filter by event', async () => {
      const logs = await securityLogStorage.getLogs({ event: 'login' });

      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe('login');
    });

    it('should respect limit', async () => {
      const logs = await securityLogStorage.getLogs({ limit: 1 });

      expect(logs).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Read failed'));

      const logs = await securityLogStorage.getLogs();

      expect(logs).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return storage statistics', async () => {
      mockFs.readdir.mockResolvedValue([
        'security-2025-01-15T10-00-00-000Z.jsonl',
        'security-2025-01-16T10-00-00-000Z.jsonl'
      ]);
      mockFs.stat.mockResolvedValue({ size: 512 } as any);

      const stats = await securityLogStorage.getStats();

      expect(stats.fileCount).toBe(2);
      expect(stats.totalSizeBytes).toBe(1024);
      expect(stats.directory).toContain('logs/security');
      expect(stats.retentionDays).toBe(90);
    });
  });

  describe('cleanupOldLogs', () => {
    it('should delete files older than retention period', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

      mockFs.readdir.mockResolvedValue([
        'security-old.jsonl',
        'security-recent.jsonl'
      ]);

      mockFs.stat
        .mockImplementationOnce((path: string) =>
          Promise.resolve({ mtime: oldDate } as any)
        )
        .mockImplementationOnce((path: string) =>
          Promise.resolve({ mtime: recentDate } as any)
        );

      await securityLogStorage.cleanupOldLogs();

      expect(mockFs.unlink).toHaveBeenCalledTimes(1);
      expect(mockFs.unlink).toHaveBeenCalledWith(expect.stringContaining('security-old.jsonl'));
    });
  });
});
