/**
 * Take Selector Component
 * UI for managing multiple takes per timeline clip
 * Integrated with ViMax agent system
 */

import { multiTakeSystem } from '../lib/clipVersioning.js';

export class TakeSelector {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      theme: 'electric',
      onTakeSelected: options.onTakeSelected || (() => {}),
      onTakeCompare: options.onTakeCompare || (() => {}),
      onTakeDelete: options.onTakeDelete || (() => {}),
      onGenerateTakes: options.onGenerateTakes || (() => {}),
      ...options
    };
    this.currentClipId = null;
    this.listeners = [];
  }

  initialize() {
    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    multiTakeSystem.on('takeAdded', ({ clipId, take }) => {
      if (clipId === this.currentClipId) {
        this.refreshTakeList();
      }
    });

    multiTakeSystem.on('takeSwitched', ({ clipId, take, index }) => {
      if (clipId === this.currentClipId) {
        this.updateSelectedTake(index);
        this.options.onTakeSelected({ clipId, take, index });
      }
    });

    multiTakeSystem.on('takeDeleted', ({ clipId, remainingTakes }) => {
      if (clipId === this.currentClipId) {
        this.refreshTakeList();
        this.options.onTakeDelete({ clipId, remainingTakes });
      }
    });

    multiTakeSystem.on('takeGenerationProgress', ({ clipId, current, total }) => {
      if (clipId === this.currentClipId) {
        this.updateGenerationProgress(current, total);
      }
    });

    multiTakeSystem.on('takeGenerationComplete', ({ clipId, takes }) => {
      if (clipId === this.currentClipId) {
        this.refreshTakeList();
        this.options.onGenerateTakes({ clipId, takes });
      }
    });
  }

  setClip(clipId) {
    this.currentClipId = clipId;
    this.refreshTakeList();
  }

  render() {
    this.container.innerHTML = `
      <div class="take-selector theme-${this.options.theme}">
        <div class="take-selector-header">
          <h4>Takes</h4>
          <div class="take-actions">
            <button class="take-action-btn generate-btn" title="Generate Takes">
              <span class="btn-icon">✨</span>
              <span class="btn-label">Generate</span>
            </button>
            <button class="take-action-btn compare-btn" title="Compare Takes">
              <span class="btn-icon">📊</span>
              <span class="btn-label">Compare</span>
            </button>
          </div>
        </div>

        <div class="take-list">
          <div class="take-list-empty">Select a clip to view takes</div>
        </div>

        <div class="take-generation-progress" style="display: none;">
          <div class="progress-header">
            <span class="progress-label">Generating takes...</span>
            <span class="progress-count">0/0</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
        </div>

        <div class="take-selector-footer">
          <div class="take-count">
            <span class="count-label">Total Takes:</span>
            <span class="count-value">0</span>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const generateBtn = this.container.querySelector('.generate-btn');
    const compareBtn = this.container.querySelector('.compare-btn');

    generateBtn?.addEventListener('click', () => this.showGenerateDialog());
    compareBtn?.addEventListener('click', () => this.compareTakes());
  }

  refreshTakeList() {
    const listEl = this.container.querySelector('.take-list');
    const countEl = this.container.querySelector('.count-value');

    if (!this.currentClipId) {
      listEl.innerHTML = '<div class="take-list-empty">Select a clip to view takes</div>';
      countEl.textContent = '0';
      return;
    }

    const takes = multiTakeSystem.getTakes(this.currentClipId);
    const currentTake = multiTakeSystem.getCurrentTake(this.currentClipId);

    countEl.textContent = takes.length.toString();

    if (takes.length === 0) {
      listEl.innerHTML = '<div class="take-list-empty">No takes yet. Click Generate to create takes.</div>';
      return;
    }

    listEl.innerHTML = takes.map((take, index) => this.renderTakeItem(take, index, take === currentTake)).join('');

    const takeItems = listEl.querySelectorAll('.take-item');
    takeItems.forEach((item, index) => {
      item.addEventListener('click', () => this.selectTake(index));
      
      const deleteBtn = item.querySelector('.take-delete-btn');
      deleteBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTake(index);
      });
    });
  }

  renderTakeItem(take, index, isSelected) {
    const qualityPercent = Math.round(take.metadata.quality * 100);
    const agentBadge = take.metadata.generatedBy === 'agent' 
      ? `<span class="agent-badge" title="Agent generated">🤖</span>` 
      : '';

    const selectedClass = isSelected ? 'selected' : '';
    
    return `
      <div class="take-item ${selectedClass}" data-index="${index}">
        <div class="take-item-main">
          <div class="take-number">${index + 1}</div>
          <div class="take-info">
            <div class="take-name">
              Take ${index + 1}
              ${agentBadge}
            </div>
            <div class="take-meta">
              <span class="take-quality">${qualityPercent}% quality</span>
              ${take.metadata.model ? `<span class="take-model">${take.metadata.model}</span>` : ''}
            </div>
          </div>
        </div>
        <button class="take-delete-btn" title="Delete take">×</button>
      </div>
    `;
  }

  selectTake(index) {
    if (!this.currentClipId) return;
    
    multiTakeSystem.switchTake(this.currentClipId, index);
  }

  updateSelectedTake(index) {
    const items = this.container.querySelectorAll('.take-item');
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  deleteTake(index) {
    if (!this.currentClipId) return;
    
    const confirmed = confirm('Are you sure you want to delete this take?');
    if (confirmed) {
      multiTakeSystem.deleteTake(this.currentClipId, index);
    }
  }

  async showGenerateDialog() {
    if (!this.currentClipId) return;

    const dialog = document.createElement('div');
    dialog.className = 'take-generate-dialog';
    dialog.innerHTML = `
      <div class="dialog-backdrop"></div>
      <div class="dialog-content theme-${this.options.theme}">
        <h3>Generate Takes</h3>
        
        <div class="form-group">
          <label>Number of takes</label>
          <select class="take-count-select">
            <option value="2">2 takes</option>
            <option value="3" selected>3 takes</option>
            <option value="5">5 takes</option>
            <option value="7">7 takes</option>
          </select>
        </div>

        <div class="form-group">
          <label>Generation mode</label>
          <select class="take-mode-select">
            <option value="scene">Scene variation</option>
            <option value="narrative">Narrative variation</option>
            <option value="style">Style variation</option>
          </select>
        </div>

        <div class="form-group">
          <label>Model</label>
          <select class="take-model-select">
            <option value="ltx-2-fast" selected>LTX 2 Fast</option>
            <option value="ltx-2-pro">LTX 2 Pro</option>
            <option value="ltx-2-19b">LTX 2 19B</option>
          </select>
        </div>

        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn">Cancel</button>
          <button class="dialog-btn generate-confirm-btn">Generate</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const backdrop = dialog.querySelector('.dialog-backdrop');
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const confirmBtn = dialog.querySelector('.generate-confirm-btn');

    backdrop.addEventListener('click', () => dialog.remove());
    cancelBtn.addEventListener('click', () => dialog.remove());
    confirmBtn.addEventListener('click', () => {
      const count = parseInt(dialog.querySelector('.take-count-select').value);
      const mode = dialog.querySelector('.take-mode-select').value;
      const model = dialog.querySelector('.take-model-select').value;

      dialog.remove();
      this.generateTakes(count, mode, model);
    });
  }

  async generateTakes(count, mode, model) {
    if (!this.currentClipId) return;

    this.showProgressUI();

    try {
      await multiTakeSystem.generateTakesWithAgents(this.currentClipId, {
        count,
        agentType: 'Screenwriter',
        mode,
        model,
        timelineState: this.options.timelineState
      });
    } catch (error) {
      console.error('Take generation failed:', error);
      this.hideProgressUI();
    }
  }

  showProgressUI() {
    const progressEl = this.container.querySelector('.take-generation-progress');
    if (progressEl) {
      progressEl.style.display = 'block';
    }
  }

  hideProgressUI() {
    const progressEl = this.container.querySelector('.take-generation-progress');
    if (progressEl) {
      setTimeout(() => {
        progressEl.style.display = 'none';
      }, 1500);
    }
  }

  updateGenerationProgress(current, total) {
    const progressEl = this.container.querySelector('.take-generation-progress');
    const fillEl = progressEl?.querySelector('.progress-fill');
    const countEl = progressEl?.querySelector('.progress-count');
    const labelEl = progressEl?.querySelector('.progress-label');

    const percent = (current / total) * 100;

    if (fillEl) fillEl.style.width = `${percent}%`;
    if (countEl) countEl.textContent = `${current}/${total}`;
    if (labelEl) labelEl.textContent = `Generating takes... ${Math.round(percent)}%`;
  }

  compareTakes() {
    if (!this.currentClipId) return;

    const comparison = multiTakeSystem.compareTakes(this.currentClipId);
    if (comparison) {
      this.options.onTakeCompare(comparison);
    }
  }

  showComparisonResult(comparison) {
    const resultEl = document.createElement('div');
    resultEl.className = 'take-comparison-result';
    resultEl.innerHTML = `
      <div class="comparison-header">
        <h4>Take Comparison</h4>
        <button class="close-btn">×</button>
      </div>
      <div class="comparison-content">
        ${comparison.recommendations.map(rec => `
          <div class="recommendation-item ${rec.type}">
            <span class="rec-icon">💡</span>
            <span class="rec-text">${rec.message}</span>
            <button class="rec-action-btn" data-action="${rec.action}">Apply</button>
          </div>
        `).join('')}
      </div>
    `;

    document.body.appendChild(resultEl);

    const closeBtn = resultEl.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => resultEl.remove());
  }
}

export function createTakeSelector(container, options) {
  const selector = new TakeSelector(container, options);
  selector.initialize();
  return selector;
}