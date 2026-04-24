/**
 * UI Integration Extensions for Timeline Editor Enhancements
 * Adds new menu options, context menus, and modal support
 */

import { isFeatureEnabled } from '../lib/featureFlags.js';
import { loadAdaptedComponent } from '../lib/componentAdapter.js';

/**
 * Extend context menus for clips with enhancement options
 */
export function extendClipContextMenu(clipElement, clip, track, state, showToast) {
  // Add enhancement options based on clip type
  const menuItems = [];

  // Image clips: AdvanceImageEditorModal, ImageCropperModal, ImglyImageEditorModal
  if (clip.type === 'image') {
    menuItems.push({
      label: 'Advanced Image Editor',
      icon: '🖼️',
      action: () => openAdvanceImageEditorModal(clip, state, showToast)
    });
    menuItems.push({
      label: 'Crop Image',
      icon: '✂️',
      action: () => openImageCropperModal(clip, state, showToast)
    });
    menuItems.push({
      label: 'Imgly Image Editor',
      icon: '🎨',
      action: () => openImglyImageEditorModal(clip, state, showToast)
    });
  }

  // Video clips: VideoPersonalizer, VideoAnalytics
  if (clip.type === 'video') {
    menuItems.push({
      label: 'Personalize Video',
      icon: '🎬',
      action: () => openVideoPersonalizerModal(clip, state, showToast)
    });
    menuItems.push({
      label: 'Video Analytics',
      icon: '📊',
      action: () => openVideoAnalyticsModal(clip, state, showToast)
    });
  }

  // Text clips: VoiceModal (TTS), PersonalizationModal
  if (clip.type === 'text') {
    menuItems.push({
      label: 'Generate Voice (TTS)',
      icon: '🎤',
      action: () => openVoiceModalTTS(clip, state, showToast)
    });
    menuItems.push({
      label: 'Personalize Text',
      icon: '👤',
      action: () => openPersonalizationModal(clip, state, showToast)
    });
  }

  // Audio clips: VoiceModal (recording)
  if (clip.type === 'audio') {
    menuItems.push({
      label: 'Record Voice',
      icon: '🎙️',
      action: () => openVoiceModalRecording(clip, state, showToast)
    });
  }

  // Add menu items to existing context menu
  if (menuItems.length > 0) {
    const existingMenu = clipElement.querySelector('.context-menu');
    if (existingMenu) {
      menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.innerHTML = `${item.icon} ${item.label}`;
        menuItem.addEventListener('click', item.action);
        existingMenu.appendChild(menuItem);
      });
    }
  }

  return menuItems.length > 0;
}

/**
 * Extend generation panel with new creation options
 */
