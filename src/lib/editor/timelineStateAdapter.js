/**
 * Timeline State Adapter for AI Features
 * Wraps the timeline state object to provide a consistent API for AI features
 */

export class TimelineStateAdapter {
  constructor(state) {
    this.state = state;
  }

  addClip(clip) {
    const videoTrack = this.state.tracks.find(t => t.type === 'video' || t.name === 'Video');
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
    const audioTrack = this.state.tracks.find(t => t.type === 'audio' || t.name === 'Audio');
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
    if (!this.state.selectedClipId) return [];
    const clips = [];
    this.state.tracks.forEach(track => {
      if (track.items) {
        const clip = track.items.find(c => c.id === this.state.selectedClipId);
        if (clip) clips.push(clip);
      }
    });
    return clips;
  }

  getClips() {
    const clips = [];
    this.state.tracks.forEach(track => {
      if (track.items) {
        clips.push(...track.items);
      }
    });
    return clips;
  }

  getVideoTrack() {
    return this.state.tracks.find(t => t.type === 'video' || t.name === 'Video');
  }

  getAudioTrack() {
    return this.state.tracks.find(t => t.type === 'audio' || t.name === 'Audio');
  }
}

export function createTimelineStateAdapter(state) {
  return new TimelineStateAdapter(state);
}
