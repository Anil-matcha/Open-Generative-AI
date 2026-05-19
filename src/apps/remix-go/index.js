import { appManifest } from './manifest.js';
import * as remixGoService from './services/remixGoService.js';

export function RemixGoApp() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-hidden';

  // Header
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b border-white/10 bg-black/20';
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </div>
      <div>
        <p class="text-xs font-bold text-muted uppercase tracking-wider">Video Studio</p>
        <h1 class="text-lg font-bold text-white">Remix Go</h1>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="new-project-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-primary border-none rounded-lg hover:bg-primary/80">New Project</button>
      <button id="save-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Save</button>
    </div>
  `;
  container.appendChild(header);

  // Main content - Video editor interface
  const main = document.createElement('div');
  main.className = 'flex-1 flex overflow-hidden';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'w-64 border-r border-white/10 bg-black/20 p-4 overflow-y-auto';
  toolbar.innerHTML = `
    <p class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Tools</p>
    <div class="space-y-2">
      <button class="w-full p-3 text-left text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white">Trim</button>
      <button class="w-full p-3 text-left text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white">Split</button>
      <button class="w-full p-3 text-left text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white">Text</button>
      <button class="w-full p-3 text-left text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white">Audio</button>
      <button class="w-full p-3 text-left text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white">Export</button>
    </div>
    <p class="text-xs font-bold text-muted uppercase tracking-wider mt-6 mb-3">Media</p>
    <div id="media-library" class="space-y-2 max-h-64 overflow-y-auto"></div>
  `;
  main.appendChild(toolbar);

  // Canvas
  const canvas = document.createElement('div');
  canvas.className = 'flex-1 relative bg-black/40 overflow-hidden';
  canvas.innerHTML = `
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mx-auto mb-4 opacity-30">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <p class="text-secondary mb-2">Drag media to timeline or click "New Project"</p>
        <button id="import-btn" class="px-4 py-2 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Import Media</button>
      </div>
    </div>
    <div class="absolute bottom-0 left-0 right-0 h-32 bg-black/60 border-t border-white/10 p-2 overflow-x-auto">
      <div id="timeline" class="h-full flex items-center gap-2 min-w-max"></div>
    </div>
  `;
  main.appendChild(canvas);

  container.appendChild(main);

  // Event handlers - query within container since elements aren't in document yet
  container.querySelector('#new-project-btn')?.addEventListener('click', () => {
    const projectName = prompt('Project name:', 'Untitled Project');
    if (projectName) {
      remixGoService.saveProject({ name: projectName }).then(() => {
        alert('Project created!');
      });
    }
  });

  container.querySelector('#import-btn')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        alert(`Imported: ${file.name}`);
      }
    };
    input.click();
  });

  return container;
}