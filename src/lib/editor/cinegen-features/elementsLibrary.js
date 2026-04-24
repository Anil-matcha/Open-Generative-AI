import { CineGenMuAPI } from '../cinegenMuapi.js';

export const ELEMENT_CATEGORIES = {
  CHARACTER: 'character',
  LOCATION: 'location',
  PROP: 'prop',
  VEHICLE: 'vehicle'
};

export class ElementsLibrary {
  constructor() {
    this.categories = Object.values(ELEMENT_CATEGORIES);
    this.elements = new Map();
    this.container = null;
    this.selectedElement = null;
  }

  init(container) {
    this.container = container;
    this.renderPanel();
    return this;
  }

  renderPanel() {
    const panel = document.createElement('div');
    panel.className = 'elements-library';
    panel.innerHTML = `
      <div class="elements-header">
        <h3>Elements Library</h3>
        <button class="add-element-btn">+ Add Element</button>
      </div>
      <div class="elements-tabs">
        ${this.categories.map(cat => `
          <button class="element-tab" data-category="${cat}">
            ${this.getCategoryIcon(cat)} ${cat}
          </button>
        `).join('')}
      </div>
      <div class="elements-grid"></div>
    `;

    this.setupEventListeners(panel);
    this.container.appendChild(panel);
  }

  getCategoryIcon(category) {
    const icons = {
      [ELEMENT_CATEGORIES.CHARACTER]: '👤',
      [ELEMENT_CATEGORIES.LOCATION]: '🏠',
      [ELEMENT_CATEGORIES.PROP]: '🎁',
      [ELEMENT_CATEGORIES.VEHICLE]: '🚗'
    };
    return icons[category] || '📦';
  }

  setupEventListeners(panel) {
    panel.querySelectorAll('.element-tab').forEach(tab => {
      tab.addEventListener('click', () => this.showCategory(tab.dataset.category));
    });

    panel.querySelector('.add-element-btn').addEventListener('click', () => {
      this.showCreateElementModal();
    });
  }

