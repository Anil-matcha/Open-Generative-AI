/**
 * Input Validation and Sanitization Service
 * Provides comprehensive validation for all user inputs and API data
 */

export class InputValidator {
  constructor() {
    this.sanitizers = {
      text: this.sanitizeText.bind(this),
      email: this.sanitizeEmail.bind(this),
      url: this.sanitizeUrl.bind(this),
      html: this.sanitizeHtml.bind(this),
      json: this.sanitizeJson.bind(this)
    };
  }

  /**
   * Validate and sanitize input data
   * @param {any} data - Input data to validate
   * @param {Object} rules - Validation rules
   * @returns {Object} Validation result
   */
  validate(data, rules = {}) {
    const errors = [];
    let sanitized = data;

    // Apply sanitization first
    if (rules.sanitize) {
      sanitized = this.sanitize(data, rules.sanitize);
    }

    // Apply validation rules
    if (rules.required && (sanitized === null || sanitized === undefined || sanitized === '')) {
      errors.push('This field is required');
    }

    if (rules.type && sanitized !== null && sanitized !== undefined) {
      if (typeof sanitized !== rules.type) {
        errors.push(`Expected type ${rules.type}, got ${typeof sanitized}`);
      }
    }

    if (rules.minLength && sanitized && sanitized.length < rules.minLength) {
      errors.push(`Minimum length is ${rules.minLength} characters`);
    }

    if (rules.maxLength && sanitized && sanitized.length > rules.maxLength) {
      errors.push(`Maximum length is ${rules.maxLength} characters`);
    }

    if (rules.pattern && sanitized) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(sanitized)) {
        errors.push(rules.patternMessage || 'Invalid format');
      }
    }

    if (rules.custom && typeof rules.custom === 'function') {
      try {
        const customResult = rules.custom(sanitized);
        if (customResult !== true) {
          errors.push(customResult || 'Custom validation failed');
        }
      } catch (error) {
        errors.push('Validation error occurred');
      }
    }

    // Array/object specific validations
    if (rules.items && Array.isArray(sanitized)) {
      sanitized.forEach((item, index) => {
        const itemValidation = this.validate(item, rules.items);
        if (!itemValidation.valid) {
          errors.push(`Item ${index}: ${itemValidation.errors.join(', ')}`);
        }
      });
    }

    if (rules.properties && typeof sanitized === 'object' && sanitized !== null) {
      Object.entries(rules.properties).forEach(([key, propRules]) => {
        const propValidation = this.validate(sanitized[key], propRules);
        if (!propValidation.valid) {
          errors.push(`${key}: ${propValidation.errors.join(', ')}`);
        }
        if (propValidation.sanitized !== undefined) {
          sanitized[key] = propValidation.sanitized;
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Sanitize input data
   * @param {any} data - Data to sanitize
   * @param {string|string[]} types - Sanitization types
   * @returns {any} Sanitized data
   */
  sanitize(data, types) {
    if (!data) return data;

    const typeArray = Array.isArray(types) ? types : [types];
    let sanitized = data;

    typeArray.forEach(type => {
      if (this.sanitizers[type]) {
        sanitized = this.sanitizers[type](sanitized);
      }
    });

    return sanitized;
  }

  /**
   * Sanitize text input
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  sanitizeText(text) {
    if (typeof text !== 'string') return text;

    return text
      .trim()
      .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
      .substring(0, 10000); // Limit length
  }

  /**
   * Sanitize email input
   * @param {string} email - Email to sanitize
   * @returns {string} Sanitized email
   */
  sanitizeEmail(email) {
    if (typeof email !== 'string') return email;

    return email
      .trim()
      .toLowerCase()
      .replace(/[<>\"']/g, '')
      .substring(0, 254); // RFC 5321 limit
  }

  /**
   * Sanitize URL input
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL
   */
  sanitizeUrl(url) {
    if (typeof url !== 'string') return url;

    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return '';
      }
      return urlObj.href;
    } catch {
      return '';
    }
  }

  /**
   * Sanitize HTML input (basic - for rich text)
   * @param {string} html - HTML to sanitize
   * @returns {string} Sanitized HTML
   */
  sanitizeHtml(html) {
    if (typeof html !== 'string') return html;

    // Basic HTML sanitization - remove script tags and dangerous attributes
    return html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+on\w+[^>]*>/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .substring(0, 50000); // Limit length
  }

  /**
   * Sanitize JSON input
   * @param {any} data - Data to sanitize as JSON
   * @returns {any} Sanitized data
   */
  sanitizeJson(data) {
    try {
      // If it's a string, parse it
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return this.sanitizeObject(parsed);
      }
      
      // If it's already an object, sanitize it
      if (typeof data === 'object' && data !== null) {
        return this.sanitizeObject(data);
      }
      
      return data;
    } catch {
      return null; // Invalid JSON
    }
  }

  /**
   * Recursively sanitize object properties
   * @param {Object} obj - Object to sanitize
   * @param {number} depth - Current recursion depth
   * @returns {Object} Sanitized object
   */
  sanitizeObject(obj, depth = 0) {
    if (depth > 10) return {}; // Prevent infinite recursion
    
    if (Array.isArray(obj)) {
      return obj.map(item => 
        typeof item === 'object' && item !== null 
          ? this.sanitizeObject(item, depth + 1) 
          : this.sanitizeText(String(item))
      );
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      Object.entries(obj).forEach(([key, value]) => {
        const cleanKey = this.sanitizeText(key).substring(0, 100);
        if (typeof value === 'object' && value !== null) {
          sanitized[cleanKey] = this.sanitizeObject(value, depth + 1);
        } else {
          sanitized[cleanKey] = this.sanitizeText(String(value));
        }
      });
      return sanitized;
    }
    
    return this.sanitizeText(String(obj));
  }

  /**
   * Validate project data
   * @param {Object} projectData - Project data to validate
   * @returns {Object} Validation result
   */
  validateProject(projectData) {
    const schema = {
      title: {
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 100,
        sanitize: 'text'
      },
      description: {
        type: 'string',
        maxLength: 500,
        sanitize: 'text'
      },
      data: {
        type: 'object',
        sanitize: 'json'
      },
      settings: {
        type: 'object',
        sanitize: 'json'
      }
    };

    return this.validate(projectData, schema);
  }

  /**
   * Validate user profile data
   * @param {Object} profileData - Profile data to validate
   * @returns {Object} Validation result
   */
  validateProfile(profileData) {
    const schema = {
      display_name: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        sanitize: 'text'
      },
      bio: {
        type: 'string',
        maxLength: 200,
        sanitize: 'text'
      },
      avatar_url: {
        type: 'string',
        pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i,
        patternMessage: 'Avatar must be a valid image URL',
        sanitize: 'url'
      },
      preferences: {
        type: 'object',
        properties: {
          theme: {
            type: 'string',
            pattern: '^(light|dark|auto)$',
            patternMessage: 'Theme must be light, dark, or auto'
          },
          language: {
            type: 'string',
            minLength: 2,
            maxLength: 5
          },
          notifications: {
            type: 'boolean'
          },
          auto_save: {
            type: 'boolean'
          }
        }
      }
    };

    return this.validate(profileData, schema);
  }

  /**
   * Validate template data
   * @param {Object} templateData - Template data to validate
   * @returns {Object} Validation result
   */
  validateTemplate(templateData) {
    const schema = {
      name: {
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 100,
        sanitize: 'text'
      },
      description: {
        type: 'string',
        maxLength: 300,
        sanitize: 'text'
      },
      category: {
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 50,
        sanitize: 'text'
      },
      data: {
        type: 'object',
        sanitize: 'json'
      }
    };

    return this.validate(templateData, schema);
  }

  /**
   * Validate file upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateFile(file, options = {}) {
    const errors = [];
    
    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    // Check file size
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    // Check file type
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const allowed = options.allowedTypes.some(type => 
        file.type === type || file.name.toLowerCase().endsWith(type.replace('*', ''))
      );
      if (!allowed) {
        errors.push(`File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
      }
    }

    // Check file name
    if (file.name) {
      const cleanName = this.sanitizeText(file.name);
      if (cleanName.length !== file.name.length) {
        errors.push('File name contains invalid characters');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: file
    };
  }

  /**
   * Batch validate multiple inputs
   * @param {Object} inputs - Object with input names and values
   * @param {Object} schemas - Object with validation schemas
   * @returns {Object} Batch validation result
   */
  validateBatch(inputs, schemas) {
    const results = {};
    let allValid = true;

    Object.entries(schemas).forEach(([key, schema]) => {
      const result = this.validate(inputs[key], schema);
      results[key] = result;
      if (!result.valid) {
        allValid = false;
      }
    });

    return {
      valid: allValid,
      results
    };
  }
}

// Export singleton instance
export const inputValidator = new InputValidator();
