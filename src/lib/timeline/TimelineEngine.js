/**
 * TimelineEngine - Core timeline state management and operations
 * Handles tracks, clips, playback, undo/redo, and media processing
 */

export class TimelineEngine {
  constructor() {
    this.tracks = [];
    this.duration = 0;
    this.playhead = 0;
    this.playing = false;
    this.zoom = 1;
    this.undoStack = [];
    this.redoStack = [];
    this.mediaLoader = null;
    this.onTimeUpdate = null;
    this.onStateChange = null;
  }

  // Initialization
  loadProject(projectData) {
    this.tracks = projectData.tracks || [];
    this.duration = projectData.duration || 0;
    this.playhead = projectData.playhead || 0;
    this.zoom = projectData.zoom || 1;
    this._notifyStateChange();
    return true;
  }

  saveProject() {
    return {
      tracks: this.tracks,
      duration: this.duration,
      playhead: this.playhead,
      zoom: this.zoom,
      timestamp: Date.now()
    };
  }

  // Track Management
  addTrack(name, type) {
    const track = {
      id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || `${type} Track`,
      type: type || 'video',
      clips: [],
      muted: false,
      solo: false,
      locked: false,
      visible: true
    };
    this.tracks.push(track);
    this._notifyStateChange();
    return track.id;
  }

  removeTrack(trackId) {
    const index = this.tracks.findIndex(t => t.id === trackId);
    if (index === -1) return false;

    this.tracks.splice(index, 1);
    this._notifyStateChange();
    return true;
  }

  getTrack(trackId) {
    return this.tracks.find(t => t.id === trackId);
  }

  getTracks() {
    return [...this.tracks];
  }

  // Clip Management
  addClip(trackId, clipData) {
    const track = this.getTrack(trackId);
    if (!track) return null;

    const clip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...clipData,
      trackId,
      selected: false
    };

    track.clips.push(clip);
    this._updateDuration();
    this._notifyStateChange();
    return clip.id;
  }

  removeClip(trackId, clipId) {
    const track = this.getTrack(trackId);
    if (!track) return false;

    const index = track.clips.findIndex(c => c.id === clipId);
    if (index === -1) return false;

    track.clips.splice(index, 1);
    this._updateDuration();
    this._notifyStateChange();
    return true;
  }

  moveClip(trackId, clipId, newStartTime) {
    const track = this.getTrack(trackId);
    if (!track) return false;

    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return false;

    const duration = clip.endTime - clip.startTime;
    clip.startTime = Math.max(0, newStartTime);
    clip.endTime = clip.startTime + duration;

    this._updateDuration();
    this._saveSnapshot();
    this._notifyStateChange();
    return true;
  }

  resizeClip(trackId, clipId, newStartTime, newEndTime) {
    const track = this.getTrack(trackId);
    if (!track) return false;

    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return false;

    clip.startTime = Math.max(0, newStartTime);
    clip.endTime = Math.max(clip.startTime + 0.1, newEndTime);

    this._updateDuration();
    this._notifyStateChange();
    return true;
  }

  getClip(trackId, clipId) {
    const track = this.getTrack(trackId);
    return track ? track.clips.find(c => c.id === clipId) : null;
  }

  // Playback Control
  play() {
    if (this.playing) return;
    this.playing = true;
    this._notifyStateChange();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    this._notifyStateChange();
  }

  stop() {
    this.playing = false;
    this.playhead = 0;
    this._notifyStateChange();
  }

  setPlayhead(time) {
    this.playhead = Math.max(0, time); // Allow setting beyond current duration
    this._notifyStateChange();
    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.playhead);
    }
  }

  isPlaying() {
    return this.playing;
  }

  getPlayhead() {
    return this.playhead;
  }

  // State Management
  undo() {
    if (this.undoStack.length === 0) return false;

    const snapshot = this.undoStack.pop();
    this.redoStack.push(this._createSnapshot());
    this._restoreSnapshot(snapshot);
    this._notifyStateChange();
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;

    const snapshot = this.redoStack.pop();
    this.undoStack.push(this._createSnapshot());
    this._restoreSnapshot(snapshot);
    this._notifyStateChange();
    return true;
  }

  saveSnapshot() {
    this._saveSnapshot();
    return this._createSnapshot();
  }

  restoreSnapshot(snapshot) {
    this._restoreSnapshot(snapshot);
    this._notifyStateChange();
  }

  // Media Processing
  setMediaLoader(loader) {
    this.mediaLoader = loader;
  }

  async loadMedia(mediaId) {
    if (!this.mediaLoader) {
      throw new Error('No media loader configured');
    }
    return await this.mediaLoader(mediaId);
  }

  // Getters
  getDuration() {
    return this.duration;
  }

  getZoom() {
    return this.zoom;
  }

  setZoom(zoom) {
    this.zoom = Math.max(0.1, Math.min(10, zoom));
    this._notifyStateChange();
  }

  // Event handling
  on(event, callback) {
    if (event === 'timeupdate') {
      this.onTimeUpdate = callback;
    } else if (event === 'statechange') {
      this.onStateChange = callback;
    }
  }

  // Private methods
  _updateDuration() {
    let maxEndTime = 0;
    this.tracks.forEach(track => {
      track.clips.forEach(clip => {
        maxEndTime = Math.max(maxEndTime, clip.endTime || 0);
      });
    });
    this.duration = maxEndTime;
  }

  _saveSnapshot() {
    this.undoStack.push(this._createSnapshot());
    // Limit undo stack
    if (this.undoStack.length > 50) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  _createSnapshot() {
    return {
      tracks: JSON.parse(JSON.stringify(this.tracks)),
      duration: this.duration,
      playhead: this.playhead,
      zoom: this.zoom
    };
  }

  _restoreSnapshot(snapshot) {
    this.tracks = JSON.parse(JSON.stringify(snapshot.tracks));
    this.duration = snapshot.duration;
    this.playhead = snapshot.playhead;
    this.zoom = snapshot.zoom;
  }

  _notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }
}