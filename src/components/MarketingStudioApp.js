import { navigate } from '../lib/router.js';
import { generateMarketingStudioAd, uploadFile } from '../lib/muapi.js';
import { MARKETING_STUDIO_ASSETS, MARKETING_STUDIO_OPTIONS } from '../data/importedStudioAssets.js';

const STORAGE_KEY = 'higgsfield.marketingStudio';
const HANDOFF_KEYS = {
  library: 'higgsfield.pendingLibraryOutput'
};

function safeReadStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function safeWriteStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function MarketingStudioApp() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-hidden';

  // State
  let state = {
    prompt: '',
    productImage: null,
    avatarImage: null,
    additionalImages: [],
    params: {
      ratio: '9:16',
      format: 'UGC',
      videoUrl: MARKETING_STUDIO_ASSETS.ugc[0].url,
      res: '1080p',
      duration: 5
    },
    history: []
  };

  // Load persisted state
  const persisted = safeReadStorage(STORAGE_KEY, null);
  if (persisted) {
    state = { ...state, ...persisted };
  }

  // Header
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b border-white/10 bg-black/20';
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <button id="back-btn" class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/></svg>
      </button>
      <div>
        <p class="text-xs font-bold text-muted uppercase tracking-wider">Marketing Studio</p>
        <h1 class="text-lg font-bold text-white">AI Video Ad Generator</h1>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="clear-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Clear</button>
    </div>
  `;
  container.appendChild(header);

  // Main content area
  const main = document.createElement('div');
  main.className = 'flex-1 flex flex-col lg:flex-row overflow-hidden';

  // Left panel - Controls
  const controlsPanel = document.createElement('div');
  controlsPanel.className = 'w-full lg:w-96 border-r border-white/10 bg-black/20 p-4 overflow-y-auto';

  controlsPanel.innerHTML = `
    <div class="space-y-4">
      <!-- Prompt -->
      <div>
        <label class="text-xs text-secondary mb-1 block">Ad Script / Prompt</label>
        <textarea id="prompt" placeholder="Describe your ad scene..." class="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white resize-y min-h-[80px]"></textarea>
      </div>

