/**
 * CameraTrajectory State Management
 *
 * Manages camera trajectories for shots in video projects.
 * Stores position, rotation, lens settings, movement, and timing.
 * Maintains dependency graph for multi-camera scenes.
 */

/**
 * @typedef {Object} CameraTrajectory
 * @property {string} shotId
 * @property {Object} camera
 * @property {number[]} camera.position - [x, y, z] world coordinates
 * @property {number[]} camera.rotation - [pitch, yaw, roll] in radians
 * @property {Object} camera.lens
 * @property {number} camera.lens.focalLength - mm
 * @property {number} camera.lens.aperture - f-stop
 * @property {number[]} camera.lens.sensorSize - [width, height] mm
 * @property {Object} movement
 * @property {'static'|'pan'|'tilt'|'dolly'|'zoom'|'crane'} movement.type
 * @property {number} movement.start - 0-1 progress at start
 * @property {number} movement.end - 0-1 progress at end
 * @property {string} movement.easing - 'linear', 'easeIn', 'easeOut', 'easeInOut'
 * @property {number[][]} [movement.path] - Optional bezier control points
 * @property {Object} timing
 * @property {number} timing.startFrame
 * @property {number} timing.endFrame
 * @property {number} timing.duration - in frames
 */

/**
 * @typedef {Object} CameraState
 * @property {Map<string, CameraTrajectory>} trajectories
 * @property {Map<string, string[]>} dependencyGraph - shotId -> [childShotIds]
 * @property {string|null} projectId
 */

export class CameraStateManager {
  /**
   * @type {Map<string, CameraTrajectory>}
   */
  trajectories = new Map();

  /**
   * @type {Map<string, string[]>}
   */
  dependencyGraph = new Map();

  /**
   * @type {string|null}
   */
  projectId = null;

  /**
   * @type {Set<(state: CameraState) => void>}
   */
  listeners = new Set();

  /**
   * @type {string}
   */
  storageKey = 'camera-state-';

  /**
   * @param {string} [projectId]
   */
  constructor(projectId) {
    if (projectId) {
      this.projectId = projectId;
      this.storageKey += projectId;
      this.loadFromStorage();
    }
  }

  /**
   * Subscribe to state changes
   * @param {(state: CameraState) => void} callback
   * @returns {() => void} unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of state change
   */
  notify() {
    const state = this.getState();
    this.listeners.forEach(cb => cb(state));
  }

  /**
   * Get current state snapshot
   * @returns {CameraState}
   */
  getState() {
    return {
      trajectories: new Map(this.trajectories),
      dependencyGraph: new Map(this.dependencyGraph),
      projectId: this.projectId,
    };
  }

