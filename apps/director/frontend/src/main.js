import './styles.css';
import axios from 'axios';
import { io } from 'socket.io-client';

// Backend connection setup
const socket = io();
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
});

// Backend integration functions
function connectToBackend() {
  socket.on('connect', () => {
    console.log('Connected to backend');
    showToast('Connected to AI services');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from backend');
    showToast('Disconnected from AI services');
  });

  // Listen for generation updates
  socket.on('generation_progress', (data) => {
    showToast(`Generation progress: ${data.progress}%`);
  });

  socket.on('generation_complete', (data) => {
    showToast('Generation complete!');
    // Update timeline with new clip
    if (data.clip) {
      const track = state.tracks.find(t => t.name === 'Video') || state.tracks[0];
      track.clips.push(data.clip);
      renderTracks();
    }
  });
}

const state = {
  projectTitle: 'Untitled Project',
  selectedTool: 'Select',
  selectedClipId: 1,
  generateType: 'Text',
  playing: false,
  playheadPercent: 32,
  zoom: 1,
  timelineSeconds: 60,
  tracks: [
    { id: 'video-1', name: 'Video', muted: false, solo: false, locked: true, clips: [
      { id: 1, name: 'Opening Shot', left: 8, width: 18, type: 'video' },
      { id: 2, name: 'Generated Clip', left: 34, width: 16, type: 'video' }
    ] },
    { id: 'audio-1', name: 'Audio', muted: false, solo: false, locked: false, clips: [
      { id: 3, name: 'Music Bed', left: 5, width: 42, type: 'audio' }
    ] },
    { id: 'text-1', name: 'Text', muted: false, solo: false, locked: false, clips: [
      { id: 4, name: 'Title Card', left: 14, width: 12, type: 'text' }
    ] },
    { id: 'broll-1', name: 'B-Roll', muted: false, solo: false, locked: false, clips: [
      { id: 5, name: 'City Cutaway', left: 52, width: 20, type: 'broll' }
    ] }
  ],
  tools: [['↖', 'Select'], ['✂', 'Blade'], ['⤵', 'Ripple'], ['⤶', 'Roll'], ['⇿', 'Slip'], ['⇆', 'Slide'], ['🔍', 'Zoom'], ['✋', 'Hand']],
  pills: ['Text to Video', 'Image to Video', 'Retake', 'Extend', 'B-Roll', 'Music Gen', 'Audio Sync', 'Fill Gap AI', 'Elements', 'Dual Viewer'],
  topIcons: ['👁','📺','📁','⚡','🎵','🔊','🎞️','👤','⚙️','💬','📋'],
  media: [
    { icon: '🎬', label: 'Video Clip', desc: 'Insert a source shot or generated video clip.' },
    { icon: '🖼️', label: 'Image Frame', desc: 'Add still images, frames, or storyboard art.' },
    { icon: '🎵', label: 'Audio Track', desc: 'Place music, voiceover, or sound design assets.' },
    { icon: '🎞️', label: 'B-Roll Asset', desc: 'Drop in cutaways, overlays, or support footage.' }
  ],
  generateTypes: [['✍️', 'Text'], ['🖼️', 'Image'], ['🔄', 'Retake'], ['➡️', 'Extend'], ['🎞️', 'B-Roll']],
  quickCommands: ['⚡Generate','Retake','Extend','B-Roll'],
  railActions: [['⚡', 'Generate', true], ['✂️', 'Split'], ['🎬', 'Scenes'], ['💬', 'Subtitle'], ['🎞️', 'B-Roll'], ['⏱️', 'Speed'], ['🪄', 'Stabilize'], ['📝', 'Text']],
  chat: [
    { role: 'user', text: 'Generate a better opening shot' },
    { role: 'ai', text: 'Opening idea ready. Use Generate or Retake.' }
  ]
};

