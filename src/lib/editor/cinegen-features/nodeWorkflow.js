import { CineGenMuAPI } from '../cinegenMuapi.js';

export const NODE_TYPES = {
  PROMPT: 'prompt',
  MODEL: 'model',
  ELEMENT: 'element',
  COMPOSITION_PLAN: 'composition-plan',
  FILE_PICKER: 'file-picker',
  ASSET_OUTPUT: 'asset-output'
};

export const MODEL_CATEGORIES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio'
};

export class NodeWorkflow {
  constructor(container) {
    this.container = container;
    this.nodes = new Map();
    this.edges = [];
    this.canvas = null;
    this.selectedNode = null;
  }

  init() {
    this.canvas = document.createElement('div');
    this.canvas.className = 'node-workflow-canvas';
    this.canvas.innerHTML = `
      <div class="node-workflow-sidebar">
        <div class="node-category" data-category="prompt">Prompt</div>
        <div class="node-category" data-category="image">Image Models</div>
        <div class="node-category" data-category="video">Video Models</div>
        <div class="node-category" data-category="audio">Audio Models</div>
        <div class="node-category" data-category="utility">Utility Nodes</div>
      </div>
      <div class="node-workflow-canvas-area">
        <div class="node-canvas" id="node-canvas"></div>
      </div>
    `;
    this.container.appendChild(this.canvas);
    this.setupEventListeners();
    return this;
  }

  setupEventListeners() {
    const sidebar = this.canvas.querySelector('.node-workflow-sidebar');
    sidebar.addEventListener('click', (e) => {
      if (e.target.classList.contains('node-category')) {
        this.showNodePalette(e.target.dataset.category);
      }
    });

    const canvasArea = this.canvas.querySelector('.node-canvas');
    canvasArea.addEventListener('dragover', (e) => e.preventDefault());
    canvasArea.addEventListener('drop', (e) => {
      const nodeData = e.dataTransfer.getData('application/json');
      if (nodeData) {
        const node = JSON.parse(nodeData);
        this.addNode(node.type, node.config, e.offsetX, e.offsetY);
      }
    });
  }

