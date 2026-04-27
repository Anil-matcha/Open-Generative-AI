/**
 * AI Service Integration Utilities
 * Helper functions to integrate AI service optimizations into existing systems
 */

import { generationService } from '../editor/generationService.js';
import { directorAgent, screenwriterAgent } from '../agents/index.js';
import { aiService } from './aiService.js';

/**
 * AIIntegration singleton class
 */
class AIIntegration {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return this;

    try {
      // Initialize AI service
      await aiService.initialize();

      // Enable optimizations in generation service
      await generationService.enableAIOptimizations();

      // Enable optimizations in AI agents
      await directorAgent.enableAIOptimizations();
      await screenwriterAgent.enableAIOptimizations();

      console.log('[AI Integration] AI optimizations successfully enabled');
      this.initialized = true;
      return this;
    } catch (error) {
      console.error('[AI Integration] Failed to initialize AI optimizations:', error);
      throw error;
    }
  }

  async getOptimizationStatus() {
    return {
      aiService: aiService.getHealthStatus(),
      generationService: generationService.getAIOptimizationStatus(),
      agents: {
        director: {
          enabled: directorAgent.aiOptimizationsEnabled
        },
        screenwriter: {
          enabled: screenwriterAgent.aiOptimizationsEnabled
        }
      }
    };
  }

  disableOptimizations() {
    console.log('[AI Integration] Disabling AI optimizations...');
    // Services automatically fall back to direct processing
  }

  configure(config) {
    aiService.configure(config);
    generationService.configureAIOptimizations(config);
    console.log('[AI Integration] AI optimizations reconfigured');
  }
}

// Create singleton instance
const globalKey = "__openhiggsfield_aiIntegration";
const aiIntegration = window[globalKey] || new AIIntegration();
window[globalKey] = aiIntegration;

/**
 * Initialize AI service optimizations across all services
 */
export async function initializeAIOptimizations(options = {}) {
  console.log('[AI Integration] Initializing AI service optimizations...');

  try {
    await aiIntegration.initialize();

    // Configure if options provided
    if (options.config) {
      aiIntegration.configure(options.config);
    }

    // Set up monitoring hooks
    setupMonitoringHooks();

    const status = await aiIntegration.getOptimizationStatus();

    return {
      success: true,
      services: ['generationService', 'directorAgent', 'screenwriterAgent'],
      aiService: status.aiService
    };

  } catch (error) {
    console.error('[AI Integration] Failed to initialize AI optimizations:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Setup monitoring hooks for AI service events
 */
function setupMonitoringHooks() {
  // Cache hit monitoring
  aiService.on('onCacheHit', (data) => {
    console.log(`[AI Monitor] Cache hit for ${data.type}: ${data.params?.prompt?.substring(0, 50)}...`);
  });

  // Rate limiting events
  aiService.on('onRateLimit', (data) => {
    console.warn(`[AI Monitor] Rate limit exceeded for ${data.type}, queued for retry`);
  });

  // Batch completion
  aiService.on('onBatchComplete', (data) => {
    console.log(`[AI Monitor] Batch completed: ${data.processedCount} requests in ${data.duration}ms`);
  });

  // Error monitoring
  aiService.on('onError', (data) => {
    console.error(`[AI Monitor] Service error: ${data.error} for ${data.type}`);
  });
}

/**
 * Get comprehensive AI optimization status
 */
export function getAIOptimizationStatus() {
  return aiIntegration.getOptimizationStatus();
}

/**
 * Disable AI optimizations (fallback to direct processing)
 */
export function disableAIOptimizations() {
  aiIntegration.disableOptimizations();
}

/**
 * Configure AI optimizations dynamically
 */
export function configureAIOptimizations(config) {
  aiIntegration.configure(config);
}

/**
 * Generate AI optimization report
 */
export async function generateOptimizationReport() {
  const status = await getAIOptimizationStatus();

  return {
    timestamp: new Date().toISOString(),
    overallHealth: status.aiService.healthy ? 'healthy' : 'degraded',
    services: {
      aiService: status.aiService,
      generationService: status.generationService,
      agents: status.agents
    },
    recommendations: generateRecommendations(status)
  };
}

/**
 * Generate optimization recommendations based on current status
 */
function generateRecommendations(status) {
  const recommendations = [];

  if (!status.aiService.healthy) {
    recommendations.push('AI service is degraded - check error rates and service availability');
  }

  if (!status.generationService.enabled) {
    recommendations.push('Enable AI optimizations in generation service for better performance');
  }

  const enabledAgents = Object.values(status.agents).filter(a => a.enabled).length;
  if (enabledAgents < 2) {
    recommendations.push('Enable AI optimizations in AI agents for improved analysis performance');
  }

  if (recommendations.length === 0) {
    recommendations.push('All AI optimizations are properly configured and healthy');
  }

  return recommendations;
}

// Export singleton instance
export { aiIntegration };
export default aiIntegration;
