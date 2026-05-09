import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  generateFormFromTemplate,
  evaluateCondition,
  getDefaultForType,
  INPUT_TYPES,
  createFormFieldElement,
  updateFieldVisibility,
  updateSelectOptions
} from '../../src/components/DynamicForm.js';

import {
  DynamicFormValidator,
  validateTemplateForm,
  validateField
} from '../../src/components/DynamicFormValidator.js';

import {
  DynamicFormState,
  createFormStateManager
} from '../../src/components/DynamicFormState.js';

import {
  DynamicFormBuilder,
  createDynamicForm,
  validateFormInputs
} from '../../src/components/DynamicFormBuilder.js';

describe('DynamicForm', () => {
  describe('generateFormFromTemplate', () => {
    it('should generate form config from template inputs', () => {
      const template = {
        inputs: [
          { name: 'prompt', type: 'text', label: 'Description' },
          { name: 'style', type: 'select', label: 'Style', options: ['A', 'B', 'C'] }
        ]
      };

      const formConfig = generateFormFromTemplate(template);

      expect(formConfig).toHaveLength(2);
      expect(formConfig[0].id).toBe('prompt');
      expect(formConfig[0].type).toBe('text');
      expect(formConfig[1].id).toBe('style');
      expect(formConfig[1].options).toEqual(['A', 'B', 'C']);
    });

    it('should handle all input types', () => {
      const template = {
        inputs: [
          { name: 'textField', type: 'text', label: 'Text Input' },
          { name: 'textareaField', type: 'textarea', label: 'Textarea' },
          { name: 'numberField', type: 'number', label: 'Number Input' },
          { name: 'selectField', type: 'select', label: 'Select', options: ['X', 'Y'] },
          { name: 'checkboxField', type: 'checkbox', label: 'Checkbox' },
          { name: 'imageField', type: 'image', label: 'Image Upload' },
          { name: 'sliderField', type: 'slider', label: 'Slider' }
        ]
      };

      const formConfig = generateFormFromTemplate(template);

      expect(formConfig).toHaveLength(7);
      expect(formConfig.map(f => f.type)).toEqual([
        'text', 'textarea', 'number', 'select', 'checkbox', 'image', 'slider'
      ]);
    });

    it('should set default values based on input type', () => {
      const template = {
        inputs: [
          { name: 'textField', type: 'text' },
          { name: 'numberField', type: 'number' },
          { name: 'checkboxField', type: 'checkbox' },
          { name: 'selectField', type: 'select', options: ['A', 'B'] }
        ]
      };

      const formConfig = generateFormFromTemplate(template);

      expect(formConfig[0].defaultValue).toBe('');
      expect(formConfig[1].defaultValue).toBe(0);
      expect(formConfig[2].defaultValue).toBe(false);
      expect(formConfig[3].defaultValue).toBe('A');
    });

    it('should mark required fields', () => {
      const template = {
        inputs: [
          { name: 'requiredField', type: 'text', required: true },
          { name: 'optionalField', type: 'text', required: false }
        ]
      };

      const formConfig = generateFormFromTemplate(template);

      expect(formConfig[0].required).toBe(true);
      expect(formConfig[1].required).toBe(false);
    });

    it('should evaluate conditional visibility', () => {
      const template = {
        inputs: [
          { name: 'trigger', type: 'select', options: ['show', 'hide'] },
          { name: 'conditional', type: 'text', condition: { field: 'trigger', operator: 'equals', value: 'show' } }
        ]
      };

      const formConfig = generateFormFromTemplate(template, { enableConditionalFields: true });

      expect(formConfig[1].visible).toBe(false);
      expect(evaluateCondition(formConfig[1].condition, { trigger: 'show' })).toBe(true);
    });
  });

  describe('evaluateCondition', () => {
    it('should handle equals operator', () => {
      const condition = { field: 'status', operator: 'equals', value: 'active' };
      expect(evaluateCondition(condition, { status: 'active' })).toBe(true);
      expect(evaluateCondition(condition, { status: 'inactive' })).toBe(false);
    });

    it('should handle notEquals operator', () => {
      const condition = { field: 'status', operator: 'notEquals', value: 'active' };
      expect(evaluateCondition(condition, { status: 'inactive' })).toBe(true);
      expect(evaluateCondition(condition, { status: 'active' })).toBe(false);
    });

    it('should handle contains operator', () => {
      const condition = { field: 'tags', operator: 'contains', value: 'premium' };
      expect(evaluateCondition(condition, { tags: ['premium', 'basic'] })).toBe(true);
      expect(evaluateCondition(condition, { tags: ['basic'] })).toBe(false);
      expect(evaluateCondition(condition, { tags: 'premium-plan' })).toBe(true);
    });

    it('should handle greaterThan operator', () => {
      const condition = { field: 'age', operator: 'greaterThan', value: 18 };
      expect(evaluateCondition(condition, { age: 25 })).toBe(true);
      expect(evaluateCondition(condition, { age: 15 })).toBe(false);
    });

    it('should handle lessThan operator', () => {
      const condition = { field: 'count', operator: 'lessThan', value: 10 };
      expect(evaluateCondition(condition, { count: 5 })).toBe(true);
      expect(evaluateCondition(condition, { count: 15 })).toBe(false);
    });

    it('should handle isEmpty operator', () => {
      const condition = { field: 'name', operator: 'isEmpty' };
      expect(evaluateCondition(condition, { name: '' })).toBe(true);
      expect(evaluateCondition(condition, { name: null })).toBe(true);
      expect(evaluateCondition(condition, { name: 'John' })).toBe(false);
    });

    it('should handle isNotEmpty operator', () => {
      const condition = { field: 'email', operator: 'isNotEmpty' };
      expect(evaluateCondition(condition, { email: 'test@example.com' })).toBe(true);
      expect(evaluateCondition(condition, { email: '' })).toBe(false);
    });

    it('should handle isTrue and isFalse operators', () => {
      const trueCond = { field: 'enabled', operator: 'isTrue' };
      const falseCond = { field: 'enabled', operator: 'isFalse' };

      expect(evaluateCondition(trueCond, { enabled: true })).toBe(true);
      expect(evaluateCondition(trueCond, { enabled: false })).toBe(false);
      expect(evaluateCondition(falseCond, { enabled: false })).toBe(true);
      expect(evaluateCondition(falseCond, { enabled: true })).toBe(false);
    });
  });

  describe('getDefaultForType', () => {
    it('should return correct defaults for each type', () => {
      expect(getDefaultForType('text')).toBe('');
      expect(getDefaultForType('textarea')).toBe('');
      expect(getDefaultForType('number')).toBe(0);
      expect(getDefaultForType('slider')).toBe(0);
      expect(getDefaultForType('checkbox')).toBe(false);
      expect(getDefaultForType('select')).toBe(null);
      expect(getDefaultForType('image')).toBe(null);
      expect(getDefaultForType('unknown')).toBe('');
    });
  });
});

