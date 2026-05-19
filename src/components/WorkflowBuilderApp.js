import { navigate } from '../lib/router.js';
import * as vibeWorkflowService from '../apps/vibe-workflow/services/vibeWorkflowService.js';

const STORAGE_KEY = 'higgsfield.workflows';
const NODE_TYPES = [
  { id: 'text', name: 'Text Input', icon: '📝', color: 'bg-blue-500/20 border-blue-500/50' },
  { id: 'image', name: 'Image Gen', icon: '🎨', color: 'bg-purple-500/20 border-purple-500/50' },
  { id: 'video', name: 'Video Gen', icon: '🎬', color: 'bg-red-500/20 border-red-500/50' },
  { id: 'openai', name: 'OpenAI', icon: '🤖', color: 'bg-green-500/20 border-green-500/50' },
  { id: 'output', name: 'Output', icon: '📤', color: 'bg-yellow-500/20 border-yellow-500/50' }
];

function safeReadStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function safeWriteStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function handoffOutput(target, output) {
  const HANDOFF_KEYS = {
    library: 'higgsfield.pendingLibraryOutput',
    render: 'higgsfield.pendingRenderOutput',
    director: 'higgsfield.pendingDirectorOutput',
    timeline: 'higgsfield.pendingTimelineOutput',
    'edit-studio': 'higgsfield.pendingEditStudioOutput'
  };
  if (HANDOFF_KEYS[target]) {
    sessionStorage.setItem(HANDOFF_KEYS[target], JSON.stringify({ content: output, app: 'vibe-workflow' }));
  }
}

