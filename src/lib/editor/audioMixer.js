/**
 * Professional Audio Mixing System for Timeline Editor
 * Provides comprehensive multi-track audio mixing with automation
 */

import { KeyframeSystem, ANIMATION_PROPERTIES } from './keyframeSystem.js';

export class AudioMixer {
  constructor(timelineContainer, state, keyframeSystem) {
    this.timelineContainer = timelineContainer;
    this.state = state;
    this.keyframeSystem = keyframeSystem;
    this.audioContext = null;
    this.masterBus = null;
    this.trackBuses = new Map();
    this.audioMixerPanel = null;
    this.selectedTrackId = null;
    this.audioEffects = new Map(); // Track effects per track

    this.initialize();
  }

  async initialize() {
    await this.initializeAudioContext();
    this.createAudioMixerPanel();
    this.createMasterTrack();
    this.bindEvents();
  }

  async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterBus = this.audioContext.createGain();
      this.masterBus.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  createAudioMixerPanel() {
    const panel = document.createElement('div');
    panel.className = 'audio-mixer-panel';
    panel.innerHTML = `
      <div class="mixer-header">
        <h3>Audio Mixer</h3>
        <div class="mixer-tabs">
          <button class="mixer-tab active" data-tab="tracks">Tracks</button>
          <button class="mixer-tab" data-tab="effects">Effects</button>
          <button class="mixer-tab" data-tab="automation">Automation</button>
        </div>
      </div>

      <div class="tab-content active" data-tab="tracks">
        <div class="track-list"></div>
      </div>

      <div class="tab-content" data-tab="effects">
        <div class="effects-chain"></div>
      </div>

      <div class="tab-content" data-tab="automation">
        <div class="automation-editor"></div>
      </div>

      <div class="master-section">
        <div class="master-controls"></div>
      </div>
    `;

    this.audioMixerPanel = panel;
    this.bindMixerEvents();
    return panel;
  }

  createMasterTrack() {
    const masterControls = this.audioMixerPanel.querySelector('.master-controls');
    masterControls.innerHTML = `
      <div class="master-track">
        <div class="track-header">
          <span class="track-name">Master</span>
          <div class="track-meters"></div>
        </div>
        <div class="track-controls">
          <div class="fader-section">
            <label>Volume</label>
            <input type="range" class="volume-fader" data-track="master" min="0" max="100" value="80" orient="vertical">
            <span class="fader-value">0 dB</span>
          </div>
          <div class="pan-section">
            <label>Pan</label>
            <input type="range" class="pan-knob" data-track="master" min="-100" max="100" value="0">
            <span class="pan-value">C</span>
          </div>
        </div>
        <div class="master-effects"></div>
      </div>
    `;
  }

  createTrackStrip(track) {
    const trackElement = document.createElement('div');
    trackElement.className = 'track-strip';
    trackElement.dataset.trackId = track.id;
    trackElement.innerHTML = `
      <div class="track-header ${track.muted ? 'muted' : ''} ${track.solo ? 'solo' : ''}">
        <span class="track-name">${track.name}</span>
        <div class="track-buttons">
          <button class="track-btn mute-btn" data-action="mute" title="Mute">M</button>
          <button class="track-btn solo-btn" data-action="solo" title="Solo">S</button>
        </div>
        <div class="track-meters">
          <div class="level-meter"></div>
        </div>
      </div>
      <div class="track-controls">
        <div class="fader-section">
          <input type="range" class="volume-fader" data-track="${track.id}" min="0" max="100" value="${track.volume || 80}" orient="vertical">
          <span class="fader-value">${this.volumeToDb(track.volume || 80)} dB</span>
        </div>
        <div class="pan-section">
          <input type="range" class="pan-knob" data-track="${track.id}" min="-100" max="100" value="${track.pan || 0}">
          <span class="pan-value">${this.panToText(track.pan || 0)}</span>
        </div>
        <div class="eq-section">
          <div class="eq-controls"></div>
        </div>
      </div>
      <div class="track-effects">
        <div class="effects-chain">
          <div class="effect-slot" data-effect="eq">EQ</div>
          <div class="effect-slot" data-effect="compressor">Comp</div>
          <div class="effect-slot" data-effect="reverb">Reverb</div>
          <div class="effect-slot" data-effect="delay">Delay</div>
        </div>
      </div>
    `;

    return trackElement;
  }

  volumeToDb(volume) {
    if (volume <= 0) return '-∞';
    const db = 20 * Math.log10(volume / 100);
    return db.toFixed(1) + ' dB';
  }

  panToText(pan) {
    if (pan === 0) return 'C';
    if (pan < 0) return 'L' + Math.abs(pan);
    return 'R' + pan;
  }

  updateTrackList() {
    const trackList = this.audioMixerPanel.querySelector('.track-list');
    trackList.innerHTML = '';

    const audioTracks = this.state.tracks.filter(track => track.type === 'audio');
    audioTracks.forEach(track => {
      const trackStrip = this.createTrackStrip(track);
      trackList.appendChild(trackStrip);
    });
  }

