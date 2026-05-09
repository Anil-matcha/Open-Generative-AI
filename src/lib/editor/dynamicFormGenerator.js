/**
 * Dynamic Form Generator for Templates
 * 
 * Reads template.inputs and generates appropriate UI form controls dynamically.
 * Does NOT modify templates.js - only reads from it and generates forms.
 * 
 * Supported input types: text, textarea, select, image, number, slider, checkbox
 */

export const FORM_INPUT_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  IMAGE: 'image',
  NUMBER: 'number',
  SLIDER: 'slider',
  CHECKBOX: 'checkbox',
};

export class DynamicFormGenerator {
  constructor(options = {}) {
    this.onChange = options.onChange || (() => {});
    this.onValidationChange = options.onValidationChange || (() => {});
    this.styles = options.styles || this.getDefaultStyles();
  }

  getDefaultStyles() {
    return {
      formContainer: 'dynamic-form-container space-y-4 p-4',
      formGroup: 'form-group mb-4',
      label: 'block text-sm font-medium text-white/70 mb-1',
      input: 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20',
      textarea: 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-y',
      select: 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 cursor-pointer',
      selectOption: 'bg-gray-900 text-white',
      imageUpload: 'border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-500/50 transition-colors',
      slider: 'w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500',
      checkbox: 'w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/20 cursor-pointer',
      error: 'text-red-400 text-xs mt-1',
      helpText: 'text-white/40 text-xs mt-1',
      imagePreview: 'mt-2 max-h-40 rounded-lg object-contain',
      imageUploadPlaceholder: 'text-white/50',
    };
  }

  /**
   * Generate a complete form for a template
   * @param {Object} template - Template object with inputs array
   * @param {Object} initialValues - Initial values for form fields
   * @param {string} namespace - Namespace for input names (e.g., 'template-input')
   * @returns {HTMLElement} - Form element
   */
  generateForm(template, initialValues = {}, namespace = 'template-input') {
    if (!template || !template.inputs || !Array.isArray(template.inputs)) {
      console.warn('DynamicFormGenerator: Template has no inputs array');
      return this.createDiv({ className: this.styles.formContainer }, []);
    }

    const form = this.createDiv({ className: this.styles.formContainer }, []);
    const values = { ...initialValues };

    template.inputs.forEach((input, index) => {
      const inputElement = this.generateInput(input, values[input.name], namespace);
      form.appendChild(inputElement);
    });

    return form;
  }

  /**
   * Generate a single form input based on input definition
   * @param {Object} inputDef - Input definition from template.inputs
   * @param {*} initialValue - Initial value for this input
   * @param {string} namespace - Namespace for input name
   * @returns {HTMLElement} - Form group with label and input
   */
  generateInput(inputDef, initialValue = null, namespace = 'template-input') {
    const { name, type, label, placeholder, options, required, min, max, step, helpText } = inputDef;
    const inputName = `${namespace}-${name}`;
    const formGroup = this.createDiv({ className: this.styles.formGroup }, []);
    const labelEl = this.createLabel(inputName, label, required);
    formGroup.appendChild(labelEl);

    let inputEl;
    switch (type) {
      case FORM_INPUT_TYPES.TEXTAREA:
        inputEl = this.createTextarea(inputName, placeholder, initialValue);
        break;
      case FORM_INPUT_TYPES.SELECT:
        inputEl = this.createSelect(inputName, options, initialValue);
        break;
      case FORM_INPUT_TYPES.IMAGE:
        inputEl = this.createImageUpload(inputName, initialValue);
        break;
      case FORM_INPUT_TYPES.NUMBER:
        inputEl = this.createNumberInput(inputName, placeholder, initialValue, min, max, step);
        break;
      case FORM_INPUT_TYPES.SLIDER:
        inputEl = this.createSlider(inputName, label, initialValue, min, max, step);
        break;
      case FORM_INPUT_TYPES.CHECKBOX:
        inputEl = this.createCheckbox(inputName, label, initialValue);
        break;
      case FORM_INPUT_TYPES.TEXT:
      default:
        inputEl = this.createTextInput(inputName, placeholder, initialValue);
        break;
    }

    formGroup.appendChild(inputEl);

    if (helpText) {
      const helpEl = this.createDiv({ className: this.styles.helpText }, [helpText]);
      formGroup.appendChild(helpEl);
    }

    return formGroup;
  }

