/**
 * Advanced Drag and Drop Module
 * Handles comprehensive drag and drop functionality including:
 * - File system uploads with progress tracking
 * - Advanced drag zones and visual feedback
 * - Asset previews during drag operations
 * - Multiple file handling and batch uploads
 * - Video playback controls in clips
 * - Error handling and performance optimization
 * - Accessibility features (keyboard navigation, screen reader support)
 */

import { showToast } from '../loading.js';
import { uploadFileToStorage } from '../supabase.js';

// Enhanced drag state management
const dragState = {
  isDragging: false,
  dragType: null, // 'clip', 'media-item', 'external-file', 'multiple-files'
  draggedElement: null,
  originalElement: null,
  dragData: null,
  dropZones: [],
  ghostElement: null,
  tooltipElement: null,
  previewElement: null,
  progressElement: null,
  fileReader: null,
  uploadQueue: [],
  activeUploads: new Map(),
  initialized: false,
  accessibilityMode: false,
  performanceMode: false
};

// Supported file types and their configurations
const FILE_TYPES = {
  video: {
    extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'],
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'],
    maxSize: 500 * 1024 * 1024, // 500MB
    icon: '🎥',
    color: '#ff6b6b'
  },
  audio: {
    extensions: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/mp4'],
    maxSize: 100 * 1024 * 1024, // 100MB
    icon: '🎵',
    color: '#4ecdc4'
  },
  image: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'],
    maxSize: 50 * 1024 * 1024, // 50MB
    icon: '🖼️',
    color: '#45b7d1'
  },
  text: {
    extensions: ['txt', 'md', 'json', 'csv', 'xml', 'html'],
    mimeTypes: ['text/plain', 'text/markdown', 'application/json', 'text/csv', 'application/xml', 'text/html'],
    maxSize: 10 * 1024 * 1024, // 10MB
    icon: '📄',
    color: '#96ceb4'
  }
};

// Performance optimization settings
const PERFORMANCE_SETTINGS = {
  maxConcurrentUploads: 3,
  previewThrottleMs: 100,
  memoryLimit: 100 * 1024 * 1024, // 100MB
  cleanupIntervalMs: 30000
};

