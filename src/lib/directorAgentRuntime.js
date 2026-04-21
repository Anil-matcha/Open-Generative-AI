// Director Agent Runtime - Unified controller for storyboard operations
// Implements the architecture described in the enhancement plan

// Import MUAPI client and Supabase for backend integration
import { MuapiClient } from './muapi.js';
import { supabase } from './hybrid-supabase.js';

// Storyboard presets from the React code
const STORYBOARD_PRESETS = [
  { id: 'cinematic-story', label: 'Cinematic Story', aspectRatio: '16:9', visualStyle: 'Cinematic', mood: 'Dramatic', generationMode: 'Storyboard Frames' },
  { id: 'commercial-ad', label: 'Commercial Ad', aspectRatio: '16:9', visualStyle: 'Commercial', mood: 'Aspirational', generationMode: 'Storyboard Frames' },
  { id: 'documentary-flow', label: 'Documentary Flow', aspectRatio: '16:9', visualStyle: 'Documentary', mood: 'Emotional', generationMode: 'Scene Beats' },
  { id: 'social-shorts', label: 'Social Shorts', aspectRatio: '9:16', visualStyle: 'Stylized', mood: 'Energetic', generationMode: 'Shot Plan' },
];

// Shot types from the React code
const SHOT_TYPES = ['Wide Shot', 'Medium Shot', 'Close-Up', 'Extreme Close-Up', 'POV', 'Overhead', 'Low Angle'];

// Color palettes from the React code
const PALETTES = [
  ['#0f172a', '#020617', '#38bdf8'],
  ['#111827', '#030712', '#10b981'],
  ['#1e1b4b', '#020617', '#818cf8'],
  ['#0b1020', '#030712', '#22d3ee'],
  ['#172033', '#050816', '#60a5fa'],
  ['#0c1326', '#04070d', '#34d399'],
];

// AI Agents from the React code
const AGENTS = [
  { id: 'summarizer', name: 'Video Summarizer', icon: '📝', description: 'Summarize video content' },
  { id: 'search', name: 'Video Search', icon: '🔍', description: 'Search and index media library' },
  { id: 'clipper', name: 'Clip Creator', icon: '✂️', description: 'Extract and create clips' },
  { id: 'dubbing', name: 'Video Dubbing', icon: '🎤', description: 'Translate and dub audio/video' },
  { id: 'subtitler', name: 'Subtitle Generator', icon: '💬', description: 'Add subtitles in any language' },
  { id: 'highlighter', name: 'Highlight Extractor', icon: '⚡', description: 'Find key moments automatically' },
  { id: 'scenes', name: 'Scene Detector', icon: '🎬', description: 'Identify scene boundaries' },
  { id: 'broll', name: 'B-Roll Adder', icon: '🎞️', description: 'Add overlay footage' },
  { id: 'voiceover', name: 'Voiceover', icon: '🎙️', description: 'Add AI voiceover' },
  { id: 'editor', name: 'Video Editor', icon: '✏️', description: 'Edit and enhance video' },
  { id: 'enhancer', name: 'Video Enhancer', icon: '✨', description: 'Quality enhancement' },
  { id: 'compiler', name: 'Content Compiler', icon: '📚', description: 'Compile multiple videos' },
  { id: 'meme', name: 'Meme Generator', icon: '😂', description: 'Create meme videos' },
  { id: 'music', name: 'Music Video Maker', icon: '🎵', description: 'Generate music videos' },
  { id: 'trailer', name: 'Trailer Creator', icon: '🎥', description: 'Make video trailers' },
  { id: 'compilation', name: 'Compilation Builder', icon: '📋', description: 'Build compilations' },
  { id: 'social', name: 'Social Media Clip', icon: '📱', description: 'Create social media clips' },
  { id: 'preview', name: 'Preview Generator', icon: '👁️', description: 'Generate video previews' },
  { id: 'montage', name: 'Montage Builder', icon: '🎞️', description: 'Create video montages' },
  { id: 'story', name: 'Story Builder', icon: '📖', description: 'Build narratives from clips' },
  { id: 'color', name: 'Color Correction', icon: '🎨', description: 'Adjust colors and tones' },
  { id: 'stabilize', name: 'Video Stabilize', icon: '🪄', description: 'Stabilize shaky footage' },
  { id: 'speed', name: 'Speed Control', icon: '⏱️', description: 'Adjust video speed' },
  { id: 'reverse', name: 'Reverse Video', icon: '🔄', description: 'Play video backwards' },
];

