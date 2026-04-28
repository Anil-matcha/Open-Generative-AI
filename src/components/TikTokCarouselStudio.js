import { createUploadPicker } from './UploadPicker.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { generateTikTokCarousel, uploadCarouselMusic, generateCarouselPreview } from '../lib/muapiEnhanced.js';

const LAYOUT_TYPES = [
  { id: 'horizontal', name: 'Horizontal', icon: '↔️', description: 'Images slide left to right' },
  { id: 'vertical', name: 'Vertical', icon: '↕️', description: 'Images slide top to bottom' },
  { id: 'grid', name: 'Grid', icon: '⊞', description: 'Images arranged in a grid' },
];

const TRANSITION_TYPES = [
  { id: 'slide', name: 'Slide', icon: '➡️', description: 'Smooth sliding transitions' },
  { id: 'fade', name: 'Fade', icon: '🌫️', description: 'Fade in/out effects' },
  { id: 'zoom', name: 'Zoom', icon: '🔍', description: 'Zoom in/out transitions' },
];

export function TikTokCarouselStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center justify-start bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden';

  // State management
  let uploadedImages = [];
  let selectedLayout = 'horizontal';
  let selectedTransition = 'slide';
  let slideTimings = [];
  let backgroundMusicUrl = null;
  let totalDuration = 5;
  let isGenerating = false;
  const previewUrl = null;

  // ==========================================
  // 1. HERO SECTION
  // ==========================================
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-6 animate-fade-in-up transition-all duration-700 w-full max-w-5xl';

  const heroBanner = createHeroSection('video', 'h-32 md:h-44 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-1">TikTok Carousel Studio</h1>
      <p class="text-white/60 text-sm font-medium">Create engaging multi-image carousels optimized for TikTok and social media</p>
    `;
    heroBanner.appendChild(heroContent);
    hero.appendChild(heroBanner);
  }
  container.appendChild(hero);

  // ==========================================
  // 2. MAIN CONTENT
  // ==========================================
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'w-full max-w-6xl relative z-40 animate-fade-in-up';
  contentWrapper.style.animationDelay = '0.1s';

  // Image Upload Section
  const uploadSection = document.createElement('div');
  uploadSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6';

  const uploadTitle = document.createElement('div');
  uploadTitle.className = 'mb-6';
  uploadTitle.innerHTML = `
    <h2 class="text-xl font-black text-white mb-1">Upload Images</h2>
    <p class="text-sm text-muted">Select up to 10 images for your carousel (max 10MB each)</p>
  `;

  const uploadPicker = createUploadPicker({
    anchorContainer: container,
    accept: 'image/*',
    multiple: true,
    maxFiles: 10,
    onSelect: ({ files }) => {
      uploadedImages = files.map(f => f.url);
      updateImagePreview();
      updateControls();
    },
    onClear: () => {
      uploadedImages = [];
      slideTimings = [];
      updateImagePreview();
      updateControls();
    },
  });

  uploadSection.appendChild(uploadTitle);
  uploadSection.appendChild(uploadPicker.panel);
  contentWrapper.appendChild(uploadSection);

  // Image Preview Section
  const previewSection = document.createElement('div');
  previewSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6';
  previewSection.id = 'image-preview-section';

  const previewTitle = document.createElement('div');
  previewTitle.className = 'mb-6';
  previewTitle.innerHTML = `
    <h2 class="text-xl font-black text-white mb-1">Image Preview</h2>
    <p class="text-sm text-muted">Drag to reorder images in your carousel</p>
  `;

  const imageGrid = document.createElement('div');
  imageGrid.className = 'grid grid-cols-2 md:grid-cols-5 gap-4 min-h-[200px]';
  imageGrid.id = 'image-grid';

  previewSection.appendChild(previewTitle);
  previewSection.appendChild(imageGrid);
  contentWrapper.appendChild(previewSection);

  // Layout & Transition Controls
  const controlsSection = document.createElement('div');
  controlsSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6';
  controlsSection.id = 'controls-section';

  const controlsTitle = document.createElement('div');
  controlsTitle.className = 'mb-6';
  controlsTitle.innerHTML = `
    <h2 class="text-xl font-black text-white mb-1">Carousel Settings</h2>
    <p class="text-sm text-muted">Customize layout, transitions, and timing</p>
  `;

  // Layout Selection
  const layoutControl = document.createElement('div');
  layoutControl.className = 'mb-6';
  layoutControl.innerHTML = `
    <label class="block text-sm font-bold text-white mb-3">Layout Style</label>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3" id="layout-options"></div>
  `;

  // Transition Selection
  const transitionControl = document.createElement('div');
  transitionControl.className = 'mb-6';
  transitionControl.innerHTML = `
    <label class="block text-sm font-bold text-white mb-3">Transition Effects</label>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3" id="transition-options"></div>
  `;

  // Timing Controls
  const timingControl = document.createElement('div');
  timingControl.className = 'mb-6';
  timingControl.innerHTML = `
    <label class="block text-sm font-bold text-white mb-3">Timing & Duration</label>
    <div class="space-y-4">
      <div>
        <label class="block text-xs text-muted mb-2">Total Duration: <span id="total-duration">${totalDuration}s</span></label>
        <input type="range" min="3" max="15" value="${totalDuration}" class="w-full" id="duration-slider">
      </div>
      <div id="slide-timings" class="space-y-2"></div>
    </div>
  `;

  controlsSection.appendChild(controlsTitle);
  controlsSection.appendChild(layoutControl);
  controlsSection.appendChild(transitionControl);
  controlsSection.appendChild(timingControl);
  contentWrapper.appendChild(controlsSection);

  // Background Music Section
  const musicSection = document.createElement('div');
  musicSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6';

  const musicTitle = document.createElement('div');
  musicTitle.className = 'mb-6';
  musicTitle.innerHTML = `
    <h2 class="text-xl font-black text-white mb-1">Background Music</h2>
    <p class="text-sm text-muted">Optional: Add music to your carousel</p>
  `;

  const musicUpload = createUploadPicker({
    anchorContainer: container,
    accept: 'audio/*',
    multiple: false,
    onSelect: ({ url }) => {
      backgroundMusicUrl = url;
      updateMusicPreview();
    },
    onClear: () => {
      backgroundMusicUrl = null;
      updateMusicPreview();
    },
  });

  musicSection.appendChild(musicTitle);
  musicSection.appendChild(musicUpload.panel);
  contentWrapper.appendChild(musicSection);

  // Generate Section
  const generateSection = document.createElement('div');
  generateSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6';

  const generateTitle = document.createElement('div');
  generateTitle.className = 'mb-6';
  generateTitle.innerHTML = `
    <h2 class="text-xl font-black text-white mb-1">Generate Carousel</h2>
    <p class="text-sm text-muted">Create your TikTok-optimized video carousel</p>
  `;

  const generateButton = document.createElement('button');
  generateButton.className = 'w-full bg-primary hover:bg-primary/80 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed';
  generateButton.id = 'generate-button';
  generateButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="23 7 16 12 23 17 23 7"></polygon>
      <rect x="1" y="5" width="15" height="14" rx="2"></rect>
    </svg>
    Generate Carousel
  `;

  const previewArea = document.createElement('div');
  previewArea.className = 'mt-6 hidden';
  previewArea.id = 'preview-area';

  generateSection.appendChild(generateTitle);
  generateSection.appendChild(generateButton);
  generateSection.appendChild(previewArea);
  contentWrapper.appendChild(generateSection);

  container.appendChild(contentWrapper);

  // ==========================================
  // 3. EVENT HANDLERS & FUNCTIONS
  // ==========================================

  function updateImagePreview() {
    const grid = document.getElementById('image-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (uploadedImages.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full flex items-center justify-center py-12 text-muted">
          <div class="text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mx-auto mb-4 opacity-50">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p>No images uploaded yet</p>
          </div>
        </div>
      `;
      return;
    }

    uploadedImages.forEach((url, index) => {
      const imageCard = document.createElement('div');
      imageCard.className = 'relative group cursor-move';
      imageCard.draggable = true;
      imageCard.innerHTML = `
        <div class="aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-primary/50 transition-all">
          <img src="${url}" class="w-full h-full object-cover" alt="Slide ${index + 1}">
          <div class="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            ${index + 1}
          </div>
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M7 17l10-10M7 7l10 10"/>
            </svg>
          </div>
        </div>
      `;

      // Drag and drop functionality
      imageCard.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index.toString());
        imageCard.classList.add('opacity-50');
      });

      imageCard.addEventListener('dragend', () => {
        imageCard.classList.remove('opacity-50');
      });

      imageCard.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      imageCard.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = index;

        if (fromIndex !== toIndex) {
          const [moved] = uploadedImages.splice(fromIndex, 1);
          uploadedImages.splice(toIndex, 0, moved);
          updateImagePreview();
          updateSlideTimings();
        }
      });

      grid.appendChild(imageCard);
    });
  }

  function updateControls() {
    const isEnabled = uploadedImages.length > 0;

    // Update layout options
    const layoutOptions = document.getElementById('layout-options');
    if (layoutOptions) {
      layoutOptions.innerHTML = '';
      LAYOUT_TYPES.forEach(layout => {
        const option = document.createElement('button');
        option.className = `p-4 border-2 rounded-xl text-left transition-all ${
          selectedLayout === layout.id
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-white/10 bg-white/5 hover:border-white/20 text-white'
        } ${!isEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
        option.disabled = !isEnabled;
        option.innerHTML = `
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">${layout.icon}</span>
            <span class="font-bold">${layout.name}</span>
          </div>
          <p class="text-xs text-muted">${layout.description}</p>
        `;
        option.onclick = () => {
          selectedLayout = layout.id;
          updateLayoutOptions();
        };
        layoutOptions.appendChild(option);
      });
    }

    // Update transition options
    const transitionOptions = document.getElementById('transition-options');
    if (transitionOptions) {
      transitionOptions.innerHTML = '';
      TRANSITION_TYPES.forEach(transition => {
        const option = document.createElement('button');
        option.className = `p-4 border-2 rounded-xl text-left transition-all ${
          selectedTransition === transition.id
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-white/10 bg-white/5 hover:border-white/20 text-white'
        } ${!isEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
        option.disabled = !isEnabled;
        option.innerHTML = `
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">${transition.icon}</span>
            <span class="font-bold">${transition.name}</span>
          </div>
          <p class="text-xs text-muted">${transition.description}</p>
        `;
        option.onclick = () => {
          selectedTransition = transition.id;
          updateTransitionOptions();
        };
        transitionOptions.appendChild(option);
      });
    }

    updateSlideTimings();
  }

  function updateLayoutOptions() {
    const options = document.querySelectorAll('#layout-options button');
    options.forEach((option, index) => {
      const layout = LAYOUT_TYPES[index];
      option.className = `p-4 border-2 rounded-xl text-left transition-all ${
        selectedLayout === layout.id
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-white/10 bg-white/5 hover:border-white/20 text-white'
      } cursor-pointer`;
    });
  }

  function updateTransitionOptions() {
    const options = document.querySelectorAll('#transition-options button');
    options.forEach((option, index) => {
      const transition = TRANSITION_TYPES[index];
      option.className = `p-4 border-2 rounded-xl text-left transition-all ${
        selectedTransition === transition.id
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-white/10 bg-white/5 hover:border-white/20 text-white'
      } cursor-pointer`;
    });
  }

  function updateSlideTimings() {
    const timingsContainer = document.getElementById('slide-timings');
    if (!timingsContainer) return;

    timingsContainer.innerHTML = '';

    if (uploadedImages.length === 0) return;

    // Initialize timings if needed
    if (slideTimings.length !== uploadedImages.length) {
      slideTimings = new Array(uploadedImages.length).fill(totalDuration / uploadedImages.length);
    }

    uploadedImages.forEach((url, index) => {
      const timingControl = document.createElement('div');
      timingControl.className = 'flex items-center gap-4';
      timingControl.innerHTML = `
        <div class="w-16 text-xs text-muted">Slide ${index + 1}:</div>
        <input type="range" min="0.5" max="5" step="0.1" value="${slideTimings[index]}" class="flex-1" data-index="${index}">
        <div class="w-12 text-xs text-white text-right">${slideTimings[index]}s</div>
      `;

      const slider = timingControl.querySelector('input[type="range"]');
      const valueDisplay = timingControl.querySelector('.text-right');

      slider.oninput = () => {
        slideTimings[index] = parseFloat(slider.value);
        valueDisplay.textContent = `${slideTimings[index]}s`;
        updateTotalDuration();
      };

      timingsContainer.appendChild(timingControl);
    });
  }

  function updateTotalDuration() {
    const newTotal = slideTimings.reduce((sum, t) => sum + t, 0);
    totalDuration = Math.max(3, Math.min(15, newTotal)); // Clamp between 3-15 seconds

    const durationDisplay = document.getElementById('total-duration');
    if (durationDisplay) {
      durationDisplay.textContent = `${totalDuration.toFixed(1)}s`;
    }

    const durationSlider = document.getElementById('duration-slider');
    if (durationSlider) {
      durationSlider.value = totalDuration;
    }
  }

  function updateMusicPreview() {
    // Update music preview if needed
    const musicPanel = musicUpload.panel;
    // Add any music preview functionality here
  }

  // Duration slider handler
  const durationSlider = document.getElementById('duration-slider');
  if (durationSlider) {
    durationSlider.oninput = () => {
      totalDuration = parseInt(durationSlider.value);
      document.getElementById('total-duration').textContent = `${totalDuration}s`;

      // Redistribute timing evenly
      if (uploadedImages.length > 0) {
        slideTimings = new Array(uploadedImages.length).fill(totalDuration / uploadedImages.length);
        updateSlideTimings();
      }
    };
  }

  // Generate button handler
  generateButton.onclick = async () => {
    if (uploadedImages.length === 0) {
      alert('Please upload at least one image first.');
      return;
    }

    if (isGenerating) return;

    isGenerating = true;
    generateButton.disabled = true;
    generateButton.innerHTML = `
      <div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
      Generating...
    `;

    try {
      const result = await generateTikTokCarousel(uploadedImages, {
        layout: selectedLayout,
        transitions: selectedTransition,
        timings: slideTimings,
        musicUrl: backgroundMusicUrl,
        duration: totalDuration
      });

      if (result.success) {
        showPreview(result.url);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert(`Failed to generate carousel: ${error.message}`);
    } finally {
      isGenerating = false;
      generateButton.disabled = false;
      generateButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="23 7 16 12 23 17 23 7"></polygon>
          <rect x="1" y="5" width="15" height="14" rx="2"></rect>
        </svg>
        Generate Carousel
      `;
    }
  };

  function showPreview(videoUrl) {
    const previewArea = document.getElementById('preview-area');
    if (!previewArea) return;

    previewArea.className = 'mt-6 block';
    previewArea.innerHTML = `
      <div class="border border-white/10 rounded-xl p-4 bg-black/20">
        <h3 class="text-lg font-bold text-white mb-4">Generated Carousel</h3>
        <div class="aspect-[9/16] max-w-sm mx-auto bg-black rounded-lg overflow-hidden mb-4">
          <video controls class="w-full h-full" poster="">
            <source src="${videoUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
        <div class="flex gap-3">
          <a href="${videoUrl}" download="tiktok-carousel.mp4" class="flex-1 bg-primary hover:bg-primary/80 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </a>
          <button class="px-4 py-3 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-all">
            Share
          </button>
        </div>
      </div>
    `;
  }

  // Initialize controls
  updateImagePreview();
  updateControls();

  return container;
}