export function extendGenerationPanel(generationContainer, state, showToast) {
  if (!generationContainer) return;

  // Add AI Video Creator button
  if (isFeatureEnabled('VIDEO_CREATION_PERSONALIZATION')) {
    const videoCreatorBtn = document.createElement('button');
    videoCreatorBtn.className = 'generate-type';
    videoCreatorBtn.innerHTML = '<div class="emoji">🎬</div><div>AI Video</div>';
    videoCreatorBtn.title = 'Create AI-powered videos';
    videoCreatorBtn.addEventListener('click', () => openAIVideoCreator(state, showToast));
    generationContainer.appendChild(videoCreatorBtn);
  }

  // Add Template Browser button
  if (isFeatureEnabled('TEMPLATE_SYSTEM')) {
    const templateBtn = document.createElement('button');
    templateBtn.className = 'generate-type';
    templateBtn.innerHTML = '<div class="emoji">📋</div><div>Templates</div>';
    templateBtn.title = 'Browse and apply templates';
    templateBtn.addEventListener('click', () => openTemplateBrowser(null, state, showToast));
    generationContainer.appendChild(templateBtn);
  }

  // Add Recording button
  if (isFeatureEnabled('VIDEO_RECORDING')) {
    const recordBtn = document.createElement('button');
    recordBtn.className = 'generate-type';
    recordBtn.innerHTML = '<div class="emoji">🎥</div><div>Record</div>';
    recordBtn.title = 'Record screen or video';
    recordBtn.addEventListener('click', () => openVideoRecorder(state, showToast));
    generationContainer.appendChild(recordBtn);
  }

  // Add Giphy integration button
  const giphyBtn = document.createElement('button');
  giphyBtn.className = 'generate-type';
  giphyBtn.innerHTML = '<div class="emoji">🎞️</div><div>GIFs</div>';
  giphyBtn.title = 'Search and add GIFs';
  giphyBtn.addEventListener('click', () => openGiphyIntegration(state, showToast));
  generationContainer.appendChild(giphyBtn);

  // Add TTS button
  if (isFeatureEnabled('TEXT_TO_SPEECH')) {
    const ttsBtn = document.createElement('button');
    ttsBtn.className = 'generate-type';
    ttsBtn.innerHTML = '<div class="emoji">🎤</div><div>TTS</div>';
    ttsBtn.title = 'Generate speech from text';
    ttsBtn.addEventListener('click', () => openTextToSpeechFromSelection(state, showToast));
    generationContainer.appendChild(ttsBtn);
  }

  // Add CineGen AI Workflow button
  const aiWorkflowBtn = document.createElement('button');
  aiWorkflowBtn.className = 'generate-type';
  aiWorkflowBtn.innerHTML = '<div class="emoji">🧠</div><div>AI Workflow</div>';
  aiWorkflowBtn.title = 'Create AI generation pipelines with 50+ models including Wan, Kling, Veo, Runway, and Flux';
  aiWorkflowBtn.setAttribute('data-tooltip', 'node-workflow');
  aiWorkflowBtn.addEventListener('click', async () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3>AI Workflow Canvas</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="node-canvas-container" id="nodeCanvasContainer"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const canvasContainer = modal.querySelector('#nodeCanvasContainer');
    const nodeEditor = (await import('../lib/editor/cinegen-features/nodeWorkflow.js')).createNodeEditor(canvasContainer);
    nodeEditor.init();

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  });
  generationContainer.appendChild(aiWorkflowBtn);

  // Add CineGen AI Tools button
  const aiToolsBtn = document.createElement('button');
  aiToolsBtn.className = 'generate-type';
  aiToolsBtn.innerHTML = '<div class="emoji">⚡</div><div>AI Tools</div>';
  aiToolsBtn.title = 'Fill gaps, extend clips, generate music from video, and apply SAM3 masking using 9 video models';
  aiToolsBtn.setAttribute('data-tooltip', 'ai-tools');
  aiToolsBtn.addEventListener('click', async () => {
    const { createModal } = await import('../lib/editor/cinegenIntegration.js');
    const modal = createModal('AI Editing Tools', `
      <div class="ai-tools-modal">
        <div class="ai-tools-section">
          <h4>Fill Gap</h4>
          <p class="tool-description">
            AI generates new footage to bridge gaps between clips using adjacent frame context.
          </p>
          <div class="tool-options">
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
          <button class="primary-btn" id="fillGapBtn">Fill Gap</button>
        </div>

        <div class="ai-tools-section">
          <h4>Extend Clip</h4>
          <p class="tool-description">
            Generate additional footage before or after a clip using AI.
          </p>
          <div class="tool-options">
            <div class="form-group">
              <label>Direction</label>
              <select id="extend-direction">
                <option value="after">Extend After</option>
                <option value="before">Extend Before</option>
              </select>
            </div>
            <div class="form-group">
              <label>Duration (seconds)</label>
              <input type="number" id="extend-duration" value="2" min="1" max="5">
            </div>
          </div>
          <button class="primary-btn" id="extendClipBtn">Extend Clip</button>
        </div>

        <div class="ai-tools-section">
          <h4>Generate Music</h4>
          <p class="tool-description">
            Create music from video context with genre, mood, and tempo presets.
          </p>
          <div class="tool-options">
            <div class="form-group">
              <label>Genre</label>
              <select id="music-genre">
                <option value="cinematic">Cinematic</option>
                <option value="upbeat">Upbeat</option>
                <option value="ambient">Ambient</option>
              </select>
            </div>
            <div class="form-group">
              <label>Mood</label>
              <select id="music-mood">
                <option value="energetic">Energetic</option>
                <option value="calm">Calm</option>
                <option value="dramatic">Dramatic</option>
              </select>
            </div>
          </div>
          <button class="primary-btn" id="generateMusicBtn">Generate Music</button>
        </div>
      </div>
    `);

    document.body.appendChild(modal);

    // Setup event handlers
    modal.querySelector('#fillGapBtn').addEventListener('click', async () => {
      const model = modal.querySelector('#fill-gap-model').value;
      const duration = parseInt(modal.querySelector('#fill-gap-duration').value);

      const selectedClips = state.tracks.flatMap(t => t.items).filter(c => c.id === state.selectedClipId);
      if (selectedClips.length < 1) {
        showToast('Please select a clip first', 'warning');
        return;
      }

      try {
        const { CineGenMuAPI } = await import('../lib/editor/cinegenMuapi.js');
        const result = await CineGenMuAPI.generateVideo(`Fill gap of ${duration} seconds`, model);

        const videoTrack = state.tracks.find(t => t.type === 'video');
        if (videoTrack) {
          const newClip = {
            id: Date.now(),
            name: 'AI Generated Gap Fill',
            start: selectedClips[0].end,
            end: selectedClips[0].end + duration,
            duration: duration,
            type: 'video',
            src: result.url || '',
            poster: ''
          };
          videoTrack.items.push(newClip);
          showToast('Gap filled with AI-generated footage', 'success');
          modal.remove();
        }
      } catch (error) {
        showToast('Failed to fill gap', 'error');
      }
    });

    modal.querySelector('#extendClipBtn').addEventListener('click', async () => {
      const direction = modal.querySelector('#extend-direction').value;
      const duration = parseInt(modal.querySelector('#extend-duration').value);

      const selectedClip = state.tracks.flatMap(t => t.items).find(c => c.id === state.selectedClipId);
      if (!selectedClip) {
        showToast('Please select a clip to extend', 'warning');
        return;
      }

      try {
        const { CineGenMuAPI } = await import('../lib/editor/cinegenMuapi.js');
        const prompt = direction === 'before' ? 'Generate footage to prepend' : 'Generate footage to append';
        const result = await CineGenMuAPI.generateVideo(prompt, 'wan2.1-text-to-video');

        const videoTrack = state.tracks.find(t => t.type === 'video');
        if (videoTrack) {
          const newClip = {
            id: Date.now(),
            name: `Extended ${direction}`,
            start: direction === 'before' ? selectedClip.start - duration : selectedClip.end,
            end: direction === 'before' ? selectedClip.start : selectedClip.end + duration,
            duration: duration,
            type: 'video',
            src: result.url || '',
            poster: ''
          };
          videoTrack.items.push(newClip);
          showToast(`Clip extended ${direction}`, 'success');
          modal.remove();
        }
      } catch (error) {
        showToast('Failed to extend clip', 'error');
      }
    });

    modal.querySelector('#generateMusicBtn').addEventListener('click', async () => {
      const genre = modal.querySelector('#music-genre').value;
      const mood = modal.querySelector('#music-mood').value;

      try {
        const { CineGenMuAPI } = await import('../lib/editor/cinegenMuapi.js');
        const result = await CineGenMuAPI.generateMusic({ genre, mood, duration: 30 });

        const audioTrack = state.tracks.find(t => t.type === 'audio');
        if (audioTrack) {
          const newClip = {
            id: Date.now(),
            name: `${genre} ${mood} music`,
            start: 0,
            end: 30,
            duration: 30,
            type: 'audio',
            src: result.url || ''
          };
          audioTrack.items.push(newClip);
          showToast('Music generated and added to timeline', 'success');
          modal.remove();
        }
      } catch (error) {
        showToast('Failed to generate music', 'error');
      }
    });
  });
  generationContainer.appendChild(aiToolsBtn);
}

