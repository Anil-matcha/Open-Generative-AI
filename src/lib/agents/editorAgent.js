/**
 * Editor Agent
 * Analyzes timeline and provides intelligent assembly suggestions
 * Inspired by ViMax's intelligent video editing capabilities
 */

import { BaseAgent } from './baseAgent.js';

export class EditorAgent extends BaseAgent {
  constructor() {
    super('Editor', {
      description: 'Provides intelligent timeline assembly and optimization suggestions'
    });
    this.optimizationRules = {
      minClipDuration: 1.5,
      maxClipDuration: 30,
      optimalGap: 0.1,
      maxGapForCut: 0.5
    };
  }

  async execute(context) {
    const { timelineState, options = {} } = context;
    
    this.reset();
    this.setStatus('running', 0);

    try {
      this.setStatus('analyzing_timeline', 15);
      
      const timelineAnalysis = this.analyzeTimelineStructure(timelineState);
      
      this.setStatus('evaluating_flow', 35);
      
      const flowAnalysis = this.evaluateNarrativeFlow(timelineAnalysis);
      
      this.setStatus('identifying_issues', 50);
      
      const issues = this.identifyIssues(timelineAnalysis, flowAnalysis);
      
      this.setStatus('generating_optimizations', 70);
      
      const optimizations = this.generateOptimizations(issues, timelineAnalysis);
      
      this.setStatus('creating_final_recommendations', 85);
      
      const result = {
        timelineAnalysis,
        flowAnalysis,
        issues,
        optimizations,
        assemblySequence: this.createAssemblySequence(timelineAnalysis, optimizations),
        overallScore: this.calculateOverallScore(flowAnalysis, issues)
      };

      this.setResult(result);
      
    } catch (error) {
      this.setError(error.message);
    }
  }

  analyzeTimelineStructure(timelineState) {
    const tracks = timelineState?.tracks || [];
    
    const trackSummary = tracks.map(track => ({
      id: track.id,
      type: track.type,
      clipCount: track.clips?.length || 0,
      totalDuration: track.clips?.reduce((sum, c) => sum + (c.duration || 0), 0) || 0,
      clips: track.clips?.map(clip => ({
        id: clip.id,
        startTime: clip.startTime,
        endTime: clip.endTime || (clip.startTime + clip.duration),
        duration: clip.duration,
        type: clip.type
      })) || []
    }));

    const sortedTracks = [...trackSummary].sort((a, b) => a.startTime - b.startTime);
    const timelineStart = sortedTracks[0]?.startTime || 0;
    const timelineEnd = Math.max(...sortedTracks.map(t => 
      t.clips.reduce((max, c) => Math.max(max, c.endTime), timelineStart)
    ));

    return {
      trackCount: tracks.length,
      totalClips: trackSummary.reduce((sum, t) => sum + t.clipCount, 0),
      totalDuration: timelineEnd - timelineStart,
      tracks: trackSummary,
      timelineStart,
      timelineEnd,
      hasVideo: trackSummary.some(t => t.type === 'video'),
      hasAudio: trackSummary.some(t => t.type === 'audio'),
      hasCaptions: trackSummary.some(t => t.type === 'caption' || t.type === 'text')
    };
  }

  evaluateNarrativeFlow(timelineAnalysis) {
    const flowScore = this.calculateFlowScore(timelineAnalysis);
    const rhythmAnalysis = this.analyzeRhythm(timelineAnalysis);
    const transitionQuality = this.evaluateTransitions(timelineAnalysis);

    return {
      flowScore,
      rhythmAnalysis,
      transitionQuality,
      pacing: this.analyzePacing(timelineAnalysis),
      cohesion: this.evaluateCohesion(timelineAnalysis)
    };
  }

  calculateFlowScore(timelineAnalysis) {
    let score = 1.0;
    
    const timelineDuration = timelineAnalysis.totalDuration;
    const clipDensity = timelineAnalysis.totalClips / Math.max(timelineDuration, 1);
    
    if (clipDensity < 0.05) score -= 0.2;
    if (clipDensity > 0.5) score -= 0.15;
    
    let gapPenalty = 0;
    timelineAnalysis.tracks.forEach(track => {
      for (let i = 1; i < track.clips.length; i++) {
        const gap = track.clips[i].startTime - track.clips[i-1].endTime;
        if (gap > 2) gapPenalty += 0.05;
        if (gap > 5) gapPenalty += 0.1;
      }
    });
    
    score -= Math.min(gapPenalty, 0.4);
    
    return Math.max(score, 0);
  }

