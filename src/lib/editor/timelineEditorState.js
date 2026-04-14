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
    ['🔊', 'Text to Speech', 'Generate voiceovers']
  ],

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
  ]
});