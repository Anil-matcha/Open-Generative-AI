/**
 * Timeline Editor State Management (Enhanced)
 * Centralized state for the AI Timeline Editor with advanced features
 */

export const createTimelineState = () => ({
  // Project metadata
  project: {
    id: 'project-1',
    fps: 30,
    duration: 60,
    aspectRatio: '16:9',
    tracks: [],
    assets: [],
    markers: [],
    captions: [],
    effects: []
  },
  projectTitle: 'Untitled Project',

  // Enhanced timeline state
  timelineSeconds: 60,
  zoom: 1.0,
  pan: 0,
  isTimelineOpen: true,
  timelineHeight: 300,
  playheadPercent: 32,

  // UI state
  selectedTool: 'Select',
  selectedClipId: 1,
  generateType: 'Text',
  playing: false,

  // Advanced features state
  snapEnabled: true,
  autoScrollEnabled: true,
  showRuler: true,
  showWaveforms: true,
  selectedRange: null,
  clipboard: null,

  // Multi-camera editing features
  multiCameraMode: false,
  pipMode: false,
  splitScreenMode: false,
  cameraAngles: [],
  activeCameraAngle: null,
  compositingMode: 'normal', // 'normal', 'multiply', 'screen', 'overlay', 'soft-light'

  // Tracks data (enhanced)
  tracks: [
    {
      id: 'video-1',
      type: 'video',
      name: 'Video',
      locked: false,
      muted: false,
      solo: false,
      visible: true,
      height: 80,
      color: '#3b82f6',
      items: [
        {
          id: 1,
          assetId: 'asset-1',
          type: 'video',
          start: 4.8,
          end: 22.8,
          sourceStart: 0,
          sourceEnd: 18,
          lane: 0,
          trimIn: 0,
          trimOut: 18,
          volume: 1,
          playbackRate: 1,
          effects: [],
          opacity: 1,
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          name: 'Opening Shot'
        },
        {
          id: 2,
          assetId: 'asset-2',
          type: 'video',
          start: 20.4,
          end: 32.4,
          sourceStart: 0,
          sourceEnd: 12,
          lane: 0,
          trimIn: 0,
          trimOut: 12,
          volume: 1,
          playbackRate: 1,
          effects: [],
          opacity: 1,
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          name: 'Generated Clip'
        }
      ]
    },
    {
      id: 'audio-1',
      type: 'audio',
      name: 'Audio',
      locked: false,
      muted: false,
      solo: false,
      visible: true,
      height: 60,
      color: '#10b981',
      items: [
        {
          id: 3,
          assetId: 'asset-3',
          type: 'audio',
          start: 3,
          end: 45,
          sourceStart: 0,
          sourceEnd: 42,
          lane: 0,
          trimIn: 0,
          trimOut: 42,
          volume: 0.8,
          playbackRate: 1,
          effects: [],
          opacity: 1,
          waveformData: [0.1, 0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.2, 0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.2, 0.1],
          name: 'Music Bed'
        }
      ]
    },
    {
      id: 'text-1',
      type: 'text',
      name: 'Text',
      locked: false,
      muted: false,
      solo: false,
      visible: true,
      height: 50,
      color: '#f59e0b',
      items: [
        {
          id: 4,
          assetId: 'asset-4',
          type: 'text',
          start: 8.4,
          end: 16.8,
          sourceStart: 0,
          sourceEnd: 8.4,
          lane: 0,
          trimIn: 0,
          trimOut: 8.4,
          volume: 1,
          playbackRate: 1,
          effects: [],
          opacity: 1,
          text: 'Welcome to our enhanced timeline editor',
          style: {
            fontSize: 24,
            color: '#ffffff',
            background: 'rgba(0,0,0,0.7)',
            fontFamily: 'Inter',
            textAlign: 'center'
          },
          name: 'Title Card'
        }
      ]
    },
    {
      id: 'broll-1',
      type: 'video',
      name: 'B-Roll',
      locked: false,
      muted: false,
      solo: false,
      visible: true,
      height: 60,
      color: '#8b5cf6',
      items: [
        {
          id: 5,
          assetId: 'asset-5',
          type: 'video',
          start: 31.2,
          end: 43.2,
          sourceStart: 0,
          sourceEnd: 12,
          lane: 0,
          trimIn: 0,
          trimOut: 12,
          volume: 1,
          playbackRate: 1,
          effects: [],
          opacity: 1,
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          name: 'City Cutaway'
        }
      ]
    },
    {
      id: 'captions-1',
      type: 'caption',
      name: 'Captions',
      locked: false,
      muted: false,
      solo: false,
      visible: true,
      height: 45,
      color: '#ef4444',
      items: [
        {
          id: 6,
          assetId: null,
          type: 'caption',
          start: 6,
          end: 12,
          sourceStart: 0,
          sourceEnd: 6,
          lane: 0,
          trimIn: 0,
          trimOut: 6,
          volume: 1,
          playbackRate: 1,
          effects: [],
          opacity: 1,
          text: 'Welcome to our video',
          style: {
            fontSize: 24,
            color: '#ffffff',
            background: 'rgba(0,0,0,0.7)',
            fontFamily: 'Inter',
            textAlign: 'center'
          }
        }
      ]
    }
  ],

  // Assets (enhanced)
  assets: [
    { id: 'asset-1', type: 'video', name: 'Opening Shot', duration: 18, url: null, thumbnail: null },
    { id: 'asset-2', type: 'video', name: 'Generated Clip', duration: 12, url: null, thumbnail: null },
    { id: 'asset-3', type: 'audio', name: 'Music Bed', duration: 42, url: null, waveformData: [0.1, 0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.2, 0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.2, 0.1] },
    { id: 'asset-4', type: 'text', name: 'Title Card', duration: 8.4, url: null },
    { id: 'asset-5', type: 'video', name: 'City Cutaway', duration: 12, url: null, thumbnail: null }
  ],

  // Enhanced UI elements
  tools: [
    ['↖', 'Select', 'Select and move clips'],
    ['✂', 'Blade', 'Split clips at cursor'],
    ['⤵', 'Ripple', 'Trim with ripple effect'],
    ['⤶', 'Roll', 'Adjust edit points'],
    ['⇿', 'Slip', 'Slip clip content'],
    ['⇆', 'Slide', 'Slide clip position'],
    ['🔍', 'Zoom', 'Zoom timeline view'],
    ['✋', 'Hand', 'Pan timeline view'],
    ['🎥', 'Record', 'Record webcam'],
    ['🖼️', 'Generate Image', 'AI image generation'],
    ['🎨', 'Edit Image', 'Image editing tools'],
    ['🔊', 'Text to Speech', 'Generate voiceovers'],
    ['📺', 'Multi-Camera', 'Multi-camera editing mode'],
    ['🖼️', 'Picture-in-Picture', 'Add PIP overlay'],
    ['📱', 'Split Screen', 'Split screen layouts'],
    ['🎬', 'Camera Angles', 'Manage camera angles']
  ],

  // Methods for timeline operations
  updateClipDuration: function(clipId, updates) {
    const trackIndex = this.tracks.findIndex(track =>
      track.items.some(item => item.id === clipId)
    );

    if (trackIndex === -1) return false;

    const itemIndex = this.tracks[trackIndex].items.findIndex(item => item.id === clipId);
    if (itemIndex === -1) return false;

    const item = this.tracks[trackIndex].items[itemIndex];

    // Update trim values
    if (updates.trimIn !== undefined) {
      item.trimIn = Math.max(0, Math.min(updates.trimIn, item.trimOut - 0.1));
    }
    if (updates.trimOut !== undefined) {
      item.trimOut = Math.max(item.trimIn + 0.1, Math.min(updates.trimOut, item.sourceEnd));
    }

    // Update start/end times based on trim changes
    const trimmedDuration = item.trimOut - item.trimIn;
    if (updates.trimIn !== undefined || updates.trimOut !== undefined) {
      item.end = item.start + trimmedDuration;
    }

    return true;
  },

  // Multi-camera methods
  addCameraAngle: function(name, color = '#3b82f6') {
    const angle = {
      id: `angle-${Date.now()}`,
      name: name,
      color: color,
      tracks: []
    };
    this.cameraAngles.push(angle);
    return angle.id;
  },

  removeCameraAngle: function(angleId) {
    this.cameraAngles = this.cameraAngles.filter(angle => angle.id !== angleId);
    if (this.activeCameraAngle === angleId) {
      this.activeCameraAngle = this.cameraAngles[0]?.id || null;
    }
  },

  switchToCameraAngle: function(angleId) {
    this.activeCameraAngle = angleId;
  },

  addPipWindow: function(clipId, config = {}) {
    const pipWindow = {
      id: `pip-${Date.now()}`,
      clipId: clipId,
      position: config.position || 'top-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'custom'
      size: config.size || { width: 0.3, height: 0.3 }, // relative to main canvas
      x: config.x || 0.7,
      y: config.y || 0.1,
      opacity: config.opacity || 1.0,
      borderRadius: config.borderRadius || 8,
      shadow: config.shadow || true,
      blendMode: config.blendMode || 'normal'
    };
    this.pipWindows.push(pipWindow);
    return pipWindow.id;
  },

  removePipWindow: function(pipId) {
    this.pipWindows = this.pipWindows.filter(pip => pip.id !== pipId);
  },

  updatePipWindow: function(pipId, updates) {
    const pip = this.pipWindows.find(p => p.id === pipId);
    if (pip) {
      Object.assign(pip, updates);
    }
  },

  setSplitScreen: function(type, ratio = 0.5) {
    this.splitScreenMode = true;
    this.pipMode = false;
    this.splitScreenConfig = {
      type: type, // 'horizontal', 'vertical', 'quad'
      ratio: ratio,
      transition: 'none'
    };
  },

  disableSplitScreen: function() {
    this.splitScreenMode = false;
  },

  togglePipMode: function() {
    this.pipMode = !this.pipMode;
    if (this.pipMode) {
      this.splitScreenMode = false;
    }
  },

  pills: [
    'Text to Video',
    'Image to Video',
    'Retake',
    'Extend',
    'B-Roll',
    'Music Gen',
    'Audio Sync',
    'Fill Gap AI',
    'Elements',
    'Dual Viewer'
  ],

  topIcons: ['👁','📺','📁','⚡','🎵','🔊','🎞️','👤','⚙️','💬','📋'],

  // Media library items
  media: [
    {
      icon: '🎬',
      label: 'Video Clip',
      desc: 'Insert a source shot or generated video clip.',
      type: 'video',
      category: 'media'
    },
    {
      icon: '🖼️',
      label: 'Generated Image',
      desc: 'AI-generated images from prompts.',
      type: 'image',
      category: 'generated'
    },
    {
      icon: '🎨',
      label: 'Edited Image',
      desc: 'Background removed or enhanced images.',
      type: 'image',
      category: 'edited'
    },
    {
      icon: '🎵',
      label: 'Audio Track',
      desc: 'Place music, voiceover, or sound design assets.',
      type: 'audio',
      category: 'media'
    },
    {
      icon: '🔊',
      label: 'Generated Speech',
      desc: 'AI-generated voiceovers from text.',
      type: 'audio',
      category: 'generated'
    },
    {
      icon: '🎞️',
      label: 'B-Roll Asset',
      desc: 'Drop in cutaways, overlays, or support footage.',
      type: 'video',
      category: 'broll'
    },
    {
      icon: '📝',
      label: 'Text Element',
      desc: 'Add titles, captions, or text overlays.',
      type: 'text',
      category: 'element'
    }
  ],

  generateTypes: [
    ['✍️', 'Text', 'Generate video from text prompt'],
    ['🖼️', 'Image', 'Generate video from image'],
    ['🔄', 'Retake', 'Regenerate existing clip'],
    ['➡️', 'Extend', 'Extend video duration'],
    ['🎞️', 'B-Roll', 'Generate supporting footage']
  ],

  quickCommands: [
    '⚡Generate',
    'Retake',
    'Extend',
    'B-Roll',
    'Add Text',
    'Split Clip'
  ],

  railActions: [
    ['⚡', 'Generate', true],
    ['✂️', 'Split'],
    ['🎬', 'Scenes'],
    ['💬', 'Subtitle'],
    ['🎞️', 'B-Roll'],
    ['⏱️', 'Speed'],
    ['🪄', 'Stabilize'],
    ['📝', 'Text']
  ],

  chat: [
    { role: 'user', text: 'Generate a better opening shot' },
    { role: 'ai', text: 'Opening idea ready. Use the Generate or Retake.' }
  ],

  // Multi-camera compositing data
  compositingLayers: [],
  pipWindows: [],
  splitScreenConfig: {
    type: 'horizontal', // 'horizontal', 'vertical', 'quad'
    ratio: 0.5, // split ratio
    transition: 'none' // 'none', 'fade', 'wipe'
  }
});