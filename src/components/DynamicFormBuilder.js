import { generateFormFromTemplate, createFormFieldElement, updateFieldVisibility } from './DynamicForm.js';
import { DynamicFormValidator } from './DynamicFormValidator.js';
import { DynamicFormState, createFormStateManager } from './DynamicFormState.js';
import { DynamicFormPreview, createPreviewManager } from './DynamicFormPreview.js';

export class DynamicFormBuilder {
  constructor(template, options = {}) {
    this.template = template;
    this.options = {
      containerClass: options.containerClass || 'dynamic-form',
      showValidation: options.showValidation !== false,
      showPreview: options.showPreview !== false,
      previewDelay: options.previewDelay || 500,
      enableConditionalFields: options.enableConditionalFields !== false,
      onValidationChange: options.onValidationChange || null,
      onFieldChange: options.onFieldChange || null,
      onFormComplete: options.onFormComplete || null,
      ...options
    };

    this.container = null;
    this.formElement = null;
    this.previewElement = null;
    this.validationDisplay = null;

    this.formConfig = generateFormFromTemplate(template, {
      enableConditionalFields: this.options.enableConditionalFields
    });

    this.validator = new DynamicFormValidator(template);
    this.stateManager = createFormStateManager(template);
    this.previewManager = null;

    this.subscribed = false;
  }

  render(container) {
    this.container = container;

    const wrapper = document.createElement('div');
    wrapper.className = this.options.containerClass;

    this.formElement = this.createFormElement();
    wrapper.appendChild(this.formElement);

    if (this.options.showPreview) {
      this.previewElement = this.createPreviewElement();
      wrapper.appendChild(this.previewElement);
      this.previewManager = createPreviewManager(this.previewElement, {
        updateDelay: this.options.previewDelay
      });
      this.previewManager.setTemplate(this.template);
    }

    if (this.options.showValidation) {
      this.validationDisplay = this.createValidationDisplay();
      wrapper.appendChild(this.validationDisplay);
    }

    this.setupSubscriptions();

    return wrapper;
  }

  createFormElement() {
    const form = document.createElement('form');
    form.className = 'dynamic-form-fields space-y-5';
    form.noValidate = true;

    this.formConfig.forEach(fieldConfig => {
      const fieldElement = this.createFieldElement(fieldConfig);
      form.appendChild(fieldElement);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      return this.handleSubmit();
    });

    return form;
  }

  createFieldElement(fieldConfig) {
    const fieldElement = createFormFieldElement(fieldConfig, (fieldId, value) => {
      this.handleFieldChange(fieldId, value);
    });

    const errorElement = document.createElement('div');
    errorElement.className = 'field-error text-xs text-red-400 mt-1 hidden';
    errorElement.dataset.errorFor = fieldConfig.id;
    fieldElement.appendChild(errorElement);

    return fieldElement;
  }

  createPreviewElement() {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'dynamic-form-preview rounded-xl border border-white/10 bg-black/30 p-4 mt-5';
    previewContainer.innerHTML = `
      <div class="preview-header flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-zinc-300">Live Preview</h4>
        <span class="text-xs text-zinc-500">Updates as you type</span>
      </div>
      <div class="preview-area rounded-lg bg-black/20 p-4 min-h-[150px] flex items-center justify-center">
        <div class="text-center text-zinc-500">
          <div class="text-2xl mb-2">🎯</div>
          <p class="text-sm">Configure settings to see preview</p>
        </div>
      </div>
    `;
    return previewContainer;
  }

  createValidationDisplay() {
    const display = document.createElement('div');
    display.className = 'dynamic-form-validation mt-4 p-3 rounded-lg bg-black/20 border border-white/5';
    display.innerHTML = `
      <div class="validation-header flex items-center gap-2 mb-2">
        <div class="validation-icon w-2 h-2 rounded-full bg-zinc-500"></div>
        <span class="text-sm text-zinc-400">Form Status</span>
      </div>
      <div class="validation-progress mb-2">
        <div class="flex justify-between text-xs text-zinc-500 mb-1">
          <span>Completion</span>
          <span class="completion-percent">0%</span>
        </div>
        <div class="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div class="completion-bar h-full bg-emerald-500/50 transition-all duration-300" style="width: 0%"></div>
        </div>
      </div>
      <div class="validation-errors hidden"></div>
    `;
    return display;
  }

  handleFieldChange(fieldId, value) {
    this.stateManager.setValue(fieldId, value);

    this.updateFieldValidation(fieldId);
    this.updateConditionalFields(fieldId);
    this.updateValidationDisplay();
    this.updatePreview();

    if (typeof this.options.onFieldChange === 'function') {
      this.options.onFieldChange(fieldId, value, this.stateManager.getValues());
    }

    const validation = this.stateManager.validateAll();
    if (validation.isComplete && typeof this.options.onFormComplete === 'function') {
      this.options.onFormComplete(this.stateManager.getValues());
    }
  }

