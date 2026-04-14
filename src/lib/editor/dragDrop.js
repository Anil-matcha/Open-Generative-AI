/**
 * Drag and Drop Module
 * Handles comprehensive drag and drop functionality for clips, media library items, and tooltips
 */

import { showToast } from '../loading.js';

// Drag state management
const dragState = {
  isDragging: false,
  dragType: null, // 'clip', 'media-item'
  draggedElement: null,
  originalElement: null,
  dragData: null,
  dropZones: [],
  ghostElement: null,
  tooltipElement: null,
  initialized: false
};

// Enhanced tooltip system
export function createTooltip(content, position = { x: 0, y: 0 }) {
  removeTooltip();

  const tooltip = document.createElement('div');
  tooltip.className = 'drag-tooltip';
  tooltip.innerHTML = content;
  tooltip.style.left = `${position.x + 10}px`;
  tooltip.style.top = `${position.y + 10}px`;

  document.body.appendChild(tooltip);
  dragState.tooltipElement = tooltip;

  return tooltip;
}

export function updateTooltip(position, content = null) {
  if (!dragState.tooltipElement) return;

  dragState.tooltipElement.style.left = `${position.x + 10}px`;
  dragState.tooltipElement.style.top = `${position.y + 10}px`;

  if (content) {
    dragState.tooltipElement.innerHTML = content;
  }
}

export function removeTooltip() {
  if (dragState.tooltipElement) {
    dragState.tooltipElement.remove();
    dragState.tooltipElement = null;
  }
}

// Clip drag and drop functionality
export function initializeClipDragDrop(state, els) {
  console.log('[DragDrop] Initializing clip drag and drop functionality');

  // Prevent multiple initializations
  if (dragState.initialized) {
    console.log('[DragDrop] Already initialized, skipping');
    return;
  }

  // Add drag listeners to existing clips
  document.addEventListener('mousedown', handleClipMouseDown);
  document.addEventListener('mousemove', handleClipMouseMove);
  document.addEventListener('mouseup', handleClipMouseUp);

  // Setup drop zones for tracks
  setupTrackDropZones(state, els);

  dragState.initialized = true;
  console.log('[DragDrop] Clip drag and drop initialized successfully');
}

function handleClipMouseDown(e) {
  const clipEl = e.target.closest('.clip');
  if (!clipEl || e.button !== 0) return; // Only left mouse button

  console.log('[DragDrop] Clip mousedown detected on clip:', clipEl.dataset.itemId);

  const rect = clipEl.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  dragState.isDragging = false; // Will be set to true on mousemove
  dragState.dragType = 'clip';
  dragState.draggedElement = clipEl;
  dragState.dragData = {
    offsetX,
    offsetY,
    startX: e.clientX,
    startY: e.clientY,
    itemId: clipEl.dataset.itemId,
    trackId: clipEl.dataset.trackId
  };

  console.log('[DragDrop] Drag state initialized:', {
    itemId: clipEl.dataset.itemId,
    trackId: clipEl.dataset.trackId,
    startX: e.clientX,
    startY: e.clientY
  });

  // Prevent text selection during drag
  e.preventDefault();
}

function handleClipMouseMove(e) {
  if (!dragState.draggedElement || dragState.dragType !== 'clip') return;

  const deltaX = Math.abs(e.clientX - dragState.dragData.startX);
  const deltaY = Math.abs(e.clientY - dragState.dragData.startY);

  // Start dragging only if moved more than threshold
  if (!dragState.isDragging && (deltaX > 5 || deltaY > 5)) {
    console.log('[DragDrop] Starting drag after threshold exceeded:', { deltaX, deltaY });
    startClipDrag();
  }

  if (dragState.isDragging) {
    updateClipDrag(e);
  }
}

function startClipDrag() {
  console.log('[DragDrop] Starting clip drag');
  dragState.isDragging = true;

  const clipEl = dragState.draggedElement;
  const rect = clipEl.getBoundingClientRect();

  console.log('[DragDrop] Creating ghost element for clip:', rect);

  // Create ghost element
  dragState.ghostElement = clipEl.cloneNode(true);
  dragState.ghostElement.classList.add('dragging-ghost');
  dragState.ghostElement.style.width = `${rect.width}px`;
  dragState.ghostElement.style.height = `${rect.height}px`;
  dragState.ghostElement.style.position = 'fixed';
  dragState.ghostElement.style.pointerEvents = 'none';
  dragState.ghostElement.style.zIndex = '1000';
  dragState.ghostElement.style.opacity = '0.8';

  document.body.appendChild(dragState.ghostElement);
  console.log('[DragDrop] Ghost element added to DOM');

  // Hide original element
  clipEl.style.opacity = '0.3';
  console.log('[DragDrop] Original clip opacity set to 0.3');

  // Show tooltip with clip info
  const itemId = dragState.dragData.itemId;
  const trackId = dragState.dragData.trackId;
  const tooltipContent = createTooltipContent('clip', { itemId, trackId });
  createTooltip(tooltipContent, { x: dragState.dragData.startX, y: dragState.dragData.startY });
  console.log('[DragDrop] Tooltip created');
}

