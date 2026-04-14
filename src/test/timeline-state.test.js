import { describe, it, expect } from 'vitest';
import { createProject, createTrack, createItem, validateProject, validateTrack, validateItem } from '../timeline/timeline-state.js';

describe('Timeline State - Data Model', () => {
  describe('Project Entity', () => {
    it('should create a valid project with required fields', () => {
      const project = createProject({
        id: 'test-project',
        fps: 30,
        duration: 60,
        aspectRatio: '16:9'
      });

      expect(project).toEqual({
        id: 'test-project',
        fps: 30,
        duration: 60,
        aspectRatio: '16:9',
        tracks: [],
        assets: [],
        markers: [],
        captions: [],
        effects: []
      });
    });

    it('should validate a correct project structure', () => {
      const project = {
        id: 'test-project',
        fps: 30,
        duration: 60,
        aspectRatio: '16:9',
        tracks: [],
        assets: [],
        markers: [],
        captions: [],
        effects: []
      };

      expect(validateProject(project)).toBe(true);
    });

    it('should reject invalid project - missing required fields', () => {
      const invalidProject = {
        id: 'test-project',
        tracks: []
      };

      expect(() => validateProject(invalidProject)).toThrow();
    });
  });

  describe('Track Entity', () => {
    it('should create a valid track with required fields', () => {
      const track = createTrack({
        id: 'test-track',
        type: 'video',
        name: 'Video Track'
      });

      expect(track).toEqual({
        id: 'test-track',
        type: 'video',
        name: 'Video Track',
        locked: false,
        muted: false,
        items: []
      });
    });

    it('should validate correct track types', () => {
      const validTypes = ['video', 'audio', 'text', 'captions', 'effects'];

      validTypes.forEach(type => {
        const track = { id: 'test', type, name: 'Test', locked: false, muted: false, items: [] };
        expect(validateTrack(track)).toBe(true);
      });
    });

    it('should reject invalid track type', () => {
      const invalidTrack = { id: 'test', type: 'invalid', name: 'Test', locked: false, muted: false, items: [] };
      expect(() => validateTrack(invalidTrack)).toThrow();
    });
  });

  describe('Item Entity', () => {
    it('should create a valid item with required fields', () => {
      const item = createItem({
        id: 'test-item',
        assetId: 'asset-1',
        type: 'video',
        start: 0,
        end: 30
      });

      expect(item).toEqual({
        id: 'test-item',
        assetId: 'asset-1',
        type: 'video',
        start: 0,
        end: 30,
        sourceStart: 0,
        sourceEnd: 30,
        lane: 0,
        x: 0,
        width: 100,
        trimIn: 0,
        trimOut: 0,
        volume: 1,
        playbackRate: 1,
        effects: []
      });
    });

    it('should validate item timing constraints', () => {
      const item = {
        id: 'test',
        assetId: 'asset-1',
        type: 'video',
        start: 10,
        end: 5, // end before start
        sourceStart: 0,
        sourceEnd: 30,
        lane: 0,
        x: 0,
        width: 100,
        trimIn: 0,
        trimOut: 0,
        volume: 1,
        playbackRate: 1,
        effects: []
      };

      expect(() => validateItem(item)).toThrow();
    });
  });
});