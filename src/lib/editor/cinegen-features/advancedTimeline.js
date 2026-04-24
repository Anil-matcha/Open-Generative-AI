export const NLE_TOOLS = {
  SELECT: 'select',
  BLADE: 'blade',
  RIPPLE_TRIM: 'ripple-trim',
  ROLL_TRIM: 'roll-trim',
  SLIP: 'slip',
  SLIDE: 'slide',
  MUSIC: 'music',
  FILL_GAP: 'fill-gap',
  EXTEND: 'extend',
  MASK: 'mask'
};

export class AdvancedTimeline {
  constructor(timelineState) {
    this.state = timelineState;
    this.currentTool = NLE_TOOLS.SELECT;
    this.viewers = { source: null, timeline: null };
    this.tabs = [];
    this.activeTabId = null;
  }

  init(container) {
    this.container = container;
    this.renderToolbar();
    return this;
  }

  renderToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'advanced-timeline-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-section tools">
        <span class="section-label">Tools:</span>
        ${Object.entries(NLE_TOOLS).map(([key, value]) => `
          <button class="tool-btn" data-tool="${value}" title="${this.getToolTooltip(value)}">
            ${this.getToolIcon(value)}
          </button>
        `).join('')}
      </div>
      <div class="toolbar-section viewers">
        <button class="viewer-btn" data-viewer="source">Source</button>
        <button class="viewer-btn" data-viewer="timeline">Timeline</button>
        <button class="viewer-btn" data-viewer="split">Split View</button>
      </div>
    `;

    this.setupToolbarEvents(toolbar);
    this.container.appendChild(toolbar);
  }

  getToolIcon(tool) {
    const icons = {
      [NLE_TOOLS.SELECT]: '⬚',
      [NLE_TOOLS.BLADE]: '🔪',
      [NLE_TOOLS.RIPPLE_TRIM]: '↔️',
      [NLE_TOOLS.ROLL_TRIM]: '◎',
      [NLE_TOOLS.SLIP]: '⇿',
      [NLE_TOOLS.SLIDE]: '↔',
      [NLE_TOOLS.MUSIC]: '🎵',
      [NLE_TOOLS.FILL_GAP]: '🔗',
      [NLE_TOOLS.EXTEND]: '↔️',
      [NLE_TOOLS.MASK]: '🎭'
    };
    return icons[tool] || '•';
  }

  getToolTooltip(tool) {
    const tooltips = {
      [NLE_TOOLS.SELECT]: 'Select tool - Select and move clips',
      [NLE_TOOLS.BLADE]: 'Blade tool - Cut clips at cursor position',
      [NLE_TOOLS.RIPPLE_TRIM]: 'Ripple trim - Trim and close gaps',
      [NLE_TOOLS.ROLL_TRIM]: 'Roll trim - Adjust edit points together',
      [NLE_TOOLS.SLIP]: 'Slip - Slip clip timing',
      [NLE_TOOLS.SLIDE]: 'Slide - Slide clips on track',
      [NLE_TOOLS.MUSIC]: 'Music generation - Generate music from video',
      [NLE_TOOLS.FILL_GAP]: 'Fill gap - AI generate footage to fill gaps',
      [NLE_TOOLS.EXTEND]: 'Extend - AI extend clips before/after',
      [NLE_TOOLS.MASK]: 'Mask - SAM3 object masking'
    };
    return tooltips[tool] || tool;
  }

  setupToolbarEvents(toolbar) {
    toolbar.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
    });

    toolbar.querySelectorAll('.viewer-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setViewerMode(btn.dataset.viewer));
    });
  }

  selectTool(tool) {
    this.currentTool = tool;
    const btns = this.container.querySelectorAll('.tool-btn');
    btns.forEach(btn => btn.classList.toggle('active', btn.dataset.tool === tool));

    this.applyToolCursor();
  }

  applyToolCursor() {
    const cursors = {
      [NLE_TOOLS.SELECT]: 'default',
      [NLE_TOOLS.BLADE]: 'crosshair',
      [NLE_TOOLS.RIPPLE_TRIM]: 'ew-resize',
      [NLE_TOOLS.ROLL_TRIM]: 'ew-resize',
      [NLE_TOOLS.SLIP]: 'grab',
      [NLE_TOOLS.SLIDE]: 'grab',
      [NLE_TOOLS.MUSIC]: 'pointer',
      [NLE_TOOLS.FILL_GAP]: 'pointer',
      [NLE_TOOLS.EXTEND]: 'pointer',
      [NLE_TOOLS.MASK]: 'crosshair'
    };

    document.body.style.cursor = cursors[this.currentTool] || 'default';
  }

  setViewerMode(mode) {
    const btns = this.container.querySelectorAll('.viewer-btn');
    btns.forEach(btn => btn.classList.toggle('active', btn.dataset.viewer === mode));

    const viewerArea = document.querySelector('.viewer-area') || this.createViewerArea();
    viewerArea.className = `viewer-area viewer-area--${mode}`;
  }

  createViewerArea() {
    const area = document.createElement('div');
    area.className = 'viewer-area';
    this.container.appendChild(area);
    return area;
  }

  createTimelineTab(timeline) {
    const id = `tab-${Date.now()}`;
    const tab = {
      id,
      timeline,
      name: timeline.name || `Timeline ${this.tabs.length + 1}`
    };

    this.tabs.push(tab);
    this.renderTabs();
    this.switchToTab(id);

    return tab;
  }

  renderTabs() {
    let tabsContainer = this.container.querySelector('.timeline-tabs');
    if (!tabsContainer) {
      tabsContainer = document.createElement('div');
      tabsContainer.className = 'timeline-tabs';
      this.container.insertBefore(tabsContainer, this.container.firstChild);
    }

    tabsContainer.innerHTML = this.tabs.map(tab => `
      <div class="timeline-tab ${tab.id === this.activeTabId ? 'active' : ''}" data-tab-id="${tab.id}">
        <span class="tab-name">${tab.name}</span>
        <button class="tab-close" data-tab-id="${tab.id}">×</button>
      </div>
    `).join('');

    tabsContainer.querySelectorAll('.timeline-tab').forEach(tabEl => {
      tabEl.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) {
          this.switchToTab(tabEl.dataset.tabId);
        }
      });
    });

    tabsContainer.querySelectorAll('.tab-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTab(btn.dataset.tabId);
      });
    });
  }

  switchToTab(tabId) {
    this.activeTabId = tabId;
    const tabs = this.container.querySelectorAll('.timeline-tab');
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tabId === tabId));

    const activeTab = this.tabs.find(t => t.id === tabId);
    if (activeTab) {
      this.loadTimelineContent(activeTab.timeline);
    }
  }

  closeTab(tabId) {
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index !== -1) {
      this.tabs.splice(index, 1);
      if (this.activeTabId === tabId) {
        this.activeTabId = this.tabs.length > 0 ? this.tabs[0].id : null;
      }
      this.renderTabs();
    }
  }

  loadTimelineContent(timeline) {
    console.log('Loading timeline:', timeline);
  }

  executeToolAction(action, clipData) {
    switch (this.currentTool) {
      case NLE_TOOLS.BLADE:
        return this.executeBladeAction(clipData);
      case NLE_TOOLS.RIPPLE_TRIM:
        return this.executeRippleTrim(clipData);
      case NLE_TOOLS.ROLL_TRIM:
        return this.executeRollTrim(clipData);
      case NLE_TOOLS.SLIP:
        return this.executeSlip(clipData);
      case NLE_TOOLS.SLIDE:
        return this.executeSlide(clipData);
      default:
        return null;
    }
  }

  executeBladeAction(clipData) {
    const { clipId, position } = clipData;
    const clip = this.state.clips.find(c => c.id === clipId);
    if (!clip) return null;

    const newClips = this.splitClip(clip, position);
    return { action: 'blade', newClips };
  }

  splitClip(clip, position) {
    const relativePos = position - clip.startTime;
    const duration1 = relativePos;
    const duration2 = clip.duration - relativePos;

    return [
      { ...clip, id: `${clip.id}-1`, duration: duration1, endTime: position },
      { ...clip, id: `${clip.id}-2`, startTime: position, duration: duration2 }
    ];
  }

  executeRippleTrim(clipData, newDuration) {
    const { clipId, edge } = clipData;
    const clip = this.state.clips.find(c => c.id === clipId);
    if (!clip) return null;

    const updatedClip = { ...clip };
    if (edge === 'start') {
      updatedClip.startTime = clip.startTime + (clip.duration - newDuration);
      updatedClip.duration = newDuration;
    } else {
      updatedClip.duration = newDuration;
      updatedClip.endTime = clip.startTime + newDuration;
    }

    this.applyRippleEffect(updatedClip);
    return { action: 'ripple-trim', clip: updatedClip };
  }

  executeRollTrim(clipData, adjustment) {
    const { clip1Id, clip2Id } = clipData;
    const clip1 = this.state.clips.find(c => c.id === clip1Id);
    const clip2 = this.state.clips.find(c => c.id === clip2Id);
    if (!clip1 || !clip2) return null;

    const updatedClips = [
      { ...clip1, duration: clip1.duration + adjustment, endTime: clip1.endTime + adjustment },
      { ...clip2, startTime: clip2.startTime + adjustment }
    ];

    return { action: 'roll-trim', clips: updatedClips };
  }

  executeSlip(clipData, offset) {
    const { clipId } = clipData;
    const clip = this.state.clips.find(c => c.id === clipId);
    if (!clip) return null;

    const updatedClip = { ...clip };
    updatedClip.startTime = clip.startTime + offset;
    updatedClip.endTime = clip.endTime + offset;

    return { action: 'slip', clip: updatedClip };
  }

  executeSlide(clipData, offset) {
    const { clipId, track } = clipData;
    const clip = this.state.clips.find(c => c.id === clipId);
    if (!clip) return null;

    const updatedClip = { ...clip };
    updatedClip.startTime = clip.startTime + offset;
    updatedClip.endTime = clip.endTime + offset;

    return { action: 'slide', clip: updatedClip };
  }

  applyRippleEffect(trimmedClip) {
    const affectedClips = this.state.clips.filter(c => 
      c.track === trimmedClip.track && c.startTime >= trimmedClip.endTime
    );

    const offset = trimmedClip.endTime - trimmedClip.startTime;
    affectedClips.forEach(ac => {
      ac.startTime += offset;
      ac.endTime += offset;
    });
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.tabs = [];
    this.activeTabId = null;
  }
}

export function createAdvancedTimeline(timelineState, container) {
  return new AdvancedTimeline(timelineState).init(container);
}