/**
 * Timeline State Management - Unit Tests
 * TDD: Tests define expected TimelineState API contract
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimelineState } from '@/src/lib/editor/TimelineState';

describe('TimelineState', () => {
  let state;

  beforeEach(() => {
    // Mock localStorage
    const storage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    it('initializes with default empty project', () => {
      const state = new TimelineState();
      expect(state.getProject()).toEqual({
        id: null,
        fps: 30,
        duration: 60,
        tracks: [],
        name: 'Untitled Project'
      });
    });

    it('accepts custom project configuration', () => {
      const project = {
        id: 'proj-123',
        fps: 24,
        duration: 120,
        tracks: [],
        name: 'My Project'
      };
      const state = new TimelineState(project);
      expect(state.getProject().id).toBe('proj-123');
      expect(state.getProject().fps).toBe(24);
    });

    it('initializes UI state with correct defaults', () => {
      const state = new TimelineState();
      expect(state.getZoom()).toBe(1.0);
      expect(state.getPan()).toBe(0);
      expect(state.getPlayheadPercent()).toBe(0);
      expect(state.getSelectedTool()).toBe('Select');
      expect(state.isTimelineOpen()).toBe(true);
    });

    it('sets up empty trajectoryCamera map', () => {
      const state = new TimelineState();
      expect(state.getTrajectoryCamera()).toEqual(new Map());
    });
  });

  describe('subscribe / unsubscribe', () => {
    it('allows subscribing to state changes', () => {
      const state = new TimelineState();
      const callback = vi.fn();
      state.subscribe(callback);
      state.setZoom(2.0);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('returns unsubscribe function', () => {
      const state = new TimelineState();
      const callback = vi.fn();
      const unsubscribe = state.subscribe(callback);

      state.setZoom(1.5);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      state.setZoom(2.0);
      expect(callback).toHaveBeenCalledTimes(1); // No additional call
    });

    it('supports multiple subscribers', () => {
      const state = new TimelineState();
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      state.subscribe(cb1);
      state.subscribe(cb2);

      state.setPan(100);
      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

    it('subscribers receive new state on each change', () => {
      const state = new TimelineState();
      const callback = vi.fn();
      state.subscribe(callback);

      state.setZoom(1.2);
      state.setZoom(1.5);
      state.setZoom(2.0);

      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('project setters/getters', () => {
    it('updates project properties via setters', () => {
      const state = new TimelineState();
      state.setFps(24);
      state.setDuration(180);
      state.setName('Test Project');

      const project = state.getProject();
      expect(project.fps).toBe(24);
      expect(project.duration).toBe(180);
      expect(project.name).toBe('Test Project');
    });

    it('tracks modifications notify subscribers', () => {
      const state = new TimelineState();
      const callback = vi.fn();
      state.subscribe(callback);

      state.setFps(25);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        project: expect.objectContaining({ fps: 25 })
      }));
    });
  });

  describe('zoom/pan/playhead', () => {
    it('sets and gets zoom level', () => {
      const state = new TimelineState();
      state.setZoom(2.5);
      expect(state.getZoom()).toBe(2.5);
    });

    it('clamps zoom to valid range (0.1 - 10)', () => {
      const state = new TimelineState();
      state.setZoom(0.01);
      expect(state.getZoom()).toBe(0.1);
      state.setZoom(100);
      expect(state.getZoom()).toBe(10);
    });

    it('sets and gets pan offset', () => {
      const state = new TimelineState();
      state.setPan(500);
      expect(state.getPan()).toBe(500);
    });

    it('sets and gets playhead position', () => {
      const state = new TimelineState();
      state.setPlayheadPercent(0.5);
      expect(state.getPlayheadPercent()).toBe(0.5);
    });

    it('clamps playhead to 0-1 range', () => {
      const state = new TimelineState();
      state.setPlayheadPercent(-0.1);
      expect(state.getPlayheadPercent()).toBe(0);
      state.setPlayheadPercent(1.5);
      expect(state.getPlayheadPercent()).toBe(1);
    });
  });

  describe('tool selection', () => {
    it('sets and gets selected tool', () => {
      const state = new TimelineState();
      state.setSelectedTool('Cut');
      expect(state.getSelectedTool()).toBe('Cut');
    });

    it('default tool is Select', () => {
      const state = new TimelineState();
      expect(state.getSelectedTool()).toBe('Select');
    });
  });

  describe('timeline visibility', () => {
    it('toggles timeline open/closed', () => {
      const state = new TimelineState();
      expect(state.isTimelineOpen()).toBe(true);

      state.setTimelineOpen(false);
      expect(state.isTimelineOpen()).toBe(false);

      state.setTimelineOpen(true);
      expect(state.isTimelineOpen()).toBe(true);
    });
  });

  describe('track operations', () => {
    it('adds track to project', () => {
      const state = new TimelineState();
      const track = { id: 'track-1', type: 'video', name: 'Video 1', clips: [] };
      state.addTrack(track);

      const project = state.getProject();
      expect(project.tracks).toHaveLength(1);
      expect(project.tracks[0].id).toBe('track-1');
    });

    it('removes track by id', () => {
      const state = new TimelineState();
      state.addTrack({ id: 'track-1', type: 'video', name: 'Video 1', clips: [] });
      state.addTrack({ id: 'track-2', type: 'audio', name: 'Audio 1', clips: [] });

      state.removeTrack('track-1');
      const project = state.getProject();
      expect(project.tracks).toHaveLength(1);
      expect(project.tracks[0].id).toBe('track-2');
    });

    it('reorders tracks', () => {
      const state = new TimelineState();
      state.addTrack({ id: 'track-1', type: 'video', name: 'Video 1', clips: [] });
      state.addTrack({ id: 'track-2', type: 'audio', name: 'Audio 1', clips: [] });
      state.addTrack({ id: 'track-3', type: 'video', name: 'Video 2', clips: [] });

      state.reorderTracks(['track-3', 'track-1', 'track-2']);
      const project = state.getProject();
      expect(project.tracks.map(t => t.id)).toEqual(['track-3', 'track-1', 'track-2']);
    });

    it('updates track properties', () => {
      const state = new TimelineState();
      state.addTrack({ id: 'track-1', type: 'video', name: 'Video 1', clips: [] });

      state.updateTrack('track-1', { name: 'Updated Video', visible: false });
      const track = state.getProject().tracks[0];
      expect(track.name).toBe('Updated Video');
      expect(track.visible).toBe(false);
    });

    it('throws error when removing non-existent track', () => {
      const state = new TimelineState();
      expect(() => state.removeTrack('missing')).toThrow('Track not found');
    });

    it('throws error when updating non-existent track', () => {
      const state = new TimelineState();
      expect(() => state.updateTrack('missing', { name: 'x' })).toThrow('Track not found');
    });
  });

  describe('clip operations', () => {
    beforeEach(() => {
      const state = new TimelineState();
      state.addTrack({ id: 'track-1', type: 'video', name: 'Video 1', clips: [] });
    });

    it('adds clip to track', () => {
      const state = new TimelineState();
      state.addTrack({ id: 'track-1', type: 'video', name: 'Video 1', clips: [] });

      const clip = {
        id: 'clip-1',
        start: 0,
        end: 100,
        trackId: 'track-1',
        type: 'video',
        name: 'Clip 1'
      };
      state.addClip(clip);

      const track = state.getProject().tracks[0];
      expect(track.clips).toHaveLength(1);
      expect(track.clips[0].id).toBe('clip-1');
    });

    it('removes clip from track', () => {
      const state = new TimelineState();
      state.addTrack({ id: 'track-1', type: 'video', name: 'Video 1', clips: [] });
      state.addClip({ id: 'clip-1', start: 0, end: 100, trackId: 'track-1', type: 'video' });

      state.removeClip('clip-1');
      const track = state.getProject().tracks[0];
      expect(track.clips).toHaveLength(0);
    });

    it('updates clip properties', () => {
      const state = new TimelineState();
      state.addTrack({ id: 'track-1', type: 'video', name: 'Video 1', clips: [] });
      state.addClip({ id: 'clip-1', start: 0, end: 100, trackId: 'track-1', type: 'video' });

      state.updateClip('clip-1', { start: 50, end: 150 });
      const clip = state.getProject().tracks[0].clips[0];
      expect(clip.start).toBe(50);
      expect(clip.end).toBe(150);
    });

    it('moves clip to different track', () => {
      const state = new TimelineState();
      state.addTrack({ id: 'track-1', type: 'video', name: 'Video 1', clips: [] });
      state.addTrack({ id: 'track-2', type: 'video', name: 'Video 2', clips: [] });
      state.addClip({ id: 'clip-1', start: 0, end: 100, trackId: 'track-1', type: 'video' });

      state.moveClipToTrack('clip-1', 'track-2');
      const track1 = state.getProject().tracks[0];
      const track2 = state.getProject().tracks[1];
      expect(track1.clips).toHaveLength(0);
      expect(track2.clips).toHaveLength(1);
      expect(track2.clips[0].trackId).toBe('track-2');
    });

    it('validates clip timing (start < end)', () => {
      const state = new TimelineState();
      state.addTrack({ id: 'track-1', type: 'video', name: 'Video 1', clips: [] });

      expect(() => {
        state.addClip({ id: 'clip-1', start: 100, end: 50, trackId: 'track-1', type: 'video' });
      }).toThrow('Invalid clip timing: start must be < end');
    });
  });

  describe('clip selection', () => {
    beforeEach(() => {
      const state = new TimelineState();
      state.addTrack({ id: 'track-1', type: 'video', name: 'Video 1', clips: [] });
      state.addClip({ id: 'clip-1', start: 0, end: 100, trackId: 'track-1', type: 'video' });
      state.addClip({ id: 'clip-2', start: 150, end: 250, trackId: 'track-1', type: 'video' });
    });

    it('selects clip', () => {
      const state = new TimelineState();
      state.selectClip('clip-1');
      expect(state.getSelectedClips()).toEqual(['clip-1']);
    });

    it('adds to selection with additive mode', () => {
      const state = new TimelineState();
      state.selectClip('clip-1', false);
      state.selectClip('clip-2', true);
      expect(state.getSelectedClips().sort()).toEqual(['clip-1', 'clip-2']);
    });

    it('clears selection when not additive', () => {
      const state = new TimelineState();
      state.selectClip('clip-1');
      state.selectClip('clip-2', false);
      expect(state.getSelectedClips()).toEqual(['clip-2']);
    });

    it('deselects clip', () => {
      const state = new TimelineState();
      state.selectClip('clip-1');
      state.deselectClip('clip-1');
      expect(state.getSelectedClips()).toEqual([]);
    });

    it('clears all selections', () => {
      const state = new TimelineState();
      state.selectClip('clip-1');
      state.selectClip('clip-2', true);
      state.clearSelection();
      expect(state.getSelectedClips()).toEqual([]);
    });
  });

  describe('camera state integration', () => {
    it('sets and gets trajectory camera for shot', () => {
      const state = new TimelineState();
      const trajectory = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 10], rotation: [0, 0, 0] },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      state.setTrajectoryCamera(trajectory);
      expect(state.getTrajectoryCamera('shot-1')).toEqual(trajectory);
    });

    it('removes trajectory camera', () => {
      const state = new TimelineState();
      state.setTrajectoryCamera({ shotId: 'shot-1', camera: {}, movement: {}, timing: {} });
      state.removeTrajectoryCamera('shot-1');
      expect(state.getTrajectoryCamera('shot-1')).toBeUndefined();
    });

    it('sets camera dependency between shots', () => {
      const state = new TimelineState();
      state.setTrajectoryCamera({ shotId: 'shot-1', camera: {}, movement: {}, timing: {} });
      state.setTrajectoryCamera({ shotId: 'shot-2', camera: {}, movement: {}, timing: {} });
      state.setCameraDependency('shot-1', 'shot-2');
      expect(state.getCameraChildren('shot-1')).toContain('shot-2');
      expect(state.getCameraParents('shot-2')).toContain('shot-1');
    });

    it('calculates topological order for shot rendering', () => {
      const state = new TimelineState();
      state.setTrajectoryCamera({ shotId: 'shot-1', camera: {}, movement: {}, timing: {} });
      state.setTrajectoryCamera({ shotId: 'shot-2', camera: {}, movement: {}, timing: {} });
      state.setTrajectoryCamera({ shotId: 'shot-3', camera: {}, movement: {}, timing: {} });
      state.setCameraDependency('shot-1', 'shot-2');
      state.setCameraDependency('shot-2', 'shot-3');

      const order = state.getCameraTopologicalOrder();
      expect(order.indexOf('shot-1')).toBeLessThan(order.indexOf('shot-2'));
      expect(order.indexOf('shot-2')).toBeLessThan(order.indexOf('shot-3'));
    });
  });

  describe('undo/redo stack', () => {
    it('pushes state to undo stack on changes', () => {
      const state = new TimelineState();
      state.setZoom(1.5);
      state.setZoom(2.0);

      const undoStack = state.getUndoStack();
      expect(undoStack.length).toBeGreaterThan(0);
    });

    it('undo reverts to previous state', () => {
      const state = new TimelineState();
      state.setZoom(1.0);
      state.setZoom(2.0);
      state.setZoom(3.0);

      state.undo();
      expect(state.getZoom()).toBe(2.0);
    });

    it('redo re-applies undone state', () => {
      const state = new TimelineState();
      state.setZoom(1.0);
      state.setZoom(2.0);
      state.undo();
      state.undo();
      state.redo();
      expect(state.getZoom()).toBe(2.0);
    });

    it('clears redo stack after new action', () => {
      const state = new TimelineState();
      state.setZoom(1.5);
      state.setZoom(2.0);
      state.undo();
      state.setZoom(3.0); // New action

      expect(state.canRedo()).toBe(false);
    });
  });

  describe('snapshot management', () => {
    it('creates named snapshot', () => {
      const state = new TimelineState();
      state.createSnapshot('before-edit');

      expect(state.listSnapshots()).toContain('before-edit');
    });

    it('restores from snapshot', () => {
      const state = new TimelineState();
      state.setZoom(2.0);
      state.createSnapshot('test');

      state.setZoom(3.0);
      state.restoreSnapshot('test');
      expect(state.getZoom()).toBe(2.0);
    });

    it('deletes snapshot', () => {
      const state = new TimelineState();
      state.createSnapshot('temp');
      state.deleteSnapshot('temp');
      expect(state.listSnapshots()).not.toContain('temp');
    });
  });

  describe('persistence (localStorage)', () => {
    it('saves project to localStorage on change', () => {
      const state = new TimelineState({ id: 'proj-1', name: 'Test' });
      state.setZoom(2.0);

      const saved = localStorage.getItem('timeline-state-proj-1');
      expect(saved).not.toBeNull();
      const data = JSON.parse(saved);
      expect(data.zoom).toBe(2.0);
    });

    it('loads from localStorage on construction', () => {
      const savedData = {
        project: { id: 'proj-1', name: 'Loaded', fps: 24, duration: 60, tracks: [] },
        zoom: 1.5,
        pan: 100,
        playheadPercent: 0.25,
        selectedTool: 'Cut',
        isTimelineOpen: true,
        snapEnabled: true,
        autoScrollEnabled: true
      };
      localStorage.setItem('timeline-state-proj-1', JSON.stringify(savedData));

      const state = new TimelineState({ id: 'proj-1' });
      expect(state.getZoom()).toBe(1.5);
      expect(state.getPan()).toBe(100);
      expect(state.getPlayheadPercent()).toBe(0.25);
      expect(state.getSelectedTool()).toBe('Cut');
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('timeline-state-corrupt', 'not valid json');

      const state = new TimelineState({ id: 'corrupt' });
      // Should fall back to defaults, not throw
      expect(state.getZoom()).toBe(1.0);
    });

    it('persists trajectoryCamera map', () => {
      const state = new TimelineState({ id: 'proj-1' });
      state.setTrajectoryCamera({
        shotId: 'shot-1',
        camera: { position: [0, 0, 10] },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      });

      const saved = JSON.parse(localStorage.getItem('timeline-state-proj-1'));
      expect(saved.trajectoryCamera['shot-1']).toBeDefined();
    });
  });

  describe('getState / setState (full state update)', () => {
    it('returns complete state snapshot', () => {
      const state = new TimelineState({ id: 'proj-1', name: 'Test' });
      state.setZoom(2.0);
      state.selectClip('clip-1');

      const snapshot = state.getState();
      expect(snapshot.zoom).toBe(2.0);
      expect(snapshot.selectedClips).toContain('clip-1');
      expect(snapshot.project.id).toBe('proj-1');
    });

    it('can restore from full state snapshot', () => {
      const state = new TimelineState();
      const snapshot = {
        project: { id: 'proj-1', name: 'Restored', fps: 30, duration: 60, tracks: [] },
        zoom: 1.5,
        pan: 200,
        playheadPercent: 0.3,
        selectedTool: 'Select',
        isTimelineOpen: false,
        selectedClips: ['clip-a'],
        snapEnabled: true,
        autoScrollEnabled: false,
        trajectoryCamera: new Map([['shot-1', { shotId: 'shot-1', camera: {}, movement: {}, timing: {} }]])
      };
      state.setState(snapshot);

      expect(state.getZoom()).toBe(1.5);
      expect(state.getSelectedTool()).toBe('Select');
      expect(state.isTimelineOpen()).toBe(false);
      expect(state.getSelectedClips()).toEqual(['clip-a']);
    });
  });

  describe('settings', () => {
    it('gets and sets snapEnabled', () => {
      const state = new TimelineState();
      expect(state.isSnapEnabled()).toBe(true);
      state.setSnapEnabled(false);
      expect(state.isSnapEnabled()).toBe(false);
    });

    it('gets and sets autoScrollEnabled', () => {
      const state = new TimelineState();
      expect(state.isAutoScrollEnabled()).toBe(true);
      state.setAutoScrollEnabled(false);
      expect(state.isAutoScrollEnabled()).toBe(false);
    });

    it('gets and sets timelineHeight', () => {
      const state = new TimelineState();
      state.setTimelineHeight(400);
      expect(state.getTimelineHeight()).toBe(400);
    });

    it('gets and sets showRuler', () => {
      const state = new TimelineState();
      expect(state.isRulerVisible()).toBe(true);
      state.setShowRuler(false);
      expect(state.isRulerVisible()).toBe(false);
    });
  });

  describe('selected range', () => {
    it('sets and gets selected range', () => {
      const state = new TimelineState();
      state.setSelectedRange({ start: 100, end: 200 });

      const range = state.getSelectedRange();
      expect(range).toEqual({ start: 100, end: 200 });
    });

    it('clears selected range', () => {
      const state = new TimelineState();
      state.setSelectedRange({ start: 100, end: 200 });
      state.clearSelectedRange();
      expect(state.getSelectedRange()).toBeNull();
    });
  });

  describe('batch updates', () => {
    it('batchUpdate groups changes into single notification', () => {
      const state = new TimelineState();
      const callback = vi.fn();
      state.subscribe(callback);

      state.batchUpdate((s) => {
        s.setZoom(1.5);
        s.setPan(100);
        s.setPlayheadPercent(0.5);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('batchUpdate provides state to callback', () => {
      const state = new TimelineState();
      let receivedState;
      state.subscribe((s) => { receivedState = s; });

      state.batchUpdate((s) => {
        s.setZoom(2.0);
        expect(s.getZoom()).toBe(2.0); // Changes visible immediately in batch
      });

      expect(receivedState.zoom).toBe(2.0);
    });
  });

  describe('reset state', () => {
    it('resets to default empty project', () => {
      const state = new TimelineState({ id: 'proj-1', name: 'Test', fps: 24 });
      state.setZoom(2.0);
      state.addTrack({ id: 'track-1', type: 'video', name: 'Video', clips: [] });

      state.reset();

      expect(state.getProject().id).toBe(null);
      expect(state.getZoom()).toBe(1.0);
      expect(state.getProject().tracks).toEqual([]);
    });
  });

  describe('state export / import', () => {
    it('exports complete state as serializable object', () => {
      const state = new TimelineState({ id: 'proj-1', name: 'Export Test' });
      state.setZoom(2.0);
      state.setTrajectoryCamera({
        shotId: 'shot-1',
        camera: { position: [0, 0, 10] },
        movement: { type: 'pan', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      });

      const exported = state.exportState();
      expect(exported.project.id).toBe('proj-1');
      expect(exported.zoom).toBe(2.0);
      expect(exported.trajectoryCamera['shot-1']).toBeDefined();
    });

    it('imports state and replaces current', () => {
      const state = new TimelineState();
      const importData = {
        project: { id: 'imported', name: 'Imported Project', fps: 24, duration: 90, tracks: [] },
        zoom: 1.8,
        pan: 50,
        playheadPercent: 0.3,
        selectedTool: 'Cut',
        isTimelineOpen: false,
        snapEnabled: false,
        autoScrollEnabled: false,
        selectedClips: ['clip-1'],
        trajectoryCamera: {}
      };
      state.importState(importData);

      expect(state.getProject().id).toBe('imported');
      expect(state.getFps()).toBe(24);
      expect(state.getZoom()).toBe(1.8);
      expect(state.getSelectedTool()).toBe('Cut');
      expect(state.isSnapEnabled()).toBe(false);
    });
  });

  describe('getStats', () => {
    it('returns statistics about current timeline', () => {
      const state = new TimelineState();
      state.addTrack({ id: 'track-1', type: 'video', name: 'Video 1', clips: [] });
      state.addTrack({ id: 'track-2', type: 'audio', name: 'Audio 1', clips: [] });
      state.addClip({ id: 'clip-1', start: 0, end: 100, trackId: 'track-1', type: 'video' });

      const stats = state.getStats();
      expect(stats.trackCount).toBe(2);
      expect(stats.clipCount).toBe(1);
      expect(stats.selectedClipCount).toBe(0);
    });
  });
});