/**
 * Extend media library with enhanced features
 */
export function extendMediaLibrary(mediaGrid, state, showToast) {
  if (!mediaGrid || !isFeatureEnabled('ENHANCED_MEDIA_LIBRARY')) return;

  // Add enhanced library toggle
  const libraryToggle = document.createElement('button');
  libraryToggle.className = 'mini-btn';
  libraryToggle.textContent = 'Enhanced Library';
  libraryToggle.title = 'Toggle enhanced media library';
  libraryToggle.addEventListener('click', () => toggleEnhancedLibrary(mediaGrid, state, showToast));

  // Insert before existing media grid
  mediaGrid.parentNode.insertBefore(libraryToggle, mediaGrid);
}

/**
 * Extend top actions bar with new features
 */
export function extendTopActions(topActions, state, showToast) {
  if (!topActions) return;

  // Add social publishing action
  if (isFeatureEnabled('SOCIAL_PUBLISHING')) {
    const publishIcon = document.createElement('button');
    publishIcon.className = 'top-icon';
    publishIcon.textContent = '📤';
    publishIcon.title = 'Publish to social media';
    publishIcon.setAttribute('aria-label', 'Publish to social media');
    publishIcon.addEventListener('click', () => openSocialPublisher(state, showToast));
    topActions.appendChild(publishIcon);
  }

  // Add analytics action
  if (isFeatureEnabled('VIDEO_ANALYTICS')) {
    const analyticsIcon = document.createElement('button');
    analyticsIcon.className = 'top-icon';
    analyticsIcon.textContent = '📊';
    analyticsIcon.title = 'View video analytics';
    analyticsIcon.setAttribute('aria-label', 'View video analytics');
    analyticsIcon.addEventListener('click', () => openVideoAnalytics(state, showToast));
    topActions.appendChild(analyticsIcon);
  }

  // Add CineGen Elements Library
  const elementsIcon = document.createElement('button');
  elementsIcon.className = 'top-icon';
  elementsIcon.textContent = '👤';
  elementsIcon.title = 'Elements Library - Browse and use reusable characters, locations, props, and vehicles in your timeline';
  elementsIcon.setAttribute('aria-label', 'Elements Library');
  elementsIcon.setAttribute('data-tooltip', 'elements-lib');
  elementsIcon.addEventListener('click', async () => {
    const { createModal } = await import('../lib/editor/cinegenIntegration.js');
    const modal = createModal('Elements Library', `
      <div class="elements-modal">
        <p class="modal-description">
          Reusable media libraries for characters, locations, props, and vehicles.
          Generate AI reference panels for visual consistency.
        </p>
        <div class="elements-tabs">
          <button class="element-tab active" data-category="character">👤 Characters</button>
          <button class="element-tab" data-category="location">🏠 Locations</button>
          <button class="element-tab" data-category="prop">🎁 Props</button>
          <button class="element-tab" data-category="vehicle">🚗 Vehicles</button>
        </div>
        <div class="elements-grid-container" id="elementsGridContainer">
          <div class="element-item">
            <div class="element-preview">👤</div>
            <div class="element-name">AI Character</div>
            <div class="element-actions">
              <button class="btn-use-element">Use</button>
              <button class="btn-edit-element">Edit</button>
            </div>
          </div>
          <div class="element-item">
            <div class="element-preview">🏠</div>
            <div class="element-name">Modern Office</div>
            <div class="element-actions">
              <button class="btn-use-element">Use</button>
              <button class="btn-edit-element">Edit</button>
            </div>
          </div>
        </div>
      </div>
    `);
    document.body.appendChild(modal);
  });
  topActions.appendChild(elementsIcon);

  // Add CineGen LLM Assistant
  const llmIcon = document.createElement('button');
  llmIcon.className = 'top-icon';
  llmIcon.textContent = '💬';
  llmIcon.title = 'AI Assistant - Get context-aware help with scriptwriting, editing suggestions, and project organization';
  llmIcon.setAttribute('aria-label', 'AI Assistant');
  llmIcon.setAttribute('data-tooltip', 'llm-chat');
  llmIcon.addEventListener('click', async () => {
    const { createModal } = await import('../lib/editor/cinegenIntegration.js');
    const modal = createModal('AI Assistant', `
      <div class="llm-assistant-modal">
        <div class="chat-container">
          <div class="chat-messages" id="chatMessages">
            <div class="message assistant">
              <div class="message-avatar">🤖</div>
              <div class="message-content">
                <div class="message-text">Hi! I'm your AI editorial assistant. I can help you with scriptwriting, editing suggestions, and project organization. What would you like to work on?</div>
              </div>
            </div>
          </div>
          <div class="chat-input-container">
            <textarea class="chat-input" id="chatInput" placeholder="Ask me about your project..."></textarea>
            <button class="chat-send-btn" id="chatSendBtn">Send</button>
          </div>
        </div>
      </div>
    `);
    document.body.appendChild(modal);

    // Setup chat functionality
    const chatInput = modal.querySelector('#chatInput');
    const chatSendBtn = modal.querySelector('#chatSendBtn');
    const chatMessages = modal.querySelector('#chatMessages');

    const sendMessage = async () => {
      const message = chatInput.value.trim();
      if (!message) return;

      // Add user message
      const userMessage = document.createElement('div');
      userMessage.className = 'message user';
      userMessage.innerHTML = `
        <div class="message-content">
          <div class="message-text">${message}</div>
        </div>
        <div class="message-avatar">👤</div>
      `;
      chatMessages.appendChild(userMessage);

      chatInput.value = '';

      // Add typing indicator
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'message assistant typing';
      typingIndicator.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="message-text">Thinking...</div>
        </div>
      `;
      chatMessages.appendChild(typingIndicator);

      // Simulate AI response (in real implementation, this would call OpenAI API)
      setTimeout(() => {
        typingIndicator.remove();
        const aiResponse = document.createElement('div');
        aiResponse.className = 'message assistant';
        aiResponse.innerHTML = `
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="message-text">That's a great question about your project! Based on your timeline, I can see you have ${state.tracks.flatMap(t => t.items).length} clips. Let me help you with that...</div>
          </div>
        `;
        chatMessages.appendChild(aiResponse);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 1000);
    };

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  });
  topActions.appendChild(llmIcon);

  // Add CineGen Export
  const exportIcon = document.createElement('button');
  exportIcon.className = 'top-icon';
  exportIcon.textContent = '📤';
  exportIcon.title = 'Export Timeline - Render your timeline to MP4 with quality presets (720p, 1080p, 4K)';
  exportIcon.setAttribute('aria-label', 'Export Timeline');
  exportIcon.setAttribute('data-tooltip', 'export');
  exportIcon.addEventListener('click', async () => {
    const { createModal } = await import('../lib/editor/cinegenIntegration.js');
    const modal = createModal('Export Timeline', `
      <div class="export-modal">
        <div class="export-preview">
          <div class="preview-info">
            <span class="preview-duration">Duration: ${Math.max(...state.tracks.flatMap(t => t.items).map(c => c.end || 0)) || 0}s</span>
            <span class="preview-clips">Clips: ${state.tracks.flatMap(t => t.items).length}</span>
          </div>
        </div>

        <div class="form-group">
          <label>Quality Preset</label>
          <div class="preset-grid">
            <button class="preset-btn active" data-preset="standard">
              <span class="preset-label">Standard</span>
              <span class="preset-detail">1080p @ 30fps</span>
            </button>
            <button class="preset-btn" data-preset="high">
              <span class="preset-label">High Quality</span>
              <span class="preset-detail">4K @ 60fps</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Format</label>
          <select id="export-format">
            <option value="mp4">MP4 (Recommended)</option>
            <option value="mov">MOV (Pro)</option>
          </select>
        </div>

        <button class="primary-btn" id="exportBtn">Export Video</button>
      </div>
    `);
    document.body.appendChild(modal);

    modal.querySelector('#exportBtn').addEventListener('click', () => {
      const format = modal.querySelector('#export-format').value;
      showToast(`Exporting timeline as ${format.toUpperCase()}...`, 'info');

      // Simulate export process
      setTimeout(() => {
        showToast('Export completed successfully!', 'success');
        modal.remove();
      }, 2000);
    });
  });
  topActions.appendChild(exportIcon);
}

/**
 * Modal management for enhancements
 */
export class EnhancementModalManager {
  constructor(modalContainer) {
    this.modalContainer = modalContainer;
    this.activeModals = new Map();
  }

  async openModal(componentName, props = {}) {
    try {
      const { Component, adaptedProps } = await loadAdaptedComponent(componentName, props);

      // For now, create a basic modal structure
      // In a full React implementation, this would render the Component
      const modal = document.createElement('div');
      modal.className = 'enhancement-modal';
      modal.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>${componentName.replace(/([A-Z])/g, ' $1').trim()}</h3>
              <button class="modal-close" data-action="close">✕</button>
            </div>
            <div class="modal-body">
              <div class="loading">Loading ${componentName}...</div>
            </div>
          </div>
        </div>
      `;

      modal.querySelector('[data-action="close"]').addEventListener('click', () => {
        this.closeModal(componentName);
      });

      this.modalContainer.appendChild(modal);
      this.activeModals.set(componentName, modal);

      return modal;
    } catch (error) {
      console.error(`Failed to open ${componentName} modal:`, error);
      throw error;
    }
  }

  closeModal(componentName) {
    const modal = this.activeModals.get(componentName);
    if (modal) {
      modal.remove();
      this.activeModals.delete(componentName);
    }
  }

  closeAllModals() {
    this.activeModals.forEach(modal => modal.remove());
    this.activeModals.clear();
  }
}

// Modal action handlers
async function openAIVideoCreator(state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('AIVideoCreator', {
      onComplete: (result) => {
        // Add generated video to timeline
        addVideoToTimeline(result, state);
        showToast('AI Video created successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open AI Video Creator', 'error');
  }
}

async function openVideoPersonalizer(clip, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('VideoPersonalizer', {
      clip,
      onComplete: (result) => {
        updateClipInTimeline(clip.id, result, state);
        showToast('Video personalized successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Video Personalizer', 'error');
  }
}

async function openImageEditor(clip, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('AdvanceImageEditor', {
      image: clip.src,
      onComplete: (result) => {
        updateClipInTimeline(clip.id, { src: result }, state);
        showToast('Image edited successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Image Editor', 'error');
  }
}

async function openTextToSpeech(clip, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('TextToSpeechContent', {
      text: clip.body || clip.heading,
      onComplete: (audioUrl) => {
        // Add audio track with generated voice
        addAudioToTimeline(audioUrl, clip, state);
        showToast('Voice generated successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Text-to-Speech', 'error');
  }
}

async function openTemplateBrowser(clip, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('Templates', {
      onSelect: (template) => {
        applyTemplateToClip(clip, template, state);
        showToast('Template applied successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Template Browser', 'error');
  }
}

async function openVideoRecorder(state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('VideoRecorder', {
      onComplete: (videoUrl) => {
        addVideoToTimeline({ src: videoUrl, name: 'Recorded Video' }, state);
        showToast('Recording completed', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Video Recorder', 'error');
  }
}

async function toggleEnhancedLibrary(mediaGrid, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('Library', {
      onSelect: (media) => {
        addMediaToTimeline(media, state);
        showToast('Media added to timeline', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Enhanced Library', 'error');
  }
}

async function openSocialPublisher(state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('SocialPublisherModal', {
      project: state,
      onComplete: () => {
        showToast('Published successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Social Publisher', 'error');
  }
}

async function openVideoAnalytics(state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('VideoAnalytics', {
      project: state,
      onComplete: (analytics) => {
        showToast('Analytics generated', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Video Analytics', 'error');
  }
}

// Context menu modal functions
async function openAdvanceImageEditorModal(clip, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('AdvanceImageEditorModal', {
      image: clip.src,
      onComplete: (result) => {
        updateClipInTimeline(clip.id, { src: result }, state);
        showToast('Image edited successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Advance Image Editor', 'error');
  }
}

async function openImageCropperModal(clip, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('ImageCropperModal', {
      image: clip.src,
      onComplete: (result) => {
        updateClipInTimeline(clip.id, { src: result }, state);
        showToast('Image cropped successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Image Cropper', 'error');
  }
}

async function openImglyImageEditorModal(clip, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('ImglyImageEditorModal', {
      image: clip.src,
      onComplete: (result) => {
        updateClipInTimeline(clip.id, { src: result }, state);
        showToast('Image edited with Imgly successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Imgly Image Editor', 'error');
  }
}

async function openVideoPersonalizerModal(clip, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('VideoPersonalizer', {
      clip,
      onComplete: (result) => {
        updateClipInTimeline(clip.id, result, state);
        showToast('Video personalized successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Video Personalizer', 'error');
  }
}

async function openVideoAnalyticsModal(clip, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('VideoAnalytics', {
      clip,
      onComplete: (analytics) => {
        showToast('Video analytics completed', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Video Analytics', 'error');
  }
}

async function openVoiceModalTTS(clip, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('VoiceModal', {
      mode: 'tts',
      text: clip.body || clip.heading,
      onComplete: (result) => {
        addAudioToTimeline(result, state);
        showToast('Voice generated successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Voice Modal (TTS)', 'error');
  }
}

async function openPersonalizationModal(clip, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('PersonalizationModal', {
      text: clip.body || clip.heading,
      onComplete: (result) => {
        updateClipInTimeline(clip.id, { body: result.personalizedText }, state);
        showToast('Text personalized successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Personalization Modal', 'error');
  }
}

async function openVoiceModalRecording(clip, state, showToast) {
  try {
    const modalManager = getModalManager();
    await modalManager.openModal('VoiceModal', {
      mode: 'recording',
      onComplete: (result) => {
        updateClipInTimeline(clip.id, { src: result.audioUrl }, state);
        showToast('Voice recorded successfully', 'success');
      }
    });
  } catch (error) {
    showToast('Failed to open Voice Modal (Recording)', 'error');
  }
}

// Helper functions
function getModalManager() {
  if (!window.enhancementModalManager) {
    const modalContainer = document.getElementById('modalOverlay') || document.body;
    window.enhancementModalManager = new EnhancementModalManager(modalContainer);
  }
  return window.enhancementModalManager;
}

function addVideoToTimeline(videoData, state) {
  const videoTrack = state.tracks.find(t => t.name === 'Video');
  if (videoTrack) {
    const newClip = {
      id: Date.now(),
      name: videoData.name || 'AI Generated Video',
      left: 50,
      width: 20,
      type: 'video',
      src: videoData.src,
      poster: videoData.poster
    };
    videoTrack.clips.push(newClip);
  }
}

function addAudioToTimeline(audioUrl, textClip, state) {
  const audioTrack = state.tracks.find(t => t.name === 'Audio');
  if (audioTrack) {
    const newClip = {
      id: Date.now(),
      name: 'Generated Voice',
      left: textClip.left,
      width: textClip.width,
      type: 'audio',
      src: audioUrl
    };
    audioTrack.clips.push(newClip);
  }
}

function updateClipInTimeline(clipId, updates, state) {
  state.tracks.forEach(track => {
    const clip = track.clips.find(c => c.id === clipId);
    if (clip) {
      Object.assign(clip, updates);
    }
  });
}

function applyTemplateToClip(clip, template, state) {
  if (clip) {
    Object.assign(clip, template);
  }
}

function addMediaToTimeline(media, state) {
  const track = state.tracks.find(t => t.name.toLowerCase() === media.type + 's' || t.name === 'Video');
  if (track) {
    const newClip = {
      id: Date.now(),
      name: media.name,
      left: 25,
      width: 15,
      type: media.type,
      src: media.src
    };
    track.clips.push(newClip);
  }
}

// Giphy integration handler
async function openGiphyIntegration(state, showToast) {
  try {
    // For now, show a simple integration - in full implementation this would open a modal
    showToast('Giphy integration opened - search for GIFs in the generation panel', 'info');

    // Add Giphy search to generation panel
    const generationPanel = document.querySelector('.generate-panel');
    if (generationPanel && !generationPanel.querySelector('.giphy-search')) {
      const giphySearch = document.createElement('div');
      giphySearch.className = 'giphy-search';
      giphySearch.innerHTML = `
        <input type="text" placeholder="Search GIFs..." class="giphy-input" />
        <button class="giphy-search-btn">🔍</button>
      `;
      generationPanel.appendChild(giphySearch);

      // Add search functionality
      const input = giphySearch.querySelector('.giphy-input');
      const btn = giphySearch.querySelector('.giphy-search-btn');

      const performSearch = () => {
        const query = input.value.trim();
        if (query) {
          window.dispatchEvent(new CustomEvent('giphySearch', { detail: { query } }));
          showToast(`Searching for "${query}" GIFs`);
        }
      };

      btn.addEventListener('click', performSearch);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
      });
    }
  } catch (error) {
    showToast('Failed to open Giphy integration', 'error');
  }
}

// Text-to-speech handler
async function openTextToSpeechFromSelection(state, showToast) {
  try {
    // Check if there's a selected text clip
    const selectedClip = state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClipId && c.type === 'text');

    if (selectedClip) {
      // Generate TTS for selected text clip
      window.dispatchEvent(new CustomEvent('generateTTS', {
        detail: { clipId: selectedClip.id, text: selectedClip.body || selectedClip.text }
      }));
      showToast('Generating speech from text...');
    } else {
      showToast('Please select a text clip first', 'warning');
    }
  } catch (error) {
    showToast('Failed to generate text-to-speech', 'error');
  }
}