function updateClipDrag(e) {
  if (!dragState.ghostElement) return;

  const offsetX = dragState.dragData.offsetX;
  const offsetY = dragState.dragData.offsetY;

  dragState.ghostElement.style.left = `${e.clientX - offsetX}px`;
  dragState.ghostElement.style.top = `${e.clientY - offsetY}px`;

  updateTooltip({ x: e.clientX, y: e.clientY });

  // Highlight potential drop zones
  highlightDropZones(e);
}

function handleClipMouseUp(e) {
  console.log('[DragDrop] Mouse up event, checking drag state:', {
    isDragging: dragState.isDragging,
    dragType: dragState.dragType
  });

  if (!dragState.isDragging || dragState.dragType !== 'clip') {
    console.log('[DragDrop] Not dragging or wrong type, resetting state');
    dragState.draggedElement = null;
    dragState.dragType = null;
    return;
  }

  // Find drop target
  const dropTarget = findDropTarget(e);
  console.log('[DragDrop] Drop target found:', dropTarget);

  if (dropTarget) {
    handleClipDrop(dropTarget, e);
  } else {
    // Cancel drag - restore original position
    console.log('[DragDrop] No drop target, cancelling drag');
    cancelClipDrag();
  }

  // Clean up
  cleanupDrag();
}

function findDropTarget(e) {
  const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);
  return elementsUnderCursor.find(el =>
    el.classList.contains('track-lane') ||
    el.classList.contains('track-row')
  );
}

function handleClipDrop(dropTarget, e) {
  console.log('[DragDrop] Handling clip drop on target:', dropTarget.className, dropTarget.dataset);

  const itemId = dragState.dragData.itemId;
  const originalTrackId = dragState.dragData.trackId;

  let newTrackId = originalTrackId;
  let newStartTime = null;

  if (dropTarget.classList.contains('track-lane') || dropTarget.classList.contains('track-row')) {
    newTrackId = dropTarget.dataset.trackId || dropTarget.querySelector('.track-lane')?.dataset.trackId;
    console.log('[DragDrop] New track ID:', newTrackId);

    // Calculate new start time based on drop position
    if (dropTarget.classList.contains('track-lane')) {
      const rect = dropTarget.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const percent = relativeX / rect.width;
      newStartTime = percent * 60; // Assuming 60 second timeline, should get from state
      console.log('[DragDrop] Calculated new start time:', newStartTime, 'from relative X:', relativeX, 'percent:', percent);
    }
  }

  // Here we would update the state with new position/track
  // For now, just show a toast
  const message = `Moved clip ${itemId} to track ${newTrackId}${newStartTime ? ` at ${newStartTime.toFixed(1)}s` : ''}`;
  console.log('[DragDrop] Drop result:', message);
  showToast(message);
}

function cancelClipDrag() {
  // Restore original element
  if (dragState.draggedElement) {
    dragState.draggedElement.style.opacity = '';
  }
}

function cleanupDrag() {
  console.log('[DragDrop] Cleaning up drag state');

  // Remove ghost element
  if (dragState.ghostElement) {
    dragState.ghostElement.remove();
    dragState.ghostElement = null;
    console.log('[DragDrop] Ghost element removed');
  }

  // Restore original element
  if (dragState.draggedElement) {
    dragState.draggedElement.style.opacity = '';
    dragState.draggedElement = null;
    console.log('[DragDrop] Original element opacity restored');
  }

  // Remove tooltip
  removeTooltip();
  console.log('[DragDrop] Tooltip removed');

  // Reset drag state
  dragState.isDragging = false;
  dragState.dragType = null;
  dragState.dragData = null;
  console.log('[DragDrop] Drag state reset');
}

