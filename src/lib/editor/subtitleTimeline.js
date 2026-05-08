/**
 * SubtitleTimeline - Timeline integration for displaying subtitles on video
 * Renders subtitle tracks and handles synchronization with video playback
 */

import { subtitleState } from './subtitleState.js';

class SubtitleTimeline {
  constructor(timelineContainer, videoPlayer, options = {}) {
    this.timelineContainer = timelineContainer;
    this.videoPlayer = videoPlayer;
    this.options = {
      trackHeight: 40,
      subtitleHeight: 30,
      fontSize: 12,
      showWaveform: true,
      waveformHeight: 60,
      ...options
    };

    this.subtitleTrack = null;
    this.waveformTrack = null;
    this.isVisible = true;
    this.listeners = new Set();

    this._setupEventListeners();
    this._createSubtitleTrack();
    this._render();
  }

  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    // Listen to subtitle state changes
    subtitleState.addListener((event, data) => {
      switch (event) {
        case 'subtitles-changed':
        case 'subtitle-added':
        case 'subtitle-updated':
        case 'subtitle-deleted':
          this._render();
          break;
        case 'selection-changed':
          this._updateSelection(data);
          break;
      }
    });

    // Listen to video player events
    if (this.videoPlayer) {
      this.videoPlayer.addEventListener('timeupdate', () => {
        this._updateCurrentTimeIndicator();
      });

      this.videoPlayer.addEventListener('play', () => {
        this._onPlaybackStart();
      });

      this.videoPlayer.addEventListener('pause', () => {
        this._onPlaybackPause();
      });
    }
  }

  /**
   * Create subtitle track element
   */
  _createSubtitleTrack() {
    // Create waveform track if enabled
    if (this.options.showWaveform) {
      this.waveformTrack = this._createTrackElement('waveform-track', this.options.waveformHeight);
      this.timelineContainer.appendChild(this.waveformTrack);
    }

    // Create subtitle track
    this.subtitleTrack = this._createTrackElement('subtitle-track', this.options.trackHeight);
    this.subtitleTrack.style.borderTop = '1px solid var(--border)';
    this.subtitleTrack.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.05) 0%, rgba(34,211,238,0.02) 100%)';
    this.timelineContainer.appendChild(this.subtitleTrack);

    // Add track label
    const label = document.createElement('div');
    label.className = 'track-label';
    label.textContent = 'Subtitles';
    label.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--cyan);
      background: rgba(34,211,238,0.1);
      border-right: 1px solid var(--border);
      z-index: 1;
    `;
    this.subtitleTrack.appendChild(label);

    // Add current time indicator
    this.currentTimeIndicator = document.createElement('div');
    this.currentTimeIndicator.className = 'current-time-indicator';
    this.currentTimeIndicator.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--cyan);
      z-index: 10;
      pointer-events: none;
    `;
    this.subtitleTrack.appendChild(this.currentTimeIndicator);
  }

  /**
   * Create track element
   */
  _createTrackElement(className, height) {
    const track = document.createElement('div');
    track.className = `timeline-track ${className}`;
    track.style.cssText = `
      position: relative;
      height: ${height}px;
      width: 100%;
      overflow: hidden;
      user-select: none;
    `;
    return track;
  }

  /**
   * Render subtitles on timeline
   */
  _render() {
    if (!this.subtitleTrack) return;

    // Clear existing subtitle elements
    const existingSubtitles = this.subtitleTrack.querySelectorAll('.subtitle-item');
    existingSubtitles.forEach(el => el.remove());

    const timelineWidth = this.timelineContainer.offsetWidth - 80; // Account for label
    const duration = this._getTimelineDuration();

    if (duration === 0) return;

    subtitleState.subtitles.forEach(subtitle => {
      const element = this._createSubtitleElement(subtitle, timelineWidth, duration);
      this.subtitleTrack.appendChild(element);
    });
  }

  /**
   * Create subtitle element for timeline
   */
  _createSubtitleElement(subtitle, timelineWidth, duration) {
    const element = document.createElement('div');
    element.className = 'subtitle-item';
    element.dataset.subtitleId = subtitle.id;

    const left = (subtitle.startTime / duration) * timelineWidth;
    const width = ((subtitle.endTime - subtitle.startTime) / duration) * timelineWidth;

    element.style.cssText = `
      position: absolute;
      left: ${80 + left}px;
      top: 5px;
      height: ${this.options.subtitleHeight - 10}px;
      width: ${Math.max(width, 20)}px;
      background: rgba(34,211,238,0.3);
      border: 1px solid rgba(34,211,238,0.5);
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0 4px;
      font-size: ${this.options.fontSize}px;
      color: var(--text);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      transition: all 0.15s ease;
    `;

    // Add selection state
    if (subtitle.id === subtitleState.selectedSubtitleId) {
      element.style.background = 'rgba(34,211,238,0.6)';
      element.style.borderColor = 'var(--cyan)';
      element.style.boxShadow = '0 0 8px rgba(34,211,238,0.4)';
    }

    // Add confidence indicator
    if (subtitle.confidence < 0.8) {
      const confidenceBar = document.createElement('div');
      confidenceBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: ${subtitle.confidence < 0.6 ? 'var(--danger)' : 'var(--emerald)'};
        opacity: 0.7;
      `;
      element.appendChild(confidenceBar);
    }

    // Add text
    const textSpan = document.createElement('span');
    textSpan.textContent = subtitle.text;
    textSpan.style.cssText = `
      pointer-events: none;
      user-select: none;
    `;
    element.appendChild(textSpan);

    // Add resize handles
    const leftHandle = document.createElement('div');
    leftHandle.className = 'resize-handle left';
    leftHandle.style.cssText = `
      position: absolute;
      left: -2px;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--cyan);
      opacity: 0;
      cursor: ew-resize;
      transition: opacity 0.15s ease;
    `;
    element.appendChild(leftHandle);

    const rightHandle = document.createElement('div');
    rightHandle.className = 'resize-handle right';
    rightHandle.style.cssText = `
      position: absolute;
      right: -2px;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--cyan);
      opacity: 0;
      cursor: ew-resize;
      transition: opacity 0.15s ease;
    `;
    element.appendChild(rightHandle);

    // Event listeners
    element.addEventListener('click', (e) => {
      e.stopPropagation();
      subtitleState.setSelectedSubtitle(subtitle.id);
    });

    element.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this._onSubtitleDoubleClick(subtitle);
    });

    element.addEventListener('mouseenter', () => {
      leftHandle.style.opacity = '1';
      rightHandle.style.opacity = '1';
      element.style.transform = 'translateY(-1px)';
    });

    element.addEventListener('mouseleave', () => {
      leftHandle.style.opacity = '0';
      rightHandle.style.opacity = '0';
      element.style.transform = 'translateY(0)';
    });

    // Resize functionality
    let isResizing = false;
    let resizeStartX = 0;
    let originalStart = 0;
    let originalEnd = 0;

    const startResize = (e, isLeft) => {
      e.stopPropagation();
      isResizing = true;
      resizeStartX = e.clientX;
      originalStart = subtitle.startTime;
      originalEnd = subtitle.endTime;

      const handleMouseMove = (e) => {
        if (!isResizing) return;

        const deltaX = e.clientX - resizeStartX;
        const deltaTime = (deltaX / timelineWidth) * duration;

        if (isLeft) {
          const newStart = Math.max(0, originalStart + deltaTime);
          subtitleState.updateSubtitle(subtitle.id, { startTime: newStart });
        } else {
          const newEnd = Math.max(originalStart + 0.1, originalEnd + deltaTime);
          subtitleState.updateSubtitle(subtitle.id, { endTime: newEnd });
        }
      };

      const handleMouseUp = () => {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    leftHandle.addEventListener('mousedown', (e) => startResize(e, true));
    rightHandle.addEventListener('mousedown', (e) => startResize(e, false));

    return element;
  }

  /**
   * Update selection visual state
   */
  _updateSelection(selectedId) {
    const elements = this.subtitleTrack.querySelectorAll('.subtitle-item');
    elements.forEach(el => {
      const isSelected = el.dataset.subtitleId === selectedId;
      el.style.background = isSelected ? 'rgba(34,211,238,0.6)' : 'rgba(34,211,238,0.3)';
      el.style.borderColor = isSelected ? 'var(--cyan)' : 'rgba(34,211,238,0.5)';
      el.style.boxShadow = isSelected ? '0 0 8px rgba(34,211,238,0.4)' : 'none';
    });
  }

  /**
   * Update current time indicator
   */
  _updateCurrentTimeIndicator() {
    if (!this.videoPlayer || !this.currentTimeIndicator) return;

    const duration = this.videoPlayer.duration || this._getTimelineDuration();
    if (duration === 0) return;

    const timelineWidth = this.timelineContainer.offsetWidth - 80;
    const currentTime = this.videoPlayer.currentTime || 0;
    const left = (currentTime / duration) * timelineWidth;

    this.currentTimeIndicator.style.left = `${80 + left}px`;
  }

  /**
   * Handle subtitle double click (open editor)
   */
  _onSubtitleDoubleClick(subtitle) {
    this.listeners.forEach(callback => {
      callback('subtitle-double-click', subtitle);
    });
  }

  /**
   * Handle playback start
   */
  _onPlaybackStart() {
    // Could add visual feedback for active subtitles during playback
  }

  /**
   * Handle playback pause
   */
  _onPlaybackPause() {
    // Could add pause indicators
  }

  /**
   * Get timeline duration
   */
  _getTimelineDuration() {
    if (this.videoPlayer && this.videoPlayer.duration) {
      return this.videoPlayer.duration;
    }

    // Fallback to max subtitle end time
    const maxTime = Math.max(...subtitleState.subtitles.map(s => s.endTime), 0);
    return maxTime > 0 ? maxTime : 60; // Default 60 seconds
  }

  /**
   * Show/hide subtitle timeline
   */
  setVisible(visible) {
    this.isVisible = visible;
    if (this.subtitleTrack) {
      this.subtitleTrack.style.display = visible ? 'block' : 'none';
    }
    if (this.waveformTrack) {
      this.waveformTrack.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Add event listener
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove event listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Update timeline zoom level
   */
  setZoom(zoomLevel) {
    // Adjust rendering based on zoom level
    this._render();
  }

  /**
   * Get subtitle at timeline position
   */
  getSubtitleAtPosition(x, y) {
    const rect = this.subtitleTrack.getBoundingClientRect();
    if (y < rect.top || y > rect.bottom) return null;

    const timelineWidth = this.timelineContainer.offsetWidth - 80;
    const duration = this._getTimelineDuration();
    const timeX = ((x - 80) / timelineWidth) * duration;

    return subtitleState.getCurrentSubtitle(timeX);
  }

  /**
   * Scroll to subtitle
   */
  scrollToSubtitle(subtitleId) {
    const element = this.subtitleTrack.querySelector(`[data-subtitle-id="${subtitleId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Destroy timeline integration
   */
  destroy() {
    if (this.subtitleTrack) {
      this.subtitleTrack.remove();
    }
    if (this.waveformTrack) {
      this.waveformTrack.remove();
    }
    this.listeners.clear();
    subtitleState.removeListener(this._handleStateChange);
  }
}

export { SubtitleTimeline };