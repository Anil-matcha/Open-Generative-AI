import { evaluateCondition } from './DynamicForm.js';

export class DynamicFormState {
  constructor(template, options = {}) {
    this.template = template;
    this.inputs = template.inputs || [];
    this.state = {};
    this.listeners = [];
    this.validationState = {};
    this.conditionalFields = new Map();

    this.initializeState();
    this.buildConditionalMap();
  }

  initializeState() {
    this.inputs.forEach(input => {
      let defaultValue;

      switch (input.type) {
        case 'checkbox':
          defaultValue = input.defaultValue || false;
          break;
        case 'number':
        case 'slider':
          defaultValue = input.defaultValue ?? input.min ?? 0;
          break;
        case 'select':
          defaultValue = input.defaultValue || (input.options && input.options[0]) || '';
          break;
        default:
          defaultValue = input.defaultValue || '';
      }

      this.state[input.name] = {
        value: defaultValue,
        touched: false,
        dirty: false,
        visible: true,
        error: null,
      };
    });
  }

  buildConditionalMap() {
    this.inputs.forEach(input => {
      if (input.condition) {
        this.conditionalFields.set(input.name, input.condition);
      }
    });
  }

  getValue(fieldName) {
    return this.state[fieldName]?.value;
  }

  setValue(fieldName, value, triggerValidation = true) {
    const fieldState = this.state[fieldName];
    if (!fieldState) return;

    const oldValue = fieldState.value;
    fieldState.value = value;
    fieldState.dirty = oldValue !== value;
    fieldState.touched = true;

    if (triggerValidation) {
      this.validateField(fieldName);
    }

    this.updateConditionalVisibility(fieldName);
    this.notifyListeners(fieldName, value);
  }

  validateField(fieldName) {
    const input = this.inputs.find(i => i.name === fieldName);
    if (!input) return { valid: true, error: null };

    const fieldState = this.state[fieldName];
    const value = fieldState.value;

    if (input.required && this.isEmpty(value)) {
      fieldState.error = `${input.label} is required`;
      return { valid: false, error: fieldState.error };
    }

    if (input.minLength !== undefined && typeof value === 'string' && value.length < input.minLength) {
      fieldState.error = `Must be at least ${input.minLength} characters`;
      return { valid: false, error: fieldState.error };
    }

    if (input.maxLength !== undefined && typeof value === 'string' && value.length > input.maxLength) {
      fieldState.error = `Must be no more than ${input.maxLength} characters`;
      return { valid: false, error: fieldState.error };
    }

    if ((input.type === 'number' || input.type === 'slider') && value !== null && value !== '') {
      const numValue = Number(value);
      if (input.min !== undefined && numValue < input.min) {
        fieldState.error = `Must be at least ${input.min}`;
        return { valid: false, error: fieldState.error };
      }
      if (input.max !== undefined && numValue > input.max) {
        fieldState.error = `Must be no more than ${input.max}`;
        return { valid: false, error: fieldState.error };
      }
    }

    if (input.pattern && typeof value === 'string') {
      const regex = new RegExp(input.pattern);
      if (!regex.test(value)) {
        fieldState.error = 'Invalid format';
        return { valid: false, error: fieldState.error };
      }
    }

    if (input.options && input.options.length > 0 && value !== '') {
      if (!input.options.includes(value)) {
        fieldState.error = 'Invalid selection';
        return { valid: false, error: fieldState.error };
      }
    }

    fieldState.error = null;
    return { valid: true, error: null };
  }

  validateAll() {
    const errors = [];
    let isComplete = true;

    this.inputs.forEach(input => {
      const result = this.validateField(input.name);
      if (!result.valid) {
        errors.push({
          field: input.name,
          label: input.label,
          error: result.error,
        });
      }

      if (input.required && this.isEmpty(this.state[input.name]?.value)) {
        isComplete = false;
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      isComplete,
      fields: { ...this.state },
    };
  }

  isEmpty(value) {
    return value === null || value === undefined || value === '';
  }

  updateConditionalVisibility(changedFieldName) {
    this.conditionalFields.forEach((condition, fieldName) => {
      const fieldState = this.state[fieldName];
      if (!fieldState) return;

      const shouldBeVisible = evaluateCondition(condition, this.getValues());

      if (fieldState.visible !== shouldBeVisible) {
        fieldState.visible = shouldBeVisible;
        this.notifyListeners(fieldName, fieldState.value, 'visibility');
      }
    });
  }

  getValues() {
    const values = {};
    Object.keys(this.state).forEach(fieldName => {
      if (this.state[fieldName].visible) {
        values[fieldName] = this.state[fieldName].value;
      }
    });
    return values;
  }

  getVisibleValues() {
    const values = {};
    Object.keys(this.state).forEach(fieldName => {
      if (this.state[fieldName].visible && !this.isEmpty(this.state[fieldName].value)) {
        values[fieldName] = this.state[fieldName].value;
      }
    });
    return values;
  }

  isFieldVisible(fieldName) {
    return this.state[fieldName]?.visible ?? true;
  }

  isFieldDirty(fieldName) {
    return this.state[fieldName]?.dirty ?? false;
  }

  isFieldTouched(fieldName) {
    return this.state[fieldName]?.touched ?? false;
  }

  getFieldError(fieldName) {
    return this.state[fieldName]?.error ?? null;
  }

  reset() {
    this.inputs.forEach(input => {
      let defaultValue;

      switch (input.type) {
        case 'checkbox':
          defaultValue = input.defaultValue || false;
          break;
        case 'number':
        case 'slider':
          defaultValue = input.defaultValue ?? input.min ?? 0;
          break;
        case 'select':
          defaultValue = input.defaultValue || (input.options && input.options[0]) || '';
          break;
        default:
          defaultValue = input.defaultValue || '';
      }

      this.state[input.name] = {
        value: defaultValue,
        touched: false,
        dirty: false,
        visible: true,
        error: null,
      };
    });

    this.notifyListeners('__all__', null, 'reset');
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners(fieldName, value, type = 'change') {
    this.listeners.forEach(listener => {
      try {
        listener(fieldName, value, type, { ...this.state });
      } catch (e) {
        console.error('Form state listener error:', e);
      }
    });
  }

  getState() {
    return {
      values: this.getValues(),
      validation: this.validateAll(),
      fields: { ...this.state },
    };
  }

  setValues(values) {
    Object.keys(values).forEach(fieldName => {
      if (this.state[fieldName]) {
        this.setValue(fieldName, values[fieldName], false);
      }
    });
    this.notifyListeners('__bulk__', values, 'bulk');
  }

  getFieldCount() {
    return this.inputs.length;
  }

  getVisibleFieldCount() {
    return Object.values(this.state).filter(f => f.visible).length;
  }

  getFilledFieldCount() {
    return Object.values(this.state).filter(f => f.visible && !this.isEmpty(f.value)).length;
  }

  getCompletionPercentage() {
    const total = this.getVisibleFieldCount();
    if (total === 0) return 0;
    const filled = this.getFilledFieldCount();
    return Math.round((filled / total) * 100);
  }
}

export function createFormStateManager(template, options = {}) {
  return new DynamicFormState(template, options);
}