import { Component } from '../../components/base/Component.js';

export class Timeline extends Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      zoom: 1,
      playheadPercent: 32,
      timelineSeconds: 60,
      tracks: [
        { id: 'video-1', name: 'Video', muted: false, solo: false, locked: true, clips: [
            { id: 1, name: 'Opening Shot', left: 8, width: 18, type: 'video' },
            { id: 2, name: 'Generated Clip', left: 34, width: 16, type: 'video' }
          ]},
        { id: 'audio-1', name: 'Audio', muted: false, solo: false, locked: false, clips: [
            { id: 3, name: 'Music Bed', left: 5, width: 42, type: 'audio' }
          ]},
        { id: 'text-1', name: 'Text', muted: false, solo: false, locked: false, clips: [
            { id: 4, name: 'Title Card', left: 14, width: 12, type: 'text' }
          ]},
        { id: 'broll-1', name: 'B-Roll', muted: false, solo: false, locked: false, clips: [
            { id: 5, name: 'City Cutaway', left: 52, width: 20, type: 'broll' }
          ]}
      ]
    };

    // Bind methods to preserve context
    this.handleZoomIn = this.handleZoomIn.bind(this);
    this.handleZoomOut = this.handleZoomOut.bind(this);
    this.handleAddTrack = this.handleAddTrack.bind(this);
    this.handleToolSelect = this.handleToolSelect.bind(this);
    this.handleClipClick = this.handleClipClick.bind(this);
    this.handleTrackToggle = this.handleTrackToggle.bind(this);
    this.handleMute = this.handleMute.bind(this);
    this.handleSolo = this.handleSolo.bind(this);
    this.handleLock = this.handleLock.bind(this);
  }

  // Zoom handlers
  handleZoomIn() {
    this.setState({ zoom: Math.min(2, this.state.zoom + 0.1) });
  }

  handleZoomOut() {
    this.setState({ zoom: Math.max(0.5, this.state.zoom - 0.1) });
  }

  handleAddTrack(type) {
    this.state.tracks.push({
      id: `${type.toLowerCase()}-${Date.now()}`,
      name: type,
      muted: false,
      solo: false,
      locked: false,
      clips: []
    });
    // Re-render track rows only (simplified)
    const trackRows = this.element?.querySelector('#trackRows');
    if (trackRows) {
      this.renderTracks(trackRows);
    }
  }

  handleToolSelect(label) {
    this.setState({ selectedTool: label });
  }

  handleClipClick(clipId) {
    this.setState({ selectedClipId: clipId });
  }

  handleTrackToggle(trackId, key) {
    const track = this.state.tracks.find(t => t.id === trackId);
    if (track) {
      track[key] = !track[key];
      // Re-render track rows
      const trackRows = this.element?.querySelector('#trackRows');
      if (trackRows) {
        this.renderTracks(trackRows);
      }
    }
  }

  handleMute(trackId) { this.handleTrackToggle(trackId, 'muted'); }
  handleSolo(trackId) { this.handleTrackToggle(trackId, 'solo'); }
  handleLock(trackId) { this.handleTrackToggle(trackId, 'locked'); }

  onUnmount() {
    // Cleanup handled by base class
  }

  render() {
    const container = document.createElement('section');
    container.className = 'timeline-card';

    // Timeline top toolbar
    const top = document.createElement('div');
    top.className = 'timeline-top';

    const toolbarLeft = document.createElement('div');
    toolbarLeft.className = 'toolbar-left';

    // Tool group
    const toolGroup = document.createElement('div');
    toolGroup.className = 'tool-group';
    toolGroup.id = 'toolGroup';
    toolbarLeft.appendChild(toolGroup);

    // Zoom buttons
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'mini-btn';
    zoomOutBtn.dataset.action = 'zoom-out';
    zoomOutBtn.textContent = '🔍-';
    zoomOutBtn.title = 'Zoom out on the timeline';
    zoomOutBtn.dataset.tooltip = 'Zoom Out — Decrease the timeline zoom level to see more of the project at once';
    toolbarLeft.appendChild(zoomOutBtn);

    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'mini-btn';
    zoomInBtn.dataset.action = 'zoom-in';
    zoomInBtn.textContent = '🔍+';
    zoomInBtn.title = 'Zoom in on the timeline';
    zoomInBtn.dataset.tooltip = 'Zoom In — Increase the timeline zoom level to see finer detail in your clips';
    toolbarLeft.appendChild(zoomInBtn);

    // Add track buttons
    ['Video', 'Audio', 'Text', 'B-Roll'].forEach(type => {
      const btn = document.createElement('button');
      btn.className = 'mini-btn';
      btn.dataset.addTrack = type;
      btn.textContent = `+${type}`;
      btn.title = `Add a new ${type.toLowerCase()} track`;
      btn.dataset.tooltip = `Add ${type} Track — Create a new ${type.toLowerCase()} track at the bottom of the timeline for adding ${type.toLowerCase()} clips`;
      toolbarLeft.appendChild(btn);
    });

    top.appendChild(toolbarLeft);

    // Pills
    const pillRow = document.createElement('div');
    pillRow.className = 'pill-row';
    pillRow.id = 'pillRow';
    top.appendChild(pillRow);

    container.appendChild(top);

    // Timeline shell
    const shell = document.createElement('div');
    shell.className = 'timeline-shell';

    const header = document.createElement('div');
    header.className = 'timeline-header';
    header.innerHTML = '<div>Tracks</div><div>Timeline</div>';
    shell.appendChild(header);

    const body = document.createElement('div');
    body.className = 'timeline-body';
    body.id = 'timelineBody';

    // Playhead layer
    const playheadLayer = document.createElement('div');
    playheadLayer.className = 'playhead-layer';
    const playheadLine = document.createElement('div');
    playheadLine.className = 'playhead-line';
    playheadLine.id = 'playheadLine';
    playheadLayer.appendChild(playheadLine);
    const playheadKnob = document.createElement('div');
    playheadKnob.className = 'playhead-knob';
    playheadKnob.id = 'playheadKnob';
    playheadLayer.appendChild(playheadKnob);
    body.appendChild(playheadLayer);

    // Track rows
    const trackRows = document.createElement('div');
    trackRows.id = 'trackRows';
    body.appendChild(trackRows);

    shell.appendChild(body);
    container.appendChild(shell);

    // Initialize timeline
    this.renderTracks(trackRows);
    this.renderTools(toolGroup);
    this.renderPills(pillRow);
    this.updatePlayhead();

    // Bind events
    this.bindEvents(container);

    return container;
  }

  renderTracks(container) {
    container.innerHTML = '';
    this.state.tracks.forEach(track => {
      const row = document.createElement('div');
      row.className = 'track-row';
      row.dataset.trackId = track.id;

      const meta = document.createElement('div');
      meta.className = 'track-meta';
      meta.innerHTML = `
        <div class="track-name">${track.name}</div>
        <div class="track-actions">
          <button class="track-toggle ${track.muted ? 'locked' : ''}" data-toggle="mute" title="Mute" data-tooltip="Mute Track — Silence this track's audio during playback">M</button>
          <button class="track-toggle ${track.solo ? 'locked' : ''}" data-toggle="solo" title="Solo" data-tooltip="Solo Track — Play only this track and mute all others">S</button>
          <button class="track-toggle ${track.locked ? 'locked' : ''}" data-toggle="lock" title="Lock" data-tooltip="Lock Track — Prevent this track from being edited or moved">L</button>
        </div>
        <div class="track-count">${track.clips.length} clips</div>
      `;

      const lane = document.createElement('div');
      lane.className = 'track-lane';

      track.clips.forEach(clip => {
        const clipEl = document.createElement('button');
        clipEl.className = 'clip';
        clipEl.style.left = `${clip.left}%`;
        clipEl.style.width = `${clip.width}%`;
        clipEl.dataset.clipId = clip.id;
        clipEl.title = clip.name;
        clipEl.dataset.tooltip = `${clip.name} — Click to select this ${clip.type} clip for editing`;
        clipEl.innerHTML = `<span class="clip-label">${clip.name}</span>`;
        lane.appendChild(clipEl);
      });

      row.appendChild(meta);
      row.appendChild(lane);
      container.appendChild(row);
    });
  }

  renderTools(container) {
    container.innerHTML = '';
    const tools = [['↖', 'Select', 'Select Tool — Click and drag to select clips on the timeline'], ['✂', 'Blade', 'Blade Tool — Cut clips at the playhead position'], ['⤵', 'Ripple', 'Ripple Tool — Trim clips and automatically close gaps'], ['⤶', 'Roll', 'Roll Tool — Adjust the edit point between two adjacent clips'], ['⇿', 'Slip', 'Slip Tool — Change the in/out points of a clip without moving it'], ['⇆', 'Slide', 'Slide Tool — Move a clip left or right while keeping its content'], ['🔍', 'Zoom', 'Zoom Tool — Click to zoom in on a specific area of the timeline'], ['👋', 'Hand', 'Hand Tool — Pan and scroll around the timeline']];
    tools.forEach(([icon, label, tooltip]) => {
      const btn = document.createElement('button');
      btn.className = 'tool-btn';
      btn.textContent = icon;
      btn.title = label;
      btn.dataset.tooltip = tooltip;
      btn.addEventListener('click', () => {
        this.state.selectedTool = label;
        this.renderTools(container);
      });
      container.appendChild(btn);
    });
  }

  renderPills(container) {
    container.innerHTML = '';
    const pills = [
      ['Text to Video', 'Generate a video clip from a text description'],
      ['Image to Video', 'Animate a static image into a video clip'],
      ['Retake', 'Regenerate the selected AI clip with a new prompt'],
      ['Extend', 'Lengthen the selected clip by generating additional frames'],
      ['B-Roll', 'Add supplementary footage to enhance your edit'],
      ['Music Gen', 'Generate AI background music for your project'],
      ['Audio Sync', 'Automatically synchronize audio to match your video'],
      ['Fill Gap AI', 'Intelligently fill gaps in the timeline with generated content'],
      ['Elements', 'Add visual elements such as overlays and graphics'],
      ['Dual Viewer', 'Open a side-by-side viewer to compare two clips']
    ];
    pills.forEach(([label, tooltip]) => {
      const span = document.createElement('span');
      span.className = 'pill';
      span.textContent = label;
      span.dataset.tooltip = `${label} — ${tooltip}`;
      container.appendChild(span);
    });
  }

  updatePlayhead() {
    const playheadLine = document.getElementById('playheadLine');
    const playheadKnob = document.getElementById('playheadKnob');
    if (playheadLine) playheadLine.style.left = `${this.state.playheadPercent}%`;
    if (playheadKnob) playheadKnob.style.left = `calc(${this.state.playheadPercent}% - 4px)`;
  }

  bindEvents(container) {
    // Use event delegation to handle dynamic content and simplify cleanup

    // Zoom buttons
    this.addEventListener(container, 'click', (e) => {
      const target = e.target.closest('[data-action="zoom-in"]');
      if (target) {
        this.handleZoomIn();
      }
    });

    this.addEventListener(container, 'click', (e) => {
      const target = e.target.closest('[data-action="zoom-out"]');
      if (target) {
        this.handleZoomOut();
      }
    });

    // Add track buttons
    this.addEventListener(container, 'click', (e) => {
      const btn = e.target.closest('[data-add-track]');
      if (btn) {
        this.handleAddTrack(btn.dataset.addTrack);
      }
    });

    // Tool buttons
    this.addEventListener(container, 'click', (e) => {
      const btn = e.target.closest('.tool-btn');
      if (btn) {
        const label = btn.title;
        if (label) {
          this.handleToolSelect(label);
        }
      }
    });

    // Clip click
    this.addEventListener(container, 'click', (e) => {
      const clipEl = e.target.closest('.clip');
      if (clipEl) {
        const clipId = parseInt(clipEl.dataset.clipId, 10);
        if (!isNaN(clipId)) {
          this.handleClipClick(clipId);
        }
      }
    });

    // Track toggles (Mute/Solo/Lock)
    this.addEventListener(container, 'click', (e) => {
      const btn = e.target.closest('.track-toggle[data-toggle]');
      if (btn) {
        const row = btn.closest('.track-row');
        const trackId = row?.dataset?.trackId;
        const toggle = btn.dataset.toggle;
        if (trackId) {
          if (toggle === 'mute') this.handleMute(trackId);
          else if (toggle === 'solo') this.handleSolo(trackId);
          else if (toggle === 'lock') this.handleLock(trackId);
        }
      }
    });
   }
}
