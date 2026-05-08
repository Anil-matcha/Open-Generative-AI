// SubtitleEditorModal.jsx - Main modal for subtitle editing with waveform display

import { createElementFromHTML } from '../../utils/jsx.js';
import { BaseModal } from './modals/BaseModal.jsx';
import { subtitleState } from '../lib/editor/subtitleState.js';

const DESIGN_SYSTEM = {
  colors: {
    bg: 'var(--bg)',
    panel: 'var(--panel)',
    panelSoft: 'var(--panel-soft)',
    border: 'var(--border)',
    borderSoft: 'var(--border-soft)',
    text: 'var(--text)',
    muted: 'var(--muted)',
    dim: 'var(--dim)',
    cyan: 'var(--cyan)',
    cyanSoft: 'var(--cyan-soft)',
    emerald: 'var(--emerald)',
    danger: 'var(--danger)',
    dangerSoft: 'rgba(239,68,68,0.2)'
  },
  radii: {
    xl: 'var(--radius-xl)',
    lg: 'var(--radius-lg)',
    md: 'var(--radius-md)',
    sm: 'var(--radius-sm)'
  },
  shadow: 'var(--shadow)',
  font: 'var(--font)',
  durations: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms'
  }
};

export function SubtitleEditorModal({ subtitle, videoPlayer, onSave, onCancel }) {
  let modal = null;
  let waveformCanvas = null;
  let textArea = null;
  let currentSubtitle = subtitle ? { ...subtitle } : null;
  let isPlaying = false;
  let playbackTimer = null;

  const modalContent = createElementFromHTML(`
    <div class="subtitle-editor-modal" style="
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: ${DESIGN_SYSTEM.colors.bg};
    ">
      <!-- Header -->
      <div class="modal-header" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid ${DESIGN_SYSTEM.colors.border};
      ">
        <h2 style="
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: ${DESIGN_SYSTEM.colors.text};
        ">Edit Subtitle</h2>
        <div style="display: flex; gap: 8px;">
          <button class="modal-btn cancel-btn" style="
            padding: 8px 16px;
            border: 1px solid ${DESIGN_SYSTEM.colors.border};
            border-radius: ${DESIGN_SYSTEM.radii.sm};
            background: ${DESIGN_SYSTEM.colors.panelSoft};
            color: ${DESIGN_SYSTEM.colors.text};
            font-size: 14px;
            cursor: pointer;
          ">Cancel</button>
          <button class="modal-btn save-btn" style="
            padding: 8px 16px;
            border: 1px solid ${DESIGN_SYSTEM.colors.cyan};
            border-radius: ${DESIGN_SYSTEM.radii.sm};
            background: ${DESIGN_SYSTEM.colors.cyanSoft};
            color: ${DESIGN_SYSTEM.colors.cyan};
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          ">Save Changes</button>
        </div>
      </div>

      <!-- Content -->
      <div class="modal-content" style="
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 24px;
        gap: 20px;
        overflow: hidden;
      ">
        <!-- Waveform Section -->
        <div class="waveform-section" style="
          flex-shrink: 0;
        ">
          <div style="
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 500;
            color: ${DESIGN_SYSTEM.colors.text};
          ">Audio Waveform</div>
          <div class="waveform-container" style="
            position: relative;
            height: 120px;
            background: ${DESIGN_SYSTEM.colors.panelSoft};
            border: 1px solid ${DESIGN_SYSTEM.colors.borderSoft};
            border-radius: ${DESIGN_SYSTEM.radii.md};
            overflow: hidden;
          ">
            <canvas class="waveform-canvas" style="
              width: 100%;
              height: 100%;
            "></canvas>
            <div class="waveform-overlay" style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              pointer-events: none;
            ">
              <!-- Current time indicator -->
              <div class="current-time-line" style="
                position: absolute;
                top: 0;
                bottom: 0;
                width: 2px;
                background: ${DESIGN_SYSTEM.colors.cyan};
                z-index: 10;
              "></div>
              <!-- Subtitle range indicator -->
              <div class="subtitle-range" style="
                position: absolute;
                top: 10px;
                bottom: 10px;
                background: rgba(34,211,238,0.2);
                border: 1px solid rgba(34,211,238,0.4);
                border-radius: 2px;
              "></div>
            </div>
          </div>

          <!-- Playback controls -->
          <div class="playback-controls" style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 12px;
          ">
            <button class="play-pause-btn" style="
              width: 32px;
              height: 32px;
              border: 1px solid ${DESIGN_SYSTEM.colors.border};
              border-radius: 50%;
              background: ${DESIGN_SYSTEM.colors.panelSoft};
              color: ${DESIGN_SYSTEM.colors.text};
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
            ">▶</button>
            <div class="time-display" style="
              font-size: 12px;
              color: ${DESIGN_SYSTEM.colors.muted};
              font-family: monospace;
            ">0:00.00 / 0:00.00</div>
            <div style="flex: 1;">
              <input type="range" class="seek-slider" min="0" max="100" value="0" style="
                width: 100%;
                height: 4px;
                border-radius: 2px;
                background: ${DESIGN_SYSTEM.colors.borderSoft};
                outline: none;
                -webkit-appearance: none;
                appearance: none;
              ">
            </div>
          </div>
        </div>

        <!-- Text Editing Section -->
        <div class="text-section" style="
          flex: 1;
          display: flex;
          flex-direction: column;
        ">
          <div style="
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 500;
            color: ${DESIGN_SYSTEM.colors.text};
          ">Subtitle Text</div>

          <textarea class="subtitle-textarea" style="
            flex: 1;
            padding: 16px;
            border: 1px solid ${DESIGN_SYSTEM.colors.border};
            border-radius: ${DESIGN_SYSTEM.radii.md};
            background: ${DESIGN_SYSTEM.colors.panelSoft};
            color: ${DESIGN_SYSTEM.colors.text};
            font-size: 16px;
            font-family: inherit;
            line-height: 1.5;
            resize: none;
            outline: none;
          " placeholder="Enter subtitle text..."></textarea>

          <!-- Character count -->
          <div class="char-count" style="
            margin-top: 8px;
            font-size: 12px;
            color: ${DESIGN_SYSTEM.colors.dim};
            text-align: right;
          ">0 characters</div>
        </div>

        <!-- Timing Section -->
        <div class="timing-section" style="
          flex-shrink: 0;
        ">
          <div style="
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 500;
            color: ${DESIGN_SYSTEM.colors.text};
          ">Timing</div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 12px; color: ${DESIGN_SYSTEM.colors.muted}; display: block; margin-bottom: 4px;">Start Time</label>
              <input type="number" class="time-input start-time" step="0.01" min="0" style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid ${DESIGN_SYSTEM.colors.border};
                border-radius: ${DESIGN_SYSTEM.radii.sm};
                background: ${DESIGN_SYSTEM.colors.panelSoft};
                color: ${DESIGN_SYSTEM.colors.text};
                font-size: 14px;
                font-family: monospace;
              ">
            </div>
            <div>
              <label style="font-size: 12px; color: ${DESIGN_SYSTEM.colors.muted}; display: block; margin-bottom: 4px;">End Time</label>
              <input type="number" class="time-input end-time" step="0.01" min="0" style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid ${DESIGN_SYSTEM.colors.border};
                border-radius: ${DESIGN_SYSTEM.radii.sm};
                background: ${DESIGN_SYSTEM.colors.panelSoft};
                color: ${DESIGN_SYSTEM.colors.text};
                font-size: 14px;
                font-family: monospace;
              ">
            </div>
            <div>
              <label style="font-size: 12px; color: ${DESIGN_SYSTEM.colors.muted}; display: block; margin-bottom: 4px;">Duration</label>
              <input type="number" class="time-input duration" step="0.01" min="0" readonly style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid ${DESIGN_SYSTEM.colors.borderSoft};
                border-radius: ${DESIGN_SYSTEM.radii.sm};
                background: ${DESIGN_SYSTEM.colors.panel};
                color: ${DESIGN_SYSTEM.colors.muted};
                font-size: 14px;
                font-family: monospace;
              ">
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  function initializeModal() {
    modal = new BaseModal({
      title: 'Edit Subtitle',
      content: modalContent,
      size: 'large',
      onClose: handleCancel
    });

    // Get references to elements
    waveformCanvas = modalContent.querySelector('.waveform-canvas');
    textArea = modalContent.querySelector('.subtitle-textarea');

    // Initialize with current subtitle data
    if (currentSubtitle) {
      textArea.value = currentSubtitle.text;
      updateTimingInputs();
      updateCharacterCount();
    }

    // Setup event listeners
    setupEventListeners();

    // Initialize waveform
    initializeWaveform();

    // Show modal
    modal.show();
  }

  function setupEventListeners() {
    // Modal buttons
    const cancelBtn = modalContent.querySelector('.cancel-btn');
    const saveBtn = modalContent.querySelector('.save-btn');

    cancelBtn.addEventListener('click', handleCancel);
    saveBtn.addEventListener('click', handleSave);

    // Text area
    textArea.addEventListener('input', updateCharacterCount);

    // Timing inputs
    const startInput = modalContent.querySelector('.start-time');
    const endInput = modalContent.querySelector('.end-time');

    startInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      if (currentSubtitle) {
        currentSubtitle.startTime = value;
        updateDuration();
        updateWaveformOverlay();
      }
    });

    endInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      if (currentSubtitle) {
        currentSubtitle.endTime = value;
        updateDuration();
        updateWaveformOverlay();
      }
    });

    // Playback controls
    const playPauseBtn = modalContent.querySelector('.play-pause-btn');
    const seekSlider = modalContent.querySelector('.seek-slider');

    playPauseBtn.addEventListener('click', togglePlayback);
    seekSlider.addEventListener('input', handleSeek);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
  }

  function initializeWaveform() {
    if (!waveformCanvas) return;

    const ctx = waveformCanvas.getContext('2d');
    const width = waveformCanvas.width = waveformCanvas.offsetWidth;
    const height = waveformCanvas.height = waveformCanvas.offsetHeight;

    // Generate sample waveform data (in a real implementation, this would come from audio analysis)
    const waveformData = generateSampleWaveform(width);

    // Draw waveform
    ctx.fillStyle = DESIGN_SYSTEM.colors.panel;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = DESIGN_SYSTEM.colors.cyan;
    ctx.lineWidth = 1;
    ctx.beginPath();

    const centerY = height / 2;
    waveformData.forEach((amplitude, x) => {
      const y = centerY + amplitude * centerY;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    updateWaveformOverlay();
  }

  function generateSampleWaveform(width) {
    const data = [];
    for (let x = 0; x < width; x++) {
      // Generate sample waveform with some variation
      const frequency = 0.02 + Math.sin(x * 0.01) * 0.01;
      const amplitude = Math.sin(x * frequency) * Math.cos(x * 0.005) * 0.8;
      data.push(amplitude);
    }
    return data;
  }

  function updateWaveformOverlay() {
    if (!currentSubtitle || !waveformCanvas) return;

    const duration = videoPlayer ? videoPlayer.duration : 60; // fallback
    const width = waveformCanvas.offsetWidth;

    const startPercent = (currentSubtitle.startTime / duration) * 100;
    const endPercent = (currentSubtitle.endTime / duration) * 100;

    const rangeElement = modalContent.querySelector('.subtitle-range');
    rangeElement.style.left = `${startPercent}%`;
    rangeElement.style.width = `${endPercent - startPercent}%`;
  }

  function updateTimingInputs() {
    if (!currentSubtitle) return;

    const startInput = modalContent.querySelector('.start-time');
    const endInput = modalContent.querySelector('.end-time');

    startInput.value = currentSubtitle.startTime.toFixed(2);
    endInput.value = currentSubtitle.endTime.toFixed(2);
    updateDuration();
  }

  function updateDuration() {
    if (!currentSubtitle) return;

    const durationInput = modalContent.querySelector('.duration');
    const duration = currentSubtitle.endTime - currentSubtitle.startTime;
    durationInput.value = duration.toFixed(2);
  }

  function updateCharacterCount() {
    const count = textArea.value.length;
    const charCountEl = modalContent.querySelector('.char-count');
    charCountEl.textContent = `${count} character${count !== 1 ? 's' : ''}`;
  }

  function togglePlayback() {
    if (!videoPlayer) return;

    const playPauseBtn = modalContent.querySelector('.play-pause-btn');

    if (isPlaying) {
      videoPlayer.pause();
      isPlaying = false;
      playPauseBtn.textContent = '▶';
      if (playbackTimer) {
        clearInterval(playbackTimer);
        playbackTimer = null;
      }
    } else {
      videoPlayer.play();
      isPlaying = true;
      playPauseBtn.textContent = '⏸';
      startPlaybackTimer();
    }
  }

  function startPlaybackTimer() {
    const timeDisplay = modalContent.querySelector('.time-display');
    const currentTimeLine = modalContent.querySelector('.current-time-line');
    const seekSlider = modalContent.querySelector('.seek-slider');

    playbackTimer = setInterval(() => {
      if (!videoPlayer) return;

      const currentTime = videoPlayer.currentTime;
      const duration = videoPlayer.duration || 60;

      // Update time display
      timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;

      // Update current time line
      const percent = (currentTime / duration) * 100;
      currentTimeLine.style.left = `${percent}%`;

      // Update seek slider
      seekSlider.value = percent;
    }, 100);
  }

  function handleSeek(e) {
    if (!videoPlayer) return;

    const percent = e.target.value;
    const duration = videoPlayer.duration || 60;
    const seekTime = (percent / 100) * duration;

    videoPlayer.currentTime = seekTime;
  }

  function handleKeyboard(e) {
    // Space to play/pause
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayback();
    }

    // Escape to close
    if (e.code === 'Escape') {
      handleCancel();
    }

    // Ctrl+S to save
    if (e.ctrlKey && e.code === 'KeyS') {
      e.preventDefault();
      handleSave();
    }
  }

  function handleSave() {
    if (!currentSubtitle) return;

    currentSubtitle.text = textArea.value.trim();

    // Update the subtitle in state
    subtitleState.updateSubtitle(currentSubtitle.id, {
      text: currentSubtitle.text,
      startTime: currentSubtitle.startTime,
      endTime: currentSubtitle.endTime
    });

    if (onSave) {
      onSave(currentSubtitle);
    }

    modal.close();
  }

  function handleCancel() {
    if (playbackTimer) {
      clearInterval(playbackTimer);
    }

    if (onCancel) {
      onCancel();
    }

    modal.close();
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  // Initialize the modal
  initializeModal();

  return {
    close: () => modal && modal.close(),
    getCurrentSubtitle: () => currentSubtitle
  };
}