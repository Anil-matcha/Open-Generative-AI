/**
 * Unit tests for SecurityLogger
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SecurityLogger } from '../../src/lib/services/SecurityLogger.js';

// Mock fetch globally
global.fetch = vi.fn();

// Mock window and navigator for Node.js environment
const mockWindow = {
  addEventListener: vi.fn(),
  location: { href: 'http://localhost:3000/test', pathname: '/test' }
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  onLine: true,
  sendBeacon: vi.fn(() => true)
};

describe('SecurityLogger', () => {
  let logger;
  let mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = global.fetch as any;
    mockFetch.mockClear();

    // Setup global mocks
    (global as any).window = mockWindow;
    (global as any).navigator = mockNavigator;
    (global as any).document = {
      addEventListener: vi.fn(),
      visibilityState: 'visible'
    };
    (global as any).process = { env: { NODE_ENV: 'test' } };

    logger = new SecurityLogger({
      endpoint: '/api/security/logs',
      batchSize: 2, // Small batch for testing
      flushInterval: 5000,
      enabled: true
    });
  });

  afterEach(() => {
    logger.destroy();
    delete (global as any).window;
    delete (global as any).navigator;
    delete (global as any).document;
  });

  describe('initialization', () => {
    it('should create instance with default options', () => {
      const defaultLogger = new SecurityLogger();

      expect(defaultLogger.endpoint).toBe('/api/security/logs');
      expect(defaultLogger.batchSize).toBe(10);
      expect(defaultLogger.flushInterval).toBe(5000);
      expect(defaultLogger.enabled).toBe(true);

      defaultLogger.destroy();
    });

    it('should accept custom options', () => {
      const customLogger = new SecurityLogger({
        endpoint: '/custom/logs',
        batchSize: 20,
        serviceName: 'test-service',
        enabled: false
      });

      expect(customLogger.endpoint).toBe('/custom/logs');
      expect(customLogger.batchSize).toBe(20);
      expect(customLogger.serviceName).toBe('test-service');
      expect(customLogger.enabled).toBe(false);

      customLogger.destroy();
    });

    it('should initialize flush timer in browser', () => {
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      logger.logBuffer = []; // Clear buffer
    });

    it('should log info events', () => {
      logger.info('test_event', { key: 'value' });

      expect(logger.logBuffer.length).toBe(1);
      const entry = logger.logBuffer[0];
      expect(entry.level).toBe('info');
      expect(entry.event).toBe('test_event');
      expect(entry.details).toEqual({ key: 'value' });
    });

    it('should log warn events', () => {
      logger.warn('warning_event', { message: 'test warning' });

      expect(logger.logBuffer[0].level).toBe('warn');
    });

    it('should log error events', () => {
      logger.error('error_event', { error: 'test error' });

      expect(logger.logBuffer[0].level).toBe('error');
    });

    it('should log security events', () => {
      logger.security('auth_failure', { username: 'admin' });

      expect(logger.logBuffer[0].level).toBe('security');
      expect(logger.logBuffer[0].event).toBe('auth_failure');
    });

    it('should not log when disabled', () => {
      logger.disable();
      logger.info('test_event', {});

      expect(logger.logBuffer.length).toBe(0);
    });

    it('should sanitize sensitive details', () => {
      logger.security('login', {
        username: 'user',
        password: 'secret123',
        token: 'eyJhbGciOiJIUzI1NiIs',
        apiKey: 'sk-1234567890',
        normalField: 'safe'
      });

      const entry = logger.logBuffer[0];
      expect(entry.details.password).toBe('[REDACTED]');
      expect(entry.details.token).toBe('[REDACTED]');
      expect(entry.details.apiKey).toBe('[REDACTED]');
      expect(entry.details.username).toBe('user');
      expect(entry.details.normalField).toBe('safe');
    });

    it('should redact nested objects', () => {
      logger.security('test', {
        config: { debug: true },
        data: [1, 2, 3]
      });

      const entry = logger.logBuffer[0];
      expect(entry.details.config).toBe('[OBJECT]');
      expect(entry.details.data).toBe('[ARRAY]');
    });

    it('should include timestamp and metadata', () => {
      logger.info('test', {});

      const entry = logger.logBuffer[0];
      expect(entry.timestamp).toBeDefined();
      expect(entry.service).toBe('higgsfield-client');
      expect(entry.userAgent).toContain('Mozilla');
      expect(entry.url).toBe('http://localhost:3000/test');
    });
  });

  describe('flush', () => {
    beforeEach(() => {
      logger.logBuffer = [];
    });

    it('should send logs to backend endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      logger.logBuffer = [{
        timestamp: new Date().toISOString(),
        level: 'info',
        event: 'test',
        service: 'test',
        details: {}
      }];

      await logger.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/security/logs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should not flush when already flushing', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      logger.logBuffer = [{ test: 1 }, { test: 2 }];
      logger.isFlushing = true;

      // Start first flush (won't complete)
      logger.flush();

      // Second flush should be skipped
      await logger.flush();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      logger.logBuffer = [{
        timestamp: new Date().toISOString(),
        level: 'info',
        event: 'test',
        service: 'test',
        details: {}
      }];

      await logger.flush();

      expect(logger.logBuffer.length).toBe(1); // Re-queued
    });

    it('should not flush empty buffer', async () => {
      await logger.flush();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should clear buffer after successful flush', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      logger.logBuffer = [{
        timestamp: new Date().toISOString(),
        level: 'info',
        event: 'test',
        service: 'test',
        details: {}
      }];

      await logger.flush();

      expect(logger.logBuffer.length).toBe(0);
    });
  });

  describe('flushSync', () => {
    beforeEach(() => {
      logger.logBuffer = [];
    });

    it('should use sendBeacon if available', () => {
      logger.logBuffer = [{ test: 1 }];

      logger.flushSync();

      expect(mockNavigator.sendBeacon).toHaveBeenCalledWith(
        'http://localhost:3001/api/security/logs',
        expect.any(Blob)
      );
    });

    it('should fallback to synchronous XHR if sendBeacon unavailable', () => {
      const originalSendBeacon = mockNavigator.sendBeacon;
      mockNavigator.sendBeacon = () => false;

      const mockXHR = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn()
      };
      vi.spyOn(window, 'XMLHttpRequest').mockImplementation(() => mockXHR as any);

      logger.logBuffer = [{ test: 1 }];
      logger.flushSync();

      expect(mockXHR.open).toHaveBeenCalledWith('POST', expect.any(String), false);
    });
  });

  describe('enable/disable', () => {
    it('should disable logging', () => {
      logger.disable();
      expect(logger.enabled).toBe(false);

      logger.info('test', {});
      expect(logger.logBuffer.length).toBe(0);
    });

    it('should enable logging', () => {
      logger.disable();
      logger.enable();
      expect(logger.enabled).toBe(true);

      logger.info('test', {});
      expect(logger.logBuffer.length).toBe(1);
    });
  });

  describe('getStatus', () => {
    it('should return status object', () => {
      const status = logger.getStatus();

      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('bufferSize');
      expect(status).toHaveProperty('batchSize');
      expect(status).toHaveProperty('isFlushing');
      expect(status).toHaveProperty('flushInterval');
    });
  });
});
