/**
 * CINEMATIC TEMPLATE WIZARD INTEGRATION
 * Connects the template selection wizard to actual template execution
 * Complete workflow: wizard → form → execution → results
 */

import { muapi } from './muapi.js';
import { securityService } from './services/SecurityService.js';
import { AuthModal } from '../components/AuthModal.js';
import { navigate } from './router.js';
import { sanitizeUrl } from './security.js';
import {
  PromptAssemblyEngine,
  SceneBuilder,
  StoryboardBuilder,
  RenderHandoff,
  VISUAL_STYLES,
  BRAND_VOICES,
  TARGET_AUDIENCES,
  CTA_TYPES,
  SCENE_STRUCTURES
} from './cinematicTemplates.js';

export const EXECUTION_STATES = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  GENERATING: 'generating',
  POLLING: 'polling',
  COMPLETE: 'complete',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

export const EXECUTION_STORAGE_KEY = 'cinematic_template_history';

export class CinematicTemplateWizardIntegration {
  constructor(template, options = {}) {
    this.template = template;
    this.options = {
      onStateChange: () => {},
      onProgress: () => {},
      onResult: () => {},
      onError: () => {},
      maxRetries: 2,
      pollInterval: 2000,
      pollTimeout: 180000,
      ...options
    };

    this.state = {
      executionState: EXECUTION_STATES.IDLE,
      currentStep: 0,
      mode: 'quick',
      inputs: {},
      scenes: [],
      storyboards: [],
      generatedPrompt: '',
      result: null,
      error: null,
      retryCount: 0,
      progress: 0,
      startTime: null,
      requestId: null
    };

    this.abortController = null;
    this.sceneBuilder = null;
    this.storyboardBuilder = null;
    this.executionHistory = this.loadHistory();
  }

  get steps() {
    return ['Configure', 'Scenes', 'Preview', 'Generate'];
  }

  get isCinematic() {
    return this.template?.cinematicData?.sceneBuilder || this.template?.sceneBuilder;
  }

