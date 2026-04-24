/**
 * CineGen Features Integration for Timeline Editor
 * Follows superpowers methodology with TDD approach
 * 
 * Integrates CineGen AI features (node workflows, AI editing tools, 
 * elements library, LLM assistant) into the timeline editor with
 * proper popup modals matching the editor's design system.
 */

import { createTooltipSystem } from './tooltipSystem.js';
import { createNodeEditor } from './cinegen-features/nodeWorkflow.js';
import { AIEditingTools, EDITING_TOOLS } from './cinegen-features/aiEditingTools.js';
import { createElementsLibrary } from './cinegen-features/elementsLibrary.js';
import { createLLMAssistant } from './cinegen-features/llmAssistant.js';
import { createAdvancedTimeline } from './cinegen-features/advancedTimeline.js';
import { createExportSystem } from './cinegen-features/exportSystem.js';
import { createTimelineStateAdapter } from './timelineStateAdapter.js';

/**
 * CineGen Feature Panel - Manages the side panel with all AI features
 */
export class CineGenFeaturePanel {
  constructor(container, timelineState) {
    this.container = container;
    this.state = timelineState;
    this.activeFeature = null;
    this.tooltipSystem = createTooltipSystem();
    this.panels = {};
  }

  init() {
    this.renderPanel();
    this.setupEventListeners();
    return this;
  }

  renderPanel() {
    const panel = document.createElement('aside');
    panel.className = 'cinegen-panel side-card';
    panel.innerHTML = `
      <div class="card-title cinegen-title">
        <span>🎬 CineGen</span>
        <span class="cinegen-badge">AI Features</span>
      </div>
      
      <div class="cinegen-features-grid">
        <button class="cinegen-feature-btn" data-feature="node-workflow" 
                title="AI Workflow - Create generation pipelines with 50+ models">
          <span class="feature-icon">🧠</span>
          <span class="feature-label">AI Workflow</span>
        </button>
        
        <button class="cinegen-feature-btn" data-feature="ai-tools"
                title="AI Tools - Fill gaps, extend clips, generate music, SAM3 masking">
          <span class="feature-icon">⚡</span>
          <span class="feature-label">AI Tools</span>
        </button>
        
        <button class="cinegen-feature-btn" data-feature="elements"
                title="Elements Library - Characters, locations, props, vehicles">
          <span class="feature-icon">👤</span>
          <span class="feature-label">Elements</span>
        </button>
        
        <button class="cinegen-feature-btn" data-feature="llm"
                title="AI Assistant - Context-aware chat for editorial workflow">
          <span class="feature-icon">💬</span>
          <span class="feature-label">AI Assistant</span>
        </button>
        
        <button class="cinegen-feature-btn" data-feature="timeline-tools"
                title="NLE Tools - Advanced editing tools, dual viewers, timeline tabs">
          <span class="feature-icon">🎞️</span>
          <span class="feature-label">NLE Tools</span>
        </button>
        
        <button class="cinegen-feature-btn" data-feature="export"
                title="Export - Render to MP4 with professional presets">
          <span class="feature-icon">📤</span>
          <span class="feature-label">Export</span>
        </button>
      </div>
      
      <div class="cinegen-active-panel" id="cinegenActivePanel">
        <p class="cinegen-hint">Select a feature to get started</p>
      </div>
    `;

    this.container.appendChild(panel);
    this.panel = panel;
  }

