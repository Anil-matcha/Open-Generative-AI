/**
 * Multi-Clip Drag Feedback System
 * Provides professional NLE-style drag feedback for multi-clip selections including:
 * - Multi-select bounding box visualization
 * - Drag preview showing clip arrangement changes
 * - Collision detection and highlighting
 * - Group selection box during drag
 * - Snap preview with visual indicators
 * - Visual indicators for affected/displaced clips
 * 
 * Optimized for 60fps performance using requestAnimationFrame
 */

import { snapMoveTime } from './timelinePlayback.js';

export const MULTI_CLIP_DRAG_STATES = {
  INACTIVE: 'inactive',
  MARQUEE_SELECTION: 'marquee_selection',
  DRAGGING: 'dragging',
  PREVIEW: 'preview'
};

export const CLIP_DRAG_INDICATORS = {
  MOVING: 'moving',           // Clips being moved by user
  DISPLACED: 'displaced',     // Clips that will be pushed/shifted
  COLLISION: 'collision',     // Clips that would overlap
  SNAP_TARGET: 'snap_target'  // Snap destination points
};

class MultiClipDragFeedback {
  constructor(timelineContainer, state, options = {}) {
    this.timelineContainer = timelineContainer;
    this.state = state;
    
    this.options = {
      snapThreshold: 10,
      snapMagneticPull: 20,
      minDragDistance: 5,
      boundingBoxPadding: 4,
      collisionDetectionBuffer: 2,
      marqueeMinSize: 10,
      ...options
    };
    
    this.dragState = {
      state: MULTI_CLIP_DRAG_STATES.INACTIVE,
      selectedClipIds: new Set(),
      draggedClipIds: new Set(),
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      marqueeStart: null,
      marqueeEnd: null,
      originalPositions: new Map(),
      currentPositions: new Map(),
      collisionClips: new Set(),
      displacedClips: new Set(),
      snapTargets: [],
      activeSnapTarget: null,
      ghostElements: new Map(),
      boundingBox: null,
      previewElement: null,
      snapIndicators: new Map(),
      collisionIndicators: new Map()
    };
    
    this.animationFrame = null;
    this.lastFrameTime = 0;
    this.frameInterval = 16; // ~60fps
    
    this.initialize();
  }
  
  initialize() {
    this.setupEventListeners();
    this.buildSnapPoints();
  }
  
  setupEventListeners() {
    this.timelineContainer.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    document.addEventListener('pointermove', this.handlePointerMove.bind(this));
    document.addEventListener('pointerup', this.handlePointerUp.bind(this));
    document.addEventListener('pointercancel', this.handlePointerUp.bind(this));
  }
  
  handlePointerDown(e) {
    const clipEl = e.target.closest('.clip');
    if (!clipEl) return;
    
    const clipId = clipEl.dataset.itemId || clipEl.dataset.clipId;
    if (!clipId) return;
    
    // Check for multi-select modifier keys
    const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
    
    // If clicking on a non-selected clip with multi-select, add to selection
    if (isMultiSelect && !this.dragState.selectedClipIds.has(clipId)) {
      this.addToSelection(clipId);
      e.preventDefault();
      return;
    }
    
    // If already dragging, ignore
    if (this.dragState.state !== MULTI_CLIP_DRAG_STATES.INACTIVE) return;
    
    // Start marquee or drag based on selection
    if (this.dragState.selectedClipIds.size > 1) {
      this.startMultiClipDrag(e);
    } else {
      // Single clip - start marquee or direct drag
      this.dragState.selectedClipIds.add(clipId);
      this.startMultiClipDrag(e);
    }
  }
  
  handlePointerMove(e) {
    if (this.dragState.state === MULTI_CLIP_DRAG_STATES.MARQUEE_SELECTION) {
      this.updateMarqueeSelection(e);
    } else if (this.dragState.state === MULTI_CLIP_DRAG_STATES.DRAGGING) {
      this.updateDragPosition(e);
    }
  }
  
  handlePointerUp(e) {
    if (this.dragState.state === MULTI_CLIP_DRAG_STATES.MARQUEE_SELECTION) {
      this.endMarqueeSelection(e);
    } else if (this.dragState.state === MULTI_CLIP_DRAG_STATES.DRAGGING) {
      this.endDrag(e);
    }
  }
  
  // Selection Management
  addToSelection(clipId) {
    this.dragState.selectedClipIds.add(clipId);
    this.updateSelectionVisuals();
  }
  
