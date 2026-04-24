/**
 * Timeline Agent Hooks
 * Connects ViMax agents to timeline editor events and state
 */

import { agentOrchestrator } from './agents/index.js';
import { multiTakeSystem } from './clipVersioning.js';

export class TimelineAgentHooks {
  constructor(timelineState) {
    this.timelineState = timelineState;
    this.listeners = new Map();
    this.agentSubscriptions = [];
  }

  initialize() {
    this.setupTimelineEventListeners();
    this.setupAgentResultHandlers();
    this.setupAgentTriggerConditions();
  }

  setupTimelineEventListeners() {
    this.onTimelineEvent('clipSelected', (clip) => {
      this.onClipSelected(clip);
    });

    this.onTimelineEvent('gapCreated', (gapData) => {
      this.onGapCreated(gapData);
    });

    this.onTimelineEvent('clipGenerated', (generationResult) => {
      this.onClipGenerated(generationResult);
    });

    this.onTimelineEvent('timelineLoaded', () => {
      this.onTimelineLoaded();
    });
  }

  setupAgentResultHandlers() {
    const directorAgent = agentOrchestrator.get('Director');
    if (directorAgent) {
      directorAgent.on('completed', (data) => {
        this.handleDirectorResult(data.result);
      });
    }

    const characterAgent = agentOrchestrator.get('CharacterExtractor');
    if (characterAgent) {
      characterAgent.on('completed', (data) => {
        this.handleCharacterResult(data.result);
      });
    }

    const screenwriterAgent = agentOrchestrator.get('Screenwriter');
    if (screenwriterAgent) {
      screenwriterAgent.on('completed', (data) => {
        this.handleScreenwriterResult(data.result);
      });
    }
  }

  setupAgentTriggerConditions() {
    this.autoTriggerThreshold = {
      minGapDuration: 3,
      minClipCountForAnalysis: 5,
      characterConsistencyThreshold: 0.7
    };
  }

  onTimelineEvent(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emitTimelineEvent(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  async onClipSelected(clip) {
    multiTakeSystem.enableVersioning(clip.id);
    
    const characterAgent = agentOrchestrator.get('CharacterExtractor');
    if (characterAgent && clip.metadata?.characters?.length > 0) {
      await characterAgent.execute({
        timelineState: this.timelineState,
        selectedClips: [clip]
      });
    }
  }

  async onGapCreated(gapData) {
    if (gapData.duration >= this.autoTriggerThreshold.minGapDuration) {
      this.emitTimelineEvent('agentSuggestion', {
        type: 'gap_fill',
        agent: 'Director',
        data: gapData,
        confidence: Math.min(gapData.duration / 10, 0.95)
      });

      if (gapData.duration > 5) {
        this.emitTimelineEvent('agentSuggestion', {
          type: 'auto_fill_preview',
          agent: 'Director',
          data: gapData,
          confidence: 0.85
        });
      }
    }
  }

  onClipGenerated(generationResult) {
    if (generationResult.mode === 'retake' && generationResult.clipId) {
      const takeData = {
        generatedBy: 'agent',
        agentUsed: 'generationService',
        prompt: generationResult.prompt,
        model: generationResult.model,
        quality: 0.8,
        duration: generationResult.duration,
        generationId: generationResult.generationId
      };

      multiTakeSystem.addTake(generationResult.clipId, takeData);
    }
  }

  async onTimelineLoaded() {
    const clipCount = this.getTotalClipCount();
    
    if (clipCount >= this.autoTriggerThreshold.minClipCountForAnalysis) {
      this.emitTimelineEvent('agentSuggestion', {
        type: 'initial_analysis',
        agent: 'Director',
        data: { clipCount },
        confidence: 0.7
      });
    }
  }

  handleDirectorResult(result) {
    if (result.gapAnalysis?.gaps?.length > 0) {
      result.gapAnalysis.gaps.forEach(gap => {
        this.emitTimelineEvent('agentSuggestion', {
          type: 'gap_fill',
          agent: 'Director',
          data: gap,
          confidence: gap.severity === 'critical' ? 0.95 : 0.8
        });
      });
    }

    if (result.suggestions) {
      result.suggestions.forEach(suggestion => {
        this.emitTimelineEvent('agentSuggestion', {
          type: suggestion.type,
          agent: 'Director',
          data: suggestion,
          confidence: suggestion.priority === 'high' ? 0.9 : 0.7
        });
      });
    }

    this.emitTimelineEvent('directorAnalysisComplete', result);
  }

  handleCharacterResult(result) {
    if (result.consistencyReport?.issues?.length > 0) {
      result.consistencyReport.issues.forEach(issue => {
        this.emitTimelineEvent('agentSuggestion', {
          type: 'character_consistency',
          agent: 'CharacterExtractor',
          data: issue,
          confidence: 0.85
        });
      });
    }

    this.emitTimelineEvent('characterAnalysisComplete', result);
  }

  handleScreenwriterResult(result) {
    this.emitTimelineEvent('scriptSuggestion', result);
  }

  getTotalClipCount() {
    if (!this.timelineState?.tracks) return 0;
    return this.timelineState.tracks.reduce((sum, track) => 
      sum + (track.clips?.length || 0), 0);
  }

  async runTimelineAnalysis(options = {}) {
    const directorAgent = agentOrchestrator.get('Director');
    if (!directorAgent) return null;

    return await directorAgent.execute({
      timelineState: this.timelineState,
      options: {
        includeNarrativeSuggestions: true,
        ...options
      }
    });
  }

  async runCharacterTracking() {
    const characterAgent = agentOrchestrator.get('CharacterExtractor');
    if (!characterAgent) return null;

    return await characterAgent.execute({
      timelineState: this.timelineState
    });
  }

  destroy() {
    this.listeners.clear();
    this.agentSubscriptions.forEach(unsub => unsub());
    this.agentSubscriptions = [];
  }
}

export function createTimelineAgentHooks(timelineState) {
  const hooks = new TimelineAgentHooks(timelineState);
  hooks.initialize();
  return hooks;
}