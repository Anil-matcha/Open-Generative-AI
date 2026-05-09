/**
 * LLM API Key Management
 * Handles API keys for Anthropic, OpenAI, and Google AI providers
 */

export const LLM_PROVIDERS = {
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai',
  GOOGLE: 'google'
};

export const PROVIDER_NAMES = {
  [LLM_PROVIDERS.ANTHROPIC]: 'Anthropic Claude',
  [LLM_PROVIDERS.OPENAI]: 'OpenAI GPT',
  [LLM_PROVIDERS.GOOGLE]: 'Google Gemini'
};

export const PROVIDER_MODELS = {
  [LLM_PROVIDERS.ANTHROPIC]: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-opus-latest', name: 'Claude 3 Opus' }
  ],
  [LLM_PROVIDERS.OPENAI]: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
  ],
  [LLM_PROVIDERS.GOOGLE]: [
    { id: 'gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
  ]
};

export const STORAGE_KEYS = {
  [LLM_PROVIDERS.ANTHROPIC]: 'llm_anthropic_key',
  [LLM_PROVIDERS.OPENAI]: 'llm_openai_key',
  [LLM_PROVIDERS.GOOGLE]: 'llm_google_key'
};

export class LLMKeyManager {
  constructor() {
    this.activeProvider = LLM_PROVIDERS.ANTHROPIC;
    this.keys = this._loadKeys();
    this.modelPreferences = this._loadModelPreferences();
  }

  _loadKeys() {
    const keys = {};
    Object.values(LLM_PROVIDERS).forEach(provider => {
      const stored = localStorage.getItem(STORAGE_KEYS[provider]);
      if (stored) {
        try {
          keys[provider] = JSON.parse(stored);
        } catch {
          keys[provider] = { key: stored };
        }
      }
    });
    return keys;
  }

  _loadModelPreferences() {
    const stored = localStorage.getItem('llm_model_preferences');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  }

  _saveKey(provider, data) {
    localStorage.setItem(STORAGE_KEYS[provider], JSON.stringify(data));
  }

  setApiKey(provider, apiKey) {
    this.keys[provider] = {
      key: apiKey,
      updatedAt: new Date().toISOString()
    };
    this._saveKey(provider, this.keys[provider]);
  }

  getApiKey(provider) {
    return this.keys[provider]?.key || null;
  }

  hasApiKey(provider) {
    return !!this.keys[provider]?.key;
  }

  getActiveProvider() {
    return this.activeProvider;
  }

  setActiveProvider(provider) {
    if (Object.values(LLM_PROVIDERS).includes(provider)) {
      this.activeProvider = provider;
      localStorage.setItem('llm_active_provider', provider);
    }
  }

  isProviderConfigured(provider) {
    return this.hasApiKey(provider);
  }

  getAvailableProviders() {
    return Object.values(LLM_PROVIDERS).filter(p => this.hasApiKey(p));
  }

  getModelForProvider(provider) {
    return this.modelPreferences[provider] || PROVIDER_MODELS[provider]?.[0]?.id || null;
  }

  setPreferredModel(provider, modelId) {
    this.modelPreferences[provider] = modelId;
    localStorage.setItem('llm_model_preferences', JSON.stringify(this.modelPreferences));
  }

  getProviderForModel(modelId) {
    for (const [provider, models] of Object.entries(PROVIDER_MODELS)) {
      if (models.some(m => m.id === modelId)) {
        return provider;
      }
    }
    return null;
  }

  removeApiKey(provider) {
    delete this.keys[provider];
    localStorage.removeItem(STORAGE_KEYS[provider]);
  }

  getKeyStatus() {
    return Object.values(LLM_PROVIDERS).map(provider => ({
      provider,
      name: PROVIDER_NAMES[provider],
      configured: this.hasApiKey(provider),
      active: this.activeProvider === provider,
      model: this.getModelForProvider(provider),
      lastUpdated: this.keys[provider]?.updatedAt || null
    }));
  }

  validateApiKey(provider, apiKey) {
    return new Promise((resolve) => {
      if (!apiKey || apiKey.length < 10) {
        resolve({ valid: false, error: 'API key appears too short' });
        return;
      }

      resolve({ valid: true });
    });
  }
}

let llmKeyManagerInstance = null;

export const getLLMKeyManager = () => {
  if (!llmKeyManagerInstance) {
    llmKeyManagerInstance = new LLMKeyManager();
  }
  return llmKeyManagerInstance;
};

export default LLMKeyManager;
