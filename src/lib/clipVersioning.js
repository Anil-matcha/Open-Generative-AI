/**
 * Multi-Take Clip System
 * Enables storing and managing multiple takes per timeline clip
 * Integrated with ViMax agent services for intelligent take generation
 */

import { agentOrchestrator } from './agents/index.js';
import { generationService } from './editor/generationService.js';

export class MultiTakeClipSystem {
  constructor() {
    this.versionStorage = new Map();
    this.activeVersioning = new Map();
    this.listeners = [];
  }

  on(event, callback) {
    this.listeners.push({ event, callback });
    return () => {
      this.listeners = this.listeners.filter(l => l.event !== event || l.callback !== callback);
    };
  }

  emit(event, data) {
    this.listeners.filter(l => l.event === event).forEach(l => l.callback(data));
  }

  enableVersioning(clipId) {
    if (!this.versionStorage.has(clipId)) {
      this.versionStorage.set(clipId, {
        takes: [],
        currentTakeIndex: 0,
        metadata: {}
      });
      this.activeVersioning.set(clipId, true);
      this.emit('versioningEnabled', { clipId });
    }
  }

  disableVersioning(clipId) {
    this.activeVersioning.delete(clipId);
    this.emit('versioningDisabled', { clipId });
  }

  isVersioningEnabled(clipId) {
    return this.activeVersioning.get(clipId) || false;
  }

  addTake(clipId, takeData) {
    if (!this.versionStorage.has(clipId)) {
      this.enableVersioning(clipId);
    }

    const storage = this.versionStorage.get(clipId);
    const take = {
      id: `take_${Date.now()}_${storage.takes.length}`,
      timestamp: Date.now(),
      data: takeData,
      metadata: {
        generatedBy: takeData.generatedBy || 'manual',
        agentUsed: takeData.agentUsed || null,
        prompt: takeData.prompt || null,
        model: takeData.model || null,
        quality: takeData.quality || 0,
        duration: takeData.duration || 0
      }
    };

    storage.takes.push(take);
    this.emit('takeAdded', { clipId, take });

    return take;
  }

  getTakes(clipId) {
    return this.versionStorage.get(clipId)?.takes || [];
  }

  getCurrentTake(clipId) {
    const storage = this.versionStorage.get(clipId);
    if (!storage || storage.takes.length === 0) return null;
    return storage.takes[storage.currentTakeIndex];
  }

  switchTake(clipId, takeIndex) {
    const storage = this.versionStorage.get(clipId);
    if (!storage || takeIndex >= storage.takes.length) return false;

    storage.currentTakeIndex = takeIndex;
    const take = storage.takes[takeIndex];
    this.emit('takeSwitched', { clipId, take, index: takeIndex });

    return true;
  }

  switchToTakeById(clipId, takeId) {
    const storage = this.versionStorage.get(clipId);
    if (!storage) return false;

    const index = storage.takes.findIndex(t => t.id === takeId);
    if (index === -1) return false;

    return this.switchTake(clipId, index);
  }

  deleteTake(clipId, takeIndex) {
    const storage = this.versionStorage.get(clipId);
    if (!storage || takeIndex >= storage.takes.length) return false;

    const deletedTake = storage.takes.splice(takeIndex, 1)[0];

    if (storage.currentTakeIndex >= storage.takes.length) {
      storage.currentTakeIndex = Math.max(0, storage.takes.length - 1);
    }

    this.emit('takeDeleted', { clipId, deletedTake, remainingTakes: storage.takes.length });

    return true;
  }

  async generateTakesWithAgents(clipId, options = {}) {
    const { count = 3, agentType = 'Screenwriter', mode = 'scene' } = options;

    this.enableVersioning(clipId);

    const agent = agentOrchestrator.get(agentType);
    if (!agent) {
      throw new Error(`Agent not found: ${agentType}`);
    }

    const generatedTakes = [];

    for (let i = 0; i < count; i++) {
      this.emit('takeGenerationProgress', { clipId, current: i + 1, total: count });

      const context = {
        clipId,
        takeNumber: i + 1,
        mode,
        timelineState: options.timelineState
      };

      await agent.execute(context);

      if (agent.error) {
        console.error(`Take generation failed for ${agentType}:`, agent.error);
        continue;
      }

      const agentPrompt = agent.result?.prompt || this.buildPromptFromAgentResult(agent.result, context);
      const generationResult = await this.generateVideoTake(agentPrompt, options);

      const takeData = {
        generatedBy: 'agent',
        agentUsed: agentType,
        prompt: agentPrompt,
        model: options.model || 'ltx-2-fast',
        quality: 0.8,
        duration: generationResult.duration || options.duration || 5,
        videoUrl: generationResult.videoUrl,
        generationId: generationResult.generationId,
        agentResult: agent.result,
        generationContext: context
      };

      const take = this.addTake(clipId, takeData);
      generatedTakes.push(take);
    }

    this.emit('takeGenerationComplete', { clipId, takes: generatedTakes });

    return generatedTakes;
  }

  buildPromptFromAgentResult(result, context) {
    if (result?.prompt) return result.prompt;
    if (result?.formatted) return result.formatted;
    if (result?.keyElements) {
      return result.keyElements.map(e => `${e.type}: ${e.items.join(', ')}`).join('\n');
    }
    return `Generate a video take ${context.takeNumber} for timeline clip`;
  }