// Quick actions from the React code
const QUICK_ACTIONS = [
  { title: 'Summarize', desc: 'Generate video summary', icon: '📝' },
  { title: 'Extract Highlights', desc: 'Find best moments', icon: '⚡' },
  { title: 'Detect Scenes', desc: 'Identify boundaries', icon: '🎬' },
  { title: 'Add Subtitles', desc: 'Auto-generate captions', icon: '💬' },
  { title: 'Dub Video', desc: 'Translate audio', icon: '🎤' },
  { title: 'Add B-Roll', desc: 'Overlay footage', icon: '🎞️' },
  { title: 'Voiceover', desc: 'Add AI narration', icon: '🎙️' },
  { title: 'Create Shorts', desc: 'TikTok/Reels/Shorts', icon: '📱' },
  { title: 'Color Correction', desc: 'Adjust colors', icon: '🎨' },
  { title: 'Stabilize', desc: 'Fix shaky footage', icon: '🪄' },
];

/**
 * Build project knowledge object for storyboard operations
 * @returns {Promise<Object>} Project knowledge object
 */
async function buildDirectorProjectKnowledge() {
  return {
    projectType: 'cinematic storyboard',
    repoContext: {
      appName: 'Director',
      availableModules: [
        'storyboard',
        'scene-detection',
        'highlight-extraction',
        'subtitle-generation',
        'voiceover',
        'b-roll',
        'clip-creation',
        'trailer-generation'
      ],
      templates: [
        'cinematic-story',
        'commercial-ad',
        'documentary-flow',
        'social-shorts'
      ],
      agents: [
        'Video Summarizer',
        'Scene Detector',
        'Story Builder',
        'Trailer Creator'
      ],
      effects: [
        'camera progression',
        'motion notes',
        'continuity lock'
      ],
      generationCapabilities: [
        'frame planning',
        'shot sequencing',
        'narrative beats',
        'preview generation'
      ]
    }
  };
}

/**
 * Generate hash code from string for deterministic palette selection
 * @param {string} str - Input string
 * @returns {number} Hash code
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/**
 * Generate color palette from text using hashCode
 * @param {string} text - Input text
 * @returns {Array<string>} Color palette array
 */
function paletteFromText(text) {
  return PALETTES[hashCode(text || 'frame') % PALETTES.length];
}

/**
 * Create a frame object
 * @param {number} id - Frame ID
 * @param {string} shot - Shot type
 * @param {string} prompt - Frame prompt
 * @param {string} narration - Frame narration
 * @returns {Object} Frame object
 */
function makeFrame(id, shot, prompt, narration) {
  return {
    id,
    shot: shot || 'Wide Shot',
    prompt: prompt || '',
    narration: narration || '',
    generated: false,
    palette: ['#0f172a', '#020617', '#38bdf8'], // Default palette
  };
}

/**
 * Build storyboard frame prompt using frame data, preset, and project knowledge
 * @param {Object} frame - Frame object
 * @param {Object} preset - Storyboard preset
 * @param {Object} knowledge - Project knowledge
 * @returns {string} Generated prompt for frame
 */
function buildStoryboardFramePrompt(frame, preset, knowledge) {
  return `
Create a ${preset.visualStyle.toLowerCase()} ${frame.shot.toLowerCase()} storyboard frame
for a ${knowledge.projectType}.

Brand/Product: ${knowledge.brandName || 'N/A'}
Goal: ${(knowledge.goals || []).join(', ')}
Audience: ${knowledge.targetAudience || 'General'}

Frame Prompt:
${frame.prompt}

Narration / Intent:
${frame.narration || 'None'}

Apply:
- ${preset.mood} mood
- ${preset.aspectRatio} composition
- visual continuity with previous frames
- cinematic framing
- subject consistency
- location consistency where relevant
`;
}

/**
 * Director Agent Runtime - Main controller class with full state management
 */
class DirectorAgentRuntime {
  constructor() {
    this.projectKnowledge = null;
    this.currentPreset = STORYBOARD_PRESETS[0]; // Default preset
    this.frames = [
      makeFrame(1, 'Wide Shot', 'Opening cinematic establishing frame for the current director project', 'Open on a cinematic wide frame that introduces the world.'),
      makeFrame(2, 'Medium Shot', 'Main subject enters frame with purposeful motion and dramatic composition', 'Move closer to the main subject as the scene begins to build.'),
      makeFrame(3, 'Close-Up', 'Close-up detail shot for emotion, tension, or product emphasis', 'Finish with a close-up that emphasizes the emotional or commercial hook.'),
    ];
    this.selectedFrameId = 1;
    this.chatContext = '';
    this.onStateChange = null; // Callback for state changes
    this.isGenerating = false;
    this.generatedFrames = new Set();
    
    // Video-related properties
    this.videoUrl = null;
    this.videoMetadata = null;
    this.videoClips = [];
  }

  /**
   * Initialize the runtime by loading project knowledge
   * @returns {Promise<void>}
   */
  async initialize() {
    this.projectKnowledge = await buildDirectorProjectKnowledge();
  }

  /**
   * Set state change callback for UI updates
   * @param {Function} callback - Callback function
   */
  setStateChangeCallback(callback) {
    this.onStateChange = callback;
  }

