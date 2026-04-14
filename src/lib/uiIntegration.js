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