const els = {
  topActions: document.getElementById('topActions'),
  toolGroup: document.getElementById('toolGroup'),
  pillRow: document.getElementById('pillRow'),
  trackRows: document.getElementById('trackRows'),
  mediaGrid: document.getElementById('mediaGrid'),
  generateTypes: document.getElementById('generateTypes'),
  chatStack: document.getElementById('chatStack'),
  quickCommands: document.getElementById('quickCommands'),
  floatingRail: document.getElementById('floatingRail'),
  playBtn: document.getElementById('playBtn'),
  stopBtn: document.getElementById('stopBtn'),
  rewindBtn: document.getElementById('rewindBtn'),
  currentTime: document.getElementById('currentTime'),
  totalTime: document.getElementById('totalTime'),
  progressFill: document.getElementById('progressFill'),
  previewTitle: document.getElementById('previewTitle'),
  previewSubtitle: document.getElementById('previewSubtitle'),
  previewEmoji: document.getElementById('previewEmoji'),
  playheadLine: document.getElementById('playheadLine'),
  playheadKnob: document.getElementById('playheadKnob'),
  projectTitle: document.getElementById('projectTitle'),
  promptInput: document.getElementById('promptInput'),
  negativeInput: document.getElementById('negativeInput'),
  durationSelect: document.getElementById('durationSelect'),
  aspectSelect: document.getElementById('aspectSelect'),
  styleSelect: document.getElementById('styleSelect'),
  generateBtn: document.getElementById('generateBtn'),
  chatInput: document.getElementById('chatInput'),
  toast: document.getElementById('toast')
};

let playbackTimer = null;

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => els.toast.classList.remove('show'), 1800);
}

function formatTimeFromPercent(percent, totalSeconds) {
  const current = (percent / 100) * totalSeconds;
  const minutes = Math.floor(current / 60);
  const seconds = Math.floor(current % 60);
  const hundredths = Math.floor((current % 1) * 100);
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + String(hundredths).padStart(2, '0');
}

function renderTopActions() {
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

function renderTools() {
  els.toolGroup.innerHTML = '';
  state.tools.forEach(([icon, label]) => {
    const btn = document.createElement('button');
    btn.className = 'tool-btn ' + (state.selectedTool === label ? 'active' : '');
    btn.title = label;
    btn.textContent = icon;
    btn.addEventListener('click', () => {
      state.selectedTool = label;
      renderTools();
      updatePreview();
      showToast(label + ' tool selected');
    });
    els.toolGroup.appendChild(btn);
  });
}

function renderPills() {
  els.pillRow.innerHTML = '';
  state.pills.forEach((pill) => {
    const span = document.createElement('span');
    span.className = 'pill';
    span.textContent = pill;
    els.pillRow.appendChild(span);
  });
}

function renderTracks() {
  els.trackRows.innerHTML = '';
  state.tracks.forEach((track) => {
    const row = document.createElement('div');
    row.className = 'track-row';

    const meta = document.createElement('div');
    meta.className = 'track-meta';
    meta.innerHTML = '<div class="track-name">' + track.name + '</div><div class="track-actions"><button class="track-toggle ' + (track.muted ? 'locked' : '') + '" data-toggle="mute">M</button><button class="track-toggle ' + (track.solo ? 'locked' : '') + '" data-toggle="solo">S</button><button class="track-toggle ' + (track.locked ? 'locked' : '') + '" data-toggle="lock">L</button></div><div class="track-count">' + track.clips.length + ' clips</div>';

    meta.querySelectorAll('.track-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.toggle;
        if (key === 'mute') track.muted = !track.muted;
        if (key === 'solo') track.solo = !track.solo;
        if (key === 'lock') track.locked = !track.locked;
        renderTracks();
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
      updatePlaybackUI();
    });

    track.clips.forEach((clip) => {
      const clipEl = document.createElement('button');
      clipEl.className = 'clip ' + (state.selectedClipId === clip.id ? 'active' : '');
      clipEl.style.left = clip.left + '%';
      clipEl.style.width = clip.width + '%';
      clipEl.innerHTML = '<span class="clip-label">' + clip.name + '</span>';
      clipEl.addEventListener('click', (e) => {
        e.stopPropagation();
        state.selectedClipId = clip.id;
        updatePreview(clip);
        renderTracks();
        showToast(clip.name + ' selected');
      });
      lane.appendChild(clipEl);
    });

    row.appendChild(meta);
    row.appendChild(lane);
    els.trackRows.appendChild(row);
  });
}