// File validation and type detection
export function validateFile(file) {
  if (!file) return { valid: false, error: 'No file provided' };

  // Check file size
  let maxSize = 0;
  let fileType = null;

  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.mimeTypes.includes(file.type) ||
        config.extensions.includes(file.name.split('.').pop()?.toLowerCase())) {
      maxSize = config.maxSize;
      fileType = type;
      break;
    }
  }

  if (!fileType) {
    return { valid: false, error: 'Unsupported file type' };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size for ${fileType} files is ${formatFileSize(maxSize)}`
    };
  }

  return {
    valid: true,
    type: fileType,
    config: FILE_TYPES[fileType]
  };
}

export function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Multiple file handling
export function processMultipleFiles(files, dropZone, state) {
  const validFiles = [];
  const errors = [];

  Array.from(files).forEach(file => {
    const validation = validateFile(file);
    if (validation.valid) {
      validFiles.push({ file, ...validation });
    } else {
      errors.push(`${file.name}: ${validation.error}`);
    }
  });

  if (errors.length > 0) {
    showToast(`Some files were rejected:\n${errors.join('\n')}`, 'warning');
  }

  if (validFiles.length === 0) {
    showToast('No valid files to upload', 'error');
    return;
  }

  if (validFiles.length === 1) {
    // Single file - direct upload
    uploadFile(validFiles[0], dropZone, state);
  } else {
    // Multiple files - batch upload
    uploadMultipleFiles(validFiles, dropZone, state);
  }
}

// Enhanced upload with progress tracking
export async function uploadFile(fileData, dropZone, state) {
  const { file, type, config } = fileData;
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    // Create progress indicator
    createUploadProgress(uploadId, file.name, file.size);

    // Show upload started
    showToast(`Uploading ${file.name}...`, 'info');

    // Upload to storage
    const publicUrl = await uploadFileToStorage(file);

    // Create asset and add to timeline
    const asset = await createAssetFromFile(file, type, publicUrl, state);

    // Update progress to complete
    updateUploadProgress(uploadId, 100, 'complete');

    // Add to timeline based on drop zone
    await addAssetToTimeline(asset, dropZone, state);

    showToast(`${file.name} uploaded successfully`, 'success');

  } catch (error) {
    console.error('[DragDrop] Upload failed:', error);
    updateUploadProgress(uploadId, 0, 'error');
    showToast(`Failed to upload ${file.name}: ${error.message}`, 'error');
  } finally {
    // Cleanup after delay
    setTimeout(() => removeUploadProgress(uploadId), 3000);
  }
}

// Batch upload for multiple files
export async function uploadMultipleFiles(filesData, dropZone, state) {
  const uploadPromises = [];
  const batchId = `batch_${Date.now()}`;

  showToast(`Uploading ${filesData.length} files...`, 'info');

  // Create batch progress indicator
  createBatchProgress(batchId, filesData.length);

  // Process files with concurrency limit
  const batches = [];
  for (let i = 0; i < filesData.length; i += PERFORMANCE_SETTINGS.maxConcurrentUploads) {
    batches.push(filesData.slice(i, i + PERFORMANCE_SETTINGS.maxConcurrentUploads));
  }

  for (const batch of batches) {
    const batchPromises = batch.map(async (fileData, index) => {
      const globalIndex = filesData.indexOf(fileData);
      return uploadFileInBatch(fileData, dropZone, state, batchId, globalIndex, filesData.length);
    });

    await Promise.allSettled(batchPromises);
  }

  // Final cleanup
  setTimeout(() => removeBatchProgress(batchId), 5000);
}

// Upload single file in batch
async function uploadFileInBatch(fileData, dropZone, state, batchId, index, total) {
  const { file } = fileData;
  const uploadId = `${batchId}_${index}`;

  try {
    createUploadProgress(uploadId, file.name, file.size);

    const publicUrl = await uploadFileToStorage(file);
    const asset = await createAssetFromFile(file, fileData.type, publicUrl, state);

    updateUploadProgress(uploadId, 100, 'complete');
    updateBatchProgress(batchId, index + 1, total);

    await addAssetToTimeline(asset, dropZone, state);

  } catch (error) {
    console.error(`[DragDrop] Batch upload failed for ${file.name}:`, error);
    updateUploadProgress(uploadId, 0, 'error');
    updateBatchProgress(batchId, index + 1, total, true);
  }
}

// Create asset from uploaded file
async function createAssetFromFile(file, type, publicUrl, state) {
  const asset = {
    id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    type: type,
    url: publicUrl,
    size: file.size,
    mimeType: file.type,
    uploadedAt: new Date().toISOString(),
    duration: 0,
    metadata: {}
  };

  // Extract metadata for media files
  if (type === 'video' || type === 'audio') {
    try {
      asset.duration = await getMediaDuration(file);
    } catch (error) {
      console.warn(`[DragDrop] Could not extract duration for ${file.name}:`, error);
    }
  } else if (type === 'image') {
    try {
      const dimensions = await getImageDimensions(file);
      asset.metadata = { ...asset.metadata, ...dimensions };
    } catch (error) {
      console.warn(`[DragDrop] Could not extract dimensions for ${file.name}:`, error);
    }
  }

  // Add to state assets
  state.assets = state.assets || [];
  state.assets.push(asset);

  return asset;
}

// Add asset to timeline based on drop zone
async function addAssetToTimeline(asset, dropZone, state) {
  const trackType = getTrackTypeForAsset(asset.type);
  let targetTrack = state.tracks.find(t => t.name.toLowerCase() === trackType.toLowerCase());

  if (!targetTrack) {
    // Create new track if needed
    targetTrack = {
      id: `track_${Date.now()}`,
      name: trackType,
      type: trackType.toLowerCase(),
      items: [],
      muted: false,
      solo: false,
      locked: false
    };
    state.tracks.push(targetTrack);
  }

  // Calculate position based on drop zone
  const position = calculateDropPosition(dropZone, asset, state);

  // Create timeline item
  const item = {
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    assetId: asset.id,
    type: asset.type,
    start: position.startTime,
    end: position.startTime + position.duration,
    sourceStart: 0,
    sourceEnd: position.duration,
    lane: 0,
    volume: 1,
    playbackRate: 1,
    effects: [],
    name: asset.name
  };

  targetTrack.items.push(item);
  state.selectedClipId = item.id;

  // Trigger timeline re-render
  if (window.renderTimeline) {
    window.renderTimeline(state);
  }
}

// Calculate drop position on timeline
function calculateDropPosition(dropZone, asset, state) {
  const rect = dropZone.getBoundingClientRect();
  const timelineRect = document.querySelector('.timeline-body')?.getBoundingClientRect();

  if (!timelineRect) {
    // Default position
    return {
      startTime: Math.max(0, state.timelineSeconds - 10),
      duration: asset.duration || getDefaultDuration(asset.type)
    };
  }

  // Calculate relative position
  const relativeX = (rect.left + rect.width / 2 - timelineRect.left) / timelineRect.width;
  const startTime = Math.max(0, relativeX * state.timelineSeconds);
  const duration = asset.duration || getDefaultDuration(asset.type);

  return { startTime, duration };
}

// Get track type for asset
function getTrackTypeForAsset(assetType) {
  switch (assetType) {
    case 'video': return 'Video';
    case 'audio': return 'Audio';
    case 'image': return 'Text'; // Images go on text track for overlays
    case 'text': return 'Text';
    default: return 'Video';
  }
}

// Get default duration for asset type
function getDefaultDuration(assetType) {
  switch (assetType) {
    case 'video': return 10;
    case 'audio': return 20;
    case 'image': return 5;
    case 'text': return 5;
    default: return 10;
  }
}

// Media utilities
async function getMediaDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const media = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');

    media.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(media.duration);
    });

    media.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load media metadata'));
    });

    media.src = url;
  });
}

async function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };

    img.src = url;
  });
}

// Progress indicators
function createUploadProgress(uploadId, fileName, fileSize) {
  const progressEl = document.createElement('div');
  progressEl.className = 'upload-progress';
  progressEl.id = `progress_${uploadId}`;
  progressEl.innerHTML = `
    <div class="progress-header">
      <span class="progress-file">${fileName}</span>
      <span class="progress-size">${formatFileSize(fileSize)}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
    <div class="progress-status">Uploading...</div>
  `;

  // Add to progress container
  let container = document.querySelector('.upload-progress-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'upload-progress-container';
    document.body.appendChild(container);
  }

  container.appendChild(progressEl);
  dragState.progressElement = progressEl;
}

function updateUploadProgress(uploadId, percent, status = 'uploading') {
  const progressEl = document.getElementById(`progress_${uploadId}`);
  if (!progressEl) return;

  const fill = progressEl.querySelector('.progress-fill');
  const statusEl = progressEl.querySelector('.progress-status');

  if (fill) {
    fill.style.width = `${percent}%`;
  }

  if (statusEl) {
    switch (status) {
      case 'complete':
        statusEl.textContent = 'Complete';
        statusEl.className = 'progress-status success';
        progressEl.classList.add('complete');
        break;
      case 'error':
        statusEl.textContent = 'Failed';
        statusEl.className = 'progress-status error';
        progressEl.classList.add('error');
        break;
      default:
        statusEl.textContent = `${percent}% uploaded`;
    }
  }
}

function removeUploadProgress(uploadId) {
  const progressEl = document.getElementById(`progress_${uploadId}`);
  if (progressEl) {
    progressEl.remove();
  }
}

function createBatchProgress(batchId, totalFiles) {
  const batchEl = document.createElement('div');
  batchEl.className = 'batch-progress';
  batchEl.id = `batch_${batchId}`;
  batchEl.innerHTML = `
    <div class="batch-header">
      <span>Uploading ${totalFiles} files</span>
      <span class="batch-count">0/${totalFiles}</span>
    </div>
    <div class="batch-bar">
      <div class="batch-fill"></div>
    </div>
  `;

  let container = document.querySelector('.upload-progress-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'upload-progress-container';
    document.body.appendChild(container);
  }

  container.insertBefore(batchEl, container.firstChild);
}

function updateBatchProgress(batchId, completed, total, hasError = false) {
  const batchEl = document.getElementById(`batch_${batchId}`);
  if (!batchEl) return;

  const countEl = batchEl.querySelector('.batch-count');
  const fill = batchEl.querySelector('.batch-fill');

  if (countEl) {
    countEl.textContent = `${completed}/${total}`;
    if (hasError) {
      countEl.classList.add('error');
    }
  }

  if (fill) {
    const percent = (completed / total) * 100;
    fill.style.width = `${percent}%`;

    if (completed === total) {
      batchEl.classList.add('complete');
      setTimeout(() => batchEl.remove(), 3000);
    }
  }
}

function removeBatchProgress(batchId) {
  const batchEl = document.getElementById(`batch_${batchId}`);
  if (batchEl) {
    batchEl.remove();
  }
}

// Enhanced tooltip system
export function createTooltip(content, position = { x: 0, y: 0 }) {
  removeTooltip();

  const tooltip = document.createElement('div');
  tooltip.className = 'drag-tooltip';
  tooltip.innerHTML = content;
  tooltip.style.left = `${position.x + 10}px`;
  tooltip.style.top = `${position.y + 10}px`;

  // Add accessibility attributes
  tooltip.setAttribute('role', 'tooltip');
  tooltip.setAttribute('aria-live', 'polite');

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

// Advanced drag and drop initialization
export function initializeAdvancedDragDrop(state, els) {
  console.log('[DragDrop] Initializing advanced drag and drop functionality');

  // Prevent multiple initializations
  if (dragState.initialized) {
    console.log('[DragDrop] Already initialized, skipping');
    return;
  }

  // Initialize all drag and drop systems
  initializeClipDragDrop(state, els);
  initializeMediaLibraryDragDrop(state, els?.mediaContainer);
  initializeFileSystemDragDrop(state);
  initializeAccessibilityFeatures();

  // Performance monitoring
  initializePerformanceOptimization();

  dragState.initialized = true;
  console.log('[DragDrop] Advanced drag and drop initialized successfully');
}

// File system drag and drop (external files)
export function initializeFileSystemDragDrop(state) {
  console.log('[DragDrop] Initializing file system drag and drop');

  // Global drag event handlers for external files
  document.addEventListener('dragenter', handleFileDragEnter, false);
  document.addEventListener('dragover', handleFileDragOver, false);
  document.addEventListener('dragleave', handleFileDragLeave, false);
  document.addEventListener('drop', (e) => handleFileDrop(e, state), false);

  // Setup drop zones throughout the interface
  setupAdvancedDropZones(state);

  console.log('[DragDrop] File system drag and drop initialized');
}

// Handle external file drag enter
function handleFileDragEnter(e) {
  e.preventDefault();
  e.stopPropagation();

  if (dragState.isDragging) return;

  // Check if dragging files from external source
  if (e.dataTransfer?.types.includes('Files')) {
    dragState.dragType = 'external-file';
    showGlobalDropZones(true);
  }
}

// Handle external file drag over
function handleFileDragOver(e) {
  e.preventDefault();
  e.stopPropagation();

  if (dragState.dragType === 'external-file') {
    e.dataTransfer.dropEffect = 'copy';
  }
}

// Handle external file drag leave
function handleFileDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();

  // Only hide if leaving the document
  if (e.clientX === 0 && e.clientY === 0) {
    showGlobalDropZones(false);
    dragState.dragType = null;
  }
}

// Handle external file drop
function handleFileDrop(e, state) {
  e.preventDefault();
  e.stopPropagation();

  showGlobalDropZones(false);

  if (!e.dataTransfer?.files?.length) {
    dragState.dragType = null;
    return;
  }

  const files = e.dataTransfer.files;
  const dropZone = getDropZoneFromPoint(e.clientX, e.clientY);

  console.log(`[DragDrop] Dropped ${files.length} external files`);

  // Process the files
  processMultipleFiles(files, dropZone, state);
  dragState.dragType = null;
}

// Setup advanced drop zones throughout the interface
function setupAdvancedDropZones(state) {
  const dropZoneSelectors = [
    '.timeline-body',
    '.track-lane',
    '.media-library',
    '.timeline-shell',
    '.main-content'
  ];

  dropZoneSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      setupDropZone(element, state);
    });
  });
}

// Setup individual drop zone
function setupDropZone(element, state) {
  element.addEventListener('dragenter', (e) => handleZoneDragEnter(e, element));
  element.addEventListener('dragover', (e) => handleZoneDragOver(e, element));
  element.addEventListener('dragleave', (e) => handleZoneDragLeave(e, element));
  element.addEventListener('drop', (e) => handleZoneDrop(e, element, state));
}

// Drop zone event handlers
function handleZoneDragEnter(e, element) {
  if (dragState.dragType === 'external-file') {
    e.preventDefault();
    element.classList.add('drop-zone-active');
  }
}

function handleZoneDragOver(e, element) {
  if (dragState.dragType === 'external-file') {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
}

function handleZoneDragLeave(e, element) {
  element.classList.remove('drop-zone-active');
}

function handleZoneDrop(e, element, state) {
  element.classList.remove('drop-zone-active');

  if (dragState.dragType === 'external-file' && e.dataTransfer?.files?.length) {
    e.preventDefault();
    processMultipleFiles(e.dataTransfer.files, element, state);
  }
}

// Show/hide global drop zones
function showGlobalDropZones(show) {
  const zones = document.querySelectorAll('.global-drop-zone');
  zones.forEach(zone => {
    zone.style.display = show ? 'block' : 'none';
  });

  if (show) {
    // Create overlay drop zones if they don't exist
    createGlobalDropZones();
  }
}

// Create global drop zones for external files
function createGlobalDropZones() {
  if (document.querySelector('.global-drop-zone')) return;

  const zones = [
    { selector: '.timeline-section', label: 'Drop files here to add to timeline' },
    { selector: '.media-library', label: 'Drop files here to add to library' },
    { selector: '.main-content', label: 'Drop files anywhere to upload' }
  ];

  zones.forEach(({ selector, label }) => {
    const target = document.querySelector(selector);
    if (target && !target.querySelector('.global-drop-zone')) {
      const zone = document.createElement('div');
      zone.className = 'global-drop-zone';
      zone.innerHTML = `
        <div class="drop-zone-content">
          <div class="drop-zone-icon">📁</div>
          <div class="drop-zone-text">${label}</div>
        </div>
      `;
      zone.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(34, 211, 238, 0.1);
        border: 3px dashed rgba(34, 211, 238, 0.5);
        border-radius: 12px;
        display: none;
        z-index: 1000;
        pointer-events: none;
        backdrop-filter: blur(2px);
      `;

      target.style.position = target.style.position || 'relative';
      target.appendChild(zone);
    }
  });
}

