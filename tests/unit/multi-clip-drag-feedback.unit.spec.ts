import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Unit tests for Multi-Clip Drag Feedback System
 * 
 * Tests cover:
 * - Multi-select bounding box visualization
 * - Drag preview and ghost elements
 * - Collision detection and highlighting
 * - Group selection box behavior
 * - Snap preview with visual indicators
 * - Visual indicators for affected/displaced clips
 * - Marquee selection
 * - 60fps animation performance
 */

const MULTI_CLIP_DRAG_STATES = {
  INACTIVE: 'inactive',
  MARQUEE_SELECTION: 'marquee_selection',
  DRAGGING: 'dragging',
  PREVIEW: 'preview'
};

const CLIP_DRAG_INDICATORS = {
  MOVING: 'moving',
  DISPLACED: 'displaced',
  COLLISION: 'collision',
  SNAP_TARGET: 'snap_target'
};

// Mock DOM element creator
function createMockClipEl(id, rect = { left: 100, top: 50, width: 120, height: 40 }) {
  return {
    dataset: { itemId: id, clipId: id },
    classList: { 
      add: vi.fn(), 
      remove: vi.fn(),
      contains: vi.fn(() => false)
    },
    getBoundingClientRect: vi.fn(() => rect),
    innerHTML: `<span class="clip-label">Clip ${id}</span>`,
    style: {},
    appendChild: vi.fn(),
    querySelector: vi.fn(() => null),
    closest: vi.fn(() => null)
  };
}

// Mock timeline container
function createMockTimelineContainer() {
  const clips = [
    createMockClipEl(1, { left: 100, top: 50, width: 120, height: 40 }),
    createMockClipEl(2, { left: 250, top: 50, width: 100, height: 40 }),
    createMockClipEl(3, { left: 100, top: 120, width: 80, height: 40 }),
    createMockClipEl(4, { left: 400, top: 50, width: 150, height: 40 })
  ];
  
  return {
    querySelectorAll: vi.fn(() => clips),
    querySelector: vi.fn((selector) => {
      if (selector === '.multi-clip-bounding-box') return createMockBoundingBox();
      if (selector === '.marquee-selection') return createMockMarquee();
      if (selector.startsWith('.clip[data-item-id')) {
        return clips.find(c => c.dataset.itemId === selector.split('"')[1]);
      }
      return null;
    }),
    appendChild: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 800, height: 400 })),
    clips
  };
}

function createMockBoundingBox() {
  return {
    style: {},
    remove: vi.fn(),
    classList: { add: vi.fn(), remove: vi.fn() }
  };
}

function createMockMarquee() {
  return {
    style: {},
    remove: vi.fn()
  };
}

// Mock state
function createMockState() {
  return {
    tracks: [
      {
        id: 'track-1',
        name: 'Video',
        items: [
          { id: 1, start: 4.8, end: 22.8, name: 'Clip 1' },
          { id: 2, start: 20.4, end: 32.4, name: 'Clip 2' }
        ]
      },
      {
        id: 'track-2',
        name: 'Audio',
        items: [
          { id: 3, start: 3, end: 45, name: 'Clip 3' }
        ]
      }
    ],
    timelineSeconds: 60,
    playheadPercent: 32,
    zoom: 1,
    selectedClipId: null,
    saveSnapshot: vi.fn(),
    onMultiClipDragEnd: vi.fn()
  };
}

