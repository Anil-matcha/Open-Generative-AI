/**
 * Timeline Transitions Integration
 * Handles transition placement, rendering, and interaction on the timeline
 */

import { TransitionsLibrary } from './transitionsLibrary.js';

export class TimelineTransitions {
  constructor(timelineContainer, state) {
    this.timelineContainer = timelineContainer;
    this.state = state;
    this.library = new TransitionsLibrary();
    this.transitionElements = new Map();
    this.draggedTransition = null;

    this.initialize();
  }

  initialize() {
    this.setupTransitionDropZones();
    this.setupTransitionDragDrop();
    this.renderExistingTransitions();
  }

  setupTransitionDropZones() {
    // Add drop zones between clips
    const trackRows = this.timelineContainer.querySelectorAll('.track-row');

    trackRows.forEach(row => {
      const trackId = row.dataset.trackId;
      const clips = row.querySelectorAll('.clip');

      clips.forEach((clip, index) => {
        if (index < clips.length - 1) { // Don't add after last clip
          const dropZone = this.createTransitionDropZone(trackId, clip.dataset.clipId);
          clip.insertAdjacentElement('afterend', dropZone);
        }
      });
    });
  }

  createTransitionDropZone(trackId, beforeClipId) {
    const dropZone = document.createElement('div');
    dropZone.className = 'transition-drop-zone';
    dropZone.dataset.trackId = trackId;
    dropZone.dataset.beforeClipId = beforeClipId;

    dropZone.innerHTML = `
      <div class="transition-placeholder">
        <div class="transition-icon">🔄</div>
        <div class="transition-label">Drop transition here</div>
      </div>
    `;

    // Add drop event listeners
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');

      const transitionData = e.dataTransfer.getData('application/json');
      if (transitionData) {
        try {
          const { transitionKey, params, duration } = JSON.parse(transitionData);
          this.addTransition(trackId, beforeClipId, transitionKey, params, duration);
        } catch (error) {
          console.error('Failed to parse transition data:', error);
        }
      }
    });

    return dropZone;
  }

  setupTransitionDragDrop() {
    // Make transition items draggable from the editor
    document.addEventListener('dragstart', (e) => {
      if (e.target.closest('.transition-item')) {
        const transitionItem = e.target.closest('.transition-item');
        const transitionKey = transitionItem.dataset.transition;

        if (transitionKey) {
          const transition = this.library.getTransition(transitionKey);
          const data = {
            transitionKey,
            params: transition.params,
            duration: 2.0
          };

          e.dataTransfer.setData('application/json', JSON.stringify(data));
          e.dataTransfer.effectAllowed = 'copy';
        }
      }
    });
  }

  addTransition(trackId, beforeClipId, transitionKey, params, duration) {
    const transition = this.library.getTransition(transitionKey);
    if (!transition) return;

    const transitionId = `transition-${Date.now()}`;

    // Create transition data
    const transitionData = {
      id: transitionId,
      trackId,
      beforeClipId,
      transitionKey,
      params: { ...params },
      duration,
      startTime: this.getClipEndTime(trackId, beforeClipId) - duration / 2, // Center the transition
      endTime: this.getClipEndTime(trackId, beforeClipId) + duration / 2
    };

    // Add to state
    if (!this.state.transitions) {
      this.state.transitions = [];
    }
    this.state.transitions.push(transitionData);

    // Render the transition
    this.renderTransition(transitionData);

    // Update timeline
    this.updateTimelineAfterTransition(transitionData);
  }

  getClipEndTime(trackId, clipId) {
    const track = this.state.tracks.find(t => t.id === trackId);
    if (!track) return 0;

    const clip = track.clips.find(c => c.id === parseInt(clipId));
    if (!clip) return 0;

    // Calculate end time based on clip position and width
    // Assuming 1% width = 1 second for simplicity
    return clip.left + clip.width;
  }

  renderTransition(transitionData) {
    const transition = this.library.getTransition(transitionData.transitionKey);
    if (!transition) return;

    // Find the drop zone
    const dropZone = this.timelineContainer.querySelector(
      `.transition-drop-zone[data-track-id="${transitionData.trackId}"][data-before-clip-id="${transitionData.beforeClipId}"]`
    );

    if (!dropZone) return;

    // Create transition element
    const transitionEl = document.createElement('div');
    transitionEl.className = 'timeline-transition';
    transitionEl.dataset.transitionId = transitionData.id;
    transitionEl.style.width = `${(transitionData.duration / this.state.timelineSeconds) * 100}%`;

    transitionEl.innerHTML = `
      <div class="transition-visual">
        <div class="transition-icon">${transition.icon}</div>
        <div class="transition-name">${transition.name}</div>
        <div class="transition-duration">${transitionData.duration}s</div>
      </div>
      <div class="transition-controls">
        <button class="transition-edit-btn" title="Edit transition">✏️</button>
        <button class="transition-delete-btn" title="Delete transition">🗑️</button>
      </div>
    `;

    // Replace placeholder with actual transition
    dropZone.innerHTML = '';
    dropZone.appendChild(transitionEl);
    dropZone.classList.add('has-transition');

    // Add event listeners
    transitionEl.querySelector('.transition-edit-btn').addEventListener('click', () => {
      this.editTransition(transitionData.id);
    });

    transitionEl.querySelector('.transition-delete-btn').addEventListener('click', () => {
      this.deleteTransition(transitionData.id);
    });

    // Make transition draggable for repositioning
    this.makeTransitionDraggable(transitionEl, transitionData);

    // Store reference
    this.transitionElements.set(transitionData.id, transitionEl);
  }

  renderExistingTransitions() {
    if (!this.state.transitions) return;

    this.state.transitions.forEach(transitionData => {
      this.renderTransition(transitionData);
    });
  }

  makeTransitionDraggable(transitionEl, transitionData) {
    let isDragging = false;
    let startX = 0;
    let originalLeft = 0;

    transitionEl.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      originalLeft = transitionEl.offsetLeft;
      transitionEl.classList.add('dragging');

      const handleMouseMove = (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const newLeft = Math.max(0, originalLeft + deltaX);

        // Convert pixel position to time
        const timelineRect = this.timelineContainer.getBoundingClientRect();
        const percent = newLeft / timelineRect.width;
        const newTime = percent * this.state.timelineSeconds;

        // Update transition data
        const centerTime = newTime + (transitionData.duration / 2);
        transitionData.startTime = centerTime - (transitionData.duration / 2);
        transitionData.endTime = centerTime + (transitionData.duration / 2);

        // Snap to clip boundaries if needed
        this.snapTransitionToClips(transitionData);

        // Update visual position
        this.updateTransitionPosition(transitionData);
      };

      const handleMouseUp = () => {
        isDragging = false;
        transitionEl.classList.remove('dragging');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }

  snapTransitionToClips(transitionData) {
    // Find clips in the same track
    const track = this.state.tracks.find(t => t.id === transitionData.trackId);
    if (!track) return;

    // Find the two clips this transition is between
    const clips = track.clips.sort((a, b) => a.left - b.left);
    const beforeClip = clips.find(c => c.id === parseInt(transitionData.beforeClipId));

    if (beforeClip) {
      const clipEndTime = beforeClip.left + beforeClip.width;
      const nextClip = clips.find(c => c.left > clipEndTime);

      if (nextClip) {
        // Ensure transition stays between the clips
        const minTime = clipEndTime - transitionData.duration;
        const maxTime = nextClip.left;

        transitionData.startTime = Math.max(minTime, Math.min(maxTime - transitionData.duration, transitionData.startTime));
        transitionData.endTime = transitionData.startTime + transitionData.duration;
      }
    }
  }

  updateTransitionPosition(transitionData) {
    const transitionEl = this.transitionElements.get(transitionData.id);
    if (!transitionEl) return;

    const percent = (transitionData.startTime / this.state.timelineSeconds) * 100;
    transitionEl.style.left = `${percent}%`;
  }

  updateTimelineAfterTransition(transitionData) {
    // Update playhead and any dependent elements
    // This would typically trigger a re-render of the timeline
    this.state.lastTransitionUpdate = Date.now();
  }

  editTransition(transitionId) {
    const transitionData = this.state.transitions?.find(t => t.id === transitionId);
    if (!transitionData) return;

    // Open transition editor modal
    this.openTransitionEditor(transitionData);
  }

  deleteTransition(transitionId) {
    // Remove from state
    if (this.state.transitions) {
      this.state.transitions = this.state.transitions.filter(t => t.id !== transitionId);
    }

    // Remove from DOM
    const transitionEl = this.transitionElements.get(transitionId);
    if (transitionEl) {
      const dropZone = transitionEl.parentElement;
      dropZone.innerHTML = `
        <div class="transition-placeholder">
          <div class="transition-icon">🔄</div>
          <div class="transition-label">Drop transition here</div>
        </div>
      `;
      dropZone.classList.remove('has-transition');
      this.transitionElements.delete(transitionId);
    }

    this.updateTimelineAfterTransition();
  }

  openTransitionEditor(transitionData) {
    // Create modal for editing
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit Transition</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div id="transitionEditorContainer"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Import and initialize transition editor
    import('./transitionEditor.js').then(({ TransitionEditor }) => {
      const editor = new TransitionEditor(
        modal.querySelector('#transitionEditorContainer'),
        (transition, params, duration) => {
          // Update transition data
          Object.assign(transitionData, {
            transitionKey: transition.key,
            params,
            duration
          });

          // Re-render transition
          this.renderTransition(transitionData);
          this.updateTimelineAfterTransition(transitionData);

          // Close modal
          modal.remove();
        }
      );

      // Pre-select current transition
      setTimeout(() => {
        editor.selectTransition(transitionData.transitionKey);
        editor.currentParams = { ...transitionData.params };
        editor.duration = transitionData.duration;
        editor.container.querySelector('#durationSlider').value = transitionData.duration;
        editor.container.querySelector('#durationValue').textContent = `${transitionData.duration}s`;
      }, 100);
    });

    // Close modal handlers
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  getTransitionAtTime(trackId, time) {
    if (!this.state.transitions) return null;

    return this.state.transitions.find(t =>
      t.trackId === trackId &&
      time >= t.startTime &&
      time <= t.endTime
    );
  }

  getAllTransitionsForTrack(trackId) {
    if (!this.state.transitions) return [];

    return this.state.transitions.filter(t => t.trackId === trackId);
  }

  exportTransitions() {
    return this.state.transitions || [];
  }

  importTransitions(transitions) {
    this.state.transitions = transitions;
    this.renderExistingTransitions();
  }
}