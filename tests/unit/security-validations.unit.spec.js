/**
 * Security Validations Unit Tests
 * Tests input sanitization, XSS prevention, URL validation, and security utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  safeSetText,
  createSafeElement,
  createSafeImage,
  createSafeVideo,
  createSafeSVG,
  createSafeButton,
  setChildren,
  createSafeCard,
  escapeHtml,
  safeHtml,
  sanitizeUrl,
  validateFileUpload,
  generateSecureId,
  sanitizeForSerialization,
  validateEmail,
  validateURL,
  sanitizeFilename,
  secureApiRequest
} from '../../src/lib/security.js';

import {
  enforceHTTPS,
  generateCSPHeader,
  sanitizeHTML,
  sanitizeURL as sanitizeURLFromIndex,
  createSecureIframe,
  validateEnvironment,
  RateLimiter,
  secureStorage,
  setupCSPViolationReporting,
  initializeSecurity
} from '../../src/lib/security/index.js';

describe('DOM Safety Functions', () => {
  let mockElement;

  beforeEach(() => {
    mockElement = {
      textContent: '',
      className: '',
      appendChild: vi.fn(),
      innerHTML: ''
    };
    document.createElement = vi.fn(() => mockElement);
    document.createElementNS = vi.fn(() => mockElement);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('safeSetText', () => {
    it('should set text content safely', () => {
      safeSetText(mockElement, 'Hello <script>alert("xss")</script> World');
      expect(mockElement.textContent).toBe('Hello <script>alert("xss")</script> World');
    });

    it('should handle null element gracefully', () => {
      expect(() => safeSetText(null, 'test')).not.toThrow();
    });

    it('should handle undefined text gracefully', () => {
      safeSetText(mockElement, undefined);
      expect(mockElement.textContent).toBe('');
    });
  });

  describe('createSafeElement', () => {
    it('should create element with escaped text content', () => {
      const element = createSafeElement('div', 'Hello <b>World</b>', 'test-class');

      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(element.textContent).toBe('Hello <b>World</b>');
      expect(element.className).toBe('test-class');
    });
  });

  describe('createSafeImage', () => {
    it('should create image element safely', () => {
      const img = createSafeImage('test.jpg', 'Test image', 'img-class');

      expect(document.createElement).toHaveBeenCalledWith('img');
      expect(img.src).toBe('test.jpg');
      expect(img.alt).toBe('Test image');
      expect(img.className).toBe('img-class');
    });

    it('should handle empty alt text', () => {
      const img = createSafeImage('test.jpg');
      expect(img.alt).toBe('');
    });
  });

  describe('createSafeSVG', () => {
    it('should create SVG element safely', () => {
      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>';
      const container = createSafeSVG(svgContent, 'svg-class');

      expect(container.tagName.toLowerCase()).toBe('div');
      expect(container.className).toBe('svg-class');
    });

    it('should reject invalid SVG content', () => {
      const invalidSvg = 'not-svg-content';
      expect(() => createSafeSVG(invalidSvg)).toThrow('Invalid SVG content provided');
    });
  });

  describe('createSafeButton', () => {
    it('should create button with escaped text', () => {
      const btn = createSafeButton('Click <i>me</i>', 'btn-class');

      expect(document.createElement).toHaveBeenCalledWith('button');
      expect(btn.type).toBe('button');
      expect(btn.textContent).toBe('Click <i>me</i>');
      expect(btn.className).toBe('btn-class');
    });
  });

  describe('setChildren', () => {
    it('should replace all children safely', () => {
      const parent = { innerHTML: '<old>content</old>', appendChild: vi.fn() };
      const child1 = document.createElement('div');
      const child2 = document.createElement('span');

      setChildren(parent, [child1, child2]);

      expect(parent.innerHTML).toBe('');
      expect(parent.appendChild).toHaveBeenCalledWith(child1);
      expect(parent.appendChild).toHaveBeenCalledWith(child2);
    });
  });

  describe('createSafeCard', () => {
    it('should create card with safe content', () => {
      const card = createSafeCard({
        title: 'Test <script>alert("xss")</script>Title',
        subtitle: 'Test Subtitle',
        imageUrl: 'test.jpg',
        className: 'card-class'
      });

      expect(card.className).toBe('card-class');
      // Should contain image and text elements
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>&"\'';
      const escaped = escapeHtml(input);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&quot;&#x27;');
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml(123)).toBe('');
    });
  });

  describe('safeHtml', () => {
    it('should sanitize HTML content', () => {
      const dangerousHtml = '<script>alert("xss")</script><p>Safe content</p><img src="test.jpg" onerror="alert(\'xss\')">';
      const sanitized = safeHtml(dangerousHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).toContain('<p>Safe content</p>');
      expect(sanitized).toContain('<img src="test.jpg"');
    });
  });
});

describe('URL and File Security', () => {
  describe('sanitizeUrl', () => {
    it('should allow valid HTTPS URLs', () => {
      const url = 'https://example.com/path?param=value';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should allow valid HTTP URLs', () => {
      const url = 'http://localhost:3000/api';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should reject invalid protocols', () => {
      expect(sanitizeUrl('javascript:alert("xss")')).toBeNull();
      expect(sanitizeUrl('data:text/html,<script>alert("xss")</script>')).toBeNull();
    });

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/api/users')).toBe('/api/users');
      expect(sanitizeUrl('users/123')).toBe('users/123');
    });

    it('should reject URLs with disallowed domains', () => {
      const options = { allowedDomains: ['trusted.com'] };
      expect(sanitizeUrl('https://malicious.com', options)).toBeNull();
      expect(sanitizeUrl('https://trusted.com', options)).toBe('https://trusted.com');
    });
  });

  describe('validateFileUpload', () => {
    it('should validate allowed file types', () => {
      const file = {
        name: 'test.jpg',
        size: 1024 * 500, // 500KB
        type: 'image/jpeg'
      };

      const result = validateFileUpload(file);
      expect(result.valid).toBe(true);
    });

    it('should reject oversized files', () => {
      const largeFile = {
        name: 'large.jpg',
        size: 20 * 1024 * 1024, // 20MB
        type: 'image/jpeg'
      };

      const result = validateFileUpload(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds');
    });

    it('should reject disallowed file types', () => {
      const exeFile = {
        name: 'malware.exe',
        size: 1024,
        type: 'application/x-msdownload'
      };

      const result = validateFileUpload(exeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File type not allowed');
    });

    it('should reject files with wrong extensions', () => {
      const fakeJpg = {
        name: 'malware.jpg',
        size: 1024,
        type: 'image/jpeg'
      };
      // Mock file with wrong extension
      fakeJpg.name = 'malware.exe';

      const result = validateFileUpload(fakeJpg);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File extension not allowed');
    });

    it('should handle missing files', () => {
      const result = validateFileUpload(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No file provided');
    });
  });
});

describe('Utility Functions', () => {
  describe('generateSecureId', () => {
    it('should generate cryptographically secure IDs', () => {
      const id1 = generateSecureId();
      const id2 = generateSecureId();

      expect(id1).not.toBe(id2);
      expect(id1.length).toBe(32); // 16 bytes * 2 hex chars
      expect(/^[a-f0-9]+$/.test(id1)).toBe(true);
    });

    it('should generate IDs of specified length', () => {
      const id = generateSecureId(8);
      expect(id.length).toBe(16); // 8 bytes * 2 hex chars
    });
  });

  describe('sanitizeForSerialization', () => {
    it('should remove functions and DOM elements', () => {
      const obj = {
        name: 'test',
        func: () => 'test',
        element: document.createElement('div'),
        nested: {
          value: 'safe',
          func: function() { return 'unsafe'; }
        }
      };

      const sanitized = sanitizeForSerialization(obj);

      expect(sanitized.name).toBe('test');
      expect(sanitized.func).toBeUndefined();
      expect(sanitized.element).toBeUndefined();
      expect(sanitized.nested.value).toBe('safe');
      expect(sanitized.nested.func).toBeUndefined();
    });

    it('should handle arrays', () => {
      const arr = [1, () => 'func', document.createElement('div'), 'safe'];
      const sanitized = sanitizeForSerialization(arr);

      expect(sanitized).toEqual([1, undefined, undefined, 'safe']);
    });
  });
});

describe('Security Index Functions', () => {
  describe('enforceHTTPS', () => {
    let mockWindow;

    beforeEach(() => {
      mockWindow = {
        location: {
          protocol: 'http:',
          hostname: 'example.com',
          href: 'http://example.com/page'
        }
      };
      global.window = mockWindow;
    });

    it('should redirect to HTTPS in production', () => {
      enforceHTTPS();
      expect(mockWindow.location.href).toBe('https://example.com/page');
    });

    it('should not redirect localhost', () => {
      mockWindow.location.hostname = 'localhost';
      enforceHTTPS();
      expect(mockWindow.location.href).toBe('http://localhost/page');
    });
  });

  describe('generateCSPHeader', () => {
    it('should generate valid CSP header', () => {
      const csp = generateCSPHeader();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("object-src 'none'");
    });
  });

  describe('sanitizeHTML', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeHTML(input);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
  });

  describe('validateEmail', () => {
    it('should validate email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('should validate URL formats', () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://localhost:3000')).toBe(true);
      expect(validateURL('not-a-url')).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filenames', () => {
      expect(sanitizeFilename('safe-file.jpg')).toBe('safe-file.jpg');
      expect(sanitizeFilename('dangerous/file\\with*chars?.txt')).toBe('dangerous_file_with__chars_.txt');
    });
  });

  describe('secureApiRequest', () => {
    it('should validate URLs before making requests', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      await expect(secureApiRequest('invalid-url')).rejects.toThrow('Invalid URL provided');
    });

    it('should enforce HTTPS in production', async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await expect(secureApiRequest('http://example.com')).rejects.toThrow('Insecure API requests not allowed in production');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limits', () => {
      const limiter = new RateLimiter(2, 1000); // 2 requests per second

      expect(limiter.isAllowed()).toBe(true);
      expect(limiter.isAllowed()).toBe(true);
      expect(limiter.isAllowed()).toBe(false); // Third request denied
    });

    it('should reset after window expires', () => {
      vi.useFakeTimers();
      const limiter = new RateLimiter(1, 1000);

      expect(limiter.isAllowed()).toBe(true);
      expect(limiter.isAllowed()).toBe(false);

      vi.advanceTimersByTime(1000);

      expect(limiter.isAllowed()).toBe(true); // Should allow after window reset

      vi.useRealTimers();
    });
  });

  describe('secureStorage', () => {
    it('should store and retrieve items securely', () => {
      const testData = { token: 'secret-token', expires: Date.now() };

      secureStorage.setItem('test', testData);
      const retrieved = secureStorage.getItem('test');

      expect(retrieved).toEqual(testData);
    });

    it('should handle storage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => { throw new Error('Storage full'); });

      expect(() => secureStorage.setItem('test', 'data')).not.toThrow();

      // Restore original
      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle retrieval errors gracefully', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => { throw new Error('Storage error'); });

      expect(secureStorage.getItem('test')).toBeNull();

      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('validateEnvironment', () => {
    it('should validate environment variables', () => {
      const result = validateEnvironment();

      expect(result).toHaveProperty('isProduction');
      expect(result).toHaveProperty('isDevelopment');
      expect(result).toHaveProperty('missingVars');
    });
  });
});

describe('Initialization', () => {
  it('should initialize security measures', () => {
    const mockWindow = {
      addEventListener: vi.fn(),
      location: { protocol: 'https:' }
    };
    global.window = mockWindow;

    const result = initializeSecurity();

    expect(result).toHaveProperty('isProduction');
    expect(result).toHaveProperty('isDevelopment');
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('securitypolicyviolation', expect.any(Function));
  });
});