  /**
   * Notify state change to UI
   */
  notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  /**
   * Get current storyboard preset
   * @returns {Object} Current preset
   */
  getCurrentPreset() {
    return this.currentPreset;
  }

  /**
   * Set storyboard preset
   * @param {string} presetId - Preset ID
   */
  setPreset(presetId) {
    const preset = STORYBOARD_PRESETS.find(p => p.id === presetId) || STORYBOARD_PRESETS[0];
    this.currentPreset = preset;
    this.notifyStateChange();
  }

  /**
   * Get frames array
   * @returns {Array<Object>} Frames array
   */
  getFrames() {
    return [...this.frames];
  }

  /**
   * Get frame by ID
   * @param {number} id - Frame ID
   * @returns {Object|null} Frame object or null
   */
  getFrameById(id) {
    return this.frames.find(frame => frame.id === id) || null;
  }

  /**
   * Get selected frame index
   * @returns {number} Index of selected frame
   */
  getSelectedFrameIndex() {
    return this.frames.findIndex(frame => frame.id === this.selectedFrameId);
  }

  /**
   * Select previous frame
   * @returns {boolean} True if successfully moved to previous
   */
  selectPreviousFrame() {
    const currentIndex = this.getSelectedFrameIndex();
    if (currentIndex > 0) {
      this.selectedFrameId = this.frames[currentIndex - 1].id;
      this.notifyStateChange();
      return true;
    }
    return false;
  }

  /**
   * Select next frame
   * @returns {boolean} True if successfully moved to next
   */
  selectNextFrame() {
    const currentIndex = this.getSelectedFrameIndex();
    if (currentIndex < this.frames.length - 1) {
      this.selectedFrameId = this.frames[currentIndex + 1].id;
      this.notifyStateChange();
      return true;
    }
    return false;
  }

  /**
   * Check if can navigate to previous frame
   * @returns {boolean}
   */
  canSelectPreviousFrame() {
    return this.getSelectedFrameIndex() > 0;
  }

  /**
   * Check if can navigate to next frame
   * @returns {boolean}
   */
  canSelectNextFrame() {
    return this.getSelectedFrameIndex() < this.frames.length - 1;
  }

  /**
   * Add a new frame
   * @returns {Object} New frame object
   */
  addFrame() {
    const nextId = this.frames.length > 0 ? Math.max(...this.frames.map(f => f.id)) + 1 : 1;
    const nextShot = SHOT_TYPES[nextId % SHOT_TYPES.length];
    const next = makeFrame(nextId, nextShot, '', '');
    this.frames.push(next);
    this.selectedFrameId = nextId;
    this.notifyStateChange();
    return next;
  }

  /**
   * Remove a frame by ID
   * @param {number} id - Frame ID to remove
   * @returns {boolean} True if frame was removed
   */
  removeFrame(id) {
    if (this.frames.length <= 1) {
      return false; // Keep at least one frame
    }
    
    const index = this.frames.findIndex(f => f.id === id);
    if (index === -1) return false;
    
    this.frames = this.frames.filter(f => f.id !== id);
    
    // Update selected frame if needed
    if (this.selectedFrameId === id) {
      this.selectedFrameId = this.frames[Math.max(0, index - 1)].id;
    }
    
    this.notifyStateChange();
    return true;
  }

  /**
   * Update frame properties
   * @param {number} id - Frame ID
   * @param {Object} patch - Properties to update
   */
  updateFrame(id, patch) {
    this.frames = this.frames.map(frame =>
      frame.id === id ? { ...frame, ...patch } : frame
    );
    this.notifyStateChange();
  }

  /**
   * Set selected frame ID
   * @param {number} id - Frame ID
   */
  setSelectedFrameId(id) {
    if (this.getFrameById(id)) {
      this.selectedFrameId = id;
      this.notifyStateChange();
    }
  }

  /**
   * Get selected frame
   * @returns {Object|null} Selected frame or null
   */
  getSelectedFrame() {
    return this.getFrameById(this.selectedFrameId) || null;
  }

  /**
   * Get total number of frames
   * @returns {number}
   */
  getFrameCount() {
    return this.frames.length;
  }

  /**
   * Get index of selected frame (1-based for display)
   * @returns {number}
   */
  getSelectedFrameNumber() {
    return this.getSelectedFrameIndex() + 1;
  }

  /**
   * Update chat context
   * @param {string} context - Chat context
   */
  updateChatContext(context) {
    this.chatContext = context;
    this.notifyStateChange();
  }

  /**
   * Get chat context
   * @returns {string}
   */
  getChatContext() {
    return this.chatContext;
  }

  /**
   * Check if currently generating
   * @returns {boolean}
   */
  getIsGenerating() {
    return this.isGenerating;
  }

