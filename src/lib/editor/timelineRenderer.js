/**
 * Timeline Renderer Module
 * Handles rendering of tracks, media, pills, and UI elements
 */

export function renderTopActions(state, els) {
  els.topActions.innerHTML = '';
  state.topIcons.forEach((icon, i) => {
    const btn = document.createElement('button');
    btn.className = 'top-icon ' + (i === 3 ? 'active' : '');
    btn.textContent = icon;
    btn.addEventListener('click', () => showToast(icon + ' action clicked'));
    els.topActions.appendChild(btn);
  });
  const ready = document.createElement('div');
  ready.className = 'ready-pill';
  ready.innerHTML = '<span class="ready-dot"></span>Ready';
  els.topActions.appendChild(ready);
}

export function renderTools(state, els) {
  els.toolGroup.innerHTML = '';
  state.tools.forEach(([icon, label]) => {
    const btn = document.createElement('button');
    btn.className = 'tool-btn ' + (state.selectedTool === label ? 'active' : '');
    btn.title = label;
    btn.textContent = icon;
    // Tool click handling is now in the new interface
    // This old code can be removed once fully migrated
    els.toolGroup.appendChild(btn);
  });
}

export function renderPills(state, els) {
  els.pillRow.innerHTML = '';
  state.pills.forEach((pill) => {
    const span = document.createElement('span');
    span.className = 'pill';
    span.textContent = pill;
    els.pillRow.appendChild(span);
  });
}

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

export function renderTracks(state, els, showToast) {
  els.trackRows.innerHTML = '';
  state.tracks.forEach((track) => {
    const row = document.createElement('div');
    row.className = 'track-row';
    const meta = document.createElement('div');
    meta.className = 'track-meta';
    meta.innerHTML = '<div class="track-name">' + track.name + '</div><div class="track-actions"><button class="track-toggle ' + (track.muted ? 'locked' : '') + '" data-toggle="mute">M</button><button class="track-toggle ' + (track.locked ? 'locked' : '') + '" data-toggle="lock">L</button></div><div class="track-count">' + track.items.length + ' items</div>';
    meta.querySelectorAll('.track-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.toggle;
        if (key === 'mute') track.muted = !track.muted;
        if (key === 'lock') track.locked = !track.locked;
        renderTracks(state, els, showToast);
        showToast(track.name + ' ' + key + ' toggled');
      });
    });
    const lane = document.createElement('div');
    lane.className = 'track-lane';
    lane.addEventListener('click', (event) => {
      if (event.target !== lane) return;
      const rect = lane.getBoundingClientRect();
      const percent = ((event.clientX - rect.left) / rect.width) * 100;
      state.playheadPercent = Math.max(0, Math.min(100, percent));
      updatePlaybackUI(state, els);
    });
    if (state.selectedTool === 'Hand') {
      lane.addEventListener('mousedown', (e) => {
        if (e.target !== lane) return;
        panState.startX = e.clientX - panState.x;
        panState.dragging = true;
        const moveHandler = (e) => handlePanMove(state, els, e);
        const upHandler = (e) => handlePanUp(state, els, e);
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
      });
    }
    track.items.forEach((item) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'clip ' + (state.selectedClipId === item.id ? 'active' : '');
      const leftPercent = (item.start / state.timelineSeconds) * 100;
      const widthPercent = ((item.end - item.start) / state.timelineSeconds) * 100;
      itemEl.style.left = leftPercent + '%';
      itemEl.style.width = widthPercent + '%';
      itemEl.dataset.itemId = item.id;
      itemEl.dataset.trackId = track.id;
      let innerHTML = '<span class="clip-label">' + (item.name || item.text || 'Item') + '</span>';
      if (item.type === 'audio' && item.waveformData) {
        innerHTML += '<canvas class="waveform-canvas" width="200" height="40"></canvas>';
      }
      itemEl.innerHTML = innerHTML;
      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        state.selectedClipId = item.id;
        updatePreview(state, els, item);
        renderTracks(state, els, showToast);
        showToast('Item selected');
      });
      itemEl.addEventListener('mousedown', (e) => handleItemMouseDown(e, state, els, showToast));
      if (item.type === 'caption') {
        itemEl.style.borderColor = 'rgba(255,165,0,0.5)';
        itemEl.style.background = 'rgba(255,165,0,0.2)';
      }
      lane.appendChild(itemEl);
      // Draw waveform for audio items
      if (item.type === 'audio') {
        const asset = state.assets.find(a => a.id === item.assetId);
        if (asset && asset.waveformData) {
          const canvas = itemEl.querySelector('.waveform-canvas');
          if (canvas) drawWaveform(canvas, asset.waveformData);
        }
      }
    });
    row.appendChild(meta);
    row.appendChild(lane);
    els.trackRows.appendChild(row);
  });
}

