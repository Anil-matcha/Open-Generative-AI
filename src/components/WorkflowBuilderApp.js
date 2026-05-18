import { muapi } from '../lib/muapi.js';
import { navigate } from '../lib/router.js';

const STORAGE_KEY = 'higgsfield.workflows';
const HANDOFF_KEYS = {
  render: 'higgsfield.pendingRenderWorkflow',
  director: 'higgsfield.pendingDirectorWorkflow',
  agent: 'higgsfield.pendingWorkflowAgentOutput'
};

const NODE_TYPES = [
  { id: 'text-prompt', name: 'Text Prompt', icon: '📝', description: 'Input text prompt for generation' },
  { id: 'image-generation', name: 'Image Generation', icon: '🎨', description: 'Generate images from text' },
  { id: 'image-to-video', name: 'Image to Video', icon: '🎬', description: 'Animate images to video' },
  { id: 'video-generation', name: 'Video Generation', icon: '🎥', description: 'Generate video from text' },
  { id: 'lipsync', name: 'Lip Sync', icon: '🗣️', description: 'Sync audio to video' },
  { id: 'upscale', name: 'Upscale', icon: '🔍', description: 'Enhance resolution' },
  { id: 'edit', name: 'Edit', icon: '✏️', description: 'Edit and refine media' },
  { id: 'render', name: 'Render', icon: '📤', description: 'Export final output' },
  { id: 'director', name: 'Director', icon: '🎬', description: 'Cinematic scene planning' },
  { id: 'ai-agent', name: 'AI Agent', icon: '🤖', description: 'Run AI agent tasks' },
  { id: 'design-agent', name: 'Design Agent', icon: '✨', description: 'Generate designs' },
  { id: 'webhook', name: 'Webhook/API', icon: '🔗', description: 'Call external API' },
];