// Get drop zone from point
function getDropZoneFromPoint(x, y) {
  const elements = document.elementsFromPoint(x, y);
  return elements.find(el =>
    el.classList.contains('timeline-body') ||
    el.classList.contains('track-lane') ||
    el.classList.contains('media-library') ||
    el.classList.contains('main-content')
  ) || document.querySelector('.timeline-body') || document.body;
}

// Asset preview during drag
export function createAssetPreview(file, position) {
  removeAssetPreview();

  const preview = document.createElement('div');
  preview.className = 'asset-preview';
  preview.style.left = `${position.x + 20}px`;
  preview.style.top = `${position.y + 20}px`;

  const validation = validateFile(file);
  if (!validation.valid) {
    preview.innerHTML = `
      <div class="preview-error">
        <div class="error-icon">❌</div>
        <div class="error-text">${validation.error}</div>
      </div>
    `;
  } else {
    const config = validation.config;
    preview.innerHTML = `
      <div class="preview-content">
        <div class="preview-icon" style="color: ${config.color}">${config.icon}</div>
        <div class="preview-info">
          <div class="preview-name">${file.name}</div>
          <div class="preview-size">${formatFileSize(file.size)}</div>
          <div class="preview-type">${validation.type.toUpperCase()}</div>
        </div>
      </div>
    `;
  }

  document.body.appendChild(preview);
  dragState.previewElement = preview;

  return preview;
}

