import { describe, it, expect, vi } from 'vitest';
import { renderTrack, renderClip, renderPlayhead, updateTrackPositions } from '../timeline/timeline-renderer.js';

describe('Timeline Renderer', () => {
  let mockContainer;

  beforeEach(() => {
    mockContainer = {
      innerHTML: '',
      appendChild: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => [])
    };
  });

  describe('Track Rendering', () => {
    it('should render a track element', () => {
      const track = {
        id: 'video-1',
        name: 'Video Track',
        type: 'video',
        locked: false,
        muted: false,
        items: []
      };

      const trackElement = renderTrack(track);

      expect(trackElement).toBeDefined();
      expect(trackElement.className).toContain('track-row');
      expect(trackElement.querySelector('.track-name').textContent).toBe('Video Track');
    });

    it('should render track with locked state', () => {
      const track = {
        id: 'audio-1',
        name: 'Audio Track',
        type: 'audio',
        locked: true,
        muted: false,
        items: []
      };

      const trackElement = renderTrack(track);

      const lockBtn = trackElement.querySelector('.track-toggle.locked');
      expect(lockBtn).toBeDefined();
    });
  });

  describe('Clip Rendering', () => {
    it('should render a clip element', () => {
      const item = {
        id: 'clip-1',
        assetId: 'asset-1',
        type: 'video',
        start: 0,
        end: 30,
        x: 0,
        width: 500
      };

      const clipElement = renderClip(item);

      expect(clipElement).toBeDefined();
      expect(clipElement.className).toContain('clip');
      expect(clipElement.style.left).toBe('0%');
      expect(clipElement.style.width).toBe('500px');
    });

    it('should render clip with correct type styling', () => {
      const videoItem = { id: 'v1', assetId: 'a1', type: 'video', start: 0, end: 10, x: 0, width: 100 };
      const audioItem = { id: 'a1', assetId: 'a2', type: 'audio', start: 0, end: 10, x: 0, width: 100 };

      const videoClip = renderClip(videoItem);
      const audioClip = renderClip(audioItem);

      expect(videoClip.className).toContain('video');
      expect(audioClip.className).toContain('audio');
    });
  });

  describe('Playhead Rendering', () => {
    it('should render playhead at correct position', () => {
      const playheadElement = renderPlayhead(50);

      expect(playheadElement).toBeDefined();
      expect(playheadElement.className).toContain('playhead-line');
      expect(playheadElement.style.left).toBe('50%');
    });
  });

  describe('Position Updates', () => {
    it('should update track positions based on timeline data', () => {
      const tracks = [
        {
          id: 't1',
          items: [
            { id: 'i1', start: 0, end: 30, x: 0, width: 500 },
            { id: 'i2', start: 40, end: 60, x: 667, width: 333 }
          ]
        }
      ];

      const timelineWidth = 1000;
      const duration = 60;

      updateTrackPositions(tracks, timelineWidth, duration);

      expect(tracks[0].items[0].x).toBe(0);
      expect(tracks[0].items[0].width).toBe(500);
      expect(tracks[0].items[1].x).toBe(667);
      expect(tracks[0].items[1].width).toBe(333);
    });
  });
});