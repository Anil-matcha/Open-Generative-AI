export class Timeline {
  constructor() {
    this.state = {
      zoom: 1,
      playheadPercent: 32,
      timelineSeconds: 60,
      tracks: [
        { id: 'video-1', name: 'Video', muted: false, solo: false, locked: true, clips: [
          { id: 1, name: 'Opening Shot', left: 8, width: 18, type: 'video' },
          { id: 2, name: 'Generated Clip', left: 34, width: 16, type: 'video' }
        ] },
        { id: 'audio-1', name: 'Audio', muted: false, solo: false, locked: false, clips: [
          { id: 3, name: 'Music Bed', left: 5, width: 42, type: 'audio' }
        ] },
        { id: 'text-1', name: 'Text', muted: false, solo: false, locked: false, clips: [
          { id: 4, name: 'Title Card', left: 14, width: 12, type: 'text' }
        ] },
        { id: 'broll-1', name: 'B-Roll', muted: false, solo: false, locked: false, clips: [
          { id: 5, name: 'City Cutaway', left: 52, width: 20, type: 'broll' }
        ] }
      ]
    };
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
    toolbarLeft.appendChild(zoomOutBtn);

    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'mini-btn';
    zoomInBtn.dataset.action = 'zoom-in';
    zoomInBtn.textContent = '🔍+';
    zoomInBtn.title = 'Zoom in on the timeline';
    toolbarLeft.appendChild(zoomInBtn);

    // Add track buttons
    ['Video', 'Audio', 'Text', 'B-Roll'].forEach(type => {
      const btn = document.createElement('button');
      btn.className = 'mini-btn';
      btn.dataset.addTrack = type;
      btn.textContent = `+${type}`;
      btn.title = `Add a new ${type.toLowerCase()} track`;
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

      const meta = document.createElement('div');
      meta.className = 'track-meta';
      meta.innerHTML = `
        <div class="track-name">${track.name}</div>
        <div class="track-actions">
          <button class="track-toggle ${track.muted ? 'locked' : ''}" data-toggle="mute">M</button>
          <button class="track-toggle ${track.solo ? 'locked' : ''}" data-toggle="solo">S</button>
          <button class="track-toggle ${track.locked ? 'locked' : ''}" data-toggle="lock">L</button>
        </div>
        <div class="track-count">${track.clips.length} clips</div>
      `;

      meta.querySelectorAll('.track-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.toggle;
          if (key === 'mute') track.muted = !track.muted;
          if (key === 'solo') track.solo = !track.solo;
          if (key === 'lock') track.locked = !track.locked;
          this.renderTracks(container);
        });
      });

      const lane = document.createElement('div');
      lane.className = 'track-lane';

      track.clips.forEach(clip => {
        const clipEl = document.createElement('button');
        clipEl.className = 'clip';
        clipEl.style.left = `${clip.left}%`;
        clipEl.style.width = `${clip.width}%`;
        clipEl.innerHTML = `<span class="clip-label">${clip.name}</span>`;
        clipEl.addEventListener('click', () => {
          this.state.selectedClipId = clip.id;
          this.renderTracks(container);
        });
        lane.appendChild(clipEl);
      });

      row.appendChild(meta);
      row.appendChild(lane);
      container.appendChild(row);
    });
  }

  renderTools(container) {
    container.innerHTML = '';
    const tools = [['↖', 'Select'], ['✂', 'Blade'], ['⤵', 'Ripple'], ['⤶', 'Roll'], ['⇿', 'Slip'], ['⇆', 'Slide'], ['🔍', 'Zoom'], ['👋', 'Hand']];
    tools.forEach(([icon, label]) => {
      const btn = document.createElement('button');
      btn.className = 'tool-btn';
      btn.textContent = icon;
      btn.title = label;
      btn.addEventListener('click', () => {
        this.state.selectedTool = label;
        this.renderTools(container);
      });
      container.appendChild(btn);
    });
  }

  renderPills(container) {
    container.innerHTML = '';
    const pills = ['Text to Video', 'Image to Video', 'Retake', 'Extend', 'B-Roll', 'Music Gen', 'Audio Sync', 'Fill Gap AI', 'Elements', 'Dual Viewer'];
    pills.forEach(pill => {
      const span = document.createElement('span');
      span.className = 'pill';
      span.textContent = pill;
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
    // Zoom buttons
    container.querySelectorAll('[data-action="zoom-in"]').forEach(btn =>
      btn.addEventListener('click', () => {
        this.state.zoom = Math.min(2, this.state.zoom + 0.1);
      })
    );

    container.querySelectorAll('[data-action="zoom-out"]').forEach(btn =>
      btn.addEventListener('click', () => {
        this.state.zoom = Math.max(0.5, this.state.zoom - 0.1);
      })
    );

    // Add track buttons
    container.querySelectorAll('[data-add-track]').forEach(btn =>
      btn.addEventListener('click', () => {
        const type = btn.dataset.addTrack;
        this.state.tracks.push({
          id: `${type.toLowerCase()}-${Date.now()}`,
          name: type,
          muted: false,
          solo: false,
          locked: false,
          clips: []
        });
        this.renderTracks(container.querySelector('#trackRows'));
      })
    );
  }
}