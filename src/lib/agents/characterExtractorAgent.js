/**
 * Character Extractor Agent
 * Analyzes timeline clips to identify and track characters
 * Inspired by ViMax's CharacterExtractor agent functionality
 */

import { BaseAgent } from './baseAgent.js';

export class CharacterExtractorAgent extends BaseAgent {
  constructor() {
    super('CharacterExtractor', {
      description: 'Identifies and tracks characters across timeline clips'
    });
  }

  async execute(context) {
    const { timelineState, selectedClips = [], options = {} } = context;
    
    this.reset();
    this.setStatus('running', 0);

    try {
      this.setStatus('scanning', 20);
      
      const clips = selectedClips.length > 0 
        ? selectedClips 
        : timelineState?.tracks?.flatMap(t => t.items) || [];
      
      this.setStatus('analyzing', 40);
      
      const characterData = this.extractCharacterData(clips);
      
      this.setStatus('building', 60);
      
      const characterDatabase = this.buildCharacterDatabase(characterData);
      
      this.setStatus('cross_referencing', 80);
      
      const consistencyReport = this.generateConsistencyReport(characterDatabase, options);
      
      this.setResult({
        characters: characterDatabase,
        totalAppearances: characterData.length,
        consistencyReport,
        clipCount: clips.length
      });
      
    } catch (error) {
      this.setError(error.message);
    }
  }

  extractCharacterData(clips) {
    const characterData = [];
    
    clips.forEach((clip, index) => {
      const clipCharacters = this.findCharactersInClip(clip);
      
      clipCharacters.forEach(char => {
        characterData.push({
          id: char.id || `char_${index}_${characterData.length}`,
          name: char.name || 'Unknown',
          appearance: {
            clipId: clip.id || `clip_${index}`,
            clipIndex: index,
            startTime: clip.startTime,
            endTime: clip.endTime,
            confidence: char.confidence || 0.8,
            visualCues: char.visualCues || [],
            audioCues: char.audioCues || []
          }
        });
      });
    });
    
    return characterData;
  }

  findCharactersInClip(clip) {
    const characters = [];
    
    if (clip.metadata?.characters) {
      characters.push(...clip.metadata.characters);
    }
    
    if (clip.prompt) {
      const promptChars = this.extractFromPrompt(clip.prompt);
      characters.push(...promptChars);
    }
    
    if (clip.name && !clip.metadata?.characters) {
      const nameChars = this.extractFromName(clip.name);
      characters.push(...nameChars);
    }
    
    return characters;
  }

  extractFromPrompt(prompt) {
    const characters = [];
    const namePatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|was|appears?|appears|walking|running|sitting|standing|talking|speaking)/g,
      /(?:character|person|man|woman|boy|girl|kid|adult|child)\s+(?:named|called)\s+([A-Z][a-z]+)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:\(|:|：|$)/gm
    ];
    
    namePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(prompt)) !== null) {
        characters.push({
          name: match[1] || match[2],
          confidence: 0.6,
          source: 'prompt_analysis'
        });
      }
    });
    
    return characters;
  }

  extractFromName(name) {
    const cleaned = name.replace(/[_\-\[\]\d]+/g, ' ').trim();
    if (cleaned.length > 2 && cleaned.length < 50) {
      return [{
        name: cleaned,
        confidence: 0.5,
        source: 'clip_name'
      }];
    }
    return [];
  }

  buildCharacterDatabase(characterData) {
    const database = new Map();
    
    characterData.forEach(entry => {
      if (database.has(entry.id)) {
        database.get(entry.id).appearances.push(entry.appearance);
      } else {
        database.set(entry.id, {
          id: entry.id,
          name: entry.name,
          appearances: [entry.appearance],
          totalAppearances: 1,
          consistency: this.calculateConsistency(entry.appearance),
          lastSeen: entry.appearance.startTime
        });
      }
    });
    
    database.forEach((char, id) => {
      char.totalAppearances = char.appearances.length;
      char.consistency = this.calculateConsistencyForCharacter(char.appearances);
    });
    
    return Array.from(database.values());
  }

  calculateConsistency(appearance) {
    let score = 0.5;
    if (appearance.confidence > 0.8) score += 0.2;
    if (appearance.visualCues?.length > 0) score += 0.15;
    if (appearance.audioCues?.length > 0) score += 0.15;
    return Math.min(score, 1.0);
  }

  calculateConsistencyForCharacter(appearances) {
    if (appearances.length < 2) return 1.0;
    
    let totalConsistency = 0;
    appearances.forEach(app => {
      totalConsistency += this.calculateConsistency(app);
    });
    
    return totalConsistency / appearances.length;
  }

  generateConsistencyReport(database, options = {}) {
    const issues = [];
    const suggestions = [];
    
    database.forEach(char => {
      if (char.consistency < 0.7) {
        issues.push({
          characterId: char.id,
          characterName: char.name,
          issue: 'low_consistency',
          message: `${char.name} has inconsistent appearances (${Math.round(char.consistency * 100)}% consistency)`,
          recommendation: 'Consider regenerating lower-confidence takes for visual consistency'
        });
        suggestions.push({
          characterId: char.id,
          action: 'regenerate_takes',
          priority: 'high',
          description: `Regenerate ${char.appearances.filter(a => a.confidence < 0.7).length} takes for ${char.name}`
        });
      }
      
      if (char.totalAppearances > 3) {
        const gaps = this.detectGaps(char.appearances);
        if (gaps.length > 0) {
          suggestions.push({
            characterId: char.id,
            action: 'fill_gaps',
            priority: 'medium',
            description: `Add ${gaps.length} gap-fill segments for ${char.name}'s story arc`
          });
        }
      }
    });
    
    return {
      issues,
      suggestions,
      overallHealth: this.calculateOverallHealth(database),
      trackedCharacters: database.length
    };
  }

  detectGaps(appearances) {
    const gaps = [];
    const sorted = [...appearances].sort((a, b) => a.startTime - b.startTime);
    
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].startTime - sorted[i - 1].endTime;
      if (gap > 5) {
        gaps.push({
          start: sorted[i - 1].endTime,
          end: sorted[i].startTime,
          duration: gap
        });
      }
    }
    
    return gaps;
  }

  calculateOverallHealth(database) {
    if (database.length === 0) return 1.0;
    
    const totalConsistency = database.reduce((sum, char) => sum + char.consistency, 0);
    return totalConsistency / database.length;
  }
}

export const characterExtractorAgent = new CharacterExtractorAgent();