describe('DynamicFormValidator', () => {
  const mockTemplate = {
    inputs: [
      { name: 'image_url', type: 'image', label: 'Upload your photo', required: true },
      { name: 'prompt', type: 'text', label: 'Describe the video', required: true },
      { name: 'name', type: 'select', label: 'Effect', options: ['360 Rotation', 'Cakeify'], required: false },
      { name: 'aspect_ratio', type: 'select', label: 'Aspect Ratio', options: ['9:16', '16:9'], required: false },
      { name: 'duration', type: 'select', label: 'Duration', options: ['5', '8', '10'], required: false }
    ]
  };

  describe('validateField', () => {
    it('should validate required image field', () => {
      const validator = new DynamicFormValidator(mockTemplate);

      const result = validator.validateField('image_url', '', {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');

      const resultWithValue = validator.validateField('image_url', 'test.jpg', {});
      expect(resultWithValue.valid).toBe(true);
    });

    it('should validate required text field', () => {
      const validator = new DynamicFormValidator(mockTemplate);

      const result = validator.validateField('prompt', '', {});
      expect(result.valid).toBe(false);

      const resultWithValue = validator.validateField('prompt', 'dancing', {});
      expect(resultWithValue.valid).toBe(true);
    });

    it('should validate minLength constraint', () => {
      const template = {
        inputs: [{ name: 'bio', type: 'text', label: 'Bio', minLength: 10 }]
      };
      const validator = new DynamicFormValidator(template);

      const result = validator.validateField('bio', 'short', {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10 characters');

      const resultLong = validator.validateField('bio', 'this is a longer bio', {});
      expect(resultLong.valid).toBe(true);
    });

    it('should validate maxLength constraint', () => {
      const template = {
        inputs: [{ name: 'title', type: 'text', label: 'Title', maxLength: 50 }]
      };
      const validator = new DynamicFormValidator(template);

      const result = validator.validateField('title', 'a'.repeat(100), {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('50 characters');
    });

    it('should validate min constraint for numbers', () => {
      const template = {
        inputs: [{ name: 'age', type: 'number', label: 'Age', min: 18 }]
      };
      const validator = new DynamicFormValidator(template);

      const result = validator.validateField('age', 15, {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('18');

      const resultValid = validator.validateField('age', 25, {});
      expect(resultValid.valid).toBe(true);
    });

    it('should validate max constraint for numbers', () => {
      const template = {
        inputs: [{ name: 'score', type: 'number', label: 'Score', max: 100 }]
      };
      const validator = new DynamicFormValidator(template);

      const result = validator.validateField('score', 150, {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('100');

      const resultValid = validator.validateField('score', 85, {});
      expect(resultValid.valid).toBe(true);
    });

    it('should validate select options', () => {
      const validator = new DynamicFormValidator(mockTemplate);

      const result = validator.validateField('name', 'InvalidOption', {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid selection');

      const resultValid = validator.validateField('name', '360 Rotation', {});
      expect(resultValid.valid).toBe(true);
    });

    it('should allow empty values for optional fields', () => {
      const validator = new DynamicFormValidator(mockTemplate);

      const result = validator.validateField('name', '', {});
      expect(result.valid).toBe(true);
    });

    it('should validate pattern with regex', () => {
      const template = {
        inputs: [{ name: 'email', type: 'text', label: 'Email', pattern: '^[^@]+@[^@]+$' }]
      };
      const validator = new DynamicFormValidator(template);

      const result = validator.validateField('email', 'invalid', {});
      expect(result.valid).toBe(false);

      const resultValid = validator.validateField('email', 'test@example.com', {});
      expect(resultValid.valid).toBe(true);
    });
  });

  describe('validateAll', () => {
    it('should return all errors for invalid form', () => {
      const validator = new DynamicFormValidator(mockTemplate);

      const result = validator.validateAll({});

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.map(e => e.field)).toContain('image_url');
      expect(result.errors.map(e => e.field)).toContain('prompt');
    });

    it('should pass validation for complete form', () => {
      const validator = new DynamicFormValidator(mockTemplate);

      const formData = {
        image_url: 'test.jpg',
        prompt: 'dancing in the rain',
        name: '360 Rotation',
        aspect_ratio: '9:16',
        duration: '5'
      };

      const result = validator.validateAll(formData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should check completion status', () => {
      const validator = new DynamicFormValidator(mockTemplate);

      const result = validator.validateAll({});
      expect(result.isComplete).toBe(false);

      const completeResult = validator.validateAll({
        image_url: 'test.jpg',
        prompt: 'test'
      });
      expect(completeResult.isComplete).toBe(true);
    });
  });

  describe('getRequiredFields', () => {
    it('should return only required fields', () => {
      const validator = new DynamicFormValidator(mockTemplate);

      const required = validator.getRequiredFields();

      expect(required).toHaveLength(2);
      expect(required.map(f => f.name)).toEqual(['image_url', 'prompt']);
    });
  });
});

describe('validateTemplateForm', () => {
  it('should validate template form and return result', () => {
    const template = {
      inputs: [
        { name: 'name', type: 'text', required: true }
      ]
    };

    const result = validateTemplateForm(template, { name: '' });
    expect(result.valid).toBe(false);

    const resultValid = validateTemplateForm(template, { name: 'Test' });
    expect(resultValid.valid).toBe(true);
  });
});

describe('DynamicFormState', () => {
  const template = {
    inputs: [
      { name: 'prompt', type: 'text', label: 'Prompt', required: true },
      { name: 'style', type: 'select', label: 'Style', options: ['A', 'B'], defaultValue: 'A' },
      { name: 'enableEffect', type: 'checkbox', label: 'Enable Effect', defaultValue: false },
      { name: 'quality', type: 'slider', label: 'Quality', min: 0, max: 100, defaultValue: 50 }
    ]
  };

  describe('initialization', () => {
    it('should initialize state with default values', () => {
      const stateManager = createFormStateManager(template);

      expect(stateManager.getValue('prompt')).toBe('');
      expect(stateManager.getValue('style')).toBe('A');
      expect(stateManager.getValue('enableEffect')).toBe(false);
      expect(stateManager.getValue('quality')).toBe(50);
    });
  });

  describe('setValue', () => {
    it('should update field value', () => {
      const stateManager = createFormStateManager(template);

      stateManager.setValue('prompt', 'new prompt');

      expect(stateManager.getValue('prompt')).toBe('new prompt');
      expect(stateManager.isFieldDirty('prompt')).toBe(true);
      expect(stateManager.isFieldTouched('prompt')).toBe(true);
    });

    it('should validate on value change', () => {
      const stateManager = createFormStateManager(template);

      stateManager.setValue('prompt', '');
      expect(stateManager.getFieldError('prompt')).toContain('required');

      stateManager.setValue('prompt', 'test');
      expect(stateManager.getFieldError('prompt')).toBeNull();
    });
  });

  describe('conditional visibility', () => {
    it('should update visibility based on condition', () => {
      const conditionalTemplate = {
        inputs: [
          { name: 'mode', type: 'select', options: ['simple', 'advanced'] },
          { name: 'advancedOption', type: 'text', condition: { field: 'mode', operator: 'equals', value: 'advanced' } }
        ]
      };

      const stateManager = createFormStateManager(conditionalTemplate);

      expect(stateManager.isFieldVisible('advancedOption')).toBe(false);

      stateManager.setValue('mode', 'advanced');

      expect(stateManager.isFieldVisible('advancedOption')).toBe(true);
    });
  });

  describe('validation', () => {
    it('should validate all fields', () => {
      const stateManager = createFormStateManager(template);

      const result = stateManager.validateAll();

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should check completion correctly', () => {
      const stateManager = createFormStateManager(template);

      expect(stateManager.validateAll().isComplete).toBe(false);

      stateManager.setValue('prompt', 'test prompt');

      expect(stateManager.validateAll().isComplete).toBe(true);
    });
  });

  describe('completion tracking', () => {
    it('should track completion percentage', () => {
      const stateManager = createFormStateManager(template);

      expect(stateManager.getCompletionPercentage()).toBe(0);

      stateManager.setValue('prompt', 'test');

      const percentage = stateManager.getCompletionPercentage();
      expect(percentage).toBeGreaterThan(0);
    });

    it('should count filled fields correctly', () => {
      const stateManager = createFormStateManager(template);

      expect(stateManager.getFilledFieldCount()).toBe(1);

      stateManager.setValue('prompt', 'test');

      expect(stateManager.getFilledFieldCount()).toBe(2);
    });
  });

  describe('reset', () => {
    it('should reset all fields to defaults', () => {
      const stateManager = createFormStateManager(template);

      stateManager.setValue('prompt', 'custom value');
      stateManager.setValue('quality', 80);

      stateManager.reset();

      expect(stateManager.getValue('prompt')).toBe('');
      expect(stateManager.getValue('quality')).toBe(50);
    });
  });

  describe('subscription', () => {
    it('should notify subscribers on change', () => {
      const stateManager = createFormStateManager(template);
      const listener = vi.fn();

      stateManager.subscribe(listener);
      stateManager.setValue('prompt', 'test');

      expect(listener).toHaveBeenCalledWith('prompt', 'test', 'change', expect.any(Object));
    });

    it('should allow unsubscription', () => {
      const stateManager = createFormStateManager(template);
      const listener = vi.fn();

      const unsubscribe = stateManager.subscribe(listener);
      unsubscribe();

      stateManager.setValue('prompt', 'test');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('bulk operations', () => {
    it('should set multiple values at once', () => {
      const stateManager = createFormStateManager(template);

      stateManager.setValues({
        prompt: 'bulk test',
        quality: 75
      });

      expect(stateManager.getValue('prompt')).toBe('bulk test');
      expect(stateManager.getValue('quality')).toBe(75);
    });

    it('should get visible values', () => {
      const stateManager = createFormStateManager(template);

      stateManager.setValue('prompt', 'test');

      const values = stateManager.getVisibleValues();

      expect(values.prompt).toBe('test');
      expect(values.style).toBe('A');
    });
  });
});