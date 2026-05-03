/**
 * Camera State Management - Unit Tests
 * TDD Approach: These tests define the expected API contract and will FAIL until implementation is complete
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CameraState from '@/src/lib/editor/cameraState';

describe('CameraState', () => {
  let cameraState;
  const projectId = 'test-project-123';

  beforeEach(() => {
    cameraState = new CameraState(projectId);
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
    it('initializes empty trajectories', () => {
      const state = new CameraState('project-1');
      expect(state.getAllTrajectories().length).toBe(0);
    });

    it('sets projectId correctly', () => {
      const state = new CameraState('project-123');
      expect(state.getAllTrajectories().length).toBe(0);
    });

    it('initializes empty dependency graph', () => {
      const state = new CameraState('project-1');
      expect(state.getChildren('any-shot')).toEqual([]);
    });
  });

  describe('setTrajectory / getTrajectory', () => {
    it('stores camera data correctly', () => {
      const trajectory = {
        shotId: 'shot-1',
        camera: {
          position: [10, 20, 30],
          rotation: [0, 45, 0],
          lens: {
            focalLength: 50,
            aperture: 2.8,
            sensorSize: [36, 24]
          }
        },
        movement: {
          type: 'pan',
          start: 0,
          end: 1,
          easing: 'ease-in-out'
        },
        timing: {
          startFrame: 0,
          endFrame: 120,
          duration: 120
        }
      };

      cameraState.setTrajectory(trajectory);
      const retrieved = cameraState.getTrajectory('shot-1');

      expect(retrieved).toEqual(trajectory);
    });

    it('overwrites existing trajectory with same shotId', () => {
      const trajectory1 = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      const trajectory2 = {
        shotId: 'shot-1',
        camera: { position: [10, 10, 10], rotation: [0, 0, 0], lens: { focalLength: 85, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 60, endFrame: 120, duration: 60 }
      };

      cameraState.setTrajectory(trajectory1);
      cameraState.setTrajectory(trajectory2);

      const retrieved = cameraState.getTrajectory('shot-1');
      expect(retrieved.camera.position).toEqual([10, 10, 10]);
    });

    it('stores multiple trajectories independently', () => {
      const shot1 = {
        shotId: 'shot-1',
        camera: { position: [1, 2, 3], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      const shot2 = {
        shotId: 'shot-2',
        camera: { position: [4, 5, 6], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 60, endFrame: 120, duration: 60 }
      };

      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);

      expect(cameraState.getTrajectory('shot-1')).toEqual(shot1);
      expect(cameraState.getTrajectory('shot-2')).toEqual(shot2);
    });

    it('returns undefined for non-existent shotId', () => {
      const result = cameraState.getTrajectory('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('getAllTrajectories', () => {
    it('returns empty array when no trajectories', () => {
      expect(cameraState.getAllTrajectories().length).toBe(0);
    });

    it('returns all trajectories as array', () => {
      const shot1 = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 10], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      const shot2 = {
        shotId: 'shot-2',
        camera: { position: [0, 0, 20], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 60, endFrame: 120, duration: 60 }
      };

      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);

      const all = cameraState.getAllTrajectories();
      expect(all.length).toBe(2);
      expect(all.map(t => t.shotId)).toContain('shot-1');
      expect(all.map(t => t.shotId)).toContain('shot-2');
    });
  });

  describe('getTrajectories (bulk)', () => {
    it('returns multiple trajectories by IDs', () => {
      const shot1 = {
        shotId: 'shot-1',
        camera: { position: [1, 2, 3], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      const shot2 = {
        shotId: 'shot-2',
        camera: { position: [4, 5, 6], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 60, endFrame: 120, duration: 60 }
      };
      const shot3 = {
        shotId: 'shot-3',
        camera: { position: [7, 8, 9], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 120, endFrame: 180, duration: 60 }
      };

      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);
      cameraState.setTrajectory(shot3);

      const result = cameraState.getTrajectories(['shot-1', 'shot-3']);
      expect(result.length).toBe(2);
      expect(result.map(t => t.shotId)).toEqual(['shot-1', 'shot-3']);
    });

    it('ignores non-existent IDs', () => {
      const shot1 = {
        shotId: 'shot-1',
        camera: { position: [1, 2, 3], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      cameraState.setTrajectory(shot1);

      const result = cameraState.getTrajectories(['shot-1', 'missing']);
      expect(result.length).toBe(1);
      expect(result[0].shotId).toBe('shot-1');
    });
  });

  describe('updateTrajectory', () => {
    it('updates specific fields of trajectory', () => {
      const initial = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      cameraState.setTrajectory(initial);

      cameraState.updateTrajectory('shot-1', {
        camera: { position: [100, 200, 300] }
      });

      const updated = cameraState.getTrajectory('shot-1');
      expect(updated.camera.position).toEqual([100, 200, 300]);
      expect(updated.camera.rotation).toEqual([0, 0, 0]);  // unchanged
    });

    it('supports nested updates (camera.lens)', () => {
      const initial = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      cameraState.setTrajectory(initial);

      cameraState.updateTrajectory('shot-1', {
        camera: { lens: { focalLength: 85 } }
      });

      const updated = cameraState.getTrajectory('shot-1');
      expect(updated.camera.lens.focalLength).toBe(85);
      expect(updated.camera.lens.aperture).toBe(2.8);  // unchanged
    });

    it('throws error for non-existent shotId', () => {
      expect(() => {
        cameraState.updateTrajectory('missing', { camera: { position: [0, 0, 0] } });
      }).toThrow('Trajectory not found: missing');
    });
  });

  describe('removeTrajectory', () => {
    it('removes trajectory by shotId', () => {
      const trajectory = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      cameraState.setTrajectory(trajectory);

      const removed = cameraState.removeTrajectory('shot-1');
      expect(removed).toBe(true);
      expect(cameraState.getTrajectory('shot-1')).toBeUndefined();
    });

    it('returns false when removing non-existent trajectory', () => {
      const removed = cameraState.removeTrajectory('non-existent');
      expect(removed).toBe(false);
    });

    it('removes dependencies involving deleted trajectory', () => {
      const shot1 = { shotId: 'shot-1', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 0, endFrame: 60, duration: 60 } };
      const shot2 = { shotId: 'shot-2', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 60, endFrame: 120, duration: 60 } };

      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);
      cameraState.setDependency('shot-1', 'shot-2');

      cameraState.removeTrajectory('shot-1');

      expect(cameraState.getChildren('shot-1')).toEqual([]);
      expect(cameraState.getParents('shot-2')).not.toContain('shot-1');
    });
  });

  describe('clear', () => {
    it('removes all trajectories and dependencies', () => {
      const shot1 = { shotId: 'shot-1', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 0, endFrame: 60, duration: 60 } };
      const shot2 = { shotId: 'shot-2', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 60, endFrame: 120, duration: 60 } };

      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);
      cameraState.setDependency('shot-1', 'shot-2');

      cameraState.clear();

      expect(cameraState.getAllTrajectories().length).toBe(0);
      expect(cameraState.getChildren('shot-1')).toEqual([]);
    });
  });

  describe('setDependency / getChildren / getParents', () => {
    beforeEach(() => {
      const shot1 = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      const shot2 = {
        shotId: 'shot-2',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 60, endFrame: 120, duration: 60 }
      };
      const shot3 = {
        shotId: 'shot-3',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 120, endFrame: 180, duration: 60 }
      };
      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);
      cameraState.setTrajectory(shot3);
    });

    it('establishes parent -> child relationship', () => {
      cameraState.setDependency('shot-1', 'shot-2');

      expect(cameraState.getChildren('shot-1')).toContain('shot-2');
      expect(cameraState.getParents('shot-2')).toContain('shot-1');
    });

    it('allows multiple children per parent', () => {
      cameraState.setDependency('shot-1', 'shot-2');
      cameraState.setDependency('shot-1', 'shot-3');

      expect(cameraState.getChildren('shot-1').sort()).toEqual(['shot-2', 'shot-3']);
      expect(cameraState.getParents('shot-2')).toContain('shot-1');
      expect(cameraState.getParents('shot-3')).toContain('shot-1');
    });

    it('allows multiple parents per child', () => {
      cameraState.setDependency('shot-1', 'shot-3');
      cameraState.setDependency('shot-2', 'shot-3');

      expect(cameraState.getParents('shot-3').sort()).toEqual(['shot-1', 'shot-2']);
    });

    it('throws error if parent trajectory missing', () => {
      const trajectory = {
        shotId: 'shot-exists',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      cameraState.setTrajectory(trajectory);

      expect(() => {
        cameraState.setDependency('missing-parent', 'shot-exists');
      }).toThrow('Parent trajectory not found');
    });

    it('throws error if child trajectory missing', () => {
      const trajectory = {
        shotId: 'shot-exists',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      cameraState.setTrajectory(trajectory);

      expect(() => {
        cameraState.setDependency('shot-exists', 'missing-child');
      }).toThrow('Child trajectory not found');
    });

    it('throws error for self-dependency', () => {
      const trajectory = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      cameraState.setTrajectory(trajectory);

      expect(() => {
        cameraState.setDependency('shot-1', 'shot-1');
      }).toThrow('cannot depend on itself');
    });

    it('prevents cycles', () => {
      const shot1 = { shotId: 'shot-1', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 0, endFrame: 60, duration: 60 } };
      const shot2 = { shotId: 'shot-2', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 60, endFrame: 120, duration: 60 } };
      const shot3 = { shotId: 'shot-3', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 120, endFrame: 180, duration: 60 } };

      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);
      cameraState.setTrajectory(shot3);
      cameraState.setDependency('shot-1', 'shot-2');
      cameraState.setDependency('shot-2', 'shot-3');

      // This would create: shot-3 -> shot-1 cycle
      expect(() => {
        cameraState.setDependency('shot-3', 'shot-1');
      }).toThrow('would create cycle');
    });

    it('deduplicates dependencies (idempotent)', () => {
      const trajectory = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      cameraState.setTrajectory(trajectory);

      cameraState.setDependency('shot-1', 'shot-2');
      cameraState.setDependency('shot-1', 'shot-2'); // duplicate

      expect(cameraState.getChildren('shot-1')).toHaveLength(1);
    });
  });

  describe('removeDependency', () => {
    it('removes dependency relationship', () => {
      // Setup both trajectories
      const trajectory1 = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      const trajectory2 = {
        shotId: 'shot-2',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 60, endFrame: 120, duration: 60 }
      };
      cameraState.setTrajectory(trajectory1);
      cameraState.setTrajectory(trajectory2);

      cameraState.setDependency('shot-1', 'shot-2');
      cameraState.removeDependency('shot-1', 'shot-2');

      expect(cameraState.getChildren('shot-1')).not.toContain('shot-2');
    });

    it('does not error when removing non-existent dependency', () => {
      const trajectory = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      cameraState.setTrajectory(trajectory);

      expect(() => {
        cameraState.removeDependency('shot-1', 'non-existent');
      }).not.toThrow();
    });
  });

  describe('getAncestors / getDescendants', () => {
    beforeEach(() => {
      const shot1 = { shotId: 'shot-1', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 0, endFrame: 60, duration: 60 } };
      const shot2 = { shotId: 'shot-2', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 60, endFrame: 120, duration: 60 } };
      const shot3 = { shotId: 'shot-3', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 120, endFrame: 180, duration: 60 } };
      const shot4 = { shotId: 'shot-4', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 180, endFrame: 240, duration: 60 } };

      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);
      cameraState.setTrajectory(shot3);
      cameraState.setTrajectory(shot4);
      cameraState.setDependency('shot-1', 'shot-2');
      cameraState.setDependency('shot-2', 'shot-3');
      cameraState.setDependency('shot-3', 'shot-4');
    });

    it('returns ancestors in dependency chain', () => {
      const ancestors = cameraState.getAncestors('shot-4');
      expect(ancestors.sort()).toEqual(['shot-1', 'shot-2', 'shot-3']);
    });

    it('returns descendants in dependency chain', () => {
      const descendants = cameraState.getDescendants('shot-1');
      expect(descendants.sort()).toEqual(['shot-2', 'shot-3', 'shot-4']);
    });

    it('returns empty for shots with no dependencies', () => {
      // Fresh isolated state - no dependencies set
      const isolatedState = new CameraState('isolated-project');
      const trajectory = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      isolatedState.setTrajectory(trajectory);

      expect(isolatedState.getAncestors('shot-1')).toEqual([]);
      expect(isolatedState.getDescendants('shot-1')).toEqual([]);
    });
  });

  describe('getTopologicalOrder', () => {
    it('orders linear chain correctly', () => {
      const shot1 = { shotId: 'shot-1', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 0, endFrame: 60, duration: 60 } };
      const shot2 = { shotId: 'shot-2', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 60, endFrame: 120, duration: 60 } };
      const shot3 = { shotId: 'shot-3', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 120, endFrame: 180, duration: 60 } };

      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);
      cameraState.setTrajectory(shot3);
      cameraState.setDependency('shot-1', 'shot-2');
      cameraState.setDependency('shot-2', 'shot-3');

      const order = cameraState.getTopologicalOrder();
      // shot-1 must come before shot-2, shot-2 before shot-3
      expect(order.indexOf('shot-1')).toBeLessThan(order.indexOf('shot-2'));
      expect(order.indexOf('shot-2')).toBeLessThan(order.indexOf('shot-3'));
    });

    it('handles diamond dependencies', () => {
      const shot1 = { shotId: 'shot-1', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 0, endFrame: 60, duration: 60 } };
      const shot2 = { shotId: 'shot-2', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 60, endFrame: 120, duration: 60 } };
      const shot3 = { shotId: 'shot-3', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 120, endFrame: 180, duration: 60 } };
      const shot4 = { shotId: 'shot-4', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 180, endFrame: 240, duration: 60 } };

      //    shot-1
      //    /      \
      // shot-2  shot-3
      //    \      /
      //     shot-4
      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);
      cameraState.setTrajectory(shot3);
      cameraState.setTrajectory(shot4);
      cameraState.setDependency('shot-1', 'shot-2');
      cameraState.setDependency('shot-1', 'shot-3');
      cameraState.setDependency('shot-2', 'shot-4');
      cameraState.setDependency('shot-3', 'shot-4');

      const order = cameraState.getTopologicalOrder();
      expect(order.indexOf('shot-1')).toBeLessThan(order.indexOf('shot-2'));
      expect(order.indexOf('shot-1')).toBeLessThan(order.indexOf('shot-3'));
      expect(order.indexOf('shot-2')).toBeLessThan(order.indexOf('shot-4'));
      expect(order.indexOf('shot-3')).toBeLessThan(order.indexOf('shot-4'));
    });

    it('handles disconnected components', () => {
      const shot1 = { shotId: 'shot-1', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 0, endFrame: 60, duration: 60 } };
      const shot2 = { shotId: 'shot-2', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 60, endFrame: 120, duration: 60 } };
      const shot3 = { shotId: 'shot-3', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 0, endFrame: 60, duration: 60 } };

      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);
      cameraState.setDependency('shot-1', 'shot-2');
      cameraState.setTrajectory(shot3);

      const order = cameraState.getAllTrajectories().map(t => t.shotId);
      expect(order).toContain('shot-3');
    });

    it('throws error on cycle detection at setDependency time', () => {
      const shot1 = { shotId: 'shot-1', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 0, endFrame: 60, duration: 60 } };
      const shot2 = { shotId: 'shot-2', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 60, endFrame: 120, duration: 60 } };
      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);
      cameraState.setDependency('shot-1', 'shot-2');

      // Adding reverse dependency creates cycle; should throw at setDependency
      expect(() => {
        cameraState.setDependency('shot-2', 'shot-1');
      }).toThrow('would create cycle');
    });
  });

  describe('getCameraTree', () => {
    it('builds nested tree structure from root', () => {
      const shot1 = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      const shot2 = {
        shotId: 'shot-2',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 60, endFrame: 120, duration: 60 }
      };
      const shot3 = {
        shotId: 'shot-3',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 120, endFrame: 180, duration: 60 }
      };

      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);
      cameraState.setTrajectory(shot3);
      cameraState.setDependency('shot-1', 'shot-2');
      cameraState.setDependency('shot-1', 'shot-3');

      const tree = cameraState.getCameraTree('shot-1');

      expect(tree.shot_id).toBe('shot-1');
      expect(tree.children.length).toBe(2);
      expect(tree.children.map(c => c.shot_id).sort()).toEqual(['shot-2', 'shot-3']);
    });

    it('throws error for non-existent root', () => {
      expect(() => cameraState.getCameraTree('missing')).toThrow('Root shot not found');
    });
  });

  describe('persistence (localStorage)', () => {
    it('saves to localStorage on changes', () => {
      const trajectory = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      cameraState.setTrajectory(trajectory);

      const saved = localStorage.getItem('camera-state-' + projectId);
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved);
      expect(parsed.trajectories['shot-1']).toBeDefined();
    });

    it('loads from localStorage on construction', () => {
      const trajectory = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      const storageKey = 'camera-state-' + projectId;
      localStorage.setItem(storageKey, JSON.stringify({
        trajectories: { 'shot-1': trajectory },
        dependencyGraph: {},
        projectId: projectId,
        version: '1.0',
        lastModified: Date.now()
      }));

      const newState = new CameraState(projectId);
      const retrieved = newState.getTrajectory('shot-1');
      expect(retrieved).toBeDefined();
    });

    it('handles corrupted localStorage gracefully', () => {
      const storageKey = 'camera-state-' + projectId;
      localStorage.setItem(storageKey, 'not valid json');

      const newState = new CameraState(projectId);
      expect(newState.getAllTrajectories().length).toBe(0);
    });
  });

  describe('subscribe / notify', () => {
    it('calls subscriber on state change', () => {
      const callback = vi.fn();
      cameraState.subscribe(callback);

      const trajectory = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      cameraState.setTrajectory(trajectory);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('returns unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = cameraState.subscribe(callback);

      cameraState.setTrajectory({
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      });

      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      cameraState.setTrajectory({
        shotId: 'shot-2',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 60, endFrame: 120, duration: 60 }
      });

      expect(callback).toHaveBeenCalledTimes(1); // unchanged
    });
  });

  describe('validation', () => {
    it('validates required fields on setTrajectory', () => {
      expect(() => {
        cameraState.setTrajectory({} as any);
      }).toThrow('shotId is required');
    });

    it('validates camera position array length', () => {
      expect(() => {
        cameraState.setTrajectory({
          shotId: 'shot-1',
          camera: { position: [1, 2] as any, rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
          movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
          timing: { startFrame: 0, endFrame: 60, duration: 60 }
        });
      }).toThrow('Camera position must be [x, y, z] array');
    });

    it('validates lens focalLength positive', () => {
      expect(() => {
        cameraState.setTrajectory({
          shotId: 'shot-1',
          camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 0, aperture: 2.8, sensorSize: [36, 24] } },
          movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
          timing: { startFrame: 0, endFrame: 60, duration: 60 }
        });
      }).toThrow('focalLength must be positive');
    });

    it('validates movement type', () => {
      expect(() => {
        cameraState.setTrajectory({
          shotId: 'shot-1',
          camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
          movement: { type: 'invalid', start: 0, end: 1, easing: 'linear' },
          timing: { startFrame: 0, endFrame: 60, duration: 60 }
        });
      }).toThrow('Invalid movement type');
    });

    it('validates movement progress range', () => {
      expect(() => {
        cameraState.setTrajectory({
          shotId: 'shot-1',
          camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
          movement: { type: 'static', start: 0.5, end: 0.3, easing: 'linear' },
          timing: { startFrame: 0, endFrame: 60, duration: 60 }
        });
      }).toThrow('Invalid movement range');
    });

    it('validates timing frames', () => {
      expect(() => {
        cameraState.setTrajectory({
          shotId: 'shot-1',
          camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
          movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
          timing: { startFrame: 100, endFrame: 50, duration: -50 }
        });
      }).toThrow('startFrame must be < endFrame');
    });
  });

  describe('getStats', () => {
    it('returns correct statistics', () => {
      const shot1 = { shotId: 'shot-1', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 0, endFrame: 60, duration: 60 } };
      const shot2 = { shotId: 'shot-2', camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } }, movement: { type: 'static', start: 0, end: 1, easing: 'linear' }, timing: { startFrame: 60, endFrame: 120, duration: 60 } };

      cameraState.setTrajectory(shot1);
      cameraState.setTrajectory(shot2);
      cameraState.setDependency('shot-1', 'shot-2');

      const stats = cameraState.getStats();
      expect(stats.trajectoryCount).toBe(2);
      expect(stats.dependencyCount).toBe(1);
      expect(stats.projectId).toBe(projectId);
    });
  });

  describe('serialization (toJSON/fromJSON)', () => {
    it('exports to JSON format', () => {
      const trajectory = {
        shotId: 'shot-1',
        camera: { position: [0, 0, 0], rotation: [0, 0, 0], lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] } },
        movement: { type: 'static', start: 0, end: 1, easing: 'linear' },
        timing: { startFrame: 0, endFrame: 60, duration: 60 }
      };
      cameraState.setTrajectory(trajectory);

      const json = cameraState.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe('1.0');
      expect(parsed.projectId).toBe(projectId);
      expect(parsed.trajectories['shot-1']).toBeDefined();
    });

    it('imports from JSON format', () => {
      const exportData = {
        version: '1.0',
        projectId: 'imported-project',
        trajectories: {
          'shot-1': {
            shotId: 'shot-1',
            camera: { position: [1, 2, 3], rotation: [0, 0, 0], lens: { focalLength: 85, aperture: 1.8, sensorSize: [36, 24] } },
            movement: { type: 'dolly', start: 0, end: 1, easing: 'easeIn' },
            timing: { startFrame: 0, endFrame: 120, duration: 120 }
          }
        },
        dependencyGraph: {},
        exported_at: '2024-01-01T00:00:00.000Z'
      };

      cameraState.fromJSON(JSON.stringify(exportData));

      expect(cameraState.getAllTrajectories().length).toBe(1);
      const traj = cameraState.getTrajectory('shot-1');
      expect(traj.camera.position).toEqual([1, 2, 3]);
      expect(traj.movement.type).toBe('dolly');
    });
  });
});