<!-- Uploads -->
       <div>
         <label class="text-xs text-secondary mb-1 block">Assets</label>
         <div class="flex gap-2">
           <div class="flex-1">
             <button id="upload-product" class="w-full px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 flex items-center justify-center gap-2">
               <span>📦 Product</span>
             </button>
             <div id="product-preview" class="mt-1 h-16 rounded bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden"></div>
           </div>
           <div class="flex-1">
             <button id="upload-avatar" class="w-full px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 flex items-center justify-center gap-2">
               <span>👤 Avatar</span>
             </button>
             <div id="avatar-preview" class="mt-1 h-16 rounded bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden"></div>
           </div>
         </div>
         <button id="upload-reference" class="w-full px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 flex items-center justify-center gap-2 mt-2">
           <span>📎 Additional Reference</span>
         </button>
         <div id="reference-preview" class="mt-1 flex gap-1 flex-wrap"></div>
       </div>

      <!-- Avatar Presets -->
      <div>
        <label class="text-xs text-secondary mb-1 block">Avatar Presets</label>
        <div id="avatar-presets" class="grid grid-cols-4 gap-2"></div>
      </div>

      <!-- Video Format Presets -->
      <div>
        <label class="text-xs text-secondary mb-1 block">Video Format</label>
        <select id="format-select" class="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
          ${MARKETING_STUDIO_ASSETS.ugc.map(u => `<option value="${u.name}">${u.name}</option>`).join('')}
        </select>
      </div>

      <!-- Controls -->
      <div class="grid grid-cols-3 gap-2">
        <div>
          <label class="text-xs text-secondary mb-1 block">Aspect Ratio</label>
          <select id="ratio-select" class="w-full px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
            ${MARKETING_STUDIO_OPTIONS.ratio.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs text-secondary mb-1 block">Resolution</label>
          <select id="res-select" class="w-full px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
            ${MARKETING_STUDIO_OPTIONS.res.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs text-secondary mb-1 block">Duration</label>
          <select id="duration-select" class="w-full px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
            ${MARKETING_STUDIO_OPTIONS.duration.map(d => `<option value="${d}">${d}s</option>`).join('')}
          </select>
        </div>
      </div>

      <button id="generate-btn" class="w-full px-4 py-3 text-sm font-bold text-black bg-primary border-none rounded-lg hover:bg-primary/80 flex items-center justify-center gap-2">
        <span>Generate Video Ad</span>
      </button>
    </div>
  `;

  // Right panel - History / Preview
  const historyPanel = document.createElement('div');
  historyPanel.className = 'flex-1 flex flex-col p-4 overflow-y-auto';

  historyPanel.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <p class="text-xs font-bold text-muted uppercase tracking-wider">Generation History</p>
      <button id="clear-history" class="text-xs text-white/50 hover:text-white">Clear History</button>
    </div>
    <div id="history-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    <div id="empty-state" class="flex-1 flex items-center justify-center text-center">
      <div>
        <p class="text-secondary text-sm">No generations yet.</p>
        <p class="text-xs text-muted mt-1">Upload a product, select an avatar, and generate your first ad.</p>
      </div>
    </div>
  `;

  main.appendChild(controlsPanel);
  main.appendChild(historyPanel);
  container.appendChild(main);

  // Event listeners
  document.getElementById('back-btn').onclick = () => window.history.back();
  document.getElementById('clear-btn').onclick = clearAll;
  document.getElementById('generate-btn').onclick = generateAd;
  document.getElementById('clear-history').onclick = clearHistory;

  // Avatar presets
  const avatarPresetsContainer = document.getElementById('avatar-presets');
  MARKETING_STUDIO_ASSETS.avatar.forEach(avatar => {
    const btn = document.createElement('button');
    btn.className = 'aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 transition-all';
    btn.innerHTML = `<img src="${avatar.url}" class="w-full h-full object-cover" alt="${avatar.name}"><div class="text-[9px] text-center py-0.5 bg-black/60">${avatar.name}</div>`;
    btn.onclick = () => {
      state.avatarImage = avatar.url;
      updatePreviews();
    };
    avatarPresetsContainer.appendChild(btn);
  });

  // Format select
  document.getElementById('format-select').value = state.params.format;
  document.getElementById('format-select').onchange = (e) => {
    const format = MARKETING_STUDIO_ASSETS.ugc.find(u => u.name === e.target.value);
    state.params.format = format.name;
    state.params.videoUrl = format.url;
  };

  // Other selects
  document.getElementById('ratio-select').value = state.params.ratio;
  document.getElementById('ratio-select').onchange = (e) => state.params.ratio = e.target.value;
  document.getElementById('res-select').value = state.params.res;
  document.getElementById('res-select').onchange = (e) => state.params.res = e.target.value;
  document.getElementById('duration-select').value = state.params.duration;
  document.getElementById('duration-select').onchange = (e) => state.params.duration = parseInt(e.target.value);

  // Upload handlers
  document.getElementById('upload-product').onclick = () => triggerUpload('product');
  document.getElementById('upload-avatar').onclick = () => triggerUpload('avatar');

  function triggerUpload(target) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadFile(null, file, () => {});
        if (target === 'product') state.productImage = url;
        else state.avatarImage = url;
        updatePreviews();
        persistState();
      } catch (err) {
        alert('Upload failed: ' + err.message);
      }
    };
    input.click();
  }

  function updatePreviews() {
    const productPreview = document.getElementById('product-preview');
    const avatarPreview = document.getElementById('avatar-preview');

    productPreview.innerHTML = state.productImage 
      ? `<img src="${state.productImage}" class="w-full h-full object-cover">` 
      : '<span class="text-xs text-muted">No product</span>';

    avatarPreview.innerHTML = state.avatarImage 
      ? `<img src="${state.avatarImage}" class="w-full h-full object-cover">` 
      : '<span class="text-xs text-muted">No avatar</span>';
  }

  function persistState() {
    safeWriteStorage(STORAGE_KEY, state);
  }

  async function generateAd() {
    if (!state.prompt.trim()) return alert('Please enter an ad script.');
    if (!state.productImage) return alert('Please upload a product image.');

    const btn = document.getElementById('generate-btn');
    btn.disabled = true;
    btn.innerHTML = '<span>Generating...</span>';

    try {
      const result = await generateMarketingStudioAd(null, {
        prompt: state.prompt,
        aspect_ratio: state.params.ratio,
        duration: state.params.duration,
        resolution: state.params.res,
        images_list: [state.productImage, state.avatarImage, ...state.additionalImages].filter(Boolean),
        video_files: state.params.videoUrl ? [state.params.videoUrl] : []
      });

      if (result?.url) {
        const entry = {
          id: Date.now(),
          url: result.url,
          prompt: state.prompt,
          format: state.params.format,
          timestamp: new Date().toISOString()
        };
        state.history.unshift(entry);
        renderHistory();
        persistState();

        // Show fullscreen preview
        showFullscreen(result.url);
      }
    } catch (err) {
      alert('Generation failed: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>Generate Video Ad</span>';
    }
  }

  function renderHistory() {
    const grid = document.getElementById('history-grid');
    const empty = document.getElementById('empty-state');

    grid.innerHTML = '';
    if (state.history.length === 0) {
      empty.style.display = 'flex';
      return;
    }
    empty.style.display = 'none';

    state.history.forEach(entry => {
      const card = document.createElement('div');
      card.className = 'relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] cursor-pointer';
      card.innerHTML = `
        <video src="${entry.url}" class="w-full aspect-video object-cover" muted loop></video>
        <div class="p-2 bg-black/80 text-xs">
          <p class="text-white/70 line-clamp-2">${entry.prompt}</p>
          <div class="flex justify-between mt-1 text-white/40">
            <span>${entry.format}</span>
            <span>${new Date(entry.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
      `;
      card.onclick = () => showFullscreen(entry.url);
      grid.appendChild(card);
    });
  }

  function showFullscreen(url) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/95';
    modal.innerHTML = `
      <button class="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white">✕</button>
      <video src="${url}" controls autoplay class="max-w-[95vw] max-h-[90vh] rounded-lg"></video>
      <div class="absolute bottom-6 flex gap-3">
        <button id="library-btn" class="px-4 py-2 text-white bg-yellow-500/10 border border-yellow-500/20 rounded font-bold">Save to Library</button>
        <button id="download-btn" class="px-4 py-2 bg-primary text-black rounded font-bold">Download</button>
      </div>
    `;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.querySelector('#download-btn').onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketing-ad-${Date.now()}.mp4`;
      a.click();
    };
    modal.querySelector('#library-btn').onclick = () => {
      safeWriteStorage(HANDOFF_KEYS.library, JSON.stringify({ url, app: 'marketing-studio' }));
      navigate('library');
    };
    document.body.appendChild(modal);
  }

  function clearAll() {
    state.prompt = '';
    state.productImage = null;
    state.avatarImage = null;
    state.additionalImages = [];
    document.getElementById('prompt').value = '';
    updatePreviews();
    persistState();
  }

  function clearHistory() {
    state.history = [];
    renderHistory();
    persistState();
  }

  // Initialize
  document.getElementById('prompt').value = state.prompt;
  document.getElementById('prompt').oninput = (e) => { state.prompt = e.target.value; persistState(); };
  updatePreviews();
  renderHistory();

  return container;
}