  bindMixerEvents() {
    this.audioMixerPanel.addEventListener('input', (e) => {
      if (e.target.classList.contains('volume-fader')) {
        this.handleVolumeChange(e);
      } else if (e.target.classList.contains('pan-knob')) {
        this.handlePanChange(e);
      }
    });

    this.audioMixerPanel.addEventListener('click', (e) => {
      if (e.target.classList.contains('track-btn')) {
        this.handleTrackButton(e);
      }
    });

    this.audioMixerPanel.addEventListener('change', (e) => {
      if (e.target.classList.contains('mixer-tab')) {
        this.switchMixerTab(e.target.dataset.tab);
      }
    });
  }

  handleVolumeChange(e) {
    const trackId = e.target.dataset.track;
    const volume = parseInt(e.target.value);
    const dbValue = this.volumeToDb(volume);

    e.target.nextElementSibling.textContent = dbValue;

    // Update track state
    if (trackId === 'master') {
      this.state.masterVolume = volume;
      if (this.masterBus) {
        this.masterBus.gain.value = volume / 100;
      }
    } else {
      const track = this.state.tracks.find(t => t.id === trackId);
      if (track) {
        track.volume = volume;
        // Apply automation if keyframes exist
        this.applyVolumeAutomation(track);
      }
    }
  }

  handlePanChange(e) {
    const trackId = e.target.dataset.track;
    const pan = parseInt(e.target.value);
    const panText = this.panToText(pan);

    e.target.nextElementSibling.textContent = panText;

    // Update track state
    if (trackId === 'master') {
      this.state.masterPan = pan;
    } else {
      const track = this.state.tracks.find(t => t.id === trackId);
      if (track) {
        track.pan = pan;
        // Apply pan automation
        this.applyPanAutomation(track);
      }
    }
  }

  handleTrackButton(e) {
    const action = e.target.dataset.action;
    const trackElement = e.target.closest('.track-strip');
    const trackId = trackElement.dataset.trackId;
    const track = this.state.tracks.find(t => t.id === trackId);

    if (!track) return;

    if (action === 'mute') {
      track.muted = !track.muted;
      e.target.classList.toggle('active', track.muted);
      trackElement.classList.toggle('muted', track.muted);
    } else if (action === 'solo') {
      track.solo = !track.solo;
      e.target.classList.toggle('active', track.solo);
      trackElement.classList.toggle('solo', track.solo);
      this.updateSoloState();
    }
  }

  updateSoloState() {
    const hasSolo = this.state.tracks.some(t => t.solo);
    this.state.tracks.forEach(track => {
      const shouldMute = hasSolo && !track.solo && !track.muted;
      // Apply mute state
    });
  }

  applyVolumeAutomation(track) {
    // Get volume keyframes for this track
    const volumeKeyframes = this.keyframeSystem.getAllKeyframes(track.id)
      .filter(kf => kf.property === 'volume');

    if (volumeKeyframes.length === 0) return;

    // Apply current volume based on playhead
    const currentTime = this.state.currentTime || 0;
    const currentVolume = this.keyframeSystem.evaluateAtTime(track.id, 'volume', currentTime);
    track.volume = currentVolume;
  }

  applyPanAutomation(track) {
    // Similar to volume automation
    const panKeyframes = this.keyframeSystem.getAllKeyframes(track.id)
      .filter(kf => kf.property === 'pan');

    if (panKeyframes.length === 0) return;

    const currentTime = this.state.currentTime || 0;
    const currentPan = this.keyframeSystem.evaluateAtTime(track.id, 'pan', currentTime);
    track.pan = currentPan;
  }

  switchMixerTab(tabName) {
    // Switch active tab
    const tabs = this.audioMixerPanel.querySelectorAll('.mixer-tab');
    const contents = this.audioMixerPanel.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    this.audioMixerPanel.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    this.audioMixerPanel.querySelector(`.tab-content[data-tab="${tabName}"]`).classList.add('active');
  }

  bindEvents() {
    // Listen for track changes
    this.state.addEventListener('tracks-changed', () => {
      this.updateTrackList();
    });

    // Listen for playhead changes for automation
    this.state.addEventListener('time-changed', () => {
      this.updateAutomation();
    });
  }

  updateAutomation() {
    // Update all tracks with automation
    const audioTracks = this.state.tracks.filter(track => track.type === 'audio');
    audioTracks.forEach(track => {
      this.applyVolumeAutomation(track);
      this.applyPanAutomation(track);
    });
  }

  // Export mixer settings
  exportSettings() {
    return {
      master: {
        volume: this.state.masterVolume || 80,
        pan: this.state.masterPan || 0
      },
      tracks: this.state.tracks
        .filter(track => track.type === 'audio')
        .map(track => ({
          id: track.id,
          volume: track.volume || 80,
          pan: track.pan || 0,
          muted: track.muted || false,
          solo: track.solo || false
        }))
    };
  }

  // Import mixer settings
  importSettings(settings) {
    if (settings.master) {
      this.state.masterVolume = settings.master.volume;
      this.state.masterPan = settings.master.pan;
    }

    if (settings.tracks) {
      settings.tracks.forEach(trackSettings => {
        const track = this.state.tracks.find(t => t.id === trackSettings.id);
        if (track) {
          Object.assign(track, trackSettings);
        }
      });
    }

    this.updateTrackList();
  }
}
