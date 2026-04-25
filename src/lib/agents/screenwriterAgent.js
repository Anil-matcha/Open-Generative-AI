/**
 * Screenwriter Agent
 * Generates script/scene descriptions from timeline content
 * Inspired by ViMax's Screenwriter agent functionality
 */

import { BaseAgent } from './baseAgent.js';

export class ScreenwriterAgent extends BaseAgent {
  constructor() {
    super('Screenwriter', {
      description: 'Generates scene descriptions and script suggestions from timeline content'
    });
    this.promptTemplates = {
      scene: 'Describe the visual scene at {timestamp} with {clipCount} clips containing: {contentDescription}',
      narrative: 'Suggest narrative improvements for timeline segment starting at {start} ending at {end}',
      dialogue: 'Generate dialogue suggestions for scene with: {context}'
    };
  }

  async executeInternal(context) {
    const { timelineState, selectedClips = [], mode = 'scene' } = context;

    try {
      this.setStatus('analyzing', 20);
      
      const contentAnalysis = await this.analyzeTimelineContent(timelineState, selectedClips);
      
      this.setStatus('generating', 50);
      
      let result;
      switch (mode) {
        case 'narrative':
          result = await this.generateNarrativeSuggestions(contentAnalysis, context);
          break;
        case 'dialogue':
          result = await this.generateDialogueSuggestions(contentAnalysis, context);
          break;
        case 'scene':
        default:
          result = await this.generateSceneDescriptions(contentAnalysis, context);
          break;
      }

      this.setStatus('formatting', 80);
      
      const formattedResult = this.formatScriptResult(result, mode);
      
      this.setResult(formattedResult);
      
    } catch (error) {
      this.setError(error.message);
    }
  }

  async analyzeTimelineContent(timelineState, selectedClips) {
    const clips = selectedClips.length > 0 
      ? selectedClips 
      : timelineState?.tracks?.flatMap(t => t.items) || [];
    
    return {
      clipCount: clips.length,
      totalDuration: clips.reduce((sum, clip) => sum + (clip.duration || 0), 0),
      contentTypes: this.categorizeContent(clips),
      themes: this.detectThemes(clips),
      characters: this.extractCharacters(clips),
      timestamps: clips.map(c => ({ start: c.startTime, end: c.endTime }))
    };
  }

  categorizeContent(clips) {
    const categories = { video: 0, audio: 0, text: 0, image: 0 };
    clips.forEach(clip => {
      if (clip.type === 'video') categories.video++;
      else if (clip.type === 'audio') categories.audio++;
      else if (clip.type === 'text' || clip.type === 'caption') categories.text++;
      else if (clip.type === 'image') categories.image++;
    });
    return categories;
  }

  detectThemes(clips) {
    const themes = new Set();
    clips.forEach(clip => {
      if (clip.metadata?.theme) themes.add(clip.metadata.theme);
      if (clip.prompt?.includes('outdoor')) themes.add('outdoor');
      if (clip.prompt?.includes('indoor')) themes.add('indoor');
      if (clip.prompt?.includes('action')) themes.add('action');
      if (clip.prompt?.includes('dialogue')) themes.add('dialogue');
    });
    return Array.from(themes);
  }

  extractCharacters(clips) {
    const characters = new Map();
    clips.forEach(clip => {
      if (clip.metadata?.characters) {
        clip.metadata.characters.forEach(char => {
          if (!characters.has(char.id)) {
            characters.set(char.id, { name: char.name, appearances: 0 });
          }
          characters.get(char.id).appearances++;
        });
      }
    });
    return Array.from(characters.values());
  }

  async generateSceneDescriptions(analysis, context) {
    const prompt = this.buildScenePrompt(analysis);
    
    return {
      type: 'scene_description',
      prompt,
      sceneCount: Math.ceil(analysis.totalDuration / 5),
      estimatedLength: `${Math.round(analysis.totalDuration)} seconds`,
      keyElements: this.extractKeyElements(analysis),
      suggestedTransitions: this.suggestTransitions(analysis)
    };
  }

