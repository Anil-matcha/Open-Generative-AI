export const INPUT_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  IMAGE: 'image',
  SLIDER: 'slider',
};

export function generateFormFromTemplate(template, options = {}) {
  const { enableConditionalFields = true } = options;
  const inputs = template.inputs || [];
  const formConfig = [];

  inputs.forEach((input, index) => {
    const fieldConfig = {
      id: input.name || `field_${index}`,
      type: input.type || INPUT_TYPES.TEXT,
      label: input.label || input.name,
      placeholder: input.placeholder || '',
      required: !!input.required,
      options: input.options || [],
      defaultValue: input.defaultValue || getDefaultForType(input.type),
      min: input.min ?? 0,
      max: input.max ?? 100,
      step: input.step ?? 1,
      validation: input.validation || {},
      condition: input.condition || null,
      helpText: input.helpText || '',
      visible: true,
    };

    if (enableConditionalFields && input.condition) {
      fieldConfig.visible = evaluateCondition(input.condition, {});
    }

    formConfig.push(fieldConfig);
  });

  return formConfig;
}

export function getDefaultForType(type) {
  switch (type) {
    case INPUT_TYPES.TEXT:
    case INPUT_TYPES.TEXTAREA:
      return '';
    case INPUT_TYPES.NUMBER:
    case INPUT_TYPES.SLIDER:
      return 0;
    case INPUT_TYPES.CHECKBOX:
      return false;
    case INPUT_TYPES.SELECT:
      return null;
    case INPUT_TYPES.IMAGE:
      return null;
    default:
      return '';
  }
}

export function evaluateCondition(condition, formState) {
  if (!condition) return true;

  const { field, operator, value } = condition;
  const fieldValue = formState[field];

  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'notEquals':
      return fieldValue !== value;
    case 'contains':
      return Array.isArray(fieldValue) 
        ? fieldValue.includes(value)
        : String(fieldValue).includes(value);
    case 'greaterThan':
      return Number(fieldValue) > Number(value);
    case 'lessThan':
      return Number(fieldValue) < Number(value);
    case 'isEmpty':
      return !fieldValue || fieldValue === '';
    case 'isNotEmpty':
      return !!fieldValue && fieldValue !== '';
    case 'isTrue':
      return fieldValue === true;
    case 'isFalse':
      return fieldValue === false;
    case 'includes':
      return Array.isArray(value) 
        ? value.some(v => fieldValue?.includes(v))
        : fieldValue?.includes(value);
    default:
      return true;
  }
}

export function createFormFieldElement(fieldConfig, onChange) {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-field mb-5';
  wrapper.dataset.fieldId = fieldConfig.id;

  const label = document.createElement('label');
  label.className = 'block text-sm font-semibold text-zinc-200 mb-2';
  label.textContent = fieldConfig.label;
  if (fieldConfig.required) {
    label.innerHTML += '<span class="text-red-400 ml-1">*</span>';
  }
  wrapper.appendChild(label);

  if (fieldConfig.helpText) {
    const helpText = document.createElement('p');
    helpText.className = 'text-xs text-zinc-500 mb-2';
    helpText.textContent = fieldConfig.helpText;
    wrapper.appendChild(helpText);
  }

  let inputElement;

  switch (fieldConfig.type) {
    case INPUT_TYPES.TEXTAREA:
      inputElement = createTextarea(fieldConfig);
      break;
    case INPUT_TYPES.NUMBER:
      inputElement = createNumberInput(fieldConfig);
      break;
    case INPUT_TYPES.SELECT:
      inputElement = createSelectInput(fieldConfig);
      break;
    case INPUT_TYPES.CHECKBOX:
      inputElement = createCheckboxInput(fieldConfig);
      break;
    case INPUT_TYPES.IMAGE:
      inputElement = createImageUpload(fieldConfig);
      break;
    case INPUT_TYPES.SLIDER:
      inputElement = createSliderInput(fieldConfig);
      break;
    default:
      inputElement = createTextInput(fieldConfig);
  }

  if (inputElement) {
    wrapper.appendChild(inputElement);
  }

  if (!fieldConfig.visible) {
    wrapper.style.display = 'none';
  }

  return wrapper;
}

