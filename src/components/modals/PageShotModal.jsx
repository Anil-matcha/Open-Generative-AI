import { BaseModal } from './BaseModal';

const ANNOTATION_TOOLS = [
  { id: 'rectangle', name: 'Rectangle', icon: '▢' },
  { id: 'circle', name: 'Circle', icon: '○' },
  { id: 'arrow', name: 'Arrow', icon: '→' },
  { id: 'line', name: 'Line', icon: '―' },
  { id: 'text', name: 'Text', icon: 'T' },
  { id: 'blur', name: 'Blur', icon: '▦' },
  { id: 'highlight', name: 'Highlight', icon: '▮' },
  { id: 'pen', name: 'Pen', icon: '✎' }
];

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];

const QUALITY_PRESETS = [
  { id: 'full', name: 'Full Resolution', factor: 1 },
  { id: 'high', name: 'High (70%)', factor: 0.7 },
  { id: 'medium', name: 'Medium (50%)', factor: 0.5 },
  { id: 'low', name: 'Low (30%)', factor: 0.3 }
];

export class PageShotModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Screenshot Capture',
      size: 'large',
      showFooter: false,
      ...options
    });

    this.selectedTool = 'rectangle';
    this.selectedColor = '#ef4444';
    this.brushSize = 4;
    this.quality = 'high';
    this.isCapturing = false;
    this.isDrawing = false;
    this.shapes = [];
    this.currentShape = null;
    this.selectionRegion = null;
    this.capturedImage = null;
    this.startPoint = { x: 0, y: 0 };
  }

  renderBody() {
    return `
      <div class="pageshot-container">
        <div class="pageshot-toolbar">
          <div class="toolbar-section">
            <span class="section-label">Tools</span>
            <div class="tool-grid">
              ${ANNOTATION_TOOLS.map(tool => `
                <button class="tool-btn ${this.selectedTool === tool.id ? 'active' : ''}" data-tool="${tool.id}" aria-label="${tool.name}">
                  <span class="tool-icon">${tool.icon}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="toolbar-section">
            <span class="section-label">Color</span>
            <div class="color-row">
              ${COLORS.map(color => `
                <button class="color-btn ${this.selectedColor === color ? 'active' : ''}" data-color="${color}" style="background: ${color}" aria-label="Select ${color}"></button>
              `).join('')}
            </div>
          </div>

          <div class="toolbar-section">
            <span class="section-label">Brush Size</span>
            <div class="brush-slider">
              <input type="range" class="brush-size" min="1" max="20" value="${this.brushSize}" />
              <span class="brush-value">${this.brushSize}px</span>
            </div>
          </div>
        </div>

        <div class="pageshot-viewport">
          <div class="viewport-canvas" id="pageshot-canvas">
            ${this.capturedImage ? `
              <div class="captured-frame">
                <img src="${this.capturedImage}" alt="Screenshot" class="screenshot-image" />
                <svg class="annotation-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
                  ${this.shapes.map(shape => this.renderShape(shape)).join('')}
                  ${this.currentShape ? this.renderShape(this.currentShape) : ''}
                </svg>
              </div>
            ` : `
              <div class="capture-prompt">
                <div class="prompt-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
                <h3>Ready to Capture</h3>
                <p>Click the button below to start region selection</p>
                <button class="capture-btn modal-btn modal-btn-primary">
                  <span>Start Capture</span>
                </button>
              </div>
            `}
          </div>
        </div>

        ${this.capturedImage ? `
          <div class="pageshot-actions">
            <button class="action-btn" data-action="region">
              <span class="action-icon">▢</span>
              <span>Select Region</span>
            </button>
            <button class="action-btn" data-action="retry">
              <span class="action-icon">↻</span>
              <span>New Capture</span>
            </button>
            <button class="action-btn" data-action="copy">
              <span class="action-icon">⧉</span>
              <span>Copy to Clipboard</span>
            </button>
            <button class="action-btn" data-action="download">
              <span class="action-icon">↓</span>
              <span>Download</span>
            </button>
          </div>
        ` : ''}
      </div>

      <div class="modal-footer pageshot-footer">
        <div class="footer-left">
          <div class="quality-select">
            <label>Quality:</label>
            <select class="quality-dropdown">
              ${QUALITY_PRESETS.map(q => `
                <option value="${q.id}" ${this.quality === q.id ? 'selected' : ''}>${q.name}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="footer-right">
          <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
          <button class="modal-btn modal-btn-primary" data-action="save" ${!this.capturedImage ? 'disabled' : ''}>
            Save Screenshot
          </button>
        </div>
      </div>
    `;
  }

  renderShape(shape) {
    if (shape.type === 'rectangle') {
      return `<rect x="${shape.x1}%" y="${shape.y1}%" width="${shape.x2 - shape.x1}%" height="${shape.y2 - shape.y1}%" 
              fill="none" stroke="${shape.color}" stroke-width="${shape.size}" rx="2"/>`;
    } else if (shape.type === 'circle') {
      const cx = (shape.x1 + shape.x2) / 2;
      const cy = (shape.y1 + shape.y2) / 2;
      const rx = Math.abs(shape.x2 - shape.x1) / 2;
      const ry = Math.abs(shape.y2 - shape.y1) / 2;
      return `<ellipse cx="${cx}%" cy="${cy}%" rx="${rx}%" ry="${ry}%" 
              fill="none" stroke="${shape.color}" stroke-width="${shape.size}"/>`;
    } else if (shape.type === 'arrow') {
      return `<line x1="${shape.x1}%" y1="${shape.y1}%" x2="${shape.x2}%" y2="${shape.y2}%" 
              stroke="${shape.color}" stroke-width="${shape.size}" marker-end="url(#arrowhead)"/>`;
    } else if (shape.type === 'line') {
      return `<line x1="${shape.x1}%" y1="${shape.y1}%" x2="${shape.x2}%" y2="${shape.y2}%" 
              stroke="${shape.color}" stroke-width="${shape.size}"/>`;
    } else if (shape.type === 'text') {
      return `<text x="${shape.x1}%" y="${shape.y1}%" fill="${shape.color}" font-size="12">${shape.text}</text>`;
    } else if (shape.type === 'blur') {
      return `<rect x="${shape.x1}%" y="${shape.y1}%" width="${shape.x2 - shape.x1}%" height="${shape.y2 - shape.y1}%" 
              fill="rgba(128,128,128,0.5)" filter="blur(4px)"/>`;
    }
    return '';
  }

  setupEventListeners() {
    super.setupEventListeners();

    this.overlay.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedTool = btn.dataset.tool;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedColor = btn.dataset.color;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    const brushSlider = this.overlay.querySelector('.brush-size');
    if (brushSlider) {
      brushSlider.addEventListener('input', (e) => {
        this.brushSize = parseInt(e.target.value);
        const valueSpan = brushSlider.parentElement.querySelector('.brush-value');
        if (valueSpan) valueSpan.textContent = `${this.brushSize}px`;
      });
    }

    const captureBtn = this.overlay.querySelector('.capture-btn');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => this.startCapture());
    }

    this.overlay.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'region') this.startRegionSelection();
        else if (action === 'retry') this.retryCapture();
        else if (action === 'copy') this.copyToClipboard();
        else if (action === 'download') this.downloadImage();
      });
    });

    const qualityDropdown = this.overlay.querySelector('.quality-dropdown');
    if (qualityDropdown) {
      qualityDropdown.addEventListener('change', (e) => {
        this.quality = e.target.value;
      });
    }

    this.overlay.querySelector('[data-action="save"]')?.addEventListener('click', () => this.saveScreenshot());
  }

  startCapture() {
    this.isCapturing = true;
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'monitor' } })
        .then(stream => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            this.capturedImage = canvas.toDataURL('image/png');
            stream.getTracks().forEach(track => track.stop());
            this.isCapturing = false;
            this.updateBody(this.renderBody());
            this.setupEventListeners();
          };
          video.play();
        })
        .catch(err => {
          console.error('Screen capture failed:', err);
          this.isCapturing = false;
          this.simulateCapture();
        });
    } else {
      this.simulateCapture();
    }
  }

  simulateCapture() {
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff22';
      ctx.font = '48px Inter';
      ctx.fillText('Sample Screenshot', canvas.width / 2 - 150, canvas.height / 2);
      this.capturedImage = canvas.toDataURL('image/png');
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    }, 500);
  }

  startRegionSelection() {
    this.isDrawing = true;
    const viewport = this.overlay.querySelector('.captured-frame');
    if (viewport) {
      viewport.addEventListener('mousedown', (e) => {
        const rect = viewport.getBoundingClientRect();
        this.startPoint = {
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        };
      });
      viewport.addEventListener('mouseup', (e) => {
        const rect = viewport.getBoundingClientRect();
        const endPoint = {
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        };
        this.shapes.push({
          type: this.selectedTool,
          x1: Math.min(this.startPoint.x, endPoint.x),
          y1: Math.min(this.startPoint.y, endPoint.y),
          x2: Math.max(this.startPoint.x, endPoint.x),
          y2: Math.max(this.startPoint.y, endPoint.y),
          color: this.selectedColor,
          size: this.brushSize,
          text: 'Annotation'
        });
        this.isDrawing = false;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    }
  }

  retryCapture() {
    this.capturedImage = null;
    this.shapes = [];
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  copyToClipboard() {
    if (this.capturedImage) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
        });
      };
      img.src = this.capturedImage;
    }
  }

  downloadImage() {
    if (this.capturedImage) {
      const link = document.createElement('a');
      link.download = `screenshot-${Date.now()}.png`;
      link.href = this.capturedImage;
      link.click();
    }
  }

  saveScreenshot() {
    this.onConfirm({
      action: 'screenshotCaptured',
      imageUrl: this.capturedImage,
      shapes: this.shapes,
      quality: this.quality
    });
    this.close();
  }
}

export default PageShotModal;