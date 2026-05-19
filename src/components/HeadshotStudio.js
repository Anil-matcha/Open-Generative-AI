import * as headshotService from '../apps/ai-headshot-generator/services/headshotService.js';

const PRESETS = [
  { id: 'professional', name: 'Professional', prompt: 'professional headshot, crisp white shirt, confident smile, studio lighting' },
  { id: 'creative', name: 'Creative', prompt: 'creative professional headshot, artistic background, modern style' },
  { id: 'linkedin', name: 'LinkedIn', prompt: 'LinkedIn profile photo, professional, approachable, business attire' },
  { id: 'executive', name: 'Executive', prompt: 'executive portrait, suit and tie, boardroom setting, authoritative' },
  { id: 'casual', name: 'Casual', prompt: 'casual professional headshot, relaxed pose, natural lighting' }
];

export function HeadshotStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-hidden';

  // Header
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b border-white/10 bg-black/20';
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div>
        <p class="text-xs font-bold text-muted uppercase tracking-wider">Image Studio</p>
        <h1 class="text-lg font-bold text-white">AI Headshot Generator</h1>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="generate-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-primary border-none rounded-lg hover:bg-primary/80">Generate</button>
    </div>
  `;
  container.appendChild(header);

  // Main content
  const main = document.createElement('div');
  main.className = 'flex-1 flex overflow-hidden';

  // Sidebar - Upload & Styles
  const sidebar = document.createElement('div');
  sidebar.className = 'w-80 border-r border-white/10 bg-black/20 p-4 overflow-y-auto';
  sidebar.innerHTML = `
    <p class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Upload Photo</p>
    <div id="upload-area" class="border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-white/40 mb-4">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mx-auto mb-2 opacity-50">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M21 15l-3.03-3.03a2.828 2.828 0 0 0-4 0L9 15"/>
      </svg>
      <p class="text-xs text-secondary">Click to upload photo</p>
      <input id="file-input" type="file" accept="image/*" class="hidden" />
    </div>
    
    <p class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Style Preset</p>
    <div id="presets" class="space-y-2">
      ${PRESETS.map(p => `
        <button class="w-full p-3 text-left text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white" data-preset="${p.id}">
          ${p.name}
        </button>
      `).join('')}
    </div>
    
    <p class="text-xs font-bold text-muted uppercase tracking-wider mt-6 mb-3">My Headshots</p>
    <div id="headshot-history" class="space-y-2 max-h-48 overflow-y-auto"></div>
  `;
  main.appendChild(sidebar);

  // Canvas - Preview
  const canvas = document.createElement('div');
  canvas.className = 'flex-1 flex flex-col overflow-hidden';
  canvas.innerHTML = `
    <div class="flex-1 p-6 flex items-center justify-center">
      <div id="preview-container" class="w-full max-w-md">
        <div class="aspect-[3/4] bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
          <p class="text-secondary text-sm">Upload a photo to generate headshots</p>
        </div>
      </div>
    </div>
  `;
  main.appendChild(canvas);

  container.appendChild(main);

  // State
  let sourcePhoto = null;
  let selectedPreset = PRESETS[0];

  // Event handlers - query within container since elements aren't in document yet
  container.querySelector('#upload-area')?.addEventListener('click', () => {
    container.querySelector('#file-input').click();
  });

  container.querySelector('#file-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const uploadBtn = container.querySelector('#upload-area');
      uploadBtn.innerHTML = '<div class="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div><p class="text-xs text-secondary">Uploading...</p>';
      
      try {
        const result = await headshotService.uploadSourcePhoto(file);
        sourcePhoto = result;
        uploadBtn.innerHTML = `<img src="${result.url}" class="w-full h-32 object-cover rounded mb-2" /><p class="text-xs text-secondary">Photo uploaded</p>`;
      } catch (err) {
        uploadBtn.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="mx-auto mb-2"/><p class="text-xs text-red-400">Upload failed</p>`;
      }
    }
  });

  main.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedPreset = PRESETS.find(p => p.id === btn.dataset.preset);
      main.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('ring-2', 'ring-primary'));
      btn.classList.add('ring-2', 'ring-primary');
    });
  });

  container.querySelector('#generate-btn')?.addEventListener('click', async () => {
    if (!sourcePhoto) {
      alert('Please upload a photo first');
      return;
    }
    
    const preview = container.querySelector('#preview-container');
    preview.innerHTML = `<div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div><p class="text-center text-secondary mt-2">Generating...</p>`;
    
    try {
      const apiKey = import.meta.env.VITE_MUAPI_KEY;
      const result = await headshotService.generateHeadshot(apiKey, sourcePhoto, selectedPreset);
      const resultCopy = { ...result };
      
      preview.innerHTML = `
        <div class="space-y-3">
          <img src="${result.url}" class="w-full aspect-[3/4] object-cover rounded-lg" />
          <div class="flex gap-2">
            <button id="headshot-view-btn" class="flex-1 py-1 text-xs font-bold text-white bg-white/5 border border-white/10 rounded hover:bg-white/10">View</button>
            <button id="headshot-save-btn" class="flex-1 py-1 text-xs font-bold text-white bg-primary border-none rounded hover:bg-primary/80">Save to Library</button>
          </div>
        </div>
      `;
      preview.querySelector('#headshot-view-btn').onclick = () => window.open(resultCopy.url);
      preview.querySelector('#headshot-save-btn').onclick = () => headshotService.saveOutputToLibrary(resultCopy);
    } catch (err) {
      preview.innerHTML = `<p class="text-center text-red-400">Generation failed: ${err.message}</p>`;
    }
  });

  return container;
}