  showCategory(category) {
    const tabs = this.container.querySelectorAll('.element-tab');
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.category === category));

    const grid = this.container.querySelector('.elements-grid');
    const elements = this.getElementsByCategory(category);

    grid.innerHTML = elements.map(el => this.renderElementCard(el)).join('');

    grid.querySelectorAll('.element-card').forEach(card => {
      card.addEventListener('click', () => this.selectElement(card.dataset.id));
    });
  }

  getElementsByCategory(category) {
    return Array.from(this.elements.values()).filter(el => el.category === category);
  }

  renderElementCard(element) {
    const previewImage = element.panels[0] || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23333" width="100" height="100"/></svg>';
    
    return `
      <div class="element-card" data-id="${element.id}">
        <div class="element-card__preview">
          <img src="${previewImage}" alt="${element.name}">
        </div>
        <div class="element-card__info">
          <span class="element-card__name">${element.name}</span>
          <span class="element-card__count">${element.panels.length} panels</span>
        </div>
      </div>
    `;
  }

  selectElement(elementId) {
    this.selectedElement = this.elements.get(elementId);
    
    const cards = this.container.querySelectorAll('.element-card');
    cards.forEach(card => {
      card.classList.toggle('selected', card.dataset.id === elementId);
    });

    this.showElementDetail(this.selectedElement);
  }

  showElementDetail(element) {
    const detail = document.createElement('div');
    detail.className = 'element-detail-modal';
    detail.innerHTML = `
      <div class="modal-header">
        <h3>${element.name}</h3>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-body">
        <div class="element-panels">
          ${element.panels.map((panel, i) => `
            <div class="panel-item">
              <img src="${panel}" alt="Panel ${i + 1}">
              <button class="regenerate-panel" data-index="${i}">Regenerate</button>
            </div>
          `).join('')}
        </div>
        <div class="element-actions">
          <button class="btn-use-element">Use in Timeline</button>
          <button class="btn-edit-element">Edit Details</button>
        </div>
      </div>
    `;

    document.body.appendChild(detail);
    this.setupDetailEvents(detail, element);
  }

  setupDetailEvents(detail, element) {
    detail.querySelector('.modal-close').addEventListener('click', () => detail.remove());
    detail.querySelector('.btn-use-element').addEventListener('click', () => {
      this.useElementInTimeline(element);
      detail.remove();
    });

    detail.querySelectorAll('.regenerate-panel').forEach(btn => {
      btn.addEventListener('click', () => this.regeneratePanel(element, parseInt(btn.dataset.index)));
    });
  }

  async createElement(category, name, referenceImages = []) {
    const id = `element-${Date.now()}`;
    
    let panels = [];
    if (referenceImages.length > 0) {
      panels = await this.generateReferencePanels(referenceImages, category);
    }

    const element = {
      id,
      category,
      name,
      panels,
      createdAt: Date.now()
    };

    this.elements.set(id, element);
    this.showCategory(category);

    return element;
  }

  async generateReferencePanels(baseImages, category) {
    const angles = this.getCategoryAngles(category);
    const panels = [];

    for (const angle of angles) {
      try {
        const prompt = `Generate a ${angle} view reference panel for a ${category}. Use consistency from reference images.`;
        const result = await CineGenMuAPI.generateImage(prompt, 'flux-dev');
        panels.push(result.url || result);
      } catch (error) {
        console.error(`Failed to generate panel for ${angle}:`, error);
        panels.push(baseImages[0] || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23666" width="100" height="100"/></svg>');
      }
    }

    return panels;
  }

  getCategoryAngles(category) {
    switch (category) {
      case ELEMENT_CATEGORIES.CHARACTER:
        return ['front view', 'profile view', 'three-quarter view', 'back view', 'close-up detail', 'wide shot', 'action pose'];
      case ELEMENT_CATEGORIES.LOCATION:
        return ['exterior wide', 'entrance', 'interior main', 'detail feature', 'outdoor detail', 'aerial view', 'mood shot'];
      case ELEMENT_CATEGORIES.PROP:
        return ['front', 'side', 'back', 'top', 'detail', 'in-context', 'style variation'];
      case ELEMENT_CATEGORIES.VEHICLE:
        return ['front 3/4', 'side profile', 'rear 3/4', 'interior', 'detail shot', 'in-motion', 'top view'];
      default:
        return ['front', 'side', 'back', 'detail'];
    }
  }

  async regeneratePanel(element, panelIndex) {
    const category = element.category;
    const angle = this.getCategoryAngles(category)[panelIndex];

    try {
      const prompt = `Regenerate the ${angle} panel for a ${category}. Maintain visual consistency with the reference.`;
      const result = await CineGenMuAPI.generateImage(prompt, 'flux-dev');

      element.panels[panelIndex] = result.url || result;
      this.elements.set(element.id, element);

      this.showElementDetail(element);
    } catch (error) {
      console.error('Failed to regenerate panel:', error);
    }
  }

  useElementInTimeline(element) {
    const timelineData = {
      type: 'element',
      id: element.id,
      name: element.name,
      panels: element.panels
    };

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('cinegen-element-selected', { detail: timelineData }));
    }

    return timelineData;
  }

  showCreateElementModal() {
    const modal = document.createElement('div');
    modal.className = 'create-element-modal';
    modal.innerHTML = `
      <div class="modal-header">
        <h3>Create New Element</h3>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Category</label>
          <select id="element-category">
            ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="element-name" placeholder="Enter element name...">
        </div>
        <div class="form-group">
          <label>Reference Images (optional)</label>
          <input type="file" id="element-references" multiple accept="image/*">
          <div class="reference-preview"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-create">Create Element</button>
      </div>
    `;

    document.body.appendChild(modal);
    this.setupCreateModalEvents(modal);
  }

  setupCreateModalEvents(modal) {
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());

    const fileInput = modal.querySelector('#element-references');
    const preview = modal.querySelector('.reference-preview');
    let selectedFiles = [];

    fileInput.addEventListener('change', (e) => {
      selectedFiles = Array.from(e.target.files);
      preview.innerHTML = selectedFiles.map(f => `<img src="${URL.createObjectURL(f)}" class="ref-thumb">`).join('');
    });

    modal.querySelector('.btn-create').addEventListener('click', async () => {
      const category = modal.querySelector('#element-category').value;
      const name = modal.querySelector('#element-name').value;

      if (!name) {
        alert('Please enter a name');
        return;
      }

      const references = selectedFiles.map(f => URL.createObjectURL(f));
      await this.createElement(category, name, references);
      modal.remove();
    });
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.elements.clear();
  }
}

export function createElementsLibrary(container) {
  return new ElementsLibrary().init(container);
}