  /**
   * Load state from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return;

      const parsed = JSON.parse(data);
      this.projectId = parsed.projectId || this.projectId;

      // Load trajectories
      if (parsed.trajectories) {
        this.trajectories = new Map(
          Object.entries(parsed.trajectories).map(([id, traj]) => [
            id,
            traj,
          ])
        );
      }

      // Load dependency graph
      if (parsed.dependencyGraph) {
        this.dependencyGraph = new Map(
          Object.entries(parsed.dependencyGraph).map(([id, children]) => [
            id,
            children,
          ])
        );
      }
    } catch (error) {
      console.error('Failed to load camera state from storage:', error);
      this.trajectories.clear();
      this.dependencyGraph.clear();
    }
  }

  /**
   * Save state to localStorage
   */
  saveToStorage() {
    if (!this.projectId) return;

    try {
      const data = {
        projectId: this.projectId,
        trajectories: Object.fromEntries(this.trajectories),
        dependencyGraph: Object.fromEntries(this.dependencyGraph),
        version: '1.0',
        lastModified: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save camera state:', error);
    }
  }

  /**
   * Add or update a camera trajectory
   * @param {CameraTrajectory} trajectory
   */
  setTrajectory(trajectory) {
    // Validate trajectory structure
    this.validateTrajectory(trajectory);

    const { shotId } = trajectory;
    this.trajectories.set(shotId, trajectory);
    this.notify();
    this.saveToStorage();
  }

  /**
   * Get a trajectory by shot ID
   * @param {string} shotId
   * @returns {CameraTrajectory|undefined}
   */
  getTrajectory(shotId) {
    return this.trajectories.get(shotId);
  }

  /**
   * Get all trajectories as an array
   * @returns {CameraTrajectory[]}
   */
  getAllTrajectories() {
    return Array.from(this.trajectories.values());
  }

  /**
   * Get trajectories for multiple shot IDs
   * @param {string[]} shotIds
   * @returns {CameraTrajectory[]}
   */
  getTrajectories(shotIds) {
    return shotIds
      .map(id => this.trajectories.get(id))
      .filter(t => t !== undefined);
  }

  /**
   * Update specific fields of a trajectory
   * @param {string} shotId
   * @param {Partial<CameraTrajectory>} updates
   */
  updateTrajectory(shotId, updates) {
    const existing = this.trajectories.get(shotId);
    if (!existing) {
      throw new Error(`Trajectory not found: ${shotId}`);
    }

    // Deep merge updates
    const merged = { ...existing, ...updates };
    if (updates.camera) {
      merged.camera = { ...existing.camera, ...updates.camera };
      if (updates.camera.lens) {
        merged.camera.lens = { ...existing.camera.lens, ...updates.camera.lens };
      }
    }
    if (updates.movement) {
      merged.movement = { ...existing.movement, ...updates.movement };
    }
    if (updates.timing) {
      merged.timing = { ...existing.timing, ...updates.timing };
    }

    this.setTrajectory(merged);
  }

  /**
   * Remove a trajectory by shot ID
   * @param {string} shotId
   * @returns {boolean}
   */
  removeTrajectory(shotId) {
    const removed = this.trajectories.delete(shotId);
    if (removed) {
      // Also remove any dependencies involving this shot
      this.dependencyGraph.delete(shotId);
      for (const [parent, children] of this.dependencyGraph.entries()) {
        const filtered = children.filter(childId => childId !== shotId);
        if (filtered.length !== children.length) {
          this.dependencyGraph.set(parent, filtered);
        }
      }
      this.notify();
      this.saveToStorage();
    }
    return removed;
  }

  /**
   * Clear all trajectories and dependencies
   */
  clear() {
    this.trajectories.clear();
    this.dependencyGraph.clear();
    this.notify();
    this.saveToStorage();
  }

  /**
   * Set dependency: parentShotId must complete before childShotId can render
   * @param {string} parentShotId
   * @param {string} childShotId
   */
  setDependency(parentShotId, childShotId) {
    if (!this.trajectories.has(parentShotId)) {
      throw new Error(`Parent trajectory not found: ${parentShotId}`);
    }
    if (!this.trajectories.has(childShotId)) {
      throw new Error(`Child trajectory not found: ${childShotId}`);
    }
    if (parentShotId === childShotId) {
      throw new Error('Cannot set dependency: shot cannot depend on itself');
    }

    // Check for cycles before adding
    if (this.wouldCreateCycle(parentShotId, childShotId)) {
      throw new Error(`Adding dependency would create cycle: ${parentShotId} -> ${childShotId}`);
    }

    const children = this.dependencyGraph.get(parentShotId) || [];
    if (!children.includes(childShotId)) {
      children.push(childShotId);
      this.dependencyGraph.set(parentShotId, children);
      this.notify();
      this.saveToStorage();
    }
  }

  /**
   * Remove a dependency relationship
   * @param {string} parentShotId
   * @param {string} childShotId
   */
  removeDependency(parentShotId, childShotId) {
    const children = this.dependencyGraph.get(parentShotId);
    if (children) {
      const filtered = children.filter(id => id !== childShotId);
      if (filtered.length < children.length) {
        if (filtered.length === 0) {
          this.dependencyGraph.delete(parentShotId);
        } else {
          this.dependencyGraph.set(parentShotId, filtered);
        }
        this.notify();
        this.saveToStorage();
      }
    }
  }

  /**
   * Get all direct children (dependent shots) of a parent
   * @param {string} shotId
   * @returns {string[]}
   */
  getChildren(shotId) {
    return this.dependencyGraph.get(shotId) || [];
  }

  /**
   * Get all direct parents (dependencies) of a child
   * @param {string} shotId
   * @returns {string[]}
   */
  getParents(shotId) {
    const parents = [];
    for (const [parent, children] of this.dependencyGraph.entries()) {
      if (children.includes(shotId)) {
        parents.push(parent);
      }
    }
    return parents;
  }

  /**
   * Get full ancestry chain (all ancestors)
   * @param {string} shotId
   * @returns {string[]}
   */
  getAncestors(shotId) {
    const ancestors = [];
    const visited = new Set();

    const dfs = (currentId) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const parents = this.getParents(currentId);
      for (const parent of parents) {
        if (!ancestors.includes(parent)) {
          ancestors.push(parent);
          dfs(parent);
        }
      }
    };

    dfs(shotId);
    return ancestors;
  }

