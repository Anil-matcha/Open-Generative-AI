/**
 * Director Agent
 * Analyzes timeline flow and suggests content improvements
 * Inspired by ViMax's Director agent functionality
 */

import { BaseAgent } from './baseAgent.js';

export class DirectorAgent extends BaseAgent {
  constructor() {
    super('Director', {
      description: 'Analyzes timeline flow and provides intelligent content suggestions'
    });
    this.analysisRules = {
      minGapThreshold: 2,
      maxClipDuration: 30,
      optimalPacing: { min: 3, max: 10 }
    };
  }

  async execute(context) {
    const { timelineState, options = {} } = context;
    
    this.reset();
    this.setStatus('running', 0);

    try {
      this.setStatus('analyzing_structure', 15);
      
      const structureAnalysis = this.analyzeTimelineStructure(timelineState);
      
      this.setStatus('detecting_gaps', 30);
      
      const gapAnalysis = this.detectGaps(timelineState);
      
      this.setStatus('evaluating_pacing', 50);
      
      const pacingAnalysis = this.evaluatePacing(structureAnalysis);
      
      this.setStatus('generating_suggestions', 70);
      
      const suggestions = this.generateSuggestions(structureAnalysis, gapAnalysis, pacingAnalysis, options);
      
      this.setStatus('formatting_recommendations', 85);
      
      const recommendations = this.formatRecommendations(suggestions, structureAnalysis);
      
      this.setResult({
        structureAnalysis,
        gapAnalysis,
        pacingAnalysis,
        suggestions,
        recommendations,
        overallScore: this.calculateOverallScore(structureAnalysis, gapAnalysis, pacingAnalysis)
      });
      
    } catch (error) {
      this.setError(error.message);
    }
  }

  analyzeTimelineStructure(timelineState) {
    const tracks = timelineState?.tracks || [];
    
    const trackAnalysis = tracks.map(track => ({
      id: track.id,
      type: track.type,
      clipCount: track.clips?.length || 0,
      totalDuration: track.clips?.reduce((sum, c) => sum + (c.duration || 0), 0) || 0,
      clips: track.clips || []
    }));
    
    const totalClips = trackAnalysis.reduce((sum, t) => sum + t.clipCount, 0);
    const totalDuration = trackAnalysis.reduce((sum, t) => sum + t.totalDuration, 0);
    
    return {
      trackCount: tracks.length,
      totalClips,
      totalDuration,
      tracks: trackAnalysis,
      density: totalDuration > 0 ? totalClips / totalDuration : 0
    };
  }

  detectGaps(timelineState) {
    const gaps = [];
    const tracks = timelineState?.tracks || [];
    
    tracks.forEach(track => {
      const clips = track.clips || [];
      
      for (let i = 1; i < clips.length; i++) {
        const prevEnd = clips[i - 1].endTime || clips[i - 1].startTime + clips[i - 1].duration;
        const currStart = clips[i].startTime;
        
        const gapDuration = currStart - prevEnd;
        
        if (gapDuration >= this.analysisRules.minGapThreshold) {
          gaps.push({
            trackId: track.id,
            trackType: track.type,
            start: prevEnd,
            end: currStart,
            duration: gapDuration,
            previousClip: clips[i - 1].id,
            nextClip: clips[i].id,
            severity: this.classifyGapSeverity(gapDuration)
          });
        }
      }
      
      if (clips.length > 0) {
        const firstClipStart = clips[0].startTime || 0;
        if (firstClipStart > this.analysisRules.minGapThreshold) {
          gaps.push({
            trackId: track.id,
            trackType: track.type,
            start: 0,
            end: firstClipStart,
            duration: firstClipStart,
            previousClip: null,
            nextClip: clips[0].id,
            severity: this.classifyGapSeverity(firstClipStart)
          });
        }
      }
    });
    
    return {
      gaps,
      totalGapTime: gaps.reduce((sum, g) => sum + g.duration, 0),
      gapCount: gaps.length
    };
  }

  classifyGapSeverity(duration) {
    if (duration > 10) return 'critical';
    if (duration > 5) return 'high';
    if (duration > 2) return 'medium';
    return 'low';
  }

  evaluatePacing(structureAnalysis) {
    const pacingIssues = [];
    const goodSegments = [];
    
    structureAnalysis.tracks.forEach(track => {
      track.clips.forEach(clip => {
        const duration = clip.duration || 0;
        
        if (duration > this.analysisRules.maxClipDuration) {
          pacingIssues.push({
            clipId: clip.id,
            trackId: track.id,
            issue: 'too_long',
            duration,
            recommendation: 'Consider splitting this clip for better pacing'
          });
        } else if (duration >= this.analysisRules.optimalPacing.min && 
                   duration <= this.analysisRules.optimalPacing.max) {
          goodSegments.push({
            clipId: clip.id,
            trackId: track.id,
            duration,
            quality: 'optimal'
          });
        } else if (duration < this.analysisRules.optimalPacing.min && duration > 0) {
          pacingIssues.push({
            clipId: clip.id,
            trackId: track.id,
            issue: 'too_short',
            duration,
            recommendation: 'This clip may be too brief for proper impact'
          });
        }
      });
    });
    
    const score = goodSegments.length / Math.max(goodSegments.length + pacingIssues.length, 1);
    
    return {
      score,
      optimalClips: goodSegments.length,
      problematicClips: pacingIssues.length,
      issues: pacingIssues,
      goodSegments
    };
  }

