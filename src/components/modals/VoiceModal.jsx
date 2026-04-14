import { BaseModal } from './BaseModal';

export class VoiceModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Select Voice',
      size: 'large',
      ...options
    });

    this.selectedVoice = options.selectedVoice || null;
    this.text = options.text || '';
    this.voices = [
      // Neural voices
      { id: 'neural-1', name: 'Emma (Neural)', language: 'en-US', gender: 'female', type: 'neural', sample: 'sample1.mp3' },
      { id: 'neural-2', name: 'James (Neural)', language: 'en-US', gender: 'male', type: 'neural', sample: 'sample2.mp3' },
      { id: 'neural-3', name: 'Sophie (Neural)', language: 'en-GB', gender: 'female', type: 'neural', sample: 'sample3.mp3' },
      { id: 'neural-4', name: 'Liam (Neural)', language: 'en-GB', gender: 'male', type: 'neural', sample: 'sample4.mp3' },

      // Standard voices
      { id: 'standard-1', name: 'Alice (Standard)', language: 'en-US', gender: 'female', type: 'standard', sample: 'sample5.mp3' },
      { id: 'standard-2', name: 'Bob (Standard)', language: 'en-US', gender: 'male', type: 'standard', sample: 'sample6.mp3' },
      { id: 'standard-3', name: 'Carol (Standard)', language: 'en-AU', gender: 'female', type: 'standard', sample: 'sample7.mp3' },
      { id: 'standard-4', name: 'David (Standard)', language: 'en-AU', gender: 'male', type: 'standard', sample: 'sample8.mp3' }
    ];

    this.filteredVoices = [...this.voices];
    this.currentFilter = { language: 'all', gender: 'all', type: 'all' };
    this.isPlayingSample = false;
  }

  renderBody() {
    return `
      <div class="voice-modal">
        <!-- Text Input -->
        <div class="text-input-section">
          <label for="voice-text">Text to Speak</label>
          <textarea
            id="voice-text"
            class="voice-text-input"
            placeholder="Enter the text you want to convert to speech..."
            rows="3"
          >${this.text}</textarea>
          <div class="text-stats">
            <span id="char-count">0 characters</span>
            <span id="word-count">0 words</span>
            <span id="est-duration">~0 seconds</span>
          </div>
        </div>

        <!-- Filters -->
        <div class="voice-filters">
          <div class="filter-group">
            <label>Language:</label>
            <select id="language-filter" class="filter-select">
              <option value="all">All Languages</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="en-AU">English (AU)</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Gender:</label>
            <select id="gender-filter" class="filter-select">
              <option value="all">All Genders</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Type:</label>
            <select id="type-filter" class="filter-select">
              <option value="all">All Types</option>
              <option value="neural">Neural (Premium)</option>
              <option value="standard">Standard</option>
            </select>
          </div>
        </div>

        <!-- Voices Grid -->
        <div class="voices-grid" id="voices-grid">
          ${this.renderVoices()}
        </div>

        <!-- Selected Voice Preview -->
        ${this.selectedVoice ? this.renderSelectedVoice() : ''}

        <!-- Voice Settings -->
        <div class="voice-settings">
          <details>
            <summary>Advanced Settings</summary>
            <div class="settings-grid">
              <div class="setting-item">
                <label for="speech-rate">Speech Rate:</label>
                <input type="range" id="speech-rate" min="0.5" max="2" step="0.1" value="1">
                <span class="setting-value">1.0x</span>
              </div>

              <div class="setting-item">
                <label for="pitch">Pitch:</label>
                <input type="range" id="pitch" min="0" max="2" step="0.1" value="1">
                <span class="setting-value">1.0</span>
              </div>

              <div class="setting-item">
                <label for="volume">Volume:</label>
                <input type="range" id="volume" min="0" max="1" step="0.1" value="1">
                <span class="setting-value">100%</span>
              </div>
            </div>
          </details>
        </div>
      </div>
    `;
  }

  renderVoices() {
    if (this.filteredVoices.length === 0) {
      return '<div class="no-voices">No voices match your filters</div>';
    }

    return this.filteredVoices.map(voice => `
      <div class="voice-item ${this.selectedVoice?.id === voice.id ? 'selected' : ''}" data-voice-id="${voice.id}">
        <div class="voice-header">
          <div class="voice-info">
            <h4 class="voice-name">${voice.name}</h4>
            <div class="voice-meta">
              <span class="voice-language">${voice.language}</span>
              <span class="voice-gender">${voice.gender}</span>
              ${voice.type === 'neural' ? '<span class="voice-type neural">Neural</span>' : '<span class="voice-type standard">Standard</span>'}
            </div>
          </div>
          <button class="voice-sample-btn" data-action="play-sample" data-voice-id="${voice.id}" title="Play Sample">
            ${this.isPlayingSample ? '⏸️' : '▶️'}
          </button>
        </div>

        <div class="voice-preview">
          <div class="preview-waveform">
            ${this.generateWaveform()}
          </div>
        </div>
      </div>
    `).join('');
  }

  renderSelectedVoice() {
    if (!this.selectedVoice) return '';

    return `
      <div class="selected-voice-preview">
        <h4>Selected Voice: ${this.selectedVoice.name}</h4>
        <div class="preview-controls">
          <button class="preview-btn" data-action="preview-text">Preview with Your Text</button>
          <button class="preview-btn" data-action="test-voice">Test Voice</button>
        </div>
        <div class="voice-quality-notice">
          ${this.selectedVoice.type === 'neural'
            ? '🎯 High-quality neural voice synthesis'
            : '📢 Standard voice synthesis'}
        </div>
      </div>
    `;
  }

  renderFooter() {
    const hasSelection = this.selectedVoice && this.text.trim();

    return `
      <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
      <div class="voice-selection-status">
        ${this.selectedVoice
          ? `Selected: ${this.selectedVoice.name} ${this.selectedVoice.type === 'neural' ? '(Neural)' : '(Standard)'}`
          : 'No voice selected'}
      </div>
      <button class="modal-btn ${hasSelection ? 'modal-btn-primary' : 'modal-btn-secondary'}" ${hasSelection ? '' : 'disabled'}>
        Apply Voice
      </button>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    this.setupVoiceEventListeners();
    this.updateTextStats();
  }

  setupVoiceEventListeners() {
    // Text input
    const textInput = this.overlay.querySelector('#voice-text');
    if (textInput) {
      textInput.addEventListener('input', () => {
        this.text = textInput.value;
        this.updateTextStats();
      });
    }

    // Filters
    const filters = ['language', 'gender', 'type'];
    filters.forEach(filter => {
      const select = this.overlay.querySelector(`#${filter}-filter`);
      if (select) {
        select.addEventListener('change', (e) => {
          this.currentFilter[filter] = e.target.value;
          this.applyFilters();
        });
      }
    });

    // Voice selection
    const voiceItems = this.overlay.querySelectorAll('.voice-item');
    voiceItems.forEach(item => {
      item.addEventListener('click', () => {
        const voiceId = item.dataset.voiceId;
        this.selectVoice(voiceId);
      });
    });

    // Sample playback
    const sampleBtns = this.overlay.querySelectorAll('.voice-sample-btn');
    sampleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const voiceId = e.currentTarget.dataset.voiceId;
        this.playVoiceSample(voiceId);
      });
    });

    // Preview buttons
    const previewBtns = this.overlay.querySelectorAll('.preview-btn');
    previewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handlePreviewAction(action);
      });
    });

    // Settings sliders
    const sliders = ['speech-rate', 'pitch', 'volume'];
    sliders.forEach(sliderId => {
      const slider = this.overlay.querySelector(`#${sliderId}`);
      const valueSpan = slider?.nextElementSibling;

      if (slider && valueSpan) {
        slider.addEventListener('input', () => {
          this.updateSettingValue(slider, valueSpan);
        });
      }
    });
  }

  selectVoice(voiceId) {
    const voice = this.voices.find(v => v.id === voiceId);
    if (!voice) return;

    this.selectedVoice = voice;

    // Update UI
    const voiceItems = this.overlay.querySelectorAll('.voice-item');
    voiceItems.forEach(item => {
      item.classList.toggle('selected', item.dataset.voiceId === voiceId);
    });

    // Update footer
    const footer = this.overlay.querySelector('.modal-footer');
    if (footer) {
      footer.innerHTML = this.renderFooter();
    }

    // Show selected voice preview
    this.updateSelectedVoicePreview();
  }

  applyFilters() {
    this.filteredVoices = this.voices.filter(voice => {
      return (this.currentFilter.language === 'all' || voice.language === this.currentFilter.language) &&
             (this.currentFilter.gender === 'all' || voice.gender === this.currentFilter.gender) &&
             (this.currentFilter.type === 'all' || voice.type === this.currentFilter.type);
    });

    this.updateVoicesGrid();
  }

  updateVoicesGrid() {
    const grid = this.overlay.querySelector('#voices-grid');
    if (grid) {
      grid.innerHTML = this.renderVoices();
      this.setupVoiceEventListeners();
    }
  }

  updateSelectedVoicePreview() {
    const existing = this.overlay.querySelector('.selected-voice-preview');
    if (existing) {
      existing.remove();
    }

    if (this.selectedVoice) {
      const preview = document.createElement('div');
      preview.innerHTML = this.renderSelectedVoice();
      preview.className = 'selected-voice-preview';

      const textSection = this.overlay.querySelector('.text-input-section');
      if (textSection) {
        textSection.insertAdjacentElement('afterend', preview);
      }
    }
  }

  updateTextStats() {
    const charCount = this.text.length;
    const wordCount = this.text.trim() ? this.text.trim().split(/\s+/).length : 0;
    const estimatedDuration = Math.ceil(wordCount * 0.5); // Rough estimate: 0.5 seconds per word

    const charEl = this.overlay.querySelector('#char-count');
    const wordEl = this.overlay.querySelector('#word-count');
    const durationEl = this.overlay.querySelector('#est-duration');

    if (charEl) charEl.textContent = `${charCount} characters`;
    if (wordEl) wordEl.textContent = `${wordCount} words`;
    if (durationEl) durationEl.textContent = `~${estimatedDuration} seconds`;
  }

  playVoiceSample(voiceId) {
    // Implement voice sample playback
    console.log('Playing sample for voice:', voiceId);
    this.isPlayingSample = !this.isPlayingSample;

    // Update button states
    const btn = this.overlay.querySelector(`[data-voice-id="${voiceId}"] .voice-sample-btn`);
    if (btn) {
      btn.innerHTML = this.isPlayingSample ? '⏸️' : '▶️';
    }
  }

  handlePreviewAction(action) {
    switch (action) {
      case 'preview-text':
        this.previewWithText();
        break;
      case 'test-voice':
        this.testVoice();
        break;
    }
  }

  updateSettingValue(slider, valueSpan) {
    const value = parseFloat(slider.value);
    const id = slider.id;

    switch (id) {
      case 'speech-rate':
        valueSpan.textContent = `${value}x`;
        break;
      case 'pitch':
        valueSpan.textContent = value.toFixed(1);
        break;
      case 'volume':
        valueSpan.textContent = `${Math.round(value * 100)}%`;
        break;
    }
  }

  previewWithText() {
    if (!this.selectedVoice || !this.text.trim()) {
      alert('Please select a voice and enter text first.');
      return;
    }

    console.log('Previewing text with selected voice:', this.selectedVoice.name);
    // Implement text preview functionality
  }

  testVoice() {
    if (!this.selectedVoice) {
      alert('Please select a voice first.');
      return;
    }

    console.log('Testing selected voice:', this.selectedVoice.name);
    // Implement voice test functionality
  }

  generateWaveform() {
    // Generate a simple waveform visualization
    const bars = 20;
    return Array.from({ length: bars }, (_, i) => {
      const height = 10 + Math.sin((i / bars) * Math.PI * 4) * 8;
      return `<div class="waveform-bar" style="height: ${height}px;"></div>`;
    }).join('');
  }

  handleConfirm() {
    if (!this.selectedVoice) {
      alert('Please select a voice first.');
      return;
    }

    if (!this.text.trim()) {
      alert('Please enter some text to convert to speech.');
      return;
    }

    const voiceData = {
      voice: this.selectedVoice,
      text: this.text,
      settings: {
        speechRate: parseFloat(this.overlay.querySelector('#speech-rate')?.value || 1),
        pitch: parseFloat(this.overlay.querySelector('#pitch')?.value || 1),
        volume: parseFloat(this.overlay.querySelector('#volume')?.value || 1)
      }
    };

    this.onConfirm(voiceData);
    this.close();
  }

  // Public API
  setText(text) {
    this.text = text;
    if (this.overlay) {
      const textInput = this.overlay.querySelector('#voice-text');
      if (textInput) {
        textInput.value = text;
        this.updateTextStats();
      }
    }
  }

  getSelectedVoice() {
    return this.selectedVoice;
  }

  setSelectedVoice(voiceId) {
    const voice = this.voices.find(v => v.id === voiceId);
    if (voice) {
      this.selectedVoice = voice;
    }
  }
}

export default VoiceModal;