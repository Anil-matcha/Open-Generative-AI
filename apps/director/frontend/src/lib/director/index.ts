/**
 * Director App Connector Library
 * Exports all connector classes for use in Director frontend
 */

export { DirectorBackendService, type BackendConfig, type AgentRequest, type AgentResponse } from './DirectorBackendService.js';
export { DirectorAgentRuntime, type RuntimeConfig, type RuntimeState } from './DirectorAgentRuntime.js';
export { LLMKeyManager, type LLMKeys, type ProviderConfig } from './LLMKeyManager.js';

// Singleton instances
export { directorBackendService as defaultBackendService } from './DirectorBackendService.js';
export { directorRuntime as defaultRuntime } from './DirectorAgentRuntime.js';
export { llmKeyManager as defaultKeyManager } from './LLMKeyManager.js';

// Convenience: pre-configured runtime using environment variables
import { DirectorAgentRuntime } from './DirectorAgentRuntime.js';
import { directorRuntime } from './DirectorAgentRuntime.js';

export function createDirectorRuntime(config?: {
  backendURL?: string;
  onAgentStart?: (agent: string, params: any) => void;
  onAgentProgress?: (progress: number, message: string) => void;
  onAgentComplete?: (result: any) => void;
  onAgentError?: (error: string) => void;
  onStateChange?: (state: any) => void;
}) {
  return new DirectorAgentRuntime({
    backendURL: config?.backendURL || import.meta.env.VITE_APP_BACKEND_URL,
    onAgentStart: config?.onAgentStart,
    onAgentProgress: config?.onAgentProgress,
    onAgentComplete: config?.onAgentComplete,
    onAgentError: config?.onAgentError,
    onStateChange: config?.onStateChange,
  });
}

// Default export: pre-configured runtime
export default directorRuntime;