function createTextInput(config) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'w-full rounded-[20px] border border-white/20 bg-gradient-to-b from-white/[0.08] to-white/[0.04] px-5 py-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20';
  input.placeholder = config.placeholder;
  input.value = config.defaultValue || '';
  input.required = config.required;
  input.name = config.id;
  
  input.addEventListener('input', (e) => {
    if (typeof onChange === 'function') {
      onChange(config.id, e.target.value);
    }
  });

  return input;
}

function createTextarea(config) {
  const textarea = document.createElement('textarea');
  textarea.className = 'w-full rounded-[20px] border border-white/20 bg-gradient-to-b from-white/[0.08] to-white/[0.04] px-5 py-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 resize-none';
  textarea.placeholder = config.placeholder;
  textarea.value = config.defaultValue || '';
  textarea.required = config.required;
  textarea.name = config.id;
  textarea.rows = 4;
  textarea.style.minHeight = '100px';

  textarea.addEventListener('input', (e) => {
    if (typeof onChange === 'function') {
      onChange(config.id, e.target.value);
    }
  });

  return textarea;
}

function createNumberInput(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-center gap-3';

  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'w-full rounded-[20px] border border-white/20 bg-gradient-to-b from-white/[0.08] to-white/[0.04] px-5 py-4 text-sm text-white outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20';
  input.placeholder = config.placeholder;
  input.value = config.defaultValue ?? config.min ?? 0;
  input.min = config.min;
  input.max = config.max;
  input.step = config.step;
  input.required = config.required;
  input.name = config.id;

  const numValue = document.createElement('span');
  numValue.className = 'text-sm text-emerald-400 font-medium min-w-[40px] text-center';
  numValue.textContent = input.value;

  input.addEventListener('input', (e) => {
    numValue.textContent = e.target.value;
    if (typeof onChange === 'function') {
      onChange(config.id, Number(e.target.value));
    }
  });

  wrapper.appendChild(input);
  wrapper.appendChild(numValue);

  return wrapper;
}

function createSelectInput(config) {
  const select = document.createElement('select');
  select.className = 'h-12 w-full rounded-[20px] border border-white/20 bg-gradient-to-b from-white/[0.08] to-white/[0.04] px-5 text-sm text-white outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 appearance-none cursor-pointer';
  select.required = config.required;
  select.name = config.id;

  if (!config.placeholder && config.options && config.options.length > 0) {
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = `Select ${config.label}`;
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    select.appendChild(defaultOpt);
  } else if (config.placeholder) {
    const placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = config.placeholder;
    placeholderOpt.disabled = true;
    placeholderOpt.selected = true;
    select.appendChild(placeholderOpt);
  }

  (config.options || []).forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    option.className = 'bg-zinc-900 text-white';
    select.appendChild(option);
  });

  select.addEventListener('change', (e) => {
    if (typeof onChange === 'function') {
      onChange(config.id, e.target.value);
    }
  });

  return select;
}

function createCheckboxInput(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-center gap-3';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = `checkbox_${config.id}`;
  checkbox.className = 'h-5 w-5 rounded border-white/30 bg-white/10 text-emerald-400 focus:ring-emerald-400/50 cursor-pointer';
  checkbox.checked = config.defaultValue || false;
  checkbox.required = config.required;
  checkbox.name = config.id;

  const label = document.createElement('label');
  label.htmlFor = `checkbox_${config.id}`;
  label.className = 'text-sm text-zinc-300 cursor-pointer';
  label.textContent = config.placeholder || config.label;

  checkbox.addEventListener('change', (e) => {
    if (typeof onChange === 'function') {
      onChange(config.id, e.target.checked);
    }
  });

  wrapper.appendChild(checkbox);
  wrapper.appendChild(label);

  return wrapper;
}

