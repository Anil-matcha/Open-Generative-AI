export function AIVFXStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full overflow-y-auto bg-app-bg';

  const inner = document.createElement('div');
  inner.className = 'w-full px-4 md:px-8 py-8 md:py-12';

  const heroSection = document.createElement('div');
  heroSection.className = 'mb-10 animate-fade-in-up';
  heroSection.innerHTML = `
    <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">AI-VFX Studio</h1>
    <p class="text-secondary text-sm md:text-base max-w-xl">Apply AI-powered visual effects and transformations to your videos and images.</p>
  `;
  inner.appendChild(heroSection);

  // Main content area
  const contentGrid = document.createElement('div');
  contentGrid.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8';

  // Effects Library
  const effectsCard = document.createElement('div');
  effectsCard.className = 'bg-panel-bg rounded-xl border border-white/5 p-6';
  effectsCard.innerHTML = `
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-white">Effects Library</h3>
        <p class="text-secondary text-sm">Browse and apply AI visual effects</p>
      </div>
    </div>
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <button class="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left">
          <div class="text-sm font-medium text-white">Camera Effects</div>
          <div class="text-xs text-secondary">Pan, zoom, rotate</div>
        </button>
        <button class="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left">
          <div class="text-sm font-medium text-white">Color Grading</div>
          <div class="text-xs text-secondary">LUTs & corrections</div>
        </button>
        <button class="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left">
          <div class="text-sm font-medium text-white">Particles</div>
          <div class="text-xs text-secondary">Fire, smoke, magic</div>
        </button>
        <button class="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left">
          <div class="text-sm font-medium text-white">Transitions</div>
          <div class="text-xs text-secondary">Wipes & dissolves</div>
        </button>
      </div>
    </div>
  `;
  contentGrid.appendChild(effectsCard);

  // Upload & Preview
  const uploadCard = document.createElement('div');
  uploadCard.className = 'bg-panel-bg rounded-xl border border-white/5 p-6';
  uploadCard.innerHTML = `
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-white">Upload Media</h3>
        <p class="text-secondary text-sm">Import video or image to apply effects</p>
      </div>
    </div>
    <div class="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="text-secondary mx-auto mb-4">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <p class="text-secondary mb-2">Drop your media here or click to browse</p>
      <p class="text-xs text-secondary">Supports MP4, MOV, JPG, PNG up to 100MB</p>
      <button class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors">
        Choose File
      </button>
    </div>
  `;
  contentGrid.appendChild(uploadCard);

  inner.appendChild(contentGrid);

  // Recent Projects
  const recentSection = document.createElement('div');
  recentSection.className = 'bg-panel-bg rounded-xl border border-white/5 p-6';
  recentSection.innerHTML = `
    <h3 class="text-lg font-semibold text-white mb-4">Recent Projects</h3>
    <div class="text-center py-8 text-secondary">
      <p>No recent projects yet</p>
      <p class="text-sm">Start by uploading media and applying effects</p>
    </div>
  `;
  inner.appendChild(recentSection);

  container.appendChild(inner);
  return container;
}