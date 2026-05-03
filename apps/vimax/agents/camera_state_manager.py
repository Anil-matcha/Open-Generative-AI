"""
Camera State Manager - Backend
Manages camera trajectories and dependency trees for multi-camera video generation.
"""

from typing import Dict, List, Optional, Set
from dataclasses import dataclass, field, asdict
from datetime import datetime
import json
import sqlite3
from pathlib import Path
from uuid import uuid4


@dataclass
class LensSettings:
    """Lens configuration for a camera shot."""
    focal_length: float  # mm
    aperture: float      # f-stop
    sensor_width: float  # mm
    sensor_height: float  # mm

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> 'LensSettings':
        return cls(
            focal_length=data.get('focalLength', 50.0),
            aperture=data.get('aperture', 2.8),
            sensor_width=data.get('sensorWidth', 36.0),
            sensor_height=data.get('sensorHeight', 24.0),
        )


@dataclass
class CameraPose:
    """Camera position and orientation in 3D space."""
    position: List[float]  # [x, y, z] world coordinates
    rotation: List[float]  # [pitch, yaw, roll] in radians

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> 'CameraPose':
        return cls(
            position=data.get('position', [0.0, 0.0, 5.0]),
            rotation=data.get('rotation', [0.0, 0.0, 0.0]),
        )


@dataclass
class MovementProfile:
    """Camera movement over time."""
    movement_type: str  # 'static', 'pan', 'tilt', 'dolly', 'zoom', 'crane'
    start_progress: float  # 0.0 - 1.0
    end_progress: float    # 0.0 - 1.0
    easing: str = 'linear'  # 'linear', 'easeIn', 'easeOut', 'easeInOut'
    control_points: Optional[List[List[float]]] = None  # Bezier control points

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> 'MovementProfile':
        return cls(
            movement_type=data.get('type', 'static'),
            start_progress=data.get('start', 0.0),
            end_progress=data.get('end', 1.0),
            easing=data.get('easing', 'linear'),
            control_points=data.get('path'),
        )


@dataclass
class TimingInfo:
    """Frame-accurate timing for a shot."""
    start_frame: int
    end_frame: int
    duration: int  # in frames

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> 'TimingInfo':
        return cls(
            start_frame=data.get('startFrame', 0),
            end_frame=data.get('endFrame', 0),
            duration=data.get('duration', 0),
        )


