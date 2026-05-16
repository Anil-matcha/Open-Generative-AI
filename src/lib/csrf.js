/**
 * CSRF Protection Utilities
 * Implements CSRF token generation and validation for state-changing operations
 */

class CSRFProtection {
  constructor() {
    this.token = null;
    this.headerName = 'X-CSRF-Token';
    this.storageKey = 'csrf_token';
  }

  generateToken() {
    // Generate a secure random token using crypto API
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    try {
      sessionStorage.setItem(this.storageKey, this.token);
    } catch (e) {
      console.warn('Could not store CSRF token in sessionStorage');
    }
    return this.token;
  }

  getToken() {
    if (this.token) return this.token;
    
    try {
      this.token = sessionStorage.getItem(this.storageKey);
    } catch (e) {
      console.warn('Could not read CSRF token from sessionStorage');
    }
    
    if (!this.token) {
      this.token = this.generateToken();
    }
    
    return this.token;
  }

  validateToken(token) {
    if (!token) return false;
    const storedToken = this.getToken();
    return storedToken === token;
  }

  getHeader() {
    return {
      [this.headerName]: this.getToken()
    };
  }

  attachToRequest(options = {}) {
    return {
      ...options,
      headers: {
        ...options.headers,
        ...this.getHeader()
      }
    };
  }

  validateRequest(request) {
    const token = request.headers?.[this.headerName] || 
                  request.body?.csrf_token ||
                  new URLSearchParams(request.url?.split('?')[1] || '').get('csrf_token');
    
    if (!token) {
      return { valid: false, error: 'CSRF token missing' };
    }
    
    if (!this.validateToken(token)) {
      return { valid: false, error: 'CSRF token invalid' };
    }
    
    return { valid: true };
  }
}

export const csrfProtection = new CSRFProtection();

export function withCSRF(options = {}) {
  return csrfProtection.attachToRequest(options);
}

export function validateCSRF(request) {
  return csrfProtection.validateRequest(request);
}