  removeFromSelection(clipId) {
    this.dragState.selectedClipIds.delete(clipId);
    this.updateSelectionVisuals();
  }
  
  clearSelection() {
    this.dragState.selectedClipIds.clear();
    this.updateSelectionVisuals();
  }
  
  toggleSelection(clipId) {
    if (this.dragState.selectedClipIds.has(clipId)) {
      this.removeFromSelection(clipId);
    } else {
      this.addToSelection(clipId);
    }
  }
  
  selectAllClips() {
    const allClipIds = this.getAllClipIds();
    allClipIds.forEach(id => this.dragState.selectedClipIds.add(id));
    this.updateSelectionVisuals();
  }
  
  getAllClipIds() {
    const ids = [];
    this.state.tracks.forEach(track => {
      track.items?.forEach(item => ids.push(item.id));
      track.clips?.forEach(clip => ids.push(clip.id));
    });
    return ids;
  }
  
  getSelectedClips() {
    const clips = [];
    this.state.tracks.forEach(track => {
      const items = track.items || track.clips || [];
      items.forEach(item => {
        if (this.dragState.selectedClipIds.has(item.id)) {
          clips.push({ ...item, trackId: track.id, track });
        }
      });
    });
    return clips;
  }
  
  updateSelectionVisuals() {
    // Remove all selection highlights
    this.timelineContainer.querySelectorAll('.clip.selected').forEach(el => {
      el.classList.remove('selected');
    });
    
    // Add selection highlights to selected clips
    this.dragState.selectedClipIds.forEach(clipId => {
      const clipEl = this.timelineContainer.querySelector(
        `.clip[data-item-id="${clipId}"], .clip[data-clip-id="${clipId}"]`
      );
      if (clipEl) {
        clipEl.classList.add('selected');
      }
    });
    
    // Update bounding box if we have a selection
    if (this.dragState.selectedClipIds.size > 0) {
      this.updateBoundingBox();
    } else {
      this.clearBoundingBox();
    }
  }
  
  // Bounding Box
  calculateBoundingBox(clipIds = this.dragState.selectedClipIds) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    clipIds.forEach(clipId => {
      const clipEl = this.timelineContainer.querySelector(
        `.clip[data-item-id="${clipId}"], .clip[data-clip-id="${clipId}"]`
      );
      if (!clipEl) return;
      
      const rect = clipEl.getBoundingClientRect();
      const containerRect = this.timelineContainer.getBoundingClientRect();
      
      const relativeLeft = rect.left - containerRect.left;
      const relativeTop = rect.top - containerRect.top;
      const relativeRight = rect.right - containerRect.left;
      const relativeBottom = rect.bottom - containerRect.top;
      
      minX = Math.min(minX, relativeLeft);
      minY = Math.min(minY, relativeTop);
      maxX = Math.max(maxX, relativeRight);
      maxY = Math.max(maxY, relativeBottom);
    });
    