  loadHistory() {
    try {
      const stored = localStorage.getItem(EXECUTION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem(EXECUTION_STORAGE_KEY, JSON.stringify(this.executionHistory.slice(0, 50)));
    } catch { /* ignore */ }
  }

  updateState(updates) {
    this.state = { ...this.state, ...updates };
    this.options.onStateChange(this.state);
  }

  async validateInputs() {
    this.updateState({ executionState: EXECUTION_STATES.VALIDATING });

    const cinematicData = this.template.cinematicData || {};
    const quickInputs = cinematicData.quickInputs || [];
    const advancedInputs = cinematicData.advancedInputs || [];
    const inputsToValidate = this.state.mode === 'quick' ? quickInputs : [...quickInputs, ...advancedInputs];

    const missing = inputsToValidate
      .filter(input => input.required && !this.state.inputs[input.name])
      .map(input => input.label);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    return true;
  }

  mapInputsToParams() {
    const params = {
      model: this.template.model,
      aspect_ratio: this.state.inputs.aspectRatio || this.template.aspectRatio || '16:9',
      ...(this.template.defaultParams || {})
    };

    Object.entries(this.state.inputs).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    if (this.state.generatedPrompt) {
      params.prompt = this.state.generatedPrompt;
    }

    return params;
  }

  assemblePrompt(context = {}) {
    try {
      const engine = new PromptAssemblyEngine(this.template, this.state.inputs, context, {
        mode: this.state.mode
      });
      const prompt = engine.assemble();
      this.updateState({ generatedPrompt: prompt });
      return prompt;
    } catch (error) {
      console.warn('[CinematicTemplateWizardIntegration] Prompt assembly failed, using fallback:', error);
      return this.generateFallbackPrompt();
    }
  }

  generateFallbackPrompt() {
    const parts = [];
    const inputs = this.state.inputs;

    if (inputs.prompt) parts.push(inputs.prompt);
    if (inputs.genre) parts.push(`${inputs.genre} genre`);
    if (inputs.tone) parts.push(`${inputs.tone} tone`);
    if (inputs.story) parts.push(inputs.story);
    if (inputs.premise) parts.push(inputs.premise);

    parts.push('cinematic quality', 'professional lighting', '4K resolution');

    return parts.join('. ');
  }

  async executeGeneration(onProgress) {
    this.updateState({
      executionState: EXECUTION_STATES.GENERATING,
      progress: 0,
      startTime: Date.now(),
      error: null,
      retryCount: 0
    });

    this.abortController = new AbortController();

    try {
      await this.validateInputs();

      const apiKey = await securityService.getDecryptedKey();
      if (!apiKey) {
        return new Promise((resolve, reject) => {
          AuthModal(() => {
            this.executeGeneration(onProgress).then(resolve).catch(reject);
          });
        });
      }

      const params = this.mapInputsToParams();

      if (!params.prompt) {
        params.prompt = this.assemblePrompt();
      }

      this.updateState({ executionState: EXECUTION_STATES.GENERATING, progress: 10 });

      let result;
      if (this.template.modelType === 'i2v') {
        result = await this.executeWithRetry(() => muapi.generateI2V({
          ...params,
          signal: this.abortController.signal,
          onRequestId: (id) => this.updateState({ requestId: id })
        }), onProgress);
      } else if (this.template.modelType === 'i2i') {
        result = await this.executeWithRetry(() => muapi.generateI2I({
          ...params,
          signal: this.abortController.signal,
          onRequestId: (id) => this.updateState({ requestId: id })
        }), onProgress);
      } else {
        result = await this.executeWithRetry(() => muapi.generateImage({
          ...params,
          signal: this.abortController.signal,
          onRequestId: (id) => this.updateState({ requestId: id })
        }), onProgress);
      }

      if (result && result.url) {
        this.updateState({
          executionState: EXECUTION_STATES.COMPLETE,
          result,
          progress: 100
        });

        this.addToHistory(result, params.prompt);
        this.options.onResult(result);

        return result;
      } else {
        throw new Error('No output URL returned from generation');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        this.updateState({ executionState: EXECUTION_STATES.CANCELLED });
      } else {
        this.updateState({
          executionState: EXECUTION_STATES.ERROR,
          error: error.message,
          progress: 0
        });
        this.options.onError(error);
      }
      throw error;
    }
  }

  async executeWithRetry(fn, onProgress, depth = 0) {
    const maxRetries = this.options.maxRetries;

    try {
      this.updateState({ progress: 20 + (depth * 20) });
      onProgress?.(20 + (depth * 20), 'Executing generation...');

      const result = await fn();

      this.updateState({ progress: 60 });
      onProgress?.(60, 'Processing result...');

      if (result.request_id || result.id) {
        this.updateState({ executionState: EXECUTION_STATES.POLLING });
        onProgress?.(60, 'Waiting for result...');

        const finalResult = await this.pollForResult(result.request_id || result.id, onProgress);
        this.updateState({ progress: 90 });
        onProgress?.(90, 'Finalizing...');

        return finalResult;
      }

      return result;
    } catch (error) {
      if (depth < maxRetries && this.isRetryableError(error)) {
        console.log(`[CinematicTemplateWizardIntegration] Retrying (${depth + 1}/${maxRetries})...`);
        this.updateState({ retryCount: depth + 1 });
        await this.delay(1000 * (depth + 1));
        return this.executeWithRetry(fn, onProgress, depth + 1);
      }
      throw error;
    }
  }

  isRetryableError(error) {
    const message = error.message?.toLowerCase() || '';
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('rate limit') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('429')
    );
  }

  async pollForResult(requestId, onProgress) {
    const startTime = Date.now();
    const pollInterval = this.options.pollInterval;
    const pollTimeout = this.options.pollTimeout;
    const apiKey = await securityService.getDecryptedKey();

    while (Date.now() - startTime < pollTimeout) {
      if (this.abortController?.signal.aborted) {
        throw new Error('Request cancelled');
      }

      try {
        const result = await muapi.pollForResult(requestId, apiKey);

        if (result?.status === 'completed' || result?.status === 'succeeded') {
          const url = result.outputs?.[0] || result.url || result.output?.url;
          return { ...result, url };
        }

        if (result?.status === 'failed' || result?.status === 'error') {
          throw new Error(result.error || 'Generation failed');
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(60 + (elapsed / pollTimeout) * 30, 90);
        this.updateState({ progress });
        onProgress?.(progress, 'Processing...');

      } catch (error) {
        if (error.name === 'AbortError') {
          throw error;
        }
        console.warn('[CinematicTemplateWizardIntegration] Poll error:', error.message);
      }

      await this.delay(pollInterval);
    }

    throw new Error('Generation timed out');
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.updateState({ executionState: EXECUTION_STATES.CANCELLED });
    }
  }

