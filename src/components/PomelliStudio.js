import * as pomelliService from '../apps/open-pomelli/services/pomelliService.js';

export function PomelliStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-hidden';

  // Header
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b border-white/10 bg-black/20';
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div>
        <p class="text-xs font-bold text-muted uppercase tracking-wider">Marketing Studio</p>
        <h1 class="text-lg font-bold text-white">Open Pomelli</h1>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="analyze-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-primary border-none rounded-lg hover:bg-primary/80">Analyze Website</button>
    </div>
  `;
  container.appendChild(header);

  // Main content
  const main = document.createElement('div');
  main.className = 'flex-1 flex overflow-hidden';

  // Sidebar - Campaign Creator
  const sidebar = document.createElement('div');
  sidebar.className = 'w-80 border-r border-white/10 bg-black/20 p-4 overflow-y-auto';
  sidebar.innerHTML = `
    <p class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Brand Input</p>
    <div class="space-y-3">
      <input id="url-input" type="url" placeholder="https://example.com" class="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded text-white placeholder-secondary" />
      <button id="generate-btn" class="w-full py-2 text-xs font-bold text-white bg-primary border-none rounded-lg hover:bg-primary/80">Generate Campaign</button>
    </div>
    
    <p class="text-xs font-bold text-muted uppercase tracking-wider mt-6 mb-3">Campaign Goals</p>
    <div class="space-y-2">
      <button class="w-full p-2 text-left text-sm rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white" data-goal="product-launch">Product Launch</button>
      <button class="w-full p-2 text-left text-sm rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white" data-goal="lead-gen">Lead Generation</button>
      <button class="w-full p-2 text-left text-sm rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white" data-goal="awareness">Awareness</button>
      <button class="w-full p-2 text-left text-sm rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white" data-goal="engagement">Engagement</button>
    </div>
    
    <p class="text-xs font-bold text-muted uppercase tracking-wider mt-6 mb-3">Assets</p>
    <div id="asset-library" class="space-y-2 max-h-64 overflow-y-auto"></div>
  `;
  main.appendChild(sidebar);

  // Canvas - Results
  const canvas = document.createElement('div');
  canvas.className = 'flex-1 flex flex-col overflow-hidden';
  canvas.innerHTML = `
    <div id="preview-area" class="flex-1 p-6 overflow-y-auto">
      <div class="max-w-2xl mx-auto">
        <h2 class="text-xl font-bold text-white mb-4">Brand DNA Analysis</h2>
        <div id="brand-dna" class="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
          <p class="text-secondary text-sm">Enter a website URL to analyze brand identity</p>
        </div>
        
        <h3 class="text-lg font-bold text-white mb-3">Generated Concepts</h3>
        <div id="concepts" class="space-y-3">
          <p class="text-secondary text-sm">Campaign concepts will appear here</p>
        </div>
      </div>
    </div>
  `;
  main.appendChild(canvas);

  container.appendChild(main);

  // Event handlers - query within container since elements aren't in document yet
  container.querySelector('#analyze-btn')?.addEventListener('click', async () => {
    const url = container.querySelector('#url-input').value;
    if (!url) {
      alert('Please enter a website URL');
      return;
    }
    const brandDNA = await pomelliService.extractBrandDNA({ url }, '');
    container.querySelector('#brand-dna').innerHTML = `
      <div class="space-y-2">
        <p><span class="text-muted">Name:</span> <span class="text-white">${brandDNA.name}</span></p>
        <p><span class="text-muted">Tone:</span> <span class="text-white">${brandDNA.tone?.join(', ')}</span></p>
        <p><span class="text-muted">Colors:</span> ${brandDNA.colors?.map(c => `<span class="inline-block w-4 h-4 rounded" style="background:${c}"></span>`).join('')}
      </div>
    `;
  });

  main.querySelectorAll('[data-goal]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const goal = btn.dataset.goal;
      const concepts = await pomelliService.generateCampaignConcepts(null, goal, '');
      container.querySelector('#concepts').innerHTML = concepts.map(c => `
        <div class="bg-white/5 border border-white/10 rounded-lg p-3">
          <h4 class="font-bold text-white">${c.title}</h4>
          <p class="text-secondary text-sm">${c.description}</p>
        </div>
      `).join('');
    });
  });

  return container;
}