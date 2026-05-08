/**
 * Environment Configuration Validation and Security
 * Validates environment variables and provides secure configuration management
 */

import { ValidationError } from './error-handling.js';

// Environment variable schema
const ENV_SCHEMA = {
  // Node environment
  NODE_ENV: {
    required: true,
    allowedValues: ['development', 'production', 'test'],
    defaultValue: 'development'
  },

  // API Keys (sensitive - validate format)
  MUAPI_API_KEY: {
    required: false,
    validator: (value) => {
      if (!value) return true; // Optional
      return /^[A-Za-z0-9_-]{20,}$/.test(value);
    },
    sensitive: true
  },

  // URLs
  VITE_API_BASE_URL: {
    required: false,
    validator: (value) => {
      if (!value) return true; // Optional
      try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    }
  },

  // Feature flags
  VITE_ENABLE_ANALYTICS: {
    required: false,
    validator: (value) => ['true', 'false', undefined].includes(value),
    defaultValue: 'true'
  },

  // Supabase configuration
  VITE_SUPABASE_URL: {
    required: false,
    validator: (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === 'https:';
      } catch {
        return false;
      }
    }
  },

  VITE_SUPABASE_ANON_KEY: {
    required: false,
    sensitive: true,
    validator: (value) => {
      if (!value) return true;
      // Supabase anon keys typically start with 'eyJ'
      return value.startsWith('eyJ') && value.length > 50;
    }
  }
};

// Environment configuration validator
export class EnvironmentValidator {
  constructor() {
    this.validated = false;
    this.config = {};
    this.errors = [];
  }

  validate() {
    this.errors = [];
    this.config = {};

    for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
      const value = import.meta.env[key] || schema.defaultValue;

      try {
        // Check required fields
        if (schema.required && !value) {
          throw new ValidationError(`Required environment variable ${key} is missing`, key, value);
        }

        // Validate allowed values
        if (schema.allowedValues && !schema.allowedValues.includes(value)) {
          throw new ValidationError(
            `Environment variable ${key} has invalid value: ${value}. Allowed: ${schema.allowedValues.join(', ')}`,
            key,
            value
          );
        }

        // Run custom validator
        if (schema.validator && !schema.validator(value)) {
          throw new ValidationError(`Environment variable ${key} failed validation`, key, value);
        }

        // Store validated config (mask sensitive values)
        this.config[key] = schema.sensitive ? this.maskValue(value) : value;

      } catch (error) {
        this.errors.push(error);
        console.error(`[Environment] Validation failed for ${key}:`, error.message);
      }
    }

    this.validated = this.errors.length === 0;
    return this.validated;
  }

  maskValue(value) {
    if (!value) return value;
    if (value.length <= 8) return '*'.repeat(value.length);
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
  }

  getConfig() {
    if (!this.validated) {
      throw new Error('Environment configuration has not been validated. Call validate() first.');
    }
    return { ...this.config };
  }

  getErrors() {
    return this.errors.map(error => ({
      field: error.field,
      message: error.message,
      value: this.maskValue(error.value)
    }));
  }

  isProduction() {
    return import.meta.env.PROD;
  }

  isDevelopment() {
    return import.meta.env.DEV;
  }

  isTest() {
    return import.meta.env.MODE === 'test';
  }
}

// Secure environment variable access
export class SecureEnv {
  constructor() {
    this.validator = new EnvironmentValidator();
  }

  initialize() {
    const isValid = this.validator.validate();
    
    if (!isValid) {
      const errors = this.validator.getErrors();
      console.error('[Environment] Configuration validation failed:', errors);
      
      // In production, throw error for invalid config
      if (this.validator.isProduction()) {
        throw new Error(`Invalid environment configuration. ${errors.length} validation errors found.`);
      }
    }

    return this.validator.getConfig();
  }

  get(key) {
    if (!this.validator.validated) {
      throw new Error('Environment configuration has not been initialized. Call initialize() first.');
    }

    const value = import.meta.env[key];
    const schema = ENV_SCHEMA[key];

    if (schema?.sensitive && value) {
      console.warn(`[Security] Accessing sensitive environment variable: ${key}`);
    }

    return value;
  }

  getValidated(key) {
    if (!this.validator.validated) {
      throw new Error('Environment configuration has not been initialized.');
    }

    return this.validator.config[key];
  }
}

// Global secure environment instance
export const secureEnv = new SecureEnv();

// Utility functions for common environment checks
export function isProduction() {
  return secureEnv.validator?.isProduction() || import.meta.env.PROD;
}

export function isDevelopment() {
  return secureEnv.validator?.isDevelopment() || import.meta.env.DEV;
}

export function requireEnv(key, defaultValue = null) {
  const value = secureEnv.get(key);
  if (value == null && defaultValue == null) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value || defaultValue;
}

// Initialize environment validation
export function initializeEnvironmentValidation() {
  try {
    const config = secureEnv.initialize();
    return config;
  } catch (error) {
    console.error('[Environment] Failed to initialize secure environment:', error);
    throw error;
  }
}