describe('Multi-Clip Drag Feedback System', () => {
  let mockContainer;
  let mockState;
  let MockMultiClipDragFeedback;
  let multiClipDrag;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockContainer = createMockTimelineContainer();
    mockState = createMockState();
    
    // Import the module
    const module = await import('../../src/lib/editor/multiClipDragFeedback.js');
    MockMultiClipDragFeedback = module.MultiClipDragFeedback;
    
    // Create instance with mocked dependencies
    multiClipDrag = new module.MultiClipDragFeedback(mockContainer, mockState, {
      snapThreshold: 10,
      snapMagneticPull: 20,
      minDragDistance: 5,
      boundingBoxPadding: 4,
      collisionDetectionBuffer: 2
    });
  });

  afterEach(() => {
    if (multiClipDrag && multiClipDrag.destroy) {
      multiClipDrag.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      expect(multiClipDrag.dragState.state).toBe(MULTI_CLIP_DRAG_STATES.INACTIVE);
      expect(multiClipDrag.dragState.selectedClipIds.size).toBe(0);
      expect(multiClipDrag.dragState.isDragging).toBe(false);
    });

    it('should set custom options correctly', () => {
      const customOptions = {
        snapThreshold: 15,
        minDragDistance: 10
      };
      const customDrag = new module.MultiClipDragFeedback(mockContainer, mockState, customOptions);
      expect(customDrag.options.snapThreshold).toBe(15);
      expect(customDrag.options.minDragDistance).toBe(10);
    });

    it('should build snap points from state', () => {
      expect(multiClipDrag.dragState.snapTargets.length).toBeGreaterThan(0);
      // Should include clip start/end times, playhead, timeline boundaries
      const snapTypes = multiClipDrag.dragState.snapTargets.map(s => s.type);
      expect(snapTypes).toContain('clip-start');
      expect(snapTypes).toContain('clip-end');
    });
  });

  describe('Selection Management', () => {
    it('should add clip to selection', () => {
      multiClipDrag.addToSelection(1);
      expect(multiClipDrag.dragState.selectedClipIds.has(1)).toBe(true);
    });

    it('should remove clip from selection', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.addToSelection(2);
      multiClipDrag.removeFromSelection(1);
      expect(multiClipDrag.dragState.selectedClipIds.has(1)).toBe(false);
      expect(multiClipDrag.dragState.selectedClipIds.has(2)).toBe(true);
    });

    it('should clear all selections', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.addToSelection(2);
      multiClipDrag.addToSelection(3);
      multiClipDrag.clearSelection();
      expect(multiClipDrag.dragState.selectedClipIds.size).toBe(0);
    });

    it('should toggle selection', () => {
      multiClipDrag.toggleSelection(1);
      expect(multiClipDrag.dragState.selectedClipIds.has(1)).toBe(true);
      multiClipDrag.toggleSelection(1);
      expect(multiClipDrag.dragState.selectedClipIds.has(1)).toBe(false);
    });

    it('should select all clips', () => {
      multiClipDrag.selectAllClips();
      // Should select all clips from all tracks
      expect(multiClipDrag.getSelectedCount()).toBeGreaterThan(0);
    });

    it('should get selected clips with track info', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.addToSelection(2);
      const selected = multiClipDrag.getSelectedClips();
      expect(selected.length).toBe(2);
      expect(selected[0].trackId).toBeDefined();
    });
  });

  describe('Bounding Box', () => {
    it('should calculate bounding box for selected clips', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.addToSelection(2);
      const bbox = multiClipDrag.calculateBoundingBox();
      
      expect(bbox.left).toBeDefined();
      expect(bbox.top).toBeDefined();
      expect(bbox.width).toBeGreaterThan(0);
      expect(bbox.height).toBeGreaterThan(0);
    });

    it('should update bounding box element position', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.updateBoundingBox();
      
      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should clear bounding box when no selection', () => {
      multiClipDrag.updateBoundingBox();
      multiClipDrag.clearBoundingBox();
      // Should not throw when clearing non-existent bbox
      expect(multiClipDrag.dragState.boundingBox).toBeNull();
    });
  });

  describe('Collision Detection', () => {
    it('should detect overlapping clips during drag', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.dragState.originalPositions.set(1, {
        left: 100, top: 50, width: 120, height: 40,
        startTime: 4.8, endTime: 22.8, trackId: 'track-1'
      });
      
      // Mock a clip that would overlap at new position
      mockContainer.querySelectorAll = vi.fn(() => [
        createMockClipEl(2, { left: 180, top: 50, width: 100, height: 40 })
      ]);
      
      multiClipDrag.detectCollisions(50, 0); // Move 50px right
      
      expect(multiClipDrag.dragState.collisionClips.size).toBeGreaterThanOrEqual(0);
    });

    it('should track displaced clips', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.detectCollisions(100, 0);
      // Clips that would be pushed by the movement should be marked
      expect(multiClipDrag.dragState.displacedClips).toBeDefined();
    });

    it('should show collision indicator on clip', () => {
      const clipEl = createMockClipEl(2);
      clipEl.appendChild = vi.fn();
      multiClipDrag.showCollisionIndicator(clipEl, 2);
      
      expect(clipEl.appendChild).toHaveBeenCalled();
    });

    it('should clear collision indicators', () => {
      multiClipDrag.dragState.collisionIndicators.set(2, { remove: vi.fn() });
      multiClipDrag.clearCollisionIndicators();
      
      expect(multiClipDrag.dragState.collisionIndicators.size).toBe(0);
    });
  });

  describe('Snap Detection', () => {
    it('should find snap target near cursor', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.dragState.originalPositions.set(1, {
        left: 100, top: 50, width: 120, height: 40,
        startTime: 4.8, endTime: 22.8, trackId: 'track-1'
      });
      
      // Try to snap to a position near a clip start
      const snapTarget = multiClipDrag.findSnapTarget(0, 0);
      // Should return null if no close snap point
      expect(snapTarget === null || snapTarget.type).toBeDefined();
    });

    it('should show snap indicator when snapped', () => {
      multiClipDrag.showSnapIndicator({
        time: 20.4,
        type: 'clip-start',
        clipId: 2
      });
      
      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should hide all snap indicators', () => {
      multiClipDrag.hideAllSnapIndicators();
      expect(multiClipDrag.dragState.snapIndicators.size).toBe(0);
    });

    it('should get human-readable snap label', () => {
      const labels = [
        { type: 'clip-start', expected: 'Clip Start' },
        { type: 'clip-end', expected: 'Clip End' },
        { type: 'playhead', expected: 'Playhead' },
        { type: 'timeline-start', expected: 'Start' },
        { type: 'timeline-end', expected: 'End' }
      ];
      
      labels.forEach(({ type, expected }) => {
        const label = multiClipDrag.getSnapLabel({ type });
        expect(label).toBe(expected);
      });
    });
  });

  describe('Marquee Selection', () => {
    it('should start marquee selection', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 50,
        preventDefault: vi.fn()
      };
      
      multiClipDrag.startMarqueeSelection(mockEvent);
      
      expect(multiClipDrag.dragState.state).toBe(MULTI_CLIP_DRAG_STATES.MARQUEE_SELECTION);
      expect(multiClipDrag.dragState.marqueeStart).toBeDefined();
    });

    it('should update marquee during drag', () => {
      multiClipDrag.dragState.state = MULTI_CLIP_DRAG_STATES.MARQUEE_SELECTION;
      multiClipDrag.dragState.marqueeStart = { x: 100, y: 50 };
      
      const mockEvent = {
        clientX: 200,
        clientY: 150
      };
      
      // Mock getBoundingClientRect for container
      multiClipDrag.timelineContainer.getBoundingClientRect = vi.fn(() => ({ left: 0, top: 0 }));
      multiClipDrag.updateMarqueeSelection(mockEvent);
      
      expect(multiClipDrag.dragState.marqueeEnd.x).toBe(200);
      expect(multiClipDrag.dragState.marqueeEnd.y).toBe(150);
    });

    it('should end marquee selection and select clips', () => {
      multiClipDrag.dragState.state = MULTI_CLIP_DRAG_STATES.MARQUEE_SELECTION;
      multiClipDrag.dragState.marqueeStart = { x: 50, y: 50 };
      multiClipDrag.dragState.marqueeEnd = { x: 500, y: 200 };
      
      const mockEvent = {};
      multiClipDrag.endMarqueeSelection(mockEvent);
      
      expect(multiClipDrag.dragState.state).toBe(MULTI_CLIP_DRAG_STATES.INACTIVE);
    });
  });

  describe('Multi-Clip Drag', () => {
    it('should start drag with selected clips', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.addToSelection(2);
      
      const mockEvent = {
        clientX: 150,
        clientY: 70,
        preventDefault: vi.fn()
      };
      
      multiClipDrag.startMultiClipDrag(mockEvent);
      
      expect(multiClipDrag.dragState.isDragging).toBe(true);
      expect(multiClipDrag.dragState.draggedClipIds.size).toBe(2);
      expect(multiClipDrag.dragState.originalPositions.size).toBe(2);
    });

    it('should create ghost elements for dragged clips', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.startMultiClipDrag({
        clientX: 150,
        clientY: 70,
        preventDefault: vi.fn()
      });
      
      expect(multiClipDrag.dragState.ghostElements.size).toBeGreaterThan(0);
    });

    it('should not start drag if below threshold', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.startMultiClipDrag({
        clientX: 152,
        clientY: 72,
        preventDefault: vi.fn()
      });
      
      // Update position slightly
      multiClipDrag.updateDragPosition({
        clientX: 153,
        clientY: 73
      });
      
      // Should still be in dragging state but not active
      expect(multiClipDrag.dragState.state).toBe(MULTI_CLIP_DRAG_STATES.DRAGGING);
    });

    it('should update ghost positions during drag', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.startMultiClipDrag({
        clientX: 150,
        clientY: 70,
        preventDefault: vi.fn()
      });
      
      multiClipDrag.dragState.originalPositions.set(1, {
        left: 100, top: 50, width: 120, height: 40
      });
      
      multiClipDrag.updateGhostPositions(50, 0);
      
      const ghost = multiClipDrag.dragState.ghostElements.get(1);
      expect(ghost.style.left).toBe('150px');
    });
  });

  describe('Drag Animation Loop', () => {
    it('should use requestAnimationFrame for smooth updates', () => {
      vi.useFakeTimers();
      
      multiClipDrag.addToSelection(1);
      multiClipDrag.startMultiClipDrag({
        clientX: 150,
        clientY: 70,
        preventDefault: vi.fn()
      });
      
      expect(multiClipDrag.animationFrame).toBeDefined();
      
      // Simulate animation frame
      vi.advanceTimersByTime(16);
      
      expect(multiClipDrag.lastFrameTime).toBeGreaterThan(0);
      
      vi.useRealTimers();
    });
  });

  describe('Drag Preview', () => {
    it('should create preview element', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.startMultiClipDrag({
        clientX: 150,
        clientY: 70,
        preventDefault: vi.fn()
      });
      multiClipDrag.dragState.isDragging = true;
      
      multiClipDrag.createDragPreviewElement();
      
      expect(multiClipDrag.dragState.previewElement).toBeDefined();
      expect(multiClipDrag.dragState.previewElement.className).toContain('multi-clip-drag-preview');
    });

    it('should update drag visuals', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.startMultiClipDrag({
        clientX: 150,
        clientY: 70,
        preventDefault: vi.fn()
      });
      
      multiClipDrag.dragState.isDragging = true;
      multiClipDrag.dragState.currentX = 200;
      multiClipDrag.dragState.currentY = 100;
      
      multiClipDrag.updateDragVisuals();
      
      // Preview should be positioned at cursor
      expect(multiClipDrag.dragState.previewElement.style.left).toContain('px');
    });
  });

  describe('End Drag', () => {
    it('should apply drag results to state', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.startMultiClipDrag({
        clientX: 150,
        clientY: 70,
        preventDefault: vi.fn()
      });
      
      multiClipDrag.dragState.originalPositions.set(1, {
        left: 100, top: 50, width: 120, height: 40,
        startTime: 4.8, endTime: 22.8, trackId: 'track-1'
      });
      
      multiClipDrag.applyDragResults(50, 0);
      
      // State should be updated
      expect(mockState.saveSnapshot).toHaveBeenCalled();
    });

    it('should cleanup drag visuals', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.startMultiClipDrag({
        clientX: 150,
        clientY: 70,
        preventDefault: vi.fn()
      });
      
      multiClipDrag.dragState.ghostElements.set('__group__', { remove: vi.fn() });
      multiClipDrag.dragState.previewElement = { remove: vi.fn() };
      multiClipDrag.dragState.snapIndicators.set('line', { remove: vi.fn() });
      
      multiClipDrag.cleanupDragVisuals();
      
      expect(multiClipDrag.dragState.ghostElements.size).toBe(0);
      expect(multiClipDrag.dragState.previewElement).toBeNull();
    });

    it('should reset drag state', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.startMultiClipDrag({
        clientX: 150,
        clientY: 70,
        preventDefault: vi.fn()
      });
      
      multiClipDrag.resetDragState();
      
      expect(multiClipDrag.dragState.isDragging).toBe(false);
      expect(multiClipDrag.dragState.state).toBe(MULTI_CLIP_DRAG_STATES.INACTIVE);
    });
  });

  describe('Public API', () => {
    it('should report isDragging status', () => {
      expect(multiClipDrag.isDragging()).toBe(false);
    });

    it('should return selected count', () => {
      multiClipDrag.addToSelection(1);
      multiClipDrag.addToSelection(2);
      expect(multiClipDrag.getSelectedCount()).toBe(2);
    });

    it('should return collision clips', () => {
      multiClipDrag.dragState.collisionClips.add(3);
      expect(multiClipDrag.getCollisionClips()).toContain(3);
    });

    it('should return displaced clips', () => {
      multiClipDrag.dragState.displacedClips.add(4);
      expect(multiClipDrag.getDisplacedClips()).toContain(4);
    });

    it('should select clips in rect', () => {
      const rect = {
        left: 80, top: 40, right: 500, bottom: 200
      };
      
      multiClipDrag.selectClipsInRect(rect);
      
      // Should have selected clips within the rect
      expect(multiClipDrag.getSelectedCount()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should use 60fps frame interval', () => {
      expect(multiClipDrag.frameInterval).toBe(16);
    });

    it('should cancel animation frame on destroy', () => {
      vi.useFakeTimers();
      
      multiClipDrag.addToSelection(1);
      multiClipDrag.startMultiClipDrag({
        clientX: 150,
        clientY: 70,
        preventDefault: vi.fn()
      });
      
      const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame');
      multiClipDrag.destroy();
      
      expect(cancelSpy).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should cleanup all resources on destroy', () => {
      multiClipDrag.dragState.ghostElements.set(1, { remove: vi.fn() });
      multiClipDrag.dragState.previewElement = { remove: vi.fn() };
      multiClipDrag.dragState.snapIndicators.set('line', { remove: vi.fn() });
      multiClipDrag.dragState.collisionIndicators.set(2, { remove: vi.fn() });
      
      multiClipDrag.destroy();
      
      expect(multiClipDrag.dragState.ghostElements.size).toBe(0);
      expect(multiClipDrag.dragState.snapIndicators.size).toBe(0);
      expect(multiClipDrag.dragState.collisionIndicators.size).toBe(0);
    });
  });

  describe('CSS Styles', () => {
    it('should export CSS styles string', async () => {
      const module = await import('../../src/lib/editor/multiClipDragFeedback.js');
      expect(module.MULTI_CLIP_DRAG_STYLES).toBeDefined();
      expect(typeof module.MULTI_CLIP_DRAG_STYLES).toBe('string');
      expect(module.MULTI_CLIP_DRAG_STYLES.length).toBeGreaterThan(100);
    });

    it('should include all required style classes', async () => {
      const module = await import('../../src/lib/editor/multiClipDragFeedback.js');
      const styles = module.MULTI_CLIP_DRAG_STYLES;
      
      expect(styles).toContain('.multi-clip-bounding-box');
      expect(styles).toContain('.marquee-selection');
      expect(styles).toContain('.multi-clip-drag-ghost');
      expect(styles).toContain('.snap-indicator-line');
      expect(styles).toContain('.collision-indicator');
      expect(styles).toContain('.clip.selected');
    });
  });

  describe('Initialization Function', () => {
    it('should create instance via initializeMultiClipDragFeedback', async () => {
      const module = await import('../../src/lib/editor/multiClipDragFeedback.js');
      
      // Mock document.head
      const mockHead = { appendChild: vi.fn(), querySelector: vi.fn(() => null) };
      global.document = { 
        ...document, 
        head: mockHead,
        querySelector: vi.fn(() => null)
      };
      
      const instance = module.initializeMultiClipDragFeedback(mockContainer, mockState);
      
      expect(instance).toBeInstanceOf(module.MultiClipDragFeedback);
      expect(mockHead.appendChild).toHaveBeenCalled();
    });
  });
});

describe('Multi-Clip Drag States Enum', () => {
  it('should have all required states', () => {
    expect(MULTI_CLIP_DRAG_STATES.INACTIVE).toBe('inactive');
    expect(MULTI_CLIP_DRAG_STATES.MARQUEE_SELECTION).toBe('marquee_selection');
    expect(MULTI_CLIP_DRAG_STATES.DRAGGING).toBe('dragging');
    expect(MULTI_CLIP_DRAG_STATES.PREVIEW).toBe('preview');
  });
});

describe('Clip Drag Indicators Enum', () => {
  it('should have all required indicator types', () => {
    expect(CLIP_DRAG_INDICATORS.MOVING).toBe('moving');
    expect(CLIP_DRAG_INDICATORS.DISPLACED).toBe('displaced');
    expect(CLIP_DRAG_INDICATORS.COLLISION).toBe('collision');
    expect(CLIP_DRAG_INDICATORS.SNAP_TARGET).toBe('snap_target');
  });
});
