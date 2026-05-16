/**
 * Vanilla JS Router for Director App
 * Handles navigation between timeline, library, and settings pages
 * Uses History API with hash-based routing for simplicity
 */

// Route configuration
const routes = {
  '/timeline': {
    init: async () => {
      try {
        const { initDirector } = await import('../director.js');
        if (typeof initDirector === 'function') {
          initDirector();
          return () => {}; // No cleanup needed currently
        }
      } catch (error) {
        console.error('[Router] Failed to load director module:', error);
        throw error;
      }
    }
  },
  '/library': {
    init: async () => {
      const container = document.getElementById('app');
      if (!container) return () => {};

      container.innerHTML = `
        <div class="w-full min-h-screen bg-app-bg p-6">
          <div class="max-w-6xl mx-auto">
            <div class="flex justify-between items-center mb-8">
              <div>
                <h1 class="text-3xl font-bold text-white mb-2">Media Library</h1>
                <p class="text-secondary">Browse and manage your media assets from all apps.</p>
              </div>
              <div class="flex gap-4">
                <input type="text" id="search-input" placeholder="Search assets..." class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button id="refresh-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium">Refresh</button>
              </div>
            </div>
            <div id="asset-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div class="col-span-full text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p class="text-secondary">Loading assets...</p>
              </div>
            </div>
          </div>
        </div>
      `;

      let disposeFn = () => {};
      
      setTimeout(async () => {
        const grid = document.getElementById('asset-grid');
        const searchInput = document.getElementById('search-input');
        const refreshBtn = document.getElementById('refresh-btn');

        async function loadAssets() {
          try {
            const assets = await window.assetStore.getAssets();
            renderAssets(assets);
          } catch (error) {
            grid.innerHTML = `
              <div class="col-span-full text-center py-12">
                <p class="text-red-400 mb-4">Failed to load assets: ${error.message}</p>
                <button onclick="loadAssets()" class="px-4 py-2 bg-blue-600 rounded-lg text-white">Retry</button>
              </div>
            `;
          }
        }

        function renderAssets(assets) {
          if (assets.length === 0) {
            grid.innerHTML = `
              <div class="col-span-full text-center py-12">
                <p class="text-gray-400 mb-4">No assets found. Generate assets from AI apps to see them here.</p>
                <a href="#/ai-vfx" class="px-4 py-2 bg-blue-600 rounded-lg text-white inline-block">Go to AI-VFX</a>
              </div>
            `;
            return;
          }

          grid.innerHTML = assets.map(asset => `
            <div class="asset-card bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-colors" data-asset-id="${asset.id}">
              <div class="aspect-video bg-gray-700 relative">
                ${asset.media?.thumbnail ?
                  `<img src="${asset.media.thumbnail}" alt="${asset.title}" class="w-full h-full object-cover" />` :
                  `<div class="w-full h-full flex items-center justify-center text-4xl text-gray-500">${getAssetIcon(asset.type)}</div>`
                }
                <span class="absolute top-2 right-2 px-2 py-1 bg-black/60 text-xs font-bold rounded">${asset.type?.toUpperCase()}</span>
              </div>
              <div class="p-3">
                <h3 class="font-medium text-white text-sm truncate">${asset.title}</h3>
                <p class="text-xs text-gray-400">${asset.sourceApp} • ${formatDate(asset.createdAt)}</p>
              </div>
            </div>
          `).join('');

          document.querySelectorAll('.asset-card').forEach(card => {
            card.addEventListener('click', () => {
              const assetId = card.dataset.assetId;
              window.location.hash = `/timeline?asset=${assetId}`;
            });
          });
        }

        function getAssetIcon(type) {
          const icons = {
            'video': '🎬',
            'image': '🖼️',
            'audio': '🎵',
            'text': '📝'
          };
          return icons[type] || '📄';
        }

        function formatDate(dateStr) {
          const date = new Date(dateStr);
          return date.toLocaleDateString();
        }

        async function getAssets() {
          if (typeof window.assetStore !== 'undefined') {
            return await window.assetStore.getAssets();
          }
          // Fallback to direct localStorage
          const stored = localStorage.getItem('universal_assets');
          return stored ? Object.values(JSON.parse(stored)) : [];
        }

        loadAssets();

        searchInput.addEventListener('input', async (e) => {
          const query = e.target.value.toLowerCase();
          const assets = await getAssets();
          const filtered = assets.filter(a => 
            a.title.toLowerCase().includes(query) ||
            (a.metadata?.prompt && a.metadata.prompt.toLowerCase().includes(query)) ||
            a.sourceApp.toLowerCase().includes(query)
          );
          renderAssets(filtered);
        });

        refreshBtn.addEventListener('click', loadAssets);
      }, 100);

      return () => {};
    }
  },
  '/settings': {
    init: async () => {
      const container = document.getElementById('app');
      if (!container) return () => {};

      const { llmKeyManager } = await import('../lib/director/LLMKeyManager.ts');
      const providers = llmKeyManager.constructor.getProviders();

      function renderSettings() {
        const masked = llmKeyManager.getMaskedKeys();
        const status = llmKeyManager.getStatus();

        let providerHtml = '';
        for (const [key, config] of Object.entries(providers)) {
          const maskedKey = masked[key] || '';
          const isConfigured = status[key]?.configured;
          providerHtml += `
            <div class="rounded-xl border border-white/10 bg-white/5 p-4 mb-4">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <div class="font-medium text-white text-lg">${config.displayName}</div>
                  <div class="text-sm text-slate-400">${config.models.join(', ')}</div>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-medium ${isConfigured ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-400/20 text-slate-400'}">
                  ${isConfigured ? 'Configured' : 'Not Set'}
                </span>
              </div>
              <div class="flex gap-2">
                <input
                  type="password"
                  id="director-key-${key}"
                  placeholder="${config.keyPlaceholder || 'Enter API key...'}"
                  class="flex-1 px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                />
                <button
                  class="director-save-key px-4 py-2 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition"
                  data-provider="${key}"
                >Save</button>
                <button
                  class="director-remove-key px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-medium hover:bg-red-500/30 transition"
                  data-provider="${key}"
                >Remove</button>
              </div>
              ${maskedKey ? `<p class="text-xs text-slate-500 mt-2">Stored: ${maskedKey}</p>` : ''}
            </div>
          `;
        }

        container.innerHTML = `
          <div class="w-full min-h-screen bg-app-bg p-6">
            <div class="max-w-3xl mx-auto">
              <div class="flex justify-between items-center mb-8">
                <div>
                  <h1 class="text-3xl font-bold text-white mb-2">Director Settings</h1>
                  <p class="text-secondary">Configure API keys for AI providers and backend connection.</p>
                </div>
              </div>

              <div class="mb-8">
                <h2 class="text-xl font-semibold text-white mb-4">LLM API Keys</h2>
                <p class="text-sm text-slate-400 mb-4">These keys are stored locally in your browser and used to connect to AI generation services.</p>
                ${providerHtml}
              </div>

              <div class="mb-8">
                <h2 class="text-xl font-semibold text-white mb-4">Backend Connection</h2>
                <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-white">Director Backend</div>
                      <div class="text-sm text-slate-400">Python backend for AI agent orchestration</div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-medium bg-emerald-400/20 text-emerald-300">Connected</span>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <h2 class="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
                <p class="text-sm text-slate-400 mb-4">Remove all stored API keys from this browser.</p>
                <button id="director-clear-all-keys" class="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-400 transition">
                  Clear All Keys
                </button>
              </div>
            </div>
          </div>
        `;

        // Bind save buttons
        container.querySelectorAll('.director-save-key').forEach(btn => {
          btn.addEventListener('click', () => {
            const provider = btn.dataset.provider;
            const input = document.getElementById(`director-key-${provider}`);
            const key = input.value.trim();
            if (!key) {
              alert('Please enter an API key');
              return;
            }
            const success = llmKeyManager.setKey(provider, key);
            if (success) {
              alert(`${providers[provider].displayName} key saved!`);
              renderSettings();
            } else {
              alert(`Invalid key format for ${providers[provider].displayName}`);
            }
          });
        });

        // Bind remove buttons
        container.querySelectorAll('.director-remove-key').forEach(btn => {
          btn.addEventListener('click', () => {
            const provider = btn.dataset.provider;
            if (confirm(`Remove ${providers[provider].displayName} key?`)) {
              llmKeyManager.removeKey(provider);
              renderSettings();
            }
          });
        });

        // Bind clear all
        const clearBtn = document.getElementById('director-clear-all-keys');
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            if (confirm('Remove ALL stored API keys? This cannot be undone.')) {
              llmKeyManager.clearAll();
              renderSettings();
            }
          });
        }
      }

      renderSettings();
      return () => {};
    }
  }
};

