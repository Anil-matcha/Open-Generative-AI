/**
 * Director Agent - Comprehensive Unit Tests (RED PHASE)
 * 
 * TDD RED PHASE: All tests FAIL initially.
 * Coverage: Timeline analysis, gap detection, pacing evaluation, suggestion generation
 * 
 * Methods:
 *   analyzeTimelineStructure, detectGaps, evaluatePacing, generateSuggestions, 
 *   formatRecommendations, estimateImpact, calculateOverallScore
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock BaseAgent
vi.mock('../../src/lib/agents/baseAgent.js', () => ({
  BaseAgent: class MockBaseAgent {
    setStatus = vi.fn();
    setResult = vi.fn();
    setError = vi.fn();
  }
}));

let DirectorAgent;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../src/lib/agents/directorAgent.js');
  DirectorAgent = mod.DirectorAgent;
});

// ─── ANALYZE TIMELINE STRUCTURE ───────────────────────────────────────────────

describe('DirectorAgent - analyzeTimelineStructure (RED)', () => {
  
  it('analyzes track count and clip counts', () => {
    const agent = new DirectorAgent();
    const timelineState = {
      tracks: [
        { id: 'v1', name: 'Video Track', type: 'video', items: [{ duration: 5 }, { duration: 3 }] },
        { id: 'a1', name: 'Audio Track', type: 'audio', items: [{ duration: 8 }] }
      ]
    };
    
    const result = agent.analyzeTimelineStructure(timelineState);
    
    expect(result.trackCount).toBe(2);
    expect(result.totalClips).toBe(3);
    expect(result.totalDuration).toBe(16);
    expect(result.tracks[0].clipCount).toBe(2);
    expect(result.tracks[1].clipCount).toBe(1);
  });
  
  it('calculates density correctly', () => {
    const agent = new DirectorAgent();
    const timelineState = {
      tracks: [
        { id: 'v1', type: 'video', items: [{ duration: 10 }, { duration: 10 }] }
      ]
    };
    
    const result = agent.analyzeTimelineStructure(timelineState);
    
    expect(result.totalDuration).toBe(20);
    expect(result.totalClips).toBe(2);
    expect(result.density).toBe(0.1); // 2 clips / 20 duration
  });
  
  it('handles empty timeline', () => {
    const agent = new DirectorAgent();
    const result = agent.analyzeTimelineStructure({ tracks: [] });
    
    expect(result.trackCount).toBe(0);
    expect(result.totalClips).toBe(0);
    expect(result.totalDuration).toBe(0);
    expect(result.density).toBe(0);
  });
});

// ─── DETECT GAPS ──────────────────────────────────────────────────────────────

describe('DirectorAgent - detectGaps (RED)', () => {
  
  it('detects gaps between clips in same track', () => {
    const agent = new DirectorAgent();
    const timelineState = {
      tracks: [{
        id: 'v1',
        type: 'video',
        items: [
          { id: 'c1', startTime: 0, duration: 5, endTime: 5 },
          { id: 'c2', startTime: 8, duration: 3 } // gap of 3s
        ]
      }]
    };
    
    const result = agent.detectGaps(timelineState);
    
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0].duration).toBe(3);
    expect(result.gaps[0].start).toBe(5);
    expect(result.gaps[0].end).toBe(8);
    expect(result.totalGapTime).toBe(3);
  });
  
  it('detects initial gap before first clip', () => {
    const agent = new DirectorAgent();
    const timelineState = {
      tracks: [{
        id: 'v1',
        type: 'video',
        items: [{ id: 'c1', startTime: 5, duration: 5 }]
      }]
    };
    
    const result = agent.detectGaps(timelineState);
    
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0].duration).toBe(5);
    expect(result.gaps[0].previousClip).toBe(null);
    expect(result.gaps[0].nextClip).toBe('c1');
  });
  
  it('classifies gap severity correctly', () => {
    const agent = new DirectorAgent();
    
    expect(agent.classifyGapSeverity(1)).toBe('low');
    expect(agent.classifyGapSeverity(3)).toBe('medium');
    expect(agent.classifyGapSeverity(7)).toBe('high');
    expect(agent.classifyGapSeverity(15)).toBe('critical');
  });
  
  it('ignores gaps below threshold', () => {
    const agent = new DirectorAgent();
    const timelineState = {
      tracks: [{
        id: 'v1',
        type: 'video',
        items: [
          { id: 'c1', startTime: 0, duration: 5 },
          { id: 'c2', startTime: 6.5, duration: 3 } // gap of 1.5s < 2s threshold
        ]
      }]
    };
    
    const result = agent.detectGaps(timelineState);
    
    expect(result.gaps).toHaveLength(0);
    expect(result.totalGapTime).toBe(0);
  });
});

// ─── EVALUATE PACING ──────────────────────────────────────────────────────────

describe('DirectorAgent - evaluatePacing (RED)', () => {
  
  it('identifies clips that are too long', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = {
      tracks: [{
        id: 'v1',
        type: 'video',
        clips: [
          { id: 'c1', duration: 35 }, // > 30s max
          { id: 'c2', duration: 25 }  // ok
        ]
      }]
    };
    
    const result = agent.evaluatePacing(structureAnalysis);
    
    expect(result.problematicClips).toBe(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].issue).toBe('too_long');
    expect(result.issues[0].duration).toBe(35);
  });
  
  it('identifies clips that are too short', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = {
      tracks: [{
        id: 'v1',
        type: 'video',
        clips: [
          { id: 'c1', duration: 1 }, // < 3s min
          { id: 'c2', duration: 5 }  // ok
        ]
      }]
    };
    
    const result = agent.evaluatePacing(structureAnalysis);
    
    expect(result.problematicClips).toBe(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].issue).toBe('too_short');
  });
  
  it('identifies optimal pacing clips', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = {
      tracks: [{
        id: 'v1',
        type: 'video',
        clips: [
          { id: 'c1', duration: 5 },  // optimal 3-10
          { id: 'c2', duration: 8 },  // optimal
          { id: 'c3', duration: 12 } // too long
        ]
      }]
    };
    
    const result = agent.evaluatePacing(structureAnalysis);
    
    expect(result.optimalClips).toBe(2);
    expect(result.goodSegments).toHaveLength(2);
    expect(result.score).toBe(2/3); // 2 good / 3 total
  });
  
  it('calculates pacing score correctly', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = {
      tracks: [{
        id: 'v1',
        type: 'video',
        clips: [
          { id: 'c1', duration: 5 }, // good
          { id: 'c2', duration: 5 }, // good
          { id: 'c3', duration: 5 }, // good
          { id: 'c4', duration: 35 } // bad
        ]
      }]
    };
    
    const result = agent.evaluatePacing(structureAnalysis);
    
    expect(result.score).toBe(0.75); // 3 good / 4 total
  });
});

// ─── GENERATE SUGGESTIONS ─────────────────────────────────────────────────────

describe('DirectorAgent - generateSuggestions (RED)', () => {
  
  it('suggests gap filling when gaps exist', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = { tracks: [] };
    const gapAnalysis = { gapCount: 2, totalGapTime: 8, gaps: [{ severity: 'high' }] };
    const pacingAnalysis = { score: 1.0 };
    
    const result = agent.generateSuggestions(structureAnalysis, gapAnalysis, pacingAnalysis);
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('gap_fill');
    expect(result[0].priority).toBe('high');
    expect(result[0].count).toBe(2);
    expect(result[0].totalDuration).toBe(8);
  });
  
  it('suggests pacing improvements when score is low', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = { tracks: [] };
    const gapAnalysis = { gapCount: 0, totalGapTime: 0 };
    const pacingAnalysis = { score: 0.5, problematicClips: 3 };
    
    const result = agent.generateSuggestions(structureAnalysis, gapAnalysis, pacingAnalysis);
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('pacing');
    expect(result[0].priority).toBe('medium');
    expect(result[0].score).toBe(0.5);
  });
  
  it('suggests content addition for sparse timelines', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = { density: 0.02 }; // < 0.1
    const gapAnalysis = { gapCount: 0, totalGapTime: 0 };
    const pacingAnalysis = { score: 1.0 };
    
    const result = agent.generateSuggestions(structureAnalysis, gapAnalysis, pacingAnalysis);
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('sparse_content');
    expect(result[0].priority).toBe('low');
  });
  
  it('analyzes transition quality', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = {
      tracks: [{
        type: 'video',
        clips: [
          { transition: 'cut' },
          { transition: 'cut' },
          { transition: 'fade' }
        ]
      }]
    };
    
    const result = agent.analyzeTransitionQuality(structureAnalysis);
    
    expect(result.needsAttention).toBe(2); // 2 cuts without proper gap
    expect(result.total).toBe(2); // 2 transitions
  });
  
  it('evaluates narrative flow for video tracks', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = {
      tracks: [{
        type: 'video',
        clips: [
          { startTime: 0, endTime: 5 },
          { startTime: 5, endTime: 10 },
          { startTime: 18, endTime: 23 } // gap > 10s
        ]
      }]
    };
    
    const result = agent.evaluateNarrativeFlow(structureAnalysis);
    
    expect(result).toBeLessThan(1.0); // penalty applied
  });
  
  it('orders suggestions by priority', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = { density: 0.02 };
    const gapAnalysis = { gapCount: 1, totalGapTime: 15, gaps: [{ severity: 'critical' }] };
    const pacingAnalysis = { score: 0.3 };
    
    const result = agent.generateSuggestions(structureAnalysis, gapAnalysis, pacingAnalysis);
    
    expect(result[0].priority).toBe('high'); // gap_fill
    expect(result[1].priority).toBe('medium'); // pacing
    expect(result[2].priority).toBe('low'); // sparse_content
  });
});

// ─── FORMAT RECOMMENDATIONS ───────────────────────────────────────────────────

describe('DirectorAgent - formatRecommendations (RED)', () => {
  
  it('categorizes suggestions into priority buckets', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = {};
    const suggestions = [
      { priority: 'high', type: 'gap_fill' },
      { priority: 'medium', type: 'pacing' },
      { priority: 'low', type: 'sparse' },
      { priority: 'critical', type: 'error' }
    ];
    
    const result = agent.formatRecommendations(suggestions, structureAnalysis);
    
    expect(result.immediate).toHaveLength(2); // high + critical
    expect(result.suggested).toHaveLength(1); // medium
    expect(result.niceToHave).toHaveLength(1); // low
  });
  
  it('estimates impact for different suggestion types', () => {
    const agent = new DirectorAgent();
    
    expect(agent.estimateImpact({ type: 'gap_fill', totalDuration: 10 })).toEqual({
      timeSavings: 8,
      qualityImprovement: 0.3
    });
    
    expect(agent.estimateImpact({ type: 'pacing' })).toEqual({
      timeSavings: 0,
      qualityImprovement: 0.2
    });
  });
  
  it('adds timestamps and impact to recommendations', () => {
    const agent = new DirectorAgent();
    const suggestions = [{ type: 'gap_fill', priority: 'high' }];
    
    const result = agent.formatRecommendations(suggestions, {});
    
    expect(result.immediate[0]).toHaveProperty('timestamp');
    expect(result.immediate[0]).toHaveProperty('estimatedImpact');
    expect(result.immediate[0].estimatedImpact.qualityImprovement).toBe(0.3);
  });
});

// ─── CALCULATE OVERALL SCORE ──────────────────────────────────────────────────

describe('DirectorAgent - calculateOverallScore (RED)', () => {
  
  it('applies gap penalty correctly', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = { tracks: [] };
    const gapAnalysis = { totalGapTime: 30 }; // 30s gap
    const pacingAnalysis = { score: 1.0 };
    
    const score = agent.calculateOverallScore(structureAnalysis, gapAnalysis, pacingAnalysis);
    
    expect(score).toBeLessThan(1.0);
    expect(score).toBeGreaterThan(0.8); // 0.4 * 0.3 = 0.12 penalty
  });
  
  it('applies pacing penalty correctly', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = { tracks: [] };
    const gapAnalysis = { totalGapTime: 0 };
    const pacingAnalysis = { score: 0.5 }; // 50% good pacing
    
    const score = agent.calculateOverallScore(structureAnalysis, gapAnalysis, pacingAnalysis);
    
    expect(score).toBe(0.85); // 1.0 - 0.15 penalty (0.5 * 0.3)
  });
  
  it('applies sparse content penalty', () => {
    const agent = new DirectorAgent();
    const structureAnalysis = { density: 0.01 }; // very sparse
    const gapAnalysis = { totalGapTime: 0 };
    const pacingAnalysis = { score: 1.0 };
    
    const score = agent.calculateOverallScore(structureAnalysis, gapAnalysis, pacingAnalysis);
    
    expect(score).toBe(0.9); // 1.0 - 0.2 penalty
  });
  
  it('returns score between 0 and 1', () => {
    const agent = new DirectorAgent();
    
    // Very bad case
    const badScore = agent.calculateOverallScore(
      { density: 0.001 },
      { totalGapTime: 300 },
      { score: 0.1 }
    );
    
    // Very good case
    const goodScore = agent.calculateOverallScore(
      { density: 0.5 },
      { totalGapTime: 0 },
      { score: 1.0 }
    );
    
    expect(badScore).toBeGreaterThanOrEqual(0);
    expect(badScore).toBeLessThanOrEqual(1);
    expect(goodScore).toBeGreaterThanOrEqual(0);
    expect(goodScore).toBeLessThanOrEqual(1);
  });
});

// ─── EXECUTE INTERNAL (INTEGRATION) ───────────────────────────────────────────

describe('DirectorAgent - executeInternal (RED)', () => {
  
  it('executes full analysis pipeline', async () => {
    const agent = new DirectorAgent();
    const timelineState = {
      tracks: [{
        id: 'v1',
        type: 'video',
        items: [
          { id: 'c1', startTime: 0, duration: 5 },
          { id: 'c2', startTime: 10, duration: 5 } // gap of 5s
        ]
      }]
    };
    
    await agent.executeInternal({ timelineState });
    
    expect(agent.setStatus).toHaveBeenCalledWith('analyzing_structure', 15);
    expect(agent.setStatus).toHaveBeenCalledWith('detecting_gaps', 30);
    expect(agent.setStatus).toHaveBeenCalledWith('evaluating_pacing', 50);
    expect(agent.setStatus).toHaveBeenCalledWith('generating_suggestions', 70);
    expect(agent.setStatus).toHaveBeenCalledWith('formatting_recommendations', 85);
    
    expect(agent.setResult).toHaveBeenCalledWith({
      structureAnalysis: expect.any(Object),
      gapAnalysis: expect.any(Object),
      pacingAnalysis: expect.any(Object),
      suggestions: expect.any(Array),
      recommendations: expect.any(Object),
      overallScore: expect.any(Number)
    });
  });
  
  it('handles errors gracefully', async () => {
    const agent = new DirectorAgent();
    // Pass invalid data to cause error
    await agent.executeInternal({ timelineState: null });
    
    expect(agent.setError).toHaveBeenCalledWith(expect.any(String));
  });
  
  it('supports narrative suggestions option', async () => {
    const agent = new DirectorAgent();
    const timelineState = {
      tracks: [{
        type: 'video',
        items: [
          { startTime: 0, duration: 5, endTime: 5 },
          { startTime: 5, duration: 5, endTime: 10 },
          { startTime: 25, duration: 5, endTime: 30 } // big gap
        ]
      }]
    };
    
    await agent.executeInternal({ 
      timelineState, 
      options: { includeNarrativeSuggestions: true } 
    });
    
    const resultCall = agent.setResult.mock.calls[0][0];
    const narrativeSuggestion = resultCall.suggestions.find(s => s.type === 'narrative');
    expect(narrativeSuggestion).toBeDefined();
    expect(narrativeSuggestion.priority).toBe('medium');
  });
});
