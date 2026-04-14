import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimelineEngine } from '../../../src/lib/timeline/TimelineEngine.js';
import { mockTimelineData } from '../../fixtures/index.js';

describe('Timeline Engine', () => {
  let timelineEngine;

  beforeEach(() => {
    timelineEngine = new TimelineEngine();
  });

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      expect(timelineEngine.getTracks()).toEqual([]);
      expect(timelineEngine.getDuration()).toBe(0);
      expect(timelineEngine.getPlayhead()).toBe(0);
    });

    it('should initialize with provided data', () => {
      timelineEngine.loadProject(mockTimelineData);
      expect(timelineEngine.getTracks()).toHaveLength(1);
      expect(timelineEngine.getDuration()).toBe(10);
    });
  });

  describe('Track Management', () => {
    it('should add a new track', () => {
      const trackId = timelineEngine.addTrack('Video Track', 'video');
      expect(trackId).toBeDefined();
      expect(timelineEngine.getTracks()).toHaveLength(1);
    });

    it('should remove a track', () => {
      const trackId = timelineEngine.addTrack('Video Track', 'video');
      timelineEngine.removeTrack(trackId);
      expect(timelineEngine.getTracks()).toHaveLength(0);
    });

    it('should not remove non-existent track', () => {
      timelineEngine.addTrack('Video Track', 'video');
      timelineEngine.removeTrack('non-existent');
      expect(timelineEngine.getTracks()).toHaveLength(1);
    });
  });

  describe('Clip Management', () => {
    let trackId;

    beforeEach(() => {
      trackId = timelineEngine.addTrack('Video Track', 'video');
    });

    it('should add a clip to track', () => {
      const clipId = timelineEngine.addClip(trackId, {
        startTime: 0,
        endTime: 5,
        mediaId: 'media123',
        name: 'Test Clip'
      });

      expect(clipId).toBeDefined();
      const track = timelineEngine.getTrack(trackId);
      expect(track.clips).toHaveLength(1);
    });

    it('should remove a clip from track', () => {
      const clipId = timelineEngine.addClip(trackId, {
        startTime: 0,
        endTime: 5,
        mediaId: 'media123',
        name: 'Test Clip'
      });

      timelineEngine.removeClip(trackId, clipId);
      const track = timelineEngine.getTrack(trackId);
      expect(track.clips).toHaveLength(0);
    });

    it('should move a clip', () => {
      const clipId = timelineEngine.addClip(trackId, {
        startTime: 0,
        endTime: 5,
        mediaId: 'media123',
        name: 'Test Clip'
      });

      timelineEngine.moveClip(trackId, clipId, 2);

      const track = timelineEngine.getTrack(trackId);
      const clip = track.clips.find(c => c.id === clipId);
      expect(clip.startTime).toBe(2);
      expect(clip.endTime).toBe(7);
    });

    it('should resize a clip', () => {
      const clipId = timelineEngine.addClip(trackId, {
        startTime: 0,
        endTime: 5,
        mediaId: 'media123',
        name: 'Test Clip'
      });

      timelineEngine.resizeClip(trackId, clipId, 0, 8);

      const track = timelineEngine.getTrack(trackId);
      const clip = track.clips.find(c => c.id === clipId);
      expect(clip.endTime).toBe(8);
    });
  });

  describe('Playback Control', () => {
    it('should set playhead position', () => {
      timelineEngine.setPlayhead(5);
      expect(timelineEngine.getPlayhead()).toBe(5);
    });

    it('should play timeline', () => {
      const onTimeUpdate = vi.fn();
      timelineEngine.on('timeupdate', onTimeUpdate);

      timelineEngine.play();
      expect(timelineEngine.isPlaying()).toBe(true);
    });

    it('should pause timeline', () => {
      timelineEngine.play();
      timelineEngine.pause();
      expect(timelineEngine.isPlaying()).toBe(false);
    });

    it('should stop timeline', () => {
      timelineEngine.play();
      timelineEngine.stop();
      expect(timelineEngine.isPlaying()).toBe(false);
      expect(timelineEngine.getPlayhead()).toBe(0);
    });
  });

  describe('State Management', () => {
    it('should save state snapshot', () => {
      timelineEngine.addTrack('Video Track', 'video');
      const snapshot = timelineEngine.saveSnapshot();
      expect(snapshot.tracks).toHaveLength(1);
    });

    it('should restore from snapshot', () => {
      timelineEngine.restoreSnapshot(mockTimelineData);
      expect(timelineEngine.getTracks()).toHaveLength(1);
      expect(timelineEngine.getDuration()).toBe(10);
    });

  it('should undo last action', () => {
    timelineEngine.saveSnapshot(); // Save initial state
    expect(timelineEngine.getTracks()).toHaveLength(0);
    timelineEngine.addTrack('Video Track', 'video');
    expect(timelineEngine.getTracks()).toHaveLength(1);
    const result = timelineEngine.undo();
    expect(result).toBe(true);
    expect(timelineEngine.getTracks()).toHaveLength(0);
  });

  it('should have undo stack after saveSnapshot', () => {
    expect(timelineEngine.undoStack).toBeDefined();
    timelineEngine.saveSnapshot();
    expect(timelineEngine.undoStack.length).toBe(1);
  });

    it('should redo last undone action', () => {
      timelineEngine.addTrack('Video Track', 'video');
      timelineEngine.undo();
      timelineEngine.redo();
      expect(timelineEngine.getTracks()).toHaveLength(1);
    });
  });

  describe('Media Processing', () => {
    it('should handle media loading', async () => {
      const mockMediaLoader = vi.fn().mockResolvedValue({
        duration: 10,
        width: 1920,
        height: 1080
      });

      timelineEngine.setMediaLoader(mockMediaLoader);

      await expect(timelineEngine.loadMedia('media123')).resolves.toEqual({
        duration: 10,
        width: 1920,
        height: 1080
      });
    });

    it('should handle media loading errors', async () => {
      const mockMediaLoader = vi.fn().mockRejectedValue(new Error('Load failed'));
      timelineEngine.setMediaLoader(mockMediaLoader);

      await expect(timelineEngine.loadMedia('media123')).rejects.toThrow('Load failed');
    });
  });
});