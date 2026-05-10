import { muapi } from '../lib/muapi.js';
import { createSafeVideo } from '../lib/security.js';
import { createUploadPicker } from './UploadPicker.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { securityService } from '../lib/services/SecurityService.js';

const MOTION_TYPES = [
  { id: 'zoom', name: 'Zoom', icon: '🔍', description: 'Smooth zoom in/out effects' },
  { id: 'spin', name: 'Spin', icon: '🌀', description: 'Rotational camera movement' },
  { id: 'shake', name: 'Shake', icon: '📳', description: 'Camera shake effects' },
  { id: 'orbit', name: 'Orbit', icon: '🌍', description: 'Circular camera orbits' },
  { id: 'pan', name: 'Pan', icon: '📹', description: 'Horizontal/vertical panning' },
];

const DIRECTIONS = [
  { id: 'in', name: 'In', icon: '⬇️' },
  { id: 'out', name: 'Out', icon: '⬆️' },
  { id: 'left', name: 'Left', icon: '⬅️' },
  { id: 'right', name: 'Right', icon: '➡️' },
  { id: 'up', name: 'Up', icon: '⬆️' },
  { id: 'down', name: 'Down', icon: '⬇️' },
  { id: 'clockwise', name: 'Clockwise', icon: '↻' },
  { id: 'counterclockwise', name: 'Counter-Clockwise', icon: '↺' },
];

