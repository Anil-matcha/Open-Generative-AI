import { BaseModal } from './BaseModal';

export class TeleprompterModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Teleprompter',
      size: 'large',
      ...options
    });

    this.script = options.script || '';
    this.speed = options.speed || 100;
    this.fontSize = options.fontSize || 24;
    this.isPlaying = false;
    this.currentPosition = 0;
  }

  renderBody() {
    return `
      <div class="teleprompter-container">
        <div class="teleprompter-controls">
          <div class="control-group">
            <label for="script-input">Script:</label>
            <textarea
              id="script-input"
              class="script-input"
              placeholder="Enter your script here..."
              rows="6"
            >${this.script}</textarea>
          </div>

          <div class="control-row">
            <div class="control-group">
              <label for="speed-slider">Speed:</label>
              <input
                type="range"
                id="speed-slider"
                min="50"
                max="200"
                value="${this.speed}"
                class="speed-slider"
              />
              <span class="speed-value">${this.speed}%</span>
            </div>

            <div class="control-group">
              <label for="font-size-slider">Font Size:</label>
              <input
                type="range"
                id="font-size-slider"
                min="12"
                max="48"
                value="${this.fontSize}"
                class="font-size-slider"
              />
              <span class="font-size-value">${this.fontSize}px</span>
            </div>
          </div>

          <div class="teleprompter-actions">
            <button class="modal-btn modal-btn-secondary play-btn">
              ${this.isPlaying ? 'Pause' : 'Start'} Teleprompter
            </button>
            <button class="modal-btn modal-btn-secondary reset-btn">
              Reset
            </button>
          </div>
        </div>

        <div class="teleprompter-display">
          <div class="teleprompter-text" style="font-size: ${this.fontSize}px;">
            ${this.formatScript(this.script)}
          </div>
        </div>
      </div>
    `;
  }

  formatScript(script) {
    if (!script) return '<span class="placeholder-text">Enter your script above to begin...</span>';

    return script.split('\n').map(line =>
      line.trim() ? `<div class="script-line">${line}</div>` : '<br>'
    ).join('');
  }

  setupEventListeners() {
    super.setupEventListeners();

    const scriptInput = this.overlay?.querySelector('.script-input');
    const speedSlider = this.overlay?.querySelector('.speed-slider');
    const speedValue = this.overlay?.querySelector('.speed-value');
    const fontSizeSlider = this.overlay?.querySelector('.font-size-slider');
    const fontSizeValue = this.overlay?.querySelector('.font-size-value');
    const playBtn = this.overlay?.querySelector('.play-btn');
    const resetBtn = this.overlay?.querySelector('.reset-btn');

    if (scriptInput) {
      scriptInput.addEventListener('input', (e) => {
        this.script = e.target.value;
        this.updateDisplay();
      });
    }

    if (speedSlider && speedValue) {
      speedSlider.addEventListener('input', (e) => {
        this.speed = parseInt(e.target.value);
        speedValue.textContent = `${this.speed}%`;
      });
    }

    if (fontSizeSlider && fontSizeValue) {
      fontSizeSlider.addEventListener('input', (e) => {
        this.fontSize = parseInt(e.target.value);
        fontSizeValue.textContent = `${this.fontSize}px`;
        this.updateDisplay();
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        playBtn.textContent = this.isPlaying ? 'Pause Teleprompter' : 'Start Teleprompter';
        this.togglePlayback();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.currentPosition = 0;
        this.isPlaying = false;
        this.updateDisplay();
        if (playBtn) playBtn.textContent = 'Start Teleprompter';
      });
    }
  }

  updateDisplay() {
    const display = this.overlay?.querySelector('.teleprompter-text');
    if (display) {
      display.style.fontSize = `${this.fontSize}px`;
      display.innerHTML = this.formatScript(this.script);
    }
  }

  togglePlayback() {
    // Teleprompter scrolling logic would go here
    // For now, just update the UI state
    const display = this.overlay?.querySelector('.teleprompter-display');
    if (display) {
      if (this.isPlaying) {
        display.classList.add('playing');
      } else {
        display.classList.remove('playing');
      }
    }
  }
}