import { aiService } from '../services/aiService.js';

export class AiMuAPI {
  static async generateVideo(prompt, model = 'wan2.1-text-to-video', options = {}) {
    return aiService.generateVideo({ prompt, model }, options);
  }

  static async generateImage(prompt, model = 'flux-dev', options = {}) {
    return aiService.generateImage({ prompt, model }, options);
  }

  static async applySAM3Segmentation(imageData, prompts) {
    // TODO: Implement SAM3 segmentation with video frame extraction
    throw new Error('SAM3 segmentation not yet implemented - requires video frame extraction first');
  }

  static async generateMusic(context, options = {}) {
    return aiService.generateVideo({ ...context, ...options }, { type: 'music' });
  }

  // WAN AI Effects implementation
  static async applyWanAIEffect(videoUrl, effectType, options = {}) {
    return aiService.applyWanAIEffect(videoUrl, effectType, options);
  }

  // Batch processing
  static async batchProcess(requests, options = {}) {
    return aiService.batchProcess(requests, options);
  }

  // Service health and monitoring
  static getHealthStatus() {
    return aiService.getHealthStatus();
  }

  static getMonitoringStats() {
    return aiService.monitoring.getStats();
  }

  // Event handling for real-time updates
  static on(event, callback) {
    aiService.on(event, callback);
  }

  static off(event, callback) {
    aiService.off(event, callback);
  }
}