// Media library drag and drop
export function initializeMediaLibraryDragDrop(state, mediaContainer) {
  console.log('[DragDrop] Initializing media library drag and drop');

  if (!mediaContainer) {
    console.log('[DragDrop] No media container provided, skipping initialization');
    return;
  }

  // Add listeners to media container instead of document to avoid conflicts
  mediaContainer.addEventListener('mousedown', handleMediaMouseDown);

  // Use document for move/up events as they need to be global
  document.addEventListener('mousemove', handleMediaMouseMove);
  document.addEventListener('mouseup', handleMediaMouseUp);

  // Setup timeline as drop zone for media items
  setupTimelineDropZones(state);
  console.log('[DragDrop] Media library drag and drop initialized');
}

function handleMediaMouseDown(e) {
  const mediaItem = e.target.closest('.media-item');
  if (!mediaItem || e.button !== 0) return;

  console.log('[DragDrop] Media item mousedown detected on:', mediaItem.querySelector('.media-label')?.textContent);

  const rect = mediaItem.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  dragState.isDragging = false;
  dragState.dragType = 'media-item';
  dragState.draggedElement = mediaItem;
  dragState.dragData = {
    offsetX,
    offsetY,
    mediaData: {
      icon: mediaItem.querySelector('.media-icon').textContent,
      label: mediaItem.querySelector('.media-label').textContent,
      desc: mediaItem.querySelector('.media-desc').textContent
    },
    startX: e.clientX,
    startY: e.clientY
  };

  console.log('[DragDrop] Media drag state initialized:', {
    label: mediaItem.querySelector('.media-label')?.textContent,
    startX: e.clientX,
    startY: e.clientY,
    offsetX,
    offsetY
  });

  e.preventDefault();
}

function handleMediaMouseMove(e) {
  if (!dragState.draggedElement || dragState.dragType !== 'media-item') return;

  const deltaX = Math.abs(e.clientX - dragState.dragData.startX);
  const deltaY = Math.abs(e.clientY - dragState.dragData.startY);

  if (!dragState.isDragging && (deltaX > 5 || deltaY > 5)) {
    startMediaDrag();
  }

  if (dragState.isDragging) {
    updateMediaDrag(e);
  }
}

function startMediaDrag() {
  console.log('[DragDrop] Starting media drag');
  dragState.isDragging = true;

  const mediaItem = dragState.draggedElement;
  const rect = mediaItem.getBoundingClientRect();

  console.log('[DragDrop] Creating ghost element for media item:', rect);

  // Create ghost element
  dragState.ghostElement = mediaItem.cloneNode(true);
  dragState.ghostElement.classList.add('dragging-ghost');
  dragState.ghostElement.style.width = `${rect.width}px`;
  dragState.ghostElement.style.height = `${rect.height}px`; // Add height for consistency
  dragState.ghostElement.style.position = 'fixed';
  dragState.ghostElement.style.pointerEvents = 'none';
  dragState.ghostElement.style.zIndex = '1000';
  dragState.ghostElement.style.opacity = '0.8';

  document.body.appendChild(dragState.ghostElement);
  console.log('[DragDrop] Media ghost element added to DOM');

  // Show tooltip
  const tooltipContent = createTooltipContent('media', dragState.dragData.mediaData);
  createTooltip(tooltipContent, { x: dragState.dragData.startX, y: dragState.dragData.startY });
  console.log('[DragDrop] Media tooltip created');
}

function updateMediaDrag(e) {
  if (!dragState.ghostElement) return;

  // Use proper offset positioning like clip drag
  const offsetX = dragState.dragData.offsetX || 10;
  const offsetY = dragState.dragData.offsetY || 10;

  dragState.ghostElement.style.left = `${e.clientX - offsetX}px`;
  dragState.ghostElement.style.top = `${e.clientY - offsetY}px`;

  updateTooltip({ x: e.clientX, y: e.clientY });

  // Highlight timeline as drop zone
  highlightTimelineDropZone();
}

function handleMediaMouseUp(e) {
  if (!dragState.isDragging || dragState.dragType !== 'media-item') {
    dragState.draggedElement = null;
    dragState.dragType = null;
    return;
  }

  const dropTarget = findTimelineDropTarget(e);

  if (dropTarget) {
    handleMediaDrop(dropTarget, e);
  }

  cleanupDrag();
}

function findTimelineDropTarget(e) {
  const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);
  return elementsUnderCursor.find(el =>
    el.classList.contains('timeline-body') ||
    el.classList.contains('track-lane') ||
    el.classList.contains('timeline-shell')
  );
}

