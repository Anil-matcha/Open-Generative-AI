/**
 * Security Unit Tests
 * Tests for CSRF protection, input validation, and security utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputValidator } from '../../src/lib/inputValidation.js';
import { csrfProtection } from '../../src/lib/csrf.js';
import { secureStorage } from '../../src/lib/security/index.js';

describe('Input Validation', () => {
  describe('validatePrompt', () => {
    it('should accept valid prompts', () => {
      const result = InputValidator.validatePrompt('A beautiful sunset over mountains');
      expect(result).toBe('A beautiful sunset over mountains');
    });

    it('should reject empty prompts', () => {
      expect(() => InputValidator.validatePrompt('')).toThrow('Prompt is required');
    });

    it('should reject prompts exceeding max length', () => {
      const longPrompt = 'a'.repeat(4097);
      expect(() => InputValidator.validatePrompt(longPrompt)).toThrow('exceeds maximum length');
    });

    it('should trim whitespace from prompts', () => {
      const result = InputValidator.validatePrompt('  test prompt  ');
      expect(result).toBe('test prompt');
    });
  });

  describe('validateImageUrl', () => {
    it('should accept valid HTTPS URLs', () => {
      const result = InputValidator.validateImageUrl('https://example.com/image.jpg');
      expect(result).toBe('https://example.com/image.jpg');
    });

    it('should reject HTTP URLs', () => {
      expect(() => InputValidator.validateImageUrl('http://example.com/image.jpg')).toThrow('Only HTTPS URLs');
    });

    it('should reject invalid URLs', () => {
      expect(() => InputValidator.validateImageUrl('not-a-url')).toThrow('Invalid URL');
    });
  });

  describe('validateGuidanceScale', () => {
    it('should accept valid guidance scale values', () => {
      expect(InputValidator.validateGuidanceScale(7.5)).toBe(7.5);
      expect(InputValidator.validateGuidanceScale(1)).toBe(1);
      expect(InputValidator.validateGuidanceScale(20)).toBe(20);
    });

    it('should reject values outside valid range', () => {
      expect(() => InputValidator.validateGuidanceScale(0)).toThrow('must be between 1 and 20');
      expect(() => InputValidator.validateGuidanceScale(21)).toThrow('must be between 1 and 20');
    });
  });

  describe('validateSteps', () => {
    it('should accept valid step values', () => {
      expect(InputValidator.validateSteps(50)).toBe(50);
      expect(InputValidator.validateSteps(1)).toBe(1);
      expect(InputValidator.validateSteps(200)).toBe(200);
    });

    it('should reject values outside valid range', () => {
      expect(() => InputValidator.validateSteps(0)).toThrow('must be between 1 and 200');
      expect(() => InputValidator.validateSteps(201)).toThrow('must be between 1 and 200');
    });
  });

  describe('validateSeed', () => {
    it('should accept valid seed values', () => {
      expect(InputValidator.validateSeed(12345)).toBe(12345);
      expect(InputValidator.validateSeed(0)).toBe(0);
    });

    it('should floor decimal values', () => {
      expect(InputValidator.validateSeed(123.9)).toBe(123);
    });

    it('should reject negative seeds', () => {
      expect(() => InputValidator.validateSeed(-1)).toThrow('must be between 0 and 2147483647');
    });

    it('should reject seeds exceeding max', () => {
      expect(() => InputValidator.validateSeed(2147483648)).toThrow('must be between 0 and 2147483647');
    });
  });
});

describe('CSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a token', () => {
      const token = csrfProtection.generateToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(64);
    });
  });

  describe('getToken', () => {
    it('should return existing token if available', () => {
      const token1 = csrfProtection.generateToken();
      const token2 = csrfProtection.getToken();
      expect(token2).toBe(token1);
    });
  });

  describe('validateToken', () => {
    it('should validate correct token', () => {
      const token = csrfProtection.generateToken();
      expect(csrfProtection.validateToken(token)).toBe(true);
    });

    it('should reject incorrect token', () => {
      csrfProtection.generateToken();
      expect(csrfProtection.validateToken('wrong-token')).toBe(false);
    });
  });

  describe('attachToRequest', () => {
    it('should add CSRF header to request options', () => {
      const token = csrfProtection.generateToken();
      const options = csrfProtection.attachToRequest({ method: 'POST' });
      expect(options.headers['X-CSRF-Token']).toBe(token);
    });
  });

  describe('validateRequest', () => {
    it('should validate request with correct token', () => {
      const token = csrfProtection.generateToken();
      const result = csrfProtection.validateRequest({
        headers: { 'X-CSRF-Token': token }
      });
      expect(result.valid).toBe(true);
    });

    it('should reject request with missing token', () => {
      const result = csrfProtection.validateRequest({ headers: {} });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('CSRF token missing');
    });

    it('should reject request with invalid token', () => {
      csrfProtection.generateToken();
      const result = csrfProtection.validateRequest({
        headers: { 'X-CSRF-Token': 'wrong-token' }
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('CSRF token invalid');
    });
  });
});

describe('Security Utilities', () => {
  describe('secureStorage', () => {
    it('should set and get items', () => {
      secureStorage.setItem('testKey', { value: 'test' });
      const result = secureStorage.getItem('testKey');
      expect(result).toEqual({ value: 'test' });
    });

    it('should handle JSON serialization', () => {
      const obj = { nested: { value: 123 } };
      secureStorage.setItem('nested', obj);
      const result = secureStorage.getItem('nested');
      expect(result).toEqual(obj);
    });
  });
});