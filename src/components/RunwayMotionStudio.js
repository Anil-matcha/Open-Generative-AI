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
  container.className = 'w-full h-full flex flex-col items-center justify-start bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden';

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
  // 1. HERO SECTION
  // ==========================================
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-6 animate-fade-in-up transition-all duration-700 w-full max-w-5xl';

  const heroBanner = createHeroSection('video', 'h-32 md:h-44 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-1">Runway Motion Controls</h1>
      <p class="text-white/60 text-sm font-medium">Advanced camera movements and motion effects for professional video production</p>
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

  // Motion Type Selector
  const motionTypeGrid = document.createElement('div');
  motionTypeGrid.className = 'grid grid-cols-2 md:grid-cols-5 gap-3 mb-6';

  MOTION_TYPES.forEach(type => {
    const btn = document.createElement('button');
    btn.className = `motion-type-btn p-4 border border-white/10 rounded-xl hover:border-primary/30 transition-all text-center ${
      selectedMotionType === type.id ? 'border-primary bg-primary/10' : 'bg-white/[0.03]'
    }`;
    btn.dataset.type = type.id;
    btn.innerHTML = `
      <div class="text-2xl mb-2">${type.icon}</div>
      <div class="text-sm font-bold text-white mb-1">${type.name}</div>
      <div class="text-xs text-muted">${type.description}</div>
    `;

    btn.onclick = () => {
      document.querySelectorAll('.motion-type-btn').forEach(b => {
        b.classList.remove('border-primary', 'bg-primary/10');
        b.classList.add('border-white/10', 'bg-white/[0.03]');
      });
      btn.classList.remove('border-white/10', 'bg-white/[0.03]');
      btn.classList.add('border-primary', 'bg-primary/10');
      selectedMotionType = type.id;
      updateDirectionOptions();
    };

    motionTypeGrid.appendChild(btn);
  });

  // Direction Selector
  const directionSection = document.createElement('div');
  directionSection.className = 'mb-6';
  directionSection.innerHTML = `
    <label class="text-sm font-bold text-secondary uppercase tracking-wider mb-3 block">Direction</label>
    <div id="direction-grid" class="grid grid-cols-4 md:grid-cols-8 gap-2"></div>
  `;

  // Parameters Section
  const parametersSection = document.createElement('div');
  parametersSection.className = 'grid md:grid-cols-2 gap-6 mb-6';

  // Speed Control
  const speedControl = document.createElement('div');
  speedControl.className = 'flex flex-col gap-3';
  speedControl.innerHTML = `
    <div class="flex items-center justify-between">
      <label class="text-sm font-bold text-secondary uppercase tracking-wider">Speed</label>
      <span id="speed-value" class="text-sm font-bold text-primary">${motionSpeed}</span>
    </div>
    <input type="range" id="speed-slider" min="1" max="10" step="1" value="${motionSpeed}"
      class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary">
    <div class="flex justify-between text-xs text-muted">
      <span>Slow</span>
      <span>Fast</span>
    </div>
  `;

  // Intensity Control
  const intensityControl = document.createElement('div');
  intensityControl.className = 'flex flex-col gap-3';
  intensityControl.innerHTML = `
    <div class="flex items-center justify-between">
      <label class="text-sm font-bold text-secondary uppercase tracking-wider">Intensity</label>
      <span id="intensity-value" class="text-sm font-bold text-primary">${motionIntensity}</span>
    </div>
    <input type="range" id="intensity-slider" min="1" max="10" step="1" value="${motionIntensity}"
      class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary">
    <div class="flex justify-between text-xs text-muted">
      <span>Subtle</span>
      <span>Extreme</span>
    </div>
  `;

  parametersSection.appendChild(speedControl);
  parametersSection.appendChild(intensityControl);

  // Effects Section
  const effectsSection = document.createElement('div');
  effectsSection.className = 'grid md:grid-cols-2 gap-6 mb-6';

  // Motion Blur
  const blurSection = document.createElement('div');
  blurSection.className = 'flex flex-col gap-3';
  blurSection.innerHTML = `
    <div class="flex items-center justify-between">
      <label class="text-sm font-bold text-secondary uppercase tracking-wider">Motion Blur</label>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id="blur-toggle" class="sr-only peer" ${motionBlurEnabled ? 'checked' : ''}>
        <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-xs text-muted">Strength</span>
      <span id="blur-strength-value" class="text-sm font-bold text-primary">${motionBlurStrength}</span>
    </div>
    <input type="range" id="blur-strength-slider" min="1" max="10" step="1" value="${motionBlurStrength}"
      class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" ${motionBlurEnabled ? '' : 'disabled'}>
  `;

  // Stabilization
  const stabilizationSection = document.createElement('div');
  stabilizationSection.className = 'flex flex-col gap-3';
  stabilizationSection.innerHTML = `
    <div class="flex items-center justify-between">
      <label class="text-sm font-bold text-secondary uppercase tracking-wider">Stabilization</label>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id="stabilization-toggle" class="sr-only peer" ${stabilizationEnabled ? 'checked' : ''}>
        <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
    <p class="text-xs text-muted">Reduces unwanted camera shake and stabilizes motion</p>
  `;

  effectsSection.appendChild(blurSection);
  effectsSection.appendChild(stabilizationSection);

  controlsSection.appendChild(controlsTitle);
  controlsSection.appendChild(motionTypeGrid);
  controlsSection.appendChild(directionSection);
  controlsSection.appendChild(parametersSection);
  controlsSection.appendChild(effectsSection);
  contentWrapper.appendChild(controlsSection);

  // Preview and Generate Section
  const previewSection = document.createElement('div');
  previewSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6';

  const previewTitle = document.createElement('div');
  previewTitle.className = 'flex items-center justify-between mb-6';
  previewTitle.innerHTML = `
    <div>
      <h2 class="text-xl font-black text-white mb-1">Motion Preview</h2>
      <p class="text-sm text-muted">See your motion effects in real-time</p>
    </div>
    <button id="preview-btn" class="bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>
      <span class="text-sm font-bold">Start Preview</span>
    </button>
  `;

  const previewContainer = document.createElement('div');
  previewContainer.className = 'relative bg-black/50 rounded-xl overflow-hidden mb-4';
  previewContainer.innerHTML = `
    <div id="preview-video-container" class="aspect-video flex items-center justify-center">
      <div class="text-center text-muted">
        <div class="text-4xl mb-2">🎬</div>
        <p class="text-sm">Upload a video to start previewing motion effects</p>
      </div>
    </div>
    <div id="motion-path-overlay" class="absolute inset-0 pointer-events-none opacity-30"></div>
  `;

  const generateBtn = document.createElement('button');
  generateBtn.className = 'w-full bg-primary text-black px-6 py-3 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<span class="text-sm font-bold">Apply Motion Effects</span>';

  previewSection.appendChild(previewTitle);
  previewSection.appendChild(previewContainer);
  previewSection.appendChild(generateBtn);
  contentWrapper.appendChild(previewSection);

  container.appendChild(contentWrapper);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  function updateDirectionOptions() {
    const directionGrid = container.querySelector('#direction-grid');
    directionGrid.innerHTML = '';

    const relevantDirections = {
      zoom: ['in', 'out'],
      spin: ['clockwise', 'counterclockwise'],
      shake: [], // No direction for shake
      orbit: ['clockwise', 'counterclockwise'],
      pan: ['left', 'right', 'up', 'down'],
    };

    const directions = relevantDirections[selectedMotionType] || [];

    if (directions.length === 0) {
      directionGrid.innerHTML = '<p class="text-xs text-muted col-span-full">No direction options for this motion type</p>';
      selectedDirection = 'none';
      return;
    }

    DIRECTIONS.filter(d => directions.includes(d.id)).forEach(dir => {
      const btn = document.createElement('button');
      btn.className = `direction-btn p-3 border rounded-lg hover:border-primary/30 transition-all text-center ${
        selectedDirection === dir.id ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/[0.03]'
      }`;
      btn.dataset.direction = dir.id;
      btn.innerHTML = `
        <div class="text-lg mb-1">${dir.icon}</div>
        <div class="text-xs text-muted">${dir.name}</div>
      `;

      btn.onclick = () => {
        document.querySelectorAll('.direction-btn').forEach(b => {
          b.classList.remove('border-primary', 'bg-primary/10');
          b.classList.add('border-white/10', 'bg-white/[0.03]');
        });
        btn.classList.remove('border-white/10', 'bg-white/[0.03]');
        btn.classList.add('border-primary', 'bg-primary/10');
        selectedDirection = dir.id;
      };

      directionGrid.appendChild(btn);
    });

    // Set default direction if current one is not available
    if (!directions.includes(selectedDirection)) {
      selectedDirection = directions[0] || 'none';
      if (directions.length > 0) {
        directionGrid.querySelector('.direction-btn').click();
      }
    }
  }

  function updatePreview() {
    if (!uploadedVideoUrl) return;

    const previewContainer = container.querySelector('#preview-video-container');
    previewContainer.innerHTML = `
      <video id="preview-video" class="w-full h-full object-contain" controls>
        <source src="${uploadedVideoUrl}" type="video/mp4">
      </video>
    `;

    // Add motion path visualization overlay
    updateMotionPathVisualization();
  }

  function updateMotionPathVisualization() {
    const overlay = container.querySelector('#motion-path-overlay');
    overlay.innerHTML = '';

    // Simple motion path visualization based on selected motion type
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 400 225');
    svg.className = 'absolute inset-0';

    let path = '';
    switch (selectedMotionType) {
      case 'zoom':
        path = selectedDirection === 'in'
          ? 'M200 112.5 L180 92.5 L220 92.5 Z'
          : 'M200 112.5 L220 132.5 L180 132.5 Z';
        break;
      case 'pan':
        path = selectedDirection === 'left'
          ? 'M50 112.5 L350 112.5 M330 92.5 L350 112.5 L330 132.5'
          : 'M350 112.5 L50 112.5 M70 92.5 L50 112.5 L70 132.5';
        break;
      case 'orbit':
        path = 'M200 50 A62.5 62.5 0 1 1 199.9 50 M262.5 112.5 L275 100 L275 125 Z';
        break;
      case 'spin':
        path = 'M200 50 A62.5 62.5 0 1 1 199.9 50 M262.5 112.5 L275 100 L275 125 Z';
        break;
      default:
        path = 'M200 112.5 L200 112.5'; // Dot for static/shake
    }

    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', path);
    pathElement.setAttribute('stroke', '#3b82f6');
    pathElement.setAttribute('stroke-width', '3');
    pathElement.setAttribute('fill', 'none');
    pathElement.setAttribute('stroke-dasharray', '10,5');

    svg.appendChild(pathElement);
    overlay.appendChild(svg);
  }

  function startPreview() {
    if (!uploadedVideoUrl || isPreviewing) return;

    isPreviewing = true;
    const previewBtn = container.querySelector('#preview-btn');
    previewBtn.innerHTML = '<span class="text-sm font-bold">Stop Preview</span>';
    previewBtn.classList.add('bg-red-500/10', 'border-red-500/30', 'text-red-400');
    previewBtn.classList.remove('bg-primary/10', 'border-primary/30', 'text-primary');

    const video = container.querySelector('#preview-video');
    if (video) {
      video.currentTime = 0;
      video.play();

      // Simulate motion preview with CSS transforms
      applyMotionEffect(video);
    }
  }

  function stopPreview() {
    isPreviewing = false;
    const previewBtn = container.querySelector('#preview-btn');
    previewBtn.innerHTML = '<span class="text-sm font-bold">Start Preview</span>';
    previewBtn.classList.remove('bg-red-500/10', 'border-red-500/30', 'text-red-400');
    previewBtn.classList.add('bg-primary/10', 'border-primary/30', 'text-primary');

    const video = container.querySelector('#preview-video');
    if (video) {
      video.pause();
      video.style.transform = '';
      video.style.filter = '';
    }

    if (previewInterval) {
      clearInterval(previewInterval);
      previewInterval = null;
    }
  }

  function applyMotionEffect(video) {
    let frame = 0;
    const maxFrames = 60; // 1 second at 60fps

    previewInterval = setInterval(() => {
      if (!isPreviewing || frame >= maxFrames) {
        clearInterval(previewInterval);
        previewInterval = null;
        return;
      }

      const progress = frame / maxFrames;
      let transform = '';
      let filter = '';

      switch (selectedMotionType) {
        case 'zoom':
          const scale = selectedDirection === 'in'
            ? 1 + (progress * motionIntensity * 0.1)
            : 1 + ((1 - progress) * motionIntensity * 0.1);
          transform = `scale(${scale})`;
          break;

        case 'pan':
          const translateX = selectedDirection === 'left'
            ? -progress * motionIntensity * 10
            : selectedDirection === 'right'
              ? progress * motionIntensity * 10
              : 0;
          const translateY = selectedDirection === 'up'
            ? -progress * motionIntensity * 10
            : selectedDirection === 'down'
              ? progress * motionIntensity * 10
              : 0;
          transform = `translate(${translateX}px, ${translateY}px)`;
          break;

        case 'spin':
          const rotation = selectedDirection === 'clockwise'
            ? progress * motionIntensity * 36
            : -progress * motionIntensity * 36;
          transform = `rotate(${rotation}deg)`;
          break;

        case 'shake':
          const shakeX = (Math.random() - 0.5) * motionIntensity * 5;
          const shakeY = (Math.random() - 0.5) * motionIntensity * 5;
          transform = `translate(${shakeX}px, ${shakeY}px)`;
          break;

        case 'orbit':
          const angle = progress * motionIntensity * 36;
          const radius = 50;
          const orbitX = Math.cos(angle * Math.PI / 180) * radius;
          const orbitY = Math.sin(angle * Math.PI / 180) * radius;
          transform = `translate(${orbitX}px, ${orbitY}px)`;
          break;
      }

      if (motionBlurEnabled) {
        filter = `blur(${motionBlurStrength * 0.5}px)`;
      }

      video.style.transform = transform;
      video.style.filter = filter;
      video.style.transition = 'none';

      frame++;
    }, 1000 / 60); // 60fps
  }

  function enableControls() {
    const controlsSection = container.querySelector('#motion-controls-section');
    controlsSection.style.opacity = '1';
    controlsSection.style.pointerEvents = 'auto';

    const previewBtn = container.querySelector('#preview-btn');
    const generateBtn = container.querySelector('#preview-section button:last-child');

    previewBtn.disabled = false;
    generateBtn.disabled = false;
  }

  function disableControls() {
    const controlsSection = container.querySelector('#motion-controls-section');
    controlsSection.style.opacity = '0.5';
    controlsSection.style.pointerEvents = 'none';

    const previewBtn = container.querySelector('#preview-btn');
    const generateBtn = container.querySelector('#preview-section button:last-child');

    previewBtn.disabled = true;
    generateBtn.disabled = true;
  }

  // Initialize direction options
  updateDirectionOptions();

  // Event listeners
  container.querySelector('#speed-slider').oninput = (e) => {
    motionSpeed = parseInt(e.target.value);
    container.querySelector('#speed-value').textContent = motionSpeed;
  };

  container.querySelector('#intensity-slider').oninput = (e) => {
    motionIntensity = parseInt(e.target.value);
    container.querySelector('#intensity-value').textContent = motionIntensity;
    updateMotionPathVisualization();
  };

  container.querySelector('#blur-toggle').onchange = (e) => {
    motionBlurEnabled = e.target.checked;
    const blurSlider = container.querySelector('#blur-strength-slider');
    blurSlider.disabled = !motionBlurEnabled;
  };

  container.querySelector('#blur-strength-slider').oninput = (e) => {
    motionBlurStrength = parseInt(e.target.value);
    container.querySelector('#blur-strength-value').textContent = motionBlurStrength;
  };

  container.querySelector('#stabilization-toggle').onchange = (e) => {
    stabilizationEnabled = e.target.checked;
  };

  container.querySelector('#preview-btn').onclick = () => {
    if (isPreviewing) {
      stopPreview();
    } else {
      startPreview();
    }
  };

  container.querySelector('#preview-section button:last-child').onclick = async () => {
    if (!uploadedVideoUrl) return;

    const generateBtn = container.querySelector('#preview-section button:last-child');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<div class="animate-spin inline-block mr-2">◌</div><span class="text-sm font-bold">Applying Effects...</span>';

    try {
      const apiKey = await securityService.getDecryptedKey();
      if (!apiKey) {
        throw new Error('Please configure your MuAPI key in settings');
      }

      // Apply motion effects via API
      const result = await muapi.applyVideoEffects(uploadedVideoUrl, [{
        type: 'motion',
        motionType: selectedMotionType,
        direction: selectedDirection,
        speed: motionSpeed,
        intensity: motionIntensity,
        motionBlur: motionBlurEnabled ? motionBlurStrength : 0,
        stabilization: stabilizationEnabled,
      }]);

      // Handle successful generation
      console.log('Motion effects applied:', result);

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
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<span class="text-sm font-bold">Apply Motion Effects</span>';
    }
  };

  // Initial state
  disableControls();

  return container;
}