function renderMedia() {
  els.mediaGrid.innerHTML = '';
  state.media.forEach((media, index) => {
    const item = document.createElement('button');
    item.className = 'media-item';
    item.innerHTML = '<span class="media-icon">' + media.icon + '</span><span class="media-copy"><div class="media-label">' + media.label + '</div><div class="media-desc">' + media.desc + '</div></span>';
    item.addEventListener('click', () => {
      const targetTrack = media.label === 'Audio Track'
        ? (state.tracks.find((t) => t.name === 'Audio') || state.tracks[1] || state.tracks[0])
        : media.label === 'Image Frame'
        ? (state.tracks.find((t) => t.name === 'Text') || state.tracks[0])
        : media.label === 'B-Roll Asset'
        ? (state.tracks.find((t) => t.name === 'B-Roll') || state.tracks[0])
        : (state.tracks.find((t) => t.name === 'Video') || state.tracks[0]);

      const newId = Date.now() + index;
      targetTrack.clips.push({
        id: newId,
        name: media.label + ' ' + (targetTrack.clips.length + 1),
        left: Math.min(78, 8 + targetTrack.clips.length * 10),
        width: 12,
        type: media.label === 'Audio Track' ? 'audio' : media.label === 'Image Frame' ? 'text' : media.label === 'B-Roll Asset' ? 'broll' : 'video'
      });
      state.selectedClipId = newId;
      renderTracks();
      updatePreview();
      showToast(media.label + ' inserted into ' + targetTrack.name + ' track');
    });
    els.mediaGrid.appendChild(item);
  });
}

function renderGenerateTypes() {
  els.generateTypes.innerHTML = '';
  state.generateTypes.forEach(([icon, label]) => {
    const btn = document.createElement('button');
    btn.className = 'generate-type ' + (state.generateType === label ? 'active' : '');
    btn.innerHTML = '<span class="emoji">' + icon + '</span><span>' + label + '</span>';
    btn.addEventListener('click', () => {
      state.generateType = label;
      renderGenerateTypes();
      showToast(label + ' mode selected');
    });
    els.generateTypes.appendChild(btn);
  });
}

function renderChat() {
  els.chatStack.innerHTML = '';
  state.chat.forEach((entry) => {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + entry.role;
    bubble.textContent = entry.text;
    els.chatStack.appendChild(bubble);
  });
}

function renderQuickCommands() {
  els.quickCommands.innerHTML = '';
  state.quickCommands.forEach((command) => {
    const btn = document.createElement('button');
    btn.className = 'command-btn';
    btn.textContent = command;
    btn.addEventListener('click', () => {
      els.chatInput.value = command;
      handleChatSubmit();
    });
    els.quickCommands.appendChild(btn);
  });
}

function renderRail() {
  els.floatingRail.innerHTML = '';
  state.railActions.forEach(([icon, label, active]) => {
    const btn = document.createElement('button');
    btn.className = 'rail-btn ' + (active ? 'active' : '');
    btn.innerHTML = '<span class="emoji">' + icon + '</span><span>' + label + '</span>';
    btn.addEventListener('click', () => showToast(label + ' action triggered'));
    els.floatingRail.appendChild(btn);
  });
}

function updatePreview(clip) {
  const selected = clip || state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClipId);
  els.projectTitle.textContent = state.projectTitle;
  if (selected) {
    els.previewTitle.textContent = selected.name;
    els.previewSubtitle.textContent = state.selectedTool + ' tool active • ' + state.generateType + ' generation ready';
    els.previewEmoji.textContent = selected.type === 'audio' ? '🎵' : selected.type === 'text' ? '📝' : selected.type === 'broll' ? '🎞️' : '🎥';
  } else {
    els.previewTitle.textContent = 'Center Preview';
    els.previewSubtitle.textContent = 'Glow preview styled like the render page';
    els.previewEmoji.textContent = '🎥';
  }
}

function updatePlaybackUI() {
  els.progressFill.style.width = state.playheadPercent + '%';
  els.playheadLine.style.left = state.playheadPercent + '%';
  els.playheadKnob.style.left = 'calc(' + state.playheadPercent + '% - 4px)';
  els.currentTime.textContent = formatTimeFromPercent(state.playheadPercent, state.timelineSeconds);
  els.totalTime.textContent = formatTimeFromPercent(100, state.timelineSeconds);
  els.playBtn.textContent = state.playing ? '❚❚' : '▶';
}

