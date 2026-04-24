/**
 * Unified Editor Types
 * Defines the core data structures for the AI Timeline Editor
 * Combines editor UX concepts and video generation engine capabilities
 */

// ============================================================================
// PROJECT MODEL
// ============================================================================

/**
 * @typedef {Object} Project
 * @property {string} id - Unique project identifier
 * @property {string} name - Project name
 * @property {number} createdAt - Unix timestamp
 * @property {number} updatedAt - Unix timestamp
 * @property {ProjectSettings} settings - Project settings
 * @property {Sequence[]} sequences - Timeline sequences
 * @property {Asset[]} assets - Media assets
 * @property {StoryboardScene[]} storyboardScenes - Storyboard scenes
 * @property {Element[]} elements - Character/location/style references
 * @property {Generation[]} generations - Generation history
 * @property {ChatMessage[]} chatHistory - AI chat history
 */

/**
 * @typedef {Object} ProjectSettings
 * @property {string} aspectRatio - Default aspect ratio (16:9, 9:16, 1:1)
 * @property {number} fps - Frames per second (24, 30, 60)
 * @property {string} resolution - Resolution (1080p, 4k)
 * @property {string} defaultStyle - Default cinematic style
 */

// ============================================================================
// SEQUENCE & TRACKS
// ============================================================================

/**
 * @typedef {Object} Sequence
 * @property {string} id - Sequence identifier
 * @property {string} name - Sequence name
 * @property {Track[]} tracks - Array of tracks
 * @property {number} duration - Total duration in milliseconds
 * @property {string} aspectRatio - Sequence aspect ratio
 * @property {number} fps - Frames per second
 */

/**
 * @typedef {Object} Track
 * @property {string} id - Track identifier
 * @property {'video' | 'audio' | 'overlay' | 'titles' | 'broll'} type - Track type
 * @property {string} name - Track display name
 * @property {Clip[]} clips - Clips on this track
 * @property {boolean} locked - Whether track is locked
 * @property {boolean} visible - Whether track is visible
 * @property {number} height - Track height in pixels
 */

/**
 * @typedef {Object} Clip
 * @property {string} id - Clip identifier
 * @property {string} assetId - Reference to asset
 * @property {'video' | 'image' | 'audio' | 'text' | 'generated'} type - Clip type
 * @property {number} start - Start time on timeline (ms)
 * @property {number} end - End time on timeline (ms)
 * @property {number} inPoint - In point within source (ms)
 * @property {number} outPoint - Out point within source (ms)
 * @property {number} lane - Track lane index
 * @property {ClipTransform} transform - Transform properties
 * @property {number} opacity - Clip opacity (0-1)
 * @property {number} volume - Audio volume (0-1)
 * @property {number} speed - Playback speed multiplier
 * @property {Keyframe[]} keyframes - Animation keyframes
 * @property {Transition} transitions - In/out transitions
 * @property {AIMetadata} aiMetadata - AI-generated metadata
 */

/**
 * @typedef {Object} ClipTransform
 * @property {number} x - X position offset
 * @property {number} y - Y position offset
 * @property {number} scale - Scale factor
 * @property {number} rotation - Rotation in degrees
 * @property {string} anchorPoint - Anchor point (center, top-left, etc.)
 */

// ============================================================================
// KEYFRAMES & TRANSITIONS
// ============================================================================

/**
 * @typedef {Object} Keyframe
 * @property {number} time - Time position (ms)
 * @property {string} property - Animated property (opacity, position-x, scale, etc.)
 * @property {number} value - Property value
 * @property {'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'} easing
 */

/**
 * @typedef {Object} Transition
 * @property {string} type - Transition type (fade, dissolve, wipe, zoom, blur, spin)
 * @property {number} duration - Transition duration (ms)
 * @property {string} direction - Direction for wipes (left, right, up, down)
 */

// ============================================================================
// ASSETS
// ============================================================================

