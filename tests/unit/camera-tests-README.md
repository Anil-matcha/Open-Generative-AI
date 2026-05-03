# Camera Trajectory State Management - Test Suite

## Overview
Comprehensive TDD test suite for camera trajectory state management system, covering both frontend (TypeScript) and backend (Python) implementations.

## Test Structure

```
tests/unit/
├── camera-state.unit.spec.ts              # Frontend CameraState class unit tests
├── camera-image-generator.integration.spec.ts  # Frontend integration tests
├── camera_state_manager_test.py           # Backend Python unit tests
├── setup.config.ts                        # Shared test configuration
└── README.md                              # This file
```

## Running the Tests

### Frontend (Vitest + Playwright)
```bash
# Run all camera state unit tests
npm run test -- --grep "CameraState"

# Run camera image generator integration tests
npm run test -- --grep "CameraImageGenerator"

# Run with UI
npm run test:ui

# Run specific test file
npx vitest run tests/unit/camera-state.unit.spec.ts
```

### Backend (Python/pytest)
```bash
# Install Python test dependencies
pip install pytest pytest-cov

# Run all Python tests
pytest tests/unit/camera_state_manager_test.py -v

# Run with coverage
pytest tests/unit/camera_state_manager_test.py --cov=agents.camera_state_manager

# Run specific test class
pytest tests/unit/camera_state_manager_test.py::TestCameraStateManager -v
```

## Test Coverage

### A. CameraState (Frontend)
**File:** `tests/unit/camera-state.unit.spec.ts`

**Core Functionality** (9 tests)
- Constructor initializes empty trajectories
- addTrajectory() stores camera data correctly
- getTrajectory() returns trajectory or null
- updateTrajectory() merges trajectory data
- removeTrajectory() deletes trajectory
- getAllTrajectories() returns map of all trajectories
- clear() removes all trajectories
- toJSON()/fromJSON() serialize correctly

**Camera Tree Dependencies** (5 tests)
- setDependency() creates parent-child relationship
- getDependencies() returns child shots
- getAncestors() returns parent chain
- Handles diamond dependency pattern (multiple parents)
- Prevents duplicate dependencies

**LocalStorage Persistence** (4 tests)
- save() writes to localStorage
- load() reads from localStorage
- Handles corrupted/missing data gracefully
- Overwrites existing state correctly

**Additional Operations** (6 tests)
- getTrajectoryByIndex() retrieves by index
- getFirstTrajectory() returns first inserted
- removeTrajectoryByIndex() removes by index
- removeAllDependencies() clears dependency graph
- Index updates after removal
- Defensive copies prevent mutation

**Edge Cases & Error Handling** (6 tests)
- Mismatched shotId validation
- Deep object preservation
- Empty/null values
- Very large trajectory data (10000+ elements)
- Special characters in shot IDs
- Concurrent modifications isolated per project

**Total:** 36 unit tests for CameraState

---

### B. CameraImageGenerator (Integration)
**File:** `tests/unit/camera-image-generator.integration.spec.ts`

**Initialization & Integration** (3 tests)
- Accepts CameraState instance
- Uses CameraState for camera positions
- Reflects real-time state updates

**Camera Tree Construction** (8 tests)
- construct_camera_tree() builds valid tree from dependencies
- Includes all shots in tree nodes
- Computes correct depth levels
- Handles diamond dependencies
- Detects cycles and throws error
- Identifies root shots (no parents)
- Handles empty dependency graph
- Preserves insertion order

**Scene Generation** (9 tests)
- generate_scene_with_dependencies() respects ordering
- Topological sort on complex DAG (4-level chain)
- Includes full trajectory data
- Handles independent shots
- Orders by dependency then insertion order
- Includes dependency and shotIndex metadata
- Includes parent references per shot
- Handles multiple parents correctly
- Preserves original trajectories (no mutation)

**Camera Parameters** (5 tests)
- get_camera_parameters() returns complete params
- Returns null for missing shot
- Fills missing optional fields with defaults
- Defensive copy prevents mutation
- Handles trajectory with only shotId

**State Management** (3 tests)
- getAllCameraTrajectories() returns full map
- Empty state handled correctly
- Serialization includes CameraState data

**Error Handling** (4 tests)
- Cycle detection throws clear error
- Handles malformed trajectory data
- Dependency on non-existent shot handled
- Serialization/deserialization roundtrip

**Edge Cases & Performance** (5 tests)
- Special characters in shot IDs
- Empty string rejection
- Very large datasets (500+ shots, 1000 trajectories)
- Identical camera parameters immutability
- Memory management for large trees

**Serialization** (3 tests)
- toJSON/fromJSON preserve state
- Includes CameraState data in output
- Hydration from complete JSON works

**Total:** 40 integration tests

---

### C. CameraStateManager (Backend - Python)
**File:** `tests/unit/camera_state_manager_test.py`

**CameraTrajectory Model** (6 tests)
- Creation with valid data
- Validation of required fields
- Type coercion
- Default values
- Serialization roundtrip
- JSON Schema compliance

**CameraStateManager Core** (13 tests)
- Initialization
- add_trajectory stores correctly
- Overwrites existing trajectory
- get_trajectory returns correct or None
- update_trajectory merges data
- update creates if missing
- remove_trajectory deletes entry
- Remove cleans up dependencies
- get_all_trajectories returns dict
- clear removes all data
- to_json/dict serialization
- from_json deserialization
- Round-trip preservation
- Corrupted data handling

**Camera Tree Dependencies** (8 tests)
- set_dependency creates parent-child
- Multiple children per parent
- Multiple parents per child (DAG)
- No duplicate dependencies
- get_dependencies returns children
- get_dependencies empty for none
- get_ancestors returns parent chain
- Diamond pattern handling

