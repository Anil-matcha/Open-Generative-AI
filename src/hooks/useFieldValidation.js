/**
 * Form validation utilities
 * Provides validation functions and helpers for form fields
 */

/**
 * Validation rule types
 */
export const ValidationRules = {
  REQUIRED: 'required',
  EMAIL: 'email',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  PATTERN: 'pattern',
  CUSTOM: 'custom'
};

/**
 * Built-in validation functions
 */
export const Validators = {
  required: (value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value != null;
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  minLength: (min) => (value) => {
    if (typeof value === 'string') return value.length >= min;
    if (Array.isArray(value)) return value.length >= min;
    return true;
  },

  maxLength: (max) => (value) => {
    if (typeof value === 'string') return value.length <= max;
    if (Array.isArray(value)) return value.length <= max;
    return true;
  },

  pattern: (regex) => (value) => {
    return regex.test(value);
  },

  custom: (validatorFn) => (value) => {
    return validatorFn(value);
  }
};

/**
 * Validation error messages
 */
export const ValidationMessages = {
  [ValidationRules.REQUIRED]: 'This field is required',
  [ValidationRules.EMAIL]: 'Please enter a valid email address',
  [ValidationRules.MIN_LENGTH]: (min) => `Must be at least ${min} characters`,
  [ValidationRules.MAX_LENGTH]: (max) => `Must be no more than ${max} characters`,
  [ValidationRules.PATTERN]: 'Invalid format',
  [ValidationRules.CUSTOM]: 'Invalid value'
};

/**
 * Field validation configuration
 * @typedef {Object} ValidationConfig
 * @property {string} rule - Validation rule name
 * @property {any} param - Parameter for the validation rule
 * @property {string} message - Custom error message
 */

/**
 * Validate a single field value
 * @param {any} value - Field value to validate
 * @param {ValidationConfig[]} rules - Array of validation rules
 * @returns {string|null} Error message or null if valid
 */
export const validateField = (value, rules = []) => {
  for (const rule of rules) {
    const { rule: ruleName, param, message } = rule;
    const validator = Validators[ruleName];

    if (!validator) {
      console.warn(`Unknown validation rule: ${ruleName}`);
      continue;
    }

    const validatorFn = typeof validator === 'function' && validator.length > 0
      ? validator(param)
      : validator;

    if (!validatorFn(value)) {
      return message || ValidationMessages[ruleName]?.(param) || 'Invalid value';
    }
  }

  return null;
};

/**
 * Validate multiple fields
 * @param {Object} values - Object with field values
 * @param {Object} validationSchema - Object with field validation rules
 * @returns {Object} Object with field errors
 */
export const validateFields = (values, validationSchema) => {
  const errors = {};

  Object.keys(validationSchema).forEach(fieldName => {
    const rules = validationSchema[fieldName];
    const value = values[fieldName];
    const error = validateField(value, rules);

    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};

/**
 * Check if form has any validation errors
 * @param {Object} errors - Validation errors object
 * @returns {boolean} True if form is valid
 */
export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0;
};

/**
 * Get first error message from validation errors
 * @param {Object} errors - Validation errors object
 * @returns {string|null} First error message or null
 */
export const getFirstError = (errors) => {
  const firstField = Object.keys(errors)[0];
  return firstField ? errors[firstField] : null;
};

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  email: [
    { rule: ValidationRules.REQUIRED },
    { rule: ValidationRules.EMAIL }
  ],

  password: [
    { rule: ValidationRules.REQUIRED },
    { rule: ValidationRules.MIN_LENGTH, param: 8, message: 'Password must be at least 8 characters' }
  ],

  projectName: [
    { rule: ValidationRules.REQUIRED, message: 'Project name is required' },
    { rule: ValidationRules.MIN_LENGTH, param: 1, message: 'Project name cannot be empty' },
    { rule: ValidationRules.MAX_LENGTH, param: 100, message: 'Project name is too long' }
  ],

  timelineDuration: [
    { rule: ValidationRules.REQUIRED, message: 'Duration is required' },
    { rule: ValidationRules.CUSTOM, param: (value) => value > 0, message: 'Duration must be greater than 0' },
    { rule: ValidationRules.CUSTOM, param: (value) => value <= 3600, message: 'Duration cannot exceed 1 hour' }
  ]
};

/**
 * Real-time validation hook (would be used with React)
 * @param {any} value - Field value
 * @param {ValidationConfig[]} rules - Validation rules
 * @param {boolean} touched - Whether field has been touched
 * @returns {Object} Validation state
 */
export const useFieldValidation = (value, rules = [], touched = false) => {
  const error = validateField(value, rules);
  const isValid = !error;

  return {
    error: touched ? error : null,
    isValid,
    touched
  };
};

/**
 * Form validation utilities (for use with vanilla JS or React)
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationSchema - Validation schema
 * @returns {Object} Form validation state and handlers
 */
export const createFormValidation = (initialValues = {}, validationSchema = {}) => {
  let values = { ...initialValues };
  let errors = {};
  let touched = {};

  const validateFieldInline = (fieldName, value = values[fieldName]) => {
    const rules = validationSchema[fieldName];
    if (!rules) return;

    const error = validateField(value, rules);
    errors = {
      ...errors,
      [fieldName]: error
    };
  };

  const validateForm = () => {
    const newErrors = validateFields(values, validationSchema);
    errors = newErrors;
    return isFormValid(newErrors);
  };

  const setFieldValue = (fieldName, value) => {
    values = { ...values, [fieldName]: value };

    // Validate on change if field is touched
    if (touched[fieldName]) {
      validateFieldInline(fieldName, value);
    }
  };

  const setFieldTouched = (fieldName, isTouched = true) => {
    touched = { ...touched, [fieldName]: isTouched };

    // Validate when field becomes touched
    if (isTouched) {
      validateFieldInline(fieldName);
    }
  };

  const resetValidation = () => {
    errors = {};
    touched = {};
  };

  return {
    get values() { return values; },
    get errors() { return errors; },
    get touched() { return touched; },
    get isValid() { return isFormValid(errors); },
    setFieldValue,
    setFieldTouched,
    validateForm,
    resetValidation
  };
};