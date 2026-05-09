/**
 * Timeline State Adapter for AI Features
 * Wraps the timeline state object to provide a consistent API for AI features
 * 
 * Supports both legacy state format (tracks at root level) and
 * TimelineState format (tracks in project.tracks)
 */

export class TimelineStateAdapter {
  constructor(state) {
    this.state = state;
  }

  /**
   * Get tracks from state (handles both legacy and TimelineState formats)
   */
  _getTracks() {
    if (Array.isArray(this.state.tracks)) {
      return this.state.tracks;
    }
    if (this.state.project && Array.isArray(this.state.project.tracks)) {
      return this.state.project.tracks;
    }
    return [];
  }

  addClip(clip) {
    const tracks = this._getTracks();
    const videoTrack = tracks.find(t => t.type === 'video' || t.name === 'Video');
    if (videoTrack) {
      const newClip = {
        id: Date.now(),
        name: clip.name || 'AI Generated',
        start: clip.start || clip.left || 0,
        end: clip.end || (clip.start || 0) + (clip.duration || 5),
        duration: clip.duration || 5,
        type: 'video',
        src: clip.src || clip.url || '',
        poster: clip.poster || ''
      };
      videoTrack.items.push(newClip);
      return newClip;
    }
    return null;
  }

  addClipAtStart(clip) {
    return this.addClip(clip);
  }

  addAudioTrack(audioClip) {
    const tracks = this._getTracks();
    const audioTrack = tracks.find(t => t.type === 'audio' || t.name === 'Audio');
    if (audioTrack) {
      const newClip = {
        id: Date.now(),
        name: audioClip.name || 'AI Generated Audio',
        start: audioClip.start || 0,
        end: audioClip.end || (audioClip.start || 0) + (audioClip.duration || 30),
        duration: audioClip.duration || 30,
        type: 'audio',
        src: audioClip.src || audioClip.url || ''
      };
      audioTrack.items.push(newClip);
      return newClip;
    }
    return null;
  }

  getSelectedClips() {
    const tracks = this._getTracks();
    if (!this.state.selectedClipId) return [];
    const clips = [];
    tracks.forEach(track => {
      if (track.items) {
        const clip = track.items.find(c => c.id === this.state.selectedClipId);
        if (clip) clips.push(clip);
      }
    });
    return clips;
  }

  getClips() {
    const tracks = this._getTracks();
    const clips = [];
    tracks.forEach(track => {
      if (track.items) {
        clips.push(...track.items);
      }
    });
    return clips;
  }

  getVideoTrack() {
    const tracks = this._getTracks();
    return tracks.find(t => t.type === 'video' || t.name === 'Video');
  }

  getAudioTrack() {
    const tracks = this._getTracks();
    return tracks.find(t => t.type === 'audio' || t.name === 'Audio');
  }
}

export function createTimelineStateAdapter(state) {
  return new TimelineStateAdapter(state);
}
