export class DynamicFormValidator {
  constructor(template, options = {}) {
    this.template = template;
    this.inputs = template.inputs || [];
    this.validators = options.validators || {};
    this.debounceMs = options.debounceMs || 300;
    this.debounceTimers = {};
  }

  validateField(fieldName, value, formState = {}) {
    const input = this.inputs.find(i => i.name === fieldName);
    if (!input) return { valid: true, error: null };

    const validators = this.buildValidators(input);

    for (const validator of validators) {
      const result = validator(value, formState);
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true, error: null };
  }

  validateAll(formState) {
    const errors = [];
    const validatedFields = {};

    for (const input of this.inputs) {
      const value = formState[input.name];
      const result = this.validateField(input.name, value, formState);

      validatedFields[input.name] = result;

      if (!result.valid) {
        errors.push({
          field: input.name,
          label: input.label,
          error: result.error,
        });
      }

      if (input.type === 'image' && !value && input.required) {
        errors.push({
          field: input.name,
          label: input.label,
          error: `${input.label} is required`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      fields: validatedFields,
      isComplete: this.checkCompletion(formState),
    };
  }

  buildValidators(input) {
    const validators = [];

    if (input.required) {
      validators.push((value, formState) => this.validateRequired(value, input.label));
    }

    if (input.minLength !== undefined) {
      validators.push((value) => this.validateMinLength(value, input.minLength));
    }

    if (input.maxLength !== undefined) {
      validators.push((value) => this.validateMaxLength(value, input.maxLength));
    }

    if (input.type === 'number' || input.type === 'slider') {
      if (input.min !== undefined) {
        validators.push((value) => this.validateMin(value, input.min));
      }
      if (input.max !== undefined) {
        validators.push((value) => this.validateMax(value, input.max));
      }
    }

    if (input.pattern) {
      validators.push((value) => this.validatePattern(value, input.pattern));
    }

    if (input.options && input.options.length > 0) {
      validators.push((value) => this.validateOptions(value, input.options));
    }

    if (input.customValidator) {
      validators.push((value) => this.runCustomValidator(value, input.customValidator));
    }

    return validators;
  }

  validateRequired(value, label) {
    const isEmpty = value === null || value === undefined || value === '';
    const isEmptyString = typeof value === 'string' && value.trim() === '';

    if (isEmpty || isEmptyString) {
      return {
        valid: false,
        error: `${label} is required`,
      };
    }
    return { valid: true, error: null };
  }

  validateMinLength(value, minLength) {
    if (!value || typeof value !== 'string') return { valid: true, error: null };
    if (value.length < minLength) {
      return {
        valid: false,
        error: `Must be at least ${minLength} characters`,
      };
    }
    return { valid: true, error: null };
  }

  validateMaxLength(value, maxLength) {
    if (!value || typeof value !== 'string') return { valid: true, error: null };
    if (value.length > maxLength) {
      return {
        valid: false,
        error: `Must be no more than ${maxLength} characters`,
      };
    }
    return { valid: true, error: null };
  }

  validateMin(value, min) {
    if (value === null || value === undefined || value === '') return { valid: true, error: null };
    const numValue = Number(value);
    if (isNaN(numValue)) return { valid: true, error: null };
    if (numValue < min) {
      return {
        valid: false,
        error: `Must be at least ${min}`,
      };
    }
    return { valid: true, error: null };
  }

  validateMax(value, max) {
    if (value === null || value === undefined || value === '') return { valid: true, error: null };
    const numValue = Number(value);
    if (isNaN(numValue)) return { valid: true, error: null };
    if (numValue > max) {
      return {
        valid: false,
        error: `Must be no more than ${max}`,
      };
    }
    return { valid: true, error: null };
  }

  validatePattern(value, pattern) {
    if (!value || typeof value !== 'string') return { valid: true, error: null };
    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
      return {
        valid: false,
        error: 'Invalid format',
      };
    }
    return { valid: true, error: null };
  }

  validateOptions(value, options) {
    if (value === null || value === undefined || value === '') return { valid: true, error: null };
    if (!options.includes(value)) {
      return {
        valid: false,
        error: 'Invalid selection',
      };
    }
    return { valid: true, error: null };
  }

  runCustomValidator(value, customValidator) {
    try {
      return customValidator(value);
    } catch (e) {
      return { valid: true, error: null };
    }
  }

  checkCompletion(formState) {
    const requiredFields = this.inputs.filter(input => input.required);

    for (const input of requiredFields) {
      const value = formState[input.name];
      if (value === null || value === undefined || value === '' || value === false) {
        return false;
      }
    }

    return true;
  }

  getRequiredFields() {
    return this.inputs.filter(input => input.required).map(input => ({
      name: input.name,
      label: input.label,
      type: input.type,
    }));
  }

  getOptionalFields() {
    return this.inputs.filter(input => !input.required).map(input => ({
      name: input.name,
      label: input.label,
      type: input.type,
    }));
  }

  clearValidation() {
    Object.keys(this.debounceTimers).forEach(key => {
      clearTimeout(this.debounceTimers[key]);
    });
    this.debounceTimers = {};
  }
}

export function validateTemplateForm(template, formData) {
  const validator = new DynamicFormValidator(template);
  return validator.validateAll(formData);
}

export function validateField(fieldName, value, template, formState = {}) {
  const validator = new DynamicFormValidator(template);
  return validator.validateField(fieldName, value, formState);
}