/**
 * @typedef {Object} Asset
 * @property {string} id - Asset identifier
 * @property {'video' | 'image' | 'audio' | 'generated_video' | 'subtitle' | 'mask'} type - Asset type
 * @property {string} src - Source URL or path
 * @property {string} thumbnail - Thumbnail URL
 * @property {AssetMetadata} metadata - Asset metadata
 * @property {'upload' | 'generated' | 'reference'} origin - Asset origin
 * @property {PromptData} promptData - Generation prompt data
 * @property {string} generationId - Reference to generation job
 */

/**
 * @typedef {Object} AssetMetadata
 * @property {number} duration - Duration in ms (for video/audio)
 * @property {number} width - Width in pixels
 * @property {number} height - Height in pixels
 * @property {number} fps - Frames per second
 * @property {string} codec - Video codec
 * @property {number} fileSize - File size in bytes
 * @property {string} mimeType - MIME type
 */

/**
 * @typedef {Object} PromptData
 * @property {string} prompt - Positive prompt
 * @property {string} negativePrompt - Negative prompt
 * @property {string} style - Cinematic style
 * @property {string} mood - Mood/atmosphere
 * @property {string} camera - Camera movement
 * @property {string} framing - Shot framing
 */

// ============================================================================
// STORYBOARD
// ============================================================================

/**
 * @typedef {Object} StoryboardScene
 * @property {string} id - Scene identifier
 * @property {string} title - Scene title
 * @property {string} description - Scene description
 * @property {StoryboardShot[]} shots - Array of shots
 * @property {number} order - Scene order index
 */

/**
 * @typedef {Object} StoryboardShot
 * @property {string} id - Shot identifier
 * @property {string} title - Shot title
 * @property {string} intent - Shot purpose/intent
 * @property {string} prompt - Visual prompt for generation
 * @property {string} negativePrompt - Negative prompt
 * @property {number} duration - Expected duration (ms)
 * @property {'Wide Shot' | 'Medium Shot' | 'Close-Up' | 'Extreme Close-Up' | 'POV' | 'Overhead' | 'Low Angle'} camera - Camera type
 * @property {'Static' | 'Pan Left' | 'Pan Right' | 'Tilt Up' | 'Tilt Down' | 'Dolly In' | 'Dolly Out' | 'Zoom In' | 'Zoom Out' | 'Tracking' | 'Orbit'} motion - Camera motion
 * @property {'Cinematic' | 'Documentary' | 'Commercial' | 'Stylized' | 'Anime' | 'Film Noir'} style - Visual style
 * @property {string} mood - Mood/atmosphere
 * @property {string[]} references - Reference image URLs
 * @property {string} generatedAssetId - Generated asset reference
 * @property {string} status - Generation status (pending, generating, completed, failed)
 */

// ============================================================================
// ELEMENTS (Consistency System)
// ============================================================================

/**
 * @typedef {Object} Element
 * @property {string} id - Element identifier
 * @property {'character' | 'location' | 'prop' | 'vehicle' | 'style'} type - Element type
 * @property {string} name - Element name
 * @property {string} description - Element description
 * @property {string[]} referenceAssets - Reference asset IDs
 * @property {string[]} tags - Element tags
 */

// ============================================================================
// GENERATION
// ============================================================================

/**
 * @typedef {Object} Generation
 * @property {string} id - Generation job identifier
 * @property {'text-to-video' | 'image-to-video' | 'audio-to-video' | 'retake' | 'extend' | 'broll' | 'variation'} mode - Generation mode
 * @property {'queued' | 'processing' | 'completed' | 'failed'} status - Job status
 * @property {string} prompt - Generation prompt
 * @property {GenerationSettings} settings - Generation settings
 * @property {string[]} inputAssetIds - Input asset IDs
 * @property {string[]} outputAssetIds - Output asset IDs
 * @property {string} error - Error message if failed
 * @property {'ltx' | 'fal' | 'seedance' | 'veo'} provider - Generation provider
 * @property {number} createdAt - Creation timestamp
 * @property {number} completedAt - Completion timestamp
 */

/**
 * @typedef {Object} GenerationSettings
 * @property {number} duration - Duration in seconds
 * @property {string} aspectRatio - Aspect ratio
 * @property {number} fps - Frames per second
 * @property {string} stylePreset - Style preset
 * @property {string} promptEnhancement - Prompt enhancement level
 * @property {number} seed - Random seed
 * @property {string[]} references - Reference image URLs
 */