**Cycle Detection & Topological Sort** (4 tests)
- Simple cycle detection (A->B->A)
- Complex cycle detection (A->B->C->A)
- Valid DAG passes cycle check
- Topological sort produces valid order

**Camera Tree Generation** (7 tests)
- generate_camera_tree returns structure
- Node metadata (id, children, parents, depth)
- Depth calculation (root=0, child=level+1)
- Parent count tracking
- Empty state handling
- Orphan shot inclusion
- Tree serialization

**CameraImageGenerator Integration** (13 tests)
- Accepts CameraStateManager
- Uses state for parameters
- Tree construction from manager
- Scene generation topological ordering
- Scene includes complete trajectory data
- Scene includes dependency metadata
- Scene includes parent references
- Scene includes level hierarchy
- Respects topological order
- Handles multiple roots
- Empty state yields empty scene
- Parameter retrieval complete
- Null for missing shots

**Persistence Integration** (5 tests)
- SQLite save/load roundtrip
- Multiple project isolation
- Concurrent save safety
- Non-existent project returns empty
- Backup and restore

**Concurrency & Thread Safety** (3 tests)
- Concurrent add_trajectory thread-safe
- Concurrent reads don't deadlock
- Concurrent modification conflict handling

**Edge Cases & Validation** (9 tests)
- Empty/None shot ID rejection
- Very long shot ID (1000+ chars)
- Unicode characters
- Special characters
- Negative frame numbers
- Very large frame numbers
- Float position values
- Invalid movement type default
- Schema validation

**Performance Benchmarks** (5 tests)
- Add 1000 trajectories (< 1s)
- Topological sort 500 nodes (< 200ms)
- Serialize 1000 trajectories (< 500ms)
- Concurrent adds 10 threads (< 2s)
- Load/save 10k trajectories (< 5s)

**Total:** 73 Python unit tests

---

## Data Structures Tested

### CameraTrajectory (TypeScript)
```typescript
interface CameraTrajectory {
  shotId: string;
  camera: {
    position: [number, number, number];  // x, y, z
    rotation: [number, number, number];  // pitch, yaw, roll
    lens: {
      focalLength: number;
      aperture: number;
      sensorSize: [number, number];
    };
  };
  movement: {
    type: 'static' | 'pan' | 'tilt' | 'dolly' | 'zoom';
    start: number;
    end: number;
    easing: string;
  };
  timing: {
    startFrame: number;
    endFrame: number;
    duration: number;
  };
}
```

### CameraState (Frontend Storage Format)
```typescript
interface CameraState {
  trajectories: Map<string, CameraTrajectory>;
  dependencyGraph: Map<string, string[]>;  // parentId -> [childIds]
}
```

### CameraTree (Backend Output)
```typescript
interface CameraTree {
  nodes: { [shotId: string]: TreeNode };
  roots: string[];
}

interface TreeNode {
  id: string;
  children: string[];
  parents: string[];
  depth: number;
  parentCount: number;
}
```

### Scene (Generator Output)
```typescript
interface Scene {
  shots: CameraTrajectory[];  // Topologically sorted
  dependencies: { [parentId: string]: string[] };
  shotIndex: { [shotId: string]: number };
}
```

## Implementation Checklist

To make these tests pass, implement:

1. **`src/lib/editor/cameraState.js`** - Frontend state manager
   - [x] CameraState class with all methods
   - [x] Map-based trajectory storage
   - [x] Dependency graph management
   - [x] LocalStorage persistence
   - [x] JSON serialization

2. **`apps/vimax/agents/camera_state_manager.py`** - Backend manager
   - [x] CameraStateManager class
   - [x] CameraTrajectory data model
   - [x] SQLite persistence layer
   - [x] Dependency graph (DAG)
   - [x] Topological sort algorithm
   - [x] Cycle detection

3. **`apps/vimax/agents/camera_image_generator.py`** - Generator
   - [x] CameraImageGenerator class
   - [x] construct_camera_tree() method
   - [x] generate_scene_with_dependencies() method
   - [x] get_camera_parameters() method
   - [x] Integration with CameraStateManager

## Expected Test Results

### Initial State (Red Phase)
```
FAIL: tests/unit/camera-state.unit.spec.ts
  - All 36 tests fail (module not found)

FAIL: tests/unit/camera-image-generator.integration.spec.ts
  - All 40 tests fail (module not found)

FAIL: tests/unit/camera_state_manager_test.py
  - All 73 tests fail (module not found)
```

### After Implementation (Green Phase)
```
PASS: tests/unit/camera-state.unit.spec.ts
  ✓ constructor initializes empty trajectories
  ✓ addTrajectory stores camera data correctly
  ... (36 total)

PASS: tests/unit/camera-image-generator.integration.spec.ts
  ✓ CameraImageGenerator uses CameraState for camera positions
  ✓ construct_camera_tree builds valid dependency tree
  ... (40 total)

PASS: tests/unit/camera_state_manager_test.py
  ✓ test_camera_trajectory_creation_with_valid_data
  ✓ test_camera_state_manager_initialization
  ... (73 total)
```

### Target Coverage
- Line coverage: ≥ 80%
- Branch coverage: ≥ 75%
- All public methods tested

## Notes

- Tests are written in **TDD red-green-refactor** cycle
- All tests **FAIL initially** (no implementation exists)
- Tests define the **complete API contract**
- Edge cases include: empty states, null values, special characters, cycles, large datasets
- Performance benchmarks ensure scalability (1000+ trajectories, 10+ threads)
- Frontend and backend formats are compatible via JSON serialization
- Dependency graph forms a **Directed Acyclic Graph (DAG)**; cycles raise `CameraTreeError`