function handleMediaDrop() {
  // Add media to timeline at drop position
  const mediaData = dragState.dragData.mediaData;
  showToast(`Added ${mediaData.label} to timeline`);

  // Here we would call the media library function to add to timeline
  // addMediaToTimeline(mediaData, index, state, showToast);
}

function highlightTimelineDropZone() {
  const timelineBody = document.querySelector('.timeline-body');
  if (timelineBody) {
    timelineBody.classList.add('drop-highlight');
  }
}

function highlightDropZones(e) {
  // Remove previous highlights
  document.querySelectorAll('.drop-highlight').forEach(el => {
    el.classList.remove('drop-highlight');
  });

  const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);
  const trackLane = elementsUnderCursor.find(el => el.classList.contains('track-lane'));

  if (trackLane) {
    trackLane.classList.add('drop-highlight');
  }
}

function setupTrackDropZones(_state, _els) {
  // Drop zones are already the track lanes
  dragState.dropZones = document.querySelectorAll('.track-lane');
}

function setupTimelineDropZones(_state, _els) {
  const timelineBody = document.querySelector('.timeline-body');
  if (timelineBody) {
    timelineBody.addEventListener('dragover', (e) => {
      e.preventDefault();
      timelineBody.classList.add('drop-highlight');
    });

    timelineBody.addEventListener('dragleave', () => {
      timelineBody.classList.remove('drop-highlight');
    });

    timelineBody.addEventListener('drop', (e) => {
      e.preventDefault();
      timelineBody.classList.remove('drop-highlight');
    });
  }
}

function createTooltipContent(type, data) {
  if (type === 'clip') {
    return `
      <div class="tooltip-header">Clip</div>
      <div class="tooltip-body">
        <div>ID: ${data.itemId}</div>
        <div>Track: ${data.trackId}</div>
        <div class="tooltip-hint">Drag to move between tracks</div>
      </div>
    `;
  } else if (type === 'media') {
    return `
      <div class="tooltip-header">${data.icon} ${data.label}</div>
      <div class="tooltip-body">
        <div>${data.desc}</div>
        <div class="tooltip-hint">Drop on timeline to add</div>
      </div>
    `;
  }
  return '';
}

// Enhanced tooltip for hover states
export function setupEnhancedTooltips() {
  document.addEventListener('mouseover', handleElementHover);
  document.addEventListener('mouseout', handleElementOut);
}

