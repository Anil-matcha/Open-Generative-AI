import { AiMuAPI } from '../aiMuapi.js';
import { createTimelineStateAdapter } from '../timelineStateAdapter.js';

export const EDITING_TOOLS = {
  FILL_GAP: 'fill-gap',
  EXTEND_CLIP: 'extend-clip',
  GENERATE_MUSIC: 'generate-music',
  SAM3_MASKING: 'sam3-masking'
};

export class AIEditingTools {
  constructor(timelineState) {
    this.timelineState = timelineState;
    this.currentTool = null;
    this.modal = null;
  }

  init(container) {
    this.container = container;
    return this;
  }

  setModal(modal) {
    this.modal = modal;
  }

  getSelectedClips() {
    if (typeof this.timelineState.getSelectedClips === 'function') {
      return this.timelineState.getSelectedClips();
    }
    return [];
  }

  getModal() {
    return this.modal;
  }

  selectTool(tool) {
    this.currentTool = tool;
    const btns = this.container.querySelectorAll('.ai-tool-btn');
    btns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    this.showToolModal(tool);
  }

  showToolModal(tool) {
    this.closeModal();

    const modal = document.createElement('div');
    modal.className = 'ai-tool-modal';
    modal.innerHTML = this.getModalContent(tool);

    this.container.appendChild(modal);
    this.modal = modal;

    this.setupModalEvents(tool, modal);
  }

  getModalContent(tool) {
    switch (tool) {
      case EDITING_TOOLS.FILL_GAP:
        return `
          <div class="modal-header">
            <h3>Fill Gap</h3>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <p>AI will generate footage to bridge the gap between two clips.</p>
            <div class="form-group">
              <label>Model</label>
              <select id="fill-gap-model">
                <option value="wan2.1-text-to-video">Wan 2.1 (Recommended)</option>
                <option value="kling-v3.0-pro-text-to-video">Kling 3.0</option>
                <option value="veo3.1-text-to-video">Veo 3.1</option>
              </select>
            </div>
            <div class="form-group">
              <label>Duration (seconds)</label>
              <input type="number" id="fill-gap-duration" value="3" min="1" max="10">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-generate">Generate</button>
          </div>
        `;

      case EDITING_TOOLS.EXTEND_CLIP:
        return `
          <div class="modal-header">
            <h3>Extend Clip</h3>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <p>Generate additional footage before or after a clip.</p>
            <div class="form-group">
              <label>Direction</label>
              <select id="extend-direction">
                <option value="after">Extend After</option>
                <option value="before">Extend Before</option>
                <option value="both">Both Sides</option>
              </select>
            </div>
            <div class="form-group">
              <label>Duration (seconds)</label>
              <input type="number" id="extend-duration" value="2" min="1" max="5">
            </div>
            <div class="form-group">
              <label>Model</label>
              <select id="extend-model">
                <option value="wan2.1-text-to-video">Wan 2.1 (Recommended)</option>
                <option value="kling-v3.0-pro-text-to-video">Kling 3.0</option>
                <option value="veo3.1-text-to-video">Veo 3.1</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-generate">Generate</button>
          </div>
        `;

      case EDITING_TOOLS.GENERATE_MUSIC:
        return `
          <div class="modal-header">
            <h3>Generate Music</h3>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <p>Create music based on your video content.</p>
            <div class="form-group">
              <label>Genre</label>
              <select id="music-genre">
                <option value="cinematic">Cinematic</option>
                <option value="upbeat">Upbeat</option>
                <option value="ambient">Ambient</option>
                <option value="electronic">Electronic</option>
                <option value="orchestral">Orchestral</option>
              </select>
            </div>
            <div class="form-group">
              <label>Mood</label>
              <select id="music-mood">
                <option value="energetic">Energetic</option>
                <option value="calm">Calm</option>
                <option value="dramatic">Dramatic</option>
                <option value="melancholic">Melancholic</option>
              </select>
            </div>
            <div class="form-group">
              <label>Duration (seconds)</label>
              <input type="number" id="music-duration" value="30" min="10" max="180">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-generate">Generate</button>
          </div>
        `;

      case EDITING_TOOLS.SAM3_MASKING:
        return `
          <div class="modal-header">
            <h3>SAM3 Masking</h3>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <p>Segment objects in your video using AI.</p>
            <div class="form-group">
              <label>Prompt Type</label>
              <select id="mask-prompt-type">
                <option value="text">Text Prompt</option>
                <option value="box">Bounding Box</option>
                <option value="click">Click Segmentation</option>
              </select>
            </div>
            <div class="form-group">
              <label>Text Prompt</label>
              <input type="text" id="mask-text-prompt" placeholder="Describe the object to segment...">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-generate">Segment</button>
          </div>
        `;

      default:
        return '<p>Unknown tool</p>';
    }
  }