  /**
   * Create a text input element
   */
  createTextInput(name, placeholder, value) {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = name;
    input.placeholder = placeholder || '';
    input.value = value || '';
    input.className = this.styles.input;
    input.addEventListener('input', (e) => this.handleInputChange(name, e.target.value));
    return input;
  }

  /**
   * Create a textarea element
   */
  createTextarea(name, placeholder, value) {
    const textarea = document.createElement('textarea');
    textarea.name = name;
    textarea.placeholder = placeholder || '';
    textarea.value = value || '';
    textarea.className = this.styles.textarea;
    textarea.rows = 4;
    textarea.addEventListener('input', (e) => this.handleInputChange(name, e.target.value));
    return textarea;
  }

  /**
   * Create a select dropdown element
   */
  createSelect(name, options, value) {
    const select = document.createElement('select');
    select.name = name;
    select.className = this.styles.select;

    if (!options || !Array.isArray(options)) {
      console.warn(`DynamicFormGenerator: No options provided for select ${name}`);
      return select;
    }

    options.forEach((option) => {
      const optEl = document.createElement('option');
      optEl.value = option;
      optEl.textContent = option;
      optEl.className = this.styles.selectOption;
      if (option === value) {
        optEl.selected = true;
      }
      select.appendChild(optEl);
    });

    select.addEventListener('change', (e) => this.handleInputChange(name, e.target.value));
    return select;
  }