    return {
      left: minX - this.options.boundingBoxPadding,
      top: minY - this.options.boundingBoxPadding,
      right: maxX + this.options.boundingBoxPadding,
      bottom: maxY + this.options.boundingBoxPadding,
      width: maxX - minX + this.options.boundingBoxPadding * 2,
      height: maxY - minY + this.options.boundingBoxPadding * 2
    };
  }
  
  updateBoundingBox() {
    const bbox = this.calculateBoundingBox();
    this.dragState.boundingBox = bbox;
    
    // Create or update bounding box element
    let bboxEl = this.timelineContainer.querySelector('.multi-clip-bounding-box');
    if (!bboxEl) {
      bboxEl = document.createElement('div');
      bboxEl.className = 'multi-clip-bounding-box';
      this.timelineContainer.appendChild(bboxEl);
    }
    
    bboxEl.style.left = `${bbox.left}px`;
    bboxEl.style.top = `${bbox.top}px`;
    bboxEl.style.width = `${bbox.width}px`;
    bboxEl.style.height = `${bbox.height}px`;
    bboxEl.style.display = 'block';
  }
  
  clearBoundingBox() {
    const bboxEl = this.timelineContainer.querySelector('.multi-clip-bounding-box');
    if (bboxEl) {
      bboxEl.remove();
    }
    this.dragState.boundingBox = null;
  }
  
  // Marquee Selection
  startMarqueeSelection(e) {
    const rect = this.timelineContainer.getBoundingClientRect();
    this.dragState.state = MULTI_CLIP_DRAG_STATES.MARQUEE_SELECTION;
    this.dragState.marqueeStart = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    this.dragState.marqueeEnd = { ...this.dragState.marqueeStart };
    
    this.createMarqueeElement();
  }
  
  createMarqueeElement() {
    let marqueeEl = this.timelineContainer.querySelector('.marquee-selection');
    if (!marqueeEl) {
      marqueeEl = document.createElement('div');
      marqueeEl.className = 'marquee-selection';
      this.timelineContainer.appendChild(marqueeEl);
    }
    return marqueeEl;
  }
  
  updateMarqueeSelection(e) {
    const rect = this.timelineContainer.getBoundingClientRect();
    this.dragState.marqueeEnd = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const marqueeEl = this.createMarqueeElement();
    const start = this.dragState.marqueeStart;
    const end = this.dragState.marqueeEnd;
    
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    
    marqueeEl.style.left = `${left}px`;
    marqueeEl.style.top = `${top}px`;
    marqueeEl.style.width = `${width}px`;
    marqueeEl.style.height = `${height}px`;
    
    // Find clips within marquee
    if (width > this.options.marqueeMinSize || height > this.options.marqueeMinSize) {
      this.selectClipsInMarquee(start, end);
    }
  }
  
  selectClipsInMarquee(start, end) {
    const rect = this.timelineContainer.getBoundingClientRect();
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const right = Math.max(start.x, end.x);
    const bottom = Math.max(start.y, end.y);
    
    this.timelineContainer.querySelectorAll('.clip').forEach(clipEl => {
      const clipRect = clipEl.getBoundingClientRect();
      const clipLeft = clipRect.left - rect.left;
      const clipTop = clipRect.top - rect.top;
      const clipRight = clipRect.right - rect.left;
      const clipBottom = clipRect.bottom - rect.top;
      
      // Check intersection
      const intersects = !(clipRight < left || clipLeft > right || clipBottom < top || clipTop > bottom);
      
      const clipId = clipEl.dataset.itemId || clipEl.dataset.clipId;
      if (intersects && clipId) {
        clipEl.classList.add('marquee-selected');
      } else {
        clipEl.classList.remove('marquee-selected');
      }
    });
  }
  
  endMarqueeSelection(e) {
    // Select all marquee-selected clips
    this.timelineContainer.querySelectorAll('.clip.marquee-selected').forEach(clipEl => {
      const clipId = clipEl.dataset.itemId || clipEl.dataset.clipId;
      if (clipId) {
        this.dragState.selectedClipIds.add(clipId);
      }
      clipEl.classList.remove('marquee-selected');
    });
    
    // Remove marquee element
    const marqueeEl = this.timelineContainer.querySelector('.marquee-selection');
    if (marqueeEl) {
      marqueeEl.remove();
    }
    
    this.dragState.state = MULTI_CLIP_DRAG_STATES.INACTIVE;
    this.updateSelectionVisuals();
  }
  
  // Multi-Clip Drag
  startMultiClipDrag(e) {
    const selectedClips = this.getSelectedClips();
    if (selectedClips.length === 0) return;
    
    const rect = this.timelineContainer.getBoundingClientRect();
    this.dragState.state = MULTI_CLIP_DRAG_STATES.DRAGGING;
    this.dragState.isDragging = true;
    this.dragState.startX = e.clientX;
    this.dragState.startY = e.clientY;
    this.dragState.currentX = e.clientX;
    this.dragState.currentY = e.clientY;
    
    // Store original positions of selected clips
    this.dragState.originalPositions.clear();
    selectedClips.forEach(clip => {
      const clipEl = this.timelineContainer.querySelector(
        `.clip[data-item-id="${clip.id}"], .clip[data-clip-id="${clip.id}"]`
      );
      if (clipEl) {
        const clipRect = clipEl.getBoundingClientRect();
        this.dragState.originalPositions.set(clip.id, {
          left: clipRect.left,
          top: clipRect.top,
          width: clipRect.width,
          height: clipRect.height,
          startTime: clip.start,
          endTime: clip.end,
          trackId: clip.trackId
        });
        this.dragState.draggedClipIds.add(clip.id);
      }
    });
    
    // Calculate group bounding box
    this.updateBoundingBox();
    
    // Create ghost elements for all selected clips
    this.createGhostElements();
    
    // Start drag animation loop
    this.startDragAnimationLoop();
    
    // Prevent text selection
    e.preventDefault();
  }
  
  createGhostElements() {
    this.dragState.ghostElements.clear();
    
    this.dragState.originalPositions.forEach((pos, clipId) => {
      const ghostEl = document.createElement('div');
      ghostEl.className = 'multi-clip-drag-ghost';
      ghostEl.dataset.clipId = clipId;
      ghostEl.style.left = `${pos.left}px`;
      ghostEl.style.top = `${pos.top}px`;
      ghostEl.style.width = `${pos.width}px`;
      ghostEl.style.height = `${pos.height}px`;
      ghostEl.style.opacity = '0.7';
      
      // Copy clip content
      const originalEl = this.timelineContainer.querySelector(
        `.clip[data-item-id="${clipId}"], .clip[data-clip-id="${clipId}"]`
      );
      if (originalEl) {
        ghostEl.innerHTML = originalEl.innerHTML;
      }
      
      document.body.appendChild(ghostEl);
      this.dragState.ghostElements.set(clipId, ghostEl);
    });
    
    // Create group bounding box ghost
    if (this.dragState.boundingBox) {
      const groupGhost = document.createElement('div');
      groupGhost.className = 'multi-clip-drag-group-ghost';
      groupGhost.style.left = `${this.dragState.boundingBox.left}px`;
      groupGhost.style.top = `${this.dragState.boundingBox.top}px`;
      groupGhost.style.width = `${this.dragState.boundingBox.width}px`;
      groupGhost.style.height = `${this.dragState.boundingBox.height}px`;
      document.body.appendChild(groupGhost);
      this.dragState.ghostElements.set('__group__', groupGhost);
    }
  }
  
  startDragAnimationLoop() {
    this.lastFrameTime = performance.now();
    this.animationFrame = requestAnimationFrame(this.dragAnimationLoop.bind(this));
  }
  
  dragAnimationLoop(timestamp) {
    if (!this.dragState.isDragging) return;
    
    const elapsed = timestamp - this.lastFrameTime;
    
    if (elapsed >= this.frameInterval) {
      this.lastFrameTime = timestamp;
      this.updateDragVisuals();
    }
    
    this.animationFrame = requestAnimationFrame(this.dragAnimationLoop.bind(this));
  }
  
  updateDragPosition(e) {
    this.dragState.currentX = e.clientX;
    this.dragState.currentY = e.clientY;
    
    // Calculate delta from original position
    const deltaX = this.dragState.currentX - this.dragState.startX;
    const deltaY = this.dragState.currentY - this.dragState.startY;
    
    // Check if we've moved enough to start dragging
    if (!this.dragState.isDragging && (
      Math.abs(deltaX) > this.options.minDragDistance ||
      Math.abs(deltaY) > this.options.minDragDistance
    )) {
      this.dragState.isDragging = true;
      this.createDragPreviewElement();
    }
    
    if (this.dragState.isDragging) {
      // Update ghost positions
      this.updateGhostPositions(deltaX, deltaY);
      
      // Detect collisions
      this.detectCollisions(deltaX, deltaY);
      
      // Update snap indicators
      this.updateSnapIndicators(deltaX, deltaY);
    }
  }
  
  updateGhostPositions(deltaX, deltaY) {
    this.dragState.originalPositions.forEach((pos, clipId) => {
      const ghostEl = this.dragState.ghostElements.get(clipId);
      if (ghostEl) {
        ghostEl.style.left = `${pos.left + deltaX}px`;
        ghostEl.style.top = `${pos.top + deltaY}px`;
      }
    });
    
    // Update group ghost
    const groupGhost = this.dragState.ghostElements.get('__group__');
    if (groupGhost && this.dragState.boundingBox) {
      groupGhost.style.left = `${this.dragState.boundingBox.left + deltaX}px`;
      groupGhost.style.top = `${this.dragState.boundingBox.top + deltaY}px`;
    }
  }
  
  // Collision Detection
  detectCollisions(deltaX, deltaY) {
    this.dragState.collisionClips.clear();
    this.dragState.displacedClips.clear();
    
    const selectedSet = this.dragState.draggedClipIds;
    
    // Get all non-selected clips
    this.state.tracks.forEach(track => {
      const items = track.items || track.clips || [];
      items.forEach(item => {
        if (selectedSet.has(item.id)) return;
        
        const itemEl = this.timelineContainer.querySelector(
          `.clip[data-item-id="${item.id}"], .clip[data-clip-id="${item.id}"]`
        );
        if (!itemEl) return;
        
        const itemRect = itemEl.getBoundingClientRect();
        
        // Check against each dragged clip's new position
        let collision = false;
        let displacement = false;
        
        this.dragState.originalPositions.forEach((dragPos, dragId) => {
          const newLeft = dragPos.left + deltaX;
          const newRight = newLeft + dragPos.width;
          const newTop = dragPos.top + deltaY;
          const newBottom = newTop + dragPos.height;
          
          // Check collision (overlap)
          if (!(newRight < itemRect.left + this.options.collisionDetectionBuffer ||
                newLeft > itemRect.right - this.options.collisionDetectionBuffer ||
                newBottom < itemRect.top + this.options.collisionDetectionBuffer ||
                newTop > itemRect.bottom - this.options.collisionDetectionBuffer)) {
            collision = true;
          }
          
          // Check if this item would be displaced (pushed by dragged clips)
          // This happens when dragged clips are moving towards this clip's position
          if (dragPos.top === itemRect.top && // Same track
              ((newRight > itemRect.left - 5 && newRight < itemRect.left + 5) ||
               (newLeft < itemRect.right + 5 && newLeft > itemRect.right - 5))) {
            displacement = true;
          }
        });
        
        if (collision) {
          this.dragState.collisionClips.add(item.id);
          this.showCollisionIndicator(itemEl, item.id);
        }
        
        if (displacement) {
          this.dragState.displacedClips.add(item.id);
        }
      });
    });
  }
  
  showCollisionIndicator(clipEl, clipId) {
    let indicator = this.dragState.collisionIndicators.get(clipId);
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'collision-indicator';
      indicator.innerHTML = '<span class="collision-icon">⚠️</span>';
      clipEl.appendChild(indicator);
      this.dragState.collisionIndicators.set(clipId, indicator);
    }
    indicator.classList.add('active');
  }
  
  hideCollisionIndicator(clipId) {
    const indicator = this.dragState.collisionIndicators.get(clipId);
    if (indicator) {
      indicator.classList.remove('active');
    }
  }
  
  clearCollisionIndicators() {
    this.dragState.collisionIndicators.forEach((indicator, clipId) => {
      indicator.remove();
    });
    this.dragState.collisionIndicators.clear();
  }
  
  // Snap Detection
  buildSnapPoints() {
    this.dragState.snapTargets = [];
    
    // Add clip start/end points
    this.state.tracks.forEach(track => {
      const items = track.items || track.clips || [];
      items.forEach(item => {
        if (item.start !== undefined) {
          this.dragState.snapTargets.push({
            time: item.start,
            type: 'clip-start',
            trackId: track.id,
            clipId: item.id
          });
        }
        if (item.end !== undefined) {
          this.dragState.snapTargets.push({
            time: item.end,
            type: 'clip-end',
            trackId: track.id,
            clipId: item.id
          });
        }
      });
    });
    
    // Add playhead position
    this.dragState.snapTargets.push({
      time: (this.state.playheadPercent / 100) * this.state.timelineSeconds,
      type: 'playhead',
      trackId: null,
      clipId: null
    });
    
    // Add timeline start/end
    this.dragState.snapTargets.push({
      time: 0,
      type: 'timeline-start',
      trackId: null,
      clipId: null
    });
    this.dragState.snapTargets.push({
      time: this.state.timelineSeconds,
      type: 'timeline-end',
      trackId: null,
      clipId: null
    });
    
    this.dragState.snapTargets.sort((a, b) => a.time - b.time);
  }
  
  findSnapTarget(deltaX, deltaY) {
    if (this.dragState.snapTargets.length === 0) return null;
    
    // Get the first dragged clip's position
    let firstDragPos = null;
    this.dragState.originalPositions.forEach(pos => {
      if (!firstDragPos) firstDragPos = pos;
    });
    if (!firstDragPos) return null;
    
    const timelineRect = this.timelineContainer.getBoundingClientRect();
    const pixelsPerSecond = timelineRect.width / this.state.timelineSeconds;
    
    // Calculate new start time based on delta
    const deltaTime = deltaX / pixelsPerSecond;
    const newStartTime = (firstDragPos.left - timelineRect.left) / pixelsPerSecond + deltaTime;
    
    let closestTarget = null;
    let closestDistance = this.options.snapThreshold / 100 * pixelsPerSecond;
    
    for (const target of this.dragState.snapTargets) {
      // Don't snap to clips that are being dragged
      if (this.dragState.draggedClipIds.has(target.clipId)) continue;
      
      const targetX = timelineRect.left + (target.time / this.state.timelineSeconds) * timelineRect.width;
      const dragX = firstDragPos.left + deltaX;
      const distance = Math.abs(targetX - dragX);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    }
    
    return closestTarget;
  }
  
  updateSnapIndicators(deltaX, deltaY) {
    const snapTarget = this.findSnapTarget(deltaX, deltaY);
    this.dragState.activeSnapTarget = snapTarget;
    
    if (snapTarget) {
      this.showSnapIndicator(snapTarget);
    } else {
      this.hideAllSnapIndicators();
    }
  }
  
  showSnapIndicator(target) {
    // Remove existing indicators
    this.hideAllSnapIndicators();
    
    const timelineRect = this.timelineContainer.getBoundingClientRect();
    const x = (target.time / this.state.timelineSeconds) * timelineRect.width;
    
    // Create snap line
    const snapLine = document.createElement('div');
    snapLine.className = 'snap-indicator-line';
    snapLine.style.left = `${x}px`;
    snapLine.style.top = '0';
    snapLine.style.height = `${timelineRect.height}px`;
    
    // Create snap point marker
    const snapPoint = document.createElement('div');
    snapPoint.className = 'snap-indicator-point';
    snapPoint.style.left = `${x}px`;
    snapPoint.style.top = '0';
    snapPoint.innerHTML = `<span class="snap-label">${this.getSnapLabel(target)}</span>`;
    
    this.timelineContainer.appendChild(snapLine);
    this.timelineContainer.appendChild(snapPoint);
    
    this.dragState.snapIndicators.set('line', snapLine);
    this.dragState.snapIndicators.set('point', snapPoint);
  }
  
  getSnapLabel(target) {
    switch (target.type) {
      case 'clip-start': return 'Clip Start';
      case 'clip-end': return 'Clip End';
      case 'playhead': return 'Playhead';
      case 'timeline-start': return 'Start';
      case 'timeline-end': return 'End';
      default: return 'Snap';
    }
  }
  
  hideAllSnapIndicators() {
    this.dragState.snapIndicators.forEach(el => el.remove());
    this.dragState.snapIndicators.clear();
  }
  
  // Drag Preview Element
  createDragPreviewElement() {
    if (this.dragState.previewElement) return;
    
    const preview = document.createElement('div');
    preview.className = 'multi-clip-drag-preview';
    preview.innerHTML = `
      <div class="preview-content">
        <span class="preview-count">${this.dragState.draggedClipIds.size} clips</span>
        <span class="preview-hint">Drop to move</span>
      </div>
    `;
    
    document.body.appendChild(preview);
    this.dragState.previewElement = preview;
  }
  
  updateDragVisuals() {
    if (!this.dragState.isDragging) return;
    
    const deltaX = this.dragState.currentX - this.dragState.startX;
    const deltaY = this.dragState.currentY - this.dragState.startY;
    
    // Update preview position
    if (this.dragState.previewElement) {
      this.dragState.previewElement.style.left = `${this.dragState.currentX + 20}px`;
      this.dragState.previewElement.style.top = `${this.dragState.currentY + 20}px`;
    }
    
    // Update bounding box position
    const bboxEl = this.timelineContainer.querySelector('.multi-clip-bounding-box');
    if (bboxEl && this.dragState.boundingBox) {
      bboxEl.style.left = `${this.dragState.boundingBox.left + deltaX}px`;
      bboxEl.style.top = `${this.dragState.boundingBox.top + deltaY}px`;
    }
    
    // Update collision indicators
    this.dragState.collisionClips.forEach(clipId => {
      const itemEl = this.timelineContainer.querySelector(
        `.clip[data-item-id="${clipId}"], .clip[data-clip-id="${clipId}"]`
      );
      if (itemEl) {
        itemEl.classList.add('collision');
      }
    });
    
    // Update displaced clips
    this.dragState.displacedClips.forEach(clipId => {
      const itemEl = this.timelineContainer.querySelector(
        `.clip[data-item-id="${clipId}"], .clip[data-clip-id="${clipId}"]`
      );
      if (itemEl) {
        itemEl.classList.add('displaced');
      }
    });
    
    // Update snap indicator position if snapping
    if (this.dragState.activeSnapTarget) {
      const timelineRect = this.timelineContainer.getBoundingClientRect();
      const x = (this.dragState.activeSnapTarget.time / this.state.timelineSeconds) * timelineRect.width;
      
      const line = this.dragState.snapIndicators.get('line');
      const point = this.dragState.snapIndicators.get('point');
      
      if (line) line.style.left = `${x}px`;
      if (point) point.style.left = `${x}px`;
    }
  }
  
  // End Drag
  endDrag(e) {
    if (!this.dragState.isDragging) {
      this.resetDragState();
      return;
    }
    
    const deltaX = this.dragState.currentX - this.dragState.startX;
    const deltaY = this.dragState.currentY - this.dragState.startY;
    
    // Calculate final snap adjustment
    let finalDeltaX = deltaX;
    if (this.dragState.activeSnapTarget) {
      // Adjust to snap position
      const timelineRect = this.timelineContainer.getBoundingClientRect();
      const pixelsPerSecond = timelineRect.width / this.state.timelineSeconds;
      const snapX = (this.dragState.activeSnapTarget.time / this.state.timelineSeconds) * timelineRect.width;
      const firstDragPos = this.dragState.originalPositions.values().next().value;
      finalDeltaX = snapX - (firstDragPos ? firstDragPos.left - timelineRect.left : 0);
    }
    
    // Apply final positions to state
    this.applyDragResults(finalDeltaX, deltaY);
    
    // Cleanup
    this.cleanupDragVisuals();
    this.resetDragState();
    
    // Trigger state update
    if (this.state.onMultiClipDragEnd) {
      this.state.onMultiClipDragEnd({
        clipIds: Array.from(this.dragState.draggedClipIds),
        deltaX: finalDeltaX,
        deltaY: deltaY,
        collisions: Array.from(this.dragState.collisionClips),
        displaced: Array.from(this.dragState.displacedClips)
      });
    }
  }
  
  applyDragResults(deltaX, deltaY) {
    const timelineRect = this.timelineContainer.getBoundingClientRect();
    const pixelsPerSecond = timelineRect.width / this.state.timelineSeconds;
    const deltaTime = deltaX / pixelsPerSecond;
    
    this.dragState.originalPositions.forEach((pos, clipId) => {
      this.state.tracks.forEach(track => {
        const items = track.items || track.clips || [];
        const item = items.find(i => i.id == clipId);
        if (item && item.start !== undefined) {
          // Save undo snapshot
          if (this.state.saveSnapshot) {
            this.state.saveSnapshot();
          }
          
          // Update position
          item.start = Math.max(0, item.start + deltaTime);
          if (item.end !== undefined) {
            item.end = item.end + deltaTime;
          }
        } else if (item && item.left !== undefined) {
          // Save undo snapshot
          if (this.state.saveSnapshot) {
            this.state.saveSnapshot();
          }
          
          // Update position in percentage-based format
          item.left = Math.max(0, item.left + (deltaTime / this.state.timelineSeconds) * 100);
        }
      });
    });
  }
  
  cleanupDragVisuals() {
    // Remove ghost elements
    this.dragState.ghostElements.forEach(ghost => ghost.remove());
    this.dragState.ghostElements.clear();
    
    // Remove preview element
    if (this.dragState.previewElement) {
      this.dragState.previewElement.remove();
      this.dragState.previewElement = null;
    }
    
    // Remove snap indicators
    this.hideAllSnapIndicators();
    
    // Remove collision indicators
    this.clearCollisionIndicators();
    
    // Remove collision/displayed classes
    this.timelineContainer.querySelectorAll('.clip.collision, .clip.displaced').forEach(el => {
      el.classList.remove('collision', 'displaced');
    });
  }
  
  resetDragState() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.dragState.state = MULTI_CLIP_DRAG_STATES.INACTIVE;
    this.dragState.isDragging = false;
    this.dragState.draggedClipIds.clear();
    this.dragState.originalPositions.clear();
    this.dragState.currentPositions.clear();
    this.dragState.collisionClips.clear();
    this.dragState.displacedClips.clear();
    this.dragState.activeSnapTarget = null;
    
    // Rebuild snap points for next drag
    this.buildSnapPoints();
  }
  
  // Public API
  selectClipsInRect(rect) {
    const containerRect = this.timelineContainer.getBoundingClientRect();
    const left = rect.left - containerRect.left;
    const top = rect.top - containerRect.top;
    const right = rect.right - containerRect.left;
    const bottom = rect.bottom - containerRect.top;
    
    this.timelineContainer.querySelectorAll('.clip').forEach(clipEl => {
      const clipRect = clipEl.getBoundingClientRect();
      const clipLeft = clipRect.left - containerRect.left;
      const clipTop = clipRect.top - containerRect.top;
      const clipRight = clipRect.right - containerRect.left;
      const clipBottom = clipRect.bottom - containerRect.top;
      
      const intersects = !(clipRight < left || clipLeft > right || clipBottom < top || clipTop > bottom);
      
      const clipId = clipEl.dataset.itemId || clipEl.dataset.clipId;
      if (intersects && clipId) {
        this.addToSelection(clipId);
      }
    });
    
    this.updateSelectionVisuals();
  }
  
  isDragging() {
    return this.dragState.isDragging;
  }
  
  getSelectedCount() {
    return this.dragState.selectedClipIds.size;
  }
  
  getCollisionClips() {
    return Array.from(this.dragState.collisionClips);
  }
  
  getDisplacedClips() {
    return Array.from(this.dragState.displacedClips);
  }
  
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.cleanupDragVisuals();
    this.clearBoundingBox();
    this.clearCollisionIndicators();
    
    document.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('pointerup', this.handlePointerUp);
    document.removeEventListener('pointercancel', this.handlePointerUp);
  }
}

