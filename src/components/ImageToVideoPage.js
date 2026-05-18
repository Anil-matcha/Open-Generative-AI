import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { GTMPromptModal } from './modals/GTMPromptModal.jsx';

const IMAGE_TO_VIDEO_MODELS = [
  { name: 'Kling I2V', description: 'Kling image-to-video', category: 'Kling' },
  { name: 'Kling I2V 1.2', description: 'Kling I2V 1.2', category: 'Kling' },
  { name: 'Kling I2V 1.5', description: 'Kling I2V 1.5', category: 'Kling' },
  { name: 'Kling I2V 1.6', description: 'Kling I2V 1.6', category: 'Kling' },
  { name: 'Kling I2V 2.0', description: 'Kling I2V 2.0', category: 'Kling' },
  { name: 'Veo3 I2V', description: 'Google Veo3 image-to-video', category: 'Google' },
  { name: 'Runway I2V', description: 'Runway image-to-video', category: 'Runway' },
  { name: 'Wan I2V', description: 'Wan image-to-video', category: 'Wan' },
  { name: 'Midjourney v7 I2V', description: 'Midjourney v7 image-to-video', category: 'Midjourney' },
  { name: 'Hunyuan I2V', description: 'Tencent Hunyuan image-to-video', category: 'Hunyuan' },
  { name: 'Seedance I2V', description: 'Seedance image-to-video', category: 'Seedance' },
  { name: 'Pixverse I2V', description: 'Pixverse image-to-video', category: 'Pixverse' },
  { name: 'Vidu Q1 Reference', description: 'Vidu Q1 reference', category: 'Vidu' },
  { name: 'Vidu Q2 Reference', description: 'Vidu Q2 reference', category: 'Vidu' },
  { name: 'Hailuo I2V', description: 'Hailuo image-to-video', category: 'Hailuo' },
  { name: 'Sora 2 I2V', description: 'Sora 2 image-to-video', category: 'OpenAI' },
  { name: 'OVI I2V', description: 'OVI image-to-video', category: 'OVI' },
  { name: 'LTX 2 I2V', description: 'LTX 2 image-to-video', category: 'LTX' },
  { name: 'Leonardoai Motion 2.0', description: 'Leonardoai Motion 2.0', category: 'Leonardo' },
];

const EXAMPLE_PROMPTS = [
  { prompt: 'Animate this image with a smooth camera pan left', model: 'Kling I2V' },
  { prompt: 'Add subtle movement to the subject, gentle breathing animation', model: 'Runway I2V' },
  { prompt: 'Create a dynamic zoom out effect', model: 'Veo3 I2V' },
  { prompt: 'Add rain and reflections on surfaces', model: 'Hunyuan I2V' },
  { prompt: 'Animate with floating particles and magical glow', model: 'Seedance I2V' },
];

const FEATURES = [
  { icon: '🖼️', title: 'Image to Video', description: 'Transform static images into dynamic, animated videos' },
  { icon: '🎞️', title: '60+ Models', description: 'Access specialized image-to-video models for any use case' },
  { icon: '🎭', title: 'Motion Effects', description: 'Add camera movements, particle effects, and more' },
  { icon: '✨', title: 'Smooth Animation', description: 'Natural motion that preserves image quality' },
];

