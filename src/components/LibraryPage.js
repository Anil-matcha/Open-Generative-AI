import { getPageThumbnail, createThumbnailImg } from '../lib/thumbnails.js';
import { createSafeImage, createSafeVideo, safeSetText } from '../lib/security.js';
import { createVideoPreview } from '../lib/videoPlayer.js';

export function LibraryPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-hidden';

  let activeFilter = 'all';
  let searchQuery = '';

  const topBar = document.createElement('div');
  topBar.className = 'px-4 md:px-8 pt-6 pb-4 shrink-0';
  const libThumb = getPageThumbnail('library');
  if (libThumb) {
    const bannerWrapper = document.createElement('div');
    bannerWrapper.className = 'relative w-full h-32 md:h-44 rounded-2xl overflow-hidden mb-4';
    bannerWrapper.innerHTML = '<div class="thumb-skeleton absolute inset-0"></div>';
    const img = createThumbnailImg(libThumb, 'Library', 'w-full h-full object-cover');
    bannerWrapper.appendChild(img);
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent';
    bannerWrapper.appendChild(overlay);
    const textOverlay = document.createElement('div');
    textOverlay.className = 'absolute bottom-0 left-0 right-0 p-4 z-10';
    textOverlay.innerHTML = '<h1 class="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">Library</h1><p class="text-white/60 text-xs">All your generated images and videos</p>';
    bannerWrapper.appendChild(textOverlay);
    topBar.appendChild(bannerWrapper);
  } else {
    topBar.innerHTML = '<h1 class="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">Library</h1><p class="text-secondary text-xs mb-4">All your generated images and videos</p>';
  }

  const controls = document.createElement('div');
  controls.className = 'flex items-center gap-3 flex-wrap';

  const filters = ['all', 'images', 'videos', 'templates'];
  const filterBtns = {};
  filters.forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'px-4 py-2 rounded-full text-xs font-bold transition-all';
    btn.textContent = f.charAt(0).toUpperCase() + f.slice(1);
    btn.onclick = () => { activeFilter = f; updateFilters(); renderGrid(); };
    filterBtns[f] = btn;
    controls.appendChild(btn);
  });

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search by prompt...';
  searchInput.className = 'ml-auto bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors w-48';
  searchInput.oninput = () => { searchQuery = searchInput.value.toLowerCase(); renderGrid(); };
  controls.appendChild(searchInput);

  topBar.appendChild(controls);
  container.appendChild(topBar);

  const gridArea = document.createElement('div');
  gridArea.className = 'flex-1 overflow-y-auto px-4 md:px-8 pb-8';
  container.appendChild(gridArea);

  const previewOverlay = document.createElement('div');
  previewOverlay.className = 'fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-8 hidden';
  previewOverlay.onclick = (e) => {
    if (e.target === previewOverlay) previewOverlay.classList.add('hidden');
  };
  container.appendChild(previewOverlay);

  function getHistory() {
    let imageHistory = [];
    let videoHistory = [];
    try { imageHistory = JSON.parse(localStorage.getItem('muapi_history') || '[]'); } catch (e) { /* ignore */ }
    try { videoHistory = JSON.parse(localStorage.getItem('video_history') || '[]'); } catch (e) { /* ignore */ }
    return [
      ...imageHistory.map(h => ({ ...h, type: h.type || 'image' })),
      ...videoHistory.map(h => ({ ...h, type: 'video' })),
    ].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }

  function updateFilters() {
    Object.entries(filterBtns).forEach(([key, btn]) => {
      btn.className = key === activeFilter
        ? 'px-4 py-2 rounded-full text-xs font-bold transition-all bg-primary text-black'
        : 'px-4 py-2 rounded-full text-xs font-bold transition-all bg-white/5 text-secondary hover:bg-white/10';
    });
  }

  function renderGrid() {
    let items = getHistory();

    if (activeFilter === 'images') items = items.filter(i => i.type === 'image' || !i.type);
    else if (activeFilter === 'videos') items = items.filter(i => i.type === 'video');
    else if (activeFilter === 'templates') items = items.filter(i => i.template);

    if (searchQuery) {
      items = items.filter(i => (i.prompt || '').toLowerCase().includes(searchQuery));
    }

    gridArea.innerHTML = '';

    if (items.length === 0) {
      gridArea.innerHTML = `
        <div class="flex flex-col items-center justify-center h-64 text-muted">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mb-4 opacity-30"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
          <div class="text-sm">No generations yet</div>
          <div class="text-xs mt-1">Your creations will appear here</div>
        </div>
      `;
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'relative group cursor-pointer rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all aspect-square bg-white/[0.02]';

      // Safe media creation - prevents XSS from user-provided URLs
      if (item.type === 'video') {
        const video = createSafeVideo(item.url, 'w-full h-full object-cover');
        card.appendChild(video);
        
        // Badge for video
        const badge = document.createElement('div');
        badge.className = 'absolute top-2 right-2 bg-blue-500/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-white';
        badge.textContent = 'VIDEO';
        card.appendChild(badge);
      } else {
        const img = createSafeImage(item.url, 'Generated image', 'w-full h-full object-cover');
        img.loading = 'lazy';
        card.appendChild(img);
      }

      // Safe overlay content
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3';
      
      const promptText = document.createElement('div');
      promptText.className = 'text-[10px] text-white/80 truncate';
      promptText.textContent = item.prompt || item.template || 'Generated';
      overlay.appendChild(promptText);
      
      const modelText = document.createElement('div');
      modelText.className = 'text-[9px] text-white/40 mt-0.5';
      modelText.textContent = item.model || '';
      overlay.appendChild(modelText);
      
      card.appendChild(overlay);

      card.onclick = () => showPreview(item);
      grid.appendChild(card);
    });

    gridArea.appendChild(grid);
  }

  function showPreview(item) {
    previewOverlay.classList.remove('hidden');
    previewOverlay.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'max-w-3xl w-full flex flex-col items-center';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'self-end mb-4 text-secondary hover:text-white transition-colors';
    closeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.onclick = () => previewOverlay.classList.add('hidden');
    wrapper.appendChild(closeBtn);

    if (item.type === 'video') {
      const video = createVideoPreview(item.url, 'max-h-[70vh] max-w-full rounded-xl', {
        loop: true
      });
      wrapper.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = item.url;
      img.className = 'max-h-[70vh] rounded-xl';
      wrapper.appendChild(img);
    }

    const info = document.createElement('div');
    info.className = 'mt-4 text-center';
    
    const promptEl = document.createElement('div');
    promptEl.className = 'text-sm text-white mb-1';
    promptEl.textContent = item.prompt || 'Generated';
    info.appendChild(promptEl);
    
    const modelEl = document.createElement('div');
    modelEl.className = 'text-xs text-muted';
    modelEl.textContent = item.model ? (item.template ? `${item.model} / ${item.template}` : item.model) : '';
    info.appendChild(modelEl);
    
    wrapper.appendChild(info);

    const dlBtn = document.createElement('a');
    dlBtn.href = item.url;
    dlBtn.download = `generation-${item.id || Date.now()}`;
    dlBtn.className = 'mt-4 bg-primary text-black px-8 py-2.5 rounded-xl font-bold text-sm hover:shadow-glow transition-all';
    dlBtn.textContent = 'Download';
    wrapper.appendChild(dlBtn);

    previewOverlay.appendChild(wrapper);
  }

  updateFilters();
  renderGrid();
  return container;
}
