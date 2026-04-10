import DOMPurify from 'dompurify';

/**
 * Security utilities for safe DOM manipulation
 * Prevents XSS vulnerabilities by providing safe alternatives to innerHTML
 */

/**
 * Set text content safely - prevents XSS by escaping HTML entities
 * @param {HTMLElement} element - The element to set content on
 * @param {string} text - The text content (will be escaped)
 */
export function safeSetText(element, text) {
  if (!element) return;
  element.textContent = text || '';
}

/**
 * Create an element with safe text content
 * @param {string} tag - HTML tag name
 * @param {string} text - Text content (will be escaped)
 * @param {string} [className] - CSS class names
 * @returns {HTMLElement}
 */
export function createSafeElement(tag, text, className = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text || '';
  return element;
}

/**
 * Create an image element safely
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text (will be escaped)
 * @param {string} [className] - CSS class names
 * @returns {HTMLImageElement}
 */
export function createSafeImage(src, alt = '', className = '') {
  const img = document.createElement('img');
  img.src = src || '';
  img.alt = alt || '';
  if (className) img.className = className;
  return img;
}

/**
 * Create a video element safely
 * @param {string} src - Video source URL
 * @param {string} [className] - CSS class names
 * @returns {HTMLVideoElement}
 */
export function createSafeVideo(src, className = '') {
  const video = document.createElement('video');
  video.src = src || '';
  video.muted = true;
  if (className) video.className = className;
  return video;
}

/**
 * Create SVG element safely
 * @param {string} svgContent - SVG inner content
 * @param {string} [className] - CSS class names
 * @returns {HTMLDivElement}
 */
export function createSafeSVG(svgContent, className = '') {
  // Validate that content appears to be SVG
  const trimmed = svgContent.trim();
  if (!trimmed.startsWith('<svg') || !trimmed.includes('</svg>')) {
    throw new Error('Invalid SVG content provided to createSafeSVG');
  }

  const container = document.createElement('div');
  container.innerHTML = svgContent;
  if (className) container.className = className;
  return container.firstChild;
}

/**
 * Create a button with text content safely
 * @param {string} text - Button text (will be escaped)
 * @param {string} [className] - CSS class names
 * @returns {HTMLButtonElement}
 */
export function createSafeButton(text, className = '') {
  const btn = document.createElement('button');
  btn.type = 'button';
  if (className) btn.className = className;
  btn.textContent = text || '';
  return btn;
}

/**
 * Safely set multiple child elements, replacing all content
 * @param {HTMLElement} parent - Parent element
 * @param {HTMLElement[]} children - Array of child elements
 */
export function setChildren(parent, children = []) {
  if (!parent) return;
  parent.innerHTML = '';
  children.forEach(child => {
    if (child) parent.appendChild(child);
  });
}

/**
 * Create a card element with safe content
 * @param {Object} options - Card options
 * @param {string} options.title - Title text (escaped)
 * @param {string} options.subtitle - Subtitle text (escaped)
 * @param {string} options.imageUrl - Image URL (for thumbnail)
 * @param {string} options.className - Additional CSS classes
 * @returns {HTMLElement}
 */
export function createSafeCard({ title = '', subtitle = '', imageUrl = '', className = '' }) {
  const card = document.createElement('div');
  card.className = className;

  if (imageUrl) {
    const img = createSafeImage(imageUrl, title, 'w-full aspect-square object-cover');
    card.appendChild(img);
  }

  if (title || subtitle) {
    const info = document.createElement('div');
    info.className = 'p-3';
    
    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'text-xs font-bold text-white';
      titleEl.textContent = title;
      info.appendChild(titleEl);
    }
    
    if (subtitle) {
      const subEl = document.createElement('div');
      subEl.className = 'text-xs text-muted';
      subEl.textContent = subtitle;
      info.appendChild(subEl);
    }
    
    card.appendChild(info);
  }

  return card;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Create HTML with sanitized content using DOMPurify - use sparingly, prefer other methods
 * Only use this when template strings are necessary
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML string
 */
export function safeHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i', 'u', 'br', 'img', 'a', 'button'],
    ALLOWED_ATTR: ['class', 'id', 'src', 'alt', 'href', 'target', 'rel', 'type', 'onclick'],
    ALLOW_DATA_ATTR: false
  });
}

/**
 * Validate and sanitize URL to prevent open redirect vulnerabilities
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export function sanitizeUrl(url, options = {}) {
  const { allowedProtocols = ['https:', 'http:'], allowedDomains = [] } = options;
  
  if (!url || typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    
    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol)) {
      console.warn('[Security] Blocked URL with disallowed protocol:', parsed.protocol);
      return null;
    }
    
    // Check domain if restrictions are specified
    if (allowedDomains.length > 0 && !allowedDomains.includes(parsed.hostname)) {
      console.warn('[Security] Blocked URL with disallowed domain:', parsed.hostname);
      return null;
    }
    
    return parsed.href;
  } catch {
    // Relative URLs are generally safe
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    return null;
  }
}

/**
 * Validate file upload for security
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} - {valid: boolean, error?: string}
 */
export function validateFileUpload(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  } = options;
  
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  // Check file size
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File size exceeds ${maxMB}MB limit` };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'File extension not allowed' };
  }
  
  return { valid: true };
}

/**
 * Generate a cryptographically secure random ID
 * @param {number} length - Length of the ID
 * @returns {string} - Random ID
 */
export function generateSecureId(length = 16) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Sanitize object for safe serialization (removes functions, DOM elements)
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
export function sanitizeForSerialization(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForSerialization(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip functions and DOM elements
    if (typeof value === 'function' || value instanceof HTMLElement) {
      continue;
    }
    
    // Recursively sanitize nested objects
    if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeForSerialization(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}