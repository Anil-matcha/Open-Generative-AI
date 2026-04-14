/**
 * Timeline Renderer Module (Enhanced)
 * Handles rendering of tracks, media, pills, and UI elements
 * Enhanced with advanced timeline features from remix-new-editor
 */

import { updatePlaybackUI } from './timelinePlayback.js';
import { updatePreview } from './timelineRendererOriginal.js';
import { showToast } from '../loading.js';
import { initializeAdvancedDragDrop, setupEnhancedTooltips, initializeVideoPlaybackControls } from './dragDrop.js';
import { renderMultiCameraToolbar, renderPipControls, renderSplitScreenControls } from './multiCamera.js';

// Core timeline engine components
import { PlayButton } from '../../../components/common/timeline/PlayButton.js';
import { PlayTime } from '../../../components/common/timeline/PlayTime.js';
import { PlusButton } from '../../../components/common/timeline/PlusButton.js';
import { Layer } from '../../../components/common/timeline/Layer.js';
import { BlendingMode } from '../../../components/common/timeline/BlendingMode.js';
import { Opacity } from '../../../components/common/timeline/Opacity.js';
import { TimeLineSlider } from '../../../components/common/timeline/TimeLineSlider.js';
import { LineSlider } from '../../../components/common/timeline/LineSlider.js';
import { SliderArrow } from '../../../components/common/timeline/SliderArrow.js';
import { TransitionButton } from '../../../components/common/timeline/TransitionButton.js';
import { PopcornElement } from '../../../components/common/timeline/PopcornElement.js';
import { PopcornElements } from '../../../components/common/timeline/PopcornElements.js';
import { ContextMenu } from '../../../components/common/timeline/ContextMenu.js';
import { AnimatableElement } from '../../../components/common/timeline/elements/AnimatableElement.js';
import { DefaultElement } from '../../../components/common/timeline/elements/DefaultElement.js';
import { IconElement } from '../../../components/common/timeline/elements/IconElement.js';

let timelineZoom = 1.0;
let timelinePan = 0;
let timelineHeight = 300;
let isTimelineOpen = true;

// Core timeline engine component instances
let playButton = null;
let playTime = null;
let plusButton = null;
let timelineSlider = null;
let lineSlider = null;
let sliderArrows = [];
let transitionButton = null;
let contextMenu = null;
let popcornElements = null;
let layers = [];

// Enhanced zoom functionality
export function setTimelineZoom(newZoom) {
  timelineZoom = Math.max(0.1, Math.min(2.0, newZoom));
  updateTimelineTransform();
}

export function zoomInTimeline() {
  setTimelineZoom(timelineZoom + 0.1);
}

export function zoomOutTimeline() {
  setTimelineZoom(timelineZoom - 0.1);
}

export function resetTimelineZoom() {
  setTimelineZoom(1.0);
  timelinePan = 0;
  updateTimelineTransform();
}

export function updateTimelineTransform() {
  const timelineBody = document.querySelector('.timeline-body');
  if (timelineBody) {
    timelineBody.style.transform = `translateX(${timelinePan}px) scaleX(${timelineZoom})`;
    timelineBody.style.transformOrigin = 'left top';
  }
}

// Enhanced timeline height management
export function setTimelineHeight(height) {
  timelineHeight = Math.max(100, Math.min(800, height));
  const timelineContainer = document.querySelector('.timeline-section');
  if (timelineContainer) {
    timelineContainer.style.height = `${timelineHeight}px`;
  }
}

export function toggleTimeline() {
  isTimelineOpen = !isTimelineOpen;
  const timelineContainer = document.querySelector('.timeline-section');
  if (timelineContainer) {
    if (isTimelineOpen) {
      timelineContainer.style.height = `${timelineHeight}px`;
    } else {
      timelineContainer.style.height = '50px';
    }
  }
}

// Enhanced playhead management with zoom support
export function updatePlayheadPosition(percent, state) {
  const playheadLine = document.getElementById('playheadLine');
  const playheadKnob = document.getElementById('playheadKnob');

  if (playheadLine && playheadKnob) {
    const position = percent * timelineZoom;
    playheadLine.style.left = `${position}%`;
    playheadKnob.style.left = `calc(${position}% - 4px)`;
  }

  // Update time displays
  updateTimeDisplays(percent, state);
}

