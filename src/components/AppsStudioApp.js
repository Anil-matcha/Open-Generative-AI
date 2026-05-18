import { navigate } from '../lib/router.js';
import { getStudioThumbnail, createThumbnailImg } from '../lib/thumbnails.js';

// All existing Higgsfield apps
const EXISTING_APPS = [
  { id: 'image', name: 'Image Studio', description: 'Generate images with 20+ AI models', category: 'Core Studios', icon: '🎨' },
  { id: 'video', name: 'Video Studio', description: 'Create AI videos from text and images', category: 'Core Studios', icon: '🎬' },
  { id: 'cinema', name: 'Cinema Studio', description: 'Cinematic shots with camera controls', category: 'Core Studios', icon: '🎥' },
  { id: 'storyboard', name: 'Storyboard Studio', description: 'Multi-frame generation for sequences', category: 'Tools', icon: '📋' },
  { id: 'effects', name: 'Effects Studio', description: 'Apply 350+ visual effects', category: 'Tools', icon: '✨' },
  { id: 'edit', name: 'Edit Studio', description: 'Remove objects, backgrounds, reframe', category: 'Tools', icon: '✏️' },
  { id: 'upscale', name: 'Upscale Suite', description: 'AI upscale and enhance images', category: 'Tools', icon: '🔍' },
  { id: 'headshots', name: 'AI Headshot Studio', description: 'Professional headshots for LinkedIn', category: 'Tools', icon: '📸' },
  { id: 'character', name: 'Character Studio', description: 'Consistent character generation', category: 'Tools', icon: '👤' },
  { id: 'commercial', name: 'Commercial Studio', description: 'Product photography and ads', category: 'Tools', icon: '📢' },
  { id: 'audio', name: 'Audio Studio', description: 'Generate music, speech, and sound effects', category: 'Tools', icon: '🎵' },
  { id: 'avatar', name: 'Avatar Studio', description: 'AI avatars and lip sync video generation', category: 'Tools', icon: '🤖' },
  { id: 'training', name: 'Training Studio', description: 'Train custom LoRA models from your images', category: 'Tools', icon: '🎓' },
  { id: 'videotools', name: 'Video Tools', description: 'Upscale, edit, translate, and enhance videos', category: 'Tools', icon: '🎞️' },
  { id: 'chat', name: 'Chat Studio', description: 'AI-powered text generation and conversation', category: 'Tools', icon: '💬' },
  { id: 'lipsync', name: 'Lip Sync Studio', description: 'AI lip sync and dubbing', category: 'Tools', icon: '🗣️' },
  { id: 'influencer', name: 'AI Influencer', description: 'Generate AI influencers for content', category: 'Tools', icon: '🌟' },
  { id: 'templates', name: 'Templates', description: 'Pre-built project templates', category: 'Tools', icon: '📐' },
  { id: 'library', name: 'Media Library', description: 'Your uploaded and generated assets', category: 'Tools', icon: '📚' },
  { id: 'commercial', name: 'Commercial Studio', description: 'Product photography and ads', category: 'Tools', icon: '📢' },
];

// New upstream-inspired apps
const NEW_APPS = [
  { id: 'studio', name: 'Unified Studio', description: 'Launch all creative tools from one dashboard', category: 'AI Command Center', icon: '🎥' },
  { id: 'workflow-builder', name: 'Workflow Builder', description: 'Build multi-step AI pipelines', category: 'AI Command Center', icon: '🔗' },
  { id: 'ai-agent', name: 'AI Agent', description: 'Create and run AI agents for production', category: 'AI Command Center', icon: '🤖' },
  { id: 'design-agent', name: 'Design Agent', description: 'AI design assistant for layouts', category: 'AI Command Center', icon: '✨' },
  { id: 'marketing-studio', name: 'Marketing Studio', description: 'Brand campaigns and creatives', category: 'AI Command Center', icon: '📈' },
];

function safeReadStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

export function AppsStudioApp() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-y-auto custom-scrollbar';

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b border-white/10 bg-black/20';
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <button id="back-btn" class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/></svg>
      </button>
      <div>
        <p class="text-xs font-bold text-muted uppercase tracking-wider">Apps Studio</p>
        <h1 class="text-lg font-bold text-white">Creative App Gallery</h1>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="favorite-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Favorites</button>
    </div>
  `;
  container.appendChild(header);

  const main = document.createElement('flex-1 flex flex-col p-4 overflow-y-auto');
  main.className = 'flex-1 flex flex-col p-4 overflow-y-auto';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search all apps and tools...';
  searchInput.className = 'w-full max-w-md bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 mb-4';

  const categoriesContainer = document.createElement('div');
  categoriesContainer.className = 'space-y-6';

  const allApps = [...EXISTING_APPS, ...NEW_APPS];
  const categories = [...new Set(allApps.map(a => a.category))];

  categories.forEach(category => {
    const apps = allApps.filter(a => a.category === category);
    const section = createCategorySection(category, apps);
    categoriesContainer.appendChild(section);
  });

  main.appendChild(searchInput);
  main.appendChild(categoriesContainer);
  container.appendChild(main);

  searchInput.oninput = () => {
    const q = searchInput.value.toLowerCase();
    categoriesContainer.querySelectorAll('[data-app-card]').forEach(card => {
      const text = card.dataset.searchable.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
  };

  return container;
}

function createCategorySection(title, apps) {
  const section = document.createElement('div');
  section.className = 'animate-fade-in-up';

  const heading = document.createElement('h2');
  heading.className = 'text-lg font-bold text-white mb-3 flex items-center gap-2';
  heading.innerHTML = `${title} <span class="text-xs font-medium text-muted">${apps.length}</span>`;
  section.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3';

  apps.forEach(app => {
    const card = createAppCard(app);
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

function createAppCard(app) {
  const card = document.createElement('div');
  card.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-xl cursor-pointer hover:bg-white/[0.06] hover:border-white/10 transition-all group overflow-hidden';
  card.dataset.searchable = `${app.name} ${app.description || ''}`;
  card.dataset.appCard = 'true';

  const thumbnail = getStudioThumbnail(app.id);
  const icon = app.icon || '📱';

  if (thumbnail) {
    const thumbWrapper = document.createElement('div');
    thumbWrapper.className = 'h-24 w-full relative';
    const img = createThumbnailImg(thumbnail, app.name, 'w-full h-full object-cover rounded-t-xl');
    thumbWrapper.appendChild(img);
    card.appendChild(thumbWrapper);
  } else {
    const iconPlaceholder = document.createElement('div');
    iconPlaceholder.className = 'h-24 w-full flex items-center justify-center text-3xl bg-gradient-to-br from-white/5 to-white/10';
    iconPlaceholder.textContent = icon;
    card.appendChild(iconPlaceholder);
  }

  const content = document.createElement('div');
  content.className = 'p-3';
  content.innerHTML = `
    <div class="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">${app.name}</div>
    ${app.description ? `<div class="text-[11px] text-muted mt-0.5 line-clamp-2">${app.description}</div>` : ''}
  `;
  card.appendChild(content);

  card.onclick = () => {
    navigate(app.id);
  };

  return card;
}
