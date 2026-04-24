/**
 * Camera Operator Agent
 * Suggests and generates alternative camera angles within timeline clips
 * Inspired by ViMax's multi-camera filming simulation
 */

import { BaseAgent } from './baseAgent.js';

export class CameraOperatorAgent extends BaseAgent {
  constructor() {
    super('CameraOperator', {
      description: 'Suggests and generates alternative camera angles for clips'
    });
    this.angleTypes = [
      { id: 'wide', name: 'Wide Shot', description: 'Establishes scene context', defaultDuration: 3 },
      { id: 'medium', name: 'Medium Shot', description: 'Standard framing for dialogue', defaultDuration: 5 },
      { id: 'close', name: 'Close-up', description: 'Focused on subject detail', defaultDuration: 3 },
      { id: 'over_shoulder', name: 'Over-the-Shoulder', description: 'POV shot for dialogue', defaultDuration: 4 },
      { id: 'pov', name: 'Point of View', description: 'First person perspective', defaultDuration: 3 },
      { id: 'dutch', name: 'Dutch Angle', description: 'Tilted for dramatic effect', defaultDuration: 2 },
      { id: 'low_angle', name: 'Low Angle', description: 'Upward view for power', defaultDuration: 3 },
      { id: 'high_angle', name: 'High Angle', description: 'Downward view for vulnerability', defaultDuration: 3 },
      { id: 'birds_eye', name: 'Bird\'s Eye', description: 'Top-down overhead view', defaultDuration: 4 },
      { id: 'tracking', name: 'Tracking Shot', description: 'Moving alongside subject', defaultDuration: 5 }
    ];
  }

  async execute(context) {
    const { clipId, clipData, timelineState, options = {} } = context;
    
    this.reset();
    this.setStatus('running', 0);

    try {
      this.setStatus('analyzing_clip', 15);
      
      const clipAnalysis = this.analyzeClip(clipData);
      
      this.setStatus('evaluating_angles', 35);
      
      const angleRecommendations = this.evaluateAngleOptions(clipAnalysis, options);
      
      this.setStatus('generating_suggestions', 55);
      
      const angleVariations = this.generateAngleVariations(clipAnalysis, angleRecommendations);
      
      this.setStatus('formatting_output', 75);
      
      const result = {
        clipId,
        clipAnalysis,
        recommendedAngles: angleRecommendations,
        angleVariations,
        cinematicSuggestions: this.generateCinematicSuggestions(clipAnalysis),
        transitionRecommendations: this.getTransitionRecommendations(clipAnalysis)
      };

      this.setResult(result);
      
    } catch (error) {
      this.setError(error.message);
    }
  }

  analyzeClip(clip) {
    return {
      id: clip?.id || 'unknown',
      duration: clip?.duration || 5,
      type: clip?.type || 'video',
      hasDialogue: clip?.metadata?.hasDialogue || false,
      hasAction: clip?.metadata?.hasAction || clip?.prompt?.toLowerCase().includes('action') || false,
      sceneType: this.determineSceneType(clip),
      contentDescription: this.generateContentDescription(clip),
      mood: this.determineMood(clip),
      primarySubject: clip?.metadata?.primarySubject || 'subject'
    };
  }

  determineSceneType(clip) {
    const prompt = (clip?.prompt || '').toLowerCase();
    const name = (clip?.name || '').toLowerCase();
    
    if (prompt.includes('exterior') || prompt.includes('outdoor') || name.includes('ext')) {
      return 'exterior';
    }
    if (prompt.includes('interior') || prompt.includes('indoor') || name.includes('int')) {
      return 'interior';
    }
    if (prompt.includes('dialogue') || prompt.includes('talking') || prompt.includes('speaking')) {
      return 'dialogue';
    }
    if (prompt.includes('action') || prompt.includes('chase') || prompt.includes('fight')) {
      return 'action';
    }
    if (prompt.includes('establishing') || prompt.includes('overview')) {
      return 'establishing';
    }
    return 'general';
  }

  generateContentDescription(clip) {
    const parts = [];
    
    if (clip?.prompt) {
      parts.push(clip.prompt.substring(0, 100));
    }
    
    if (clip?.metadata?.characters?.length > 0) {
      parts.push(`${clip.metadata.characters.length} character(s)`);
    }
    
    return parts.join(' | ') || 'Unspecified content';
  }

  determineMood(clip) {
    const prompt = (clip?.prompt || '').toLowerCase();
    
    if (prompt.includes('dramatic') || prompt.includes('tense')) return 'dramatic';
    if (prompt.includes('happy') || prompt.includes('joyful')) return 'upbeat';
    if (prompt.includes('sad') || prompt.includes('melancholy')) return 'somber';
    if (prompt.includes('romantic') || prompt.includes('intimate')) return 'romantic';
    if (prompt.includes('scary') || prompt.includes('horror')) return 'tense';
    
    return 'neutral';
  }