function createImageUpload(config) {
  const uploadArea = document.createElement('div');
  uploadArea.className = 'group flex h-20 items-center gap-4 rounded-[24px] border-2 border-dashed border-white/20 bg-gradient-to-r from-white/[0.02] to-white/[0.01] px-6 text-zinc-400 cursor-pointer transition hover:border-emerald-400/40 hover:bg-emerald-500/5 hover:text-emerald-300';
  uploadArea.innerHTML = `
    <div class="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-xl group-hover:border-emerald-400/40 group-hover:bg-emerald-500/10 transition">📁</div>
    <div class="flex-1">
      <div class="text-sm font-medium text-zinc-300 group-hover:text-emerald-200">Upload Image</div>
      <div class="text-xs text-zinc-500 group-hover:text-emerald-300/80">Click to browse or drag and drop</div>
    </div>
  `;

  uploadArea.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageFile(file, uploadArea, config);
      }
    };
    input.click();
  });

  if (config.defaultValue) {
    uploadArea.innerHTML = `
      <div class="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-xl">✓</div>
      <div class="flex-1">
        <div class="text-sm font-medium text-emerald-200">Image Selected</div>
        <div class="text-xs text-emerald-300/80">Click to change</div>
      </div>
    `;
    uploadArea.className = uploadArea.className.replace('border-dashed border-white/20', 'border-solid border-emerald-400/40');
  }

  return uploadArea;
}

function handleImageFile(file, uploadArea, config) {
  if (!file.type.startsWith('image/')) {
    showValidationError(uploadArea, 'Please select an image file');
    return;
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    showValidationError(uploadArea, 'File size must be less than 10MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadArea.innerHTML = `
      <div class="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-xl">✓</div>
      <div class="flex-1">
        <div class="text-sm font-medium text-emerald-200">${file.name}</div>
        <div class="text-xs text-emerald-300/80">Click to change</div>
      </div>
    `;
    uploadArea.className = uploadArea.className.replace('border-dashed border-white/20', 'border-solid border-emerald-400/40');
    uploadArea.dataset.imageUrl = e.target.result;
  };
  reader.readAsDataURL(file);
}

function createSliderInput(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-2';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'w-full h-2 rounded-full bg-white/10 appearance-none cursor-pointer accent-emerald-400';
  slider.min = config.min ?? 0;
  slider.max = config.max ?? 100;
  slider.step = config.step ?? 1;
  slider.value = config.defaultValue ?? config.min ?? 0;
  slider.required = config.required;
  slider.name = config.id;

  const valueDisplay = document.createElement('div');
  valueDisplay.className = 'flex items-center justify-between text-xs text-zinc-400';
  valueDisplay.innerHTML = `
    <span>${config.min ?? 0}</span>
    <span class="text-emerald-400 font-medium" id="slider_value_${config.id}">${slider.value}</span>
    <span>${config.max ?? 100}</span>
  `;

  slider.addEventListener('input', (e) => {
    const value = Number(e.target.value);
    document.getElementById(`slider_value_${config.id}`).textContent = value;
    if (typeof onChange === 'function') {
      onChange(config.id, value);
    }
  });

  wrapper.appendChild(slider);
  wrapper.appendChild(valueDisplay);

  return wrapper;
}

function showValidationError(element, message) {
  const existingError = element.parentElement.querySelector('.validation-error');
  if (existingError) {
    existingError.remove();
  }

  const error = document.createElement('div');
  error.className = 'validation-error text-xs text-red-400 mt-2';
  error.textContent = message;
  element.parentElement.appendChild(error);

  setTimeout(() => error.remove(), 3000);
}

export function updateFieldVisibility(formContainer, fieldId, visible) {
  const field = formContainer.querySelector(`[data-field-id="${fieldId}"]`);
  if (field) {
    field.style.display = visible ? 'block' : 'none';
  }
}

export function updateSelectOptions(selectElement, options) {
  if (!selectElement || selectElement.tagName !== 'SELECT') return;

  selectElement.innerHTML = '';

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Select...';
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  selectElement.appendChild(defaultOpt);

  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    option.className = 'bg-zinc-900 text-white';
    selectElement.appendChild(option);
  });
}