  /**
   * Create an image upload element with preview
   */
  createImageUpload(name, imageUrl) {
    const container = this.createDiv({ className: this.styles.imageUpload }, []);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.name = name;

    const label = this.createDiv({ className: this.styles.imageUploadPlaceholder }, [
      'Click or drag to upload image'
    ]);

    if (imageUrl) {
      const preview = document.createElement('img');
      preview.src = imageUrl;
      preview.className = this.styles.imagePreview;
      container.appendChild(preview);
      label.textContent = 'Click to change image';
    }

    container.appendChild(label);
    container.appendChild(input);

    container.addEventListener('click', () => input.click());

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const preview = container.querySelector('img') || document.createElement('img');
          preview.src = ev.target.result;
          preview.className = this.styles.imagePreview;
          if (!container.contains(preview)) {
            container.insertBefore(preview, label);
          }
          label.textContent = 'Click to change image';
          this.handleInputChange(name, ev.target.result);
        };
        reader.readAsDataURL(file);
      }
    });

    return container;
  }

  /**
   * Create a number input element
   */
  createNumberInput(name, placeholder, value, min, max, step) {
    const input = document.createElement('input');
    input.type = 'number';
    input.name = name;
    input.placeholder = placeholder || '';
    input.value = value ?? '';
    input.className = this.styles.input;

    if (min !== undefined) input.min = min;
    if (max !== undefined) input.max = max;
    if (step !== undefined) input.step = step;

    input.addEventListener('input', (e) => this.handleInputChange(name, parseFloat(e.target.value)));
    return input;
  }

  /**
   * Create a slider input element with value display
   */
  createSlider(name, label, value, min, max, step) {
    const container = this.createDiv({ className: 'flex items-center gap-3' }, []);

    const input = document.createElement('input');
    input.type = 'range';
    input.name = name;
    input.className = this.styles.slider;
    input.value = value ?? min ?? 0;

    if (min !== undefined) input.min = min;
    if (max !== undefined) input.max = max;
    if (step !== undefined) input.step = step;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'text-white text-sm min-w-[40px] text-right';
    valueDisplay.textContent = input.value;

    input.addEventListener('input', (e) => {
      valueDisplay.textContent = e.target.value;
      this.handleInputChange(name, parseFloat(e.target.value));
    });

    container.appendChild(input);
    container.appendChild(valueDisplay);

    return container;
  }

  /**
   * Create a checkbox element
   */
  createCheckbox(name, label, checked) {
    const container = this.createDiv({ className: 'flex items-center gap-2' }, []);

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = name;
    input.checked = checked || false;
    input.className = this.styles.checkbox;

    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    labelEl.className = 'text-white text-sm';

    input.addEventListener('change', (e) => this.handleInputChange(name, e.target.checked));

    container.appendChild(input);
    container.appendChild(labelEl);

    return container;
  }

  /**
   * Create a label element
   */
  createLabel(forId, text, required) {
    const label = document.createElement('label');
    label.htmlFor = forId;
    label.className = this.styles.label;

    const labelText = document.createTextNode(text);
    label.appendChild(labelText);

    if (required) {
      const requiredStar = document.createElement('span');
      requiredStar.className = 'text-red-400 ml-1';
      requiredStar.textContent = '*';
      label.appendChild(requiredStar);
    }

    return label;
  }

  /**
   * Create a div element with children
   */
  createDiv(attrs, children = []) {
    const div = document.createElement('div');
    if (attrs.className) div.className = attrs.className;
    if (attrs.id) div.id = attrs.id;
    children.forEach((child) => {
      if (typeof child === 'string') {
        div.appendChild(document.createTextNode(child));
      } else {
        div.appendChild(child);
      }
    });
    return div;
  }

  /**
   * Handle input change and notify callbacks
   */
  handleInputChange(name, value) {
    this.onChange(name, value);
  }

  /**
   * Validate a single input
   */
  validateInput(inputDef, value) {
    const errors = [];

    if (inputDef.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push(`${inputDef.label} is required`);
    }

    if (inputDef.min !== undefined && typeof value === 'number' && value < inputDef.min) {
      errors.push(`${inputDef.label} must be at least ${inputDef.min}`);
    }

    if (inputDef.max !== undefined && typeof value === 'number' && value > inputDef.max) {
      errors.push(`${inputDef.label} must be at most ${inputDef.max}`);
    }

    return errors;
  }

  /**
   * Validate all inputs in a template
   */
  validateTemplate(template, values) {
    const errors = {};

    if (!template || !template.inputs) {
      return errors;
    }

    template.inputs.forEach((inputDef) => {
      const inputErrors = this.validateInput(inputDef, values[inputDef.name]);
      if (inputErrors.length > 0) {
        errors[inputDef.name] = inputErrors;
      }
    });

    const isValid = Object.keys(errors).length === 0;
    this.onValidationChange(isValid, errors);

    return errors;
  }

  /**
   * Get all values from a form element
   */
  getFormValues(formElement) {
    const values = {};
    const inputs = formElement.querySelectorAll('input, select, textarea');

    inputs.forEach((input) => {
      const name = input.name.replace('template-input-', '');
      if (input.type === 'checkbox') {
        values[name] = input.checked;
      } else if (input.type === 'file') {
        // File inputs handled separately via FileReader
      } else {
        values[name] = input.value;
      }
    });

    return values;
  }

  /**
   * Reset form to initial values
   */
  resetForm(formElement, initialValues = {}) {
    const inputs = formElement.querySelectorAll('input, select, textarea');

    inputs.forEach((input) => {
      const name = input.name.replace('template-input-', '');
      const initialValue = initialValues[name];

      if (input.type === 'checkbox') {
        input.checked = initialValue || false;
      } else {
        input.value = initialValue || '';
      }
    });
  }

  /**
   * Enable/disable all form inputs
   */
  setFormEnabled(formElement, enabled) {
    const inputs = formElement.querySelectorAll('input, select, textarea, button');

    inputs.forEach((input) => {
      input.disabled = !enabled;
    });
  }

  /**
   * Show/hide form loading state
   */
  setFormLoading(formElement, loading) {
    const container = formElement.querySelector(`.${this.styles.formContainer}`);
    if (container) {
      if (loading) {
        container.classList.add('opacity-50', 'pointer-events-none');
      } else {
        container.classList.remove('opacity-50', 'pointer-events-none');
      }
    }
  }

  /**
   * Destroy form and cleanup
   */
  destroy(formElement) {
    const inputs = formElement.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const clone = input.cloneNode(false);
      input.parentNode.replaceChild(clone, input);
    });
  }
}

/**
 * Helper function to generate form HTML string for React/Vue frameworks
 */
export function generateFormHTML(template, values = {}, namespace = 'template-input') {
  const generator = new DynamicFormGenerator();
  const container = generator.generateForm(template, values, namespace);
  return container.outerHTML;
}

/**
 * Validate template input values
 */
export function validateTemplateInputs(template, values) {
  const generator = new DynamicFormGenerator();
  return generator.validateTemplate(template, values);
}

/**
 * Get input schema from template for external validation
 */
export function getInputSchema(template) {
  if (!template || !template.inputs) {
    return { properties: {}, required: [] };
  }

  const properties = {};
  const required = [];

  template.inputs.forEach((input) => {
    properties[input.name] = {
      type: input.type,
      label: input.label,
      placeholder: input.placeholder,
      options: input.options,
      min: input.min,
      max: input.max,
      step: input.step,
      helpText: input.helpText,
    };

    if (input.required) {
      required.push(input.name);
    }
  });

  return { properties, required };
}