  evaluateAngleOptions(clipAnalysis, options = {}) {
    const recommendations = [];
    const sceneType = clipAnalysis.sceneType;
    
    this.angleTypes.forEach(angle => {
      const score = this.calculateAngleScore(angle, clipAnalysis, options);
      if (score > 0.4) {
        recommendations.push({
          ...angle,
          score,
          suggestedDuration: this.calculateDuration(angle, clipAnalysis),
          reason: this.getAngleReason(angle, clipAnalysis),
          promptModification: this.getPromptModifier(angle, clipAnalysis)
        });
      }
    });
    
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxAngles || 5);
  }

  calculateAngleScore(angle, clipAnalysis, options) {
    let score = 0.5;
    
    switch (angle.id) {
      case 'wide':
        if (sceneType === 'exterior' || sceneType === 'establishing') score += 0.3;
        if (clipAnalysis.duration > 10) score += 0.2;
        break;
      case 'medium':
        score += 0.2;
        if (sceneType === 'dialogue') score += 0.25;
        break;
      case 'close':
        if (clipAnalysis.hasDialogue) score += 0.2;
        if (clipAnalysis.mood === 'dramatic') score += 0.15;
        break;
      case 'over_shoulder':
        if (sceneType === 'dialogue') score += 0.35;
        break;
      case 'pov':
        if (clipAnalysis.hasAction) score += 0.25;
        break;
      case 'dutch':
        if (clipAnalysis.mood === 'dramatic' || clipAnalysis.mood === 'tense') score += 0.3;
        break;
      case 'low_angle':
        if (clipAnalysis.mood === 'dramatic') score += 0.25;
        break;
      case 'high_angle':
        if (clipAnalysis.sceneType === 'action') score += 0.2;
        break;
      case 'tracking':
        if (clipAnalysis.hasAction) score += 0.35;
        if (clipAnalysis.duration > 5) score += 0.15;
        break;
      case 'birds_eye':
        if (clipAnalysis.sceneType === 'exterior') score += 0.25;
        break;
    }
    
    if (options.preferDynamic && ['tracking', 'dutch', 'pov'].includes(angle.id)) {
      score += 0.1;
    }
    
    return Math.min(score, 1);
  }

  calculateDuration(angle, clipAnalysis) {
    const baseDuration = angle.defaultDuration;
    
    if (clipAnalysis.duration > baseDuration * 2) {
      return Math.min(baseDuration * 1.5, clipAnalysis.duration * 0.4);
    }
    
    return baseDuration;
  }

  getAngleReason(angle, clipAnalysis) {
    const reasons = {
      wide: 'Establishes scene context and sets the stage',
      medium: 'Standard framing balances subject and environment',
      close: 'Focuses attention on emotional detail',
      over_shoulder: 'Natural perspective for conversational scenes',
      pov: 'Immersive first-person viewpoint',
      dutch: 'Creates subconscious unease or tension',
      low_angle: 'Implies power and dominance',
      high_angle: 'Creates vulnerability or inferiority',
      birds_eye: 'Provides geographic/spatial context',
      tracking: 'Follows movement and maintains energy'
    };
    
    return reasons[angle.id] || 'Valid cinematic choice';
  }

  getPromptModifier(angle, clipAnalysis) {
    return `cinematic ${angle.name.toLowerCase()}, ${clipAnalysis.contentDescription}`;
  }

  generateAngleVariations(clipAnalysis, recommendations) {
    return recommendations.map(rec => ({
      angleId: rec.id,
      angleName: rec.name,
      prompt: rec.promptModification,
      suggestedDuration: rec.suggestedDuration,
      quality: rec.score,
      shotDescription: this.generateShotDescription(rec, clipAnalysis)
    }));
  }

  generateShotDescription(angleRec, clipAnalysis) {
    return `A ${angleRec.name.toLowerCase()} capturing ${clipAnalysis.contentDescription.toLowerCase()} with ${clipAnalysis.mood} mood.`;
  }

  generateCinematicSuggestions(clipAnalysis) {
    const suggestions = [];
    
    if (clipAnalysis.duration > 15) {
      suggestions.push({
        type: 'sequence',
        title: 'Opening Sequence',
        description: 'Start with wide establishing shot, then medium, then close',
        angles: ['wide', 'medium', 'close']
      });
    }
    
    if (clipAnalysis.hasAction) {
      suggestions.push({
        type: 'action_sequence',
        title: 'Action Coverage',
        description: 'Wide for context, close for impact, tracking for movement',
        angles: ['wide', 'close', 'tracking']
      });
    }
    
    if (clipAnalysis.hasDialogue) {
      suggestions.push({
        type: 'dialogue_sequence',
        title: 'Conversation Shot Pattern',
        description: 'Over-shoulder alternation with reaction shots',
        angles: ['over_shoulder', 'medium', 'close']
      });
    }
    
    return suggestions;
  }

  getTransitionRecommendations(clipAnalysis) {
    const transitions = [];
    
    if (clipAnalysis.hasAction) {
      transitions.push(
        { type: 'cut', score: 0.9, reason: 'Maintains action energy' },
        { type: 'wipe', score: 0.4, reason: 'Directional follow action' }
      );
    } else if (clipAnalysis.mood === 'dramatic') {
      transitions.push(
        { type: 'dissolve', score: 0.8, reason: 'Smooth emotional flow' },
        { type: 'fade', score: 0.5, reason: 'Classic dramatic transition' }
      );
    } else {
      transitions.push(
        { type: 'cut', score: 0.7, reason: 'Clean professional edit' },
        { type: 'dissolve', score: 0.5, reason: 'Subtle scene blend' }
      );
    }
    
    return transitions.sort((a, b) => b.score - a.score);
  }
}

export const cameraOperatorAgent = new CameraOperatorAgent();