import { describe, it, expect, vi } from 'vitest';
import { bindTrackEvents, bindClipEvents, bindTimelineEvents, handleClipDrag, handlePlayheadDrag } from '../timeline/timeline-events.js';

describe('Timeline Events', () => {
  let mockElement;
  let mockState;
  let mockRenderer;

  beforeEach(() => {
    mockElement = {
      addEventListener: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      getBoundingClientRect: vi.fn(() => ({ left: 0, width: 1000 }))
    };

    mockState = {
      playheadPosition: 0,
      selectedItemId: null,
      tracks: [],
      updatePlayhead: vi.fn(),
      selectItem: vi.fn()
    };

    mockRenderer = {
      updateTrackPositions: vi.fn(),
      renderTracks: vi.fn()
    };
  });

  describe('Track Events', () => {
    it('should bind mute toggle events', () => {
      const track = { id: 't1', muted: false };
      bindTrackEvents(mockElement, track, mockState, mockRenderer);

      expect(mockElement.addEventListener).toHaveBeenCalled();
    });
  });

  describe('Clip Events', () => {
    it('should bind click events to clips', () => {
      const item = { id: 'i1', x: 0, width: 100 };
      const clipElement = { addEventListener: vi.fn() };

      bindClipEvents(clipElement, item, mockState, mockRenderer);

      expect(clipElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should handle clip selection on click', () => {
      const item = { id: 'i1', x: 0, width: 100 };
      const clipElement = { addEventListener: vi.fn() };

      bindClipEvents(clipElement, item, mockState, mockRenderer);

      const clickHandler = clipElement.addEventListener.mock.calls.find(call => call[0] === 'click')[1];
      const mockEvent = { stopPropagation: vi.fn() };

      clickHandler(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockState.selectItem).toHaveBeenCalledWith('i1');
    });
  });

  describe('Timeline Events', () => {
    it('should bind timeline click events', () => {
      bindTimelineEvents(mockElement, mockState);

      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should update playhead on timeline click', () => {
      bindTimelineEvents(mockElement, mockState);

      const clickHandler = mockElement.addEventListener.mock.calls.find(call => call[0] === 'click')[1];
      const mockEvent = {
        clientX: 500,
        target: mockElement
      };

      clickHandler(mockEvent);

      expect(mockState.updatePlayhead).toHaveBeenCalledWith(50); // 500px / 1000px * 100 = 50%
    });
  });

  describe('Clip Drag Handling', () => {
    it('should handle clip drag start', () => {
      const item = { id: 'i1', x: 0, width: 100 };
      const mockEvent = { clientX: 100 };

      const dragData = handleClipDrag(item, 'start', mockEvent);

      expect(dragData).toBeDefined();
      expect(dragData.startX).toBe(100);
      expect(dragData.originalX).toBe(0);
    });

    it('should handle clip drag move', () => {
      const item = { id: 'i1', x: 0, width: 100 };
      const dragData = { startX: 100, originalX: 0 };
      const mockEvent = { clientX: 150 };

      const result = handleClipDrag(item, 'move', mockEvent, dragData);

      expect(result.newX).toBe(50);
    });
  });

  describe('Playhead Drag Handling', () => {
    it('should handle playhead drag move', () => {
      const mockEvent = { clientX: 300 };
      const timelineWidth = 1000;

      const newPosition = handlePlayheadDrag(mockEvent, timelineWidth);

      expect(newPosition).toBe(30); // 300 / 1000 * 100 = 30%
    });
  });
});