  async generateVideoTake(prompt, options = {}) {
    const model = options.model || 'ltx-2-fast';
    const duration = options.duration || 6;
    const aspectRatio = options.aspectRatio || '16:9';

    try {
      const request = {
        mode: 'text-to-video',
        prompt: prompt,
        model: model,
        duration: duration,
        aspectRatio: aspectRatio
      };

      const result = await generationService.submit(request, 'muapi');

      return {
        generationId: result.generationId,
        videoUrl: result.previewUrl,
        status: result.status,
        duration: duration
      };
    } catch (error) {
      console.error('Video generation failed:', error);
      return {
        generationId: null,
        videoUrl: null,
        status: 'failed',
        error: error.message,
        duration: duration
      };
    }
  }

  async generateImageToVideoTake(imageUrl, prompt, options = {}) {
    const model = options.model || 'ltx-2-fast';
    const duration = options.duration || 6;
    const aspectRatio = options.aspectRatio || '16:9';

    try {
      const request = {
        mode: 'image-to-video',
        prompt: prompt,
        model: model,
        duration: duration,
        aspectRatio: aspectRatio,
        references: [imageUrl]
      };

      const result = await generationService.submit(request, 'muapi');

      return {
        generationId: result.generationId,
        videoUrl: result.previewUrl,
        status: result.status,
        duration: duration
      };
    } catch (error) {
      console.error('Image-to-video generation failed:', error);
      return {
        generationId: null,
        videoUrl: null,
        status: 'failed',
        error: error.message,
        duration: duration
      };
    }
  }

  compareTakes(clipId) {
    const takes = this.getTakes(clipId);
    if (takes.length < 2) return null;

    return {
      clipId,
      takeCount: takes.length,
      comparison: takes.map((take, index) => ({
        index,
        id: take.id,
        timestamp: take.timestamp,
        quality: take.metadata.quality,
        generatedBy: take.metadata.generatedBy,
        agent: take.metadata.agentUsed,
        prompt: take.metadata.prompt
      })),
      recommendations: this.getTakeRecommendations(clipId)
    };
  }

  getTakeRecommendations(clipId) {
    const takes = this.getTakes(clipId);
    if (takes.length === 0) return [];

    const recommendations = [];

    const qualityScores = takes.map(t => t.metadata.quality);
    const maxQuality = Math.max(...qualityScores);
    const bestIndex = qualityScores.indexOf(maxQuality);

    if (bestIndex !== takes.findIndex(t => t === this.getCurrentTake(clipId))) {
      recommendations.push({
        type: 'best_quality',
        message: `Take ${bestIndex + 1} has highest quality (${Math.round(maxQuality * 100)}%)`,
        action: 'switch_to_best'
      });
    }

    const agentGenerated = takes.filter(t => t.metadata.generatedBy === 'agent');
    if (agentGenerated.length > 1) {
      const latestAgentTake = agentGenerated[agentGenerated.length - 1];
      const latestIndex = takes.indexOf(latestAgentTake);
      recommendations.push({
        type: 'latest_agent',
        message: `Most recent agent generation: Take ${latestIndex + 1}`,
        action: 'view_latest'
      });
    }

    return recommendations;
  }

  exportVersionHistory(clipId) {
    const storage = this.versionStorage.get(clipId);
    if (!storage) return null;

    return {
      clipId,
      exportedAt: Date.now(),
      currentTakeIndex: storage.currentTakeIndex,
      takeCount: storage.takes.length,
      takes: storage.takes.map(t => ({
        id: t.id,
        timestamp: t.timestamp,
        metadata: t.metadata
      }))
    };
  }

  importVersionHistory(importData) {
    const { clipId, takes, currentTakeIndex = 0 } = importData;

    this.versionStorage.set(clipId, {
      takes: takes.map(t => ({
        ...t,
        id: t.id || `imported_${Date.now()}_${Math.random()}`
      })),
      currentTakeIndex,
      metadata: { importedAt: Date.now(), source: 'external' }
    });

    this.activeVersioning.set(clipId, true);
    this.emit('versionHistoryImported', { clipId, takeCount: takes.length });

    return true;
  }

  clearTakes(clipId) {
    if (this.versionStorage.has(clipId)) {
      this.versionStorage.get(clipId).takes = [];
      this.versionStorage.get(clipId).currentTakeIndex = 0;
      this.emit('takesCleared', { clipId });
    }
  }

  getVersioningStats() {
    const stats = {
      totalClipsVersioned: this.versionStorage.size,
      totalTakes: 0,
      clipsWithMultipleTakes: 0,
      agentGeneratedTakes: 0
    };

    this.versionStorage.forEach(storage => {
      stats.totalTakes += storage.takes.length;
      if (storage.takes.length > 1) {
        stats.clipsWithMultipleTakes++;
      }
      storage.takes.forEach(take => {
        if (take.metadata.generatedBy === 'agent') {
          stats.agentGeneratedTakes++;
        }
      });
    });

    return stats;
  }
}

export const multiTakeSystem = new MultiTakeClipSystem();