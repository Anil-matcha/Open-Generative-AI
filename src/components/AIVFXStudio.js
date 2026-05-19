import { muapi } from '../lib/muapi.js';
import { securityService } from '../lib/services/SecurityService.js';

const VFX_CATEGORIES = {
  'AI Effects': {
    effects: [
      { name: 'Kiss Me AI', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Kiss_Me_AI.webp' },
      { name: 'Kiss', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Kiss.webp' },
      { name: 'Venom', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Venom.webp' },
      { name: 'Hulk', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Hulk_.webp' },
      { name: 'Muscle Surge', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Muscle_Surge.webp' },
      { name: 'The Tiger Touch', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/The_Tiger_Touch.webp' },
      { name: 'Anything, Robot', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Anything_Robot.webp' },
      { name: 'Warmth of Jesus', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Warmth_of_Jesus.webp' },
      { name: 'Holy Wings', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Holy_Wings.webp' },
      { name: 'Microwave', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Microwave.webp' },
    ],
    icon: '⭐'
  },
  'Motion Controls': {
    effects: [
      { name: '360 Orbit', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/360+Orbit.webp', trigger_word: '0rb4it 360 degree orbit', input_type: 'i2v' },
      { name: 'Hero Run', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Action+Run.webp', trigger_word: '4ct3ion Action Run', input_type: 'i2v' },
      { name: 'Arc Shot', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Arc.webp', trigger_word: '34Ar2c arc the camera moves in a smooth curve around', input_type: 'i2v' },
      { name: 'Matrix Shot', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Bullet+Time.webp', trigger_word: 'b4ll3t t1m3 bullet time shot', input_type: 'i2v' },
      { name: 'Car Chase', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Car+Chasing.webp', trigger_word: 'c4r ch4s3 car chase', input_type: 'i2v' },
      { name: 'Crane Down', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Down.webp', trigger_word: 'cr4n3 crane down camera motion', input_type: 'i2v' },
      { name: 'Crane Overhead', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Over+The+Head.webp', trigger_word: 'cr4n3 crane over the head movement', input_type: 'i2v' },
      { name: 'Crane Up', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Up.webp', trigger_word: 'cr4n3 crane up effect', input_type: 'i2v' },
      { name: 'Crash Zoom In', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crash+Zoom+In.webp', trigger_word: 'cr34sh crash zoom in effect', input_type: 'i2v' },
      { name: 'Crash Zoom Out', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crash+Zoom+Out.webp', trigger_word: 'cr34sh crash zoom out effect', input_type: 'i2v' },
    ],
    icon: '🎬'
  },
  'VFX': {
    effects: [
      { name: 'Levitate', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Levitation.webp', trigger_word: 'lev1tate2_it0 levitate effect', input_type: 'i2v' },
      { name: 'Disintegration', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Disintegration.webp', trigger_word: 'd1s1nt34gration disintegration effect', input_type: 'i2v' },
      { name: 'Flying', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Flying.webp', trigger_word: 'f1y1ng smooth gliding flight', input_type: 'i2v' },
      { name: 'Car Explosion', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Car+Explosion.webp', trigger_word: 'c3r exp356l0sion the car explodes bursting into flames and debris', input_type: 'i2v' },
      { name: 'Tornado', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Tornado.webp', trigger_word: 't0r54d0 realistic tornado', input_type: 't2v' },
      { name: 'Electricity', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Electricity.webp', trigger_word: 'e13c7r1c electricity effect', input_type: 'i2v' },
      { name: 'Huge Explosion', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Huge+Explosion.webp', trigger_word: '3xp105ion huge explosion', input_type: 'i2v' },
      { name: 'Decay Time-Lapse', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Decay+Time-Lapse.webp', trigger_word: 'd3c4y decay time-lapse begins', input_type: 'i2v' },
      { name: 'Tsunami', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Tsunami.webp', trigger_word: 't5un@m1 realistic tsunami', input_type: 't2v' },
      { name: 'Fire', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Fire.webp', trigger_word: '[r3al_f1re]', input_type: 't2v' },
      { name: 'Robotic Face Reveal', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Robotic+Face+Reveal.webp', trigger_word: 'r8b8t1c robotic face reveal', input_type: 'i2v' },
      { name: 'Building Explosion', url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Building+Explosion.webp', trigger_word: 'b32ldi4ng exp39lsion the building explodes in a massive blast', input_type: 'i2v' },
    ],
    icon: '⭐'
  },
  'Pika Effects': {
    effects: [
      { name: 'Explode', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Explode.webp' },
      { name: 'Melt', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Melt.webp' },
      { name: 'Dissolve', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Dissolve.webp' },
      { name: 'Poke', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Poke.webp' },
      { name: 'Ta-da', effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Ta-da.webp' },
    ],
    icon: '⚡'
  }
};

export function AIVFXStudio() {
  let activeCategory = 'AI Effects';
  let selectedEffect = null;
  let uploadedFile = null;
  let previewUrl = null;
  let imageUrl = '';
  let dragActive = false;
  let inputText = '';
  let selectedAspect = '9:16';
  let selectedDuration = 5;
  let selectedResolution = '480p';
  let selectedQuality = 'medium';
  let status = 'idle';
  let requestId = null;
  let videoUrl = '';
  let error = '';
  let log = [];
  let isMounted = true;

  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col overflow-hidden bg-app-bg text-white';

  const inner = document.createElement('div');
  inner.className = 'w-full px-4 md:px-8 py-8 md:py-12';
  container.appendChild(inner);

  const addLog = (message) => {
    if (isMounted) log.push(message);
  };

  const isValidFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
    return validTypes.includes(file.type);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && isValidFile(file)) {
      uploadedFile = file;
      previewUrl = URL.createObjectURL(file);
      updatePreview();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragActive = true;
    updateDragState();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragActive = false;
    updateDragState();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragActive = false;
    updateDragState();
    const file = e.dataTransfer.files?.[0];
    if (file && isValidFile(file)) {
      uploadedFile = file;
      previewUrl = URL.createObjectURL(file);
      updatePreview();
    }
  };

  const updatePreview = () => {
    const previewContainer = container.querySelector('.preview-container');
    if (previewContainer) {
      if (previewUrl) {
        previewContainer.innerHTML = `
          <div class="relative inline-block">
            <img src="${previewUrl}" alt="Preview" style="max-width: 160px; max-height: 90px; border-radius: 8px; border: 1px solid #23232b;" />
            <button class="clear-preview absolute -top-2 -right-2 bg-[#232b39] text-white border-none rounded-full w-5 h-5 flex items-center justify-center text-xs cursor-pointer">×</button>
          </div>
        `;
        previewContainer.querySelector('.clear-preview')?.addEventListener('click', () => {
          uploadedFile = null;
          previewUrl = null;
          imageUrl = '';
          updatePreview();
        });
      } else {
        previewContainer.innerHTML = '';
      }
    }
  };

  const updateDragState = () => {
    container.querySelector('.upload-area')?.classList.toggle('drag-active', dragActive);
  };

  const startGeneration = async () => {
    if (!selectedEffect) {
      error = 'Please select an effect first.';
      updateModal();
      return;
    }

    const apiKey = await securityService.getDecryptedKey();
    if (!apiKey) {
      error = 'Please enter your MuAPI API key in Settings.';
      updateModal();
      return;
    }

    if (!imageUrl && !uploadedFile) {
      error = 'Please upload an image or provide an image URL.';
      updateModal();
      return;
    }

    status = 'submitting';
    error = '';
    videoUrl = '';
    requestId = null;
    log = [];
    updateModal();

    try {
      addLog('Submitting generation request...');

      const payload = {
        prompt: inputText || `Apply ${selectedEffect.name} effect`,
        image_url: imageUrl,
        name: selectedEffect.name,
        aspect_ratio: selectedAspect,
        quality: selectedQuality,
        duration: selectedDuration,
        apiKey
      };

      const result = await muapi.generateVideoEffect(payload);
      addLog('Generation started: ' + JSON.stringify(result));

      if (result.url || result.output?.[0]) {
        status = 'completed';
        videoUrl = result.url || result.output[0];
        addLog('Generation complete!');
      } else {
        throw new Error('No video URL in response');
      }
    } catch (err) {
      console.error('Generation error:', err);
      status = 'error';
      error = err.message;
      addLog('Error: ' + err.message);
    }

    updateModal();
  };

  const updateModal = () => {
    const modal = container.querySelector('.vfx-modal');
    if (!modal) return;

    if (status === 'idle') {
      modal.style.display = 'none';
      return;
    }

    modal.style.display = 'flex';
    const content = modal.querySelector('.modal-content');
    if (!content) return;

    if (status === 'submitting' || status === 'processing') {
      content.innerHTML = `
        <div class="bg-panel-bg rounded-xl p-6 max-w-md w-full mx-4">
          <div class="text-center">
            <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p class="text-white font-medium">Generating your VFX...</p>
            <p class="text-secondary text-sm mt-2">This may take 30-60 seconds</p>
          </div>
        </div>
      `;
    } else if (status === 'completed' && videoUrl) {
      content.innerHTML = `
        <div class="bg-panel-bg rounded-xl p-6 max-w-md w-full mx-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Your VFX is Ready!</h3>
            <button class="close-modal text-secondary hover:text-white text-xl">×</button>
          </div>
          <video src="${videoUrl}" controls class="w-full h-48 object-cover rounded-lg mb-4"></video>
          <div class="flex gap-2">
            <a href="${videoUrl}" download class="flex-1 bg-primary text-white py-2 px-4 rounded-lg text-center font-medium">Download</a>
            <button class="close-btn flex-1 bg-panel-bg text-white py-2 px-4 rounded-lg border border-white/10">Close</button>
          </div>
        </div>
      `;
      content.querySelector('.close-modal')?.addEventListener('click', closeModal);
      content.querySelector('.close-btn')?.addEventListener('click', closeModal);
    } else if (status === 'error') {
      content.innerHTML = `
        <div class="bg-panel-bg rounded-xl p-6 max-w-md w-full mx-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-red-400">Generation Failed</h3>
            <button class="close-modal text-secondary hover:text-white text-xl">×</button>
          </div>
          <p class="text-secondary text-sm mb-4">${error}</p>
          <button class="retry-btn w-full bg-primary text-white py-2 px-4 rounded-lg font-medium">Retry</button>
        </div>
      `;
      content.querySelector('.close-modal')?.addEventListener('click', closeModal);
      content.querySelector('.retry-btn')?.addEventListener('click', () => {
        status = 'idle';
        error = '';
        startGeneration();
      });
    }
  };

  const closeModal = () => {
    status = 'idle';
    error = '';
    log = [];
    videoUrl = '';
    requestId = null;
    updateModal();
  };

  const renderCategory = (categoryName) => {
    activeCategory = categoryName;
    selectedEffect = null;
    renderEffects();
  };

  const renderEffects = () => {
    const grid = container.querySelector('.effects-grid');
    if (!grid) return;

    const category = VFX_CATEGORIES[activeCategory];
    if (!category) return;

    grid.innerHTML = category.effects.map(effect => `
      <div class="effect-card bg-panel-bg rounded-xl overflow-hidden border border-white/5 cursor-pointer transition-all" data-effect='${JSON.stringify(effect).replace(/'/g, "&apos;")}' style="aspect-ratio: 1/1">
        <div class="relative w-full h-full">
          <img src="${effect.effect || effect.url}" alt="${effect.name}" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.effect-card').forEach(card => {
      card.addEventListener('click', () => {
        const effectData = JSON.parse(card.dataset.effect.replace(/&apos;/g, "'"));
        selectedEffect = effectData;
        grid.querySelectorAll('.effect-card').forEach(c => {
          c.classList.remove('border-primary', 'bg-primary/10');
          c.classList.add('border-white/5');
        });
        card.classList.add('border-primary', 'bg-primary/10');
        updateSelectedEffect();
      });
    });
  };

  const updateSelectedEffect = () => {
    const display = container.querySelector('.selected-effect-display');
    if (selectedEffect && display) {
      display.innerHTML = `
        <div class="flex items-center gap-3 bg-primary/10 rounded-lg p-3">
          <img src="${selectedEffect.effect || selectedEffect.url}" alt="${selectedEffect.name}" class="w-10 h-10 rounded-lg object-cover" />
          <div class="flex-1">
            <p class="text-white font-medium text-sm">${selectedEffect.name}</p>
          </div>
        </div>
      `;
    } else if (display) {
      display.innerHTML = '';
    }
  };

  const buildUI = () => {
    inner.innerHTML = `
      <div class="max-w-6xl mx-auto">
        <div class="mb-10">
          <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">AI-VFX Studio</h1>
          <p class="text-secondary text-sm md:text-base max-w-xl">Apply AI-powered visual effects and transformations to your videos and images with 37 cinematic effects.</p>
        </div>

        <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          ${Object.entries(VFX_CATEGORIES).map(([name, cat]) => `
            <button class="category-btn px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === name ? 'bg-primary text-white' : 'bg-white/5 text-secondary hover:bg-white/10'}">${cat.icon} ${name}</button>
          `).join('')}
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 effects-grid"></div>

        <div class="fixed bottom-16 left-1/2 transform -translate-x-1/2 w-full max-w-4xl z-20">
          <div class="bg-panel-bg/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6 mx-4">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1">
                <input type="text" placeholder="Enter your prompt (optional)..." value="${inputText}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-secondary outline-none focus:border-primary" />
              </div>
              <button class="image-url-btn bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium">Add Image</button>
            </div>

            <div class="flex items-center gap-4 mb-4">
              <div class="selected-effect-display flex-1"></div>
              <div class="preview-container"></div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label class="text-xs text-secondary mb-1 block">Aspect Ratio</label>
                <select class="aspect-select w-full bg-panel-bg border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="9:16" ${selectedAspect === '9:16' ? 'selected' : ''}>9:16</option>
                  <option value="16:9" ${selectedAspect === '16:9' ? 'selected' : ''}>16:9</option>
                  <option value="1:1" ${selectedAspect === '1:1' ? 'selected' : ''}>1:1</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-secondary mb-1 block">Duration</label>
                <select class="duration-select w-full bg-panel-bg border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="3" ${selectedDuration === 3 ? 'selected' : ''}>3s</option>
                  <option value="5" ${selectedDuration === 5 ? 'selected' : ''}>5s</option>
                  <option value="10" ${selectedDuration === 10 ? 'selected' : ''}>10s</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-secondary mb-1 block">Resolution</label>
                <select class="resolution-select w-full bg-panel-bg border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="480p" ${selectedResolution === '480p' ? 'selected' : ''}>480p</option>
                  <option value="720p" ${selectedResolution === '720p' ? 'selected' : ''}>720p</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-secondary mb-1 block">Quality</label>
                <select class="quality-select w-full bg-panel-bg border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="medium" ${selectedQuality === 'medium' ? 'selected' : ''}>Medium</option>
                  <option value="high" ${selectedQuality === 'high' ? 'selected' : ''}>High</option>
                </select>
              </div>
            </div>

            <div class="upload-area border-2 border-dashed border-white/10 rounded-xl p-6 text-center mb-4 cursor-pointer">
              <input type="file" class="hidden file-input" accept="image/*,video/*" />
              <p class="text-secondary text-sm">Drag & drop an image here, or click to browse</p>
            </div>

            <button class="generate-btn w-full bg-primary text-black py-3 rounded-xl font-black text-lg hover:shadow-glow transition-all">Generate VFX</button>
          </div>
        </div>

        <div class="vfx-modal fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden"></div>
      </div>
    `;

    inner.querySelector('.category-btn').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const index = [...inner.querySelectorAll('.category-btn')].indexOf(btn);
      const categoryName = Object.keys(VFX_CATEGORIES)[index];
      renderCategory(categoryName);
    });

    inner.querySelector('.image-url-btn').addEventListener('click', () => {
      const url = prompt('Enter image URL:');
      if (url && /^https?:\/\//.test(url)) {
        imageUrl = url;
        updatePreview();
      }
    });

    const fileInput = inner.querySelector('.file-input');
    fileInput?.addEventListener('change', handleFileChange);

    const uploadArea = inner.querySelector('.upload-area');
    uploadArea?.addEventListener('dragover', handleDragOver);
    uploadArea?.addEventListener('dragleave', handleDragLeave);
    uploadArea?.addEventListener('drop', handleDrop);
    uploadArea?.addEventListener('click', () => fileInput?.click());

    inner.querySelector('.generate-btn')?.addEventListener('click', startGeneration);

    inner.querySelector('.aspect-select')?.addEventListener('change', (e) => {
      selectedAspect = e.target.value;
    });
    inner.querySelector('.duration-select')?.addEventListener('change', (e) => {
      selectedDuration = parseInt(e.target.value);
    });
    inner.querySelector('.resolution-select')?.addEventListener('change', (e) => {
      selectedResolution = e.target.value;
    });
    inner.querySelector('.quality-select')?.addEventListener('change', (e) => {
      selectedQuality = e.target.value;
    });

    inner.querySelector('input[type="text"]')?.addEventListener('input', (e) => {
      inputText = e.target.value;
    });

    renderEffects();
    updatePreview();
    updateSelectedEffect();
  };

  buildUI();
  return container;
}