function togglePlayback() {
  state.playing = !state.playing;
  if (state.playing) {
    playbackTimer = setInterval(() => {
      state.playheadPercent += 0.6;
      if (state.playheadPercent >= 100) {
        state.playheadPercent = 100;
        state.playing = false;
        clearInterval(playbackTimer);
      }
      updatePlaybackUI();
    }, 120);
  } else {
    clearInterval(playbackTimer);
  }
  updatePlaybackUI();
}

function stopPlayback() {
  state.playing = false;
  clearInterval(playbackTimer);
  state.playheadPercent = 0;
  updatePlaybackUI();
}

function rewindPlayback() {
  state.playing = false;
  clearInterval(playbackTimer);
  state.playheadPercent = Math.max(0, state.playheadPercent - 10);
  updatePlaybackUI();
}

    async function generateClip() {
      const prompt = els.promptInput.value.trim() || (state.generateType + ' cinematic shot');
      const negativePrompt = els.negativeInput.value.trim();
      const duration = els.durationSelect.value;
      const aspect = els.aspectSelect.value;
      const style = els.styleSelect.value;

      try {
        showToast('Starting generation...');

        // Send to backend
        const response = await api.post('/generate', {
          type: state.generateType.toLowerCase(),
          prompt,
          negativePrompt,
          duration,
          aspect,
          style
        });

        // Add to chat
        state.chat.push({ role: 'user', text: state.generateType + ' generate: ' + prompt });
        state.chat.push({ role: 'ai', text: 'Generation started. This may take a few minutes...' });
        renderChat();

        // Backend will handle the rest via socket events

      } catch (error) {
        console.error('Generation failed:', error);
        showToast('Generation failed. Please try again.');
        state.chat.push({ role: 'ai', text: 'Generation failed. Please check your settings and try again.' });
        renderChat();
      }
    }

    async function handleChatSubmit() {
      const text = els.chatInput.value.trim();
      if (!text) return;

      state.chat.push({ role: 'user', text });

      try {
        // Send to AI backend for processing
        const response = await api.post('/chat', { message: text });

        state.chat.push({ role: 'ai', text: response.data.reply });
      } catch (error) {
        // Fallback to local processing
        let reply = 'Command processed.';
        if (/generate/i.test(text)) reply = 'Generate command staged. Use the Generate panel to create the clip.';
        if (/retake/i.test(text)) reply = 'Retake command staged for the selected clip.';
        if (/extend/i.test(text)) reply = 'Extend command queued for the selected clip.';
        if (/b-roll|broll/i.test(text)) reply = 'B-Roll suggestion added to the sequence.';
        state.chat.push({ role: 'ai', text: reply });
      }

      els.chatInput.value = '';
      renderChat();
      showToast('AI command processed');
    }

function addTrack(type) {
  const id = type.toLowerCase() + '-' + Date.now();
  state.tracks.push({ id, name: type, muted: false, solo: false, locked: false, clips: [] });
  renderTracks();
  showToast(type + ' track added');
}

function bindEvents() {
  els.playBtn.addEventListener('click', togglePlayback);
  els.stopBtn.addEventListener('click', stopPlayback);
  els.rewindBtn.addEventListener('click', rewindPlayback);
  els.generateBtn.addEventListener('click', generateClip);
  els.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleChatSubmit();
  });
  document.querySelectorAll('[data-add-track]').forEach((btn) => {
    btn.addEventListener('click', () => addTrack(btn.dataset.addTrack));
  });
  document.querySelectorAll('[data-action="zoom-in"]').forEach((btn) => btn.addEventListener('click', () => {
    state.zoom = Math.min(2, state.zoom + 0.1);
    showToast('Zoom ' + state.zoom.toFixed(1) + 'x');
  }));
  document.querySelectorAll('[data-action="zoom-out"]').forEach((btn) => btn.addEventListener('click', () => {
    state.zoom = Math.max(0.5, state.zoom - 0.1);
    showToast('Zoom ' + state.zoom.toFixed(1) + 'x');
  }));
  document.getElementById('uploadBtn').addEventListener('click', () => showToast('Upload flow placeholder triggered'));
  document.getElementById('backBtn').addEventListener('click', () => showToast('Back action clicked'));
}

function renderAll() {
  renderTopActions();
  renderTools();
  renderPills();
  renderTracks();
  renderMedia();
  renderGenerateTypes();
  renderChat();
  renderQuickCommands();
  renderRail();
  updatePreview();
  updatePlaybackUI();
}

connectToBackend();
renderAll();
bindEvents();

