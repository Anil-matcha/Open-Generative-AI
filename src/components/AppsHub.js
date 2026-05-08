import { navigate } from '../lib/router.js';
import { getStudioThumbnail, createThumbnailImg } from '../lib/thumbnails.js';

const CORE_STUDIOS = [
  { id: 'image', name: 'Image Studio', description: 'Generate images with 20+ AI models', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>', badge: '20+ models', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'video', name: 'Video Studio', description: 'Create AI videos from text and images', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>', badge: '15+ models', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'cinema', name: 'Cinema Studio', description: 'Cinematic shots with camera controls', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>', badge: '6 cameras', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
];

const TOOL_STUDIOS = [
  { id: 'storyboard', name: 'Storyboard Studio', description: 'Multi-frame generation for sequences', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="6" height="8" rx="1"/><rect x="9" y="3" width="6" height="8" rx="1"/><rect x="16" y="3" width="6" height="8" rx="1"/><rect x="2" y="13" width="6" height="8" rx="1"/><rect x="9" y="13" width="6" height="8" rx="1"/><rect x="16" y="13" width="6" height="8" rx="1"/></svg>', badge: 'Frames', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { id: 'effects', name: 'Effects Studio', description: 'Apply 350+ visual effects', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>', badge: '350+ effects', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { id: 'edit', name: 'Edit Studio', description: 'Remove objects, backgrounds, reframe', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>', badge: '9 tools', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  { id: 'upscale', name: 'Upscale Suite', description: 'AI upscale and enhance images', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>', badge: '3 methods', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { id: 'headshots', name: 'AI Headshot Studio', description: 'Professional headshots for LinkedIn, teams, and personal branding', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3a4 4 0 110 8 4 4 0 010-8z"/><path d="M4 21v-1a8 8 0 0116 0v1"/><rect x="16" y="14" width="6" height="6" rx="1"/></svg>', badge: 'Headshots', color: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' },
  { id: 'character', name: 'Character Studio', description: 'Consistent character generation', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', badge: 'Face ID', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { id: 'commercial', name: 'Commercial Studio', description: 'Product photography and ads', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>', badge: 'Ads', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
];

const AI_APPS = [
  { id: 'audio', name: 'Audio Studio', description: 'Generate music, speech, and sound effects', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>', badge: 'AI Audio', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'avatar', name: 'Avatar Studio', description: 'AI avatars and lip sync video generation', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 11v2"/><path d="M8 13h8"/></svg>', badge: 'AI Avatars', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { id: 'training', name: 'Training Studio', description: 'Train custom LoRA models from your images', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>', badge: 'LoRA', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'videotools', name: 'Video Tools', description: 'Upscale, edit, translate, and enhance videos', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3V9z"/></svg>', badge: 'Video Tools', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { id: 'chat', name: 'Chat Studio', description: 'AI-powered text generation and conversation', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>', badge: 'LLM', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { id: 'runway-motion', name: 'Motion Controls', description: 'Advanced camera movements and motion effects', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/><path d="M12 13l1.5 2.5"/></svg>', badge: 'Motion', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'tiktok-carousel', name: 'TikTok Carousel', description: 'Create multi-image carousels optimized for TikTok', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="6" y="6" width="12" height="12" rx="1"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="15" cy="15" r="1"/></svg>', badge: 'Social', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { id: 'advanced-dubbing', name: 'Advanced Dubbing', description: 'Professional video translation and dubbing with voice cloning', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 9l12-2"/><path d="M9 13l12-2"/></svg>', badge: 'AI Voices', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
];

export function AppsHub() {
  const container = document.createElement('div');
  container.className = 'w-full h-full overflow-y-auto bg-app-bg';

  const inner = document.createElement('div');
  inner.className = 'w-full px-4 md:px-8 py-8 md:py-12';

  const heroSection = document.createElement('div');
  heroSection.className = 'mb-10 animate-fade-in-up';
  heroSection.innerHTML = `
    <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">Apps</h1>
    <p class="text-secondary text-sm md:text-base max-w-xl">All creative tools in one place. Studios, effects, templates, and more.</p>
  `;
  inner.appendChild(heroSection);

  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'mb-8 animate-fade-in-up';
  searchWrapper.style.animationDelay = '0.1s';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search tools and templates...';
  searchInput.className = 'w-full max-w-md bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors';
  searchWrapper.appendChild(searchInput);
  inner.appendChild(searchWrapper);

  const recentRow = createRecentRow();
  if (recentRow) inner.appendChild(recentRow);

  inner.appendChild(createSection('Core Studios', CORE_STUDIOS.map(s => ({
    ...s,
    thumbnail: getStudioThumbnail(s.id),
    onClick: () => { saveRecent(s.id, s.name); navigate(s.id); },
  })), true));

  inner.appendChild(createSection('Tools & Editors', TOOL_STUDIOS.map(s => ({
    ...s,
    thumbnail: getStudioThumbnail(s.id),
    onClick: () => { saveRecent(s.id, s.name); navigate(s.id); },
  })), true));

  inner.appendChild(createSection('AI Apps', AI_APPS.map(s => ({
    ...s,
    thumbnail: getStudioThumbnail(s.id),
    onClick: () => { saveRecent(s.id, s.name); navigate(s.id); },
  })), true));

  container.appendChild(inner);

  searchInput.oninput = () => {
    const q = searchInput.value.toLowerCase();
    container.querySelectorAll('[data-searchable]').forEach(el => {
      const text = el.dataset.searchable.toLowerCase();
      el.style.display = text.includes(q) ? '' : 'none';
    });
  };

  return container;
}

function createSection(title, items, isStudio = false) {
  const section = document.createElement('div');
  section.className = 'mb-10 animate-fade-in-up';

  const heading = document.createElement('h2');
  heading.className = 'text-lg font-bold text-white mb-4 flex items-center gap-2';
  heading.innerHTML = `${title} <span class="text-xs font-medium text-muted">${items.length}</span>`;
  section.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = isStudio
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-xl cursor-pointer hover:bg-white/[0.06] hover:border-white/10 transition-all group overflow-hidden';
    card.dataset.searchable = `${item.name} ${item.description || ''}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    if (item.thumbnail) {
      const heroHeight = isStudio ? 'h-32' : 'h-20';
      const heroWrapper = document.createElement('div');
      heroWrapper.className = `thumb-hero ${heroHeight}`;

      const skeleton = document.createElement('div');
      skeleton.className = `thumb-skeleton absolute inset-0`;
      heroWrapper.appendChild(skeleton);

      const img = createThumbnailImg(item.thumbnail, item.name, 'absolute inset-0');
      heroWrapper.appendChild(img);
      card.appendChild(heroWrapper);
    }

    const content = document.createElement('div');
    content.className = 'p-3';
    content.innerHTML = `
      <div class="flex items-start gap-3 mb-1">
        <div class="w-8 h-8 rounded-lg ${item.color || 'bg-white/5 text-secondary border-white/10'} border flex items-center justify-center shrink-0">
          ${item.icon || ''}
        </div>
        <div class="min-w-0">
          <div class="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">${item.name}</div>
          ${item.description ? `<div class="text-[11px] text-muted mt-0.5 line-clamp-2">${item.description}</div>` : ''}
        </div>
      </div>
      ${item.badge ? `<div class="text-[10px] font-bold text-muted mt-1 ml-11">${item.badge}</div>` : ''}
    `;
    card.appendChild(content);

    card.onclick = item.onClick;
    card.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.onClick();
      }
    };
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

function createRecentRow() {
  try {
    const recent = JSON.parse(localStorage.getItem('recent_tools') || '[]');
    if (recent.length === 0) return null;

    const section = document.createElement('div');
    section.className = 'mb-8 animate-fade-in-up';

    const heading = document.createElement('h2');
    heading.className = 'text-sm font-bold text-muted uppercase tracking-wider mb-3';
    heading.textContent = 'Recently Used';
    section.appendChild(heading);

    const row = document.createElement('div');
    row.className = 'flex gap-2 overflow-x-auto no-scrollbar pb-2';

    recent.slice(0, 8).forEach(r => {
      const chip = document.createElement('button');
      chip.className = 'px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white hover:bg-white/10 transition-all whitespace-nowrap';
      chip.textContent = r.name;
      chip.onclick = () => {
        if (r.id.includes('-') || r.id.includes('_')) navigate(`template/${r.id}`);
        else navigate(r.id);
      };
      row.appendChild(chip);
    });

    section.appendChild(row);
    return section;
  } catch { return null; }
}

function saveRecent(id, name) {
  try {
    const recent = JSON.parse(localStorage.getItem('recent_tools') || '[]');
    const filtered = recent.filter(r => r.id !== id);
    filtered.unshift({ id, name });
    localStorage.setItem('recent_tools', JSON.stringify(filtered.slice(0, 12)));
  } catch { /* ignore */ }
}