  /**
   * Get the appropriate image model for a preset
   * @param {Object} preset - Storyboard preset
   * @returns {string} Model ID
   */
  getModelForPreset(preset) {
    const modelMap = {
      'cinematic-story': 'flux-pro',
      'commercial-ad': 'flux-pro',
      'documentary-flow': 'flux-dev',
      'social-shorts': 'flux-pro'
    };
    return modelMap[preset?.id] || 'flux-pro';
  }

  /**
   * Generate a single frame using the storyboard engine
   * @param {number} frameId - Frame ID to generate
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Updated frame with generation results
   */
  async generateFrame(frameId, options = {}) {
    if (this.isGenerating) {
      throw new Error('Already generating frames');
    }
    
    const frame = this.getFrameById(frameId);
    if (!frame) throw new Error(`Frame ${frameId} not found`);
    
    this.isGenerating = true;
    this.notifyStateChange();
    
    // Create AbortController for cancellation
    const controller = options.signal ? options.signal : new AbortController();
    
    try {
      // Build prompt from frame data
      const prompt = buildStoryboardFramePrompt(frame, this.currentPreset, this.projectKnowledge || {});
      
      // Generate palette from text
      const palette = paletteFromText(`${this.currentPreset.visualStyle} ${this.currentPreset.mood} ${frame.shot} ${frame.prompt} ${frame.narration}`);
      
      // Try to call MUAPI for actual image generation
      let imageUrl = null;
      let muapiError = null;
      
      try {
        const muapiClient = new MuapiClient();
        const result = await muapiClient.generateImage({
          prompt: prompt,
          model: this.getModelForPreset(this.currentPreset),
          aspect_ratio: this.currentPreset.aspectRatio,
          studioType: 'storyboard'
        }, controller.signal);
        
        if (result?.url) {
          imageUrl = result.url;
          console.log('[DirectorRuntime] Frame generated via MUAPI:', imageUrl);
        }
      } catch (error) {
        muapiError = error;
        console.warn('[DirectorRuntime] MUAPI generation failed, using palette fallback:', error.message);
      }
      
      // Update frame with generated status, palette, and image URL
      this.updateFrame(frameId, {
        generated: true,
        palette,
        imageUrl: imageUrl || null,
        generatedAt: new Date().toISOString()
      });
      
      this.generatedFrames.add(frameId);
      
      return this.getFrameById(frameId);
    } finally {
      this.isGenerating = false;
      this.notifyStateChange();
    }
  }

  /**
   * Generate all frames using the storyboard engine
   * @returns {Promise<Array<Object>>} Updated frames array
   */
  async generateAllFrames() {
    if (this.isGenerating) {
      throw new Error('Already generating frames');
    }
    
    this.isGenerating = true;
    this.notifyStateChange();
    
    try {
      for (const frame of this.frames) {
        await this.generateFrame(frame.id);
      }
      return this.frames;
    } finally {
      this.isGenerating = false;
      this.notifyStateChange();
    }
  }

  /**
   * Execute an AI agent command via backend
   * @param {string} agentId - Agent ID to execute
   * @param {Object} params - Parameters for the agent
   * @returns {Promise<Object>} Agent execution result
   */
  async executeAgentCommand(agentId, params = {}) {
    if (this.isGenerating) {
      throw new Error('Already processing an agent command');
    }
    
    // Map agent IDs to backend actions
    const agentCommandMap = {
      'summarizer': { action: 'summarize-video', tool: 'video-analysis' },
      'search': { action: 'search-media', tool: 'video-search' },
      'clipper': { action: 'create-clip', tool: 'video-clipper' },
      'dubbing': { action: 'dub-video', tool: 'video-dubbing' },
      'subtitler': { action: 'generate-subtitles', tool: 'video-subtitles' },
      'highlighter': { action: 'extract-highlights', tool: 'video-highlights' },
      'scenes': { action: 'detect-scenes', tool: 'scene-detection' },
      'broll': { action: 'add-broll', tool: 'video-broll' },
      'voiceover': { action: 'add-voiceover', tool: 'video-voiceover' },
      'editor': { action: 'edit-video', tool: 'video-editor' },
      'enhancer': { action: 'enhance-video', tool: 'video-enhancer' },
      'compiler': { action: 'compile-videos', tool: 'video-compiler' },
      'meme': { action: 'create-meme', tool: 'meme-generator' },
      'music': { action: 'create-music-video', tool: 'music-video' },
      'trailer': { action: 'create-trailer', tool: 'trailer-maker' },
      'compilation': { action: 'build-compilation', tool: 'compilation-builder' },
      'social': { action: 'create-social-clip', tool: 'social-clip' },
      'preview': { action: 'generate-preview', tool: 'preview-generator' },
      'montage': { action: 'create-montage', tool: 'montage-builder' },
      'story': { action: 'build-story', tool: 'story-builder' },
      'color': { action: 'color-correct', tool: 'color-correction' },
      'stabilize': { action: 'stabilize-video', tool: 'video-stabilize' },
      'speed': { action: 'adjust-speed', tool: 'speed-control' },
      'reverse': { action: 'reverse-video', tool: 'video-reverse' },
    };
    
    const command = agentCommandMap[agentId];
    if (!command) {
      throw new Error(`Unknown agent: ${agentId}`);
    }
    
    this.isGenerating = true;
    this.notifyStateChange();
    
    try {
      // Try to call via Supabase edge function
      let result = null;
      let error = null;
      
      try {
        const { data, error: supabaseError } = await supabase.functions.invoke('videoagent', {
          body: {
            action: command.action,
            tool: command.tool,
            videoId: params.videoId,
            videoUrl: params.videoUrl,
            prompt: params.prompt,
            settings: params.settings || {},
            ...params
          }
        });
        
        if (supabaseError) {
          error = supabaseError;
          console.warn('[DirectorRuntime] Supabase function call failed:', supabaseError.message);
        } else {
          result = data;
          console.log('[DirectorRuntime] Agent command executed via videoagent:', agentId);
        }
      } catch (supabaseError) {
        error = supabaseError;
        console.warn('[DirectorRuntime] Supabase invocation failed:', supabaseError.message);
      }
      
      // Return the result or a simulated response
      return {
        success: !!result,
        agentId,
        action: command.action,
        tool: command.tool,
        result,
        error: error?.message,
        message: result?.message || this.getAgentSuccessMessage(agentId)
      };
    } finally {
      this.isGenerating = false;
      this.notifyStateChange();
    }
  }