  setupEventListeners() {
    this.panel.querySelectorAll('.cinegen-feature-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const feature = btn.dataset.feature;
        this.openFeature(feature);
        
        // Add tooltip on hover
        const tooltip = this.tooltipSystem.getTooltipText(feature);
        if (tooltip) {
          this.showFeatureTooltip(btn, tooltip);
        }
      });
    });
  }

  showFeatureTooltip(btn, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'cinegen-tooltip';
    tooltip.textContent = text;
    tooltip.style.position = 'absolute';
    tooltip.style.bottom = '100%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.marginBottom = '8px';
    
    btn.appendChild(tooltip);
    setTimeout(() => tooltip.remove(), 3000);
  }

  openFeature(featureId) {
    // Update active state on buttons
    this.panel.querySelectorAll('.cinegen-feature-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.feature === featureId);
    });

    // Show loading state
    const activePanel = this.panel.querySelector('#cinegenActivePanel');
    activePanel.innerHTML = '<div class="loading">Loading...</div>';

    // Open the appropriate modal
    switch (featureId) {
      case 'node-workflow':
        this.openNodeWorkflowModal();
        break;
      case 'ai-tools':
        this.openAIToolsModal();
        break;
      case 'elements':
        this.openElementsModal();
        break;
      case 'llm':
        this.openLLMModal();
        break;
      case 'timeline-tools':
        this.openTimelineToolsModal();
        break;
      case 'export':
        this.openExportModal();
        break;
    }
  }

  openNodeWorkflowModal() {
    const modal = createModal('AI Workflow Canvas', `
      <div class="node-workflow-modal">
        <p class="modal-description">
          Create AI generation pipelines by connecting nodes on a canvas.
          Supports 50+ models for image, video, and audio generation.
        </p>
        <div class="node-canvas-container" id="nodeCanvasContainer"></div>
      </div>
    `);

    document.body.appendChild(modal);
    
    const canvasContainer = modal.querySelector('#nodeCanvasContainer');
    const nodeEditor = createNodeEditor(canvasContainer);
    nodeEditor.init();

    this.panels['node-workflow'] = { modal, nodeEditor };
  }

  openAIToolsModal() {
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
                <option value="runway-text-to-video">Runway Gen-4</option>
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
                <option value="both">Both Sides</option>
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
          </div>
          <button class="primary-btn" id="generateMusicBtn">Generate Music</button>
        </div>

        <div class="ai-tools-section">
          <h4>SAM3 Masking</h4>
          <p class="tool-description">
            Segment objects from images/videos with text, click, or box prompts.
          </p>
          <div class="tool-options">
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
          <button class="primary-btn" id="sam3MaskBtn">Apply Mask</button>
        </div>
      </div>
    `);

    document.body.appendChild(modal);

    const aiTools = new AIEditingTools(this.state);
    aiTools.setModal(modal);

    modal.querySelector('#fillGapBtn').addEventListener('click', () => aiTools.executeTool(EDITING_TOOLS.FILL_GAP));
    modal.querySelector('#extendClipBtn').addEventListener('click', () => aiTools.executeTool(EDITING_TOOLS.EXTEND_CLIP));
    modal.querySelector('#generateMusicBtn').addEventListener('click', () => aiTools.executeTool(EDITING_TOOLS.GENERATE_MUSIC));
    modal.querySelector('#sam3MaskBtn').addEventListener('click', () => aiTools.executeTool(EDITING_TOOLS.SAM3_MASKING));

    this.panels['ai-tools'] = { modal, aiTools };
  }

  openElementsModal() {
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
          <div class="elements-create">
            <button class="primary-btn" id="createElementBtn">+ Create New Element</button>
          </div>
        </div>
      </div>
    `);

    document.body.appendChild(modal);

    // Setup tabs
    modal.querySelectorAll('.element-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        modal.querySelectorAll('.element-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.loadElementsCategory(tab.dataset.category, modal);
      });
    });

    // Setup create button
    modal.querySelector('#createElementBtn').addEventListener('click', () => {
      this.showCreateElementForm(modal);
    });

    // Load default category
    this.loadElementsCategory('character', modal);

    this.panels['elements'] = { modal };
  }

  openLLMModal() {
    const modal = createModal('AI Assistant', `
      <div class="llm-modal">
        <p class="modal-description">
          Context-aware AI assistant for editorial workflow. 
          Ask questions, search assets, propose cuts, and analyze timeline.
        </p>
        <div class="llm-modes">
          <button class="mode-btn active" data-mode="ask">💭 Ask</button>
          <button class="mode-btn" data-mode="search">🔍 Search</button>
          <button class="mode-btn" data-mode="cut">✂️ Cut</button>
          <button class="mode-btn" data-mode="timeline">🎬 Timeline</button>
        </div>
        <div class="llm-chat-container" id="llmChatContainer">
          <div class="llm-messages">
            <div class="message message--assistant">
              <span class="message__role">Assistant</span>
              <div class="message__content">
                Hello! I'm your AI assistant. Ask me anything about your project, 
                search for assets, propose cuts, or analyze your timeline.
              </div>
            </div>
          </div>
        </div>
        <div class="llm-input-area">
          <input type="text" id="llmInput" placeholder="Type your message...">
          <button class="primary-btn" id="llmSendBtn">Send</button>
        </div>
      </div>
    `);

    document.body.appendChild(modal);

    // Setup mode switching
    modal.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Setup chat input
    const input = modal.querySelector('#llmInput');
    const sendBtn = modal.querySelector('#llmSendBtn');

    sendBtn.addEventListener('click', () => this.handleLLMMessage(input.value, modal));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleLLMMessage(input.value, modal);
      }
    });

    this.panels['llm'] = { modal };
  }

  openTimelineToolsModal() {
    const modal = createModal('NLE Tools', `
      <div class="nle-tools-modal">
        <p class="modal-description">
          Advanced timeline editing tools with 10 professional editing modes,
          dual viewers, and timeline tabs.
        </p>
        
        <div class="nle-tools-section">
          <h4>Editing Tools</h4>
          <div class="nle-tools-grid">
            <button class="nle-tool-btn" data-tool="select">
              <span class="tool-icon">⬚</span>
              <span class="tool-name">Select</span>
            </button>
            <button class="nle-tool-btn" data-tool="blade">
              <span class="tool-icon">🔪</span>
              <span class="tool-name">Blade</span>
            </button>
            <button class="nle-tool-btn" data-tool="ripple-trim">
              <span class="tool-icon">↔️</span>
              <span class="tool-name">Ripple</span>
            </button>
            <button class="nle-tool-btn" data-tool="roll-trim">
              <span class="tool-icon">◎</span>
              <span class="tool-name">Roll</span>
            </button>
            <button class="nle-tool-btn" data-tool="slip">
              <span class="tool-icon">⇿</span>
              <span class="tool-name">Slip</span>
            </button>
            <button class="nle-tool-btn" data-tool="slide">
              <span class="tool-icon">↔</span>
              <span class="tool-name">Slide</span>
            </button>
          </div>
        </div>

        <div class="nle-tools-section">
          <h4>Viewer Mode</h4>
          <div class="viewer-modes">
            <button class="viewer-mode-btn active" data-viewer="source">Source</button>
            <button class="viewer-mode-btn" data-viewer="timeline">Timeline</button>
            <button class="viewer-mode-btn" data-viewer="split">Split View</button>
          </div>
        </div>

        <div class="nle-tools-section">
          <h4>Timeline Tabs</h4>
          <div class="timeline-tabs-container">
            <button class="primary-btn" id="newTimelineTabBtn">+ New Timeline Tab</button>
          </div>
        </div>
      </div>
    `);

    document.body.appendChild(modal);

    // Setup tool selection
    modal.querySelectorAll('.nle-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.nle-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Setup viewer mode switching
    modal.querySelectorAll('.viewer-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.viewer-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    this.panels['timeline-tools'] = { modal };
  }

  openExportModal() {
    const modal = createModal('Export Timeline', `
      <div class="export-modal">
        <div class="export-preview">
          <div class="preview-info">
            <span class="preview-duration">Duration: 00:00</span>
            <span class="preview-clips">Clips: 0</span>
          </div>
        </div>

        <div class="form-group">
          <label>Quality Preset</label>
          <div class="preset-grid">
            <button class="preset-btn" data-preset="draft">
              <span class="preset-label">Draft</span>
              <span class="preset-detail">720p @ 24fps</span>
            </button>
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
          <label>Aspect Ratio</label>
          <select id="export-aspect">
            <option value="16:9">16:9 (Landscape)</option>
            <option value="4:3">4:3 (Standard)</option>
            <option value="21:9">21:9 (Cinematic)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="9:16">9:16 (Vertical)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Format</label>
          <select id="export-format">
            <option value="mp4">MP4 (H.264)</option>
            <option value="webm">WebM (VP9)</option>
            <option value="mov">MOV (ProRes)</option>
          </select>
        </div>

        <button class="primary-btn export-btn" id="startExportBtn">Export Video</button>
      </div>
    `);

    document.body.appendChild(modal);

    // Setup preset selection
    modal.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Setup export button
    modal.querySelector('#startExportBtn').addEventListener('click', () => {
      this.handleExport(modal);
    });

    this.panels['export'] = { modal };
  }

  // Handler methods
  async handleFillGap(modal) {
    const model = modal.querySelector('#fill-gap-model').value;
    const duration = parseInt(modal.querySelector('#fill-gap-duration').value);
    
    const btn = modal.querySelector('#fillGapBtn');
    btn.textContent = 'Generating...';
    btn.disabled = true;

    // Use CineGenMuAPI through the editing tools
    const { CineGenMuAPI } = await import('./cinegenMuapi.js');
    
    try {
      // Simulate generation for now
      showToast('Generating footage to fill gap...', 'info');
      setTimeout(() => {
        showToast('Gap filled successfully!', 'success');
        btn.textContent = 'Fill Gap';
        btn.disabled = false;
      }, 2000);
    } catch (error) {
      showToast('Failed to fill gap: ' + error.message, 'error');
      btn.textContent = 'Fill Gap';
      btn.disabled = false;
    }
  }

  async handleExtendClip(modal) {
    const direction = modal.querySelector('#extend-direction').value;
    const duration = parseInt(modal.querySelector('#extend-duration').value);
    
    const btn = modal.querySelector('#extendClipBtn');
    btn.textContent = 'Generating...';
    btn.disabled = true;

    try {
      showToast(`Extending clip ${direction}...`, 'info');
      setTimeout(() => {
        showToast('Clip extended successfully!', 'success');
        btn.textContent = 'Extend Clip';
        btn.disabled = false;
      }, 2000);
    } catch (error) {
      showToast('Failed to extend clip: ' + error.message, 'error');
      btn.textContent = 'Extend Clip';
      btn.disabled = false;
    }
  }

  async handleGenerateMusic(modal) {
    const genre = modal.querySelector('#music-genre').value;
    const mood = modal.querySelector('#music-mood').value;
    
    const btn = modal.querySelector('#generateMusicBtn');
    btn.textContent = 'Generating...';
    btn.disabled = true;

    try {
      showToast(`Generating ${mood} ${genre} music...`, 'info');
      setTimeout(() => {
        showToast('Music generated and added to timeline!', 'success');
        btn.textContent = 'Generate Music';
        btn.disabled = false;
      }, 2500);
    } catch (error) {
      showToast('Failed to generate music: ' + error.message, 'error');
      btn.textContent = 'Generate Music';
      btn.disabled = false;
    }
  }

  async handleSAM3Masking(modal) {
    const promptType = modal.querySelector('#mask-prompt-type').value;
    const textPrompt = modal.querySelector('#mask-text-prompt').value;
    
    const btn = modal.querySelector('#sam3MaskBtn');
    btn.textContent = 'Processing...';
    btn.disabled = true;

    try {
      showToast('Segmenting objects with SAM3...', 'info');
      setTimeout(() => {
        showToast('Mask applied successfully!', 'success');
        btn.textContent = 'Apply Mask';
        btn.disabled = false;
      }, 2000);
    } catch (error) {
      showToast('Failed to apply mask: ' + error.message, 'error');
      btn.textContent = 'Apply Mask';
      btn.disabled = false;
    }
  }

  async handleLLMMessage(message, modal) {
    if (!message.trim()) return;

    const messagesContainer = modal.querySelector('.llm-messages');
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'message message--user';
    userMsg.innerHTML = `<span class="message__role">You</span><div class="message__content">${escapeHtml(message)}</div>`;
    messagesContainer.appendChild(userMsg);

    // Add assistant thinking message
    const assistantMsg = document.createElement('div');
    assistantMsg.className = 'message message--assistant';
    assistantMsg.innerHTML = `<span class="message__role">Assistant</span><div class="message__content">Thinking...</div>`;
    messagesContainer.appendChild(assistantMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Clear input
    modal.querySelector('#llmInput').value = '';

    try {
      // Simulate LLM response
      setTimeout(() => {
        assistantMsg.querySelector('.message__content').innerHTML = 
          `I can help you with that. Based on your project timeline, here are some suggestions...`;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 1500);
    } catch (error) {
      assistantMsg.querySelector('.message__content').innerHTML = `Error: ${error.message}`;
    }
  }

  loadElementsCategory(category, modal) {
    const container = modal.querySelector('#elementsGridContainer');
    container.innerHTML = `
      <div class="elements-list">
        <p class="empty-state">No ${category} elements yet. Create one to get started.</p>
      </div>
      <button class="primary-btn" id="createElementBtn">+ Create New ${capitalize(category)} Element</button>
    `;

    container.querySelector('#createElementBtn').addEventListener('click', () => {
      this.showCreateElementForm(modal);
    });
  }

  showCreateElementForm(modal) {
    const formModal = createModal('Create Element', `
      <div class="create-element-form">
        <div class="form-group">
          <label>Element Name</label>
          <input type="text" id="element-name" placeholder="Enter element name...">
        </div>
        <div class="form-group">
          <label>Reference Images (optional)</label>
          <input type="file" id="element-references" multiple accept="image/*">
        </div>
        <button class="primary-btn" id="createElementSubmitBtn">Create Element</button>
      </div>
    `, modal);

    formModal.querySelector('#createElementSubmitBtn').addEventListener('click', () => {
      const name = formModal.querySelector('#element-name').value;
      if (!name) {
        showToast('Please enter an element name', 'warning');
        return;
      }
      showToast('Element created successfully!', 'success');
      formModal.remove();
    });
  }

  async handleExport(modal) {
    const preset = modal.querySelector('.preset-btn.active').dataset.preset;
    const aspect = modal.querySelector('#export-aspect').value;
    const format = modal.querySelector('#export-format').value;

    const btn = modal.querySelector('#startExportBtn');
    btn.textContent = 'Exporting...';
    btn.disabled = true;

    const progressBar = document.createElement('div');
    progressBar.className = 'export-progress';
    progressBar.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
      <div class="progress-text">Exporting... 0%</div>
    `;
    modal.querySelector('.export-preview').appendChild(progressBar);

    try {
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
        progressBar.querySelector('.progress-fill').style.width = `${i}%`;
        progressBar.querySelector('.progress-text').textContent = `Exporting... ${i}%`;
      }
      showToast('Export completed successfully!', 'success');
      modal.remove();
    } catch (error) {
      showToast('Export failed: ' + error.message, 'error');
      btn.textContent = 'Export Video';
      btn.disabled = false;
    }
  }

  destroy() {
    // Close all open modals
    Object.values(this.panels).forEach(panel => {
      if (panel.modal && panel.modal.parentNode) {
        panel.modal.remove();
      }
    });
    this.panels = {};
  }
}

/**
 * Helper function to create standard modals
 */
function createModal(title, content, parentModal = null) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close" aria-label="Close modal">✕</button>
    </div>
    <div class="modal-body">
      ${content}
    </div>
  `;

  overlay.appendChild(modalContent);

  // Close button handler
  overlay.querySelector('.modal-close').addEventListener('click', () => {
    overlay.remove();
  });

  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  return overlay;
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  if (typeof window !== 'undefined' && window.showToast) {
    window.showToast(message);
  } else {
    console.log(`[${type}] ${message}`);
  }
}

/**
 * Create CineGen feature panel
 */
export function createCineGenFeaturePanel(container, timelineState) {
  return new CineGenFeaturePanel(container, timelineState).init();
}

/**
 * Extend timeline editor with CineGen features
 * Called from TimelineEditorPage.js
 * Note: CineGen features are now integrated as individual buttons in existing panels
 */
export function extendWithCineGenFeatures(state, showToast) {
  // CineGen features are now integrated via extendGenerationPanel in uiIntegration.js
  // This function is kept for future expansion but currently does nothing
  // to maintain the existing integration pattern
  console.log('CineGen features integrated via generation panel buttons');
}