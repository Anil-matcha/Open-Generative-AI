/**
 * Timeline Renderer Module (Enhanced)
 * Handles rendering of tracks, media, pills, and UI elements
 * Enhanced with advanced timeline features from remix-new-editor
 */

import { updatePlaybackUI } from './timelinePlayback.js';
import { updatePreview } from './timelineRendererOriginal.js';
import { showToast } from '../loading.js';

let timelineZoom = 1.0;
let timelinePan = 0;
let timelineHeight = 300;
let isTimelineOpen = true;

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

// Enhanced track rendering with better visual hierarchy
export function renderTracks(state, els, showToast) {
  if (!els.trackRows) return;

  els.trackRows.innerHTML = '';

  state.tracks.forEach((track, trackIndex) => {
    const row = document.createElement('div');
    row.className = `track-row ${track.locked ? 'locked' : ''} ${track.muted ? 'muted' : ''}`;
    row.dataset.trackId = track.id;

    // Enhanced track header with more controls
    const meta = document.createElement('div');
    meta.className = 'track-meta';

    const trackInfo = document.createElement('div');
    trackInfo.className = 'track-info';

    const trackName = document.createElement('div');
    trackName.className = 'track-name';
    trackName.textContent = track.name;

    const trackStats = document.createElement('div');
    trackStats.className = 'track-stats';
    trackStats.textContent = `${track.items.length} items`;

    trackInfo.appendChild(trackName);
    trackInfo.appendChild(trackStats);

    // Enhanced track controls
    const trackControls = document.createElement('div');
    trackControls.className = 'track-controls';

    const soloBtn = document.createElement('button');
    soloBtn.className = `track-btn ${track.solo ? 'active' : ''}`;
    soloBtn.textContent = 'S';
    soloBtn.title = 'Solo track';
    soloBtn.onclick = () => {
      track.solo = !track.solo;
      renderTracks(state, els, showToast);
      showToast(`${track.name} ${track.solo ? 'soloed' : 'unsoloed'}`);
    };

    const muteBtn = document.createElement('button');
    muteBtn.className = `track-btn ${track.muted ? 'active' : ''}`;
    muteBtn.textContent = 'M';
    muteBtn.title = 'Mute track';
    muteBtn.onclick = () => {
      track.muted = !track.muted;
      renderTracks(state, els, showToast);
      showToast(`${track.name} ${track.muted ? 'muted' : 'unmuted'}`);
    };

    const lockBtn = document.createElement('button');
    lockBtn.className = `track-btn ${track.locked ? 'active' : ''}`;
    lockBtn.textContent = 'L';
    lockBtn.title = 'Lock track';
    lockBtn.onclick = () => {
      track.locked = !track.locked;
      renderTracks(state, els, showToast);
      showToast(`${track.name} ${track.locked ? 'locked' : 'unlocked'}`);
    };

    trackControls.appendChild(soloBtn);
    trackControls.appendChild(muteBtn);
    trackControls.appendChild(lockBtn);

    meta.appendChild(trackInfo);
    meta.appendChild(trackControls);

    // Enhanced track lane with zoom support
    const lane = document.createElement('div');
    lane.className = 'track-lane';
    lane.dataset.trackId = track.id;

    // Timeline ruler with zoom support
    if (trackIndex === 0) {
      const ruler = createTimelineRuler(state);
      lane.appendChild(ruler);
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
      const itemEl = createEnhancedClipElement(item, track, state);
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

function createEnhancedClipElement(item, track, state) {
  const itemEl = document.createElement('div');
  itemEl.className = `clip ${getClipTypeClass(item)} ${state.selectedClipId === item.id ? 'active' : ''}`;
  itemEl.dataset.itemId = item.id;
  itemEl.dataset.trackId = track.id;

  // Calculate position and width with zoom
  const leftPercent = (item.start / state.timelineSeconds) * 100 * timelineZoom;
  const widthPercent = ((item.end - item.start) / state.timelineSeconds) * 100 * timelineZoom;

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

  itemEl.appendChild(clipContent);

  // Enhanced event handlers
  itemEl.addEventListener('click', (e) => {
    e.stopPropagation();
    state.selectedClipId = item.id;
    updatePreview(state, { previewTitle: document.getElementById('previewTitle') });
    renderTracks(state, { trackRows: document.getElementById('trackRows') }, () => {});
  });

  itemEl.addEventListener('dblclick', () => {
    // Open clip editor
    showToast(`Opening ${item.name} in editor`);
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

// Re-export other functions that might be needed
export { renderTopActions, renderTools, renderPills, renderMedia, renderGenerateTypes, renderChat, renderQuickCommands, renderRail, updatePreview } from './timelineRendererOriginal.js';