  updateFieldValidation(fieldId) {
    const fieldState = this.stateManager.state[fieldId];
    if (!fieldState) return;

    const errorElement = this.formElement.querySelector(`[data-error-for="${fieldId}"]`);
    if (!errorElement) return;

    if (fieldState.error) {
      errorElement.textContent = fieldState.error;
      errorElement.classList.remove('hidden');
      errorElement.previousElementSibling?.classList.add('border-red-400/50');
    } else {
      errorElement.classList.add('hidden');
      errorElement.previousElementSibling?.classList.remove('border-red-400/50');
    }
  }

  updateConditionalFields(changedFieldName) {
    this.formConfig.forEach(fieldConfig => {
      if (fieldConfig.condition) {
        const isVisible = this.stateManager.isFieldVisible(fieldConfig.id);
        updateFieldVisibility(this.formElement, fieldConfig.id, isVisible);
      }
    });
  }

  updateValidationDisplay() {
    if (!this.validationDisplay) return;

    const validation = this.stateManager.validateAll();
    const percentage = this.stateManager.getCompletionPercentage();

    const completionPercent = this.validationDisplay.querySelector('.completion-percent');
    const completionBar = this.validationDisplay.querySelector('.completion-bar');
    const validationIcon = this.validationDisplay.querySelector('.validation-icon');
    const validationErrors = this.validationDisplay.querySelector('.validation-errors');

    if (completionPercent) {
      completionPercent.textContent = `${percentage}%`;
    }

    if (completionBar) {
      completionBar.style.width = `${percentage}%`;
      if (percentage === 100) {
        completionBar.classList.add('bg-emerald-500');
        completionBar.classList.remove('bg-emerald-500/50');
      }
    }

    if (validationIcon) {
      if (validation.valid && percentage === 100) {
        validationIcon.className = 'validation-icon w-2 h-2 rounded-full bg-emerald-400';
      } else if (validation.errors.length > 0) {
        validationIcon.className = 'validation-icon w-2 h-2 rounded-full bg-red-400';
      } else {
        validationIcon.className = 'validation-icon w-2 h-2 rounded-full bg-amber-400';
      }
    }

    if (validationErrors) {
      if (validation.errors.length > 0) {
        validationErrors.classList.remove('hidden');
        validationErrors.innerHTML = validation.errors
          .map(e => `<div class="text-xs text-red-400/80 mt-1">• ${e.error}</div>`)
          .join('');
      } else {
        validationErrors.classList.add('hidden');
      }
    }

    if (typeof this.options.onValidationChange === 'function') {
      this.options.onValidationChange(validation);
    }
  }

  updatePreview() {
    if (this.previewManager) {
      this.previewManager.updateFormState(this.stateManager.getValues());
    }
  }

  setupSubscriptions() {
    if (this.subscribed) return;

    this.stateManager.subscribe((fieldName, value, type) => {
      if (type === 'visibility') {
        updateFieldVisibility(this.formElement, fieldName, this.stateManager.isFieldVisible(fieldName));
      }
    });

    this.subscribed = true;
  }

  handleSubmit() {
    const validation = this.stateManager.validateAll();

    if (!validation.valid) {
      this.showValidationErrors(validation.errors);
      return false;
    }

    return true;
  }

  showValidationErrors(errors) {
    errors.forEach(error => {
      const errorElement = this.formElement.querySelector(`[data-error-for="${error.field}"]`);
      if (errorElement) {
        errorElement.textContent = error.error;
        errorElement.classList.remove('hidden');
      }
    });
  }

  getFormData() {
    return this.stateManager.getValues();
  }

  getVisibleFormData() {
    return this.stateManager.getVisibleValues();
  }

  isValid() {
    return this.stateManager.validateAll().valid;
  }

  isComplete() {
    return this.stateManager.validateAll().isComplete;
  }

  getValidation() {
    return this.stateManager.validateAll();
  }

  reset() {
    this.stateManager.reset();
    this.formElement.reset();
    this.updateValidationDisplay();
    this.updatePreview();
  }

  setValues(values) {
    this.stateManager.setValues(values);
    this.updateValidationDisplay();
    this.updatePreview();
  }

  destroy() {
    if (this.previewManager) {
      this.previewManager.destroy();
    }
  }
}

export function createDynamicForm(template, container, options = {}) {
  const builder = new DynamicFormBuilder(template, options);
  return builder.render(container);
}

export function validateFormInputs(template, formData) {
  const validator = new DynamicFormValidator(template);
  return validator.validateAll(formData);
}