function handleElementHover(e) {
  const element = e.target.closest('.clip, .media-item, .tool-btn, .track-row, .circle-btn, .mini-btn, .icon-btn, .upload-btn, .primary-btn, .track-toggle');
  if (!element || dragState.isDragging) return;

  let tooltipContent = '';

  if (element.classList.contains('clip')) {
    const itemId = element.dataset.itemId;
    const trackId = element.dataset.trackId;
    tooltipContent = `
      <div class="tooltip-header">Clip</div>
      <div class="tooltip-body">
        <div>ID: ${itemId}</div>
        <div>Track: ${trackId}</div>
        <div class="tooltip-actions">
          <span>Click to select</span>
          <span>Double-click to edit</span>
          <span>Drag to move</span>
        </div>
      </div>
    `;
  } else if (element.classList.contains('media-item')) {
    const icon = element.querySelector('.media-icon').textContent;
    const label = element.querySelector('.media-label').textContent;
    const desc = element.querySelector('.media-desc').textContent;
    tooltipContent = `
      <div class="tooltip-header">${icon} ${label}</div>
      <div class="tooltip-body">
        <div>${desc}</div>
        <div class="tooltip-actions">
          <span>Click to add to timeline</span>
          <span>Drag to timeline</span>
        </div>
      </div>
    `;
  } else if (element.classList.contains('tool-btn')) {
    const title = element.title || element.textContent;
    tooltipContent = `
      <div class="tooltip-header">Tool</div>
      <div class="tooltip-body">
        <div>${title}</div>
      </div>
    `;
  } else if (element.id === 'backBtn') {
    tooltipContent = `
      <div class="tooltip-header">← Navigation</div>
      <div class="tooltip-body">
        <div>Go back to the previous view</div>
        <div class="tooltip-hint">Return to project selection</div>
      </div>
    `;
  } else if (element.id === 'playBtn') {
    tooltipContent = `
      <div class="tooltip-header">▶ Playback Control</div>
      <div class="tooltip-body">
        <div>Play or pause timeline preview</div>
        <div class="tooltip-actions">
          <span>Click to toggle playback</span>
          <span>Spacebar shortcut available</span>
        </div>
      </div>
    `;
  } else if (element.id === 'rewindBtn') {
    tooltipContent = `
      <div class="tooltip-header">⏮ Rewind</div>
      <div class="tooltip-body">
        <div>Rewind the playhead by 10%</div>
        <div class="tooltip-hint">Quick timeline navigation</div>
      </div>
    `;
  } else if (element.id === 'stopBtn') {
    tooltipContent = `
      <div class="tooltip-header">⏹ Stop</div>
      <div class="tooltip-body">
        <div>Stop playback and return to the beginning</div>
        <div class="tooltip-hint">Reset timeline position</div>
      </div>
    `;
  } else if (element.dataset.action === 'zoom-out') {
    tooltipContent = `
      <div class="tooltip-header">🔍- Zoom Out</div>
      <div class="tooltip-body">
        <div>Zoom out on the timeline for wider view</div>
        <div class="tooltip-actions">
          <span>Click to zoom out</span>
          <span>Mouse wheel also works</span>
        </div>
      </div>
    `;
  } else if (element.dataset.action === 'zoom-in') {
    tooltipContent = `
      <div class="tooltip-header">🔍+ Zoom In</div>
      <div class="tooltip-body">
        <div>Zoom in on the timeline for detailed editing</div>
        <div class="tooltip-actions">
          <span>Click to zoom in</span>
          <span>Mouse wheel also works</span>
        </div>
      </div>
    `;
  } else if (element.dataset.addTrack) {
    const trackType = element.dataset.addTrack;
    tooltipContent = `
      <div class="tooltip-header">+${trackType} Track</div>
      <div class="tooltip-body">
        <div>Add a new ${trackType.toLowerCase()} track to the timeline</div>
        <div class="tooltip-actions">
          <span>Click to add track</span>
          <span>Multiple tracks supported</span>
        </div>
      </div>
    `;
  } else if (element.id === 'uploadBtn') {
    tooltipContent = `
      <div class="tooltip-header">📁 Upload Media</div>
      <div class="tooltip-body">
        <div>Upload media files into the editor</div>
        <div class="tooltip-hint">Supports video, image, and audio files</div>
      </div>
    `;
  } else if (element.id === 'generateBtn') {
    tooltipContent = `
      <div class="tooltip-header">⚡ Generate Asset</div>
      <div class="tooltip-body">
        <div>Generate a new asset from the prompt settings</div>
        <div class="tooltip-actions">
          <span>Configure prompt above</span>
          <span>Select duration and style</span>
        </div>
      </div>
    `;
  } else if (element.dataset.toggle === 'mute') {
    const isMuted = element.classList.contains('locked');
    tooltipContent = `
      <div class="tooltip-header">${isMuted ? '🔇' : '🔊'} Mute Track</div>
      <div class="tooltip-body">
        <div>${isMuted ? 'Unmute' : 'Mute'} this track</div>
        <div class="tooltip-hint">${isMuted ? 'Track is currently muted' : 'Track is currently audible'}</div>
      </div>
    `;
  } else if (element.dataset.toggle === 'solo') {
    const isSolo = element.classList.contains('locked');
    tooltipContent = `
      <div class="tooltip-header">🎵 Solo Track</div>
      <div class="tooltip-body">
        <div>${isSolo ? 'Unsolo' : 'Solo'} this track</div>
        <div class="tooltip-hint">${isSolo ? 'Only this track plays' : 'Play only this track'}</div>
      </div>
    `;
  } else if (element.dataset.toggle === 'lock') {
    const isLocked = element.classList.contains('locked');
    tooltipContent = `
      <div class="tooltip-header">🔒 Lock Track</div>
      <div class="tooltip-body">
        <div>${isLocked ? 'Unlock' : 'Lock'} this track</div>
        <div class="tooltip-hint">${isLocked ? 'Track is protected from edits' : 'Prevent accidental changes'}</div>
      </div>
    `;
  }

  if (tooltipContent) {
    createTooltip(tooltipContent, { x: e.clientX, y: e.clientY });
  }
}

function handleElementOut(e) {
  const element = e.target.closest('.clip, .media-item, .tool-btn, .track-row, .circle-btn, .mini-btn, .icon-btn, .upload-btn, .primary-btn, .track-toggle');
  if (element && !dragState.isDragging) {
    removeTooltip();
  }
}

export { dragState };