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
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-y-auto custom-scrollbar overflow-x-hidden relative';

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
  // TOP BAR WITH HERO BANNER
  // ==========================================
  const topBar = document.createElement('div');
  topBar.className = 'px-4 md:px-8 pt-6 pb-4 shrink-0 animate-fade-in-up';
  
  const heroBanner = createHeroSection('video', 'h-32 md:h-44 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-4 z-10';
    heroContent.innerHTML = `
      <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-1">TikTok Carousel Studio</h1>
      <p class="text-white/60 text-sm font-medium">Create engaging multi-image carousels optimized for TikTok and social media</p>
    `;
    heroBanner.appendChild(heroContent);
    topBar.appendChild(heroBanner);
  }
  
  container.appendChild(topBar);

  // ==========================================
  // MAIN CONTENT AREA
  // ==========================================
  const contentArea = document.createElement('div');
  contentArea.className = 'flex-1 overflow-y-auto px-4 md:px-8 pb-8';
  container.appendChild(contentArea);

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'w-full max-w-6xl mx-auto relative z-40 animate-fade-in-up';
  contentWrapper.style.animationDelay = '0.1s';
  contentArea.appendChild(contentWrapper);

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
  previewSection.appendChild(previewTitle);

  const previewGrid = document.createElement('div');
  previewGrid.className = 'grid grid-cols-2 md:grid-cols-4 gap-4';
  previewSection.appendChild(previewGrid);

  contentWrapper.appendChild(previewSection);

  // Layout & Transition Section
  const settingsSection = document.createElement('div');
  settingsSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6';

  const settingsTitle = document.createElement('div');
  settingsTitle.className = 'mb-6';
  settingsTitle.innerHTML = `
    <h2 class="text-xl font-black text-white mb-1">Carousel Settings</h2>
    <p class="text-sm text-muted">Customize the look and feel of your carousel</p>
  `;
  settingsSection.appendChild(settingsTitle);

  const layoutRow = document.createElement('div');
  layoutRow.className = 'mb-6';
  const layoutLabel = document.createElement('div');
  layoutLabel.className = 'text-sm font-bold text-secondary mb-3';
  layoutLabel.textContent = 'Layout Type';
  layoutRow.appendChild(layoutLabel);
  const layoutGrid = document.createElement('div');
  layoutGrid.className = 'grid grid-cols-3 gap-2';
  LAYOUT_TYPES.forEach(layout => {
    const btn = document.createElement('button');
    btn.className = `p-3 rounded-xl border transition-all ${selectedLayout === layout.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10 hover:border-white/20'}`;
    btn.innerHTML = `
      <div class="text-xl mb-1">${layout.icon}</div>
      <div class="text-xs font-bold">${layout.name}</div>
      <div class="text-[10px] text-muted mt-1">${layout.description}</div>
    `;
    btn.onclick = () => {
      selectedLayout = layout.id;
      updateLayoutButtons();
    };
    layoutGrid.appendChild(btn);
  });
  layoutRow.appendChild(layoutGrid);
  settingsSection.appendChild(layoutRow);

  const transitionRow = document.createElement('div');
  transitionRow.className = 'mb-6';
  const transitionLabel = document.createElement('div');
  transitionLabel.className = 'text-sm font-bold text-secondary mb-3';
  transitionLabel.textContent = 'Transition Effect';
  transitionRow.appendChild(transitionLabel);
  const transitionGrid = document.createElement('div');
  transitionGrid.className = 'grid grid-cols-3 gap-2';
  TRANSITION_TYPES.forEach(trans => {
    const btn = document.createElement('button');
    btn.className = `p-3 rounded-xl border transition-all ${selectedTransition === trans.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10 hover:border-white/20'}`;
    btn.innerHTML = `
      <div class="text-xl mb-1">${trans.icon}</div>
      <div class="text-xs font-bold">${trans.name}</div>
      <div class="text-[10px] text-muted mt-1">${trans.description}</div>
    `;
    btn.onclick = () => {
      selectedTransition = trans.id;
      updateTransitionButtons();
    };
    transitionGrid.appendChild(btn);
  });
  transitionRow.appendChild(transitionGrid);
  settingsSection.appendChild(transitionRow);

  const durationRow = document.createElement('div');
  durationRow.className = 'flex items-center justify-between mb-6';
  const durationLabel = document.createElement('div');
  durationLabel.className = 'text-sm font-bold text-secondary';
  durationLabel.textContent = 'Slide Duration (seconds)';
  durationRow.appendChild(durationLabel);
  const durationInput = document.createElement('input');
  durationInput.type = 'range';
  durationInput.min = '1';
  durationInput.max = '10';
  durationInput.step = '0.5';
  durationInput.value = totalDuration;
  durationInput.className = 'flex-1 mx-4 accent-primary';
  durationInput.oninput = (e) => {
    totalDuration = parseFloat(e.target.value);
    durationDisplay.textContent = `${totalDuration}s`;
  };
  durationRow.appendChild(durationInput);
  const durationDisplay = document.createElement('div');
  durationDisplay.className = 'text-sm font-bold text-white w-12 text-right';
  durationDisplay.textContent = `${totalDuration}s`;
  durationRow.appendChild(durationDisplay);
  settingsSection.appendChild(durationRow);

  // Background music section
  const musicRow = document.createElement('div');
  musicRow.className = 'mb-6';
  const musicLabel = document.createElement('div');
  musicLabel.className = 'text-sm font-bold text-secondary mb-3';
  musicLabel.textContent = 'Background Music (optional)';
  musicRow.appendChild(musicLabel);
  const musicPicker = createUploadPicker({
    anchorContainer: container,
    accept: 'audio/*',
    onSelect: ({ url }) => { backgroundMusicUrl = url; },
    onClear: () => { backgroundMusicUrl = null; },
  });
  musicRow.appendChild(musicPicker.trigger);
  settingsSection.appendChild(musicRow);
  contentArea.appendChild(musicPicker.panel);

  // Generate button
  const generateBtn = document.createElement('button');
  generateBtn.className = 'w-full bg-primary text-black py-4 rounded-xl font-black text-sm hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  generateBtn.textContent = 'Generate TikTok Carousel';
  generateBtn.onclick = handleGeneration;
  generateBtn.disabled = uploadedImages.length === 0;
  settingsSection.appendChild(generateBtn);

  contentWrapper.appendChild(settingsSection);

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  function updateImagePreview() {
    previewGrid.innerHTML = '';
    uploadedImages.forEach((url, index) => {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'relative aspect-square group cursor-move';
      imgWrapper.draggable = true;
      imgWrapper.innerHTML = `
        <img src="${url}" class="w-full h-full object-cover rounded-xl">
        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
          <span class="text-white text-xs font-bold">Drag to reorder</span>
        </div>
        <button class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-index="${index}">×</button>
      `;
      
      // Delete button
      imgWrapper.querySelector('button').onclick = () => {
        uploadedImages.splice(index, 1);
        slideTimings = [];
        updateImagePreview();
        updateControls();
      };

      // Drag and drop reordering
      imgWrapper.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', index.toString());
        imgWrapper.classList.add('opacity-50');
      };
      imgWrapper.ondragend = () => {
        imgWrapper.classList.remove('opacity-50');
      };
      imgWrapper.ondragover = (e) => {
        e.preventDefault();
        imgWrapper.classList.add('border-2', 'border-primary');
      };
      imgWrapper.ondragleave = () => {
        imgWrapper.classList.remove('border-2', 'border-primary');
      };
      imgWrapper.ondrop = (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = index;
        if (fromIndex !== toIndex) {
          const [moved] = uploadedImages.splice(fromIndex, 1);
          uploadedImages.splice(toIndex, 0, moved);
          updateImagePreview();
          updateControls();
        }
        imgWrapper.classList.remove('border-2', 'border-primary');
      };

      previewGrid.appendChild(imgWrapper);
    });
    updateControls();
  }

  function updateControls() {
    generateBtn.disabled = uploadedImages.length === 0;
  }

  function updateLayoutButtons() {
    layoutGrid.querySelectorAll('button').forEach((btn, idx) => {
      const layout = LAYOUT_TYPES[idx];
      btn.className = `p-3 rounded-xl border transition-all ${selectedLayout === layout.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10 hover:border-white/20'}`;
    });
  }

  function updateTransitionButtons() {
    transitionGrid.querySelectorAll('button').forEach((btn, idx) => {
      const trans = TRANSITION_TYPES[idx];
      btn.className = `p-3 rounded-xl border transition-all ${selectedTransition === trans.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10 hover:border-white/20'}`;
    });
  }

  async function handleGeneration() {
    if (uploadedImages.length === 0) return;
    isGenerating = true;
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    try {
      const result = await generateTikTokCarousel({
        images: uploadedImages,
        layout: selectedLayout,
        transition: selectedTransition,
        duration: totalDuration,
        backgroundMusic: backgroundMusicUrl,
      });

      if (result?.url) {
        // Show result (could open in new tab or preview)
        window.open(result.url, '_blank');
      }
    } catch (error) {
      alert(`Error generating carousel: ${error.message}`);
    } finally {
      isGenerating = false;
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate TikTok Carousel';
    }
  }

  // Initialize
  updateControls();

  return container;
}