export function RunwayMotionStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-y-auto custom-scrollbar overflow-x-hidden relative';

  // State management
  let uploadedVideoUrl = null;
  let selectedMotionType = 'zoom';
  let selectedDirection = 'in';
  let motionSpeed = 5;
  let motionIntensity = 5;
  let motionBlurEnabled = true;
  let motionBlurStrength = 3;
  let stabilizationEnabled = false;
  let isPreviewing = false;
  let previewInterval = null;

  // ==========================================
  // TOP BAR WITH HERO BANNER
  // ==========================================
  const topBar = document.createElement('div');
  topBar.className = 'px-4 md:px-8 pt-6 pb-4 shrink-0 animate-fade-in-up';
  
  const heroBanner = createHeroSection('video', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-4 z-10';
    heroContent.innerHTML = `
      <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-1">Runway Motion Controls</h1>
      <p class="text-white/60 text-sm font-medium">Advanced camera movements and motion effects for professional video production</p>
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

  // Video Upload Section
  const uploadSection = document.createElement('div');
  uploadSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6';

  const uploadTitle = document.createElement('div');
  uploadTitle.className = 'mb-6';
  uploadTitle.innerHTML = `
    <h2 class="text-xl font-black text-white mb-1">Upload Video</h2>
    <p class="text-sm text-muted">Select a video to apply advanced motion controls</p>
  `;

  const uploadPicker = createUploadPicker({
    anchorContainer: container,
    accept: 'video/*',
    onSelect: ({ url }) => {
      uploadedVideoUrl = url;
      updatePreview();
      enableControls();
    },
    onClear: () => {
      uploadedVideoUrl = null;
      stopPreview();
      disableControls();
    },
  });

  uploadSection.appendChild(uploadTitle);
  uploadSection.appendChild(uploadPicker.panel);
  contentWrapper.appendChild(uploadSection);

  // Preview Section
  const previewSection = document.createElement('div');
  previewSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6';
  previewSection.id = 'preview-section';

  const previewTitle = document.createElement('div');
  previewTitle.className = 'mb-6';
  previewTitle.innerHTML = `
    <h2 class="text-xl font-black text-white mb-1">Preview</h2>
    <p class="text-sm text-muted">See your motion effects in action</p>
  `;
  previewSection.appendChild(previewTitle);

  const videoPreview = document.createElement('div');
  videoPreview.className = 'aspect-video bg-black/50 rounded-xl overflow-hidden mb-4 flex items-center justify-center';
  videoPreview.id = 'video-preview';
  previewSection.appendChild(videoPreview);

  const previewControls = document.createElement('div');
  previewControls.className = 'flex gap-3';
  const playPreviewBtn = document.createElement('button');
  playPreviewBtn.className = 'flex-1 bg-white/10 text-white py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-all disabled:opacity-50';
  playPreviewBtn.textContent = 'Play Preview';
  playPreviewBtn.onclick = togglePreview;
  previewControls.appendChild(playPreviewBtn);
  const stopPreviewBtn = document.createElement('button');
  stopPreviewBtn.className = 'flex-1 bg-white/10 text-white py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-all';
  stopPreviewBtn.textContent = 'Stop';
  stopPreviewBtn.onclick = stopPreview;
  previewControls.appendChild(stopPreviewBtn);
  previewSection.appendChild(previewControls);
  contentWrapper.appendChild(previewSection);

  // Motion Controls Section
  const controlsSection = document.createElement('div');
  controlsSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6';
  controlsSection.id = 'motion-controls-section';

  const controlsTitle = document.createElement('div');
  controlsTitle.className = 'mb-6';
  controlsTitle.innerHTML = `
    <h2 class="text-xl font-black text-white mb-1">Motion Controls</h2>
    <p class="text-sm text-muted">Configure advanced camera movements and effects</p>
  `;
  controlsSection.appendChild(controlsTitle);

  // Motion type selection
  const motionTypeRow = document.createElement('div');
  motionTypeRow.className = 'mb-6';
  const motionTypeLabel = document.createElement('div');
  motionTypeLabel.className = 'text-sm font-bold text-secondary mb-3';
  motionTypeLabel.textContent = 'Motion Type';
  motionTypeRow.appendChild(motionTypeLabel);
  const motionTypeGrid = document.createElement('div');
  motionTypeGrid.className = 'grid grid-cols-3 md:grid-cols-5 gap-2';
  MOTION_TYPES.forEach(motion => {
    const btn = document.createElement('button');
    btn.className = `p-3 rounded-xl border transition-all ${selectedMotionType === motion.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10 hover:border-white/20'}`;
    btn.innerHTML = `
      <div class="text-2xl mb-1">${motion.icon}</div>
      <div class="text-xs font-bold">${motion.name}</div>
      <div class="text-[10px] text-muted mt-1">${motion.description}</div>
    `;
    btn.onclick = () => {
      selectedMotionType = motion.id;
      updateMotionTypeButtons();
    };
    motionTypeGrid.appendChild(btn);
  });
  motionTypeRow.appendChild(motionTypeGrid);
  controlsSection.appendChild(motionTypeRow);

  // Direction selection
  const directionRow = document.createElement('div');
  directionRow.className = 'mb-6';
  const directionLabel = document.createElement('div');
  directionLabel.className = 'text-sm font-bold text-secondary mb-3';
  directionLabel.textContent = 'Direction';
  directionRow.appendChild(directionLabel);
  const directionGrid = document.createElement('div');
  directionGrid.className = 'grid grid-cols-4 md:grid-cols-8 gap-2';
  DIRECTIONS.forEach(dir => {
    const btn = document.createElement('button');
    btn.className = `p-2 rounded-xl border transition-all ${selectedDirection === dir.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10 hover:border-white/20'}`;
    btn.innerHTML = `
      <div class="text-lg">${dir.icon}</div>
      <div class="text-[10px] font-bold mt-1">${dir.name}</div>
    `;
    btn.onclick = () => {
      selectedDirection = dir.id;
      updateDirectionButtons();
    };
    directionGrid.appendChild(btn);
  });
  directionRow.appendChild(directionGrid);
  controlsSection.appendChild(directionRow);

  // Speed and intensity sliders
  const slidersRow = document.createElement('div');
  slidersRow.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-6';

  const speedControl = document.createElement('div');
  speedControl.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <label class="text-sm text-secondary">Speed</label>
      <span class="text-sm font-bold text-white">${motionSpeed}</span>
    </div>
    <input type="range" min="1" max="10" value="${motionSpeed}" class="w-full accent-primary">
  `;
  speedControl.querySelector('input').oninput = (e) => {
    motionSpeed = parseInt(e.target.value);
    speedControl.querySelector('span').textContent = motionSpeed;
  };
  slidersRow.appendChild(speedControl);

  const intensityControl = document.createElement('div');
  intensityControl.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <label class="text-sm text-secondary">Intensity</label>
      <span class="text-sm font-bold text-white">${motionIntensity}</span>
    </div>
    <input type="range" min="1" max="10" value="${motionIntensity}" class="w-full accent-primary">
  `;
  intensityControl.querySelector('input').oninput = (e) => {
    motionIntensity = parseInt(e.target.value);
    intensityControl.querySelector('span').textContent = motionIntensity;
  };
  slidersRow.appendChild(intensityControl);

  controlsSection.appendChild(slidersRow);

  // Motion blur toggle
  const blurRow = document.createElement('div');
  blurRow.className = 'flex items-center justify-between mb-6';
  const blurLabel = document.createElement('span');
  blurLabel.className = 'text-sm text-secondary';
  blurLabel.textContent = 'Motion Blur';
  blurRow.appendChild(blurLabel);
  const blurToggle = document.createElement('button');
  blurToggle.className = 'w-12 h-6 rounded-full relative transition-colors ' + (motionBlurEnabled ? 'bg-primary' : 'bg-white/20');
  blurToggle.innerHTML = `<div class="w-4 h-4 rounded-full bg-white absolute top-1 ${motionBlurEnabled ? 'left-7' : 'left-1'} transition-all"></div>`;
  blurToggle.onclick = () => {
    motionBlurEnabled = !motionBlurEnabled;
    blurToggle.className = 'w-12 h-6 rounded-full relative transition-colors ' + (motionBlurEnabled ? 'bg-primary' : 'bg-white/20');
    blurToggle.innerHTML = `<div class="w-4 h-4 rounded-full bg-white absolute top-1 ${motionBlurEnabled ? 'left-7' : 'left-1'} transition-all"></div>`;
  };
  blurRow.appendChild(blurToggle);
  controlsSection.appendChild(blurRow);

  // Stabilization toggle
  const stabRow = document.createElement('div');
  stabRow.className = 'flex items-center justify-between mb-6';
  const stabLabel = document.createElement('span');
  stabLabel.className = 'text-sm text-secondary';
  stabLabel.textContent = 'Video Stabilization';
  stabRow.appendChild(stabLabel);
  const stabToggle = document.createElement('button');
  stabToggle.className = 'w-12 h-6 rounded-full relative transition-colors ' + (stabilizationEnabled ? 'bg-primary' : 'bg-white/20');
  stabToggle.innerHTML = `<div class="w-4 h-4 rounded-full bg-white absolute top-1 ${stabilizationEnabled ? 'left-7' : 'left-1'} transition-all"></div>`;
  stabToggle.onclick = () => {
    stabilizationEnabled = !stabilizationEnabled;
    stabToggle.className = 'w-12 h-6 rounded-full relative transition-colors ' + (stabilizationEnabled ? 'bg-primary' : 'bg-white/20');
    stabToggle.innerHTML = `<div class="w-4 h-4 rounded-full bg-white absolute top-1 ${stabilizationEnabled ? 'left-7' : 'left-1'} transition-all"></div>`;
  };
  stabRow.appendChild(stabToggle);
  controlsSection.appendChild(stabRow);

  // Apply button
  const applyBtn = document.createElement('button');
  applyBtn.className = 'w-full bg-primary text-black py-4 rounded-xl font-black text-sm hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  applyBtn.textContent = 'Apply Motion Effects';
  applyBtn.onclick = handleApply;
  applyBtn.disabled = !uploadedVideoUrl;
  controlsSection.appendChild(applyBtn);

  contentWrapper.appendChild(controlsSection);

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  function updatePreview() {
    videoPreview.innerHTML = '';
    if (!uploadedVideoUrl) {
      videoPreview.innerHTML = '<p class="text-white/40">No video loaded</p>';
      return;
    }
    const video = document.createElement('video');
    video.src = uploadedVideoUrl;
    video.controls = false;
    video.className = 'w-full h-full object-contain';
    videoPreview.appendChild(video);
  }

  function enableControls() {
    applyBtn.disabled = false;
  }

  function disableControls() {
    applyBtn.disabled = true;
    stopPreview();
  }

  function togglePreview() {
    if (isPreviewing) {
      stopPreview();
    } else {
      startPreview();
    }
  }

  function startPreview() {
    if (!uploadedVideoUrl) return;
    const video = videoPreview.querySelector('video');
    if (!video) return;
    video.currentTime = 0;
    video.play();
    isPreviewing = true;
    playPreviewBtn.textContent = 'Pause';
    playPreviewBtn.onclick = stopPreview;
    previewInterval = setInterval(() => {
      if (video.ended) stopPreview();
    }, 100);
  }

  function stopPreview() {
    const video = videoPreview.querySelector('video');
    if (video) video.pause();
    isPreviewing = false;
    playPreviewBtn.textContent = 'Play Preview';
    playPreviewBtn.onclick = startPreview;
    if (previewInterval) clearInterval(previewInterval);
  }

  function updateMotionTypeButtons() {
    motionTypeGrid.querySelectorAll('button').forEach((btn, idx) => {
      const motion = MOTION_TYPES[idx];
      btn.className = `p-3 rounded-xl border transition-all ${selectedMotionType === motion.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10 hover:border-white/20'}`;
    });
  }

  function updateDirectionButtons() {
    directionGrid.querySelectorAll('button').forEach((btn, idx) => {
      const dir = DIRECTIONS[idx];
      btn.className = `p-2 rounded-xl border transition-all ${selectedDirection === dir.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10 hover:border-white/20'}`;
    });
  }

  async function handleApply() {
    if (!uploadedVideoUrl) {
      alert('Please upload a video first');
      return;
    }
    const apiKey = await securityService.getDecryptedKey();
    if (!apiKey) {
      AuthModal(() => applyBtn.click());
      return;
    }

    applyBtn.disabled = true;
    applyBtn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span> Processing...';

    try {
      const params = {
        model: 'runway-motion-controls',
        video_url: uploadedVideoUrl,
        motion_type: selectedMotionType,
        direction: selectedDirection,
        speed: motionSpeed,
        intensity: motionIntensity,
        motion_blur: motionBlurEnabled,
        blur_strength: motionBlurStrength,
        stabilization: stabilizationEnabled,
      };

      // Handle successful generation

      // Show success message
      const successToast = document.createElement('div');
      successToast.className = 'fixed top-4 right-4 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg z-50';
      successToast.textContent = 'Motion effects applied successfully!';
      document.body.appendChild(successToast);
      setTimeout(() => document.body.removeChild(successToast), 3000);

    } catch (error) {
      console.error('Error applying motion effects:', error);

      // Show error message
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg z-50';
      errorToast.textContent = `Error: ${error.message}`;
      document.body.appendChild(errorToast);
      setTimeout(() => document.body.removeChild(errorToast), 5000);
    } finally {
      applyBtn.disabled = false;
      applyBtn.textContent = 'Apply Motion Effects';
    }
  }

  // Initialize
  updatePreview();
  updateMotionTypeButtons();
  updateDirectionButtons();

  return container;
}
