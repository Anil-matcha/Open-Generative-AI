// SubtitleControls.jsx - UI for timing adjustments and style customization

import { createElementFromHTML } from '../../utils/jsx.js';
import { subtitleState } from '../lib/editor/subtitleState.js';
import { subtitleExporter } from '../lib/editor/subtitleExporter.js';

const DESIGN_SYSTEM = {
  colors: {
    bg: 'var(--bg)',
    panel: 'var(--panel)',
    panelSoft: 'var(--panel-soft)',
    border: 'var(--border)',
    borderSoft: 'var(--border-soft)',
    text: 'var(--text)',
    muted: 'var(--muted)',
    dim: 'var(--dim)',
    cyan: 'var(--cyan)',
    cyanSoft: 'var(--cyan-soft)',
    emerald: 'var(--emerald)',
    danger: 'var(--danger)',
    dangerSoft: 'rgba(239,68,68,0.2)'
  },
  radii: {
    xl: 'var(--radius-xl)',
    lg: 'var(--radius-lg)',
    md: 'var(--radius-md)',
    sm: 'var(--radius-sm)'
  },
  shadow: 'var(--shadow)',
  font: 'var(--font)',
  durations: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms'
  }
};

export function SubtitleControls({ onStyleChange, onExport, onEditSubtitle }) {
  const container = document.createElement('div');
  container.className = 'subtitle-controls';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    background: ${DESIGN_SYSTEM.colors.panel};
    border: 1px solid ${DESIGN_SYSTEM.colors.border};
    border-radius: ${DESIGN_SYSTEM.radii.lg};
    min-height: 200px;
  `;

  let selectedSubtitle = null;

  // Listen to subtitle state changes
  subtitleState.addListener((event, data) => {
    switch (event) {
      case 'selection-changed':
        selectedSubtitle = subtitleState.getSubtitle(data);
        renderControls();
        break;
      case 'subtitle-updated':
        if (data.id === subtitleState.selectedSubtitleId) {
          selectedSubtitle = data;
          renderControls();
        }
        break;
    }
  });

  function renderControls() {
    container.innerHTML = '';

    // Header
    const header = createElementFromHTML(`
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid ${DESIGN_SYSTEM.colors.borderSoft};
      ">
        <h3 style="
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: ${DESIGN_SYSTEM.colors.text};
        ">Subtitle Controls</h3>
        <div style="display: flex; gap: 8px;">
          <button class="control-btn undo-btn" title="Undo" style="display: none;">↶</button>
          <button class="control-btn redo-btn" title="Redo" style="display: none;">↷</button>
        </div>
      </div>
    `);

    container.appendChild(header);

    // Current subtitle info
    if (selectedSubtitle) {
      const info = createElementFromHTML(`
        <div class="subtitle-info" style="
          padding: 12px;
          background: ${DESIGN_SYSTEM.colors.panelSoft};
          border: 1px solid ${DESIGN_SYSTEM.colors.borderSoft};
          border-radius: ${DESIGN_SYSTEM.radii.md};
          margin-bottom: 16px;
        ">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; color: ${DESIGN_SYSTEM.colors.cyan};">
            Selected Subtitle
          </div>
          <div style="font-size: 12px; color: ${DESIGN_SYSTEM.colors.muted}; margin-bottom: 4px;">
            Time: ${formatTime(selectedSubtitle.startTime)} - ${formatTime(selectedSubtitle.endTime)}
          </div>
          <div style="font-size: 12px; color: ${DESIGN_SYSTEM.colors.muted}; margin-bottom: 8px;">
            Confidence: ${(selectedSubtitle.confidence * 100).toFixed(1)}%
          </div>
          <div style="font-size: 13px; line-height: 1.4; color: ${DESIGN_SYSTEM.colors.text};">
            "${selectedSubtitle.text}"
          </div>
        </div>
      `);
      container.appendChild(info);
    } else {
      const placeholder = createElementFromHTML(`
        <div style="
          padding: 24px;
          text-align: center;
          color: ${DESIGN_SYSTEM.colors.dim};
          font-size: 14px;
        ">
          Select a subtitle to edit its properties
        </div>
      `);
      container.appendChild(placeholder);
    }

    // Timing controls
    const timingControls = createTimingControls();
    container.appendChild(timingControls);

    // Style controls
    const styleControls = createStyleControls();
    container.appendChild(styleControls);

    // Action buttons
    const actionButtons = createActionButtons();
    container.appendChild(actionButtons);

    // Export controls
    const exportControls = createExportControls();
    container.appendChild(exportControls);

    // Setup event listeners
    setupEventListeners();
  }

  function createTimingControls() {
    const controls = createElementFromHTML(`
      <div class="timing-controls" style="
        margin-bottom: 16px;
      ">
        <label style="
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: ${DESIGN_SYSTEM.colors.text};
          margin-bottom: 8px;
        ">Timing</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="font-size: 12px; color: ${DESIGN_SYSTEM.colors.muted};">Start Time</label>
            <input type="number" class="time-input start-time" step="0.1" min="0"
                   style="width: 100%; padding: 6px 8px; border: 1px solid ${DESIGN_SYSTEM.colors.border}; border-radius: ${DESIGN_SYSTEM.radii.sm}; background: ${DESIGN_SYSTEM.colors.bg}; color: ${DESIGN_SYSTEM.colors.text}; font-size: 12px;">
          </div>
          <div>
            <label style="font-size: 12px; color: ${DESIGN_SYSTEM.colors.muted};">End Time</label>
            <input type="number" class="time-input end-time" step="0.1" min="0"
                   style="width: 100%; padding: 6px 8px; border: 1px solid ${DESIGN_SYSTEM.colors.border}; border-radius: ${DESIGN_SYSTEM.radii.sm}; background: ${DESIGN_SYSTEM.colors.bg}; color: ${DESIGN_SYSTEM.colors.text}; font-size: 12px;">
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button class="control-btn split-btn" style="flex: 1; padding: 6px 12px; border: 1px solid ${DESIGN_SYSTEM.colors.border}; border-radius: ${DESIGN_SYSTEM.radii.sm}; background: ${DESIGN_SYSTEM.colors.panelSoft}; color: ${DESIGN_SYSTEM.colors.text}; font-size: 12px; cursor: pointer;">Split</button>
          <button class="control-btn merge-btn" style="flex: 1; padding: 6px 12px; border: 1px solid ${DESIGN_SYSTEM.colors.border}; border-radius: ${DESIGN_SYSTEM.radii.sm}; background: ${DESIGN_SYSTEM.colors.panelSoft}; color: ${DESIGN_SYSTEM.colors.text}; font-size: 12px; cursor: pointer;">Merge</button>
        </div>
      </div>
    `);

    // Set current values
    if (selectedSubtitle) {
      const startInput = controls.querySelector('.start-time');
      const endInput = controls.querySelector('.end-time');
      startInput.value = selectedSubtitle.startTime.toFixed(1);
      endInput.value = selectedSubtitle.endTime.toFixed(1);
    }

    return controls;
  }

  function createStyleControls() {
    const controls = createElementFromHTML(`
      <div class="style-controls" style="
        margin-bottom: 16px;
      ">
        <label style="
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: ${DESIGN_SYSTEM.colors.text};
          margin-bottom: 8px;
        ">Styling</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="font-size: 12px; color: ${DESIGN_SYSTEM.colors.muted};">Font Size</label>
            <select class="style-select font-size"
                    style="width: 100%; padding: 6px 8px; border: 1px solid ${DESIGN_SYSTEM.colors.border}; border-radius: ${DESIGN_SYSTEM.radii.sm}; background: ${DESIGN_SYSTEM.colors.bg}; color: ${DESIGN_SYSTEM.colors.text}; font-size: 12px;">
              <option value="16">Small (16px)</option>
              <option value="20">Medium (20px)</option>
              <option value="24" selected>Normal (24px)</option>
              <option value="28">Large (28px)</option>
              <option value="32">Extra Large (32px)</option>
            </select>
          </div>
          <div>
            <label style="font-size: 12px; color: ${DESIGN_SYSTEM.colors.muted};">Position</label>
            <select class="style-select position"
                    style="width: 100%; padding: 6px 8px; border: 1px solid ${DESIGN_SYSTEM.colors.border}; border-radius: ${DESIGN_SYSTEM.radii.sm}; background: ${DESIGN_SYSTEM.colors.bg}; color: ${DESIGN_SYSTEM.colors.text}; font-size: 12px;">
              <option value="bottom" selected>Bottom</option>
              <option value="middle">Middle</option>
              <option value="top">Top</option>
            </select>
          </div>
        </div>
        <div style="margin-top: 8px;">
          <label style="font-size: 12px; color: ${DESIGN_SYSTEM.colors.muted};">Colors</label>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <input type="color" class="color-input text-color" value="#ffffff"
                   style="width: 40px; height: 32px; border: 1px solid ${DESIGN_SYSTEM.colors.border}; border-radius: ${DESIGN_SYSTEM.radii.sm}; cursor: pointer;">
            <input type="color" class="color-input bg-color" value="#000000"
                   style="width: 40px; height: 32px; border: 1px solid ${DESIGN_SYSTEM.colors.border}; border-radius: ${DESIGN_SYSTEM.radii.sm}; cursor: pointer;">
          </div>
        </div>
      </div>
    `);

    // Set current style values
    if (selectedSubtitle && selectedSubtitle.style) {
      const fontSizeSelect = controls.querySelector('.font-size');
      const positionSelect = controls.querySelector('.position');
      const textColorInput = controls.querySelector('.text-color');
      const bgColorInput = controls.querySelector('.bg-color');

      fontSizeSelect.value = selectedSubtitle.style.fontSize || 24;
      positionSelect.value = selectedSubtitle.style.position || 'bottom';
      textColorInput.value = selectedSubtitle.style.color || '#ffffff';
      bgColorInput.value = selectedSubtitle.style.backgroundColor ?
        rgbaToHex(selectedSubtitle.style.backgroundColor) : '#000000';
    }

    return controls;
  }

  function createActionButtons() {
    const buttons = createElementFromHTML(`
      <div class="action-buttons" style="
        margin-bottom: 16px;
      ">
        <div style="display: flex; gap: 8px;">
          <button class="control-btn edit-btn" style="
            flex: 1;
            padding: 8px 12px;
            border: 1px solid ${DESIGN_SYSTEM.colors.cyan};
            border-radius: ${DESIGN_SYSTEM.radii.sm};
            background: ${DESIGN_SYSTEM.colors.cyanSoft};
            color: ${DESIGN_SYSTEM.colors.cyan};
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all ${DESIGN_SYSTEM.durations.fast} ease;
          ">Edit Text</button>
          <button class="control-btn delete-btn" style="
            flex: 1;
            padding: 8px 12px;
            border: 1px solid ${DESIGN_SYSTEM.colors.danger};
            border-radius: ${DESIGN_SYSTEM.radii.sm};
            background: ${DESIGN_SYSTEM.colors.dangerSoft};
            color: ${DESIGN_SYSTEM.colors.danger};
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all ${DESIGN_SYSTEM.durations.fast} ease;
          ">Delete</button>
        </div>
      </div>
    `);

    return buttons;
  }

  function createExportControls() {
    const controls = createElementFromHTML(`
      <div class="export-controls">
        <label style="
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: ${DESIGN_SYSTEM.colors.text};
          margin-bottom: 8px;
        ">Export</label>
        <div style="display: flex; gap: 8px;">
          <button class="control-btn export-srt" style="
            flex: 1;
            padding: 8px 12px;
            border: 1px solid ${DESIGN_SYSTEM.colors.border};
            border-radius: ${DESIGN_SYSTEM.radii.sm};
            background: ${DESIGN_SYSTEM.colors.panelSoft};
            color: ${DESIGN_SYSTEM.colors.text};
            font-size: 12px;
            cursor: pointer;
          ">SRT</button>
          <button class="control-btn export-vtt" style="
            flex: 1;
            padding: 8px 12px;
            border: 1px solid ${DESIGN_SYSTEM.colors.border};
            border-radius: ${DESIGN_SYSTEM.radii.sm};
            background: ${DESIGN_SYSTEM.colors.panelSoft};
            color: ${DESIGN_SYSTEM.colors.text};
            font-size: 12px;
            cursor: pointer;
          ">VTT</button>
          <button class="control-btn export-json" style="
            flex: 1;
            padding: 8px 12px;
            border: 1px solid ${DESIGN_SYSTEM.colors.border};
            border-radius: ${DESIGN_SYSTEM.radii.sm};
            background: ${DESIGN_SYSTEM.colors.panelSoft};
            color: ${DESIGN_SYSTEM.colors.text};
            font-size: 12px;
            cursor: pointer;
          ">JSON</button>
        </div>
      </div>
    `);

    return controls;
  }

  function setupEventListeners() {
    // Timing controls
    const startInput = container.querySelector('.start-time');
    const endInput = container.querySelector('.end-time');

    if (startInput && endInput) {
      startInput.addEventListener('change', (e) => {
        if (selectedSubtitle) {
          const newStart = parseFloat(e.target.value);
          subtitleState.updateSubtitle(selectedSubtitle.id, { startTime: newStart });
        }
      });

      endInput.addEventListener('change', (e) => {
        if (selectedSubtitle) {
          const newEnd = parseFloat(e.target.value);
          subtitleState.updateSubtitle(selectedSubtitle.id, { endTime: newEnd });
        }
      });
    }

    // Split/Merge buttons
    const splitBtn = container.querySelector('.split-btn');
    const mergeBtn = container.querySelector('.merge-btn');

    if (splitBtn) {
      splitBtn.addEventListener('click', () => {
        if (selectedSubtitle) {
          const splitTime = (selectedSubtitle.startTime + selectedSubtitle.endTime) / 2;
          subtitleState.splitSubtitle(selectedSubtitle.id, splitTime);
        }
      });
    }

    if (mergeBtn) {
      mergeBtn.addEventListener('click', () => {
        // Find adjacent subtitles to merge
        const index = subtitleState.subtitles.findIndex(s => s.id === selectedSubtitle.id);
        if (index >= 0) {
          const adjacentIds = [selectedSubtitle.id];
          if (index > 0) adjacentIds.unshift(subtitleState.subtitles[index - 1].id);
          if (index < subtitleState.subtitles.length - 1) adjacentIds.push(subtitleState.subtitles[index + 1].id);
          subtitleState.mergeSubtitles(adjacentIds);
        }
      });
    }

    // Style controls
    const fontSizeSelect = container.querySelector('.font-size');
    const positionSelect = container.querySelector('.position');
    const textColorInput = container.querySelector('.text-color');
    const bgColorInput = container.querySelector('.bg-color');

    [fontSizeSelect, positionSelect, textColorInput, bgColorInput].forEach(input => {
      if (input) {
        input.addEventListener('change', () => {
          if (selectedSubtitle) {
            const updates = {};
            if (fontSizeSelect) updates.fontSize = parseInt(fontSizeSelect.value);
            if (positionSelect) updates.position = positionSelect.value;
            if (textColorInput) updates.color = textColorInput.value;
            if (bgColorInput) updates.backgroundColor = bgColorInput.value + 'CC'; // Add alpha

            subtitleState.applyStyleToSubtitle(selectedSubtitle.id, updates);

            if (onStyleChange) {
              onStyleChange(updates);
            }
          }
        });
      }
    });

    // Action buttons
    const editBtn = container.querySelector('.edit-btn');
    const deleteBtn = container.querySelector('.delete-btn');

    if (editBtn && onEditSubtitle) {
      editBtn.addEventListener('click', () => {
        if (selectedSubtitle) {
          onEditSubtitle(selectedSubtitle);
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (selectedSubtitle) {
          subtitleState.deleteSubtitle(selectedSubtitle.id);
        }
      });
    }

    // Export buttons
    const exportSrtBtn = container.querySelector('.export-srt');
    const exportVttBtn = container.querySelector('.export-vtt');
    const exportJsonBtn = container.querySelector('.export-json');

    if (exportSrtBtn) {
      exportSrtBtn.addEventListener('click', async () => {
        try {
          await subtitleExporter.download('srt');
          if (onExport) onExport('srt');
        } catch (error) {
          console.error('Export failed:', error);
        }
      });
    }

    if (exportVttBtn) {
      exportVttBtn.addEventListener('click', async () => {
        try {
          await subtitleExporter.download('vtt');
          if (onExport) onExport('vtt');
        } catch (error) {
          console.error('Export failed:', error);
        }
      });
    }

    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', async () => {
        try {
          await subtitleExporter.download('json');
          if (onExport) onExport('json');
        } catch (error) {
          console.error('Export failed:', error);
        }
      });
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  function rgbaToHex(rgba) {
    // Simple conversion - assumes format like rgba(0,0,0,0.7)
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return '#000000';
  }

  // Initial render
  renderControls();

  return container;
}