  /**
   * Get success message for an agent
   * @param {string} agentId - Agent ID
   * @returns {string} Success message
   */
  getAgentSuccessMessage(agentId) {
    const messages = {
      'summarizer': 'Video summary generated successfully',
      'search': 'Media search completed',
      'clipper': 'Clip created successfully',
      'dubbing': 'Video dubbed successfully',
      'subtitler': 'Subtitles generated successfully',
      'highlighter': 'Highlights extracted successfully',
      'scenes': 'Scenes detected successfully',
      'broll': 'B-roll added successfully',
      'voiceover': 'Voiceover added successfully',
      'editor': 'Video edited successfully',
      'enhancer': 'Video enhanced successfully',
      'compiler': 'Videos compiled successfully',
      'meme': 'Meme created successfully',
      'music': 'Music video generated successfully',
      'trailer': 'Trailer created successfully',
      'compilation': 'Compilation built successfully',
      'social': 'Social media clip created successfully',
      'preview': 'Preview generated successfully',
      'montage': 'Montage created successfully',
      'story': 'Story built successfully',
      'color': 'Color correction applied successfully',
      'stabilize': 'Video stabilized successfully',
      'speed': 'Speed adjusted successfully',
      'reverse': 'Video reversed successfully',
    };
    return messages[agentId] || 'Operation completed successfully';
  }

  /**
   * Clear all generated frames
   */
  clearGeneratedFrames() {
    this.frames = this.frames.map(frame => ({
      ...frame,
      generated: false,
      palette: ['#0f172a', '#020617', '#38bdf8']
    }));
    this.generatedFrames.clear();
    this.notifyStateChange();
  }



