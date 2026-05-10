/**
 * Director Backend Service
 * Connects Director frontend to Python backend API
 * Uses axios for HTTP requests with error handling and retry logic
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { io, Socket } from 'socket.io-client';

export interface BackendConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
}

export interface AgentRequest {
  agent: string;
  params: Record<string, any>;
  llmProvider?: 'anthropic' | 'openai' | 'google';
  llmModel?: string;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  jobId?: string;
}

export class DirectorBackendService {
  private api: AxiosInstance;
  private socket: Socket | null = null;
  private retries: number;
  private baseURL: string;

  constructor(config: BackendConfig) {
    this.baseURL = config.baseURL || import.meta.env.VITE_APP_BACKEND_URL || 'http://127.0.0.1:8000';
    this.retries = config.retries || 3;

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: any) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          // Could implement token refresh here
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize Socket.IO connection for real-time updates
   */
  connectSocket(): Socket {
    if (this.socket) return this.socket;

    this.socket = io(this.baseURL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[DirectorBackend] Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('[DirectorBackend] Socket disconnected');
    });

    this.socket.on('generation_progress', (data: any) => {
      console.log('[DirectorBackend] Progress:', data.progress);
    });

    this.socket.on('generation_complete', (data: any) => {
      console.log('[DirectorBackend] Complete:', data);
    });

    return this.socket;
  }

  /**
   * Execute an agent on the backend
   */
  async executeAgent(request: AgentRequest): Promise<AgentResponse> {
    try {
      const response: AxiosResponse = await this.api.post('/api/agent/execute', request);
      return {
        success: true,
        data: response.data,
        jobId: response.data.jobId,
      };
    } catch (error: any) {
      console.error('[DirectorBackend] Agent execution failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Agent execution failed',
      };
    }
  }

  /**
   * Video summarization using SummarizeVideo agent
   */
  async summarizeVideo(videoUrl: string, llmProvider?: string): Promise<AgentResponse> {
    return this.executeAgent({
      agent: 'SummarizeVideo',
      params: { video_url: videoUrl },
      llmProvider: (llmProvider as any) || 'anthropic',
    });
  }

  /**
   * Semantic search using Search agent
   */
  async searchContent(query: string, filters?: Record<string, any>): Promise<AgentResponse> {
    return this.executeAgent({
      agent: 'Search',
      params: { query, filters },
    });
  }

  /**
   * Video dubbing using Dubbing agent
   */
  async dubVideo(videoUrl: string, targetLanguage: string): Promise<AgentResponse> {
    return this.executeAgent({
      agent: 'Dubbing',
      params: { video_url: videoUrl, target_language: targetLanguage },
    });
  }

  /**
   * Create highlight reel using HighlightReel agent
   */
  async createHighlightReel(videoUrls: string[], options?: Record<string, any>): Promise<AgentResponse> {
    return this.executeAgent({
      agent: 'HighlightReel',
      params: { video_urls: videoUrls, ...options },
    });
  }

  /**
   * Check backend health
   */
  async checkHealth(): Promise<{ healthy: boolean; details?: any }> {
    try {
      const response = await this.api.get('/health');
      return { healthy: true, details: response.data };
    } catch (error: any) {
      return { healthy: false, details: error.message };
    }
  }

  /**
   * Get list of available agents
   */
  async getAgents(): Promise<AgentResponse> {
    return this.executeAgent({
      agent: 'ListAgents',
      params: {},
    });
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export singleton instance
const backendURL = import.meta.env.VITE_APP_BACKEND_URL || 'http://127.0.0.1:8000';
export const directorBackendService = new DirectorBackendService({ baseURL: backendURL });
export default directorBackendService;