const MODELS = {
  'image-generation': ['flux-dev', 'flux-schnell', 'midjourney', 'hidream-fast'],
  'video-generation': ['veo3', 'kling-master', 'wan2.1', 'seedance-pro'],
  'lipsync': ['wav2lip', 'first-order-model'],
  'upscale': ['esrgan', 'real-esrgan', 'swinir'],
  'edit': ['lama', 'deletion', 'inpainting'],
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

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function WorkflowBuilderApp() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-hidden';

  let workflow = {
    id: createId('workflow'),
    name: 'Untitled Workflow',
    goal: '',
    category: 'Video Generation',
    steps: [],
    executionLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b border-white/10 bg-black/20';
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <button id="back-btn" class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/></svg>
      </button>
      <div>
        <p class="text-xs font-bold text-muted uppercase tracking-wider">Workflow Builder</p>
        <h1 class="text-lg font-bold text-white">AI Workflow Builder</h1>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="load-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Load</button>
      <button id="save-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20">Save</button>
      <button id="run-btn" class="px-3 py-1.5 text-xs font-bold text-black bg-primary border-none rounded-lg hover:bg-primary/80">Run</button>
    </div>
  `;
  container.appendChild(header);

  const main = document.createElement('flex-1 flex flex-col lg:flex-row overflow-hidden');
  main.className = 'flex-1 flex flex-col lg:flex-row overflow-hidden';

  const sidebar = document.createElement('div');
  sidebar.className = 'w-full lg:w-64 border-r border-white/10 bg-black/20 p-3 overflow-y-auto';
  sidebar.innerHTML = `
    <p class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Node Types</p>
    <div id="node-types" class="space-y-1"></div>
  `;

  const nodeTypesContainer = sidebar.querySelector('#node-types');
  NODE_TYPES.forEach(nt => {
    const nodeBtn = document.createElement('button');
    nodeBtn.className = 'w-full text-left p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all';
    nodeBtn.dataset.type = nt.id;
    nodeBtn.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${nt.icon}</span>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-white">${nt.name}</div>
          <div class="text-[10px] text-secondary">${nt.description}</div>
        </div>
      </div>
    `;
    nodeBtn.ondragstart = (e) => e.preventDefault();
    nodeBtn.onclick = () => addNode(nt.id);
    nodeTypesContainer.appendChild(nodeBtn);
  });

  const canvasArea = document.createElement('flex-1 flex flex-col');
  canvasArea.className = 'flex-1 flex flex-col';

  const toolbar = document.createElement('div');
  toolbar.className = 'flex items-center gap-2 p-3 border-b border-white/10 bg-black/20';
  toolbar.innerHTML = `
    <input type="text" id="workflow-name" placeholder="Workflow name..." value="${workflow.name}" class="flex-1 px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted focus:outline-none focus:border-primary/50">
    <select id="workflow-category" class="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none">
      <option value="Video Generation">Video Generation</option>
      <option value="Image Generation">Image Generation</option>
      <option value="Marketing Automation">Marketing Automation</option>
      <option value="Design Production">Design Production</option>
      <option value="Rendering Pipeline">Rendering Pipeline</option>
      <option value="Social Content">Social Content</option>
      <option value="Custom">Custom</option>
    </select>
    <button id="add-step-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Add Step</button>
  `;

  const canvas = document.createElement('div');
  canvas.className = 'flex-1 flex flex-col p-4 overflow-y-auto';
  canvas.innerHTML = `
    <div id="steps-container" class="space-y-3">
      <div class="empty-state text-center py-10">
        <p class="text-secondary text-sm">No steps yet. Add a step to begin building your workflow.</p>
      </div>
    </div>
  `;

  const footer = document.createElement('div');
  footer.className = 'p-4 border-t border-white/10 bg-black/20 flex items-center justify-between';
  footer.innerHTML = `
    <div class="text-xs text-secondary">Workflows connect AI models in automated pipelines</div>
    <div class="flex gap-2">
      <button id="export-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Export JSON</button>
      <button id="import-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Import JSON</button>
    </div>
  `;

  main.appendChild(sidebar);
  main.appendChild(canvasArea);
  canvasArea.appendChild(toolbar);
  canvasArea.appendChild(canvas);
  canvasArea.appendChild(footer);
  container.appendChild(main);

  // Event listeners
  document.getElementById('back-btn').onclick = () => window.history.back();

  document.getElementById('save-btn').onclick = saveWorkflow;
  document.getElementById('load-btn').onclick = loadWorkflow;
  document.getElementById('run-btn').onclick = runWorkflow;
  document.getElementById('add-step-btn').onclick = addStep;
  document.getElementById('export-btn').onclick = exportWorkflow;
  document.getElementById('import-btn').onclick = importWorkflow;

  canvas.addEventListener('input', (e) => {
    if (e.target.matches('.step-input')) {
      const stepId = e.target.dataset.step;
      const field = e.target.dataset.field;
      const step = workflow.steps.find(s => s.id === stepId);
      if (step) step[field] = e.target.value;
    }
  });

  canvas.addEventListener('change', (e) => {
    if (e.target.matches('.step-select')) {
      const stepId = e.target.dataset.step;
      const field = e.target.dataset.field;
      const step = workflow.steps.find(s => s.id === stepId);
      if (step) step[field] = e.target.value;
    }
  });

  canvas.addEventListener('click', (e) => {
    if (e.target.matches('[data-remove]')) {
      const id = e.target.dataset.remove;
      workflow.steps = workflow.steps.filter(s => s.id !== id);
      renderSteps();
    }
    if (e.target.matches('[data-move-up]')) {
      const id = e.target.dataset.moveUp;
      const index = workflow.steps.findIndex(s => s.id === id);
      if (index > 0) {
        const temp = workflow.steps[index];
        workflow.steps[index] = workflow.steps[index - 1];
        workflow.steps[index - 1] = temp;
        renderSteps();
      }
    }
    if (e.target.matches('[data-move-down]')) {
      const id = e.target.dataset.moveDown;
      const index = workflow.steps.findIndex(s => s.id === id);
      if (index < workflow.steps.length - 1) {
        const temp = workflow.steps[index];
        workflow.steps[index] = workflow.steps[index + 1];
        workflow.steps[index + 1] = temp;
        renderSteps();
      }
    }
    if (e.target.matches('[data-duplicate]')) {
      const id = e.target.dataset.duplicate;
      const step = workflow.steps.find(s => s.id === id);
      if (step) {
        workflow.steps.push({ ...step, id: createId('step') });
        renderSteps();
      }
    }
  });

  function addNode(type) {
    addStep(type);
  }

  function addStep(type = 'text-prompt') {
    const step = {
      id: createId('step'),
      type: type,
      label: NODE_TYPES.find(nt => nt.id === type)?.name || type,
      model: MODELS[type]?.[0] || '',
      input: {},
      config: {},
      status: 'pending'
    };
    workflow.steps.push(step);
    renderSteps();
  }

  function renderSteps() {
    const container = document.getElementById('steps-container');
    if (!container) return;

    if (workflow.steps.length === 0) {
      container.innerHTML = '<div class="empty-state text-center py-10"><p class="text-secondary text-sm">No steps yet. Add a step to begin building your workflow.</p></div>';
      return;
    }

    container.innerHTML = '';
    workflow.steps.forEach((step, index) => {
      const stepEl = document.createElement('div');
      stepEl.className = 'flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10';
      stepEl.innerHTML = `
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs">${index + 1}</div>
        <div class="flex-1">
          <input type="text" class="step-input text-sm font-bold text-white bg-transparent border-none focus:outline-none w-full" data-step="${step.id}" data-field="label" value="${step.label || step.type}">
          <select class="step-select text-[10px] text-secondary bg-transparent border-none focus:outline-none w-full mt-1" data-step="${step.id}" data-field="type">
            ${NODE_TYPES.map(nt => `<option value="${nt.id}" ${nt.id === step.type ? 'selected' : ''}>${nt.name}</option>`).join('')}
          </select>
          ${MODELS[step.type] ? `
          <select class="step-select text-[10px] text-muted bg-transparent border-none focus:outline-none w-full mt-1" data-step="${step.id}" data-field="model">
            ${MODELS[step.type].map(m => `<option value="${m}" ${m === step.model ? 'selected' : ''}>${m}</option>`).join('')}
          </select>` : ''}
        </div>
        <div class="flex gap-1">
          <button data-move-up="${step.id}" class="w-6 h-6 rounded bg-white/10 text-white/70 hover:bg-white/20">↑</button>
          <button data-move-down="${step.id}" class="w-6 h-6 rounded bg-white/10 text-white/70 hover:bg-white/20">↓</button>
          <button data-duplicate="${step.id}" class="w-6 h-6 rounded bg-white/10 text-white/70 hover:bg-white/20">⎘</button>
          <button data-remove="${step.id}" class="w-6 h-6 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">×</button>
        </div>
      `;
      container.appendChild(stepEl);
    });
  }

  function saveWorkflow() {
    workflow.name = document.getElementById('workflow-name').value;
    workflow.category = document.getElementById('workflow-category').value;
    workflow.updatedAt = new Date().toISOString();
    const saved = safeReadStorage(STORAGE_KEY, []);
    saved.push(workflow);
    safeWriteStorage(STORAGE_KEY, saved);
  }

  function loadWorkflow() {
    const saved = safeReadStorage(STORAGE_KEY, []);
    if (saved.length > 0) {
      workflow = saved[saved.length - 1];
      document.getElementById('workflow-name').value = workflow.name;
      document.getElementById('workflow-category').value = workflow.category;
      renderSteps();
    }
  }

  function exportWorkflow() {
    const data = JSON.stringify(workflow, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name || 'workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importWorkflow() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            workflow = JSON.parse(event.target.result);
            document.getElementById('workflow-name').value = workflow.name;
            document.getElementById('workflow-category').value = workflow.category;
            renderSteps();
          } catch (err) {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  function runWorkflow() {
    saveWorkflow();
    workflow.executionLog = [];
    
    workflow.steps.forEach((step, index) => {
      workflow.executionLog.push({ step: step.id, status: 'running', startedAt: new Date().toISOString() });
      
      setTimeout(() => {
        workflow.executionLog = workflow.executionLog.map(log => 
          log.step === step.id ? { ...log, status: 'completed', finishedAt: new Date().toISOString() } : log
        );
      }, 1000);
    });

    // After completion, offer to send to render/director
    setTimeout(() => {
      const modal = confirm('Workflow completed! Send to Render Studio?');
      if (modal) {
        safeWriteStorage(HANDOFF_KEYS.render, JSON.stringify(workflow));
        navigate('render');
      }
    }, workflow.steps.length * 1000 + 500);
  }

  return container;
}
