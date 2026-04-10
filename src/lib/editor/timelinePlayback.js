/**
 * Timeline Playback Module
 * Handles playback controls, playhead, zoom, and pan functionality
 */

let playbackTimer = null;
const panState = { x: 0, startX: 0, dragging: false };
let dragState = null;

// Import renderTracks dynamically
let renderTracksModule = null;
async function getRenderTracks() {
  if (!renderTracksModule) {
    renderTracksModule = await import('./timelineRenderer.js');
  }
  return renderTracksModule.renderTracks;
}

export function updatePlaybackUI(state, els) {
  els.progressFill.style.width = state.playheadPercent + '%';
  els.playheadLine.style.left = state.playheadPercent + '%';
  els.playheadKnob.style.left = 'calc(' + state.playheadPercent + '% - 4px)';
  els.currentTime.textContent = formatTimeFromPercent(state.playheadPercent, state.timelineSeconds);
  els.totalTime.textContent = formatTimeFromPercent(100, state.timelineSeconds);
  els.playBtn.textContent = state.playing ? '❚❚' : '▶';
  updateTimelineTransform(state, els);
  updateCaption(state, els);
}

export function togglePlayback(state, els) {
  state.playing = !state.playing;
  if (state.playing) {
    playbackTimer = setInterval(() => {
      state.playheadPercent += 0.6;
      if (state.playheadPercent >= 100) { state.playheadPercent = 100; state.playing = false; clearInterval(playbackTimer); }
      updatePlaybackUI(state, els);
    }, 120);
  } else { clearInterval(playbackTimer); }
  updatePlaybackUI(state, els);
}

export function stopPlayback(state, els) { state.playing = false; clearInterval(playbackTimer); state.playheadPercent = 0; updatePlaybackUI(state, els); }

export function rewindPlayback(state, els) { state.playing = false; clearInterval(playbackTimer); state.playheadPercent = Math.max(0, state.playheadPercent - 10); updatePlaybackUI(state, els); }

export function updateTimelineTransform(state, els) {
  const timelineBody = els.timelineBody;
  timelineBody.style.transform = 'translateX(' + panState.x + 'px) scaleX(' + state.zoom + ')';
  timelineBody.style.transformOrigin = 'left top';
}

export function handlePanMove(state, els) {
  if (!panState.dragging) return;
  panState.x = event.clientX - panState.startX;
  updateTimelineTransform(state, els);
}

export function handlePanUp(state, els) {
  panState.dragging = false;
  document.removeEventListener('mousemove', handlePanMove);
  document.removeEventListener('mouseup', handlePanUp);
}

export function getSnapTime(currentTime, state) {
  const snapTimes = [];
  state.tracks.forEach(track => {
    track.items.forEach(item => {
      if (item.id !== dragState.itemId) {
        snapTimes.push(item.start, item.end);
      }
    });
  });
  snapTimes.push(0, state.timelineSeconds);
  const snapThreshold = 0.5;
  const closeSnaps = snapTimes.filter(t => Math.abs(t - currentTime) < snapThreshold);
  if (closeSnaps.length > 0) {
    return closeSnaps.reduce((prev, curr) => Math.abs(curr - currentTime) < Math.abs(prev - currentTime) ? curr : prev);
  }
  return currentTime;
}

export async function handleItemMouseDown(e, state, els, showToast) {
  const itemEl = e.target.closest('.clip');
  if (!itemEl) return;
  const itemId = parseInt(itemEl.dataset.itemId);
  const trackId = itemEl.dataset.trackId;
  const track = state.tracks.find(t => t.id === trackId);
  const item = track.items.find(i => i.id === itemId);
  if (track.locked) return;
  if (state.selectedTool === 'Blade') {
    // Split at click position
    const rect = itemEl.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const splitTime = item.start + percent * (item.end - item.start);
    const newItem = { ...item, id: Date.now(), start: splitTime, sourceStart: item.sourceStart + (splitTime - item.start) * item.playbackRate, trimIn: item.trimIn + (splitTime - item.start) };
    item.end = splitTime;
    item.trimOut = item.trimIn + (splitTime - item.start);
    track.items.push(newItem);
    track.items.sort((a, b) => a.start - b.start);
    // Re-render tracks
    const renderTracks = await getRenderTracks();
    renderTracks(state, els, showToast);
    showToast('Item split');
    return;
  }
  const rect = itemEl.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const isResizeLeft = offsetX < 10;
  const isResizeRight = offsetX > rect.width - 10;
  dragState = {
    itemId,
    trackId,
    startX: e.clientX,
    startStart: item.start,
    startEnd: item.end,
    isResizeLeft,
    isResizeRight,
    isDrag: !isResizeLeft && !isResizeRight
  };
  document.addEventListener('mousemove', (e) => handleMouseMove(e, state, els, showToast));
  document.addEventListener('mouseup', (e) => handleMouseUp(state, els, showToast));
  e.preventDefault();
}

export async function handleMouseMove(e, state, els, showToast) {
  if (!dragState) return;
  const deltaX = e.clientX - dragState.startX;
  const pixelsPerSecond = (els.trackRows.querySelector('.track-lane').getBoundingClientRect().width / state.timelineSeconds);
  const deltaTime = deltaX / pixelsPerSecond;
  const track = state.tracks.find(t => t.id === dragState.trackId);
  const item = track.items.find(i => i.id === dragState.itemId);
  let newStart = dragState.startStart;
  let newEnd = dragState.startEnd;
  if (dragState.isDrag) {
    newStart = Math.max(0, dragState.startStart + deltaTime);
    newEnd = newStart + (dragState.startEnd - dragState.startStart);
  } else if (dragState.isResizeLeft) {
    newStart = Math.max(0, dragState.startStart + deltaTime);
  } else if (dragState.isResizeRight) {
    newEnd = Math.max(item.start + 0.1, dragState.startEnd + deltaTime);
  }
  // Snap
  newStart = getSnapTime(newStart, state);
  newEnd = getSnapTime(newEnd, state);
  if (dragState.isDrag) {
    item.start = newStart;
    item.end = newEnd;
  } else if (dragState.isResizeLeft) {
    item.start = newStart;
  } else if (dragState.isResizeRight) {
    item.end = newEnd;
  }
  // Re-render tracks
  const renderTracks = await getRenderTracks();
  renderTracks(state, els, showToast);
}

export function handleMouseUp(state, els, showToast) {
  dragState = null;
  document.removeEventListener('mousemove', (e) => handleMouseMove(e, state, els, showToast));
  document.removeEventListener('mouseup', (e) => handleMouseUp(state, els, showToast));
}

function formatTimeFromPercent(percent, totalSeconds) {
  const current = (percent / 100) * totalSeconds;
  const minutes = Math.floor(current / 60);
  const seconds = Math.floor(current % 60);
  const hundredths = Math.floor((current % 1) * 100);
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + String(hundredths).padStart(2, '0');
}

function updateCaption(state, els) {
  const currentTime = (state.playheadPercent / 100) * state.timelineSeconds;
  const captionTrack = state.tracks.find(t => t.type === 'caption');
  if (captionTrack) {
    const activeCaption = captionTrack.items.find(item => currentTime >= item.start && currentTime <= item.end);
    if (activeCaption) {
      els.previewCaption.textContent = activeCaption.text;
      els.previewCaption.style.display = 'block';
      if (activeCaption.style) {
        Object.assign(els.previewCaption.style, activeCaption.style);
      }
    } else {
      els.previewCaption.style.display = 'none';
    }
  }
}