  analyzeRhythm(timelineAnalysis) {
    const durations = [];
    
    timelineAnalysis.tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (clip.duration) durations.push(clip.duration);
      });
    });
    
    if (durations.length === 0) return { pattern: 'none', consistency: 0 };
    
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
    
    let pattern = 'consistent';
    if (variance > avgDuration * 0.5) pattern = 'varied';
    if (variance > avgDuration) pattern = 'irregular';
    
    return {
      pattern,
      averageDuration: avgDuration,
      variance,
      clipDurations: durations
    };
  }

  evaluateTransitions(timelineAnalysis) {
    let totalTransitions = 0;
    let qualityTransitions = 0;
    let needsWork = 0;

    timelineAnalysis.tracks.forEach(track => {
      for (let i = 1; i < track.clips.length; i++) {
        totalTransitions++;
        const prevClip = track.clips[i - 1];
        const currClip = track.clips[i];
        
        const gap = currClip.startTime - prevClip.endTime;
        
        if (gap <= this.optimizationRules.maxGapForCut) {
          qualityTransitions++;
        } else if (gap > this.optimizationRules.maxGapForCut && gap <= 2) {
          needsWork++;
        } else {
          needsWork++;
        }
      }
    });

    return {
      total: totalTransitions,
      qualityCount: qualityTransitions,
      needsWorkCount: needsWork,
      qualityPercentage: totalTransitions > 0 ? (qualityTransitions / totalTransitions) * 100 : 100
    };
  }

  analyzePacing(timelineAnalysis) {
    const durations = [];
    timelineAnalysis.tracks.forEach(t => t.clips.forEach(c => {
      if (c.duration) durations.push(c.duration);
    }));

    if (durations.length < 2) return { rating: 'unknown', suggestion: 'Need more clips for analysis' };

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    let rating;
    if (avg < 3) rating = 'fast';
    else if (avg > 10) rating = 'slow';
    else rating = 'balanced';

    return {
      rating,
      averageClipDuration: avg,
      suggestion: rating === 'fast' ? 'Consider longer clips for better comprehension' :
                 rating === 'slow' ? 'Consider shorter clips for better engagement' :
                 'Pacing is well balanced'
    };
  }

  evaluateCohesion(timelineAnalysis) {
    const hasMixedMedia = timelineAnalysis.hasVideo && timelineAnalysis.hasAudio;
    const hasCaptions = timelineAnalysis.hasCaptions;
    const hasSyncIssues = this.detectSyncIssues(timelineAnalysis);

    return {
      hasMixedMedia,
      hasCaptions,
      syncIssues: hasSyncIssues,
      overall: hasSyncIssues ? 'needs_attention' : 'good'
    };
  }

  detectSyncIssues(timelineAnalysis) {
    const issues = [];
    const videoTrack = timelineAnalysis.tracks.find(t => t.type === 'video');
    const audioTrack = timelineAnalysis.tracks.find(t => t.type === 'audio');

    if (!videoTrack || !audioTrack) return issues;

    const videoClips = videoTrack.clips;
    const audioClips = audioTrack.clips;

    for (let i = 0; i < Math.min(videoClips.length, audioClips.length); i++) {
      const vStart = videoClips[i].startTime;
      const aStart = audioClips[i].startTime;
      
      if (Math.abs(vStart - aStart) > 0.5) {
        issues.push({
          clipIndex: i,
          videoStart: vStart,
          audioStart: aStart,
          offset: vStart - aStart
        });
      }
    }

    return issues;
  }

  identifyIssues(timelineAnalysis, flowAnalysis) {
    const issues = [];

    if (flowAnalysis.flowScore < 0.7) {
      issues.push({
        type: 'flow',
        severity: 'high',
        description: 'Timeline flow needs improvement',
        recommendation: 'Consider reordering clips for better narrative continuity'
      });
    }

    if (flowAnalysis.transitionQuality.needsWorkCount > 0) {
      issues.push({
        type: 'transitions',
        severity: 'medium',
        description: `${flowAnalysis.transitionQuality.needsWorkCount} transitions need optimization`,
        recommendation: 'Add transitions or adjust clip positions for smoother flow'
      });
    }

    timelineAnalysis.tracks.forEach((track, index) => {
      track.clips.forEach(clip => {
        if (clip.duration < this.optimizationRules.minClipDuration) {
          issues.push({
            type: 'clip_too_short',
            severity: 'medium',
            clipId: clip.id,
            trackId: track.id,
            description: `Clip ${clip.id} is shorter than recommended minimum`,
            recommendation: 'Extend or remove this clip'
          });
        }
      });
    });

    if (flowAnalysis.rhythmAnalysis.pattern === 'irregular') {
      issues.push({
        type: 'rhythm',
        severity: 'medium',
        description: 'Irregular clip duration pattern detected',
        recommendation: 'Consider standardizing clip lengths for better rhythm'
      });
    }

    const syncIssues = flowAnalysis.cohesion.syncIssues;
    if (syncIssues.length > 0) {
      issues.push({
        type: 'sync',
        severity: 'high',
        description: `${syncIssues.length} sync issues detected between video and audio`,
        recommendation: 'Adjust audio/video alignment for these clips'
      });
    }

    return issues;
  }

  generateOptimizations(issues, timelineAnalysis) {
    const optimizations = [];

    const gapIssues = issues.filter(i => i.type === 'transitions' || i.type === 'flow');
    if (gapIssues.length > 0) {
      optimizations.push({
        type: 'transition_optimization',
        priority: 'high',
        estimatedImpact: 'Improves narrative flow and viewer experience',
        actions: this.suggestTransitionOptimizations(timelineAnalysis)
      });
    }

    const shortClips = issues.filter(i => i.type === 'clip_too_short');
    if (shortClips.length > 0) {
      optimizations.push({
        type: 'clip_duration_fix',
        priority: 'medium',
        clips: shortClips.map(c => c.clipId),
        estimatedImpact: 'Better clip visibility and editing precision',
        actions: shortClips.map(c => ({
          clipId: c.clipId,
          action: 'extend_or_remove',
          reason: c.description
        }))
      });
    }

    const syncIssues = issues.filter(i => i.type === 'sync');
    if (syncIssues.length > 0) {
      optimizations.push({
        type: 'sync_correction',
        priority: 'high',
        issues: syncIssues,
        estimatedImpact: 'Proper audio/video synchronization',
        actions: syncIssues.map(issue => ({
          clipIndex: issue.clipIndex,
          action: 'adjust_offset',
          offset: issue.offset
        }))
      });
    }

    return optimizations;
  }

  suggestTransitionOptimizations(timelineAnalysis) {
    const actions = [];
    
    timelineAnalysis.tracks.forEach((track, trackIndex) => {
      for (let i = 1; i < track.clips.length; i++) {
        const gap = track.clips[i].startTime - track.clips[i-1].endTime;
        
        if (gap > 0.5 && gap < 2) {
          actions.push({
            trackId: track.id,
            between: [track.clips[i-1].id, track.clips[i].id],
            action: 'add_transition',
            suggestedType: 'dissolve',
            reason: 'Smooth gap transition'
          });
        }
      }
    });

    return actions;
  }

  createAssemblySequence(timelineAnalysis, optimizations) {
    const sequence = [];
    
    const sortedTracks = [...timelineAnalysis.tracks].sort((a, b) => 
      a.clips[0]?.startTime - b.clips[0]?.startTime
    );

    sortedTracks.forEach((track, trackIndex) => {
      track.clips.forEach(clip => {
        const opt = optimizations.find(o => 
          o.clips?.includes(clip.id) || 
          o.issues?.some(i => i.clipIndex === trackIndex)
        );
        
        sequence.push({
          trackId: track.id,
          trackType: track.type,
          clipId: clip.id,
          startTime: clip.startTime,
          optimizations: opt ? opt.type : null,
          order: sequence.length
        });
      });
    });

    return sequence;
  }

  calculateOverallScore(flowAnalysis, issues) {
    let score = 1.0;
    
    score -= (issues.length * 0.05);
    
    if (flowAnalysis.flowScore < 0.5) score -= 0.2;
    else if (flowAnalysis.flowScore < 0.7) score -= 0.1;
    
    if (flowAnalysis.transitionQuality.qualityPercentage < 70) score -= 0.15;
    
    return Math.max(Math.min(score, 1), 0);
  }
}

export const editorAgent = new EditorAgent();