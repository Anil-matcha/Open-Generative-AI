/**
 * Input Validation & Sanitization Utility
 * Provides comprehensive validation for user inputs, API parameters, and file uploads
 */

// Validation error types
export class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

// Regex patterns for validation
const PATTERNS = {
    URL: /^https?:\/\/.+/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    SAFE_STRING: /^[a-zA-Z0-9\s\-_.@]+$/,
    PROMPT: /^[\s\S]{1,4096}$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

// File validation constants
const FILE_LIMITS = {
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
    MAX_AUDIO_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
    ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
};

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - Raw input string
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input) {
    if (typeof input !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Validate and sanitize prompt input
 * @param {string} prompt - User prompt
 * @param {Object} options - Validation options
 * @returns {Object} - {valid: boolean, value: string, error?: string}
 */
export function validatePrompt(prompt, options = {}) {
    const { minLength = 1, maxLength = 4096, required = true } = options;
    
    if (!prompt || typeof prompt !== 'string') {
        if (required) {
            return { valid: false, value: '', error: 'Prompt is required' };
        }
        return { valid: true, value: '' };
    }
    
    const trimmed = prompt.trim();
    
    if (trimmed.length < minLength) {
        return { 
            valid: false, 
            value: trimmed, 
            error: `Prompt must be at least ${minLength} characters` 
        };
    }
    
    if (trimmed.length > maxLength) {
        return { 
            valid: false, 
            value: trimmed.slice(0, maxLength), 
            error: `Prompt must not exceed ${maxLength} characters` 
        };
    }
    
    return { valid: true, value: sanitizeString(trimmed) };
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @returns {Object} - {valid: boolean, value: string, error?: string}
 */
export function validateUrl(url, options = {}) {
    const { allowedDomains = [], required = true } = options;
    
    if (!url || typeof url !== 'string') {
        if (required) {
            return { valid: false, value: '', error: 'URL is required' };
        }
        return { valid: true, value: '' };
    }
    
    const trimmed = url.trim();
    
    if (!PATTERNS.URL.test(trimmed)) {
        return { valid: false, value: trimmed, error: 'Invalid URL format' };
    }
    
    if (allowedDomains.length > 0) {
        try {
            const urlObj = new URL(trimmed);
            if (!allowedDomains.some(domain => urlObj.hostname.endsWith(domain))) {
                return { 
                    valid: false, 
                    value: trimmed, 
                    error: `URL domain must be one of: ${allowedDomains.join(', ')}` 
                };
            }
        } catch {
            return { valid: false, value: trimmed, error: 'Invalid URL' };
        }
    }
    
    return { valid: true, value: trimmed };
}

/**
 * Validate numeric input with bounds
 * @param {number} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {Object} - {valid: boolean, value: number, error?: string}
 */
export function validateNumber(value, options = {}) {
    const { min = -Infinity, max = Infinity, integer = false, required = true } = options;
    
    if (value === undefined || value === null || value === '') {
        if (required) {
            return { valid: false, value: null, error: 'Value is required' };
        }
        return { valid: true, value: null };
    }
    
    const num = Number(value);
    
    if (isNaN(num)) {
        return { valid: false, value: null, error: 'Value must be a number' };
    }
    
    if (integer && !Number.isInteger(num)) {
        return { valid: false, value: num, error: 'Value must be an integer' };
    }
    
    if (num < min) {
        return { valid: false, value: num, error: `Value must be at least ${min}` };
    }
    
    if (num > max) {
        return { valid: false, value: num, error: `Value must not exceed ${max}` };
    }
    
    return { valid: true, value: num };
}

/**
 * Validate file upload
 * @param {File} file - File object to validate
 * @param {Object} options - Validation options
 * @returns {Object} - {valid: boolean, error?: string}
 */
export function validateFile(file, options = {}) {
    const { 
        maxSize = FILE_LIMITS.MAX_IMAGE_SIZE,
        allowedTypes = FILE_LIMITS.ALLOWED_IMAGE_TYPES,
        required = true 
    } = options;
    
    if (!file) {
        if (required) {
            return { valid: false, error: 'File is required' };
        }
        return { valid: true };
    }
    
    if (!(file instanceof File)) {
        return { valid: false, error: 'Invalid file object' };
    }
    
    if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        return { 
            valid: false, 
            error: `File size must not exceed ${maxMB}MB` 
        };
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        return { 
            valid: false, 
            error: `File type must be one of: ${allowedTypes.join(', ')}` 
        };
    }
    
    return { valid: true };
}

/**
 * Validate API parameters object
 * @param {Object} params - Parameters to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} - {valid: boolean, errors: string[], sanitized: Object}
 */
export function validateParams(params, schema) {
    const errors = [];
    const sanitized = {};
    
    for (const [key, rules] of Object.entries(schema)) {
        const value = params[key];
        
        if (rules.required && (value === undefined || value === null)) {
            errors.push(`${key} is required`);
            continue;
        }
        
        if (value === undefined || value === null) {
            if (rules.default !== undefined) {
                sanitized[key] = rules.default;
            }
            continue;
        }
        
        switch (rules.type) {
            case 'string': {
                const strResult = validatePrompt(value, {
                    minLength: rules.minLength,
                    maxLength: rules.maxLength,
                    required: rules.required
                });
                if (!strResult.valid) {
                    errors.push(`${key}: ${strResult.error}`);
                } else {
                    sanitized[key] = strResult.value;
                }
                break;
            }
                
            case 'number':
            case 'integer': {
                const numResult = validateNumber(value, {
                    min: rules.min,
                    max: rules.max,
                    integer: rules.type === 'integer',
                    required: rules.required
                });
                if (!numResult.valid) {
                    errors.push(`${key}: ${numResult.error}`);
                } else {
                    sanitized[key] = numResult.value;
                }
                break;
            }
                
            case 'url': {
                const urlResult = validateUrl(value, {
                    allowedDomains: rules.allowedDomains,
                    required: rules.required
                });
                if (!urlResult.valid) {
                    errors.push(`${key}: ${urlResult.error}`);
                } else {
                    sanitized[key] = urlResult.value;
                }
                break;
            }
                
            case 'array':
                if (!Array.isArray(value)) {
                    errors.push(`${key} must be an array`);
                } else if (rules.maxItems && value.length > rules.maxItems) {
                    errors.push(`${key} must not have more than ${rules.maxItems} items`);
                } else {
                    sanitized[key] = value;
                }
                break;
                
            case 'boolean':
                sanitized[key] = Boolean(value);
                break;
                
            default:
                sanitized[key] = value;
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
        sanitized
    };
}

// Export constants for use elsewhere
export { FILE_LIMITS, PATTERNS };