@dataclass
class CameraTrajectory:
    """Complete camera trajectory for a single shot."""
    shot_id: str
    camera: CameraPose
    lens: LensSettings
    movement: MovementProfile
    timing: TimingInfo
    metadata: Dict = field(default_factory=dict)  # Additional shot-specific data

    def to_dict(self) -> dict:
        return {
            'shotId': self.shot_id,
            'camera': self.camera.to_dict(),
            'lens': self.lens.to_dict(),
            'movement': self.movement.to_dict(),
            'timing': self.timing.to_dict(),
            'metadata': self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'CameraTrajectory':
        return cls(
            shot_id=data['shotId'],
            camera=CameraPose.from_dict(data['camera']),
            lens=LensSettings.from_dict(data['lens']),
            movement=MovementProfile.from_dict(data['movement']),
            timing=TimingInfo.from_dict(data['timing']),
            metadata=data.get('metadata', {}),
        )


class CameraStateManager:
    """
    Manages camera trajectories and their dependencies across shots.

    Features:
    - Store/retrieve trajectories by shot ID
    - Build dependency graph (which shots depend on which)
    - Topological sort for render ordering
    - Cycle detection to prevent invalid graphs
    - Persistence to SQLite database
    """

    VERSION = '1.0'

    def __init__(self, project_id: Optional[str] = None, db_path: Optional[str] = None):
        """
        Initialize CameraStateManager.

        Args:
            project_id: Project identifier for scoping data
            db_path: Path to SQLite database (default: ~/.cinegen/camera_state.db)
        """
        self.project_id = project_id or str(uuid4())
        self.trajectories: Dict[str, CameraTrajectory] = {}
        self.dependency_graph: Dict[str, List[str]] = {}  # parent_shot_id -> [child_shot_ids]

        # Database setup
        if db_path is None:
            home = Path.home()
            db_dir = home / '.cinegen'
            db_dir.mkdir(exist_ok=True)
            db_path = str(db_dir / 'camera_state.db')

        self.db_path = db_path
        self._init_database()
        self._load_from_db()

    def _init_database(self) -> None:
        """Initialize SQLite database with required tables."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trajectories (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                data TEXT NOT NULL,
                version TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dependencies (
                parent_id TEXT NOT NULL,
                child_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                PRIMARY KEY (parent_id, child_id)
            )
        ''')

        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_trajectories_project 
            ON trajectories(project_id)
        ''')

        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_dependencies_project 
            ON dependencies(project_id)
        ''')

        conn.commit()
        conn.close()

    def _load_from_db(self) -> None:
        """Load trajectories and dependencies from database for current project."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Load trajectories
            cursor.execute(
                'SELECT id, data FROM trajectories WHERE project_id = ?',
                (self.project_id,)
            )
            for row in cursor.fetchall():
                try:
                    traj = CameraTrajectory.from_dict(json.loads(row[1]))
                    self.trajectories[row[0]] = traj
                except Exception as e:
                    print(f"Warning: Failed to load trajectory {row[0]}: {e}")

            # Load dependencies
            cursor.execute(
                'SELECT parent_id, child_id FROM dependencies WHERE project_id = ?',
                (self.project_id,)
            )
            for row in cursor.fetchall():
                parent, child = row
                if parent not in self.dependency_graph:
                    self.dependency_graph[parent] = []
                if child not in self.dependency_graph[parent]:
                    self.dependency_graph[parent].append(child)

            conn.close()
        except Exception as e:
            print(f"Warning: Failed to load camera state from DB: {e}")

    def _save_trajectory_to_db(self, trajectory: CameraTrajectory) -> None:
        """Save single trajectory to database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            '''
            INSERT OR REPLACE INTO trajectories (id, project_id, data, version, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''',
            (
                trajectory.shot_id,
                self.project_id,
                json.dumps(trajectory.to_dict()),
                self.VERSION,
            )
        )
        conn.commit()
        conn.close()

    def _delete_trajectory_from_db(self, shot_id: str) -> None:
        """Remove trajectory from database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM trajectories WHERE id = ? AND project_id = ?', (shot_id, self.project_id))
        conn.commit()
        conn.close()

    def _save_dependencies_to_db(self) -> None:
        """Save all dependencies for current project."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Clear existing dependencies for project
        cursor.execute('DELETE FROM dependencies WHERE project_id = ?', (self.project_id,))

        # Insert current dependencies
        for parent, children in self.dependency_graph.items():
            for child in children:
                cursor.execute(
                    'INSERT OR IGNORE INTO dependencies (parent_id, child_id, project_id) VALUES (?, ?, ?)',
                    (parent, child, self.project_id)
                )

        conn.commit()
        conn.close()

    def set_trajectory(self, trajectory: CameraTrajectory) -> None:
        """
        Add or update a camera trajectory.

        Args:
            trajectory: Complete trajectory data

        Raises:
            ValueError: If trajectory is invalid
        """
        self._validate_trajectory(trajectory)
        self.trajectories[trajectory.shot_id] = trajectory
        self._save_trajectory_to_db(trajectory)

    def get_trajectory(self, shot_id: str) -> Optional[CameraTrajectory]:
        """Retrieve trajectory by shot ID."""
        return self.trajectories.get(shot_id)

    def get_all_trajectories(self) -> List[CameraTrajectory]:
        """Get all trajectories as list."""
        return list(self.trajectories.values())

    def get_trajectories(self, shot_ids: List[str]) -> List[CameraTrajectory]:
        """Get multiple trajectories by IDs."""
        return [self.trajectories[sid] for sid in shot_ids if sid in self.trajectories]

    def update_trajectory(self, shot_id: str, updates: Dict) -> None:
        """
        Partially update a trajectory.

        Args:
            shot_id: Shot identifier
            updates: Dictionary of fields to update (supports nested updates)
        """
        if shot_id not in self.trajectories:
            raise KeyError(f"Trajectory not found: {shot_id}")

        traj = self.trajectories[shot_id]
        traj_dict = traj.to_dict()

        # Deep merge updates
        self._deep_update(traj_dict, updates)

        new_trajectory = CameraTrajectory.from_dict(traj_dict)
        self.set_trajectory(new_trajectory)

    def remove_trajectory(self, shot_id: str) -> bool:
        """
        Remove a trajectory and its dependencies.

        Returns:
            True if removed, False if not found
        """
        if shot_id not in self.trajectories:
            return False

        del self.trajectories[shot_id]
        self._delete_trajectory_from_db(shot_id)

        # Remove dependencies involving this shot
        if shot_id in self.dependency_graph:
            del self.dependency_graph[shot_id]
            for parent in list(self.dependency_graph.keys()):
                self.dependency_graph[parent] = [
                    child for child in self.dependency_graph[parent]
                    if child != shot_id
                ]
                if not self.dependency_graph[parent]:
                    del self.dependency_graph[parent]

        self._save_dependencies_to_db()
        return True

    def clear_all(self) -> None:
        """Remove all trajectories and dependencies for this project."""
        self.trajectories.clear()
        self.dependency_graph.clear()

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM trajectories WHERE project_id = ?', (self.project_id,))
        cursor.execute('DELETE FROM dependencies WHERE project_id = ?', (self.project_id,))
        conn.commit()
        conn.close()

    def set_dependency(self, parent_shot_id: str, child_shot_id: str) -> None:
        """
        Declare that child_shot_id depends on parent_shot_id.
        Parent must complete rendering before child can start.

        Args:
            parent_shot_id: Shot that must finish first
            child_shot_id: Shot that depends on parent

        Raises:
            ValueError: If dependency would create cycle or shots missing
        """
        if parent_shot_id not in self.trajectories:
            raise ValueError(f"Parent trajectory not found: {parent_shot_id}")
        if child_shot_id not in self.trajectories:
            raise ValueError(f"Child trajectory not found: {child_shot_id}")
        if parent_shot_id == child_shot_id:
            raise ValueError("Shot cannot depend on itself")

        # Cycle detection
        if self._would_create_cycle(parent_shot_id, child_shot_id):
            raise ValueError(
                f"Adding dependency {parent_shot_id} -> {child_shot_id} would create cycle"
            )

        if parent_shot_id not in self.dependency_graph:
            self.dependency_graph[parent_shot_id] = []
        if child_shot_id not in self.dependency_graph[parent_shot_id]:
            self.dependency_graph[parent_shot_id].append(child_shot_id)
            self._save_dependencies_to_db()

    def remove_dependency(self, parent_shot_id: str, child_shot_id: str) -> None:
        """Remove dependency relationship."""
        if parent_shot_id in self.dependency_graph:
            children = self.dependency_graph[parent_shot_id]
            if child_shot_id in children:
                children.remove(child_shot_id)
                if not children:
                    del self.dependency_graph[parent_shot_id]
                self._save_dependencies_to_db()

    def get_children(self, shot_id: str) -> List[str]:
        """Get all direct child shots that depend on this shot."""
        return self.dependency_graph.get(shot_id, []).copy()

    def get_parents(self, shot_id: str) -> List[str]:
        """Get all direct parent shots that this shot depends on."""
        parents = []
        for parent, children in self.dependency_graph.items():
            if shot_id in children:
                parents.append(parent)
        return parents

    def get_ancestors(self, shot_id: str) -> List[str]:
        """
        Get all ancestor shots (transitive dependencies).

        Example: A -> B -> C means C's ancestors are [A, B]
        """
        ancestors = []
        visited = set()

        def dfs(current: str) -> None:
            if current in visited:
                return
            visited.add(current)
            for parent in self.get_parents(current):
                if parent not in ancestors:
                    ancestors.append(parent)
                    dfs(parent)

        dfs(shot_id)
        return ancestors

    def get_descendants(self, shot_id: str) -> List[str]:
        """
        Get all descendant shots (transitive dependents).

        Example: A -> B -> C means A's descendants are [B, C]
        """
        descendants = []
        visited = set()

        def dfs(current: str) -> None:
            if current in visited:
                return
            visited.add(current)
            for child in self.get_children(current):
                if child not in descendants:
                    descendants.append(child)
                    dfs(child)

        dfs(shot_id)
        return descendants

    def get_topological_order(self) -> List[str]:
        """
        Get shot IDs in topological order (parents before children).

        Returns:
            List of shot IDs in render-safe order

        Raises:
            ValueError: If dependency graph contains cycle
        """
        visited: Set[str] = set()
        temp: Set[str] = set()
        order: List[str] = []

        def visit(shot_id: str) -> None:
            if shot_id in temp:
                raise ValueError(f"Cycle detected at {shot_id}")
            if shot_id in visited:
                return

            temp.add(shot_id)

            # Visit children first (we'll reverse order later)
            for child in self.get_children(shot_id):
                visit(child)

            temp.remove(shot_id)
            visited.add(shot_id)
            order.append(shot_id)

        # Start from root shots (shots with no dependencies)
        all_shots = set(self.trajectories.keys())
        shots_with_parents = set()
        for children in self.dependency_graph.values():
            shots_with_parents.update(children)

        root_shots = all_shots - shots_with_parents

        # Visit all roots
        for root in root_shots:
            visit(root)

        # Visit any remaining (disconnected or orphaned)
        for shot_id in all_shots:
            if shot_id not in visited:
                visit(shot_id)

        # Reverse so parents come before children
        order.reverse()
        return order

    def get_camera_tree(self, root_shot_id: str) -> Dict:
        """
        Build camera dependency tree for a root shot.

        Returns nested dict: { shot_id: { camera: ..., children: [...] } }
        """
        if root_shot_id not in self.trajectories:
            raise ValueError(f"Root shot not found: {root_shot_id}")

        def build_tree(shot_id: str) -> Dict:
            trajectory = self.trajectories[shot_id]
            children = self.get_children(shot_id)
            return {
                'shot_id': shot_id,
                'camera': trajectory.camera.to_dict(),
                'lens': trajectory.lens.to_dict(),
                'timing': trajectory.timing.to_dict(),
                'movement': trajectory.movement.to_dict(),
                'children': [build_tree(child) for child in children],
            }

        return build_tree(root_shot_id)

    def would_create_cycle(self, parent_id: str, child_id: str) -> bool:
        """
        Check if adding parent -> child edge would introduce cycle.
        Returns True if child is ancestor of parent (adding edge would close loop).
        """
        # If parent is already reachable from child, adding edge creates cycle
        ancestors = self.get_ancestors(parent_id)
        return child_id in ancestors

    def _validate_trajectory(self, trajectory: CameraTrajectory) -> None:
        """Validate trajectory data integrity."""
        if not trajectory.shot_id or not trajectory.shot_id.strip():
            raise ValueError("shot_id is required")

        if trajectory.camera.position is None or len(trajectory.camera.position) != 3:
            raise ValueError("Camera position must be [x, y, z]")

        if any(not isinstance(v, (int, float)) for v in trajectory.camera.position):
            raise ValueError("Camera position values must be numeric")

        if trajectory.lens.focal_length <= 0:
            raise ValueError("focal_length must be positive")

        valid_types = {'static', 'pan', 'tilt', 'dolly', 'zoom', 'crane'}
        if trajectory.movement.movement_type not in valid_types:
            raise ValueError(f"Invalid movement type: {trajectory.movement.movement_type}")

        if not (0.0 <= trajectory.movement.start_progress <= trajectory.movement.end_progress <= 1.0):
            raise ValueError("Movement progress must be in [0,1] with start <= end")

        if trajectory.timing.start_frame >= trajectory.timing.end_frame:
            raise ValueError("start_frame must be < end_frame")

    def _deep_update(self, target: Dict, source: Dict) -> None:
        """Deep merge source dict into target dict."""
        for key, value in source.items():
            if isinstance(value, dict) and key in target and isinstance(target[key], dict):
                self._deep_update(target[key], value)
            else:
                target[key] = value

    def get_stats(self) -> Dict:
        """Get statistics about current state."""
        return {
            'project_id': self.project_id,
            'trajectory_count': len(self.trajectories),
            'dependency_count': sum(len(children) for children in self.dependency_graph.values()),
            'has_cycles': self._detect_cycles(),
        }

    def _detect_cycles(self) -> bool:
        """Check if dependency graph has cycles."""
        try:
            self.get_topological_order()
            return False
        except ValueError:
            return True

    def export_to_json(self) -> str:
        """Export entire state to JSON string."""
        return json.dumps({
            'version': self.VERSION,
            'project_id': self.project_id,
            'trajectories': {k: v.to_dict() for k, v in self.trajectories.items()},
            'dependency_graph': self.dependency_graph,
            'exported_at': datetime.utcnow().isoformat() + 'Z',
        }, indent=2)

    def import_from_json(self, json_str: str) -> None:
        """Import state from JSON string."""
        try:
            data = json.loads(json_str)
            if data.get('version') != self.VERSION:
                print(f"Warning: Version mismatch: {data.get('version')} vs {self.VERSION}")

            self.project_id = data.get('project_id', self.project_id)
            self.trajectories = {
                k: CameraTrajectory.from_dict(v)
                for k, v in data.get('trajectories', {}).items()
            }
            self.dependency_graph = data.get('dependency_graph', {})

            # Persist to DB
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('DELETE FROM trajectories WHERE project_id = ?', (self.project_id,))
            cursor.execute('DELETE FROM dependencies WHERE project_id = ?', (self.project_id,))

            for shot_id, traj in self.trajectories.items():
                cursor.execute(
                    'INSERT INTO trajectories (id, project_id, data, version) VALUES (?, ?, ?, ?)',
                    (shot_id, self.project_id, json.dumps(traj.to_dict()), self.VERSION)
                )

            for parent, children in self.dependency_graph.items():
                for child in children:
                    cursor.execute(
                        'INSERT OR IGNORE INTO dependencies (parent_id, child_id, project_id) VALUES (?, ?, ?)',
                        (parent, child, self.project_id)
                    )

            conn.commit()
            conn.close()
        except Exception as e:
            raise ValueError(f"Failed to import camera state: {e}")


# Factory function
def create_camera_state(project_id: Optional[str] = None) -> CameraStateManager:
    """Create a new CameraStateManager instance."""
    return CameraStateManager(project_id=project_id)


# Alias for compatibility
create_camera_state_manager = create_camera_state


# Standalone functions for compatibility with existing code
def build_camera_tree(
    trajectories: List[CameraTrajectory],
    dependencies: Dict[str, List[str]]
) -> Dict:
    """
    Build camera dependency tree from trajectories and dependency graph.

    Args:
        trajectories: List of all camera trajectories
        dependencies: Dict mapping parent_shot_id -> [child_shot_ids]

    Returns:
        Nested tree structure rooted at shots with no parents
    """
    traj_map = {t.shot_id: t for t in trajectories}

    def build_node(shot_id: str) -> Optional[Dict]:
        if shot_id not in traj_map:
            return None
        traj = traj_map[shot_id]
        children = dependencies.get(shot_id, [])
        return {
            'shot_id': shot_id,
            'camera': traj.camera.to_dict(),
            'lens': traj.lens.to_dict(),
            'movement': traj.movement.to_dict(),
            'timing': traj.timing.to_dict(),
            'children': [build_node(child) for child in children if child in traj_map],
        }

    # Find roots (shots with no parents)
    all_shot_ids = set(traj_map.keys())
    child_shot_ids = set()
    for children in dependencies.values():
        child_shot_ids.update(children)
    root_ids = all_shot_ids - child_shot_ids

    return [build_node(root) for root in root_ids if build_node(root)]


def calculate_shot_dependencies(
    storyboard: List[Dict],
    scene_boundaries: List[Dict]
) -> Dict[str, List[str]]:
    """
    Calculate camera dependencies from storyboard and scene data.

    Uses heuristic rules:
    - Sequential shots in same scene have linear dependencies
    - Reaction shots depend on preceding action shots
    - Multi-camera scenes: primary camera is parent of secondary angles

    Args:
        storyboard: List of shot definitions with camera, timing, and type
        scene_boundaries: List of scene start/end frames

    Returns:
        Dict mapping parent_shot_id -> [child_shot_ids]
    """
    dependencies: Dict[str, List[str]] = {}
    if not storyboard:
        return dependencies

    # Sort shots by start frame
    sorted_shots = sorted(storyboard, key=lambda s: s.get('startFrame', 0))

    for i in range(len(sorted_shots)):
        current = sorted_shots[i]
        current_id = current.get('shotId')
        if not current_id:
            continue

        # Default: each shot depends on immediate predecessor
        if i > 0:
            prev_id = sorted_shots[i-1].get('shotId')
            if prev_id:
                if current_id not in dependencies:
                    dependencies[current_id] = []
                # Current shot depends on previous (reverse of parent->child)
                # We store as parent->child, so prev -> current
                if prev_id not in dependencies:
                    dependencies[prev_id] = []
                dependencies[prev_id].append(current_id)

    return dependencies