// ============================================================================
// AI CHAT
// ============================================================================

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Message identifier
 * @property {'user' | 'assistant' | 'system'} role - Message role
 * @property {string} content - Message content
 * @property {ChatAction[]} actions - Suggested actions
 * @property {number} timestamp - Message timestamp
 */

/**
 * @typedef {Object} ChatAction
 * @property {string} id - Action identifier
 * @property {string} label - Action label
 * @property {string} command - Command to execute
 * @property {Object} params - Action parameters
 */

// ============================================================================
// EXPORT
// ============================================================================

/**
 * @typedef {Object} ExportConfig
 * @property {string} format - Export format (mp4, webm, gif)
 * @property {string} quality - Quality preset (low, medium, high, ultra)
 * @property {string} codec - Video codec
 * @property {boolean} includeAudio - Include audio
 * @property {string} resolution - Output resolution
 */

// Export type validators
export const TrackTypes = ['video', 'audio', 'overlay', 'titles', 'broll'];
export const ClipTypes = ['video', 'image', 'audio', 'text', 'generated'];
export const GenerationModes = ['text-to-video', 'image-to-video', 'audio-to-video', 'retake', 'extend', 'broll', 'variation'];
export const GenerationProviders = ['ltx', 'fal', 'seedance', 'veo'];
export const GenerationStatuses = ['queued', 'processing', 'completed', 'failed'];
export const ElementTypes = ['character', 'location', 'prop', 'vehicle', 'style'];

// Camera types for storyboard
export const CameraTypes = ['Wide Shot', 'Medium Shot', 'Close-Up', 'Extreme Close-Up', 'POV', 'Overhead', 'Low Angle'];
export const CameraMotions = ['Static', 'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down', 'Dolly In', 'Dolly Out', 'Zoom In', 'Zoom Out', 'Tracking', 'Orbit'];
export const VisualStyles = ['Cinematic', 'Documentary', 'Commercial', 'Stylized', 'Anime', 'Film Noir'];

// Default project template
export function createDefaultProject() {
  return {
    id: `proj_${Date.now()}`,
    name: 'Untitled Project',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: {
      aspectRatio: '16:9',
      fps: 24,
      resolution: '1080p',
      defaultStyle: 'Cinematic',
    },
    sequences: [
      {
        id: `seq_${Date.now()}`,
        name: 'Main Sequence',
        tracks: [
          { id: 'video-1', type: 'video', name: 'Video', clips: [], locked: false, visible: true, height: 80 },
          { id: 'audio-1', type: 'audio', name: 'Audio', clips: [], locked: false, visible: true, height: 60 },
          { id: 'broll-1', type: 'broll', name: 'B-Roll', clips: [], locked: false, visible: true, height: 60 },
          { id: 'titles-1', type: 'titles', name: 'Titles', clips: [], locked: false, visible: true, height: 50 },
        ],
        duration: 0,
        aspectRatio: '16:9',
        fps: 24,
      },
    ],
    assets: [],
    storyboardScenes: [],
    elements: [],
    generations: [],
    chatHistory: [],
  };
}

// Create a new clip
export function createClip(assetId, type, start, end) {
  return {
    id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    assetId,
    type,
    start,
    end,
    inPoint: 0,
    outPoint: end - start,
    lane: 0,
    transform: { x: 0, y: 0, scale: 1, rotation: 0, anchorPoint: 'center' },
    opacity: 1,
    volume: 1,
    speed: 1,
    keyframes: [],
    transitions: { in: null, out: null },
    aiMetadata: null,
  };
}

// Create a storyboard shot
export function createStoryboardShot(shotType = 'Wide Shot') {
  return {
    id: `shot_${Date.now()}`,
    title: 'New Shot',
    intent: '',
    prompt: '',
    negativePrompt: '',
    duration: 5000,
    camera: shotType,
    motion: 'Static',
    style: 'Cinematic',
    mood: 'Neutral',
    references: [],
    generatedAssetId: null,
    status: 'pending',
  };
}
