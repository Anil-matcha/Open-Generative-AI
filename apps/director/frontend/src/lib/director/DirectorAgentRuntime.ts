/**
 * Director Agent Runtime
 * Orchestration layer for Director agents
 * Manages state, callbacks, and coordinates between frontend and backend
 */

import directorBackendService, { DirectorBackendService as BackendServiceClass } from './DirectorBackendService.js';
import { LLMKeyManager } from './LLMKeyManager.js';

export interface RuntimeConfig {
  backendURL?: string;
  onAgentStart?: (agent: string, params: any) => void;
  onAgentProgress?: (progress: number, message: string) => void;
  onAgentComplete?: (result: any) => void;
  onAgentError?: (error: string) => void;
  onStateChange?: (state: RuntimeState) => void;
}

export interface RuntimeState {
  isProcessing: boolean;
  currentAgent: string | null;
  progress: number;
  lastResult: any;
  error: string | null;
  history: Array<{
    agent: string;
    params: any;
    result: any;
    timestamp: number;
  }>;
}

export class DirectorAgentRuntime {
  private backend: BackendServiceClass;
  private llmManager: LLMKeyManager;
  private state: RuntimeState;
  private callbacks: {
    onAgentStart?: (agent: string, params: any) => void;
    onAgentProgress?: (progress: number, message: string) => void;
    onAgentComplete?: (result: any) => void;
    onAgentError?: (error: string) => void;
    onStateChange?: (state: RuntimeState) => void;
  };

  constructor(config: RuntimeConfig = {}) {
    this.backend = new BackendServiceClass({ baseURL: config.backendURL });
    this.llmManager = new LLMKeyManager();
    
    this.state = {
      isProcessing: false,
      currentAgent: null,
      progress: 0,
      lastResult: null,
      error: null,
      history: [],
    };

    this.callbacks = {
      onAgentStart: config.onAgentStart,
      onAgentProgress: config.onAgentProgress,
      onAgentComplete: config.onAgentComplete,
      onAgentError: config.onAgentError,
      onStateChange: config.onStateChange,
    };

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    const socket = this.backend.connectSocket();
    
    socket.on('agent_start', (data: any) => {
      this.updateState({ 
        isProcessing: true, 
        currentAgent: data.agent,
        progress: 0,
        error: null 
      });
      this.callbacks.onAgentStart?.(data.agent, data.params);
    });

    socket.on('agent_progress', (data: any) => {
      this.updateState({ progress: data.progress });
      this.callbacks.onAgentProgress?.(data.progress, data.message);
    });

    socket.on('agent_complete', (data: any) => {
      this.updateState({ 
        isProcessing: false, 
        currentAgent: null,
        progress: 100,
        lastResult: data.result 
      });
      
      // Add to history
      this.state.history.push({
        agent: data.agent,
        params: data.params,
        result: data.result,
        timestamp: Date.now(),
      });

      this.callbacks.onAgentComplete?.(data.result);
    });

    socket.on('agent_error', (data: any) => {
      const errorMsg = data.error || 'Agent execution failed';
      this.updateState({ 
        isProcessing: false, 
        currentAgent: null,
        error: errorMsg 
      });
      this.callbacks.onAgentError?.(errorMsg);
    });
  }

  private updateState(updates: Partial<RuntimeState>): void {
    Object.assign(this.state, updates);
    this.callbacks.onStateChange?.(this.state);
  }

  /**
   * Execute SummarizeVideo agent
   */
  async summarizeVideo(videoUrl: string, llmProvider?: string): Promise<any> {
    const apiKey = this.llmManager.getApiKey(llmProvider || 'anthropic');
    
    return this.backend.executeAgent({
      agent: 'SummarizeVideo',
      params: { video_url: videoUrl },
      llmProvider: (llmProvider || 'anthropic') as any,
      llmModel: this.llmManager.getModel(llmProvider || 'anthropic'),
    });
  }

  /**
   * Execute Search agent
   */
  async searchContent(query: string, filters?: Record<string, any>): Promise<any> {
    return this.backend.executeAgent({
      agent: 'Search',
      params: { query, filters },
    });
  }

  /**
   * Execute Dubbing agent
   */
  async dubVideo(videoUrl: string, targetLanguage: string, llmProvider?: string): Promise<any> {
    return this.backend.executeAgent({
      agent: 'Dubbing',
      params: { video_url: videoUrl, target_language: targetLanguage },
      llmProvider: (llmProvider || 'anthropic') as any,
    });
  }

  /**
   * Execute HighlightReel agent
   */
  async createHighlightReel(videoUrls: string[], options?: Record<string, any>): Promise<any> {
    return this.backend.executeAgent({
      agent: 'HighlightReel',
      params: { video_urls: videoUrls, ...options },
    });
  }

  /**
   * Execute custom agent
   */
  async executeAgent(agent: string, params: Record<string, any>, llmProvider?: string): Promise<any> {
    return this.backend.executeAgent({
      agent,
      params,
      llmProvider: (llmProvider || 'anthropic') as any,
    });
  }

  /**
   * Get current runtime state
   */
  getState(): RuntimeState {
    return { ...this.state };
  }

  /**
   * Get LLM key manager
   */
  getLLMManager(): LLMKeyManager {
    return this.llmManager;
  }

  /**
   * Get backend service
   */
  getBackendService(): BackendServiceClass {
    return this.backend;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.updateState({ history: [] });
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.backend.disconnect();
    this.updateState({
      isProcessing: false,
      currentAgent: null,
      progress: 0,
      lastResult: null,
      error: null,
    });
  }
}

// Export singleton
export const directorRuntime = new DirectorAgentRuntime();
export default directorRuntime;