export function renderMedia(state, els, showToast) {
  els.mediaGrid.innerHTML = '';
  state.media.forEach((media, index) => {
    const item = document.createElement('button');
    item.className = 'media-item';
    item.innerHTML = '<span class="media-icon">' + media.icon + '</span><span class="media-copy"><div class="media-label">' + media.label + '</div><div class="media-desc">' + media.desc + '</div></span>';
    item.addEventListener('click', () => {
      const targetTrack = media.label === 'Audio Track' ? (state.tracks.find((t) => t.name === 'Audio') || state.tracks[1] || state.tracks[0]) : media.label === 'Image Frame' ? (state.tracks.find((t) => t.name === 'Text') || state.tracks[0]) : media.label === 'B-Roll Asset' ? (state.tracks.find((t) => t.name === 'B-Roll') || state.tracks[0]) : (state.tracks.find((t) => t.name === 'Video') || state.tracks[0]);
      const newId = Date.now() + index;
      const startTime = Math.min(state.timelineSeconds - 10, 5 + targetTrack.items.length * 8);
      const duration = 10;
      targetTrack.items.push({
        id: newId,
        assetId: 'asset-' + (index + 1),
        type: media.label === 'Audio Track' ? 'audio' : media.label === 'Image Frame' ? 'text' : media.label === 'B-Roll Asset' ? 'broll' : 'video',
        start: startTime,
        end: startTime + duration,
        sourceStart: 0,
        sourceEnd: duration,
        lane: 0,
        trimIn: 0,
        trimOut: duration,
        volume: 1,
        playbackRate: 1,
        effects: [],
        name: media.label + ' ' + (targetTrack.items.length + 1)
      });
      state.selectedClipId = newId;
      renderTracks(state, els, showToast);
      updatePreview(state, els);
      showToast(media.label + ' inserted into ' + targetTrack.name + ' track');
    });
    els.mediaGrid.appendChild(item);
  });
}

export function renderGenerateTypes(state, els, showToast) {
  els.generateTypes.innerHTML = '';
  state.generateTypes.forEach(([icon, label]) => {
    const btn = document.createElement('button');
    btn.className = 'generate-type ' + (state.generateType === label ? 'active' : '');
    btn.innerHTML = '<span class="emoji">' + icon + '</span><span>' + label + '</span>';
    btn.addEventListener('click', () => { state.generateType = label; renderGenerateTypes(state, els, showToast); showToast(label + ' mode selected'); });
    els.generateTypes.appendChild(btn);
  });
}

export function renderChat(state, els) {
  els.chatStack.innerHTML = '';
  state.chat.forEach((entry) => {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + entry.role;
    bubble.textContent = entry.text;
    els.chatStack.appendChild(bubble);
  });
}

export function renderQuickCommands(state, els, handleChatSubmit) {
  els.quickCommands.innerHTML = '';
  state.quickCommands.forEach((command) => {
    const btn = document.createElement('button');
    btn.className = 'command-btn';
    btn.textContent = command;
    btn.addEventListener('click', () => { els.chatInput.value = command; handleChatSubmit(); });
    els.quickCommands.appendChild(btn);
  });
}

export function renderRail(state, els, showToast) {
  els.floatingRail.innerHTML = '';
  state.railActions.forEach(([icon, label, active]) => {
    const btn = document.createElement('button');
    btn.className = 'rail-btn ' + (active ? 'active' : '');
    btn.innerHTML = '<span class="emoji">' + icon + '</span><span>' + label + '</span>';
    btn.addEventListener('click', () => showToast(label + ' action triggered'));
    els.floatingRail.appendChild(btn);
  });
}

export function updatePreview(state, els, clip) {
  const selected = clip || state.tracks.flatMap(t => t.items).find(c => c.id === state.selectedClipId);
  els.projectTitle.textContent = state.projectTitle;
  if (selected) {
    els.previewTitle.textContent = selected.name || selected.text || 'Item';
    els.previewSubtitle.textContent = state.selectedTool + ' tool active • ' + state.generateType + ' generation ready';
    els.previewEmoji.textContent = selected.type === 'audio' ? '🎵' : selected.type === 'text' ? '📝' : selected.type === 'broll' ? '🎞️' : selected.type === 'caption' ? '💬' : '🎥';
  } else {
    els.previewTitle.textContent = 'Center Preview';
    els.previewSubtitle.textContent = 'Glow preview styled like the render page';
    els.previewEmoji.textContent = '🎥';
  }
  updateCaption(state, els);
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