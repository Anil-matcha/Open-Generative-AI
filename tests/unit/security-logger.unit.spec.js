import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SecurityLogger } from '../../src/lib/services/SecurityLogger.js';

describe('SecurityLogger', () => {
  let logger;
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    logger = new SecurityLogger({
      endpoint: '/test/logs',
      batchSize: 2,
      flushInterval: 1000,
      enabled: true
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    logger.clear();
  });

  describe('log levels', () => {
    it('should log info level', () => {
      logger.info('test-event', { data: 'test' });
      expect(logger.logBuffer.length).toBe(1);
    });

    it('should log warn level', () => {
      logger.warn('warning-event', { data: 'test' });
      expect(logger.logBuffer.length).toBe(1);
    });

    it('should log error level', () => {
      logger.error('error-event', { data: 'test' });
      expect(logger.logBuffer.length).toBe(1);
    });

    it('should log security level', () => {
      logger.security('security-event', { data: 'test' });
      expect(logger.logBuffer.length).toBe(1);
    });
  });

  describe('data sanitization', () => {
    it('should redact passwords', () => {
      const result = logger.sanitizeDetails({ password: 'secret123', other: 'value' });
      expect(result.password).toBe('[REDACTED]');
      expect(result.other).toBe('value');
    });

    it('should redact tokens', () => {
      const result = logger.sanitizeDetails({ token: 'abc123', key: 'xyz789' });
      expect(result.token).toBe('[REDACTED]');
      expect(result.key).toBe('[REDACTED]');
    });

    it('should redact secrets', () => {
      const result = logger.sanitizeDetails({ secret: 'hidden', public: 'visible' });
      expect(result.secret).toBe('[REDACTED]');
      expect(result.public).toBe('visible');
    });
  });

  describe('batching', () => {
    it('should flush when batch size is reached', async () => {
      logger.log('info', 'event1', {});
      logger.log('info', 'event2', {});
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('disabled logging', () => {
    it('should not log when disabled', () => {
      const disabledLogger = new SecurityLogger({ enabled: false });
      disabledLogger.log('info', 'test-event', {});
      expect(disabledLogger.logBuffer.length).toBe(0);
    });
  });
});