  addToHistory(result, prompt) {
    this.executionHistory.unshift({
      id: Date.now().toString(),
      url: result.url,
      prompt,
      templateId: this.template.id,
      templateName: this.template.name,
      timestamp: new Date().toISOString(),
      duration: Date.now() - (this.state.startTime || Date.now()),
      mode: this.state.mode
    });
    this.saveHistory();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setInput(key, value) {
    this.state.inputs[key] = value;
  }

  getInput(key) {
    return this.state.inputs[key];
  }

  setMode(mode) {
    this.state.mode = mode;
  }

  setCurrentStep(step) {
    this.state.currentStep = step;
  }

  initializeBuilders() {
    if (this.template.cinematicData?.sceneBuilder || this.template.sceneBuilder) {
      this.sceneBuilder = new SceneBuilder(this.template);
      this.storyboardBuilder = new StoryboardBuilder(this.template);
    }
  }

  generateScenes(sceneConfigs) {
    if (!this.sceneBuilder) return [];

    this.sceneBuilder.reset();
    sceneConfigs.forEach(config => {
      this.sceneBuilder.addScene(config);
    });

    const scenes = this.sceneBuilder.getScenes();
    this.updateState({ scenes });

    if (this.storyboardBuilder) {
      this.storyboardBuilder.generateFromScenes(scenes);
      this.updateState({ storyboards: this.storyboardBuilder.getBoards() });
    }

    return scenes;
  }

  getScenes() {
    return this.sceneBuilder?.getScenes() || [];
  }

  getStoryboards() {
    return this.storyboardBuilder?.getBoards() || [];
  }

  destroy() {
    this.cancel();
    this.sceneBuilder = null;
    this.storyboardBuilder = null;
  }
}

export function createWizardExecutionBridge(template, callbacks = {}) {
  const integration = new CinematicTemplateWizardIntegration(template, {
    onStateChange: callbacks.onStateChange,
    onProgress: callbacks.onProgress,
    onResult: callbacks.onResult,
    onError: callbacks.onError
  });

  return {
    integration,

    async startGeneration() {
      return integration.executeGeneration(callbacks.onProgress);
    },

    cancel() {
      integration.cancel();
    },

    setInput(key, value) {
      integration.setInput(key, value);
    },

    setMode(mode) {
      integration.setMode(mode);
    },

    assemblePrompt(context) {
      return integration.assemblePrompt(context);
    },

    getState() {
      return integration.state;
    },

    getHistory() {
      return integration.executionHistory;
    },

    clearHistory() {
      integration.executionHistory = [];
      integration.saveHistory();
    }
  };
}

export function createResultsDisplay(result, template, options = {}) {
  const container = document.createElement('div');
  container.className = 'wizard-results';

  const isVideo = template.outputType === 'video';
  const safeUrl = sanitizeUrl(result.url);

  container.innerHTML = `
    <div class="results-card rounded-2xl bg-[#111]/90 backdrop-blur-xl border border-white/10 overflow-hidden">
      <div class="aspect-video bg-black flex items-center justify-center relative">
        ${isVideo
          ? `<video src="${safeUrl}" controls autoplay loop class="w-full h-full object-contain"></video>`
          : `<img src="${safeUrl}" alt="Generated result" class="w-full h-full object-contain" />`
        }
        <div class="absolute top-3 right-3">
          <span class="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-medium text-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2"></span>
            Complete
          </span>
        </div>
      </div>

      <div class="p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-bold text-white">Generation Complete</h3>
            <p class="text-sm text-white/50">Your ${template.name} is ready</p>
          </div>
          <div class="text-3xl">${template.icon}</div>
        </div>

        <div class="flex gap-3">
          <a href="${result.url}" download="${template.id}-${Date.now()}.${isVideo ? 'mp4' : 'png'}"
             class="flex-1 bg-primary text-black py-3 rounded-xl font-bold text-sm text-center hover:opacity-90 transition flex items-center justify-center gap-2">
            <span>Download</span>
            <span>⬇️</span>
          </a>
          <button id="useAgainBtn" class="flex-1 border border-white/10 bg-white/[0.04] text-white py-3 rounded-xl font-bold text-sm hover:bg-white/[0.08] transition">
            Use Again
          </button>
          <button id="closeResultsBtn" class="px-4 border border-white/10 bg-white/[0.04] text-white py-3 rounded-xl font-bold text-sm hover:bg-white/[0.08] transition">
            ✕
          </button>
        </div>

        ${options.showPrompt && result.prompt ? `
          <div class="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div class="text-xs font-medium text-white/50 mb-2">Generated Prompt</div>
            <p class="text-sm text-white/70 leading-relaxed">${escapeHtml(result.prompt)}</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  const useAgainBtn = container.querySelector('#useAgainBtn');
  const closeResultsBtn = container.querySelector('#closeResultsBtn');

  useAgainBtn?.addEventListener('click', () => {
    options.onUseAgain?.();
  });

  closeResultsBtn?.addEventListener('click', () => {
    options.onClose?.();
  });

  return container;
}

export function createErrorDisplay(error, options = {}) {
  const container = document.createElement('div');
  container.className = 'wizard-error';

  container.innerHTML = `
    <div class="error-card rounded-2xl bg-red-900/20 border border-red-500/30 p-6">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-2xl">⚠️</div>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-red-200 mb-1">Generation Failed</h3>
          <p class="text-sm text-red-300/70 mb-4">${escapeHtml(error.message || 'An unexpected error occurred')}</p>

          <div class="flex gap-3">
            ${options.showRetry ? `
              <button id="retryBtn" class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 rounded-lg text-sm font-medium transition">
                🔄 Retry
              </button>
            ` : ''}
            <button id="dismissBtn" class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded-lg text-sm font-medium transition">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const retryBtn = container.querySelector('#retryBtn');
  const dismissBtn = container.querySelector('#dismissBtn');

  retryBtn?.addEventListener('click', () => {
    options.onRetry?.();
  });

  dismissBtn?.addEventListener('click', () => {
    options.onDismiss?.();
  });

  return container;
}

export function createProgressDisplay(state) {
  const container = document.createElement('div');
  container.className = 'wizard-progress';

  const statusLabels = {
    [EXECUTION_STATES.VALIDATING]: 'Validating inputs...',
    [EXECUTION_STATES.GENERATING]: 'Generating...',
    [EXECUTION_STATES.POLLING]: 'Processing...',
    [EXECUTION_STATES.COMPLETE]: 'Complete!',
    [EXECUTION_STATES.ERROR]: 'Error',
    [EXECUTION_STATES.CANCELLED]: 'Cancelled'
  };

  const statusColors = {
    [EXECUTION_STATES.VALIDATING]: 'bg-blue-500',
    [EXECUTION_STATES.GENERATING]: 'bg-emerald-500',
    [EXECUTION_STATES.POLLING]: 'bg-amber-500',
    [EXECUTION_STATES.COMPLETE]: 'bg-emerald-500',
    [EXECUTION_STATES.ERROR]: 'bg-red-500',
    [EXECUTION_STATES.CANCELLED]: 'bg-zinc-500'
  };

  const currentStatus = statusLabels[state.executionState] || 'Processing...';
  const statusColor = statusColors[state.executionState] || 'bg-blue-500';
  const isActive = [EXECUTION_STATES.GENERATING, EXECUTION_STATES.POLLING, EXECUTION_STATES.VALIDATING].includes(state.executionState);

  container.innerHTML = `
    <div class="progress-card rounded-2xl bg-[#111]/90 backdrop-blur-xl border border-white/10 p-6">
      <div class="flex items-center gap-4 mb-4">
        ${isActive ? '<span class="animate-spin text-2xl">⟳</span>' : '<span class="text-2xl">⚡</span>'}
        <div class="flex-1">
          <h3 class="text-lg font-bold text-white">${currentStatus}</h3>
          <p class="text-sm text-white/50">${state.requestId ? `Request: ${state.requestId.slice(0, 8)}...` : 'Preparing...'}</p>
        </div>
      </div>

      <div class="mb-3 h-2 bg-white/10 rounded-full overflow-hidden">
        <div class="h-full ${statusColor} transition-all duration-300 ease-out"
             style="width: ${state.progress || 0}%"></div>
      </div>

      <div class="flex items-center justify-between text-xs text-white/50">
        <span>${state.progress || 0}%</span>
        <span>${state.retryCount > 0 ? `Retry ${state.retryCount}/${state.options?.maxRetries || 2}` : ''}</span>
      </div>

      ${state.executionState === EXECUTION_STATES.GENERATING || state.executionState === EXECUTION_STATES.POLLING ? `
        <button id="cancelGenerationBtn" class="mt-4 w-full py-2 border border-red-500/30 hover:bg-red-500/10 text-red-300 rounded-lg text-sm font-medium transition">
          Cancel Generation
        </button>
      ` : ''}
    </div>
  `;

  const cancelBtn = container.querySelector('#cancelGenerationBtn');
  cancelBtn?.addEventListener('click', () => {
    state.onCancel?.();
  });

  return container;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class WizardStateManager {
  constructor(storageKey = 'wizard_state') {
    this.storageKey = storageKey;
    this.state = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.getDefaultState();
    } catch {
      return this.getDefaultState();
    }
  }

  getDefaultState() {
    return {
      currentStep: 0,
      mode: 'quick',
      inputs: {},
      scenes: [],
      lastTemplateId: null,
      lastUpdated: null
    };
  }

  save() {
    try {
      this.state.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch { /* ignore */ }
  }

  setCurrentStep(step) {
    this.state.currentStep = step;
    this.save();
  }

  setMode(mode) {
    this.state.mode = mode;
    this.save();
  }

  setInput(key, value) {
    this.state.inputs[key] = value;
    this.save();
  }

  setLastTemplateId(id) {
    this.state.lastTemplateId = id;
    this.save();
  }

  getInput(key) {
    return this.state.inputs[key];
  }

  clearInputs() {
    this.state.inputs = {};
    this.save();
  }

  reset() {
    this.state = this.getDefaultState();
    this.save();
  }
}