  setupModalEvents(tool, modal) {
    modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
    modal.querySelector('.btn-cancel').addEventListener('click', () => this.closeModal());
    modal.querySelector('.btn-generate').addEventListener('click', () => this.executeTool(tool));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal();
    });
  }

  async executeTool(tool) {
    const generateBtn = this.modal.querySelector('.btn-generate');
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    try {
      let result;
      switch (tool) {
        case EDITING_TOOLS.FILL_GAP:
          result = await this.executeFillGap();
          break;
        case EDITING_TOOLS.EXTEND_CLIP:
          result = await this.executeExtendClip();
          break;
        case EDITING_TOOLS.GENERATE_MUSIC:
          result = await this.executeGenerateMusic();
          break;
        case EDITING_TOOLS.SAM3_MASKING:
          result = await this.executeSAM3Masking();
          break;
      }

      this.showSuccess(result);
    } catch (error) {
      this.showError(error.message);
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate';
    }
  }

  async executeFillGap() {
    const model = this.modal.querySelector('#fill-gap-model').value;
    const duration = parseInt(this.modal.querySelector('#fill-gap-duration').value);

    const selectedClips = this.getSelectedClips();
    if (selectedClips.length < 2) {
      throw new Error('Please select at least two clips with a gap between them.');
    }

    const gapStart = selectedClips[0].endTime;
    const gapEnd = selectedClips[1].startTime;
    const contextPrompt = `Generate footage to fill a ${duration} second gap`;

    const result = await AiMuAPI.generateVideo(contextPrompt, model);
    const clip = this.createClipFromResult(result, gapStart, duration);

    this.timelineState.addClip(clip);
    return { success: true, clip };
  }

  async executeExtendClip() {
    const direction = this.modal.querySelector('#extend-direction').value;
    const duration = parseInt(this.modal.querySelector('#extend-duration').value);
    const model = this.modal.querySelector('#extend-model').value;

    const selectedClip = this.getSelectedClips()[0];
    if (!selectedClip) {
      throw new Error('Please select a clip to extend.');
    }

    const contextPrompt = direction === 'before' 
      ? `Generate footage to prepend to the clip, ${duration} seconds`
      : `Generate footage to append to the clip, ${duration} seconds`;

    const result = await AiMuAPI.generateVideo(contextPrompt, model);

    if (direction === 'after') {
      const clip = this.createClipFromResult(result, selectedClip.endTime, duration);
      this.timelineState.addClip(clip);
    } else if (direction === 'before') {
      const clip = this.createClipFromResult(result, selectedClip.startTime - duration, duration);
      this.timelineState.addClipAtStart(clip);
    } else {
      const beforeClip = this.createClipFromResult(result, selectedClip.startTime - duration, duration);
      const afterClip = this.createClipFromResult(result, selectedClip.endTime, duration);
      this.timelineState.addClipAtStart(beforeClip);
      this.timelineState.addClip(afterClip);
    }

    return { success: true };
  }

  async executeGenerateMusic() {
    const genre = this.modal.querySelector('#music-genre').value;
    const mood = this.modal.querySelector('#music-mood').value;
    const duration = parseInt(this.modal.querySelector('#music-duration').value);

    const selectedClip = this.getSelectedClips()[0];
    const videoContext = selectedClip 
      ? `Based on video content starting at ${selectedClip.startTime}` 
      : 'Create original music';

    const result = await AiMuAPI.generateMusic(
      { context: videoContext },
      { genre, mood, duration }
    );

    const audioClip = this.createAudioClipFromResult(result);
    this.timelineState.addAudioTrack(audioClip);

    return { success: true, audioClip };
  }

  async executeSAM3Masking() {
    const promptType = this.modal.querySelector('#mask-prompt-type').value;
    const textPrompt = this.modal.querySelector('#mask-text-prompt').value;

    const selectedClip = this.getSelectedClips()[0];
    if (!selectedClip) {
      throw new Error('Please select a clip to apply masking.');
    }

    const imageData = await this.extractFrameFromClip(selectedClip);
    const result = await AiMuAPI.applySAM3Segmentation(imageData, {
      type: promptType,
      prompt: textPrompt
    });

    this.applyMaskToClip(selectedClip, result);
    return { success: true };
  }

  createClipFromResult(result, startTime, duration) {
    return {
      id: `clip-${Date.now()}`,
      type: 'video',
      source: result.url || result.video_url,
      startTime,
      duration,
      endTime: startTime + duration,
      tracks: ['video']
    };
  }

  createAudioClipFromResult(result) {
    return {
      id: `audio-${Date.now()}`,
      type: 'audio',
      source: result.url,
      startTime: 0,
      duration: result.duration || 30,
      endTime: result.duration || 30,
      tracks: ['audio']
    };
  }

  extractFrameFromClip(clip) {
    return Promise.resolve(clip.source);
  }

  applyMaskToClip(clip, maskResult) {
    clip.mask = maskResult.mask;
    this.timelineState.updateClip(clip);
  }

  showSuccess(result) {
    const toast = document.createElement('div');
    toast.className = 'ai-tool-toast success';
    toast.textContent = result.success ? 'Successfully generated!' : 'Operation completed';
    this.
    this.closeModal();
  }

  showError(message) {
    const toast = document.createElement('div');
    toast.className = 'ai-tool-toast error';
    toast.textContent = message;
    this.
  }

  // DISABLED:   console.log(toast) {
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '10000';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  closeModal() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
      this.modal = null;
    }
    this.currentTool = null;
  }

  destroy() {
    this.closeModal();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export function createAIEditingTools(timelineState, container) {
  return new AIEditingTools(timelineState).init(container);
}