import { workflowRegistry } from '../lib/workflowRegistry.js';
import { workflowCategories } from '../lib/workflowCategories.js';
import { WorkflowTile } from './WorkflowTile.js';
import { navigate } from '../lib/router.js';

export function WorkflowsPage() {
  const root = document.createElement('div');
  root.className = 'w-full h-full p-6 text-white overflow-y-auto';
  root.innerHTML = `<div class="flex flex-wrap items-center gap-3 mb-4"><h1 class="text-2xl font-bold">Workflow Studio</h1><input placeholder="Search workflows" class="workflow-search rounded-lg bg-white/5 border border-white/10 p-2 text-sm" /></div>`;
  const filters = document.createElement('div'); filters.className = 'flex flex-wrap gap-2 mb-4';
  const grid = document.createElement('div'); grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
  let selected = 'All';
  const searchEl = root.querySelector('.workflow-search');
  const render = () => {
    const q = (searchEl.value || '').toLowerCase();
    const rows = workflowRegistry.filter(w => (selected === 'All' || w.category === selected) && (!q || w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)));
    grid.innerHTML = '';
    rows.forEach(w => grid.appendChild(WorkflowTile(w, slug => navigate(`workflows/${slug}`))));
  };
  ['All', ...workflowCategories].forEach(cat => {
    const btn = document.createElement('button'); btn.className = 'px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs'; btn.textContent = cat;
    btn.onclick = () => { selected = cat; render(); };
    filters.appendChild(btn);
  });
  searchEl.oninput = render;
  root.appendChild(filters); root.appendChild(grid); render();
  return root;
}
