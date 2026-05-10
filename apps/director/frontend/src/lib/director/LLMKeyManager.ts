/**
 * LLM Key Manager
 * Manages API keys for Anthropic, OpenAI, and Google AI providers
 * Stored securely in localStorage with validation
 */

export interface LLMKeys {
  anthropic?: string;
  openai?: string;
  google?: string;
  fal?: string;
  replicate?: string;
  elevenlabs?: string;
}

export interface ProviderConfig {
  name: string;
  displayName: string;
  models: string[];
  keyPattern?: RegExp;
  keyPlaceholder?: string;
}

export class LLMKeyManager {
  private static STORAGE_KEY = 'director_llm_keys';
  private keys: LLMKeys = {};
  private static PROVIDERS: Record<string, ProviderConfig> = {
    anthropic: {
      name: 'anthropic',
      displayName: 'Anthropic (Claude)',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
      keyPattern: /^sk-ant-/,
      keyPlaceholder: 'sk-ant-...',
    },
    openai: {
      name: 'openai',
      displayName: 'OpenAI (GPT)',
      models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      keyPattern: /^sk-/,
      keyPlaceholder: 'sk-...',
    },
    google: {
      name: 'google',
      displayName: 'Google (Gemini)',
      models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
      keyPlaceholder: 'AIza...',
    },
    fal: {
      name: 'fal',
      displayName: 'FAL (Falcon)',
      models: ['falcon-7b', 'falcon-40b'],
      keyPlaceholder: 'fal-...',
    },
    replicate: {
      name: 'replicate',
      displayName: 'Replicate',
      models: ['replicate-model-1', 'replicate-model-2'],
      keyPlaceholder: 'r8_...',
    },
    elevenlabs: {
      name: 'elevenlabs',
      displayName: 'ElevenLabs (Voice)',
      models: ['eleven-multilingual-v2', 'eleven-turbo-v2'],
      keyPlaceholder: 'eleven-...',
    },
  };

  constructor() {
    this.loadKeys();
  }

  /**
   * Load keys from localStorage
   */
  private loadKeys(): void {
    try {
      const stored = localStorage.getItem(LLMKeyManager.STORAGE_KEY);
      if (stored) {
        this.keys = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[LLMKeyManager] Failed to load keys:', error);
      this.keys = {};
    }
  }

  /**
   * Save keys to localStorage
   */
  private saveKeys(): void {
    try {
      localStorage.setItem(LLMKeyManager.STORAGE_KEY, JSON.stringify(this.keys));
    } catch (error) {
      console.error('[LLMKeyManager] Failed to save keys:', error);
    }
  }

  /**
   * Set API key for a provider
   */
  setKey(provider: keyof LLMKeys, key: string): boolean {
    if (!this.validateKey(provider, key)) {
      console.warn(`[LLMKeyManager] Invalid key format for ${provider}`);
      return false;
    }

    this.keys[provider] = key;
    this.saveKeys();
    return true;
  }

  /**
   * Get API key for a provider
   */
  getKey(provider: keyof LLMKeys): string | undefined {
    return this.keys[provider];
  }

  /**
   * Validate API key format
   */
  validateKey(provider: keyof LLMKeys, key: string): boolean {
    const config = LLMKeyManager.PROVIDERS[provider];
    if (!config) return false;

    // Empty key is valid (means remove key)
    if (!key || key.trim() === '') return true;

    // Check pattern if defined
    if (config.keyPattern) {
      return config.keyPattern.test(key);
    }

    // Default: key should be at least 10 characters
    return key.length >= 10;
  }

  /**
   * Remove API key for a provider
   */
  removeKey(provider: keyof LLMKeys): void {
    delete this.keys[provider];
    this.saveKeys();
  }

  /**
   * Get all stored keys (masked for display)
   */
  getMaskedKeys(): Record<keyof LLMKeys, string> {
    const masked: Record<string, string> = {};

    for (const provider of Object.keys(this.keys) as Array<keyof LLMKeys>) {
      const key = this.keys[provider];
      if (key) {
        masked[provider] = key.substring(0, 6) + '...' + key.substring(key.length - 4);
      } else {
        masked[provider] = '';
      }
    }

    return masked as Record<keyof LLMKeys, string>;
  }

  /**
   * Check if a provider has a valid key
   */
  hasValidKey(provider: keyof LLMKeys): boolean {
    const key = this.keys[provider];
    return !!(key && this.validateKey(provider, key));
  }

  /**
   * Get all configured providers
   */
  static getProviders(): Record<string, ProviderConfig> {
    return LLMKeyManager.PROVIDERS;
  }

  /**
   * Get models for a provider
   */
  getModels(provider: keyof LLMKeys): string[] {
    const config = LLMKeyManager.PROVIDERS[provider];
    return config ? config.models : [];
  }

  /**
   * Get default model for a provider
   */
  getDefaultModel(provider: keyof LLMKeys): string | undefined {
    const models = this.getModels(provider);
    return models.length > 0 ? models[0] : undefined;
  }

  /**
   * Get preferred model for a provider (from localStorage or default)
   */
  getPreferredModel(provider: keyof LLMKeys): string | undefined {
    try {
      const stored = localStorage.getItem(`director_preferred_model_${provider}`);
      if (stored) return stored;
    } catch (error) {
      // Ignore
    }
    return this.getDefaultModel(provider);
  }

  /**
   * Set preferred model for a provider
   */
  setPreferredModel(provider: keyof LLMKeys, model: string): void {
    try {
      localStorage.setItem(`director_preferred_model_${provider}`, model);
    } catch (error) {
      console.error('[LLMKeyManager] Failed to save preferred model:', error);
    }
  }

  /**
   * Clear all keys
   */
  clearAll(): void {
    this.keys = {};
    this.saveKeys();

    // Clear preferred models
    for (const provider of Object.keys(LLMKeyManager.PROVIDERS)) {
      try {
        localStorage.removeItem(`director_preferred_model_${provider}`);
      } catch (error) {
        // Ignore
      }
    }
  }

  /**
   * Export keys (for backup)
   */
  exportKeys(): string {
    return JSON.stringify(this.keys, null, 2);
  }

  /**
   * Import keys (from backup)
   */
  importKeys(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      this.keys = { ...this.keys, ...imported };
      this.saveKeys();
      return true;
    } catch (error) {
      console.error('[LLMKeyManager] Failed to import keys:', error);
      return false;
    }
  }

  /**
   * Get status of all providers
   */
  getStatus(): Record<string, { configured: boolean; maskedKey: string }> {
    const status: Record<string, { configured: boolean; maskedKey: string }> = {};

    for (const provider of Object.keys(LLMKeyManager.PROVIDERS)) {
      const key = this.keys[provider as keyof LLMKeys];
      status[provider] = {
        configured: !!(key && this.validateKey(provider as keyof LLMKeys, key)),
        maskedKey: key ? key.substring(0, 6) + '...' : 'Not configured',
      };
    }

    return status;
  }
}

// Export singleton
export const llmKeyManager = new LLMKeyManager();
export default llmKeyManager;