function updateTimeDisplays(percent, state) {
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');

  if (currentTimeEl && totalTimeEl) {
    const currentSeconds = (percent / 100) * state.timelineSeconds;
    const totalSeconds = state.timelineSeconds;

    currentTimeEl.textContent = formatTime(currentSeconds);
    totalTimeEl.textContent = formatTime(totalSeconds);
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centisecs = Math.floor((seconds % 1) * 100);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centisecs.toString().padStart(2, '0')}`;
}

// Initialize core timeline engine components
export function initializeTimelineEngine(state, els) {
  // Initialize play button
  if (!playButton && els.playBtn) {
    playButton = new PlayButton({
      onPlay: () => {
        // Handle play/pause logic
        console.log('Play button clicked');
        // This would integrate with existing playback system
      }
    });
    // Replace existing button with component
    const playBtnContainer = document.createElement('div');
    playBtnContainer.className = 'play-button-container';
    playBtnContainer.appendChild(playButton.render());
    els.playBtn.parentNode.replaceChild(playBtnContainer, els.playBtn);
  }

  // Initialize play time display
  if (!playTime && (els.currentTime || els.totalTime)) {
    playTime = new PlayTime({
      currentTime: state.playheadPercent,
      totalTime: state.timelineSeconds,
      onSeek: (percent) => {
        state.playheadPercent = percent;
        updatePlayheadPosition(percent, state);
        updatePlaybackUI(state, els);
      }
    });
  }

  // Initialize plus button for adding elements
  if (!plusButton) {
    plusButton = new PlusButton({
      onClick: () => {
        console.log('Add element button clicked');
        // This would open element picker
      }
    });
  }

  // Initialize timeline slider (main scrubber)
  if (!timelineSlider) {
    timelineSlider = new TimeLineSlider({
      startDate: new Date(),
      endDate: new Date(Date.now() + state.timelineSeconds * 1000),
      startDateWithZoom: new Date(),
      endDateWithZoom: new Date(Date.now() + state.timelineSeconds * 1000)
    });
  }

  // Initialize line slider (ruler)
  if (!lineSlider) {
    lineSlider = new LineSlider({
      duration: state.timelineSeconds
    });
  }

  // Initialize slider arrows for navigation
  if (sliderArrows.length === 0) {
    const leftArrow = new SliderArrow({
      direction: 'left',
      onClick: () => {
        timelinePan = Math.max(0, timelinePan - 100);
        updateTimelineTransform();
      }
    });

    const rightArrow = new SliderArrow({
      direction: 'right',
      onClick: () => {
        timelinePan += 100;
        updateTimelineTransform();
      }
    });

    sliderArrows = [leftArrow, rightArrow];
  }

  // Initialize transition button
  if (!transitionButton) {
    transitionButton = new TransitionButton({
      onClick: () => {
        console.log('Transition button clicked');
        // This would open transition picker
      }
    });
  }

  // Initialize context menu
  if (!contextMenu) {
    contextMenu = new ContextMenu({
      items: [
        { label: 'Cut', action: () => console.log('Cut') },
        { label: 'Copy', action: () => console.log('Copy') },
        { label: 'Paste', action: () => console.log('Paste') },
        { label: 'Delete', action: () => console.log('Delete') }
      ]
    });
  }

  // Initialize popcorn elements container
  if (!popcornElements) {
    popcornElements = new PopcornElements({
      elements: state.tracks.flatMap(track => track.items),
      onElementUpdate: (elementId, updates) => {
        // Update element in state
        state.tracks.forEach(track => {
          const item = track.items.find(item => item.id === elementId);
          if (item) {
            Object.assign(item, updates);
          }
        });
        renderTracks(state, els, showToast);
      }
    });
  }

  // Initialize layers for track management
  layers = state.tracks.map((track, index) => {
    return new Layer({
      item: track,
      index,
      onRemove: (layerItem) => {
        // Remove track logic
        state.tracks = state.tracks.filter(t => t.id !== layerItem.id);
        renderTracks(state, els, showToast);
        showToast(`Track "${layerItem.name}" removed`);
      }
    });
  });
}

// Render timeline controls UI
export function renderTimelineControls(state, container) {
  if (!container) return;

  // Clear existing controls
  container.innerHTML = '';

  // Create controls container
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'timeline-controls-enhanced';

  // Transport controls section
  const transportControls = document.createElement('div');
  transportControls.className = 'transport-controls';

  if (playButton) {
    transportControls.appendChild(playButton.render());
  }

  if (playTime) {
    transportControls.appendChild(playTime.render());
  }

  controlsContainer.appendChild(transportControls);

  // Timeline navigation controls
  const navigationControls = document.createElement('div');
  navigationControls.className = 'navigation-controls';

  if (sliderArrows.length > 0) {
    sliderArrows.forEach(arrow => {
      navigationControls.appendChild(arrow.render());
    });
  }

  if (timelineSlider) {
    navigationControls.appendChild(timelineSlider.render());
  }

  controlsContainer.appendChild(navigationControls);

  // Element controls
  const elementControls = document.createElement('div');
  elementControls.className = 'element-controls';

  if (plusButton) {
    elementControls.appendChild(plusButton.render());
  }

  if (transitionButton) {
    elementControls.appendChild(transitionButton.render());
  }

  controlsContainer.appendChild(elementControls);

  container.appendChild(controlsContainer);
}

// Render layer management UI
export function renderLayerManagement(state, container) {
  if (!container) return;

  container.innerHTML = '';

  const layerContainer = document.createElement('div');
  layerContainer.className = 'layer-management';

  layers.forEach(layer => {
    layerContainer.appendChild(layer.render());
  });

  container.appendChild(layerContainer);
}

// Render popcorn elements
export function renderPopcornElements(state, container) {
  if (!container || !popcornElements) return;

  container.innerHTML = '';
  container.appendChild(popcornElements.render());
}

// Enhanced context menu handling
export function showTimelineContextMenu(x, y, targetElement, state) {
  if (!contextMenu) return;

  // Position and show context menu
  contextMenu.show(x, y, {
    target: targetElement,
    state: state
  });
}

// Enhanced track rendering with core timeline engine integration
export function renderTracks(state, els, showToast) {
  if (!els.trackRows) return;

  // Initialize timeline engine if not already done
  if (!playButton) {
    initializeTimelineEngine(state, els);
  }

  els.trackRows.innerHTML = '';

  state.tracks.forEach((track, trackIndex) => {
    const row = document.createElement('div');
    row.className = `track-row ${track.locked ? 'locked' : ''} ${track.muted ? 'muted' : ''} ${track.solo ? 'solo' : ''}`;
    row.dataset.trackId = track.id;

    // Enhanced track header with layer management and blending controls
    const meta = document.createElement('div');
    meta.className = 'track-meta';

    const trackInfo = document.createElement('div');
    trackInfo.className = 'track-info';

    const trackName = document.createElement('div');
    trackName.className = 'track-name';
    trackName.contentEditable = true;
    trackName.textContent = track.name;
    trackName.onblur = () => {
      track.name = trackName.textContent.trim() || 'Track ' + (trackIndex + 1);
      showToast(`Track renamed to "${track.name}"`);
    };

    const trackStats = document.createElement('div');
    trackStats.className = 'track-stats';
    trackStats.textContent = `${track.items.length} items`;

    trackInfo.appendChild(trackName);
    trackInfo.appendChild(trackStats);

    // Enhanced track controls with layer management
    const trackControls = document.createElement('div');
    trackControls.className = 'track-controls';

    // Solo button
    const soloBtn = document.createElement('button');
    soloBtn.className = `track-btn solo-btn ${track.solo ? 'active' : ''}`;
    soloBtn.textContent = 'S';
    soloBtn.title = 'Solo track';
    soloBtn.onclick = () => {
      track.solo = !track.solo;
      renderTracks(state, els, showToast);
      showToast(`${track.name} ${track.solo ? 'soloed' : 'unsoloed'}`);
    };

    // Mute button
    const muteBtn = document.createElement('button');
    muteBtn.className = `track-btn mute-btn ${track.muted ? 'active' : ''}`;
    muteBtn.textContent = 'M';
    muteBtn.title = 'Mute track';
    muteBtn.onclick = () => {
      track.muted = !track.muted;
      renderTracks(state, els, showToast);
      showToast(`${track.name} ${track.muted ? 'muted' : 'unmuted'}`);
    };

    // Lock button
    const lockBtn = document.createElement('button');
    lockBtn.className = `track-btn lock-btn ${track.locked ? 'active' : ''}`;
    lockBtn.textContent = '🔒';
    lockBtn.title = 'Lock track';
    lockBtn.onclick = () => {
      track.locked = !track.locked;
      renderTracks(state, els, showToast);
      showToast(`${track.name} ${track.locked ? 'locked' : 'unlocked'}`);
    };

    trackControls.appendChild(soloBtn);
    trackControls.appendChild(muteBtn);
    trackControls.appendChild(lockBtn);

    // Add blending mode and opacity controls for the track
    const blendingControls = document.createElement('div');
    blendingControls.className = 'blending-controls';

    const blendingMode = new BlendingMode({
      layer: { ...track, blendMode: track.blendMode || 'normal' },
      onChange: (newBlendMode) => {
        track.blendMode = newBlendMode;
        showToast(`Track blend mode set to ${newBlendMode}`);
      }
    });

    const opacityControl = new Opacity({
      layer: { ...track, opacity: track.opacity || 1 },
      onChange: (newOpacity) => {
        track.opacity = newOpacity;
        showToast(`Track opacity set to ${(newOpacity * 100).toFixed(0)}%`);
      }
    });

    blendingControls.appendChild(blendingMode.render());
    blendingControls.appendChild(opacityControl.render());

    meta.appendChild(trackInfo);
    meta.appendChild(trackControls);
    meta.appendChild(blendingControls);

    // Enhanced track lane with timeline engine integration
    const lane = document.createElement('div');
    lane.className = 'track-lane';
    lane.dataset.trackId = track.id;

    // Timeline ruler with enhanced line slider
    if (trackIndex === 0) {
      if (lineSlider) {
        lane.appendChild(lineSlider.render());
      } else {
        const ruler = createTimelineRuler(state);
        lane.appendChild(ruler);
      }
    }

    // Click to seek
    lane.addEventListener('click', (event) => {
      if (event.target !== lane) return;
      const rect = lane.getBoundingClientRect();
      const percent = ((event.clientX - rect.left) / rect.width) / timelineZoom;
      state.playheadPercent = Math.max(0, Math.min(100, percent * 100));
      updatePlayheadPosition(state.playheadPercent, state);
      updatePlaybackUI(state, els);
    });

    // Pan functionality
    let isPanning = false;
    let panStartX = 0;
    let panStartOffset = 0;

    lane.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+click
        isPanning = true;
        panStartX = e.clientX;
        panStartOffset = timelinePan;
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isPanning) {
        const deltaX = e.clientX - panStartX;
        timelinePan = panStartOffset + deltaX;
        updateTimelineTransform();
      }
    });

    document.addEventListener('mouseup', () => {
      isPanning = false;
    });

    track.items.forEach((item) => {
      // Use PopcornElement for advanced element types, fallback to enhanced clip
      let itemEl;
      if (item.type === 'popcorn' || item.type === 'text' || item.type === 'image' || item.type === 'lead_generator') {
        const popcornElement = new PopcornElement({ item });
        itemEl = popcornElement.render();
      } else {
        itemEl = createEnhancedClipElement(item, track, state, timelineZoom);
      }

      // Add context menu handler
      itemEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showTimelineContextMenu(e.clientX, e.clientY, itemEl, state);
      });

      lane.appendChild(itemEl);
    });

    row.appendChild(meta);
    row.appendChild(lane);
    els.trackRows.appendChild(row);
  });
}

function createTimelineRuler(state) {
  const ruler = document.createElement('div');
  ruler.className = 'timeline-ruler';

  const totalSeconds = state.timelineSeconds;
  const majorTicks = Math.ceil(totalSeconds / 10); // Every 10 seconds

  for (let i = 0; i <= majorTicks; i++) {
    const tick = document.createElement('div');
    tick.className = 'ruler-tick';
    tick.style.left = `${(i * 10 / totalSeconds) * 100}%`;

    const label = document.createElement('div');
    label.className = 'ruler-label';
    label.textContent = formatTime(i * 10);
    tick.appendChild(label);

    ruler.appendChild(tick);
  }

  return ruler;
}

export function createEnhancedClipElement(item, track, state, zoom = 1.0) {
  const itemEl = document.createElement('div');
  itemEl.className = `clip ${getClipTypeClass(item)} ${state.selectedClipId === item.id ? 'active' : ''} drag-ready`;
  itemEl.dataset.itemId = item.id;
  itemEl.dataset.trackId = track.id;
  itemEl.title = `Clip: ${item.name || item.text || 'Item'}\nTrack: ${track.name}\nDuration: ${formatTime(item.end - item.start)}\nStart: ${formatTime(item.start)}`;

  // Calculate position and width with zoom
  const leftPercent = (item.start / state.timelineSeconds) * 100 * zoom;
  const widthPercent = ((item.end - item.start) / state.timelineSeconds) * 100 * zoom;

  itemEl.style.left = `${leftPercent}%`;
  itemEl.style.width = `${widthPercent}%`;

  // Enhanced clip content
  const clipContent = document.createElement('div');
  clipContent.className = 'clip-content';

  const clipLabel = document.createElement('span');
  clipLabel.className = 'clip-label';
  clipLabel.textContent = item.name || item.text || 'Item';

  clipContent.appendChild(clipLabel);

  // Add waveform for audio clips
  if (item.type === 'audio' && item.waveformData) {
    const waveformCanvas = document.createElement('canvas');
    waveformCanvas.className = 'waveform-canvas';
    waveformCanvas.width = Math.max(50, widthPercent * 2);
    waveformCanvas.height = 30;
    drawWaveform(waveformCanvas, item.waveformData);
    clipContent.appendChild(waveformCanvas);
  }

  // Add duration indicator
  const duration = item.end - item.start;
  const durationEl = document.createElement('span');
  durationEl.className = 'clip-duration';
  durationEl.textContent = formatTime(duration);
  clipContent.appendChild(durationEl);

  // Add drag handles for trimming
  const leftHandle = document.createElement('div');
  leftHandle.className = 'clip-handle clip-handle-left';
  leftHandle.title = 'Drag to trim start';

  const rightHandle = document.createElement('div');
  rightHandle.className = 'clip-handle clip-handle-right';
  rightHandle.title = 'Drag to trim end';

  itemEl.appendChild(leftHandle);
  itemEl.appendChild(clipContent);
  itemEl.appendChild(rightHandle);

  // Enhanced event handlers
  itemEl.addEventListener('click', (e) => {
    // Don't trigger if clicking on handles
    if (e.target.classList.contains('clip-handle')) return;

    e.stopPropagation();
    state.selectedClipId = item.id;
    updatePreview(state, { previewTitle: document.getElementById('previewTitle') });
    renderTracks(state, { trackRows: document.getElementById('trackRows') }, () => {});
  });

  itemEl.addEventListener('dblclick', (e) => {
    // Don't trigger if double-clicking on handles
    if (e.target.classList.contains('clip-handle')) return;

    // Open clip editor
    showToast(`Opening ${item.name} in editor`);
  });

  // Add mouse enter/leave for enhanced tooltips
  itemEl.addEventListener('mouseenter', () => {
    itemEl.classList.add('clip-hover');
  });

  itemEl.addEventListener('mouseleave', () => {
    itemEl.classList.remove('clip-hover');
  });

  return itemEl;
}

function getClipTypeClass(item) {
  if (item.type === 'video') return 'video-clip';
  if (item.type === 'audio') return 'audio-clip';
  if (item.type === 'text' || item.type === 'caption') return 'text-clip';
  if (item.type === 'image') return 'image-clip';
  return 'generic-clip';
}

// Import other functions that were moved
export function drawWaveform(canvas, waveformData) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const step = canvas.width / waveformData.length;
  waveformData.forEach((amp, i) => {
    const x = i * step;
    const y = canvas.height / 2 + (amp - 0.5) * canvas.height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// Multi-camera compositing overlay renderer
export function renderCompositingOverlay(state, container) {
  if (!container) return;

  let overlayHTML = '';

  // Render PIP windows
  if (state.pipMode && state.pipWindows.length > 0) {
    state.pipWindows.forEach(pip => {
      const clip = state.tracks.flatMap(t => t.items).find(c => c.id === pip.clipId);
      if (!clip) return;

      const style = `
        position: absolute;
        left: ${pip.x * 100}%;
        top: ${pip.y * 100}%;
        width: ${pip.size.width * 100}%;
        height: ${pip.size.height * 100}%;
        opacity: ${pip.opacity};
        border-radius: ${pip.borderRadius}px;
        border: 2px solid rgba(34, 211, 238, 0.5);
        background: rgba(0, 0, 0, 0.8);
        box-shadow: ${pip.shadow ? '0 4px 12px rgba(0, 0, 0, 0.5)' : 'none'};
        mix-blend-mode: ${pip.blendMode};
        pointer-events: none;
        z-index: 10;
      `;

      overlayHTML += `
        <div class="pip-window" style="${style}" data-pip-id="${pip.id}">
          <div class="pip-label" style="position: absolute; top: 4px; left: 8px; font-size: 10px; color: white; background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 4px;">
            PIP: ${clip.name || 'Clip'}
          </div>
          <div class="pip-resize-handle" style="position: absolute; bottom: 0; right: 0; width: 16px; height: 16px; cursor: nw-resize; background: rgba(34, 211, 238, 0.8); border-radius: 2px 0 0 0;" data-pip-id="${pip.id}"></div>
        </div>
      `;
    });
  }

  // Render split screen overlay
  if (state.splitScreenMode) {
    const config = state.splitScreenConfig;
    let splitStyle = '';

    if (config.type === 'horizontal') {
      splitStyle = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to bottom,
          rgba(34, 211, 238, 0.1) 0% ${config.ratio * 100}%,
          rgba(239, 68, 68, 0.1) ${config.ratio * 100}% 100%);
        border-top: 2px solid rgba(34, 211, 238, 0.5);
        border-bottom: 2px solid rgba(239, 68, 68, 0.5);
        pointer-events: none;
      `;
    } else if (config.type === 'vertical') {
      splitStyle = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to right,
          rgba(34, 211, 238, 0.1) 0% ${config.ratio * 100}%,
          rgba(239, 68, 68, 0.1) ${config.ratio * 100}% 100%);
        border-left: 2px solid rgba(34, 211, 238, 0.5);
        border-right: 2px solid rgba(239, 68, 68, 0.5);
        pointer-events: none;
      `;
    } else if (config.type === 'quad') {
      splitStyle = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background:
          linear-gradient(to bottom,
            rgba(34, 211, 238, 0.1) 0% 50%,
            rgba(239, 68, 68, 0.1) 50% 100%),
          linear-gradient(to right,
            rgba(52, 211, 153, 0.1) 0% 50%,
            rgba(168, 85, 247, 0.1) 50% 100%);
        border: 2px solid rgba(34, 211, 238, 0.3);
        pointer-events: none;
      `;
    }

    overlayHTML += `<div class="split-overlay" style="${splitStyle}"></div>`;
  }

  container.innerHTML = overlayHTML;

  // Add event listeners for PIP resize handles
  if (state.pipMode) {
    container.querySelectorAll('.pip-resize-handle').forEach(handle => {
      let isResizing = false;
      let startX, startY, startWidth, startHeight;

      handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        const pipId = handle.dataset.pipId;
        const pip = state.pipWindows.find(p => p.id === pipId);
        if (pip) {
          startWidth = pip.size.width;
          startHeight = pip.size.height;
        }
        e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const pipId = handle.dataset.pipId;
        const deltaX = (e.clientX - startX) / container.offsetWidth;
        const deltaY = (e.clientY - startY) / container.offsetHeight;

        state.updatePipWindow(pipId, {
          size: {
            width: Math.max(0.1, Math.min(0.8, startWidth + deltaX)),
            height: Math.max(0.1, Math.min(0.8, startHeight + deltaY))
          }
        });

        renderCompositingOverlay(state, container);
      });

      document.addEventListener('mouseup', () => {
        isResizing = false;
      });
    });
  }
}

// Initialize drag and drop functionality and timeline engine
export function initializeTimelineDragDrop(state, els) {
  initializeAdvancedDragDrop(state, els);
  setupEnhancedTooltips();
  initializeVideoPlaybackControls();

  // Initialize core timeline engine components
  initializeTimelineEngine(state, els);
}

// Re-export other functions that might be needed
export { renderTopActions, renderTools, renderPills, renderMedia, renderGenerateTypes, renderChat, renderQuickCommands, renderRail, updatePreview } from './timelineRendererOriginal.js';