import { BaseModal } from './BaseModal';

const ASPECT_RATIOS = [
  { id: 'free', name: 'Free', ratio: null, icon: '✥' },
  { id: '1:1', name: 'Square', ratio: '1:1', icon: '1:1' },
  { id: '4:3', name: 'Standard', ratio: '4:3', icon: '4:3' },
  { id: '16:9', name: 'Landscape', ratio: '16:9', icon: '16:9' },
  { id: '9:16', name: 'Portrait', ratio: '9:16', icon: '9:16' },
  { id: '3:2', name: 'Photo', ratio: '3:2', icon: '3:2' },
  { id: '21:9', name: 'Cinematic', ratio: '21:9', icon: '21:9' }
];

const ROTATION_PRESETS = [
  { id: 'rotateLeft', degrees: -90, icon: '↺', label: '-90°' },
  { id: 'rotateRight', degrees: 90, icon: '↻', label: '+90°' },
  { id: 'flipH', degrees: 180, icon: '↔', label: 'Flip H' },
  { id: 'flipV', degrees: 180, icon: '↕', label: 'Flip V' }
];

export class ImageCropperModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Crop Image',
      size: 'large',
      showFooter: false,
      ...options
    });

    this.imageUrl = options.imageUrl || '';
    this.aspectRatio = 'free';
    this.rotation = 0;
    this.flipH = false;
    this.flipV = false;
    this.zoom = 1;
    this.cropBox = { x: 0, y: 0, width: 100, height: 100 };
    this.isDragging = false;
    this.isResizing = false;
    this.dragStart = { x: 0, y: 0 };
    this.minSize = 20;
    this.isApplying = false;
    this.originalImageSize = { width: 1920, height: 1080 };
  }

  renderBody() {
    return `
      <div class="cropper-container">
        <div class="cropper-workspace">
          <div class="cropper-canvas">
            <div class="image-container" style="transform: scale(${this.zoom}) rotate(${this.rotation}deg) ${this.flipH ? 'scaleX(-1)' : ''} ${this.flipV ? 'scaleY(-1)' : ''}">
              ${this.imageUrl ? `
                <img src="${this.imageUrl}" alt="Crop preview" class="crop-image" />
              ` : `
                <div class="image-placeholder">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p>No image loaded</p>
                </div>
              `}
            </div>
            <div class="crop-overlay">
              <div class="crop-box" 
                   style="left: ${this.cropBox.x}%; top: ${this.cropBox.y}%; width: ${this.cropBox.width}%; height: ${this.cropBox.height}%;"
                   data-crop-box>
                <div class="crop-area"></div>
                <div class="crop-handle nw" data-handle="nw"></div>
                <div class="crop-handle n" data-handle="n"></div>
                <div class="crop-handle ne" data-handle="ne"></div>
                <div class="crop-handle e" data-handle="e"></div>
                <div class="crop-handle se" data-handle="se"></div>
                <div class="crop-handle s" data-handle="s"></div>
                <div class="crop-handle sw" data-handle="sw"></div>
                <div class="crop-handle w" data-handle="w"></div>
                <div class="center-mark h"></div>
                <div class="center-mark v"></div>
              </div>
              <div class="dark-overlay top" style="top: 0; height: ${this.cropBox.y}%;"></div>
              <div class="dark-overlay bottom" style="top: ${this.cropBox.y + this.cropBox.height}%; height: ${100 - this.cropBox.y - this.cropBox.height}%;"></div>
              <div class="dark-overlay left" style="top: ${this.cropBox.y}%; height: ${this.cropBox.height}%; left: 0; width: ${this.cropBox.x}%;"></div>
              <div class="dark-overlay right" style="top: ${this.cropBox.y}%; height: ${this.cropBox.height}%; left: ${this.cropBox.x + this.cropBox.width}%; width: ${100 - this.cropBox.x - this.cropBox.width}%;"></div>
            </div>
          </div>

          <div class="cropper-zoom">
            <button class="zoom-btn zoom-out" aria-label="Zoom out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <input type="range" class="zoom-slider" min="0.5" max="3" step="0.1" value="${this.zoom}" />
            <button class="zoom-btn zoom-in" aria-label="Zoom in">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <span class="zoom-value">${Math.round(this.zoom * 100)}%</span>
          </div>
        </div>

        <div class="cropper-sidebar">
          <div class="sidebar-section">
            <h4>Aspect Ratio</h4>
            <div class="aspect-grid">
              ${ASPECT_RATIOS.map(ratio => `
                <button class="aspect-btn ${this.aspectRatio === ratio.id ? 'active' : ''}" data-ratio="${ratio.id}" aria-label="${ratio.name}">
                  <span class="aspect-icon">${ratio.icon}</span>
                  <span class="aspect-name">${ratio.name}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="sidebar-section">
            <h4>Rotation</h4>
            <div class="rotation-controls">
              ${ROTATION_PRESETS.map(preset => `
                <button class="rotation-btn" data-rotation="${preset.id}" aria-label="${preset.label}">
                  <span class="rotation-icon">${preset.icon}</span>
                  <span class="rotation-label">${preset.label}</span>
                </button>
              `).join('')}
            </div>
            <div class="rotation-slider-group">
              <input type="range" class="rotation-slider" min="-180" max="180" value="${this.rotation}" />
              <span class="rotation-value">${this.rotation}°</span>
            </div>
          </div>

          <div class="sidebar-section">
            <h4>Transform</h4>
            <div class="transform-options">
              <button class="transform-btn ${this.flipH ? 'active' : ''}" data-flip="h" aria-label="Flip horizontal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 3v18M16 7l5 5-5 5M8 7l-5 5 5 5"/>
                </svg>
                <span>Flip H</span>
              </button>
              <button class="transform-btn ${this.flipV ? 'active' : ''}" data-flip="v" aria-label="Flip vertical">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12h18M7 8l5-5 5 5M7 16l5 5 5-5"/>
                </svg>
                <span>Flip V</span>
              </button>
            </div>
          </div>

          <div class="sidebar-section">
            <h4>Crop Info</h4>
            <div class="crop-info">
              <div class="info-row">
                <span>Selection</span>
                <span>${Math.round(this.cropBox.width)}% × ${Math.round(this.cropBox.height)}%</span>
              </div>
              <div class="info-row">
                <span>Output Size</span>
                <span>${Math.round(this.originalImageSize.width * this.cropBox.width / 100)} × ${Math.round(this.originalImageSize.height * this.cropBox.height / 100)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer cropper-footer">
        <button class="modal-btn modal-btn-secondary reset-crop-btn">Reset All</button>
        <div class="footer-right">
          <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
          <button class="modal-btn modal-btn-primary apply-crop-btn" ${this.isApplying ? 'disabled' : ''}>
            ${this.isApplying ? '<span class="btn-spinner"></span> Applying...' : 'Apply Crop'}
          </button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    const cropBox = this.overlay.querySelector('[data-crop-box]');
    if (cropBox) {
      cropBox.addEventListener('mousedown', (e) => this.startDrag(e, cropBox));
      cropBox.addEventListener('touchstart', (e) => this.startDrag(e, cropBox), { passive: false });
    }

    this.overlay.querySelectorAll('.crop-handle').forEach(handle => {
      handle.addEventListener('mousedown', (e) => this.startResize(e, handle.dataset.handle));
      handle.addEventListener('touchstart', (e) => this.startResize(e, handle.dataset.handle), { passive: false });
    });

    this.overlay.addEventListener('mousemove', (e) => this.onDrag(e));
    this.overlay.addEventListener('touchmove', (e) => this.onDrag(e), { passive: false });
    this.overlay.addEventListener('mouseup', () => this.stopDrag());
    this.overlay.addEventListener('touchend', () => this.stopDrag());

    this.overlay.querySelectorAll('.aspect-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.aspectRatio = btn.dataset.ratio;
        if (this.aspectRatio !== 'free') {
          this.applyAspectRatio();
        }
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.rotation-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rotationId = btn.dataset.rotation;
        if (rotationId === 'rotateLeft') this.rotation -= 90;
        else if (rotationId === 'rotateRight') this.rotation += 90;
        else if (rotationId === 'flipH') this.flipH = !this.flipH;
        else if (rotationId === 'flipV') this.flipV = !this.flipV;
        this.normalizeRotation();
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.transform-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const flipType = btn.dataset.flip;
        if (flipType === 'h') this.flipH = !this.flipH;
        else if (flipType === 'v') this.flipV = !this.flipV;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    const rotationSlider = this.overlay.querySelector('.rotation-slider');
    if (rotationSlider) {
      rotationSlider.addEventListener('input', (e) => {
        this.rotation = parseInt(e.target.value);
        const valueSpan = rotationSlider.parentElement.querySelector('.rotation-value');
        if (valueSpan) valueSpan.textContent = `${this.rotation}°`;
      });
    }

    const zoomSlider = this.overlay.querySelector('.zoom-slider');
    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        this.zoom = parseFloat(e.target.value);
        const zoomValue = this.overlay.querySelector('.zoom-value');
        if (zoomValue) zoomValue.textContent = `${Math.round(this.zoom * 100)}%`;
        const zoomIn = this.overlay.querySelector('.zoom-in');
        const zoomOut = this.overlay.querySelector('.zoom-out');
        if (zoomIn) zoomIn.onclick = () => { this.zoom = Math.min(3, this.zoom + 0.1); this.updateBody(this.renderBody()); this.setupEventListeners(); };
        if (zoomOut) zoomOut.onclick = () => { this.zoom = Math.max(0.5, this.zoom - 0.1); this.updateBody(this.renderBody()); this.setupEventListeners(); };
      });
    }

    const zoomIn = this.overlay.querySelector('.zoom-in');
    if (zoomIn) {
      zoomIn.addEventListener('click', () => {
        this.zoom = Math.min(3, this.zoom + 0.1);
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    }

    const zoomOut = this.overlay.querySelector('.zoom-out');
    if (zoomOut) {
      zoomOut.addEventListener('click', () => {
        this.zoom = Math.max(0.5, this.zoom - 0.1);
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    }

    const resetBtn = this.overlay.querySelector('.reset-crop-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetAll());
    }

    const applyBtn = this.overlay.querySelector('.apply-crop-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyCrop());
    }
  }

  startDrag(e, box) {
    if (e.target.classList.contains('crop-handle')) return;
    e.preventDefault();
    this.isDragging = true;
    const point = e.touches ? e.touches[0] : e;
    this.dragStart = { x: point.clientX, y: point.clientY, boxX: this.cropBox.x, boxY: this.cropBox.y };
  }

  startResize(e, handle) {
    e.preventDefault();
    e.stopPropagation();
    this.isResizing = handle;
    const point = e.touches ? e.touches[0] : e;
    this.dragStart = { x: point.clientX, y: point.clientY, ...this.cropBox };
  }

  onDrag(e) {
    if (!this.isDragging && !this.isResizing) return;
    e.preventDefault();

    const point = e.touches ? e.touches[0] : e;
    const dx = (point.clientX - this.dragStart.x) / this.overlay.querySelector('.cropper-canvas').offsetWidth * 100;
    const dy = (point.clientY - this.dragStart.y) / this.overlay.querySelector('.cropper-canvas').offsetHeight * 100;

    if (this.isDragging) {
      let newX = this.dragStart.boxX + dx;
      let newY = this.dragStart.boxY + dy;
      newX = Math.max(0, Math.min(100 - this.cropBox.width, newX));
      newY = Math.max(0, Math.min(100 - this.cropBox.height, newY));
      this.cropBox.x = newX;
      this.cropBox.y = newY;
    } else if (this.isResizing) {
      this.resizeCropBox(this.isResizing, dx, dy);
    }

    this.updateCropVisuals();
  }

  resizeCropBox(handle, dx, dy) {
    const { x, y, width, height } = this.dragStart;
    let newX = x, newY = y, newW = width, newH = height;

    if (handle.includes('e')) newW = Math.max(this.minSize, Math.min(100 - x, width + dx));
    if (handle.includes('w')) {
      newW = Math.max(this.minSize, width - dx);
      newX = x + dx;
      if (newX < 0) { newX = 0; newW = x + width; }
    }
    if (handle.includes('s')) newH = Math.max(this.minSize, Math.min(100 - y, height + dy));
    if (handle.includes('n')) {
      newH = Math.max(this.minSize, height - dy);
      newY = y + dy;
      if (newY < 0) { newY = 0; newH = y + height; }
    }

    if (this.aspectRatio !== 'free') {
      const ratio = this.parseAspectRatio(this.aspectRatio);
      if (ratio) {
        const targetWidth = newH * ratio;
        if (handle.includes('e') || handle.includes('w')) {
          newW = targetWidth;
        } else {
          newW = targetWidth;
          newH = newW / ratio;
        }
        newW = Math.max(this.minSize, Math.min(100, newW));
        newH = Math.max(this.minSize, Math.min(100, newH));
      }
    }

    this.cropBox = { x: newX, y: newY, width: newW, height: newH };
  }

  parseAspectRatio(ratio) {
    if (!ratio) return null;
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
  }

  applyAspectRatio() {
    if (this.aspectRatio === 'free') return;

    const ratio = this.parseAspectRatio(this.aspectRatio);
    if (!ratio) return;

    const centerX = this.cropBox.x + this.cropBox.width / 2;
    const centerY = this.cropBox.y + this.cropBox.height / 2;

    let newHeight = this.cropBox.height;
    let newWidth = newHeight * ratio;

    if (newWidth > 100) {
      newWidth = 100;
      newHeight = newWidth / ratio;
    }

    if (newHeight > 100) {
      newHeight = 100;
      newWidth = newHeight * ratio;
    }

    this.cropBox.width = Math.max(this.minSize, newWidth);
    this.cropBox.height = Math.max(this.minSize, newHeight);
    this.cropBox.x = Math.max(0, Math.min(100 - this.cropBox.width, centerX - this.cropBox.width / 2));
    this.cropBox.y = Math.max(0, Math.min(100 - this.cropBox.height, centerY - this.cropBox.height / 2));
  }

  stopDrag() {
    this.isDragging = false;
    this.isResizing = false;
  }

  updateCropVisuals() {
    const cropBox = this.overlay.querySelector('.crop-box');
    if (cropBox) {
      cropBox.style.left = `${this.cropBox.x}%`;
      cropBox.style.top = `${this.cropBox.y}%`;
      cropBox.style.width = `${this.cropBox.width}%`;
      cropBox.style.height = `${this.cropBox.height}%`;
    }

    const darkOverlays = this.overlay.querySelectorAll('.dark-overlay');
    if (darkOverlays.length >= 4) {
      darkOverlays[0].style.height = `${this.cropBox.y}%`;
      darkOverlays[1].style.top = `${this.cropBox.y + this.cropBox.height}%`;
      darkOverlays[1].style.height = `${100 - this.cropBox.y - this.cropBox.height}%`;
      darkOverlays[2].style.top = `${this.cropBox.y}%`;
      darkOverlays[2].style.height = `${this.cropBox.height}%`;
      darkOverlays[2].style.width = `${this.cropBox.x}%`;
      darkOverlays[3].style.top = `${this.cropBox.y}%`;
      darkOverlays[3].style.height = `${this.cropBox.height}%`;
      darkOverlays[3].style.left = `${this.cropBox.x + this.cropBox.width}%`;
      darkOverlays[3].style.width = `${100 - this.cropBox.x - this.cropBox.width}%`;
    }
  }

  normalizeRotation() {
    while (this.rotation > 180) this.rotation -= 360;
    while (this.rotation < -180) this.rotation += 360;
  }

  resetAll() {
    this.aspectRatio = 'free';
    this.rotation = 0;
    this.flipH = false;
    this.flipV = false;
    this.zoom = 1;
    this.cropBox = { x: 0, y: 0, width: 100, height: 100 };
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  applyCrop() {
    this.isApplying = true;
    this.updateBody(this.renderBody());
    this.setupEventListeners();

    setTimeout(() => {
      this.onConfirm({
        action: 'cropApplied',
        cropBox: this.cropBox,
        rotation: this.rotation,
        flipH: this.flipH,
        flipV: this.flipV,
        zoom: this.zoom,
        aspectRatio: this.aspectRatio,
        outputSize: {
          width: Math.round(this.originalImageSize.width * this.cropBox.width / 100),
          height: Math.round(this.originalImageSize.height * this.cropBox.height / 100)
        }
      });
      this.close();
    }, 500);
  }
}

export default ImageCropperModal;
