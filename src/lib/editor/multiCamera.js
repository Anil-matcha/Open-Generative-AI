/**
 * Multi-Camera Editing Module
 * Handles PIP, split-screen, and camera angle management for the timeline editor
 */

export function renderMultiCameraToolbar(state, container) {
  if (!container) return;

  container.innerHTML = '';

  // Multi-camera mode toggle
  const multiCameraBtn = document.createElement('button');
  multiCameraBtn.className = `tool-btn ${state.multiCameraMode ? 'active' : ''}`;
  multiCameraBtn.innerHTML = '<span class="emoji">📺</span><span>Multi-Camera</span>';
  multiCameraBtn.title = 'Toggle multi-camera editing mode';
  multiCameraBtn.setAttribute('data-tooltip', 'Multi-Camera Mode: Toggle multi-camera editing to work with multiple camera angles simultaneously');
  multiCameraBtn.onclick = () => {
    state.multiCameraMode = !state.multiCameraMode;
    renderMultiCameraToolbar(state, container);
  // DISABLED:     
  };
  container.appendChild(multiCameraBtn);

  if (!state.multiCameraMode) return;

  // PIP mode toggle
  const pipBtn = document.createElement('button');
  pipBtn.className = `tool-btn ${state.pipMode ? 'active' : ''}`;
  pipBtn.innerHTML = '<span class="emoji">🖼️</span><span>PIP</span>';
  pipBtn.title = 'Picture-in-Picture mode';
  pipBtn.setAttribute('data-tooltip', 'Picture-in-Picture (PIP): Overlay a smaller video window on top of the main video for simultaneous playback');
  pipBtn.onclick = () => {
    state.togglePipMode();
    renderMultiCameraToolbar(state, container);
  // DISABLED:     
  };
  container.appendChild(pipBtn);

  // Split screen mode toggle
  const splitBtn = document.createElement('button');
  splitBtn.className = `tool-btn ${state.splitScreenMode ? 'active' : ''}`;
  splitBtn.innerHTML = '<span class="emoji">📱</span><span>Split</span>';
  splitBtn.title = 'Split-screen mode';
  splitBtn.setAttribute('data-tooltip', 'Split Screen: Divide the screen into multiple sections to display multiple video feeds side by side');
  splitBtn.onclick = () => {
    if (!state.splitScreenMode) {
      state.setSplitScreen('horizontal', 0.5);
    } else {
      state.disableSplitScreen();
    }
    renderMultiCameraToolbar(state, container);
  // DISABLED:     
  };
  container.appendChild(splitBtn);

  // Camera angles button
  const anglesBtn = document.createElement('button');
  anglesBtn.className = 'tool-btn';
  anglesBtn.innerHTML = '<span class="emoji">🎬</span><span>Angles</span>';
  anglesBtn.title = 'Manage camera angles';
  anglesBtn.setAttribute('data-tooltip', 'Camera Angles: Open the camera angles panel to create, switch between, and manage different camera perspectives');
  anglesBtn.onclick = () => showCameraAnglesPanel(state);
  container.appendChild(anglesBtn);
}

export function renderCameraAnglesPanel(state) {
  const panel = document.createElement('div');
  panel.className = 'camera-angles-panel glass-panel p-4 rounded-xl';
  panel.innerHTML = `
    <h3 class="text-lg font-bold mb-4">Camera Angles</h3>
    <div class="camera-angles-list mb-4"></div>
    <button class="add-angle-btn w-full py-2 bg-primary text-black rounded-lg font-semibold hover:bg-primary/80 transition-colors" data-tooltip="Add a new camera angle: Create a new camera perspective that you can switch to during editing">
      + Add Camera Angle
    </button>
  `;

  const list = panel.querySelector('.camera-angles-list');
  state.cameraAngles.forEach(angle => {
    const angleEl = document.createElement('div');
    angleEl.className = `camera-angle-item p-3 rounded-lg mb-2 flex items-center justify-between ${state.activeCameraAngle === angle.id ? 'bg-primary/20 border border-primary/50' : 'bg-white/5'}`;
    angleEl.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-4 h-4 rounded" style="background-color: ${angle.color}"></div>
        <span class="font-medium">${angle.name}</span>
        <span class="text-sm text-white/60">${angle.tracks.length} tracks</span>
      </div>
      <div class="flex gap-2">
        <button class="text-white/60 hover:text-white text-sm" data-tooltip="Switch to this camera angle: Change the active view to this camera perspective" onclick="switchToAngle('${angle.id}')">Switch</button>
        <button class="text-red-400 hover:text-red-300 text-sm" data-tooltip="Remove this camera angle: Delete this camera perspective from the project" onclick="removeAngle('${angle.id}')">×</button>
      </div>
    `;
    list.appendChild(angleEl);
  });

  panel.querySelector('.add-angle-btn').onclick = () => addNewCameraAngle(state);

  // Show panel as modal
  showModal('Camera Angles', panel);
}

function addNewCameraAngle(state) {
  const angleName = prompt('Enter camera angle name:');
  if (angleName) {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const angleId = state.addCameraAngle(angleName, randomColor);
    renderCameraAnglesPanel(state);
  // DISABLED:     
  }
}

export function renderPipControls(state, container) {
  if (!container) return;

  if (!state.pipMode) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.innerHTML = `
    <div class="pip-controls glass-panel p-4 rounded-xl">
      <h4 class="text-sm font-bold mb-3">PIP Controls</h4>
      <div class="pip-windows-list"></div>
      <button class="add-pip-btn w-full py-2 bg-primary/20 border border-primary/50 rounded-lg text-sm hover:bg-primary/30 transition-colors mt-3" data-tooltip="Add PIP Window: Create a new picture-in-picture overlay from the selected timeline clip">
        + Add PIP Window
      </button>
    </div>
  `;

  const list = container.querySelector('.pip-windows-list');
  state.pipWindows.forEach(pip => {
    const pipEl = document.createElement('div');
    pipEl.className = 'pip-window-item p-3 bg-white/5 rounded-lg mb-2';
    pipEl.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium">PIP Window ${state.pipWindows.indexOf(pip) + 1}</span>
        <button class="text-red-400 hover:text-red-300 text-sm" data-tooltip="Remove PIP Window: Delete this picture-in-picture overlay from the composition" onclick="removePip('${pip.id}')">×</button>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label class="block text-white/60 mb-1">Position</label>
          <select class="w-full bg-white/10 border border-white/20 rounded px-2 py-1" data-tooltip="PIP Position: Choose where the picture-in-picture window appears on screen" onchange="updatePipPosition('${pip.id}', this.value)">
            <option value="top-left" ${pip.position === 'top-left' ? 'selected' : ''}>Top Left</option>
            <option value="top-right" ${pip.position === 'top-right' ? 'selected' : ''}>Top Right</option>
            <option value="bottom-left" ${pip.position === 'bottom-left' ? 'selected' : ''}>Bottom Left</option>
            <option value="bottom-right" ${pip.position === 'bottom-right' ? 'selected' : ''}>Bottom Right</option>
            <option value="custom" ${pip.position === 'custom' ? 'selected' : ''}>Custom</option>
          </select>
        </div>
        <div>
          <label class="block text-white/60 mb-1">Opacity</label>
          <input type="range" min="0" max="1" step="0.1" value="${pip.opacity}" class="w-full" data-tooltip="PIP Opacity: Adjust the transparency of the picture-in-picture window from invisible to fully opaque" onchange="updatePipOpacity('${pip.id}', this.value)">
        </div>
      </div>
    `;
    list.appendChild(pipEl);
  });

  container.querySelector('.add-pip-btn').onclick = () => addPipWindow(state);
}

