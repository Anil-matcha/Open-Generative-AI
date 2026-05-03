/**
 * Camera Image Generator - Integration Tests
 * TDD Approach: These tests define the expected integration contract and will FAIL until implementation is complete
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CameraImageGenerator from '@/apps/vimax/agents/camera_image_generator'; // Will create this
import CameraState from '@/apps/vimax/agents/camera_state_manager'; // Backend state manager

describe('CameraImageGenerator', () => {
  let generator: CameraImageGenerator;
  let cameraState: CameraState;
  const projectId = 'test-project-integration';

  beforeEach(() => {
    // Create fresh instances for each test
    cameraState = new CameraState(projectId);
    generator = new CameraImageGenerator(cameraState);
  });

  describe('Initialization', () => {
    it('accepts CameraState instance in constructor', () => {
      expect(generator).toBeInstanceOf(CameraImageGenerator);
      expect(generator.cameraState).toBe(cameraState);
    });

    it('initializes with empty trajectory set', () => {
      expect(generator.getAllCameraTrajectories().size).toBe(0);
    });

    it('throws error when CameraState is not provided', () => {
      expect(() => new CameraImageGenerator(undefined!)).toThrow();
    });
  });

  describe('CameraState Integration', () => {
    it('uses CameraState for camera positions', () => {
      const shotId = 'shot-1';
      const trajectory = {
        shotId,
        camera: {
          position: [100, 200, 300],
          rotation: [0, 45, 0],
          lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] }
        } as any,
        movement: { type: 'static', start: 0, end: 100, easing: 'linear' } as any,
        timing: { startFrame: 0, endFrame: 100, duration: 100 } as any
      };

      cameraState.addTrajectory(shotId, trajectory);
      const result = generator.getCameraParameters(shotId);

      expect(result.position).toEqual([100, 200, 300]);
    });

    it('reflects CameraState updates in real-time', () => {
      const shotId = 'shot-1';
      cameraState.addTrajectory(shotId, {
        shotId,
        camera: { position: [1, 2, 3] } as any,
        movement: { type: 'static' } as any,
        timing: { startFrame: 0, endFrame: 10, duration: 10 } as any
      });

      let params = generator.getCameraParameters(shotId);
      expect(params.position).toEqual([1, 2, 3]);

      cameraState.updateTrajectory(shotId, {
        shotId,
        camera: { position: [10, 20, 30] } as any
      });

      params = generator.getCameraParameters(shotId);
      expect(params.position).toEqual([10, 20, 30]);
    });

    it('returns null for shots not in CameraState', () => {
      expect(generator.getCameraParameters('non-existent')).toBeNull();
    });
  });

  describe('construct_camera_tree()', () => {
    it('builds valid dependency tree from CameraState', () => {
      cameraState.setDependency('master-shot', 'coverage-a');
      cameraState.setDependency('master-shot', 'coverage-b');
      cameraState.setDependency('coverage-a', 'insert-a');

      const tree = generator.construct_camera_tree();

      expect(tree.nodes).toHaveProperty('master-shot');
      expect(tree.nodes['master-shot'].children).toContain('coverage-a');
      expect(tree.nodes['master-shot'].children).toContain('coverage-b');
      expect(tree.nodes['coverage-a'].children).toContain('insert-a');
    });

    it('includes all shots in tree nodes', () => {
      cameraState.addTrajectory('shot-1', { shotId: 'shot-1', camera: {} } as any);
      cameraState.addTrajectory('shot-2', { shotId: 'shot-2', camera: {} } as any);
      cameraState.setDependency('shot-1', 'shot-2');

      const tree = generator.construct_camera_tree();

      expect(tree.nodes).toHaveProperty('shot-1');
      expect(tree.nodes).toHaveProperty('shot-2');
    });

    it('computes correct depth levels', () => {
      cameraState.setDependency('root', 'level1-a');
      cameraState.setDependency('level1-a', 'level2-a');
      cameraState.setDependency('level2-a', 'level3-a');

      const tree = generator.construct_camera_tree();

      expect(tree.nodes['root'].depth).toBe(0);
      expect(tree.nodes['level1-a'].depth).toBe(1);
      expect(tree.nodes['level2-a'].depth).toBe(2);
      expect(tree.nodes['level3-a'].depth).toBe(3);
    });

    it('handles diamond dependencies without cycles', () => {
      cameraState.setDependency('A', 'B');
      cameraState.setDependency('A', 'C');
      cameraState.setDependency('B', 'D');
      cameraState.setDependency('C', 'D');

      const tree = generator.construct_camera_tree();

      expect(tree.nodes['D'].parents).toHaveLength(2);
      expect(tree.nodes['D'].parents).toContain('B');
      expect(tree.nodes['D'].parents).toContain('C');
    });

    it('returns empty tree when no dependencies', () => {
      const tree = generator.construct_camera_tree();

      expect(tree.nodes).toEqual({});
      expect(tree.roots).toEqual([]);
    });

    it('detects root shots (shots with no parents)', () => {
      cameraState.setDependency('parent', 'child');
      cameraState.addTrajectory('orphan', { shotId: 'orphan', camera: {} } as any);

      const tree = generator.construct_camera_tree();

      expect(tree.roots).toHaveLength(2);
      expect(tree.roots).toContain('parent');
      expect(tree.roots).toContain('orphan');
    });

    it('throws error on circular dependency', () => {
      cameraState.setDependency('A', 'B');
      cameraState.setDependency('B', 'C');
      cameraState.setDependency('C', 'A'); // Creates cycle A -> B -> C -> A

      expect(() => generator.construct_camera_tree()).toThrow('Circular dependency detected');
    });

    it('handles empty dependency graph', () => {
      // Add trajectories but no dependencies
      cameraState.addTrajectory('shot-1', { shotId: 'shot-1', camera: {} } as any);
      cameraState.addTrajectory('shot-2', { shotId: 'shot-2', camera: {} } as any);

      const tree = generator.construct_camera_tree();

      expect(tree.nodes).toHaveProperty('shot-1');
      expect(tree.nodes).toHaveProperty('shot-2');
      expect(tree.roots).toHaveLength(2);
    });

    it('preserves insertion order in children array', () => {
      cameraState.setDependency('parent', 'child-b');
      cameraState.setDependency('parent', 'child-a');
      cameraState.setDependency('parent', 'child-c');

      const tree = generator.construct_camera_tree();

      expect(tree.nodes['parent'].children).toEqual(['child-b', 'child-a', 'child-c']);
    });

    it('includes dependency metadata (parent count)', () => {
      cameraState.setDependency('A', 'B');
      cameraState.setDependency('C', 'B');

      const tree = generator.construct_camera_tree();

      expect(tree.nodes['B'].parentCount).toBe(2);
    });
  });

  describe('generate_scene_with_dependencies()', () => {
    it('generates scene respecting camera ordering', () => {
      cameraState.addTrajectory('master', {
        shotId: 'master',
        camera: { position: [0, 0, 100], rotation: [0, 0, 0] } as any,
        movement: { type: 'static', start: 0, end: 100, easing: 'linear' } as any,
        timing: { startFrame: 0, endFrame: 100, duration: 100 } as any
      });
      cameraState.addTrajectory('coverage-l', {
        shotId: 'coverage-l',
        camera: { position: [-50, 0, 80], rotation: [0, -30, 0] } as any,
        movement: { type: 'static' } as any,
        timing: { startFrame: 0, endFrame: 100, duration: 100 } as any
      });

      cameraState.setDependency('master', 'coverage-l');

      const scene = generator.generate_scene_with_dependencies();

      expect(scene.shots).toHaveLength(2);
      expect(scene.shots[0].shotId).toBe('master');
      expect(scene.shots[1].shotId).toBe('coverage-l');
    });

    it('generates topological sort for complex dependency tree', () => {
      // DAG: A -> {B, C} -> D
      cameraState.addTrajectory('A', { shotId: 'A', camera: {} } as any);
      cameraState.addTrajectory('B', { shotId: 'B', camera: {} } as any);
      cameraState.addTrajectory('C', { shotId: 'C', camera: {} } as any);
      cameraState.addTrajectory('D', { shotId: 'D', camera: {} } as any);

      cameraState.setDependency('A', 'B');
      cameraState.setDependency('A', 'C');
      cameraState.setDependency('B', 'D');
      cameraState.setDependency('C', 'D');

      const scene = generator.generate_scene_with_dependencies();

      // D must come after B and C, B and C must come after A
      const order = scene.shots.map(s => s.shotId);
      const aIdx = order.indexOf('A');
      const bIdx = order.indexOf('B');
      const cIdx = order.indexOf('C');
      const dIdx = order.indexOf('D');

      expect(aIdx).toBeLessThan(bIdx);
      expect(aIdx).toBeLessThan(cIdx);
      expect(bIdx).toBeLessThan(dIdx);
      expect(cIdx).toBeLessThan(dIdx);
    });

    it('includes full trajectory data in generated scene', () => {
      const trajectory = {
        shotId: 'shot-1',
        camera: {
          position: [10, 20, 30],
          rotation: [5, 10, 15],
          lens: { focalLength: 85, aperture: 1.4, sensorSize: [45, 30] }
        } as any,
        movement: { type: 'dolly', start: 0, end: 200, easing: 'ease-out' } as any,
        timing: { startFrame: 100, endFrame: 300, duration: 200 } as any
      };

      cameraState.addTrajectory('shot-1', trajectory);

      const scene = generator.generate_scene_with_dependencies();

      expect(scene.shots[0]).toEqual(trajectory);
    });

    it('handles shots with no dependencies (independent)', () => {
      cameraState.addTrajectory('standalone-1', { shotId: 'standalone-1', camera: {} } as any);
      cameraState.addTrajectory('standalone-2', { shotId: 'standalone-2', camera: {} } as any);

      const scene = generator.generate_scene_with_dependencies();

      expect(scene.shots.map(s => s.shotId)).toContain('standalone-1');
      expect(scene.shots.map(s => s.shotId)).toContain('standalone-2');
    });

    it('orders by topological sort, then by insertion order for independent shots', () => {
      cameraState.addTrajectory('z-shot', { shotId: 'z-shot', camera: {} } as any);
      cameraState.addTrajectory('a-shot', { shotId: 'a-shot', camera: {} } as any);

      const scene = generator.generate_scene_with_dependencies();

      // Independent shots should maintain some deterministic order
      const ids = scene.shots.map(s => s.shotId);
      expect(ids).toContain('z-shot');
      expect(ids).toContain('a-shot');
    });

    it('includes dependency metadata in scene output', () => {
      cameraState.addTrajectory('parent', { shotId: 'parent', camera: {} } as any);
      cameraState.addTrajectory('child', { shotId: 'child', camera: {} } as any);
      cameraState.setDependency('parent', 'child');

      const scene = generator.generate_scene_with_dependencies();

      expect(scene.dependencies).toHaveProperty('parent');
      expect(scene.dependencies['parent']).toContain('child');
    });

    it('returns empty scene when no trajectories', () => {
      const scene = generator.generate_scene_with_dependencies();

      expect(scene.shots).toEqual([]);
      expect(scene.dependencies).toEqual({});
    });

    it('includes shot indices for quick lookup', () => {
      cameraState.addTrajectory('shot-1', { shotId: 'shot-1', camera: {} } as any);
      cameraState.addTrajectory('shot-2', { shotId: 'shot-2', camera: {} } as any);

      const scene = generator.generate_scene_with_dependencies();

      expect(scene.shotIndex['shot-1']).toBe(0);
      expect(scene.shotIndex['shot-2']).toBe(1);
    });

    it('includes parent references for each shot', () => {
      cameraState.addTrajectory('A', { shotId: 'A', camera: {} } as any);
      cameraState.addTrajectory('B', { shotId: 'B', camera: {} } as any);
      cameraState.addTrajectory('C', { shotId: 'C', camera: {} } as any);
      cameraState.setDependency('A', 'B');
      cameraState.setDependency('C', 'B');

      const scene = generator.generate_scene_with_dependencies();

      const shotB = scene.shots.find(s => s.shotId === 'B');
      expect(shotB.parents).toContain('A');
      expect(shotB.parents).toContain('C');
    });

    it('handles shots with multiple dependencies correctly', () => {
      cameraState.addTrajectory('A', { shotId: 'A', camera: {} } as any);
      cameraState.addTrajectory('B', { shotId: 'B', camera: {} } as any);
      cameraState.addTrajectory('C', { shotId: 'C', camera: {} } as any);
      cameraState.addTrajectory('D', { shotId: 'D', camera: {} } as any);

      cameraState.setDependency('A', 'B');
      cameraState.setDependency('A', 'C');
      cameraState.setDependency('B', 'D');
      cameraState.setDependency('C', 'D');

      const scene = generator.generate_scene_with_dependencies();

      const shotD = scene.shots.find(s => s.shotId === 'D');
      expect(shotD.parents).toContain('B');
      expect(shotD.parents).toContain('C');
    });

    it('preserves original trajectory objects (no mutation)', () => {
      const trajectory = { shotId: 'shot-1', camera: { position: [1, 2, 3] } } as any;
      cameraState.addTrajectory('shot-1', trajectory);

      const scene = generator.generate_scene_with_dependencies();

      // Modify returned trajectory
      scene.shots[0].camera.position[0] = 999;

      // Original should be unchanged
      expect(trajectory.camera.position[0]).toBe(1);
    });

    it('includes level information for hierarchical rendering', () => {
      cameraState.setDependency('root', 'child');

      const scene = generator.generate_scene_with_dependencies();

      const rootShot = scene.shots.find(s => s.shotId === 'root');
      expect(rootShot.level).toBe(0);

      const childShot = scene.shots.find(s => s.shotId === 'child');
      expect(childShot.level).toBe(1);
    });
  });

  describe('get_camera_parameters(shotId)', () => {
    it('returns complete camera parameters', () => {
      const trajectory = {
        shotId: 'shot-1',
        camera: {
          position: [100, 200, 300],
          rotation: [10, 20, 30],
          lens: {
            focalLength: 70,
            aperture: 2.0,
            sensorSize: [36, 24]
          }
        } as any,
        movement: {
          type: 'dolly',
          start: 50,
          end: 250,
          easing: 'ease-in-out'
        } as any,
        timing: {
          startFrame: 1000,
          endFrame: 1200,
          duration: 200
        } as any
      };

      cameraState.addTrajectory('shot-1', trajectory);

      const params = generator.get_camera_parameters('shot-1');

      expect(params).toEqual({
        position: [100, 200, 300],
        rotation: [10, 20, 30],
        lens: {
          focalLength: 70,
          aperture: 2.0,
          sensorSize: [36, 24]
        },
        movement: {
          type: 'dolly',
          start: 50,
          end: 250,
          easing: 'ease-in-out'
        },
        timing: {
          startFrame: 1000,
          endFrame: 1200,
          duration: 200
        }
      });
    });

    it('returns null for missing trajectory', () => {
      expect(generator.get_camera_parameters('missing')).toBeNull();
    });

    it('includes default values for optional fields', () => {
      const minimalTrajectory = {
        shotId: 'minimal',
        camera: { position: [0, 0, 0] } as any
      } as any;

      cameraState.addTrajectory('minimal', minimalTrajectory);

      const params = generator.get_camera_parameters('minimal');

      expect(params.position).toEqual([0, 0, 0]);
      expect(params.rotation).toEqual([0, 0, 0]);
      expect(params.lens).toEqual({
        focalLength: 50,
        aperture: 2.8,
        sensorSize: [36, 24]
      });
      expect(params.movement).toEqual({
        type: 'static',
        start: 0,
        end: 0,
        easing: 'linear'
      });
      expect(params.timing).toEqual({
        startFrame: 0,
        endFrame: 0,
        duration: 0
      });
    });

    it('performs no mutation on return value', () => {
      const trajectory = {
        shotId: 'shot-1',
        camera: { position: [1, 2, 3], rotation: [0, 0, 0] } as any,
        lens: { focalLength: 50, aperture: 2.8, sensorSize: [36, 24] }
      } as any;

      cameraState.addTrajectory('shot-1', trajectory);

      const params = generator.get_camera_parameters('shot-1');
      params.position[0] = 999;

      const after = generator.get_camera_parameters('shot-1');
      expect(after.position[0]).toBe(1);
    });

    it('handles trajectory with only shotId', () => {
      const trajectory = { shotId: 'shot-1' } as any;
      cameraState.addTrajectory('shot-1', trajectory);

      const params = generator.get_camera_parameters('shot-1');

      expect(params).toBeDefined();
      expect(params.position).toEqual([0, 0, 0]);
      expect(params.rotation).toEqual([0, 0, 0]);
    });
  });

  describe('getAllCameraTrajectories()', () => {
    it('returns all trajectories from CameraState', () => {
      cameraState.addTrajectory('shot-1', { shotId: 'shot-1', camera: {} } as any);
      cameraState.addTrajectory('shot-2', { shotId: 'shot-2', camera: {} } as any);
      cameraState.addTrajectory('shot-3', { shotId: 'shot-3', camera: {} } as any);

      const all = generator.getAllCameraTrajectories();

      expect(all.size).toBe(3);
      expect(all.has('shot-1')).toBe(true);
      expect(all.has('shot-2')).toBe(true);
      expect(all.has('shot-3')).toBe(true);
    });

    it('returns empty map when no trajectories', () => {
      const all = generator.getAllCameraTrajectories();
      expect(all.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('throws clear error when construct_camera_tree encounters cycle', () => {
      cameraState.setDependency('A', 'B');
      cameraState.setDependency('B', 'C');
      cameraState.setDependency('C', 'A'); // Cycle!

      expect(() => generator.construct_camera_tree()).toThrow('Circular dependency detected');
    });

    it('handles malformed trajectory gracefully', () => {
      // CameraState should validate
      cameraState.addTrajectory('bad-shot', {
        shotId: 'bad-shot',
        camera: { position: [null, undefined, NaN] } // Invalid values
      } as any);

      const params = generator.get_camera_parameters('bad-shot');
      expect(params).toBeTruthy();
    });

    it('handles dependency on non-existent shot', () => {
      cameraState.setDependency('existing', 'non-existent');

      const tree = generator.construct_camera_tree();

      // Should still create node for 'existing', 'non-existent' may or may not appear
      expect(tree.nodes).toHaveProperty('existing');
    });
  });

  describe('Performance', () => {
    it('handles large number of trajectories', () => {
      const numShots = 1000;
      for (let i = 0; i < numShots; i++) {
        cameraState.addTrajectory(`shot-${i}`, {
          shotId: `shot-${i}`,
          camera: { position: [i, i * 2, i * 3] } as any
        } as any);
      }

      const all = generator.getAllCameraTrajectories();
      expect(all.size).toBe(numShots);
    });

    it('builds dependency tree efficiently', () => {
      // Linear chain: 1 -> 2 -> 3 -> ... -> 100
      for (let i = 1; i <= 100; i++) {
        cameraState.addTrajectory(`shot-${i}`, { shotId: `shot-${i}`, camera: {} } as any);
        if (i > 1) {
          cameraState.setDependency(`shot-${i - 1}`, `shot-${i}`);
        }
      }

      const tree = generator.construct_camera_tree();
      expect(Object.keys(tree.nodes)).toHaveLength(100);
    });
  });

  describe('Serialization Integration', () => {
    it('preserves trajectories through toJSON/fromJSON', () => {
      const trajectory = {
        shotId: 'shot-1',
        camera: { position: [1, 2, 3], rotation: [4, 5, 6] } as any,
        movement: { type: 'pan' } as any,
        timing: { startFrame: 0, endFrame: 100, duration: 100 } as any
      };

      cameraState.addTrajectory('shot-1', trajectory);
      cameraState.setDependency('shot-1', 'shot-2');

      const json = generator.toJSON();
      const restored = CameraImageGenerator.fromJSON(json);

      expect(restored.getCameraParameters('shot-1').position).toEqual([1, 2, 3]);
    });

    it('includes CameraState data in serialization', () => {
      cameraState.addTrajectory('shot-1', { shotId: 'shot-1', camera: {} } as any);

      const json = generator.toJSON();

      expect(json.cameraState).toBeDefined();
      expect(json.cameraState.trajectories).toHaveProperty('shot-1');
    });

    it('hydrates from complete JSON', () => {
      const saved = {
        cameraState: {
          projectId: 'test-project-integration',
          trajectories: {
            'shot-1': { shotId: 'shot-1', camera: { position: [7, 8, 9] } } as any
          },
          dependencyGraph: {}
        }
      };

      const restored = CameraImageGenerator.fromJSON(saved);

      expect(restored.getCameraParameters('shot-1').position).toEqual([7, 8, 9]);
    });
  });

  describe('Edge Cases', () => {
    it('handles shot IDs with special characters', () => {
      const specialId = 'shot-with-dashes_underscores.123';
      cameraState.addTrajectory(specialId, { shotId: specialId, camera: {} } as any);

      const params = generator.get_camera_parameters(specialId);
      expect(params).toBeTruthy();
    });

    it('handles empty string shotId', () => {
      expect(() => {
        cameraState.addTrajectory('', { shotId: '', camera: {} } as any);
      }).toThrow();
    });

    it('manages memory for many trajectories', () => {
      const trajectories: any[] = [];
      for (let i = 0; i < 500; i++) {
        cameraState.addTrajectory(`shot-${i}`, {
          shotId: `shot-${i}`,
          camera: { position: [i, i, i] } as any
        } as any);
      }

      const scene = generator.generate_scene_with_dependencies();
      expect(scene.shots).toHaveLength(500);
    });

    it('handles shots with identical camera parameters', () => {
      const params = { position: [0, 0, 0], rotation: [0, 0, 0] } as any;
      cameraState.addTrajectory('shot-1', { ...params, shotId: 'shot-1', camera: params } as any);
      cameraState.addTrajectory('shot-2', { ...params, shotId: 'shot-2', camera: params } as any);

      const result1 = generator.get_camera_parameters('shot-1');
      const result2 = generator.get_camera_parameters('shot-2');

      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2); // Different objects
    });
  });
});

// Helper types for documentation
/**
 * @typedef {Object} Scene
 * @property {Array<CameraTrajectory>} shots - Ordered list of shots
 * @property {Object<string, string[]>} dependencies - shotId -> [childShotIds]
 * @property {Object<string, number>} shotIndex - shotId -> index in shots array
 *
 * @typedef {Object} CameraTree
 * @property {Object<string, TreeNode>} nodes - shotId -> TreeNode
 * @property {string[]} roots - Shot IDs with no parents
 *
 * @typedef {Object} TreeNode
 * @property {string} id - Shot ID
 * @property {string[]} children - Child shot IDs
 * @property {string[]} parents - Parent shot IDs
 * @property {number} depth - Depth in tree (root = 0)
 */