  /**
   * Process uploaded video through videoagent
   * @param {string} videoUrl - URL of uploaded video
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result
   */
  async processVideo(videoUrl, options = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('process-upload', {
        body: {
          videoUrl,
          ...options
        }
      });
      
      if (error) {
        throw new Error(`Processing failed: ${error.message}`);
      }
      
      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('[DirectorRuntime] Video processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save storyboard to database
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Save result
   */
  async saveStoryboard(projectId) {
    try {
      const storyboardData = {
        id: projectId,
        frames: this.frames,
        preset: this.currentPreset,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('storyboards')
        .upsert(storyboardData)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Save failed: ${error.message}`);
      }
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('[DirectorRuntime] Save storyboard failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load storyboard from database
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Load result
   */
  async loadStoryboard(projectId) {
    try {
      const { data, error } = await supabase
        .from('storyboards')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) {
        throw new Error(`Load failed: ${error.message}`);
      }
      
      // Restore state
      if (data.frames) {
        this.frames = data.frames;
      }
      if (data.preset) {
        this.currentPreset = data.preset;
      }
      
      this.notifyStateChange();
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('[DirectorRuntime] Load storyboard failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Compile storyboard frames into video
   * @param {Object} options - Compilation options
   * @returns {Promise<Object>} Compilation result
   */
  async compileToVideo(options = {}) {
    // Collect all generated frame images
    const frameImages = this.frames
      .filter(f => f.generated && f.imageUrl)
      .map(f => f.imageUrl);
    
    if (frameImages.length === 0) {
      // Use palette colors as fallback
      return this.compileWithPalettes(options);
    }
    
    try {
      // Use videoagent to compile frames into video
      const { data, error } = await supabase.functions.invoke('videoagent', {
        body: {
          action: 'compile-frames',
          tool: 'frame-compiler',
          frameUrls: frameImages,
          duration: options.duration || 3,
          transition: options.transition || 'fade',
          preset: this.currentPreset
        }
      });
      
      if (error) {
        throw new Error(`Compilation failed: ${error.message}`);
      }
      
      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('[DirectorRuntime] Video compilation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Compile using palette colors as fallback
   * @param {Object} options - Compilation options
   * @returns {Promise<Object>} Compilation result
   */
  async compileWithPalettes(options = {}) {
    // Generate video from palette colors
    try {
      const muapiClient = new MuapiClient();
      const frames = this.frames.map(f => ({
        prompt: f.prompt || 'Cinematic scene',
        duration: options.duration || 3
      }));
      
      // For now, generate a single video from the storyboard prompt
      const result = await muapiClient.generateVideo({
        prompt: `${this.currentPreset.visualStyle} ${this.currentPreset.mood} video from storyboard`,
        duration: options.duration || 5,
        aspect_ratio: this.currentPreset.aspectRatio,
        studioType: 'storyboard'
      });
      
      return {
        success: !!result?.url,
        url: result?.url,
        frames: this.frames.length
      };
    } catch (error) {
      console.error('[DirectorRuntime] Palette compilation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Route to specialized agent based on frame and context
   * @param {Object} frame - Frame object
   * @param {Object} preset - Current preset
   * @param {Object} knowledge - Project knowledge
   * @returns {string} Agent ID to use
   */
  routeToSpecializedAgent(frame, preset, knowledge) {
    // Simple routing logic based on frame content and preset
    const frameText = `${frame.prompt} ${frame.narration}`.toLowerCase();
    
    if (frameText.includes('story') || frameText.includes('narrative')) {
      return 'story';
    } else if (frameText.includes('scene') || frameText.includes('boundary')) {
      return 'scenes';
    } else if (frameText.includes('highlight') || frameText.includes('moment')) {
      return 'highlighter';
    } else if (frameText.includes('trailer') || frameText.includes('promo')) {
      return 'trailer';
    } else if (frameText.includes('voice') || frameText.includes('narration')) {
      return 'voiceover';
    } else if (frameText.includes('color') || frameText.includes('tone')) {
      return 'color';
    } else if (frameText.includes('stable') || frameText.includes('shake')) {
      return 'stabilize';
    } else {
      // Default to preview generator for visual frames
      return 'preview';
    }
  }

  /**
   * Generate frame instructions for specialized agent
   * @param {Object} frame - Frame object
   * @param {Object} preset - Current preset
   * @param {Object} knowledge - Project knowledge
   * @param {string} agentId - Target agent ID
   * @returns {Object} Generation instructions
   */
  generateAgentInstructions(frame, preset, knowledge, agentId) {
    const prompt = buildStoryboardFramePrompt(frame, preset, knowledge);
    
    // Agent-specific instruction modifications
    let agentPrompt = prompt;
    switch (agentId) {
      case 'story':
        agentPrompt = `Focus on narrative flow and story progression:\n${prompt}`;
        break;
      case 'scenes':
        agentPrompt = `Focus on scene boundaries and logical beats:\n${prompt}`;
        break;
      case 'preview':
        agentPrompt = `Create visual preview of the frame:\n${prompt}`;
        break;
      case 'voiceover':
        agentPrompt = `Generate narration script for this frame:\n${prompt}`;
        break;
      default:
        agentPrompt = `Apply ${agentId} specialization:\n${prompt}`;
    }
    
    return {
      agentId,
      prompt: agentPrompt,
      frameData: frame,
      presetData: preset,
      knowledgeData: knowledge,
      visualStyle: preset.visualStyle,
      mood: preset.mood,
      aspectRatio: preset.aspectRatio
    };
  }

  /**
   * Process chat command and route to appropriate agents
   * @param {string} command - Chat command
   * @returns {Object} Processing result
   */
  async processChatCommand(command) {
    this.chatContext = command;
    
    // Determine which agents to activate based on command
    const activatedAgents = [];
    const cmd = command.toLowerCase();
    
    if (cmd.includes('highlight') || cmd.includes('clip') || cmd.includes('short')) {
      activatedAgents.push('highlighter', 'clipper');
    } else if (cmd.includes('subtitle') || cmd.includes('caption')) {
      activatedAgents.push('subtitler', 'enhancer');
    } else if (cmd.includes('scene')) {
      activatedAgents.push('scenes');
    } else if (cmd.includes('b-roll') || cmd.includes('overlay')) {
      activatedAgents.push('broll', 'search');
    } else if (cmd.includes('dub') || cmd.includes('translate')) {
      activatedAgents.push('dubbing', 'voiceover');
    } else if (cmd.includes('summarize')) {
      activatedAgents.push('summarizer');
    } else if (cmd.includes('color') || cmd.includes('correction')) {
      activatedAgents.push('color', 'enhancer');
    } else if (cmd.includes('stabilize')) {
      activatedAgents.push('stabilize');
    } else {
      activatedAgents.push('editor');
    }
    
    this.notifyStateChange();
    
    return {
      command,
      activatedAgents,
      preset: this.currentPreset,
      selectedFrame: this.getSelectedFrame(),
      frames: this.frames
    };
  }

  /**
   * Export storyboard as JSON
   * @returns {string} JSON string of storyboard data
   */
  exportStoryboard() {
    return JSON.stringify({
      preset: this.currentPreset,
      frames: this.frames,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import storyboard from JSON
   * @param {string} jsonString - JSON string to import
   * @returns {boolean} True if import successful
   */
  importStoryboard(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.frames && Array.isArray(data.frames)) {
        this.frames = data.frames.map((f, i) => makeFrame(
          f.id || i + 1,
          f.shot || 'Wide Shot',
          f.prompt || '',
          f.narration || ''
        ));
        if (data.preset) {
          this.setPreset(data.preset.id);
        }
        this.selectedFrameId = this.frames[0]?.id || 1;
        this.notifyStateChange();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import storyboard:', e);
      return false;
    }
  }

  /**
   * Get storyboard summary for display
   * @returns {Object} Summary object
   */
  getStoryboardSummary() {
    return {
      frameCount: this.frames.length,
      generatedCount: this.frames.filter(f => f.generated).length,
      selectedFrame: this.getSelectedFrameNumber(),
      preset: this.currentPreset.label,
      aspectRatio: this.currentPreset.aspectRatio
    };
  }

  /**
   * Set the current video URL for preview
   * @param {string} url - Video URL
   */
  setVideoUrl(url) {
    this.videoUrl = url;
    this.notifyStateChange();
  }

  /**
   * Get the current video URL
   * @returns {string|null}
   */
  getVideoUrl() {
    return this.videoUrl || null;
  }

  /**
   * Set video metadata
   * @param {Object} metadata - Video metadata (duration, size, etc.)
   */
  setVideoMetadata(metadata) {
    this.videoMetadata = metadata;
    this.notifyStateChange();
  }

  /**
   * Get video metadata
   * @returns {Object}
   */
  getVideoMetadata() {
    return this.videoMetadata || { duration: 0, width: 0, height: 0, size: 0 };
  }

  /**
   * Generate image for a specific frame using the storyboard engine
   * @param {number} frameId - Frame ID to generate image for
   * @param {Object} muapiClient - MuapiClient instance for API calls
   * @param {AbortSignal} signal - Abort signal for cancellation
   * @returns {Promise<Object>} Generated image result
   */
  async generateFrameImage(frameId, muapiClient, signal) {
    const frame = this.getFrameById(frameId);
    if (!frame) throw new Error(`Frame ${frameId} not found`);
    
    // Build the prompt from frame data and preset
    const prompt = this._buildFramePrompt(frame);
    
    // Determine aspect ratio from preset
    const aspectRatio = this._getAspectRatioFromPreset(this.currentPreset);
    
    this.isGenerating = true;
    this.notifyStateChange();
    
    try {
      const result = await muapiClient.generateImage({
        prompt,
        aspect_ratio: aspectRatio,
        model: 'default', // Use default model or get from config
        quality: 'high'
      }, signal);
      
      // Update frame with generated image URL
      const imageUrl = result.url || result.outputs?.[0];
      this.updateFrame(frameId, {
        generated: true,
        imageUrl
      });
      
      return result;
    } finally {
      this.isGenerating = false;
      this.notifyStateChange();
    }
  }

  /**
   * Generate images for all frames
   * @param {Object} muapiClient - MuapiClient instance
   * @param {AbortSignal} signal - Abort signal
   * @returns {Promise<Array>} Results for all frames
   */
  async generateAllFrameImages(muapiClient, signal) {
    this.isGenerating = true;
    this.notifyStateChange();
    
    const results = [];
    try {
      for (const frame of this.frames) {
        if (signal?.aborted) break;
        const result = await this.generateFrameImage(frame.id, muapiClient, signal);
        results.push(result);
      }
      return results;
    } finally {
      this.isGenerating = false;
      this.notifyStateChange();
    }
  }

  /**
   * Convert a storyboard frame to video clip
   * @param {number} frameId - Frame ID to convert
   * @param {Object} muapiClient - MuapiClient instance
   * @param {AbortSignal} signal - Abort signal
   * @param {number} duration - Video duration in seconds (default 3)
   * @returns {Promise<Object>} Video result
   */
  async frameToVideo(frameId, muapiClient, signal, duration = 3) {
    const frame = this.getFrameById(frameId);
    if (!frame) throw new Error(`Frame ${frameId} not found`);
    
    const imageUrl = frame.imageUrl;
    if (!imageUrl) {
      throw new Error('Frame must have a generated image before converting to video');
    }
    
    const prompt = this._buildFramePrompt(frame);
    
    this.isGenerating = true;
    this.notifyStateChange();
    
    try {
      const result = await muapiClient.generateI2V({
        prompt,
        image_url: imageUrl,
        duration,
        aspect_ratio: this._getAspectRatioFromPreset(this.currentPreset),
        quality: 'high'
      }, signal);
      
      const videoUrl = result.url || result.outputs?.[0];
      
      // Update frame with generated video clip
      this.updateFrame(frameId, {
        videoUrl,
        videoDuration: duration
      });
      
      return result;
    } finally {
      this.isGenerating = false;
      this.notifyStateChange();
    }
  }

  /**
   * Convert all storyboard frames to video clips and combine
   * @param {Object} muapiClient - MuapiClient instance
   * @param {AbortSignal} signal - Abort signal
   * @returns {Promise<Object>} Combined video result
   */
  async generateFullVideo(muapiClient, signal) {
    // First ensure all frames have images
    for (const frame of this.frames) {
      if (!frame.imageUrl && !frame.generated) {
        await this.generateFrameImage(frame.id, muapiClient, signal);
      }
    }
    
    this.isGenerating = true;
    this.notifyStateChange();
    
    try {
      // Convert each frame to video
      const videoClips = [];
      for (const frame of this.frames) {
        if (signal?.aborted) break;
        
        let videoUrl = frame.videoUrl;
        if (!videoUrl) {
          await this.frameToVideo(frame.id, muapiClient, signal, 3);
          const updatedFrame = this.getFrameById(frame.id);
          videoUrl = updatedFrame?.videoUrl;
        }
        
        if (videoUrl) {
          videoClips.push({ url: videoUrl, duration: frame.videoDuration || 3 });
        }
      }
      
      // Store video clips for potential combining
      this.videoClips = videoClips;
      this.notifyStateChange();
      
      // Return clips info - actual combining would require a video processing API
      return {
        clips: videoClips,
        totalDuration: videoClips.reduce((sum, clip) => sum + clip.duration, 0),
        message: videoClips.length > 0
          ? `Generated ${videoClips.length} video clips. Use video editor to combine.`
          : 'No video clips generated'
      };
    } finally {
      this.isGenerating = false;
      this.notifyStateChange();
    }
  }

  /**
   * Upload a video file
   * @param {File} file - Video file to upload
   * @param {Object} muapiClient - MuapiClient instance
   * @returns {Promise<Object>} Upload result with URL
   */
  async uploadVideo(file, muapiClient) {
    try {
      const result = await muapiClient.uploadFile(file);
      
      if (result.url) {
        this.setVideoUrl(result.url);
        this.setVideoMetadata({
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Video upload failed:', error);
      throw error;
    }
  }

  /**
   * Get all generated video clips
   * @returns {Array}
   */
  getVideoClips() {
    return this.videoClips || [];
  }

  /**
   * Clear all video data
   */
  clearVideoData() {
    this.videoUrl = null;
    this.videoMetadata = null;
    this.videoClips = [];
    
    // Clear video URLs from frames
    this.frames = this.frames.map(frame => ({
      ...frame,
      videoUrl: null,
      videoDuration: null
    }));
    
    this.notifyStateChange();
  }

  /**
   * Build prompt from frame and preset data
   * @private
   */
  _buildFramePrompt(frame) {
    const parts = [
      this.currentPreset.visualStyle,
      this.currentPreset.mood,
      frame.shot,
      frame.prompt
    ];
    
    if (frame.narration) {
      parts.push(`Narration: ${frame.narration}`);
    }
    
    return parts.join('. ') + '.';
  }

  /**
   * Get aspect ratio string from preset
   * @private
   */
  _getAspectRatioFromPreset(preset) {
    const ratioMap = {
      '16:9': '16:9',
      '9:16': '9:16',
      '1:1': '1:1',
      '4:3': '4:3',
      '21:9': '21:9'
    };
    return ratioMap[preset.aspectRatio] || '16:9';
  }
}

// Export singleton instance and utility functions
const directorRuntime = new DirectorAgentRuntime();

export { 
  directorRuntime,
  buildDirectorProjectKnowledge,
  hashCode,
  paletteFromText,
  makeFrame,
  buildStoryboardFramePrompt,
  STORYBOARD_PRESETS,
  SHOT_TYPES,
  PALETTES,
  AGENTS,
  QUICK_ACTIONS
};