function addPipWindow(state) {
  if (state.tracks.flatMap(t => t.items).length === 0) {
  // DISABLED:     
    return;
  }

  const clip = state.tracks.flatMap(t => t.items).find(c => c.id === state.selectedClipId);
  if (!clip) {
  // DISABLED:     
    return;
  }

  state.addPipWindow(clip.id);
  renderPipControls(state, document.querySelector('.pip-controls-container'));
  // DISABLED:   
}

export function renderSplitScreenControls(state, container) {
  if (!container) return;

  if (!state.splitScreenMode) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.innerHTML = `
    <div class="split-controls glass-panel p-4 rounded-xl">
      <h4 class="text-sm font-bold mb-3">Split Screen Controls</h4>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-white/60 text-xs mb-1">Type</label>
          <select class="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm" data-tooltip="Split Type: Choose how to divide the screen — horizontal splits stack vertically, vertical splits arrange side by side, and quad divides into four sections" onchange="updateSplitType(this.value)">
            <option value="horizontal" ${state.splitScreenConfig.type === 'horizontal' ? 'selected' : ''}>Horizontal</option>
            <option value="vertical" ${state.splitScreenConfig.type === 'vertical' ? 'selected' : ''}>Vertical</option>
            <option value="quad" ${state.splitScreenConfig.type === 'quad' ? 'selected' : ''}>Quad</option>
          </select>
        </div>
        <div>
          <label class="block text-white/60 text-xs mb-1">Split Ratio</label>
          <input type="range" min="0.1" max="0.9" step="0.1" value="${state.splitScreenConfig.ratio}"
                 class="w-full" data-tooltip="Split Ratio: Adjust the dividing line position between split screen sections to control how much space each section occupies" onchange="updateSplitRatio(this.value)">
        </div>
      </div>
    </div>
  `;
}

// Utility functions for event handlers
window.switchToAngle = (angleId) => {
  const state = window.timelineState;
  state.switchToCameraAngle(angleId);
  renderCameraAnglesPanel(state);
  // DISABLED:   
};

window.removeAngle = (angleId) => {
  const state = window.timelineState;
  state.removeCameraAngle(angleId);
  renderCameraAnglesPanel(state);
  // DISABLED:   
};

window.removePip = (pipId) => {
  const state = window.timelineState;
  state.removePipWindow(pipId);
  renderPipControls(state, document.querySelector('.pip-controls-container'));
  // DISABLED:   
};

window.updatePipPosition = (pipId, position) => {
  const state = window.timelineState;
  state.updatePipWindow(pipId, { position });
  // DISABLED:   
};

window.updatePipOpacity = (pipId, opacity) => {
  const state = window.timelineState;
  state.updatePipWindow(pipId, { opacity: parseFloat(opacity) });
};

window.updateSplitType = (type) => {
  const state = window.timelineState;
  state.setSplitScreen(type, state.splitScreenConfig.ratio);
  renderSplitScreenControls(state, document.querySelector('.split-controls-container'));
};

window.updateSplitRatio = (ratio) => {
  const state = window.timelineState;
  state.setSplitScreen(state.splitScreenConfig.type, parseFloat(ratio));
};

// Helper functions
function showModal(title, content) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="modal-content bg-panel-bg rounded-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
      <div class="modal-header p-4 border-b border-white/10 flex items-center justify-between">
        <h2 class="text-lg font-bold">${title}</h2>
        <button class="modal-close text-white/60 hover:text-white text-xl" data-tooltip="Close Modal: Dismiss this dialog and return to the editor" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body p-4"></div>
    </div>
  `;

  modal.querySelector('.modal-body').appendChild(content);
  document.body.appendChild(modal);
}

function console.log(message) {
  // Use existing toast system
  if (window.showToast) {
    window.
  } else {
  }
}
