/**
 * CINEMATIC TEMPLATE WIZARD
 * Multi-step wizard for creating cinematic content
 */

import { navigate } from '../lib/router.js';
import { showToast } from '../lib/loading.js';
import { escapeHtml } from '../lib/security.js';
import { muapi } from '../lib/muapi.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { 
  VISUAL_STYLES,
  BRAND_VOICES,
  TARGET_AUDIENCES,
  CTA_TYPES,
  SCENE_STRUCTURES,
  SHOT_TYPES,
  CAMERA_MOVEMENTS,
  PACING_OPTIONS,
  PromptAssemblyEngine,
  SceneBuilder,
  StoryboardBuilder,
  RenderHandoff
} from '../lib/cinematicTemplates.js';

export function CinematicTemplateWizard(template, onComplete, onBack) {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-hidden';

  // State
  let currentStep = 0;
  const steps = ['Configure', 'Scenes', 'Preview', 'Generate'];
  let mode = 'quick'; // 'quick' or 'advanced'
  const inputs = {};
  let sceneBuilder = null;
  let storyboardBuilder = null;
  let uploadedUrl = null;
  let pickerRef = null;

  // Initialize
  if (template.cinematicData?.sceneBuilder) {
    sceneBuilder = new SceneBuilder(template);
    storyboardBuilder = new StoryboardBuilder(template);
  }

  render();

  function render() {
    container.innerHTML = '';
    
    // Header
    const header = createHeader();
    container.appendChild(header);
    
    // Progress bar
    const progress = createProgress();
    container.appendChild(progress);
    
    // Content area
    const content = document.createElement('div');
    content.className = 'flex-1 overflow-auto p-6';
    content.id = 'wizard-content';
    container.appendChild(content);
    
    // Footer with navigation
    const footer = createFooter();
    container.appendChild(footer);
    
    // Render current step
    renderStep(currentStep);
  }

  function createHeader() {
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between p-4 border-b border-white/10 bg-black/50';
    
    header.innerHTML = `
      <div class="flex items-center gap-4">
        <button id="wizard-back-btn" class="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-xl">
            ${template.icon}
          </div>
          <div>
            <h1 class="text-lg font-black text-white">${escapeHtml(template.name)}</h1>
            <p class="text-xs text-secondary">Cinematic Wizard</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex bg-white/5 rounded-lg p-1">
          <button id="quick-btn" class="px-3 py-1 ${mode === 'quick' ? 'bg-primary text-black' : 'text-white/70'} text-xs font-bold rounded-md transition-colors">
            Quick
          </button>
          <button id="advanced-btn" class="px-3 py-1 ${mode === 'advanced' ? 'bg-primary text-black' : 'text-white/70'} text-xs font-bold rounded-md transition-colors">
            Advanced
          </button>
        </div>
      </div>
    `;
    
    header.querySelector('#wizard-back-btn').onclick = () => {
      if (onBack) onBack();
      else navigate('templates');
    };
    
    header.querySelector('#quick-btn').onclick = () => {
      mode = 'quick';
      render();
    };
    
    header.querySelector('#advanced-btn').onclick = () => {
      mode = 'advanced';
      render();
    };
    
    return header;
  }

  function createProgress() {
    const progress = document.createElement('div');
    progress.className = 'px-4 py-3 bg-black/30 border-b border-white/5';
    
    const stepLabels = steps.map((step, i) => {
      const isActive = i === currentStep;
      const isComplete = i < currentStep;
      return `
        <div class="flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              isComplete ? 'bg-green-500 text-white' : 
              isActive ? 'bg-primary text-black' : 
              'bg-white/10 text-white/50'
            }">
              ${isComplete ? '✓' : i + 1}
            </div>
            <span class="text-xs font-medium ${isActive ? 'text-white' : 'text-white/50'}">${step}</span>
          </div>
          ${i < steps.length - 1 ? `
            <div class="flex-1 h-0.5 mx-3 ${isComplete ? 'bg-green-500' : 'bg-white/10'}"></div>
          ` : ''}
        </div>
      `;
    }).join('');
    
    progress.innerHTML = `<div class="flex items-center">${stepLabels}</div>`;
    return progress;
  }

  function createFooter() {
    const footer = document.createElement('div');
    footer.className = 'flex items-center justify-between p-4 border-t border-white/10 bg-black/50';
    
    const canBack = currentStep > 0;
    const canNext = currentStep < steps.length - 1;
    const isLastStep = currentStep === steps.length - 1;
    
    footer.innerHTML = `
      <button id="prev-btn" class="px-4 py-2 ${canBack ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/5 text-white/30 cursor-not-allowed'} text-sm font-bold rounded-xl transition-colors" ${!canBack ? 'disabled' : ''}>
        ← Back
      </button>
      <div class="text-xs text-white/50">Step ${currentStep + 1} of ${steps.length}</div>
      <button id="next-btn" class="px-6 py-2 ${isLastStep ? 'bg-primary text-black' : 'bg-white/10 text-white hover:bg-white/20'} text-sm font-bold rounded-xl transition-colors">
        ${isLastStep ? '🎬 Generate' : 'Next →'}
      </button>
    `;
    
    footer.querySelector('#prev-btn').onclick = () => {
      if (canBack) {
        currentStep--;
        render();
      }
    };
    
    footer.querySelector('#next-btn').onclick = () => {
      if (isLastStep) {
        generateContent();
      } else if (canNext) {
        currentStep++;
        render();
      }
    };
    
    return footer;
  }

  function renderStep(step) {
    const content = container.querySelector('#wizard-content');
    if (!content) return;
    
    content.innerHTML = '';
    
    switch (step) {
      case 0:
        renderConfigureStep(content);
        break;
      case 1:
        renderScenesStep(content);
        break;
      case 2:
        renderPreviewStep(content);
        break;
      case 3:
        renderGenerateStep(content);
        break;
    }
  }

  function renderConfigureStep(content) {
    const cinematicData = template.cinematicData || {};
    const quickInputs = cinematicData.quickInputs || [];
    const advancedInputs = cinematicData.advancedInputs || [];
    const inputsToShow = mode === 'quick' ? quickInputs : [...quickInputs, ...advancedInputs];
    
    const formCard = document.createElement('div');
    formCard.className = 'max-w-2xl mx-auto bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6';
    
    const title = document.createElement('h2');
    title.className = 'text-xl font-bold text-white mb-2';
    title.textContent = mode === 'quick' ? 'Quick Setup' : 'Advanced Configuration';
    formCard.appendChild(title);
    
    const subtitle = document.createElement('p');
    subtitle.className = 'text-sm text-secondary mb-6';
    subtitle.textContent = mode === 'quick' ? 
      'Enter the basic details for your cinematic content' : 
      'Configure every aspect of your cinematic creation';
    formCard.appendChild(subtitle);
    
    inputsToShow.forEach(input => {
      const field = createFormField(input);
      formCard.appendChild(field);
    });
    
    // Brand context section for advanced mode
    if (mode === 'advanced' && cinematicData.includeBrandContext) {
      const brandSection = createBrandSection();
      formCard.appendChild(brandSection);
    }
    
    content.appendChild(formCard);
  }

  function createFormField(input) {
    const field = document.createElement('div');
    field.className = 'mb-4';
    
    const label = document.createElement('label');
    label.className = 'block text-xs font-bold text-white uppercase tracking-wider mb-1.5';
    label.textContent = input.label + (input.required ? ' *' : '');
    field.appendChild(label);
    
    switch (input.type) {
      case 'image':
        const picker = createUploadPicker({
          anchorContainer: container,
          onSelect: ({ url }) => {
            uploadedUrl = url;
            inputs[input.name] = url;
          },
          onClear: () => {
            uploadedUrl = null;
            inputs[input.name] = null;
          }
        });
        pickerRef = picker;
        
        const uploadRow = document.createElement('div');
        uploadRow.className = 'flex items-center gap-3';
        uploadRow.appendChild(picker.trigger);
        const uploadLabel = document.createElement('span');
        uploadLabel.className = 'text-sm text-muted';
        uploadLabel.textContent = 'Click to upload';
        uploadRow.appendChild(uploadLabel);
        field.appendChild(uploadRow);
        field.appendChild(picker.panel);
        break;
        
      case 'textarea':
        const textarea = document.createElement('textarea');
        textarea.className = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 resize-none';
        textarea.rows = 3;
        textarea.placeholder = input.placeholder || '';
        textarea.value = inputs[input.name] || '';
        textarea.oninput = () => { inputs[input.name] = textarea.value; };
        field.appendChild(textarea);
        break;
        
      case 'select':
        const select = document.createElement('select');
        select.className = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 cursor-pointer';
        
        if (input.options && input.options.length > 0) {
          input.options.forEach(opt => {
            const option = document.createElement('option');
            const optValue = typeof opt === 'string' ? opt : opt.id || opt;
            const optLabel = typeof opt === 'string' ? opt : opt.name || opt;
            option.value = optValue;
            option.textContent = optLabel;
            option.style.background = '#111';
            select.appendChild(option);
          });
        }
        
        inputs[input.name] = inputs[input.name] || (input.options?.[0] ? 
          (typeof input.options[0] === 'string' ? input.options[0] : input.options[0].id || input.options[0]) : '');
        select.value = inputs[input.name];
        select.onchange = () => { inputs[input.name] = select.value; };
        field.appendChild(select);
        break;
        
      default: // text
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50';
        textInput.placeholder = input.placeholder || '';
        textInput.value = inputs[input.name] || '';
        textInput.oninput = () => { inputs[input.name] = textInput.value; };
        field.appendChild(textInput);
    }
    
    return field;
  }

  function createBrandSection() {
    const section = document.createElement('div');
    section.className = 'mt-8 pt-6 border-t border-white/10';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-bold text-white mb-4';
    title.textContent = 'Brand Context';
    section.appendChild(title);
    
    // Brand Name
    const brandNameField = document.createElement('div');
    brandNameField.className = 'mb-4';
    brandNameField.innerHTML = `
      <label class="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">Brand Name</label>
      <input type="text" id="brand-name" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50" placeholder="Your brand name">
    `;
    brandNameField.querySelector('#brand-name').value = inputs.brandName || '';
    brandNameField.querySelector('#brand-name').oninput = (e) => { inputs.brandName = e.target.value; };
    section.appendChild(brandNameField);
    
    // Brand Voice
    const voiceField = document.createElement('div');
    voiceField.className = 'mb-4';
    voiceField.innerHTML = `
      <label class="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">Brand Voice</label>
      <select id="brand-voice" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 cursor-pointer">
        ${Object.values(BRAND_VOICES).map(v => `<option value="${v.id}">${v.name}</option>`).join('')}
      </select>
    `;
    voiceField.querySelector('#brand-voice').value = inputs.brandVoice || 'professional';
    voiceField.querySelector('#brand-voice').onchange = (e) => { inputs.brandVoice = e.target.value; };
    section.appendChild(voiceField);
    
    // Target Audience
    const audienceField = document.createElement('div');
    audienceField.className = 'mb-4';
    audienceField.innerHTML = `
      <label class="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">Target Audience</label>
      <select id="target-audience" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 cursor-pointer">
        ${Object.values(TARGET_AUDIENCES).map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
      </select>
    `;
    audienceField.querySelector('#target-audience').value = inputs.targetAudience || 'millennial';
    audienceField.querySelector('#target-audience').onchange = (e) => { inputs.targetAudience = e.target.value; };
    section.appendChild(audienceField);
    
    // Visual Style
    const styleField = document.createElement('div');
    styleField.className = 'mb-4';
    styleField.innerHTML = `
      <label class="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">Visual Style</label>
      <select id="visual-style" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 cursor-pointer">
        ${Object.values(VISUAL_STYLES).map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
      </select>
    `;
    styleField.querySelector('#visual-style').value = inputs.visualStyle || 'dramatic_cinematic';
    styleField.querySelector('#visual-style').onchange = (e) => { inputs.visualStyle = e.target.value; };
    section.appendChild(styleField);
    
    return section;
  }

  function renderScenesStep(content) {
    const cinematicData = template.cinematicData || {};
    
    if (!cinematicData.sceneBuilder) {
      // No scene builder for this template
      const noScenes = document.createElement('div');
      noScenes.className = 'max-w-2xl mx-auto text-center py-16';
      noScenes.innerHTML = `
        <div class="text-6xl mb-4">🎬</div>
        <h2 class="text-xl font-bold text-white mb-2">No Scene Structure Needed</h2>
        <p class="text-secondary mb-6">This template doesn't require scene breakdown. You can proceed to preview.</p>
        <button id="skip-scenes-btn" class="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:scale-105 transition-transform">
          Continue to Preview →
        </button>
      `;
      noScenes.querySelector('#skip-scenes-btn').onclick = () => {
        currentStep = 2;
        render();
      };
      content.appendChild(noScenes);
      return;
    }
    
    // Scene builder UI
    const sceneCard = document.createElement('div');
    sceneCard.className = 'max-w-4xl mx-auto';
    
    sceneCard.innerHTML = `
      <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-white">Scene Builder</h2>
            <p class="text-sm text-secondary">Structure your narrative into scenes</p>
          </div>
          <button id="auto-generate-scenes-btn" class="px-4 py-2 bg-primary text-black text-xs font-bold rounded-lg hover:scale-105 transition-transform">
            ✨ Auto-Generate
          </button>
        </div>
        
        <div id="scenes-container" class="space-y-3">
          <!-- Scenes will be rendered here -->
        </div>
      </div>
      
      <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 class="text-lg font-bold text-white mb-4">Storyboard Preview</h3>
        <div id="storyboard-container" class="grid grid-cols-4 gap-3">
          <!-- Storyboard panels will be rendered here -->
        </div>
      </div>
    `;
    
    content.appendChild(sceneCard);
    
    // Auto-generate scenes
    sceneCard.querySelector('#auto-generate-scenes-btn').onclick = () => {
      autoGenerateScenes();
    };
    
    renderScenes();
  }

  function autoGenerateScenes() {
    if (!sceneBuilder || !storyboardBuilder) return;
    
    // Create a mock scene structure
    const sceneNames = ['Opening Shot', 'Introduction', 'Build Up', 'Climax', 'Resolution'];
    sceneNames.forEach((name, i) => {
      sceneBuilder.addScene({
        sceneNumber: i + 1,
        beat: name,
        duration: 5 + Math.random() * 10,
        shots: [
          { shotNumber: 1, type: 'MEDIUM', movement: 'STATIC', description: `${name} scene` }
        ]
      });
    });
    
    storyboardBuilder.generateFromScenes(sceneBuilder.getScenes());
    renderScenes();
    showToast('Scenes generated!', 'success');
  }

  function renderScenes() {
    const scenesContainer = container.querySelector('#scenes-container');
    const storyboardContainer = container.querySelector('#storyboard-container');
    
    if (!scenesContainer || !storyboardContainer) return;
    
    scenesContainer.innerHTML = '';
    storyboardContainer.innerHTML = '';
    
    const scenes = sceneBuilder?.getScenes() || [];
    const boards = storyboardBuilder?.getBoards() || [];
    
    if (scenes.length === 0) {
      scenesContainer.innerHTML = `
        <div class="text-center py-8 text-white/50">
          <p>No scenes yet. Click "Auto-Generate" to create a scene structure.</p>
        </div>
      `;
      return;
    }
    
    scenes.forEach((scene, i) => {
      const sceneEl = document.createElement('div');
      sceneEl.className = 'bg-white/5 border border-white/10 rounded-xl p-4';
      sceneEl.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-primary">Scene ${scene.sceneNumber}</span>
          <span class="text-xs text-white/50">${scene.duration?.toFixed(1) || 0}s</span>
        </div>
        <div class="text-sm text-white">${escapeHtml(scene.beat || 'Untitled Scene')}</div>
        <div class="text-xs text-white/50 mt-1">${scene.shots?.length || 0} shots</div>
      `;
      scenesContainer.appendChild(sceneEl);
    });
    
    boards.slice(0, 8).forEach(board => {
      const boardEl = document.createElement('div');
      boardEl.className = 'bg-black/50 border border-white/10 rounded-xl p-3 aspect-video flex items-center justify-center';
      boardEl.innerHTML = `
        <div class="text-center">
          <div class="text-xs font-bold text-primary">Board ${board.order}</div>
          <div class="text-[10px] text-white/50">${SHOT_TYPES[board.shotType]?.name || 'Shot'}</div>
        </div>
      `;
      storyboardContainer.appendChild(boardEl);
    });
  }

  function renderPreviewStep(content) {
    const promptPreview = generatePrompt();
    
    const previewCard = document.createElement('div');
    previewCard.className = 'max-w-3xl mx-auto';
    
    previewCard.innerHTML = `
      <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-xl font-bold text-white mb-4">Generated Prompt</h2>
        <div class="bg-black/50 rounded-xl p-4 mb-4">
          <p id="prompt-text" class="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">${escapeHtml(promptPreview)}</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="copy-prompt-btn" class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors">
            📋 Copy Prompt
          </button>
          <button id="regenerate-prompt-btn" class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors">
            🔄 Regenerate
          </button>
        </div>
      </div>
      
      <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 class="text-lg font-bold text-white mb-4">Configuration Summary</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="text-white/50 mb-1">Template</div>
            <div class="text-white font-medium">${escapeHtml(template.name)}</div>
          </div>
          <div>
            <div class="text-white/50 mb-1">Mode</div>
            <div class="text-white font-medium">${mode === 'quick' ? 'Quick' : 'Advanced'}</div>
          </div>
          <div>
            <div class="text-white/50 mb-1">Output Type</div>
            <div class="text-white font-medium">${template.outputType}</div>
          </div>
          <div>
            <div class="text-white/50 mb-1">Duration</div>
            <div class="text-white font-medium">${inputs.duration || template.cinematicData?.duration?.default || 30}s</div>
          </div>
        </div>
        
        ${template.cinematicData?.includeCTA ? `
          <div class="mt-4 pt-4 border-t border-white/10">
            <div class="text-white/50 mb-1">Call to Action</div>
            <div class="text-white font-medium">${inputs.ctaType ? CTA_TYPES[inputs.ctaType.toUpperCase().replace(/ /g, '_')]?.name : 'Not configured'}</div>
          </div>
        ` : ''}
      </div>
    `;
    
    content.appendChild(previewCard);
    
    previewCard.querySelector('#copy-prompt-btn').onclick = () => {
      navigator.clipboard.writeText(promptPreview);
      showToast('Prompt copied!', 'success');
    };
    
    previewCard.querySelector('#regenerate-prompt-btn').onclick = () => {
      render();
    };
  }

  function generatePrompt() {
    // Create a mock template object for the prompt engine
    const mockTemplate = {
      ...template,
      outputStyle: template.cinematicData?.outputStyle,
      includeCTA: template.cinematicData?.includeCTA,
      includeBrandContext: template.cinematicData?.includeBrandContext
    };
    
    try {
      const engine = new PromptAssemblyEngine(mockTemplate, inputs, {}, { mode });
      return engine.assemble();
    } catch (e) {
      // Fallback prompt generation
      const parts = [];
      if (inputs.prompt) parts.push(inputs.prompt);
      if (inputs.genre) parts.push(`${inputs.genre} genre`);
      if (inputs.tone) parts.push(`${inputs.tone} tone`);
      parts.push('cinematic quality');
      parts.push('4K resolution');
      return parts.join(', ');
    }
  }

  function renderGenerateStep(content) {
    const preview = generatePrompt();
    
    const generateCard = document.createElement('div');
    generateCard.className = 'max-w-2xl mx-auto text-center py-8';
    
    generateCard.innerHTML = `
      <div class="text-6xl mb-6">🎬</div>
      <h2 class="text-2xl font-black text-white mb-3">Ready to Generate</h2>
      <p class="text-secondary mb-8">Your cinematic content is configured and ready to create.</p>
      
      <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-left mb-6">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-3">Prompt Preview</h3>
        <p class="text-sm text-white/70 leading-relaxed max-h-32 overflow-auto">${escapeHtml(preview.substring(0, 500))}${preview.length > 500 ? '...' : ''}</p>
      </div>
      
      <button id="start-generation-btn" class="w-full py-4 bg-primary text-black font-black text-lg rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/25">
        ✨ Start Generation
      </button>
    `;
    
    content.appendChild(generateCard);
    
    generateCard.querySelector('#start-generation-btn').onclick = () => {
      executeGeneration(preview);
    };
  }

  async function executeGeneration(prompt) {
    const genBtn = container.querySelector('#start-generation-btn');
    if (!genBtn) return;
    
    // SECURITY ISSUE: API keys stored in localStorage are accessible to XSS attacks
    // TODO: Replace with server-side session storage or httpOnly cookies
    const apiKey = localStorage.getItem('muapi_key');
    if (!apiKey) {
      AuthModal(() => executeGeneration(prompt));
      return;
    }
    
    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="animate-spin inline-block mr-2">⟳</span> Generating...';
    
    try {
      const params = {
        model: template.model,
        prompt: prompt,
        aspect_ratio: inputs.aspectRatio || template.aspectRatio || '16:9',
        ...(template.defaultParams || {})
      };
      
      if (uploadedUrl) {
        params.image_url = uploadedUrl;
      }
      
      let result;
      if (template.modelType === 'i2v') {
        result = await muapi.generateI2V(params);
      } else if (template.modelType === 'i2i') {
        result = await muapi.generateI2I(params);
      } else {
        result = await muapi.generateImage(params);
      }
      
      if (result && result.url) {
        showToast('Generation complete!', 'success');
        if (onComplete) {
          onComplete(result.url, prompt);
        }
      } else {
        throw new Error('No output returned');
      }
    } catch (err) {
      console.error('[CinematicTemplateWizard]', err);
      showToast(`Error: ${err.message}`, 'error');
      genBtn.disabled = false;
      genBtn.innerHTML = '✨ Start Generation';
    }
  }

  return container;
}