export function WorkflowBuilderApp() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-hidden';

  // State
  let state = {
    activeTab: 'templates',
    workflows: [],
    currentWorkflow: null,
    nodes: [],
    runStatus: null,
    isRunning: false
  };

  // Load from storage
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
        <p class="text-xs font-bold text-muted uppercase tracking-wider">Workflows</p>
        <h1 class="text-lg font-bold text-white">AI Workflow Builder</h1>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="run-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-primary border-none rounded-lg hover:bg-primary/80">Run Workflow</button>
      <button id="save-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Save</button>
    </div>
  `;
  container.appendChild(header);

  // Main content
  const main = document.createElement('div');
  main.className = 'flex-1 flex overflow-hidden';

  // Sidebar - Node Palette
  const sidebar = document.createElement('div');
  sidebar.className = 'w-64 border-r border-white/10 bg-black/20 p-4 overflow-y-auto';
  sidebar.innerHTML = `
    <p class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Node Palette</p>
    <div id="node-palette" class="space-y-2"></div>
  `;
  
  // Populate node palette
  const nodePalette = sidebar.querySelector('#node-palette');
  NODE_TYPES.forEach(nodeType => {
    const btn = document.createElement('div');
    btn.className = `p-3 rounded-lg border cursor-pointer hover:scale-105 transition-transform ${nodeType.color} text-white`;
    btn.innerHTML = `<div class="flex items-center gap-2"><span class="text-lg">${nodeType.icon}</span><span class="text-sm font-bold">${nodeType.name}</span></div>`;
    btn.dataset.nodeType = nodeType.id;
    btn.onclick = () => addNode(nodeType.id);
    nodePalette.appendChild(btn);
  });
  main.appendChild(sidebar);

  // Canvas Area
  const canvas = document.createElement('div');
  canvas.className = 'flex-1 relative bg-black/40 overflow-hidden';
  canvas.innerHTML = `
    <svg id="canvas-svg" class="absolute inset-0 w-full h-full"></svg>
    <div id="canvas-placeholder" class="absolute inset-0 flex items-center justify-center text-secondary">
      <div class="text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mx-auto mb-3 opacity-30"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <p>Drag nodes from the palette to build your workflow</p>
      </div>
    </div>
    <div id="nodes-container" class="absolute inset-0"></div>
  `;
  main.appendChild(canvas);

  // Properties Panel
  const properties = document.createElement('div');
  properties.className = 'w-80 border-l border-white/10 bg-black/20 p-4 overflow-y-auto';
  properties.innerHTML = `
    <p class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Properties</p>
    <div id="properties-content" class="text-sm text-secondary">Select a node to edit its properties</div>
  `;
  main.appendChild(properties);

  container.appendChild(main);

  // Run status overlay
  const runOverlay = document.createElement('div');
  runOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 hidden';
  runOverlay.innerHTML = `
    <div class="bg-[#111] border border-white/10 rounded-xl p-6 max-w-sm w-full mx-4">
      <div class="flex items-center gap-3 mb-4">
        <div class="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
        <span class="text-white font-bold">Running workflow...</span>
      </div>
      <div id="run-status-text" class="text-sm text-secondary">Initializing</div>
      <button id="cancel-run" class="mt-4 px-4 py-2 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Cancel</button>
    </div>
  `;
  document.body.appendChild(runOverlay);

  // Event listeners - query within container since elements aren't in document yet
  container.querySelector('#back-btn').onclick = () => window.history.back();
  container.querySelector('#run-btn').onclick = runWorkflow;
  container.querySelector('#save-btn').onclick = saveWorkflow;
  document.querySelector('#cancel-run').onclick = () => {
    runOverlay.classList.add('hidden');
    state.isRunning = false;
  };

  function addNode(type) {
    const node = {
      id: 'node_' + Date.now(),
      type: type,
      name: NODE_TYPES.find(n => n.id === type)?.name || 'Node',
      x: 100,
      y: 100,
      config: {}
    };
    state.nodes.push(node);
    renderNodes();
  }

  function renderNodes() {
    const nodesContainer = canvas.querySelector('#nodes-container');
    const placeholder = canvas.querySelector('#canvas-placeholder');
    
    if (state.nodes.length === 0) {
      placeholder.classList.remove('hidden');
      return;
    }
    placeholder.classList.add('hidden');
    
    nodesContainer.innerHTML = '';
    state.nodes.forEach(node => {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'absolute w-48 bg-white/5 border border-white/10 rounded-lg cursor-move';
      nodeEl.style.left = node.x + 'px';
      nodeEl.style.top = node.y + 'px';
      nodeEl.dataset.nodeId = node.id;
      nodeEl.innerHTML = `
        <div class="p-3 border-b border-white/10 font-bold text-sm text-white">${node.name}</div>
        <div class="p-2 text-xs text-secondary">${node.type}</div>
      `;
      
      // Make draggable
      let isDragging = false;
      let startX, startY;
      
      nodeEl.onmousedown = (e) => {
        isDragging = true;
        startX = e.clientX - node.x;
        startY = e.clientY - node.y;
        e.preventDefault();
      };
      
      document.onmousemove = (e) => {
        if (!isDragging) return;
        node.x = e.clientX - startX;
        node.y = e.clientY - startY;
        nodeEl.style.left = node.x + 'px';
        nodeEl.style.top = node.y + 'px';
      };
      
      document.onmouseup = () => {
        isDragging = false;
      };
      
      nodeEl.onclick = (e) => {
        if (isDragging) return;
        e.stopPropagation();
        selectNode(node);
      };
      
      nodesContainer.appendChild(nodeEl);
    });
  }

  function selectNode(node) {
    const propsContent = document.getElementById('properties-content');
    propsContent.innerHTML = `
      <div class="space-y-3">
        <div>
          <label class="text-xs text-secondary">Node Name</label>
          <input type="text" value="${node.name}" class="w-full px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white" />
        </div>
        <div>
          <label class="text-xs text-secondary">Type</label>
          <div class="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white">${node.type}</div>
        </div>
      </div>
    `;
  }

  async function runWorkflow() {
    if (state.nodes.length === 0) {
      alert('Add nodes to your workflow first');
      return;
    }
    
    runOverlay.classList.remove('hidden');
    state.isRunning = true;
    state.runStatus = 'running';
    
    try {
      document.getElementById('run-status-text').textContent = 'Creating workflow...';
      
      const workflow = await vibeWorkflowService.createWorkflowLocal({
        name: 'Higgsfield Workflow',
        nodes: state.nodes
      });
      
      document.getElementById('run-status-text').textContent = 'Executing workflow...';
      
      const result = await vibeWorkflowService.runWorkflow(workflow, { prompt: 'test' });
      
      state.runStatus = 'completed';
      runOverlay.classList.add('hidden');
      
      if (result.url) {
        await vibeWorkflowService.saveOutputToLibrary(result);
        if (confirm('Workflow completed! Save to Library?')) {
          handoffOutput('library', result);
        }
      }
      alert('Workflow completed! Output: ' + JSON.stringify(result).slice(0, 100));
    } catch (err) {
      state.runStatus = 'error';
      document.getElementById('run-status-text').textContent = 'Error: ' + err.message;
      setTimeout(() => runOverlay.classList.add('hidden'), 3000);
    }
  }

  async function saveWorkflow() {
    await vibeWorkflowService.saveWorkflowRun(state.currentWorkflow?.id || 'local', state);
    safeWriteStorage(STORAGE_KEY, state);
    alert('Workflow saved!');
  }

  // Initialize
  renderNodes();

  return container;
}