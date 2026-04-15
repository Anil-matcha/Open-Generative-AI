import { describe, it, expect } from 'vitest';
import { getModelFeatures, hasAdvancedFeatures, WAN_AI_EFFECTS } from '../../src/lib/muapiConfig.js';

describe('MuAPI Model Feature Detection', () => {
  describe('getModelFeatures', () => {
    it('should return correct features for seedance-v2.0-t2v', () => {
      const features = getModelFeatures('seedance-v2.0-t2v');
      expect(features).toEqual(['aiVideoEffects', 'motionControls', 'musicGeneration']);
    });

    it('should return correct features for seedance-v2.0-i2v', () => {
      const features = getModelFeatures('seedance-v2.0-i2v');
      expect(features).toEqual(['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration']);
    });

    it('should return correct features for seedance-v2.0-extend', () => {
      const features = getModelFeatures('seedance-v2.0-extend');
      expect(features).toEqual(['aiVideoEffects', 'motionControls', 'musicGeneration']);
    });

    it('should return correct features for kling-v2.1-master-t2v', () => {
      const features = getModelFeatures('kling-v2.1-master-t2v');
      expect(features).toEqual(['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration']);
    });

    it('should return correct features for kling-v2.1-standard-t2v', () => {
      const features = getModelFeatures('kling-v2.1-standard-t2v');
      expect(features).toEqual(['motionControls', 'vfx']);
    });

    it('should return correct features for kling-v2.1-pro-t2v', () => {
      const features = getModelFeatures('kling-v2.1-pro-t2v');
      expect(features).toEqual(['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration']);
    });

    it('should return correct features for kling-v3.0-pro-text-to-video', () => {
      const features = getModelFeatures('kling-v3.0-pro-text-to-video');
      expect(features).toEqual(['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration']);
    });

    it('should return correct features for kling-v3.0-standard-text-to-video', () => {
      const features = getModelFeatures('kling-v3.0-standard-text-to-video');
      expect(features).toEqual(['motionControls', 'vfx']);
    });

    it('should return empty array for unknown models', () => {
      const features = getModelFeatures('unknown-model');
      expect(features).toEqual([]);
    });

    it('should return empty array for undefined model', () => {
      const features = getModelFeatures(undefined);
      expect(features).toEqual([]);
    });

    it('should return empty array for null model', () => {
      const features = getModelFeatures(null);
      expect(features).toEqual([]);
    });
  });

  describe('hasAdvancedFeatures', () => {
    it('should return true for models with advanced features', () => {
      expect(hasAdvancedFeatures('seedance-v2.0-t2v')).toBe(true);
      expect(hasAdvancedFeatures('seedance-v2.0-i2v')).toBe(true);
      expect(hasAdvancedFeatures('seedance-v2.0-extend')).toBe(true);
      expect(hasAdvancedFeatures('kling-v2.1-master-t2v')).toBe(true);
      expect(hasAdvancedFeatures('kling-v2.1-standard-t2v')).toBe(true);
      expect(hasAdvancedFeatures('kling-v2.1-pro-t2v')).toBe(true);
      expect(hasAdvancedFeatures('kling-v3.0-pro-text-to-video')).toBe(true);
      expect(hasAdvancedFeatures('kling-v3.0-standard-text-to-video')).toBe(true);
    });

    it('should return false for unknown models', () => {
      expect(hasAdvancedFeatures('unknown-model')).toBe(false);
    });

    it('should return false for undefined model', () => {
      expect(hasAdvancedFeatures(undefined)).toBe(false);
    });

    it('should return false for null model', () => {
      expect(hasAdvancedFeatures(null)).toBe(false);
    });
  });

  describe('WAN_AI_EFFECTS', () => {
    it('should contain all expected effect types', () => {
      const expectedEffects = ['cakeify', 'vhs', 'samurai', 'film-noir', 'animal', 'rotation'];
      expectedEffects.forEach(effect => {
        expect(WAN_AI_EFFECTS).toHaveProperty(effect);
      });
    });

    it('should have valid structure for each effect', () => {
      Object.values(WAN_AI_EFFECTS).forEach(effect => {
        expect(effect).toHaveProperty('name');
        expect(effect).toHaveProperty('description');
        expect(typeof effect.name).toBe('string');
        expect(typeof effect.description).toBe('string');
        expect(effect.name.length).toBeGreaterThan(0);
        expect(effect.description.length).toBeGreaterThan(0);
      });
    });

    it('should match the expected effect configurations', () => {
      expect(WAN_AI_EFFECTS.cakeify).toEqual({
        name: 'Cakeify',
        description: 'Stylized animation effect'
      });

      expect(WAN_AI_EFFECTS.vhs).toEqual({
        name: 'VHS Footage',
        description: 'Retro video tape effect'
      });

      expect(WAN_AI_EFFECTS.samurai).toEqual({
        name: 'Samurai It',
        description: 'Character animation style'
      });

      expect(WAN_AI_EFFECTS['film-noir']).toEqual({
        name: 'Film Noir',
        description: 'Cinematic black & white style'
      });

      expect(WAN_AI_EFFECTS.animal).toEqual({
        name: 'Animal Transformation',
        description: 'Animal character effects'
      });

      expect(WAN_AI_EFFECTS.rotation).toEqual({
        name: 'Rotation Effect',
        description: 'Dynamic rotation animations'
      });
    });
  });
});