export function ImageToVideoPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center overflow-hidden bg-app-bg relative p-4 md:p-6';

  // State for advanced options
  let selectedModel = null;
  let showAdvancedOptions = false;

  // ==========================================
  // 1. HERO SECTION
  // ==========================================
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-6 md:mb-8 animate-fade-in-up transition-all duration-700 w-full max-w-5xl';
  const heroBanner = createHeroSection('video', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">Image to Video</h1>
      <p class="text-white/60 text-sm font-medium">Bring your static images to life with AI-powered animation</p>
    `;
    heroBanner.appendChild(heroContent);
    hero.appendChild(heroBanner);
  }
  container.appendChild(hero);

  // Main content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'w-full max-w-5xl relative z-40 animate-fade-in-up';
  contentWrapper.style.animationDelay = '0.1s';

  contentWrapper.innerHTML = `
    <!-- CTA + Features Panel -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h2 class="text-xl font-black text-white">Animate Any Image</h2>
          <p class="text-sm text-muted">Transform still images into stunning animated videos</p>
        </div>
        <button class="start-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
          Animate Your Images
        </button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${FEATURES.map(f => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all">
            <div class="text-2xl mb-2">${f.icon}</div>
            <h3 class="text-sm font-bold text-white mb-1">${f.title}</h3>
            <p class="text-xs text-muted">${f.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Models Panel -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6">
      <div class="mb-6">
        <h2 class="text-xl font-black text-white mb-1">Available Models</h2>
        <p class="text-sm text-muted">Choose from ${IMAGE_TO_VIDEO_MODELS.length}+ powerful animation models</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        ${IMAGE_TO_VIDEO_MODELS.map(m => `
          <button class="model-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all text-left group" data-model="${m.name}">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-white group-hover:text-primary transition-colors">${m.name}</span>
              <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">${m.category}</span>
            </div>
            <p class="text-xs text-muted">${m.description}</p>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Example Prompts Panel -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6">
      <div class="mb-6">
        <h2 class="text-xl font-black text-white mb-1">Example Animations</h2>
        <p class="text-sm text-muted">Get inspired by these animation effects</p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${EXAMPLE_PROMPTS.map((p, i) => `
          <div class="prompt-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 cursor-pointer transition-all group">
            <div class="flex items-center justify-between mb-3">
              <span class="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">${p.model}</span>
              <div class="flex items-center gap-2">
                <button class="gtm-btn w-6 h-6 rounded border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/40 transition-all flex items-center justify-center text-xs" data-prompt-index="${i}" title="Enhance with GTM">🎯</button>
                <button class="text-xs text-muted hover:text-white transition-colors try-btn">Try this →</button>
              </div>
            </div>
            <p class="text-sm text-gray-300 leading-relaxed">${p.prompt}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Advanced Veo Options Panel -->
    <div id="advanced-options-panel" class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6 hidden">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-black text-white mb-1">Advanced Veo Controls</h2>
          <p class="text-sm text-muted">Fine-tune your image-to-video generation</p>
        </div>
        <button id="close-advanced-btn" class="text-muted hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Motion Strength -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-bold text-secondary uppercase tracking-wider">Motion Strength</label>
            <span id="motion-strength-value" class="text-sm font-bold text-primary">5</span>
          </div>
          <input type="range" id="motion-strength-slider" min="1" max="10" step="1" value="5"
            class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary">
          <div class="flex justify-between text-xs text-muted">
            <span>Subtle</span>
            <span>Dramatic</span>
          </div>
        </div>

        <!-- Camera Movement -->
        <div class="flex flex-col gap-3">
          <label class="text-sm font-bold text-secondary uppercase tracking-wider mb-2">Camera Movement</label>
          <div class="grid grid-cols-3 gap-2">
            <button class="camera-btn bg-white/[0.03] border border-white/5 rounded-lg p-3 hover:border-primary/20 transition-all text-center" data-camera="pan-left">
              <div class="text-lg mb-1">⬅️</div>
              <div class="text-xs text-muted">Pan Left</div>
            </button>
            <button class="camera-btn bg-white/[0.03] border border-white/5 rounded-lg p-3 hover:border-primary/20 transition-all text-center" data-camera="zoom-in">
              <div class="text-lg mb-1">🔍</div>
              <div class="text-xs text-muted">Zoom In</div>
            </button>
            <button class="camera-btn bg-white/[0.03] border border-white/5 rounded-lg p-3 hover:border-primary/20 transition-all text-center" data-camera="tilt-up">
              <div class="text-lg mb-1">⬆️</div>
              <div class="text-xs text-muted">Tilt Up</div>
            </button>
            <button class="camera-btn bg-white/[0.03] border border-white/5 rounded-lg p-3 hover:border-primary/20 transition-all text-center" data-camera="pan-right">
              <div class="text-lg mb-1">➡️</div>
              <div class="text-xs text-muted">Pan Right</div>
            </button>
            <button class="camera-btn bg-white/[0.03] border border-white/5 rounded-lg p-3 hover:border-primary/20 transition-all text-center active" data-camera="none">
              <div class="text-lg mb-1">📷</div>
              <div class="text-xs text-muted">Static</div>
            </button>
            <button class="camera-btn bg-white/[0.03] border border-white/5 rounded-lg p-3 hover:border-primary/20 transition-all text-center" data-camera="tilt-down">
              <div class="text-lg mb-1">⬇️</div>
              <div class="text-xs text-muted">Tilt Down</div>
            </button>
          </div>
        </div>

        <!-- Prompt Enhancement -->
        <div class="flex flex-col gap-3">
          <label class="text-sm font-bold text-secondary uppercase tracking-wider">Prompt Enhancement</label>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">AI-enhanced prompts for better results</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="prompt-enhancement-toggle" class="sr-only peer">
              <div class="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <!-- Quality Presets -->
        <div class="flex flex-col gap-3">
          <label class="text-sm font-bold text-secondary uppercase tracking-wider">Quality Preset</label>
          <div class="grid grid-cols-3 gap-2">
            <button class="quality-btn bg-white/[0.03] border border-white/5 rounded-lg p-3 hover:border-primary/20 transition-all text-center" data-quality="draft">
              <div class="text-sm font-bold text-muted mb-1">Draft</div>
              <div class="text-xs text-muted">Fast</div>
            </button>
            <button class="quality-btn bg-white/[0.03] border border-primary/50 rounded-lg p-3 transition-all text-center active" data-quality="standard">
              <div class="text-sm font-bold text-primary mb-1">Standard</div>
              <div class="text-xs text-muted">Balanced</div>
            </button>
            <button class="quality-btn bg-white/[0.03] border border-white/5 rounded-lg p-3 hover:border-primary/20 transition-all text-center" data-quality="premium">
              <div class="text-sm font-bold text-muted mb-1">Premium</div>
              <div class="text-xs text-muted">Best</div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Panel -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-8 md:p-10 shadow-3xl text-center">
      <h2 class="text-2xl font-black text-white mb-2">Bring Images to Life</h2>
      <p class="text-muted mb-6 max-w-md mx-auto">Start animating your images with powerful AI models</p>
      <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
        Get Started Free
      </button>
    </div>
  `;

  container.appendChild(contentWrapper);

  // Event Listeners
  container.querySelector('.start-btn').onclick = () => navigate('video');
  container.querySelector('.cta-btn').onclick = () => navigate('video');

  container.querySelectorAll('.model-card').forEach(card => {
    card.onclick = () => {
      const modelName = card.dataset.model;
      localStorage.setItem('prefill_model', modelName);
      navigate('video');
    };
  });

  container.querySelectorAll('.prompt-card').forEach((card, i) => {
    card.onclick = () => {
      const prompt = EXAMPLE_PROMPTS[i];
      localStorage.setItem('prefill_prompt', prompt.prompt);
      localStorage.setItem('prefill_model', prompt.model);
      navigate('video');
    };
  });

  container.querySelectorAll('.prompt-card .try-btn').forEach((btn, i) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const prompt = EXAMPLE_PROMPTS[i];
      localStorage.setItem('prefill_prompt', prompt.prompt);
      localStorage.setItem('prefill_model', prompt.model);
      navigate('video');
    };
  });

  container.querySelectorAll('.prompt-card .gtm-btn').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const promptIndex = parseInt(btn.dataset.promptIndex);
      const prompt = EXAMPLE_PROMPTS[promptIndex];

      try {
        const modal = new GTMPromptModal({
          appTheme: 'image-to-video',
          onPromptGenerated: (generatedPrompt) => {
            // Store the enhanced prompt and navigate to video studio
            localStorage.setItem('prefill_prompt', generatedPrompt);
            localStorage.setItem('prefill_model', prompt.model);
            navigate('video');
          }
        });

        // Pre-fill the modal with the example prompt
        setTimeout(() => {
          const basePromptInput = modal.content?.querySelector('#base-prompt');
          if (basePromptInput) {
            basePromptInput.value = prompt.prompt;
            basePromptInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 100);

        modal.open();
      } catch (error) {
        console.error('GTM Prompt Modal error:', error);
        
      }
    };
  });

  // ==========================================
  // ADVANCED OPTIONS LOGIC
  // ==========================================

  const advancedPanel = container.querySelector('#advanced-options-panel');
  const closeAdvancedBtn = container.querySelector('#close-advanced-btn');

  // State for advanced options
  const veoOptions = {
    motionStrength: 5,
    cameraMovement: 'none',
    promptEnhancement: false,
    qualityPreset: 'standard'
  };

  // Function to show/hide advanced options based on selected model
  const updateAdvancedOptionsVisibility = (modelName) => {
    selectedModel = modelName;
    const isVeoModel = modelName && modelName.includes('Veo');

    if (isVeoModel && !showAdvancedOptions) {
      showAdvancedOptions = true;
      advancedPanel.classList.remove('hidden');
      // Animate in
      advancedPanel.style.animation = 'fade-in-up 0.3s ease-out';
    } else if (!isVeoModel && showAdvancedOptions) {
      showAdvancedOptions = false;
      advancedPanel.classList.add('hidden');
    }
  };

  // Close advanced options
  closeAdvancedBtn.onclick = () => {
    showAdvancedOptions = false;
    advancedPanel.classList.add('hidden');
  };

  // Motion strength slider
  const motionStrengthSlider = container.querySelector('#motion-strength-slider');
  const motionStrengthValue = container.querySelector('#motion-strength-value');

  motionStrengthSlider.oninput = (e) => {
    veoOptions.motionStrength = parseInt(e.target.value);
    motionStrengthValue.textContent = veoOptions.motionStrength;
  };

  // Camera movement buttons
  container.querySelectorAll('.camera-btn').forEach(btn => {
    btn.onclick = (e) => {
      // Remove active class from all camera buttons
      container.querySelectorAll('.camera-btn').forEach(b => {
        b.classList.remove('active', 'border-primary/50', 'bg-primary/10');
        b.classList.add('border-white/5', 'bg-white/[0.03]');
      });

      // Add active class to clicked button
      e.target.closest('.camera-btn').classList.add('active', 'border-primary/50', 'bg-primary/10');
      e.target.closest('.camera-btn').classList.remove('border-white/5', 'bg-white/[0.03]');

      veoOptions.cameraMovement = e.target.closest('.camera-btn').dataset.camera;
    };
  });

  // Prompt enhancement toggle
  const promptEnhancementToggle = container.querySelector('#prompt-enhancement-toggle');
  promptEnhancementToggle.onchange = (e) => {
    veoOptions.promptEnhancement = e.target.checked;
  };

  // Quality preset buttons
  container.querySelectorAll('.quality-btn').forEach(btn => {
    btn.onclick = (e) => {
      // Remove active class from all quality buttons
      container.querySelectorAll('.quality-btn').forEach(b => {
        b.classList.remove('active', 'border-primary/50', 'bg-primary/10', 'text-primary');
        b.classList.add('border-white/5', 'bg-white/[0.03]', 'text-muted');
        b.querySelector('div:first-child').classList.remove('text-primary');
        b.querySelector('div:first-child').classList.add('text-muted');
      });

      // Add active class to clicked button
      e.target.closest('.quality-btn').classList.add('active', 'border-primary/50', 'bg-primary/10');
      e.target.closest('.quality-btn').classList.remove('border-white/5', 'bg-white/[0.03]');
      const qualityText = e.target.closest('.quality-btn').querySelector('div:first-child');
      qualityText.classList.remove('text-muted');
      qualityText.classList.add('text-primary');

      veoOptions.qualityPreset = e.target.closest('.quality-btn').dataset.quality;
    };
  });

  // Override model card clicks to show advanced options for Veo
  container.querySelectorAll('.model-card').forEach(card => {
    const originalOnclick = card.onclick;
    card.onclick = (e) => {
      const modelName = card.dataset.model;
      updateAdvancedOptionsVisibility(modelName);

      // Store Veo options in localStorage if Veo model selected
      if (modelName.includes('Veo')) {
        localStorage.setItem('veo_advanced_options', JSON.stringify(veoOptions));
      }

      // Call original click handler
      originalOnclick.call(card, e);
    };
  });

  // Override prompt card clicks to check for Veo models
  container.querySelectorAll('.prompt-card').forEach((card, i) => {
    const originalOnclick = card.onclick;
    card.onclick = (e) => {
      const prompt = EXAMPLE_PROMPTS[i];
      updateAdvancedOptionsVisibility(prompt.model);

      // Store Veo options if Veo model
      if (prompt.model.includes('Veo')) {
        localStorage.setItem('veo_advanced_options', JSON.stringify(veoOptions));
      }

      // Call original click handler
      originalOnclick.call(card, e);
    };
  });

  container.querySelectorAll('.prompt-card .try-btn').forEach((btn, i) => {
    const originalOnclick = btn.onclick;
    btn.onclick = (e) => {
      e.stopPropagation();
      const prompt = EXAMPLE_PROMPTS[i];
      updateAdvancedOptionsVisibility(prompt.model);

      // Store Veo options if Veo model
      if (prompt.model.includes('Veo')) {
        localStorage.setItem('veo_advanced_options', JSON.stringify(veoOptions));
      }

      // Call original click handler
      originalOnclick.call(btn, e);
    };
  });

  return container;
}
