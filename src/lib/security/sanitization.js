/**
 * Security Utilities - Input Sanitization and XSS Protection
 */

import DOMPurify from 'dompurify';

// Security configuration
const SANITIZATION_CONFIG = {
  // Default config for general text input
  TEXT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false
  },

  // Config for HTML content that allows some formatting
  HTML: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false
  },

  // Config for rich text with links
  RICH_TEXT: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false
  }
};

/**
 * Sanitize plain text input - removes all HTML
 * @param {string} input - Raw input string
 * @returns {string} - Sanitized text
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(input, SANITIZATION_CONFIG.TEXT);
}

/**
 * Sanitize HTML content with limited tags allowed
 * @param {string} input - HTML input string
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHtml(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(input, SANITIZATION_CONFIG.HTML);
}

/**
 * Sanitize rich text with links and formatting
 * @param {string} input - Rich text input
 * @returns {string} - Sanitized rich text
 */
export function sanitizeRichText(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // First sanitize with rich text config
  let sanitized = DOMPurify.sanitize(input, SANITIZATION_CONFIG.RICH_TEXT);

  // Additional security: ensure links have safe protocols and attributes
  sanitized = sanitized.replace(/<a([^>]*)href=["']([^"']*)["']([^>]*)>/gi, (match, before, href, after) => {
    // Only allow http, https, mailto protocols
    if (!href.match(/^(https?:|mailto:)/i)) {
      return ''; // Remove unsafe links
    }

    // Add security attributes
    return `<a${before}href="${href}"${after} target="_blank" rel="noopener noreferrer">`;
  });

  return sanitized;
}

/**
 * Sanitize AI-generated content with special handling
 * @param {string} content - AI-generated content
 * @param {string} contentType - Type of content ('text', 'html', 'json')
 * @returns {string} - Sanitized content
 */
export function sanitizeAIGeneratedContent(content, contentType = 'text') {
  if (typeof content !== 'string') {
    return '';
  }

  // Remove potential prompt injection attempts
  content = content.replace(/(\[|\{|\()?(system|user|assistant|human):.*(\]|\}|\))?/gi, '');

  // Remove script tags and event handlers
  content = content.replace(/<script[^>]*>.*?<\/script>/gi, '');
  content = content.replace(/on\w+="[^"]*"/gi, '');
  content = content.replace(/on\w+='[^']*'/gi, '');

  switch (contentType) {
    case 'html':
      return sanitizeHtml(content);
    case 'rich':
      return sanitizeRichText(content);
    case 'json':
      // For JSON content, parse and sanitize string values
      try {
        const parsed = JSON.parse(content);
        const sanitized = sanitizeObjectStrings(parsed);
        return JSON.stringify(sanitized);
      } catch {
        return sanitizeText(content);
      }
    default:
      return sanitizeText(content);
  }
}

/**
 * Recursively sanitize string values in objects/arrays
 * @param {any} obj - Object or array to sanitize
 * @returns {any} - Sanitized object/array
 */
function sanitizeObjectStrings(obj) {
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectStrings(item));
  }

  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip sensitive keys that shouldn't be sanitized
      if (['password', 'token', 'key', 'secret'].includes(key.toLowerCase())) {
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeObjectStrings(value);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate and sanitize user prompts for AI services
 * @param {string} prompt - User prompt
 * @returns {string} - Sanitized prompt
 */
export function sanitizeUserPrompt(prompt) {
  if (typeof prompt !== 'string') {
    throw new Error('Prompt must be a string');
  }

  // Remove potentially dangerous patterns
  let sanitized = prompt
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:(?!image\/)/gi, '') // Remove data URLs except images
    .replace(/vbscript:/gi, '') // Remove vbscript URLs
    .replace(/on\w+=/gi, ''); // Remove event handlers

  // Limit length to prevent DoS
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000) + '...';
  }

  return sanitized.trim();
}

/**
 * Create a safe HTML element from sanitized content
 * @param {string} html - Sanitized HTML string
 * @returns {HTMLElement} - Safe DOM element
 */
export function createSafeElement(html) {
  const sanitized = sanitizeHtml(html);
  const template = document.createElement('template');
  template.innerHTML = sanitized;
  return template.content.firstElementChild;
}

/**
 * Validate file content for potential XSS
 * @param {File} file - File to validate
 * @returns {Promise<boolean>} - True if file appears safe
 */
export async function validateFileContent(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;

      // Check for script tags, event handlers, etc.
      const dangerousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /on\w+=["'][^"']*["']/gi,
        /<iframe[^>]*>/gi,
        /<object[^>]*>/gi,
        /<embed[^>]*>/gi
      ];

      const hasDangerousContent = dangerousPatterns.some(pattern => pattern.test(content));
      resolve(!hasDangerousContent);
    };

    reader.onerror = () => resolve(false);

    // Read first 1MB to check for dangerous content
    const slice = file.slice(0, 1024 * 1024);
    reader.readAsText(slice);
  });
}

// Export additional utilities
export { DOMPurify };

// Security monitoring
export class SecurityMonitor {
  constructor() {
    this.violations = [];
  }

  reportViolation(type, details) {
    const violation = {
      type,
      details,
      timestamp: Date.now(),
      url: window.location.href
    };

    this.violations.push(violation);

    // In production, send to security monitoring service
    console.warn('Security violation detected:', violation);

    // Limit stored violations to prevent memory leaks
    if (this.violations.length > 100) {
      this.violations = this.violations.slice(-50);
    }
  }

  getViolations() {
    return [...this.violations];
  }

  clearViolations() {
    this.violations = [];
  }
}

export const securityMonitor = new SecurityMonitor();

// CSP violation handler
if (typeof window !== 'undefined') {
  document.addEventListener('securitypolicyviolation', (event) => {
    securityMonitor.reportViolation('csp', {
      violatedDirective: event.violatedDirective,
      blockedURI: event.blockedURI,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber
    });
  });
}