import { BaseModal } from './BaseModal.jsx';

/**
 * AIVideoCreator Modal
 * AI-powered video generation and editing modal
 */
export class AIVideoCreator extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'AI Video Creator',
      size: 'large',
      showFooter: true,
      footerContent: `
        <button class="modal-btn modal-btn-secondary" data-action="cancel">Cancel</button>
        <button class="modal-btn modal-btn-primary" data-action="generate">Generate Video</button>
      `,
      ...options
    });

    this.generationType = 'text-to-video';
    this.prompt = '';
    this.style = 'cinematic';
    this.duration = 10;
    this.aspectRatio = '16:9';
    this.quality = 'high';
    this.isGenerating = false;
    this.generationProgress = 0;
  }

  renderBody() {
    return `
      <div class="ai-video-creator">
        <div class="generation-type-selector">
          <button class="type-btn ${this.generationType === 'text-to-video' ? 'active' : ''}" data-type="text-to-video">
            <span class="type-icon">📝</span>
            <span class="type-label">Text to Video</span>
          </button>
          <button class="type-btn ${this.generationType === 'image-to-video' ? 'active' : ''}" data-type="image-to-video">
            <span class="type-icon">🖼️</span>
            <span class="type-label">Image to Video</span>
          </button>
          <button class="type-btn ${this.generationType === 'video-to-video' ? 'active' : ''}" data-type="video-to-video">
            <span class="type-icon">🎬</span>
            <span class="type-label">Video to Video</span>
          </button>
        </div>

        <div class="prompt-section">
          <label for="ai-prompt">Describe your video</label>
          <textarea id="ai-prompt" placeholder="A cinematic shot of a futuristic city at sunset with flying vehicles...">${this.prompt}</textarea>
          <div class="prompt-suggestions">
            <span class="suggestion-label">Try:</span>
            <button class="suggestion-btn">Cinematic drone shot</button>
            <button class="suggestion-btn">Slow motion waterfall</button>
            <button class="suggestion-btn">Time-lapse city</button>
          </div>
        </div>

        <div class="style-section">
          <label>Visual Style</label>
          <div class="style-options">
            <button class="style-btn ${this.style === 'cinematic' ? 'active' : ''}" data-style="cinematic">
              <span class="style-icon">🎥</span>
              <span>Cinematic</span>
            </button>
            <button class="style-btn ${this.style === 'anime' ? 'active' : ''}" data-style="anime">
              <span class="style-icon">✨</span>
              <span>Anime</span>
            </button>
            <button class="style-btn ${this.style === 'realistic' ? 'active' : ''}" data-style="realistic">
              <span class="style-icon">📷</span>
              <span>Realistic</span>
            </button>
            <button class="style-btn ${this.style === 'abstract' ? 'active' : ''}" data-style="abstract">
              <span class="style-icon">🎨</span>
              <span>Abstract</span>
            </button>
          </div>
        </div>

        <div class="settings-row">
          <div class="setting-group">
            <label>Duration</label>
            <select id="duration-select">
              <option value="5" ${this.duration === 5 ? 'selected' : ''}>5 seconds</option>
              <option value="10" ${this.duration === 10 ? 'selected' : ''}>10 seconds</option>
              <option value="15" ${this.duration === 15 ? 'selected' : ''}>15 seconds</option>
              <option value="30" ${this.duration === 30 ? 'selected' : ''}>30 seconds</option>
            </select>
          </div>
          <div class="setting-group">
            <label>Aspect Ratio</label>
            <select id="aspect-select">
              <option value="16:9" ${this.aspectRatio === '16:9' ? 'selected' : ''}>16:9 (Landscape)</option>
              <option value="9:16" ${this.aspectRatio === '9:16' ? 'selected' : ''}>9:16 (Portrait)</option>
              <option value="1:1" ${this.aspectRatio === '1:1' ? 'selected' : ''}>1:1 (Square)</option>
              <option value="4:3" ${this.aspectRatio === '4:3' ? 'selected' : ''}>4:3</option>
            </select>
          </div>
          <div class="setting-group">
            <label>Quality</label>
            <select id="quality-select">
              <option value="standard" ${this.quality === 'standard' ? 'selected' : ''}>Standard</option>
              <option value="high" ${this.quality === 'high' ? 'selected' : ''}>High</option>
              <option value="ultra" ${this.quality === 'ultra' ? 'selected' : ''}>Ultra HD</option>
            </select>
          </div>
        </div>

        ${this.isGenerating ? `
          <div class="generation-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${this.generationProgress}%"></div>
            </div>
            <span class="progress-text">Generating... ${this.generationProgress}%</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Type selector buttons
    this.content.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.generationType = e.currentTarget.dataset.type;
        this.render();
      });
    });

    // Style buttons
    this.content.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.style = e.currentTarget.dataset.style;
        this.render();
      });
    });

    // Prompt textarea
    const promptEl = this.content.querySelector('#ai-prompt');
    if (promptEl) {
      promptEl.addEventListener('input', (e) => {
        this.prompt = e.target.value;
      });
    }

    // Suggestion buttons
    this.content.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.prompt = e.target.textContent;
        this.render();
      });
    });

    // Duration select
    const durationSelect = this.content.querySelector('#duration-select');
    if (durationSelect) {
      durationSelect.addEventListener('change', (e) => {
        this.duration = parseInt(e.target.value);
      });
    }

    // Aspect ratio select
    const aspectSelect = this.content.querySelector('#aspect-select');
    if (aspectSelect) {
      aspectSelect.addEventListener('change', (e) => {
        this.aspectRatio = e.target.value;
      });
    }

    // Quality select
    const qualitySelect = this.content.querySelector('#quality-select');
    if (qualitySelect) {
      qualitySelect.addEventListener('change', (e) => {
        this.quality = e.target.value;
      });
    }

    // Footer buttons
    this.content.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      this.close();
    });

    this.content.querySelector('[data-action="generate"]')?.addEventListener('click', () => {
      this.handleGenerate();
    });
  }

  handleGenerate() {
    if (!this.prompt.trim()) {
      
      return;
    }

    this.isGenerating = true;
    this.generationProgress = 0;
    this.render();

    // Simulate generation progress
    const progressInterval = setInterval(() => {
      this.generationProgress += 5;
      if (this.generationProgress >= 100) {
        clearInterval(progressInterval);
        this.generationProgress = 100;
        this.onComplete?.({
          name: 'AI Generated Video',
          src: 'ai-generated.mp4',
          prompt: this.prompt,
          style: this.style,
          duration: this.duration,
          aspectRatio: this.aspectRatio
        });
        this.close();
      } else {
        this.render();
      }
    }, 200);
  }
}