export function updateAssetPreview(position) {
  if (dragState.previewElement) {
    dragState.previewElement.style.left = `${position.x + 20}px`;
    dragState.previewElement.style.top = `${position.y + 20}px`;
  }
}

export function removeAssetPreview() {
  if (dragState.previewElement) {
    dragState.previewElement.remove();
    dragState.previewElement = null;
  }
}

// Clip drag and drop functionality
export function initializeClipDragDrop(state, els) {
  console.log('[DragDrop] Initializing clip drag and drop functionality');

  // Add drag listeners to existing clips
  document.addEventListener('mousedown', handleClipMouseDown);
  document.addEventListener('mousemove', handleClipMouseMove);
  document.addEventListener('mouseup', handleClipMouseUp);

  // Setup drop zones for tracks
  setupTrackDropZones(state, els);

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

// The initializeClipDragDrop function is now replaced by initializeAdvancedDragDrop
// Keeping the export for backward compatibility but it now delegates to advanced initialization

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

// Accessibility features
export function initializeAccessibilityFeatures() {
  console.log('[DragDrop] Initializing accessibility features');

  // Keyboard navigation for drag and drop
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // Screen reader announcements
  initializeScreenReaderSupport();

  // Focus management
  initializeFocusManagement();

  dragState.accessibilityMode = true;
  console.log('[DragDrop] Accessibility features initialized');
}

// Keyboard navigation handlers
function handleKeyDown(e) {
  if (!dragState.isDragging) return;

  switch (e.key) {
    case 'Escape':
      cancelAllDrags();
      break;
    case 'Enter':
    case ' ':
      if (dragState.dragType === 'media-item') {
        // Drop current item
        simulateDrop();
        e.preventDefault();
      }
      break;
    case 'ArrowLeft':
    case 'ArrowRight':
    case 'ArrowUp':
    case 'ArrowDown':
      // Move drag preview with keyboard
      moveDragWithKeyboard(e.key);
      e.preventDefault();
      break;
  }
}

function handleKeyUp(e) {
  // Handle any key up events if needed
}

// Cancel all active drags
function cancelAllDrags() {
  if (dragState.isDragging) {
    cleanupDrag();
    removeAssetPreview();
    showGlobalDropZones(false);
    announceToScreenReader('Drag operation cancelled');
  }
}

// Simulate drop at current position
function simulateDrop() {
  // This would need to be implemented based on current drag context
  console.log('[DragDrop] Simulating drop via keyboard');
}

// Move drag preview with keyboard
function moveDragWithKeyboard(direction) {
  if (!dragState.previewElement) return;

  const step = 10; // pixels
  const rect = dragState.previewElement.getBoundingClientRect();

  switch (direction) {
    case 'ArrowLeft':
      dragState.previewElement.style.left = `${rect.left - step}px`;
      break;
    case 'ArrowRight':
      dragState.previewElement.style.left = `${rect.left + step}px`;
      break;
    case 'ArrowUp':
      dragState.previewElement.style.top = `${rect.top - step}px`;
      break;
    case 'ArrowDown':
      dragState.previewElement.style.top = `${rect.top + step}px`;
      break;
  }

  // Update tooltip position
  updateTooltip({ x: rect.left, y: rect.top });
}

// Screen reader support
function initializeScreenReaderSupport() {
  // Create live region for announcements
  if (!document.querySelector('.sr-announcements')) {
    const liveRegion = document.createElement('div');
    liveRegion.className = 'sr-announcements';
    liveRegion.setAttribute('aria-live', 'assertive');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';

    document.body.appendChild(liveRegion);
  }
}

function announceToScreenReader(message) {
  const liveRegion = document.querySelector('.sr-announcements');
  if (liveRegion) {
    liveRegion.textContent = message;
  }
}

// Focus management
function initializeFocusManagement() {
  // Ensure focusable elements have proper attributes
  document.addEventListener('focusin', handleFocusIn);
  document.addEventListener('focusout', handleFocusOut);
}

function handleFocusIn(e) {
  const element = e.target;
  if (element.classList.contains('media-item') || element.classList.contains('clip')) {
    element.setAttribute('aria-grabbed', 'false');
  }
}

function handleFocusOut(e) {
  const element = e.target;
  if (element.classList.contains('media-item') || element.classList.contains('clip')) {
    element.removeAttribute('aria-grabbed');
  }
}

// Performance optimization
export function initializePerformanceOptimization() {
  console.log('[DragDrop] Initializing performance optimization');

  // Memory management
  initializeMemoryManagement();

  // Throttled updates
  initializeThrottledUpdates();

  dragState.performanceMode = true;
  console.log('[DragDrop] Performance optimization initialized');
}

// Memory management for large files
function initializeMemoryManagement() {
  // Monitor memory usage
  setInterval(() => {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize;
      const limit = performance.memory.jsHeapSizeLimit;

      if (used > limit * 0.8) {
        console.warn('[DragDrop] High memory usage detected, cleaning up...');
        cleanupMemory();
      }
    }
  }, PERFORMANCE_SETTINGS.cleanupIntervalMs);

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanupMemory);
}