// CSS Styles for multi-clip drag feedback
export const MULTI_CLIP_DRAG_STYLES = `
.multi-clip-bounding-box {
  position: absolute;
  border: 2px dashed rgba(34, 211, 238, 0.6);
  background: rgba(34, 211, 238, 0.08);
  border-radius: 6px;
  pointer-events: none;
  z-index: 50;
  transition: border-color 0.15s ease;
}

.multi-clip-bounding-box.dragging {
  border-color: rgba(34, 211, 238, 0.9);
  background: rgba(34, 211, 238, 0.12);
}

.marquee-selection {
  position: absolute;
  border: 1px solid rgba(34, 211, 238, 0.5);
  background: rgba(34, 211, 238, 0.1);
  border-radius: 4px;
  pointer-events: none;
  z-index: 100;
}

.multi-clip-drag-ghost {
  position: fixed;
  border: 1px solid rgba(34, 211, 238, 0.4);
  background: rgba(34, 211, 238, 0.15);
  border-radius: 8px;
  pointer-events: none;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.multi-clip-drag-group-ghost {
  position: fixed;
  border: 2px dashed rgba(34, 211, 238, 0.5);
  background: rgba(34, 211, 238, 0.08);
  border-radius: 10px;
  pointer-events: none;
  z-index: 999;
  opacity: 0.6;
}

.multi-clip-drag-preview {
  position: fixed;
  padding: 8px 12px;
  background: rgba(7, 12, 18, 0.95);
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 8px;
  pointer-events: none;
  z-index: 2000;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.multi-clip-drag-preview .preview-count {
  font-weight: 700;
  color: #22d3ee;
}

.multi-clip-drag-preview .preview-hint {
  margin-left: 8px;
  color: rgba(255, 255, 255, 0.5);
}

.snap-indicator-line {
  position: absolute;
  width: 1px;
  background: linear-gradient(to bottom, transparent, rgba(34, 211, 238, 0.8), transparent);
  pointer-events: none;
  z-index: 60;
}

.snap-indicator-point {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #22d3ee;
  border: 2px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 61;
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.8);
}

.snap-indicator-point .snap-label {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  padding: 2px 6px;
  background: rgba(34, 211, 238, 0.9);
  border-radius: 4px;
  font-size: 9px;
  white-space: nowrap;
  color: #03131a;
  font-weight: 600;
}

.collision-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: rgba(239, 68, 68, 0.9);
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  z-index: 10;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.collision-indicator.active {
  opacity: 1;
  transform: scale(1);
  animation: collision-pulse 0.3s ease infinite alternate;
}

@keyframes collision-pulse {
  from { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
  to { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}

.clip.collision {
  border-color: rgba(239, 68, 68, 0.7) !important;
  background: rgba(239, 68, 68, 0.15) !important;
}

.clip.displaced {
  border-color: rgba(251, 191, 36, 0.7) !important;
  background: rgba(251, 191, 36, 0.1) !important;
}

.clip.selected {
  border-color: rgba(34, 211, 238, 0.8) !important;
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.4);
}

.clip.marquee-selected {
  border-color: rgba(34, 211, 238, 0.5);
  background: rgba(34, 211, 238, 0.1);
}
`;

export function initializeMultiClipDragFeedback(timelineContainer, state, options = {}) {
  // Inject styles
  if (!document.querySelector('#multi-clip-drag-styles')) {
    const style = document.createElement('style');
    style.id = 'multi-clip-drag-styles';
    style.textContent = MULTI_CLIP_DRAG_STYLES;
    document.head.appendChild(style);
  }
  
  // Create and return the feedback controller
  return new MultiClipDragFeedback(timelineContainer, state, options);
}

export default MultiClipDragFeedback;