  generateSuggestions(structureAnalysis, gapAnalysis, pacingAnalysis, options = {}) {
    const suggestions = [];
    
    if (gapAnalysis.gapCount > 0) {
      suggestions.push({
        type: 'gap_fill',
        priority: gapAnalysis.gaps.some(g => g.severity === 'critical') ? 'high' : 'medium',
        count: gapAnalysis.gapCount,
        totalDuration: gapAnalysis.totalGapTime,
        message: `Found ${gapAnalysis.gapCount} gaps totaling ${gapAnalysis.totalGapTime.toFixed(1)}s`,
        action: 'analyze_gaps'
      });
    }
    
    if (pacingAnalysis.score < 0.7) {
      suggestions.push({
        type: 'pacing',
        priority: 'medium',
        score: pacingAnalysis.score,
        issues: pacingAnalysis.problematicClips,
        message: `Pacing optimization needed (${Math.round(pacingAnalysis.score * 100)}% optimal)`,
        action: 'optimize_pacing'
      });
    }
    
    if (structureAnalysis.density < 0.1) {
      suggestions.push({
        type: 'sparse_content',
        priority: 'low',
        density: structureAnalysis.density,
        message: 'Timeline has sparse content - consider adding more clips',
        action: 'suggest_content'
      });
    }
    
    const transitions = this.analyzeTransitionQuality(structureAnalysis);
    if (transitions.needsAttention > 0) {
      suggestions.push({
        type: 'transitions',
        priority: 'medium',
        needsAttention: transitions.needsAttention,
        total: transitions.total,
        message: `${transitions.needsAttention} of ${transitions.total} transitions could be improved`,
        action: 'improve_transitions'
      });
    }
    
    if (options.includeNarrativeSuggestions) {
      const narrativeScore = this.evaluateNarrativeFlow(structureAnalysis);
      if (narrativeScore < 0.8) {
        suggestions.push({
          type: 'narrative',
          priority: 'medium',
          score: narrativeScore,
          message: 'Narrative flow could be enhanced',
          action: 'suggest_narrative_improvements'
        });
      }
    }
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });
  }

  analyzeTransitionQuality(structureAnalysis) {
    let needsAttention = 0;
    let total = 0;
    
    structureAnalysis.tracks.forEach(track => {
      const clips = track.clips || [];
      total += Math.max(clips.length - 1, 0);
      
      for (let i = 1; i < clips.length; i++) {
        if (!clips[i].transition || clips[i].transition.type === 'cut') {
          const gap = clips[i].startTime - (clips[i-1].startTime + clips[i-1].duration);
          if (gap < 0.5) {
            needsAttention++;
          }
        }
      }
    });
    
    return { needsAttention, total: total || 1 };
  }

  evaluateNarrativeFlow(structureAnalysis) {
    let score = 1.0;
    
    structureAnalysis.tracks.forEach(track => {
      if (track.type !== 'video') return;
      
      const clips = track.clips;
      if (clips.length < 3) return;
      
      let narrativeGaps = 0;
      for (let i = 2; i < clips.length; i++) {
        const timeDiff = clips[i].startTime - clips[i-2].endTime;
        if (timeDiff > 10) narrativeGaps++;
      }
      
      if (narrativeGaps > 0) {
        score -= (narrativeGaps * 0.1);
      }
    });
    
    return Math.max(score, 0);
  }

  formatRecommendations(suggestions, structureAnalysis) {
    const recommendations = {
      immediate: [],
      suggested: [],
      niceToHave: []
    };
    
    suggestions.forEach(s => {
      const rec = {
        ...s,
        timestamp: Date.now(),
        estimatedImpact: this.estimateImpact(s, structureAnalysis)
      };
      
      if (s.priority === 'high' || s.priority === 'critical') {
        recommendations.immediate.push(rec);
      } else if (s.priority === 'medium') {
        recommendations.suggested.push(rec);
      } else {
        recommendations.niceToHave.push(rec);
      }
    });
    
    return recommendations;
  }

  estimateImpact(suggestion, structureAnalysis) {
    switch (suggestion.type) {
      case 'gap_fill':
        return { timeSavings: suggestion.totalDuration * 0.8, qualityImprovement: 0.3 };
      case 'pacing':
        return { timeSavings: 0, qualityImprovement: 0.2 };
      case 'transitions':
        return { timeSavings: 0, qualityImprovement: 0.15 };
      default:
        return { timeSavings: 0, qualityImprovement: 0.1 };
    }
  }

  calculateOverallScore(structureAnalysis, gapAnalysis, pacingAnalysis) {
    let score = 1.0;
    
    const gapPenalty = Math.min(gapAnalysis.totalGapTime / 60, 0.4);
    score -= gapPenalty;
    
    const pacingPenalty = (1 - pacingAnalysis.score) * 0.3;
    score -= pacingPenalty;
    
    if (structureAnalysis.density < 0.05) {
      score -= 0.2;
    }
    
    return Math.max(Math.min(score, 1), 0);
  }
}

export const directorAgent = new DirectorAgent();