function cleanupMemory() {
  // Revoke object URLs
  if (dragState.fileReader) {
    dragState.fileReader.abort();
    dragState.fileReader = null;
  }

  // Clear upload queue
  dragState.uploadQueue = [];

  // Cancel active uploads
  for (const [id, controller] of dragState.activeUploads) {
    if (controller.abort) {
      controller.abort();
    }
  }
  dragState.activeUploads.clear();

  // Force garbage collection hint
  if (window.gc) {
    window.gc();
  }
}

// Throttled updates for smooth performance
function initializeThrottledUpdates() {
  let lastUpdate = 0;

  // Throttle drag updates
  const throttledUpdateDrag = throttle((e) => {
    if (dragState.isDragging) {
      updateClipDrag(e);
      updateMediaDrag(e);
      updateAssetPreview({ x: e.clientX, y: e.clientY });
    }
  }, PERFORMANCE_SETTINGS.previewThrottleMs);

  // Replace existing mousemove handlers
  document.removeEventListener('mousemove', handleClipMouseMove);
  document.removeEventListener('mousemove', handleMediaMouseMove);

  document.addEventListener('mousemove', throttledUpdateDrag);
}

// Utility function for throttling
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Video playback controls in clips
export function initializeVideoPlaybackControls() {
  console.log('[DragDrop] Initializing video playback controls');

  // Add playback controls to video clips
  document.addEventListener('dblclick', handleVideoClipDoubleClick);
  document.addEventListener('contextmenu', handleVideoClipContextMenu);

  console.log('[DragDrop] Video playback controls initialized');
}