  buildScenePrompt(analysis) {
    const contentDesc = analysis.contentTypes.video > 0 
      ? `${analysis.contentTypes.video} video clips` 
      : 'timeline content';
    
    return `Create a ${Math.ceil(analysis.totalDuration / 5)} scene sequence description for a ${analysis.totalDuration}s timeline with ${contentDesc}.
Themes detected: ${analysis.themes.join(', ') || 'general content'}.
Characters present: ${analysis.characters.length > 0 ? analysis.characters.map(c => c.name).join(', ') : 'unspecified'}.
Content types: ${Object.entries(analysis.contentTypes).filter(([k,v]) => v > 0).map(([k,v]) => `${v} ${k}`).join(', ')}`;
  }

  extractKeyElements(analysis) {
    const elements = [];
    
    if (analysis.characters.length > 0) {
      elements.push({
        type: 'character',
        items: analysis.characters.map(c => `${c.name} (${c.appearances} appearances)`)
      });
    }
    
    if (analysis.themes.length > 0) {
      elements.push({
        type: 'theme',
        items: analysis.themes
      });
    }
    
    elements.push({
      type: 'content_breakdown',
      items: Object.entries(analysis.contentTypes)
        .filter(([k, v]) => v > 0)
        .map(([k, v]) => `${v} ${k} clips`)
    });
    
    return elements;
  }

  suggestTransitions(analysis) {
    const transitions = [];
    
    if (analysis.clipCount > 1) {
      transitions.push(
        { type: 'dissolve', probability: 0.4, reason: 'standard scene change' },
        { type: 'cut', probability: 0.3, reason: 'quick pace' },
        { type: 'wipe', probability: 0.2, reason: 'directional flow' },
        { type: 'fade', probability: 0.1, reason: 'soft transition' }
      );
    }
    
    return transitions;
  }

  async generateNarrativeSuggestions(analysis, context) {
    return {
      type: 'narrative_suggestions',
      suggestions: [
        {
          id: 'narrative_1',
          priority: 'high',
          text: 'Consider adding a establishing shot to set the scene context',
          location: context?.start || 0
        },
        {
          id: 'narrative_2', 
          priority: 'medium',
          text: `Current pacing covers ${analysis.totalDuration}s - suggest adding reaction shots`,
          location: context?.end || analysis.totalDuration
        }
      ],
      overallFlow: analysis.clipCount > 5 ? 'complex' : 'simple',
      recommendedPacing: analysis.totalDuration / analysis.clipCount
    };
  }

  async generateDialogueSuggestions(analysis, context) {
    const characterNames = analysis.characters.map(c => c.name);
    
    return {
      type: 'dialogue_suggestions',
      characters: characterNames,
      suggestedExchanges: characterNames.length >= 2 
        ? [
            { speaker: characterNames[0], listener: characterNames[1], tone: 'friendly' },
            { speaker: characterNames[1] || 'Narrator', listener: characterNames[0] || 'Audience', tone: 'informative' }
          ]
        : [],
      contextNotes: `Scene contains ${analysis.clipCount} clips spanning ${analysis.totalDuration}s`
    };
  }

  formatScriptResult(result, mode) {
    return {
      ...result,
      agent: this.name,
      mode,
      timestamp: Date.now(),
      formatted: this.formatForDisplay(result, mode)
    };
  }

  formatForDisplay(result, mode) {
    switch (mode) {
      case 'narrative':
        return result.suggestions?.map(s => `[${s.priority}] ${s.text}`).join('\n') || '';
      case 'dialogue':
        return result.suggestedExchanges?.map(e => `${e.speaker}: "${e.tone}"`).join('\n') || '';
      case 'scene':
      default:
        return result.keyElements?.map(e => `${e.type}: ${e.items.join(', ')}`).join('\n') || '';
    }
  }
}

export const screenwriterAgent = new ScreenwriterAgent();