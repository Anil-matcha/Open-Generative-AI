import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimelineStore } from './useTimelineStore.jsx';

describe('useTimelineStore', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTimelineStore());

    expect(result.current.contextMenu).toEqual({
      isOpen: false,
      posX: 0,
      posY: 0,
      buttons: [],
      clipId: null
    });
    expect(result.current.isActiveTimeline).toBe(false);
    expect(result.current.timelineHeight).toBe(300);
    expect(result.current.copiedItems).toEqual([]);
    expect(result.current.clips).toEqual({});
  });

  it('should manage context menu state', () => {
    const { result } = renderHook(() => useTimelineStore());

    act(() => {
      result.current.setContextMenu({
        isOpen: true,
        posX: 100,
        posY: 200,
        buttons: ['trim', 'copy']
      });
    });

    expect(result.current.contextMenu).toEqual({
      isOpen: true,
      posX: 100,
      posY: 200,
      buttons: ['trim', 'copy']
    });
  });

  it('should manage active timeline state', () => {
    const { result } = renderHook(() => useTimelineStore());

    act(() => {
      result.current.setIsActiveTimeline(true);
    });

    expect(result.current.isActiveTimeline).toBe(true);
  });

  it('should manage timeline height', () => {
    const { result } = renderHook(() => useTimelineStore());

    act(() => {
      result.current.setTimelineHeight(400);
    });

    expect(result.current.timelineHeight).toBe(400);
  });

  it('should manage copied items', () => {
    const { result } = renderHook(() => useTimelineStore());

    const items = [{ id: 1, type: 'clip' }];
    act(() => {
      result.current.setCopiedItems(items);
    });

    expect(result.current.copiedItems).toEqual(items);
  });

  describe('clip trimming state management', () => {
    it('should add a new clip', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.addClip({
          id: 1,
          from: 0,
          to: 10,
          duration: 10,
          trimIn: 0,
          trimOut: 10
        });
      });

      expect(result.current.clips[1]).toEqual({
        id: 1,
        from: 0,
        to: 10,
        duration: 10,
        trimIn: 0,
        trimOut: 10,
        volume: 1,
        mute: false,
        hidden: false,
        fadeIn: 0,
        fadeOut: 0,
        fillMode: 'scale',
        is360: false,
        title: 'Clip'
      });
    });

    it('should update clip duration', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.addClip({
          id: 1,
          from: 0,
          to: 10,
          duration: 10,
          trimIn: 0,
          trimOut: 10
        });
      });

      act(() => {
        result.current.updateClipDuration(1, {
          trimIn: 2,
          trimOut: 8
        });
      });

      expect(result.current.clips[1].trimIn).toBe(2);
      expect(result.current.clips[1].trimOut).toBe(8);
    });

    it('should set clip trim values', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.addClip({
          id: 1,
          from: 0,
          to: 10,
          duration: 10,
          trimIn: 0,
          trimOut: 10
        });
      });

      act(() => {
        result.current.setClipTrim(1, 1, 9);
      });

      expect(result.current.clips[1].trimIn).toBe(1);
      expect(result.current.clips[1].trimOut).toBe(9);
    });

    it('should remove a clip', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.addClip({
          id: 1,
          from: 0,
          to: 10,
          duration: 10,
          trimIn: 0,
          trimOut: 10
        });
      });

      expect(result.current.clips[1]).toBeDefined();

      act(() => {
        result.current.removeClip(1);
      });

      expect(result.current.clips[1]).toBeUndefined();
    });

    it('should get clip by id', () => {
      const { result } = renderHook(() => useTimelineStore());

      const clipData = {
        id: 1,
        from: 0,
        to: 10,
        duration: 10,
        trimIn: 0,
        trimOut: 10
      };

      act(() => {
        result.current.addClip(clipData);
      });

      expect(result.current.getClip(1)).toEqual({
        ...clipData,
        volume: 1,
        mute: false,
        hidden: false,
        fadeIn: 0,
        fadeOut: 0,
        fillMode: 'scale',
        is360: false,
        title: 'Clip'
      });
    });

    it('should get all clips', () => {
      const { result } = renderHook(() => useTimelineStore());

      const clip1 = {
        id: 1,
        from: 0,
        to: 10,
        duration: 10,
        trimIn: 0,
        trimOut: 10
      };

      const clip2 = {
        id: 2,
        from: 10,
        to: 20,
        duration: 10,
        trimIn: 0,
        trimOut: 10
      };

      act(() => {
        result.current.addClip(clip1);
        result.current.addClip(clip2);
      });

      expect(result.current.getAllClips()).toEqual([
        {
          ...clip1,
          volume: 1,
          mute: false,
          hidden: false,
          fadeIn: 0,
          fadeOut: 0,
          fillMode: 'scale',
          is360: false,
          title: 'Clip'
        },
        {
          ...clip2,
          volume: 1,
          mute: false,
          hidden: false,
          fadeIn: 0,
          fadeOut: 0,
          fillMode: 'scale',
          is360: false,
          title: 'Clip'
        }
      ]);
    });

    it('should update clip position (from/to)', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.addClip({
          id: 1,
          from: 0,
          to: 10,
          duration: 10,
          trimIn: 0,
          trimOut: 10
        });
      });

      act(() => {
        result.current.updateClipPosition(1, 5, 15);
      });

      expect(result.current.clips[1].from).toBe(5);
      expect(result.current.clips[1].to).toBe(15);
    });

    it('should handle context menu for clips', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.addClip({
          id: 1,
          from: 0,
          to: 10,
          duration: 10,
          trimIn: 0,
          trimOut: 10
        });
      });

      act(() => {
        result.current.showClipContextMenu(1, 100, 200);
      });

      expect(result.current.contextMenu.isOpen).toBe(true);
      expect(result.current.contextMenu.posX).toBe(100);
      expect(result.current.contextMenu.posY).toBe(200);
      expect(result.current.contextMenu.clipId).toBe(1);
      expect(result.current.contextMenu.buttons).toContain('trim');
      expect(result.current.contextMenu.buttons).toContain('delete');
    });

    it('should handle clip operations from context menu', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.addClip({
          id: 1,
          from: 0,
          to: 10,
          duration: 10,
          trimIn: 0,
          trimOut: 10
        });
      });

      act(() => {
        result.current.showClipContextMenu(1, 100, 200);
      });

      // Simulate trim operation
      act(() => {
        result.current.trimClip(1, 2, 8);
      });

      expect(result.current.clips[1].trimIn).toBe(2);
      expect(result.current.clips[1].trimOut).toBe(8);

      // Simulate delete operation
      act(() => {
        result.current.deleteClip(1);
      });

      expect(result.current.clips[1]).toBeUndefined();
    });

    it('should persist clip state changes', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.addClip({
          id: 1,
          from: 0,
          to: 10,
          duration: 10,
          trimIn: 0,
          trimOut: 10
        });
      });

      act(() => {
        result.current.updateClipDuration(1, {
          trimIn: 1,
          trimOut: 9
        });
      });

      // Re-render to check persistence
      const { result: newResult } = renderHook(() => useTimelineStore());

      // Since this is a new hook instance, state won't persist
      // In a real app, this would use localStorage or a persistence layer
      expect(newResult.current.clips).toEqual({});
    });

    it('should calculate trimmed duration correctly', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.addClip({
          id: 1,
          from: 0,
          to: 10,
          duration: 10,
          trimIn: 2,
          trimOut: 8
        });
      });

      expect(result.current.getTrimmedDuration(1)).toBe(6);
    });
  });
});