import { navigate } from '../lib/router.js';
import { 
  getTemplateWorkflows, 
  getUserWorkflows, 
  getPublishedWorkflows,
  createWorkflow,
  updateWorkflowName,
  deleteWorkflow,
  getWorkflowInputs,
  executeWorkflow,
  getAllNodeSchemas,
  getWorkflowData
} from '../lib/muapi.js';

const STORAGE_KEY = 'higgsfield.workflows';

function safeReadStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function safeWriteStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function WorkflowStudioApp() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-hidden';

  let currentTab = 'templates';
  let workflows = [];
  let templates = [];
  let published = [];

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b border-white/10 bg-black/20';
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <button id="back-btn" class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">←</button>
      <div>
        <p class="text-xs font-bold text-muted uppercase tracking-wider">Workflow Studio</p>
        <h1 class="text-lg font-bold text-white">AI Workflow Builder</h1>
      </div>
    </div>
    <div class="flex gap-2">
      <button id="new-workflow-btn" class="px-4 py-1.5 text-xs font-bold text-black bg-primary rounded-lg hover:bg-primary/80">+ New Workflow</button>
    </div>
  `;
  container.appendChild(header);

  const tabs = document.createElement('div');
  tabs.className = 'flex border-b border-white/10 px-4';
  tabs.innerHTML = `
    <button data-tab="templates" class="tab-btn px-4 py-2 text-sm font-bold border-b-2 border-primary text-white">Templates</button>
    <button data-tab="my" class="tab-btn px-4 py-2 text-sm font-bold text-white/60 hover:text-white">My Workflows</button>
    <button data-tab="community" class="tab-btn px-4 py-2 text-sm font-bold text-white/60 hover:text-white">Community</button>
    <button data-tab="builder" class="tab-btn px-4 py-2 text-sm font-bold text-white/60 hover:text-white">Builder</button>
    <button data-tab="playground" class="tab-btn px-4 py-2 text-sm font-bold text-white/60 hover:text-white">Playground</button>
  `;
  container.appendChild(tabs);

  const content = document.createElement('div');
  content.className = 'flex-1 overflow-auto p-4';
  container.appendChild(content);

  // Load data
  async function loadData() {
    try {
      templates = await getTemplateWorkflows(null) || [];
      workflows = safeReadStorage(STORAGE_KEY, []);
      published = await getPublishedWorkflows(null) || [];
    } catch (e) {
      console.warn('Failed to load workflows', e);
      templates = [];
      workflows = safeReadStorage(STORAGE_KEY, []);
      published = [];
    }
  }

  function renderTab(tab) {
    currentTab = tab;
    content.innerHTML = '';

    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('border-b-2', b.dataset.tab === tab);
      b.classList.toggle('border-primary', b.dataset.tab === tab);
      b.classList.toggle('text-white', b.dataset.tab === tab);
      b.classList.toggle('text-white/60', b.dataset.tab !== tab);
    });

    if (tab === 'templates') renderTemplates();
    if (tab === 'my') renderMyWorkflows();
    if (tab === 'community') renderCommunity();
    if (tab === 'builder') renderBuilder();
    if (tab === 'playground') renderPlayground();
  }

  function renderTemplates() {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

    templates.forEach(t => {
      const card = document.createElement('div');
      card.className = 'bg-white/5 border border-white/10 rounded-xl p-4 hover:border-primary/30 cursor-pointer';
      card.innerHTML = `
        <div class="font-bold text-white">${t.name || t.title}</div>
        <div class="text-xs text-secondary mt-1 line-clamp-2">${t.description || ''}</div>
        <div class="mt-3 text-xs text-primary">Use Template →</div>
      `;
      card.onclick = () => useTemplate(t);
      grid.appendChild(card);
    });

    content.appendChild(grid);
  }

  function renderMyWorkflows() {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

    workflows.forEach(w => {
      const card = document.createElement('div');
      card.className = 'bg-white/5 border border-white/10 rounded-xl p-4 hover:border-primary/30';
      card.innerHTML = `
        <div class="font-bold text-white">${w.name}</div>
        <div class="text-xs text-secondary mt-1">${w.steps?.length || 0} steps</div>
        <div class="flex gap-2 mt-3">
          <button class="edit-btn text-xs px-3 py-1 bg-white/10 rounded">Edit</button>
          <button class="run-btn text-xs px-3 py-1 bg-primary text-black rounded">Run</button>
          <button class="delete-btn text-xs px-3 py-1 bg-red-500/10 text-red-400 rounded">Delete</button>
        </div>
      `;
      card.querySelector('.edit-btn').onclick = () => editWorkflow(w);
      card.querySelector('.run-btn').onclick = () => runWorkflow(w);
      card.querySelector('.delete-btn').onclick = () => deleteWorkflowLocal(w);
      grid.appendChild(card);
    });

    content.appendChild(grid);
  }

  function renderCommunity() {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

    published.forEach(w => {
      const card = document.createElement('div');
      card.className = 'bg-white/5 border border-white/10 rounded-xl p-4';
      card.innerHTML = `
        <div class="font-bold text-white">${w.name}</div>
        <div class="text-xs text-secondary mt-1">by ${w.owner || 'Community'}</div>
        <button class="mt-3 text-xs px-3 py-1 bg-white/10 rounded">Fork to My Workflows</button>
      `;
      card.querySelector('button').onclick = () => forkWorkflow(w);
      grid.appendChild(card);
    });

    content.appendChild(grid);
  }

  function renderBuilder() {
    content.innerHTML = `
      <div class="text-center py-10">
        <p class="text-secondary">Advanced node-based builder coming soon.</p>
        <p class="text-xs text-muted mt-2">Use the Workflow Builder app for now or create a new workflow above.</p>
      </div>
    `;
  }

  function renderPlayground() {
    content.innerHTML = `
      <div class="max-w-md mx-auto text-center py-10">
        <p class="text-secondary">Select a workflow from My Workflows or Templates to run it in the Playground.</p>
      </div>
    `;
  }

  function useTemplate(template) {
    const newWorkflow = {
      id: 'wf_' + Date.now(),
      name: template.name || 'Untitled from Template',
      steps: template.steps || [],
      createdAt: new Date().toISOString()
    };
    workflows.push(newWorkflow);
    safeWriteStorage(STORAGE_KEY, workflows);
    navigate('workflow-builder');
  }

  function editWorkflow(wf) {
    // For now, route to the existing WorkflowBuilderApp with the workflow ID
    navigate(`workflow-builder?id=${wf.id}`);
  }

  function runWorkflow(wf) {
    navigate(`workflow-runner?id=${wf.id}`);
  }

  function deleteWorkflowLocal(wf) {
    if (!confirm('Delete this workflow?')) return;
    workflows = workflows.filter(w => w.id !== wf.id);
    safeWriteStorage(STORAGE_KEY, workflows);
    renderMyWorkflows();
  }

  function forkWorkflow(wf) {
    const copy = { ...wf, id: 'wf_' + Date.now(), name: wf.name + ' (Forked)' };
    workflows.push(copy);
    safeWriteStorage(STORAGE_KEY, workflows);
    alert('Workflow forked to My Workflows');
    renderTab('my');
  }

  // Event listeners
  const backBtn = container.querySelector('#back-btn');
  const newWorkflowBtn = container.querySelector('#new-workflow-btn');
  
  if (backBtn) backBtn.onclick = () => window.history.back();
  if (newWorkflowBtn) newWorkflowBtn.onclick = () => navigate('workflow-builder');

  tabs.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => renderTab(btn.dataset.tab);
  });

  // Initial load
  loadData().then(() => {
    renderTab('templates');
  });

  return container;
}
