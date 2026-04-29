/**
 * Security utilities for hardening the application
 */

// HTTPS Enforcement
export function enforceHTTPS() {
  if (typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
    window.location.href = window.location.href.replace('http:', 'https:');
  }
}

// Content Security Policy
export const CSP_POLICY = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
  'style-src': "'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://fonts.googleapis.com",
  'img-src': "'self' data: https: blob:",
  'font-src': "'self' https://fonts.gstatic.com data:",
  'connect-src': "'self' https: wss:",
  'media-src': "'self' https: blob: data:",
  'object-src': "'none'",
  'frame-src': "'self' https:",
  'base-uri': "'self'",
  'form-action': "'self'",
  'frame-ancestors': "'none'"
};

export function generateCSPHeader() {
  return Object.entries(CSP_POLICY)
    .map(([directive, value]) => `${directive} ${value}`)
    .join('; ');
}

// Input Sanitization
export function sanitizeHTML(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeURL(url) {
  if (typeof url !== 'string') return '';
  // Only allow http/https protocols
  if (!url.match(/^https?:\/\//i)) {
    return '';
  }
  return url;
}

// Secure iframe handling
export function createSecureIframe(src, options = {}) {
  const iframe = document.createElement('iframe');
  
  // Only allow HTTPS URLs in production
  const isProduction = typeof process !== 'undefined' && process.env ? process.env.NODE_ENV === 'production' : false;
  if (isProduction && src && !src.startsWith('https://')) {
    throw new Error('Insecure iframe source not allowed in production');
  }
  
  iframe.src = src;
  iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';
  
  if (options.className) iframe.className = options.className;
  if (options.width) iframe.width = options.width;
  if (options.height) iframe.height = options.height;
  
  return iframe;
}

// Environment validation
export function validateEnvironment() {
  // Handle both Node.js and browser environments
  const env = typeof process !== 'undefined' && process.env ? process.env :
             (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {});

  const nodeEnv = env.NODE_ENV || env.MODE || 'development';
  const requiredVars = ['NODE_ENV'];
  const missing = requiredVars.filter(varName => !env[varName] && !env.MODE);

  if (missing.length > 0) {
    console.warn('Missing required environment variables:', missing);
  }

  return {
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    missingVars: missing
  };
}

// Rate limiting helper
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  isAllowed() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}

// Secure localStorage wrapper
export const secureStorage = {
  setItem(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Failed to store item securely:', error);
    }
  },
  
  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to retrieve item securely:', error);
      return null;
    }
  },
  
  removeItem(key) {
    localStorage.removeItem(key);
  },
  
  clear() {
    localStorage.clear();
  }
};

// CSP Violation Reporting
export function setupCSPViolationReporting() {
  if (typeof document !== 'undefined') {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.error('CSP Violation:', {
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber
      });
      
      // In production, you might want to send this to a logging service
      const isProduction = typeof process !== 'undefined' && process.env ? process.env.NODE_ENV === 'production' : false;
      if (isProduction) {
        // analytics.track('csp_violation', {
        //   directive: event.violatedDirective,
        //   blockedURI: event.blockedURI
        // });
      }
    });
  }
}

// Enhanced Input Validation
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateURL(url) {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

export function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Secure API request wrapper
export async function secureApiRequest(url, options = {}) {
  // Validate URL
  if (!validateURL(url)) {
    throw new Error('Invalid URL provided to API request');
  }
  
  // Ensure HTTPS in production
  const isProduction = typeof process !== 'undefined' && process.env ? process.env.NODE_ENV === 'production' : false;
  if (isProduction && !url.startsWith('https://')) {
    throw new Error('Insecure API requests not allowed in production');
  }
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    ...options
  };
  
  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('Secure API request failed:', error);
    throw error;
  }
}

// Initialize all security measures
export function initializeSecurity() {
  enforceHTTPS();
  setupCSPViolationReporting();
  const envStatus = validateEnvironment();
  
  console.log('[Security] Initialized:', {
    https: document.location.protocol === 'https:',
    csp: 'Enabled',
    environment: envStatus
  });
  
  return envStatus;
}