  showNodePalette(category) {
    const models = this.getModelsForCategory(category);
    const palette = document.createElement('div');
    palette.className = 'node-palette';
    palette.innerHTML = models.map(m => `
      <div class="palette-item" draggable="true" data-type="${m.type}" data-config='${JSON.stringify(m)}'>
        <span class="palette-icon">${m.icon}</span>
        <span class="palette-name">${m.name}</span>
      </div>
    `).join('');

    document.body.appendChild(palette);
    palette.style.position = 'absolute';
    palette.style.left = '200px';
    palette.style.top = '100px';

    palette.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('application/json', item.dataset.config);
      });
    });

    setTimeout(() => {
      palette.addEventListener('click', () => palette.remove());
    }, 3000);
  }

  getModelsForCategory(category) {
    const imageModels = [
      { type: NODE_TYPES.MODEL, name: 'FLUX Dev', icon: '🖼️', config: { model: 'flux-dev', category: MODEL_CATEGORIES.IMAGE } },
      { type: NODE_TYPES.MODEL, name: 'FLUX 2 Max', icon: '🖼️', config: { model: 'flux-2-max', category: MODEL_CATEGORIES.IMAGE } },
      { type: NODE_TYPES.MODEL, name: 'SD3 Medium', icon: '🖼️', config: { model: 'sd3-medium', category: MODEL_CATEGORIES.IMAGE } },
      { type: NODE_TYPES.MODEL, name: 'Wan 2.7 T2I', icon: '🖼️', config: { model: 'wan2.7-text-to-image-pro', category: MODEL_CATEGORIES.IMAGE } },
    ];

    const videoModels = [
      { type: NODE_TYPES.MODEL, name: 'Wan 2.1', icon: '🎬', config: { model: 'wan2.1-text-to-video', category: MODEL_CATEGORIES.VIDEO } },
      { type: NODE_TYPES.MODEL, name: 'Kling 3.0', icon: '🎬', config: { model: 'kling-v3.0-pro-text-to-video', category: MODEL_CATEGORIES.VIDEO } },
      { type: NODE_TYPES.MODEL, name: 'Veo 3.1', icon: '🎬', config: { model: 'veo3.1-text-to-video', category: MODEL_CATEGORIES.VIDEO } },
      { type: NODE_TYPES.MODEL, name: 'Runway Gen-4', icon: '🎬', config: { model: 'runway-text-to-video', category: MODEL_CATEGORIES.VIDEO } },
      { type: NODE_TYPES.MODEL, name: 'Runway Motion', icon: '🎬', config: { model: 'runway-motion', category: MODEL_CATEGORIES.VIDEO } },
      { type: NODE_TYPES.MODEL, name: 'Veo Advanced I2V', icon: '🎬', config: { model: 'veo-advanced-i2v', category: MODEL_CATEGORIES.VIDEO } },
    ];

    const audioModels = [
      { type: NODE_TYPES.MODEL, name: 'Music Generation', icon: '🎵', config: { model: 'music-generation', category: MODEL_CATEGORIES.AUDIO } },
    ];

    const utilityNodes = [
      { type: NODE_TYPES.PROMPT, name: 'Prompt Node', icon: '💬', config: { placeholder: 'Enter your prompt...' } },
      { type: NODE_TYPES.ELEMENT, name: 'Element Reference', icon: '👤', config: {} },
      { type: NODE_TYPES.COMPOSITION_PLAN, name: 'Composition Plan', icon: '📋', config: {} },
      { type: NODE_TYPES.FILE_PICKER, name: 'File Picker', icon: '📁', config: {} },
      { type: NODE_TYPES.ASSET_OUTPUT, name: 'Asset Output', icon: '📤', config: {} },
    ];

    switch (category) {
      case 'prompt': return utilityNodes.filter(n => n.type === NODE_TYPES.PROMPT);
      case 'image': return imageModels;
      case 'video': return videoModels;
      case 'audio': return audioModels;
      case 'utility': return utilityNodes.filter(n => n.type !== NODE_TYPES.MODEL);
      default: return [];
    }
  }

  addNode(type, config, x = 100, y = 100) {
    const id = `node-${Date.now()}`;
    const node = {
      id,
      type,
      config,
      x,
      y,
      outputs: [],
      inputs: []
    };

    this.nodes.set(id, node);
    this.renderNode(node);
    return node;
  }

  renderNode(node) {
    const canvas = this.canvas.querySelector('.node-canvas');
    const nodeEl = document.createElement('div');
    nodeEl.className = `workflow-node workflow-node--${node.type}`;
    nodeEl.id = node.id;
    nodeEl.style.left = `${node.x}px`;
    nodeEl.style.top = `${node.y}px`;

    const icon = this.getNodeIcon(node.type, node.config);
    const name = this.getNodeName(node.type, node.config);

    nodeEl.innerHTML = `
      <div class="workflow-node__header">
        <span class="workflow-node__icon">${icon}</span>
        <span class="workflow-node__name">${name}</span>
      </div>
      <div class="workflow-node__body">
        ${this.getNodeInputs(node)}
        ${this.getNodeOutputs(node)}
      </div>
      <div class="workflow-node__actions">
        <button class="execute-btn" data-node-id="${node.id}">Execute</button>
      </div>
    `;

    this.setupNodeDrag(nodeEl, node);
    canvas.appendChild(nodeEl);

    nodeEl.querySelector('.execute-btn').addEventListener('click', () => {
      this.executeNode(node.id);
    });
  }

  getNodeIcon(type, config) {
    if (type === NODE_TYPES.MODEL) {
      switch (config.category) {
        case MODEL_CATEGORIES.IMAGE: return '🖼️';
        case MODEL_CATEGORIES.VIDEO: return '🎬';
        case MODEL_CATEGORIES.AUDIO: return '🎵';
      }
    }
    const icons = {
      [NODE_TYPES.PROMPT]: '💬',
      [NODE_TYPES.ELEMENT]: '👤',
      [NODE_TYPES.COMPOSITION_PLAN]: '📋',
      [NODE_TYPES.FILE_PICKER]: '📁',
      [NODE_TYPES.ASSET_OUTPUT]: '📤'
    };
    return icons[type] || '⬛';
  }

  getNodeName(type, config) {
    if (type === NODE_TYPES.MODEL && config.model) {
      const modelNames = {
        'flux-dev': 'FLUX Dev',
        'flux-2-max': 'FLUX 2 Max',
        'sd3-medium': 'SD3 Medium',
        'wan2.1-text-to-video': 'Wan 2.1',
        'wan2.7-text-to-image-pro': 'Wan 2.7 T2I',
        'kling-v3.0-pro-text-to-video': 'Kling 3.0',
        'veo3.1-text-to-video': 'Veo 3.1',
        'runway-text-to-video': 'Runway Gen-4',
        'runway-motion': 'Runway Motion',
        'veo-advanced-i2v': 'Veo Advanced I2V',
        'music-generation': 'Music Gen'
      };
      return modelNames[config.model] || config.model;
    }
    const names = {
      [NODE_TYPES.PROMPT]: 'Prompt',
      [NODE_TYPES.ELEMENT]: 'Element',
      [NODE_TYPES.COMPOSITION_PLAN]: 'Composition',
      [NODE_TYPES.FILE_PICKER]: 'File',
      [NODE_TYPES.ASSET_OUTPUT]: 'Output'
    };
    return names[type] || 'Node';
  }

  getNodeInputs(node) {
    if (node.type === NODE_TYPES.MODEL) return '<div class="workflow-node__input-port" data-port="input"></div>';
    return '';
  }

  getNodeOutputs(node) {
    if (node.type === NODE_TYPES.ASSET_OUTPUT) return '';
    return '<div class="workflow-node__output-port" data-port="output"></div>';
  }

  setupNodeDrag(nodeEl, node) {
    let isDragging = false;
    let startX, startY, nodeStartX, nodeStartY;

    nodeEl.addEventListener('mousedown', (e) => {
      if (e.target.closest('.workflow-node__actions')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      nodeStartX = node.x;
      nodeStartY = node.y;
      nodeEl.style.zIndex = 1000;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      nodeEl.style.left = `${nodeStartX + dx}px`;
      nodeEl.style.top = `${nodeStartY + dy}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        node.x = nodeStartX + (parseInt(nodeEl.style.left) - nodeStartX);
        node.y = nodeStartY + (parseInt(nodeEl.style.top) - nodeStartY);
      }
    });
  }

  connectNodes(sourceId, targetId) {
    this.edges.push({ source: sourceId, target: targetId });
    this.renderEdge(sourceId, targetId);
  }

  renderEdge(sourceId, targetId) {
    const canvas = this.canvas.querySelector('.node-canvas');
    const sourceEl = document.getElementById(sourceId);
    const targetEl = document.getElementById(targetId);

    if (!sourceEl || !targetEl) return;

    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const line = document.createElement('div');
    line.className = 'workflow-edge';
    line.dataset.source = sourceId;
    line.dataset.target = targetId;

    const x1 = sourceRect.right - canvasRect.left;
    const y1 = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
    const x2 = targetRect.left - canvasRect.left;
    const y2 = targetRect.top + targetRect.height / 2 - canvasRect.top;

    line.style.position = 'absolute';
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.width = `${Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))}px`;
    line.style.height = '2px';
    line.style.backgroundColor = '#6366f1';
    line.style.transformOrigin = 'left center';
    line.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;

    canvas.appendChild(line);
  }

  async executeNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const nodeEl = document.getElementById(nodeId);
    nodeEl.classList.add('executing');

    try {
      let result;
      if (node.type === NODE_TYPES.MODEL) {
        const inputNode = this.getInputNode(nodeId);
        const prompt = inputNode ? this.getNodeOutput(inputNode.id) : 'default prompt';

        if (node.config.category === MODEL_CATEGORIES.VIDEO) {
          result = await CineGenMuAPI.generateVideo(prompt, node.config.model);
        } else if (node.config.category === MODEL_CATEGORIES.IMAGE) {
          result = await CineGenMuAPI.generateImage(prompt, node.config.model);
        } else if (node.config.category === MODEL_CATEGORIES.AUDIO) {
          result = await CineGenMuAPI.generateMusic({}, { prompt });
        }
      }
      this.updateNodeOutput(nodeId, result);
    } catch (error) {
      console.error('Node execution failed:', error);
      nodeEl.classList.add('error');
    } finally {
      nodeEl.classList.remove('executing');
    }
  }

  async executeWorkflow() {
    const sortedNodes = this.topologicalSort();
    const results = {};

    for (const nodeId of sortedNodes) {
      await this.executeNode(nodeId);
      const node = this.nodes.get(nodeId);
      results[nodeId] = this.getNodeOutput(nodeId);
    }

    return results;
  }

  topologicalSort() {
    const visited = new Set();
    const sorted = [];

    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const outgoingEdges = this.edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        visit(edge.target);
      }

      sorted.push(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      visit(nodeId);
    }

    return sorted;
  }

  getInputNode(nodeId) {
    const inputEdge = this.edges.find(e => e.target === nodeId);
    return inputEdge ? this.nodes.get(inputEdge.source) : null;
  }

  getNodeOutput(nodeId) {
    const nodeEl = document.getElementById(nodeId);
    return nodeEl ? nodeEl.dataset.output : null;
  }

  updateNodeOutput(nodeId, output) {
    const nodeEl = document.getElementById(nodeId);
    if (nodeEl) {
      nodeEl.dataset.output = JSON.stringify(output);
      nodeEl.classList.add('completed');
    }
  }

  destroy() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.nodes.clear();
    this.edges = [];
  }
}

export function createNodeEditor(container) {
  return new NodeWorkflow(container).init();
}