function handleVideoClipDoubleClick(e) {
  const clipEl = e.target.closest('.clip');
  if (!clipEl || !clipEl.dataset.assetId) return;

  const asset = findAssetById(clipEl.dataset.assetId);
  if (asset && asset.type === 'video') {
    toggleVideoPlayback(clipEl, asset);
  }
}

function handleVideoClipContextMenu(e) {
  const clipEl = e.target.closest('.clip');
  if (!clipEl || !clipEl.dataset.assetId) return;

  e.preventDefault();

  const asset = findAssetById(clipEl.dataset.assetId);
  if (asset && asset.type === 'video') {
    showVideoContextMenu(e, clipEl, asset);
  }
}

function toggleVideoPlayback(clipEl, asset) {
  const videoEl = clipEl.querySelector('video');
  if (videoEl) {
    if (videoEl.paused) {
      videoEl.play();
      showToast('Video playback started', 'info');
    } else {
      videoEl.pause();
      showToast('Video playback paused', 'info');
    }
  } else {
    // Create video element for preview
    createVideoPreview(clipEl, asset);
  }
}

function createVideoPreview(clipEl, asset) {
  const videoEl = document.createElement('video');
  videoEl.src = asset.url;
  videoEl.controls = true;
  videoEl.style.width = '100%';
  videoEl.style.height = '100%';
  videoEl.style.objectFit = 'contain';

  // Add to clip
  clipEl.innerHTML = '';
  clipEl.appendChild(videoEl);

  videoEl.play();
  showToast('Video preview loaded', 'success');
}