  /**
   * Get full descendant chain (all children)
   * @param {string} shotId
   * @returns {string[]}
   */
  getDescendants(shotId) {
    const descendants = [];
    const visited = new Set();

    const dfs = (currentId) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const children = this.getChildren(currentId);
      for (const child of children) {
        if (!descendants.includes(child)) {
          descendants.push(child);
          dfs(child);
        }
      }
    };

    dfs(shotId);
    return descendants;
  }

  /**
   * Topologically sort trajectories based on dependencies
   * @returns {string[]} shot IDs in render-safe order (parents before children)
   */
  getTopologicalOrder() {
    const visited = new Set();
    const temp = new Set();
    const order = [];

    const visit = (shotId) => {
      if (temp.has(shotId)) {
        throw new Error(`Cycle detected in camera dependency graph at ${shotId}`);
      }
      if (visited.has(shotId)) return;

      temp.add(shotId);

      // Visit children first (DAG traversal)
      const children = this.getChildren(shotId);
      for (const child of children) {
        visit(child);
      }

      temp.delete(shotId);
      visited.add(shotId);
      order.push(shotId);
    };

    // Start from root shots (shots with no parents)
    const allShotIds = Array.from(this.trajectories.keys());
    const shotsWithParents = new Set();
    for (const children of this.dependencyGraph.values()) {
      for (const child of children) {
        shotsWithParents.add(child);
      }
    }
    const rootShots = allShotIds.filter(id => !shotsWithParents.has(id));

    // Visit all roots
    for (const root of rootShots) {
      visit(root);
    }

    // Then visit any remaining (should be unreachable but safe)
    for (const shotId of allShotIds) {
      if (!visited.has(shotId)) {
        visit(shotId);
      }
    }

    // Reverse to get parents before children
    return order.reverse();
  }

  /**
   * Build camera dependency tree for a root shot
   * @param {string} rootShotId
   * @returns {Object} Nested tree structure
   */
  getCameraTree(rootShotId) {
    if (!this.trajectories.has(rootShotId)) {
      throw new Error(`Root shot not found: ${rootShotId}`);
    }

    const buildNode = (shotId) => {
      const trajectory = this.trajectories.get(shotId);
      const children = this.getChildren(shotId);
      return {
        shot_id: shotId,
        camera: trajectory.camera,
        lens: trajectory.camera.lens,
        timing: trajectory.timing,
        movement: trajectory.movement,
        children: children.map(child => buildNode(child)).filter(Boolean),
      };
    };

    return buildNode(rootShotId);
  }

  /**
   * Check if adding a dependency would create a cycle
   * @private
   * @param {string} parentId
   * @param {string} childId
   * @returns {boolean}
   */
  wouldCreateCycle(parentId, childId) {
    // If parent is already reachable from child, adding parent->child creates cycle
    const ancestors = this.getAncestors(parentId);
    return ancestors.includes(childId);
  }

  /**
   * Validate trajectory data structure
   * @param {CameraTrajectory} trajectory
   */
  validateTrajectory(trajectory) {
    if (!trajectory.shotId || trajectory.shotId.trim() === '') {
      throw new Error('shotId is required');
    }

    if (!trajectory.camera) {
      throw new Error('Trajectory must have camera data');
    }

    if (!Array.isArray(trajectory.camera.position) || trajectory.camera.position.length !== 3) {
      throw new Error('Camera position must be [x, y, z] array');
    }

    if (!Array.isArray(trajectory.camera.rotation) || trajectory.camera.rotation.length !== 3) {
      throw new Error('Camera rotation must be [pitch, yaw, roll] array');
    }

    if (!trajectory.camera.lens) {
      throw new Error('Camera lens settings required');
    }

    if (typeof trajectory.camera.lens.focalLength !== 'number' || trajectory.camera.lens.focalLength <= 0) {
      throw new Error('focalLength must be positive');
    }

    if (!trajectory.movement) {
      throw new Error('Trajectory must have movement data');
    }

    const validMovementTypes = ['static', 'pan', 'tilt', 'dolly', 'zoom', 'crane'];
    if (!validMovementTypes.includes(trajectory.movement.type)) {
      throw new Error(`Invalid movement type: ${trajectory.movement.type}`);
    }

    if (typeof trajectory.movement.start !== 'number' || typeof trajectory.movement.end !== 'number') {
      throw new Error('Movement start/end must be numbers (0-1)');
    }

    if (trajectory.movement.start < 0 || trajectory.movement.end > 1 || trajectory.movement.start >= trajectory.movement.end) {
      throw new Error('Invalid movement range: start must be < end, both in [0,1]');
    }

    if (!trajectory.timing) {
      throw new Error('Trajectory must have timing data');
    }

    if (!Number.isInteger(trajectory.timing.startFrame) || !Number.isInteger(trajectory.timing.endFrame)) {
      throw new Error('Timing frames must be integers');
    }

    if (trajectory.timing.startFrame >= trajectory.timing.endFrame) {
      throw new Error('startFrame must be < endFrame');
    }
  }

  /**
   * Export state for serialization
   * @returns {string}
   */
  toJSON() {
    return JSON.stringify({
      projectId: this.projectId,
      trajectories: Object.fromEntries(this.trajectories),
      dependencyGraph: Object.fromEntries(this.dependencyGraph),
      version: '1.0',
      exportedAt: Date.now(),
    });
  }

  /**
   * Import state from serialization
   * @param {string} json
   */
  fromJSON(json) {
    try {
      const data = JSON.parse(json);
      if (data.version !== '1.0') {
        console.warn(`CameraState version mismatch: got ${data.version}, expected 1.0`);
      }

      this.projectId = data.projectId || null;
      this.trajectories = new Map(Object.entries(data.trajectories || {}));
      this.dependencyGraph = new Map(Object.entries(data.dependencyGraph || {}));
      this.saveToStorage();
      this.notify();
    } catch (error) {
      console.error('Failed to parse camera state JSON:', error);
      throw new Error('Invalid camera state JSON');
    }
  }

  /**
   * Get statistics about current state
   * @returns {{trajectoryCount: number, dependencyCount: number, projectId: string|null}}
   */
  getStats() {
    return {
      trajectoryCount: this.trajectories.size,
      dependencyCount: Array.from(this.dependencyGraph.values()).reduce((sum, children) => sum + children.length, 0),
      projectId: this.projectId,
    };
  }
}

/**
 * Factory function to create CameraStateManager
 * @param {string} [projectId]
 * @returns {CameraStateManager}
 */
export function createCameraState(projectId) {
  return new CameraStateManager(projectId);
}

export default CameraStateManager;