// Current route cleanup/dispose function
let currentDispose = null;

/**
 * Navigate to a route
 * @param {string} path - Route path (e.g., '/timeline')
 * @param {boolean} replace - If true, replace history instead of pushing
 */
export function navigate(path, replace = false) {
  const url = new URL(path, window.location.origin);
  const hashPath = `#${path}`;

  if (replace) {
    window.history.replaceState(null, '', hashPath);
  } else {
    window.history.pushState(null, '', hashPath);
  }

  handleRouteChange();
}

/**
 * Handle route changes (navigation and popstate)
 */
async function handleRouteChange() {
  const hash = window.location.hash.slice(1) || '/timeline';
  const path = hash.startsWith('/') ? hash : `/${hash}`;

  // Clean up previous route if dispose function exists
  if (currentDispose && typeof currentDispose === 'function') {
    try {
      currentDispose();
    } catch (error) {
      console.warn('[Router] Error cleaning up previous route:', error);
    }
    currentDispose = null;
  }

  // Find matching route (exact match)
  const route = routes[path] || routes['/timeline'];

  try {
    const disposeFn = await route.init();
    currentDispose = disposeFn || (() => {});
  } catch (error) {
    console.error('[Router] Failed to initialize route:', path, error);
    // Show error fallback
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-app-bg">
          <div class="text-center text-red-500">
            <h1 class="text-2xl font-bold mb-4">Route Error</h1>
            <p>Failed to load ${path}</p>
          </div>
        </div>
      `;
    }
  }
}

// Listen for browser back/forward buttons
window.addEventListener('popstate', handleRouteChange);

// Initial route on page load
document.addEventListener('DOMContentLoaded', () => {
  handleRouteChange();
});

// Export router API
export { routes, navigate as default };
