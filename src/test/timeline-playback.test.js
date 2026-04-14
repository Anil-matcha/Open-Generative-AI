import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPlaybackController, play, pause, stop, seek, setPlaybackRate } from '../timeline/timeline-playback.js';

describe('Timeline Playback', () => {
  let mockState;
  let mockRenderer;

  beforeEach(() => {
    mockState = {
      playing: false,
      playheadPosition: 0,
      playbackRate: 1,
      duration: 60,
      updatePlayhead: vi.fn(),
      setPlaying: vi.fn()
    };

    mockRenderer = {
      updatePlayhead: vi.fn(),
      renderPlayhead: vi.fn()
    };
  });

  describe('Playback Controller', () => {
    it('should create a playback controller', () => {
      const controller = createPlaybackController(mockState, mockRenderer);

      expect(controller).toBeDefined();
      expect(typeof controller.play).toBe('function');
      expect(typeof controller.pause).toBe('function');
      expect(typeof controller.stop).toBe('function');
    });
  });

  describe('Play Function', () => {
    it('should start playback', () => {
      play(mockState, mockRenderer);

      expect(mockState.playing).toBe(true);
      expect(mockState.setPlaying).toHaveBeenCalledWith(true);
    });

    it('should not start if already playing', () => {
      mockState.playing = true;

      play(mockState, mockRenderer);

      expect(mockState.setPlaying).not.toHaveBeenCalled();
    });
  });

  describe('Pause Function', () => {
    it('should pause playback', () => {
      mockState.playing = true;

      pause(mockState, mockRenderer);

      expect(mockState.playing).toBe(false);
      expect(mockState.setPlaying).toHaveBeenCalledWith(false);
    });

    it('should not pause if not playing', () => {
      mockState.playing = false;

      pause(mockState, mockRenderer);

      expect(mockState.setPlaying).not.toHaveBeenCalled();
    });
  });

  describe('Stop Function', () => {
    it('should stop playback and reset to start', () => {
      mockState.playing = true;
      mockState.playheadPosition = 50;

      stop(mockState, mockRenderer);

      expect(mockState.playing).toBe(false);
      expect(mockState.playheadPosition).toBe(0);
      expect(mockState.setPlaying).toHaveBeenCalledWith(false);
      expect(mockState.updatePlayhead).toHaveBeenCalledWith(0);
    });
  });

  describe('Seek Function', () => {
    it('should seek to specific position', () => {
      seek(mockState, mockRenderer, 30);

      expect(mockState.playheadPosition).toBe(30);
      expect(mockState.updatePlayhead).toHaveBeenCalledWith(30);
      expect(mockRenderer.updatePlayhead).toHaveBeenCalledWith(30);
    });

    it('should clamp seek position within bounds', () => {
      seek(mockState, mockRenderer, -10);

      expect(mockState.playheadPosition).toBe(0);

      seek(mockState, mockRenderer, 100);

      expect(mockState.playheadPosition).toBe(100);
    });
  });

  describe('Playback Rate', () => {
    it('should set playback rate', () => {
      setPlaybackRate(mockState, 2.0);

      expect(mockState.playbackRate).toBe(2.0);
    });

    it('should clamp playback rate within valid range', () => {
      setPlaybackRate(mockState, 0.1);

      expect(mockState.playbackRate).toBe(0.25); // min rate

      setPlaybackRate(mockState, 5.0);

      expect(mockState.playbackRate).toBe(4.0); // max rate
    });
  });
});