function showVideoContextMenu(e, clipEl, asset) {
  // Create context menu
  const menu = document.createElement('div');
  menu.className = 'video-context-menu';
  menu.style.left = `${e.clientX}px`;
  menu.style.top = `${e.clientY}px`;
  menu.innerHTML = `
    <div class="context-menu-item" data-action="play">▶ Play</div>
    <div class="context-menu-item" data-action="pause">⏸ Pause</div>
    <div class="context-menu-item" data-action="restart">🔄 Restart</div>
    <div class="context-menu-item" data-action="fullscreen">⛶ Fullscreen</div>
  `;

  document.body.appendChild(menu);

  // Handle menu clicks
  menu.addEventListener('click', (event) => {
    const action = event.target.dataset.action;
    handleVideoContextAction(action, clipEl, asset);
    menu.remove();
  });

  // Remove menu on outside click
  document.addEventListener('click', () => menu.remove(), { once: true });
}

function handleVideoContextAction(action, clipEl, asset) {
  const videoEl = clipEl.querySelector('video');
  if (!videoEl && action !== 'fullscreen') return;

  switch (action) {
    case 'play':
      videoEl.play();
      break;
    case 'pause':
      videoEl.pause();
      break;
    case 'restart':
      videoEl.currentTime = 0;
      videoEl.play();
      break;
    case 'fullscreen':
      if (videoEl) {
        videoEl.requestFullscreen();
      } else {
        createVideoPreview(clipEl, asset);
      }
      break;
  }
}

// Find asset by ID
function findAssetById(assetId) {
  // This would need access to state.assets
  // For now, return null - would be implemented when state is available
  return null;
}

export { dragState };