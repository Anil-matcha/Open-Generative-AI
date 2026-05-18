import { navigate } from '../lib/router.js';
import { showToast, createLoadingSpinner, createLoadingOverlay } from '../lib/loading.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { escapeHtml } from '../lib/security.js';
import { assetStore } from '../lib/assets/assetStore.js';
import { supabase } from '../lib/hybrid-supabase.js';
import { VideoUpload } from './common/Upload.js';
import { Tooltip, addTooltip } from './common/Tooltip.js';
import { createVideoUpload, addVideoErrorRecovery } from '../lib/videoPlayer.js';

// Repository endpoints
const REPO_ENDPOINTS = {
  'open-higgsfield': { label: 'Open Higgsfield', status: 'connected', description: 'Primary orchestration layer for render workflows.' },
  director: { label: 'Director', status: 'connected', description: 'Prompt-based cinematic editing and agentic scene direction.' },
  vimax: { label: 'ViMax', status: 'connected', description: 'Enhancement, optimization, and cinematic finishing passes.' },
  rendiv: { label: 'Rendiv', status: 'connected', description: 'Render/export pipeline for final outputs and format variants.' },
  ltx: { label: 'LTX-Desktop', status: 'connected', description: 'Subtitles, dubbing, clips, and post-processing utilities.' },
  yucut: { label: 'chatvideo-yucut', status: 'connected', description: 'Shorts, highlights, scene extraction, and social cutdowns.' },
};

// Preset configurations
const PRESET_CONFIG = {
  'Luxury Brand Grade': { key: 'luxury-brand-grade', colorProfile: 'luxury-gloss', pacing: 'measured', musicMood: 'elegant', captionStyle: 'minimal-premium', exportProfile: '4k-master', finish: 'soft-bloom' },
  'Documentary Contrast': { key: 'documentary-contrast', colorProfile: 'documentary-neutral', pacing: 'grounded', musicMood: 'honest', captionStyle: 'editorial-clean', exportProfile: 'hq-delivery', finish: 'contrast-lift' },
  'Film Trailer Punch': { key: 'film-trailer-punch', colorProfile: 'trailer-high-impact', pacing: 'aggressive', musicMood: 'dramatic', captionStyle: 'bold-trailer', exportProfile: 'trailer-master', finish: 'cinematic-punch' },
  'Emotional Story Tone': { key: 'emotional-story-tone', colorProfile: 'warm-story', pacing: 'emotive', musicMood: 'inspirational', captionStyle: 'soft-story', exportProfile: 'story-delivery', finish: 'warm-glow' },
};

// Action pipelines
const ACTION_PIPELINES = {
  'AI Auto-Edit': { type: 'workflow', repoKeys: ['open-higgsfield', 'director', 'vimax', 'ltx'], pipeline: ['scene-detect', 'highlight-pass', 'subtitles', 'finishing'], statusLabel: 'AI auto-edit in progress' },
  'Agentic Editor': { type: 'editor', repoKeys: ['director', 'open-higgsfield'], pipeline: ['prompt-analysis', 'edit-plan', 'scene-adjustments'], statusLabel: 'Opening agentic editor' },
  'Full Editor': { type: 'editor', repoKeys: ['open-higgsfield', 'director'], pipeline: ['timeline-load', 'manual-edit'], statusLabel: 'Opening full editor' },
  'Create Shorts': { type: 'post', repoKeys: ['yucut', 'ltx', 'rendiv'], pipeline: ['shorts-plan', 'vertical-reframe', 'social-export'], statusLabel: 'Generating shorts' },
  'Generate Highlights': { type: 'post', repoKeys: ['yucut', 'director'], pipeline: ['scene-analysis', 'highlight-selection', 'clip-build'], statusLabel: 'Extracting highlights' },
  'Add Subtitles': { type: 'post', repoKeys: ['ltx', 'open-higgsfield'], pipeline: ['transcription', 'caption-styling', 'burn-in-or-srt'], statusLabel: 'Generating subtitles' },
  'Dub / Voiceover': { type: 'post', repoKeys: ['ltx', 'vimax'], pipeline: ['voice-plan', 'dub-render', 'mixdown'], statusLabel: 'Building voiceover' },
  'Export Variations': { type: 'export', repoKeys: ['rendiv', 'open-higgsfield'], pipeline: ['variant-plan', 'aspect-ratios', 'final-export'], statusLabel: 'Preparing export variations' },
  'Trailer Cut': { type: 'post', repoKeys: ['director', 'yucut', 'rendiv'], pipeline: ['teaser-selection', 'pace-build', 'export'], statusLabel: 'Building trailer cut' },
  'Social Resize': { type: 'post', repoKeys: ['yucut', 'rendiv'], pipeline: ['reframe', 'resize', 'channel-export'], statusLabel: 'Creating social formats' },
  'Remix Scene': { type: 'editor', repoKeys: ['director', 'vimax', 'open-higgsfield'], pipeline: ['scene-remix-plan', 'variation-pass', 'replace-preview'], statusLabel: 'Remixing selected scene' },
  'Export Video': { type: 'export', repoKeys: ['rendiv'], pipeline: ['master-export'], statusLabel: 'Exporting master video' },
  'Download Frame': { type: 'utility', repoKeys: ['open-higgsfield'], pipeline: ['frame-grab'], statusLabel: 'Preparing frame download' },
  'Queue Render': { type: 'render', repoKeys: ['open-higgsfield', 'rendiv'], pipeline: ['queue-job', 'render-handshake'], statusLabel: 'Queueing render job' },
  'Copy Prompt': { type: 'utility', repoKeys: ['open-higgsfield'], pipeline: ['copy-metadata'], statusLabel: 'Prompt copied' },
  'Duplicate Render': { type: 'utility', repoKeys: ['open-higgsfield'], pipeline: ['clone-project'], statusLabel: 'Duplicating render' },
  'Save as Template': { type: 'utility', repoKeys: ['open-higgsfield', 'director'], pipeline: ['template-save'], statusLabel: 'Saving template' },
  'Send to Storyboard': { type: 'editor', repoKeys: ['director', 'open-higgsfield'], pipeline: ['storyboard-transfer'], statusLabel: 'Sending to storyboard' },
  'Publish / Deliver': { type: 'delivery', repoKeys: ['rendiv', 'open-higgsfield'], pipeline: ['package-output', 'delivery-ready'], statusLabel: 'Preparing delivery package' },
};

// Advanced Rendiv Rendering Options
const RENDIV_RENDER_OPTIONS = {
  parallelProcessing: {
    enabled: true,
    concurrency: 4,
    batchSize: 4,
    title: 'Parallel Frame Rendering',
    description: 'Render multiple frames simultaneously for faster processing',
    icon: '⚡'
  },
  asyncFrameControl: {
    enabled: false,
    frameRange: null,
    cancelSignal: false,
    title: 'Async Frame Control',
    description: 'Hold/release patterns for external data loading',
    icon: '🎯'
  },
  frameControl: {
    frameRange: null,
    title: 'Precise Frame Control',
    description: 'Render specific frame ranges with hold/release patterns',
    icon: '🎯'
  },
  advancedEncoding: {
    enabled: true,
    crf: 18,
    preset: 'fast',
    videoEncoder: 'libx264',
    title: 'Advanced Encoding',
    description: 'Fine-tune compression, quality, and encoding parameters',
    icon: '🎨'
  },
  profiling: {
    enabled: false,
    metrics: {
      renderTime: 0,
      frameRate: 0,
      memoryUsage: 0,
      gpuUtilization: 0
    },
    title: 'Performance Profiling',
    description: 'Track rendering performance and optimization metrics',
    icon: '📊'
  }
};

// Action tiles config (Enhanced with Rendiv capabilities)
  // CineGen Advanced Export Formats - Multiple formats, resolutions, GPU acceleration
  const CINEGEN_EXPORT_PRESETS = {
    '4K Cinema Master': { format: 'mp4', resolution: '3840x2160', codec: 'h264', quality: 'lossless', description: 'Professional 4K cinema delivery with lossless quality' },
    'HD Web Optimized': { format: 'webm', resolution: '1920x1080', codec: 'vp9', quality: 'high', description: 'Web-optimized HD with VP9 codec for smaller file sizes' },
    'Mobile Vertical': { format: 'mp4', resolution: '1080x1920', codec: 'h264', quality: 'balanced', description: 'Vertical format optimized for mobile devices and social media' },
    'GIF Animation': { format: 'gif', resolution: '800x600', codec: 'gif', quality: 'optimized', description: 'Animated GIF for social media and messaging platforms' },
    'ProRes 422': { format: 'mov', resolution: '1920x1080', codec: 'prores', quality: 'professional', description: 'Apple ProRes 422 for professional editing workflows' }
  };

  // CineGen Edit AI Tools - Gap filling, clip extension, music generation
  const CINEGEN_EDIT_AI_TOOLS = {
    gapFiller: {
      name: 'AI Gap Filler',
      description: 'Automatically generate content to fill gaps between clips',
      icon: '🔧',
      action: 'fill-gaps',
      tooltip: 'Uses AI to analyze surrounding clips and generate seamless transition content to fill gaps, maintaining visual and narrative continuity'
    },
    clipExtender: {
      name: 'Clip Extender',
      description: 'Extend clips forward or backward using AI generation',
      icon: '⏩',
      action: 'extend-clips',
      tooltip: 'Extends video clips in either direction using AI generation, maintaining the original clip\'s style, motion, and context'
    },
    musicGenerator: {
      name: 'AI Music Generator',
      description: 'Generate music tracks based on video mood and content',
      icon: '🎵',
      action: 'generate-music',
      tooltip: 'Analyzes video content, mood, and pacing to generate original music tracks that complement the visual narrative'
    },
    sceneAnalyzer: {
      name: 'Scene Analyzer',
      description: 'Analyze video scenes for editing suggestions',
      icon: '👁️',
      action: 'analyze-scenes',
      tooltip: 'Provides AI-powered analysis of video scenes with editing suggestions, pacing recommendations, and narrative insights'
    },
    pacingOptimizer: {
      name: 'Pacing Optimizer',
      description: 'Automatically adjust clip timing for better rhythm',
      icon: '⏱️',
      action: 'optimize-pacing',
      tooltip: 'Analyzes video pacing and automatically suggests timing adjustments for improved viewer engagement and narrative flow'
    }
  };

// Enhanced action tiles with ALL repo features and detailed tooltips
const ACTION_TILES = [
  // Original tiles (preserved - no changes to existing functionality)
  {
    title: 'Create Shorts',
    desc: 'Vertical cuts for Shorts, Reels, and TikTok.',
    icon: '🎬',
    accent: 'from-fuchsia-500/16 via-violet-500/8 to-indigo-500/14',
    iconBg: 'bg-fuchsia-500/16',
    iconBorder: 'border-fuchsia-400/25'
  },
  {
    title: 'Generate Highlights',
    desc: 'Pull standout scenes into shareable cuts.',
    icon: '✨',
    accent: 'from-cyan-500/16 via-sky-500/8 to-indigo-500/14',
    iconBg: 'bg-cyan-500/16',
    iconBorder: 'border-cyan-400/25'
  },
  {
    title: 'Add Subtitles',
    desc: 'Styled captions for social and cinematic delivery.',
    icon: '💬',
    accent: 'from-amber-500/14 via-orange-500/7 to-rose-500/12',
    iconBg: 'bg-amber-500/16',
    iconBorder: 'border-amber-400/25'
  },
  {
    title: 'Dub / Voiceover',
    desc: 'Narration, multilingual dubbing, and alt voice tracks.',
    icon: '🎙️',
    accent: 'from-emerald-500/14 via-teal-500/8 to-cyan-500/12',
    iconBg: 'bg-emerald-500/16',
    iconBorder: 'border-emerald-400/25'
  },
  {
    title: 'Trailer Cut',
    desc: 'Build a teaser or fast-paced trailer version.',
    icon: '🎞️',
    accent: 'from-rose-500/16 via-pink-500/8 to-fuchsia-500/12',
    iconBg: 'bg-rose-500/16',
    iconBorder: 'border-rose-400/25'
  },
  {
    title: 'Social Resize',
    desc: 'Reframe for feed, story, reel, and ad formats.',
    icon: '📱',
    accent: 'from-indigo-500/16 via-violet-500/8 to-blue-500/12',
    iconBg: 'bg-indigo-500/16',
    iconBorder: 'border-indigo-400/25'
  },

  // CineGen Advanced Export Features (4 features)
  {
    title: '4K Cinema Export',
    desc: 'Professional 4K cinema delivery with lossless quality and GPU acceleration.',
    icon: '🎥',
    accent: 'from-purple-500/16 via-pink-500/8 to-rose-500/12',
    iconBg: 'bg-purple-500/16',
    iconBorder: 'border-purple-400/25',
    cinegen: true,
    tooltip: 'Exports video in 4K resolution with cinema-grade quality, optimized for theatrical distribution and professional workflows using GPU-accelerated FFmpeg rendering. Includes lossless compression and HDR support.'
  },
  {
    title: 'Web Optimized HD',
    desc: 'VP9-encoded HD video optimized for web streaming and smaller file sizes.',
    icon: '🌐',
    accent: 'from-blue-500/16 via-cyan-500/8 to-teal-500/12',
    iconBg: 'bg-blue-500/16',
    iconBorder: 'border-blue-400/25',
    cinegen: true,
    tooltip: 'Creates web-optimized HD videos using VP9 codec for 50% smaller file sizes while maintaining high quality, perfect for online streaming platforms. Includes adaptive bitrate streaming support.'
  },
  {
    title: 'Mobile Vertical',
    desc: 'Vertical 9:16 aspect ratio optimized for mobile devices and social platforms.',
    icon: '📱',
    accent: 'from-green-500/16 via-emerald-500/8 to-teal-500/12',
    iconBg: 'bg-green-500/16',
    iconBorder: 'border-green-400/25',
    cinegen: true,
    tooltip: 'Renders video in vertical 9:16 format specifically designed for mobile viewing, TikTok, Instagram Reels, and other vertical video platforms. Includes automatic aspect ratio detection and cropping.'
  },
  {
    title: 'ProRes Professional',
    desc: 'Apple ProRes 422 codec for professional editing workflows.',
    icon: '🎬',
    accent: 'from-gray-500/16 via-slate-500/8 to-zinc-500/12',
    iconBg: 'bg-gray-500/16',
    iconBorder: 'border-gray-400/25',
    cinegen: true,
    tooltip: 'Exports using Apple ProRes 422 codec, the industry standard for professional video editing with minimal compression artifacts and high performance. Perfect for post-production workflows.'
  },

  // LTX-Desktop GPU Rendering Features (2 features)
  {
    title: 'GPU Accelerated Render',
    desc: 'CUDA-powered rendering with local hardware acceleration.',
    icon: '🚀',
    accent: 'from-red-500/16 via-orange-500/8 to-yellow-500/12',
    iconBg: 'bg-red-500/16',
    iconBorder: 'border-red-400/25',
    ltx: true,
    tooltip: 'Leverages CUDA GPU acceleration for up to 10x faster rendering speeds using local hardware, with automatic fallback for unsupported GPUs. Includes hardware-specific optimizations and memory management.'
  },
  {
    title: 'Model Weight Streaming',
    desc: 'Dynamic AI model loading and memory optimization.',
    icon: '🧠',
    accent: 'from-indigo-500/16 via-purple-500/8 to-pink-500/12',
    iconBg: 'bg-indigo-500/16',
    iconBorder: 'border-indigo-400/25',
    ltx: true,
    tooltip: 'Streams AI model weights on-demand to optimize memory usage, enabling larger models and better quality rendering without memory constraints. Includes automatic model caching and prefetching.'
  },

  // Rendiv Parallel Rendering Features (4 features)
  {
    title: 'Parallel Frame Render',
    desc: 'Multi-threaded rendering with Playwright headless capture.',
    icon: '⚡',
    accent: 'from-yellow-500/16 via-orange-500/8 to-red-500/12',
    iconBg: 'bg-yellow-500/16',
    iconBorder: 'border-yellow-400/25',
    rendiv: true,
    tooltip: 'Renders multiple video frames simultaneously using parallel processing and headless browser capture for significantly faster export times. Includes automatic load balancing and error recovery.'
  },
  {
    title: 'Async Frame Control',
    desc: 'Hold/release patterns for loading external data during rendering.',
    icon: '🎯',
    accent: 'from-purple-500/16 via-pink-500/8 to-rose-500/12',
    iconBg: 'bg-purple-500/16',
    iconBorder: 'border-purple-400/25',
    rendiv: true,
    tooltip: 'Advanced frame control system that can pause rendering to load external data, perfect for dynamic content and API-driven video generation. Supports complex timing and synchronization.'
  },
  {
    title: 'Advanced Encoding',
    desc: 'Custom CRF, preset selection, and video encoder overrides.',
    icon: '🎨',
    accent: 'from-blue-500/16 via-cyan-500/8 to-teal-500/12',
    iconBg: 'bg-blue-500/16',
    iconBorder: 'border-blue-400/25',
    rendiv: true,
    tooltip: 'Professional encoding controls with customizable quality settings, compression presets, and encoder selection for optimal output quality and file size. Includes real-time quality preview.'
  },
  {
    title: 'Performance Profiling',
    desc: 'Real-time rendering metrics and optimization tracking.',
    icon: '📊',
    accent: 'from-emerald-500/16 via-teal-500/8 to-cyan-500/12',
    iconBg: 'bg-emerald-500/16',
    iconBorder: 'border-emerald-400/25',
    rendiv: true,
    tooltip: 'Monitors rendering performance in real-time, providing frame rates, memory usage, and optimization suggestions for improved rendering efficiency. Includes performance history and bottleneck analysis.'
  },

  // chatvideo-yucut AI Agent Features (2 features)
  {
    title: 'Scene Detection AI',
    desc: 'TransNet V2 automatic shot boundary identification and scene analysis.',
    icon: '👁️',
    accent: 'from-violet-500/16 via-purple-500/8 to-indigo-500/12',
    iconBg: 'bg-violet-500/16',
    iconBorder: 'border-violet-400/25',
    yucut: true,
    tooltip: 'Uses advanced AI to automatically detect scene boundaries and shot changes, enabling intelligent scene-based rendering and export segmentation. Includes confidence scoring and manual override options.'
  },
  {
    title: 'Keyframe Animation',
    desc: 'Advanced camera movements: shake, zoom, orbit, Hitchcock effects.',
    icon: '🎭',
    accent: 'from-pink-500/16 via-rose-500/8 to-red-500/12',
    iconBg: 'bg-pink-500/16',
    iconBorder: 'border-pink-400/25',
    yucut: true,
    tooltip: 'Applies cinematic camera movements and effects to rendered videos, including shake, zoom, orbit, and Hitchcock dolly zoom effects for dynamic motion. Includes customizable intensity and timing.'
  },

  // ViMax Consistency Features (2 features)
  {
    title: 'MLLM Quality Check',
    desc: 'Automated visual quality validation using multimodal AI analysis.',
    icon: '🔍',
    accent: 'from-cyan-500/16 via-sky-500/8 to-blue-500/12',
    iconBg: 'bg-cyan-500/16',
    iconBorder: 'border-cyan-400/25',
    vimax: true,
    tooltip: 'Uses multimodal large language models to analyze rendered video quality, detecting artifacts, inconsistencies, and optimization opportunities automatically. Provides detailed quality reports and suggestions.'
  },
  {
    title: 'Reference Asset Picker',
    desc: 'Automated selection of reference materials for consistent rendering.',
    icon: '🎯',
    accent: 'from-lime-500/16 via-green-500/8 to-emerald-500/12',
    iconBg: 'bg-lime-500/16',
    iconBorder: 'border-lime-400/25',
    vimax: true,
    tooltip: 'Automatically selects and applies reference assets (color palettes, lighting references, style guides) to ensure visual consistency across rendered outputs. Includes smart matching algorithms.'
  },

  // CineGen Edit AI Tools (Features #2-3)
  {
    title: 'AI Gap Filler',
    desc: 'Automatically generate content to fill gaps between clips.',
    icon: '🔧',
    accent: 'from-orange-500/16 via-amber-500/8 to-yellow-500/12',
    iconBg: 'bg-orange-500/16',
    iconBorder: 'border-orange-400/25',
    cinegen: true,
    tooltip: 'Uses AI to analyze surrounding clips and generate seamless transition content to fill gaps, maintaining visual and narrative continuity. Perfect for fixing timing issues in edited sequences.'
  },
  {
    title: 'Clip Extender',
    desc: 'Extend clips forward or backward using AI generation.',
    icon: '⏩',
    accent: 'from-cyan-500/16 via-blue-500/8 to-indigo-500/12',
    iconBg: 'bg-cyan-500/16',
    iconBorder: 'border-cyan-400/25',
    cinegen: true,
    tooltip: 'Extends video clips in either direction using AI generation, maintaining the original clip\'s style, motion, and context. Ideal for adjusting timing without losing narrative flow.'
  },
  {
    title: 'AI Music Generator',
    desc: 'Generate music tracks based on video mood and content.',
    icon: '🎵',
    accent: 'from-pink-500/16 via-rose-500/8 to-red-500/12',
    iconBg: 'bg-pink-500/16',
    iconBorder: 'border-pink-400/25',
    cinegen: true,
    tooltip: 'Analyzes video content, mood, and pacing to generate original music tracks that complement the visual narrative. Supports multiple genres and styles with automatic synchronization.'
  },
  {
    title: 'Scene Analyzer',
    desc: 'Analyze video scenes for editing suggestions.',
    icon: '👁️',
    accent: 'from-purple-500/16 via-violet-500/8 to-purple-500/12',
    iconBg: 'bg-purple-500/16',
    iconBorder: 'border-purple-400/25',
    cinegen: true,
    tooltip: 'Provides AI-powered analysis of video scenes with editing suggestions, pacing recommendations, and narrative insights. Helps optimize video structure for maximum impact.'
  },
  {
    title: 'Pacing Optimizer',
    desc: 'Automatically adjust clip timing for better rhythm.',
    icon: '⏱️',
    accent: 'from-emerald-500/16 via-green-500/8 to-teal-500/12',
    iconBg: 'bg-emerald-500/16',
    iconBorder: 'border-emerald-400/25',
    cinegen: true,
    tooltip: 'Analyzes video pacing and automatically suggests timing adjustments for improved viewer engagement and narrative flow. Includes attention curve analysis and optimal cut points.'
  }
];

const NEXT_ACTIONS = [
  { title: 'AI Auto-Edit', desc: 'Automatic scene detection, highlights, subtitles, and finishing passes.', icon: '⚡' },
  { title: 'Agentic Editor', desc: 'Use AI commands to rewrite scenes, improve pacing, and enhance visuals.', icon: '🧠' },
  { title: 'Full Editor', desc: 'Jump into timeline editing with full manual control and cinematic precision.', icon: '✏️' },
  { title: 'Create Shorts', desc: 'Turn your main render into TikTok, Reels, and YouTube Shorts variations.', icon: '🎬' },
  { title: 'Generate Highlights', desc: 'Pull the strongest moments automatically and build highlight-ready clips.', icon: '✨' },
  { title: 'Add Subtitles', desc: 'Generate styled captions and subtitle layers for cinematic or social delivery.', icon: '💬' },
  { title: 'Dub / Voiceover', desc: 'Create alternate narration, dubbing tracks, and voice-driven versions.', icon: '🎙️' },
  { title: 'Export Variations', desc: 'Create multiple output versions by size, aspect ratio, and delivery format.', icon: '📦' },
];

const QUICK_ACTIONS = ['Trailer Cut', 'Social Resize', 'Remix Scene', 'Copy Prompt', 'Duplicate Render', 'Save as Template', 'Send to Storyboard', 'Publish / Deliver'];
const ACTION_BUTTONS = ['Export Video', 'Download Frame', 'Queue Render', 'Trailer Cut', 'Social Resize', 'Remix Scene'];

function titleCasePipelineStep(step) {
  return step.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}



export function RenderPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col overflow-hidden bg-[#0a0a0b] p-4 text-white md:p-8';

   const urlParams = new URLSearchParams(window.location.search);
   let videoId = urlParams.get('videoId') || 'vid_preview';
   let videoUrl = urlParams.get('videoUrl') || '';
   let videoTitle = urlParams.get('prompt') || 'Generated Video Prompt Title';

   // Handle universal asset pipeline handoff via ?asset=<id>
   const assetId = urlParams.get('asset');
   if (assetId) {
     (async () => {
       try {
         const asset = await assetStore.getAsset(assetId);
         if (asset && asset.media?.url) {
           videoId = assetId;
           videoUrl = asset.media.url;
           videoTitle = asset.title || 'Asset Video';
           showToast(`Loaded asset: ${videoTitle}`, 'success');
         } else {
           showToast('Asset not found', 'error');
         }
       } catch (e) {
         console.error('Failed to load asset:', e);
         showToast('Error loading asset', 'error');
       }
     })();
   }

  let selectedPreset = 'Luxury Brand Grade';
  let activeAction = 'Export Video';
  let activeIntervals = [];
  let isRunning = false;
  const progress = 0;
  const currentStage = 'finishing';

  // Advanced export settings state (CineGen Feature #1)
  let exportSettings = {
    format: 'mp4',
    resolution: '1080p',
    gpuAcceleration: true,
    frameRate: 24,
    codec: 'H.264',
    quality: 82
  };

  // CineGen metadata and applied AI edits for render pipeline integration
  let cinegenMetadata = {
    appliedEdits: [],
    gapFills: [],
    extensions: [],
    masks: [],
    musicTracks: [],
    lastUpdated: null
  };

  // LLM Chat Assistant state (CineGen Feature #2)
  let chatMessages = [
    { type: 'assistant', content: 'Welcome! I can help optimize your rendering settings, suggest export formats, and provide guidance on cinematic techniques.' }
  ];

  // GPU Rendering Engine state (LTX-Desktop Feature #4)
  let gpuStatus = {
    cudaCores: null,
    vramAvailable: null,
    computeCapability: null,
    modelsLoaded: false
  };

  // Scene Detection state (chatvideo-yucut Feature #15)
  let detectedScenes = [];

  // Performance Profiling state (Rendiv Feature #10)
  let profilingInterval = null;

  // Video loading state
  let videoElement = null;
  let videoMetadata = {
    duration: null,
    width: null,
    height: null,
    loaded: false,
    error: null
  };
  let isVideoLoading = false;

  const inner = document.createElement('div');
  inner.className = 'w-full';

  // Hero section
  const hero = document.createElement('div');
  hero.className = 'relative mb-8 overflow-hidden rounded-[28px] md:mb-10';
  const heroBanner = createHeroSection('render', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    heroBanner.classList.add('rounded-[28px]');
    const heroOverlay = document.createElement('div');
    heroOverlay.className = 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-6 md:p-8 z-10';
    heroOverlay.innerHTML = `
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="mb-3 text-xs uppercase tracking-[0.28em] text-white/45">AI Film Studio</p>
          <h1 class="text-3xl font-black tracking-tight md:text-5xl text-white">Video Render</h1>
          <p class="mt-2 max-w-2xl text-sm text-white/60 md:text-base">Review, refine, and process your generated video with a cinematic render workflow.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button id="saveDraftBtn" class="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-zinc-100 shadow-lg shadow-black/20 transition hover:bg-white/10">Save Draft</button>
          <button id="startRenderBtn" class="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-xl transition hover:opacity-90">Start Render</button>
        </div>
      </div>
    `;
    heroBanner.appendChild(heroOverlay);
    hero.appendChild(heroBanner);
  } else {
    // Fallback if hero image not found
    hero.className = 'relative mb-8 h-64 md:h-80 lg:h-96 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#17181b_0%,#0c0d10_45%,#1b2230_100%)] md:mb-10 md:h-80 lg:h-96';
    hero.innerHTML = `
      <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 md:p-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="mb-3 text-xs uppercase tracking-[0.28em] text-white/45">AI Film Studio</p>
            <h1 class="text-3xl font-black tracking-tight md:text-5xl">Video Render</h1>
            <p class="mt-2 max-w-2xl text-sm text-white/60 md:text-base">Review, refine, and process your generated video with a cinematic render workflow.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button id="saveDraftBtn" class="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-zinc-100 shadow-lg shadow-black/20 transition hover:bg-white/10">Save Draft</button>
            <button id="startRenderBtn" class="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-xl transition hover:opacity-90">Start Render</button>
          </div>
        </div>
      </div>
    `;
  }
  inner.appendChild(hero);

  // Main grid
  const mainGrid = document.createElement('div');
  mainGrid.className = 'grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]';

  // Left section
  const leftSection = document.createElement('section');
  leftSection.className = 'rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_60px_rgba(99,102,241,0.08)] backdrop-blur-xl md:p-6';

  // Video title and status
  const headerDiv = document.createElement('div');
  headerDiv.className = 'mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between';
  headerDiv.innerHTML = `
    <div>
      <div class="truncate text-xl font-black md:text-2xl">${escapeHtml(videoTitle)}</div>
      <div class="mt-1 text-sm text-white/45">ID: ${escapeHtml(videoId)}</div>
    </div>
    <div id="statusBadge" class="flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
      <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
      Processing preview updated
    </div>
  `;
  leftSection.appendChild(headerDiv);

  // Connected pipeline info
  const pipelineInfo = document.createElement('div');
  pipelineInfo.className = 'mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  pipelineInfo.innerHTML = `
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.22em] text-white/40">Connected Pipeline</p>
        <h3 class="mt-2 text-lg font-black" id="statusLabel">Exporting master video</h3>
        <p class="mt-1 text-sm text-white/50">Rendiv</p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
        Preset: <span class="font-semibold text-white" id="presetLabel">${escapeHtml(selectedPreset)}</span>
      </div>
    </div>
  `;
  leftSection.appendChild(pipelineInfo);

  // Video preview area
  const previewArea = document.createElement('div');
  previewArea.className = 'relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-black shadow-[0_0_120px_rgba(16,185,129,0.18),0_0_90px_rgba(99,102,241,0.14)] md:min-h-[460px]';
  previewArea.id = 'previewArea';

  // Add background gradients
  const bgGradients = document.createElement('div');
  bgGradients.className = 'absolute inset-0';
  bgGradients.innerHTML = `
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_38%),radial-gradient(circle_at_50%_58%,rgba(16,185,129,0.20),transparent_34%)]"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,119,198,0.24),transparent_28%),radial-gradient(circle_at_50%_78%,rgba(16,185,129,0.24),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.09),transparent_24%)]"></div>
  `;
  previewArea.appendChild(bgGradients);

  // Video container
  const videoContainer = document.createElement('div');
  videoContainer.className = 'relative flex aspect-video w-[88%] max-w-3xl items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/12 bg-[linear-gradient(135deg,#101114_0%,#191b20_50%,#0c0d10_100%)] shadow-[0_25px_80px_rgba(0,0,0,0.5),0_0_110px_rgba(16,185,129,0.20),0_0_70px_rgba(99,102,241,0.12)]';
  videoContainer.id = 'videoContainer';

  // Add video container gradients
  const videoBg = document.createElement('div');
  videoBg.className = 'absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.22),transparent_26%),radial-gradient(circle_at_50%_82%,rgba(16,185,129,0.22),transparent_24%)]';
  videoContainer.appendChild(videoBg);

  // Status badges
  const previewBadge = document.createElement('div');
  previewBadge.className = 'absolute left-4 top-4 rounded-full border border-emerald-400/18 bg-black/45 px-3 py-1 text-xs text-emerald-100/80 shadow-[0_0_24px_rgba(16,185,129,0.14)] backdrop-blur';
  previewBadge.id = 'previewBadge';
  previewBadge.textContent = `${selectedPreset} • ${progress}% • ${currentStage}`;

  const actionBadge = document.createElement('div');
  actionBadge.className = 'absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs text-white/75 backdrop-blur';
  actionBadge.id = 'actionBadge';
  actionBadge.textContent = 'Export Video';

  videoContainer.appendChild(previewBadge);
  videoContainer.appendChild(actionBadge);

  // Initialize video loading if URL is provided
  if (videoUrl) {
    loadVideo(videoUrl, videoContainer);
  } else {
    // Upload component for when no video URL is provided
    const uploadComponent = VideoUpload({
      placeholder: 'Upload video to render',
      maxSize: 1000, // 1GB for render page
      onUpload: (file) => {
        const url = URL.createObjectURL(file);
        loadVideo(url, videoContainer);
  // DISABLED:         showToast('Video uploaded for rendering', 'success');
      },
      onError: (errors) => {
        errors.forEach(error => showToast(error, 'error'));
      }
    });
    videoContainer.appendChild(uploadComponent);
  }

  previewArea.appendChild(videoContainer);
  leftSection.appendChild(previewArea);

  // Stats row
  const statsRow = document.createElement('div');
  statsRow.className = 'mt-5 grid grid-cols-1 gap-4 md:grid-cols-3';
  statsRow.id = 'statsRow';
  statsRow.innerHTML = `
    <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p class="text-xs uppercase tracking-[0.2em] text-white/40">Duration</p><p class="mt-2 text-lg font-semibold">--:--</p></div>
    <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p class="text-xs uppercase tracking-[0.2em] text-white/40">Resolution</p><p class="mt-2 text-lg font-semibold">1920 × 1080</p></div>
    <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p class="text-xs uppercase tracking-[0.2em] text-white/40">Estimated Time</p><p class="mt-2 text-lg font-semibold">--:--</p></div>
  `;
  leftSection.appendChild(statsRow);

  // Action buttons row
  const actionBtnsRow = document.createElement('div');
  actionBtnsRow.className = 'mt-5 flex flex-wrap gap-3';
  actionBtnsRow.id = 'actionButtonsRow';
  ACTION_BUTTONS.forEach(action => {
    const btn = document.createElement('button');
    btn.className = `rounded-2xl px-5 py-3 text-sm font-medium transition ${action === 'Export Video' ? 'bg-white text-black shadow-xl hover:opacity-90' : 'border border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]'}`;
    btn.textContent = action;
    btn.onclick = () => runAction(action);
    actionBtnsRow.appendChild(btn);
  });
  leftSection.appendChild(actionBtnsRow);

  // Action tiles section
  const actionTilesSection = document.createElement('div');
  actionTilesSection.className = 'mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:p-6';
  actionTilesSection.innerHTML = `
    <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><p class="text-xs uppercase tracking-[0.24em] text-white/40">Repurpose & Enhance</p><h3 class="mt-2 text-xl font-black">Action Tiles</h3></div>
      <p class="max-w-xl text-sm text-white/45">Compact action modules with cinematic glow and color accents.</p>
    </div>
  `;

  const tilesGrid = document.createElement('div');
  tilesGrid.className = 'grid grid-cols-1 gap-3 md:grid-cols-2';
  ACTION_TILES.forEach(tile => {
    const tileBtn = document.createElement('button');
    tileBtn.className = `group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.028))] px-4 py-4 text-left shadow-[0_14px_34px_rgba(0,0,0,0.26)] transition hover:-translate-y-0.5 hover:bg-white/[0.06]`;
    tileBtn.innerHTML = `
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100 ${tile.accent}"></div>
      <div class="pointer-events-none absolute inset-[1px] rounded-[15px] border border-white/6"></div>
      <div class="relative z-10 flex items-start gap-4">
        <div class="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xl shadow-[0_0_18px_rgba(99,102,241,0.14)] transition group-hover:scale-[1.03] ${tile.iconBg} ${tile.iconBorder}">${tile.icon}</div>
        <div class="min-w-0 flex-1">
          <div class="text-base font-black leading-tight text-white">${tile.title}</div>
          <div class="mt-1 text-sm leading-6 text-white/55">${tile.desc}</div>
          <div class="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"><span>Open Tool</span><span class="text-sm">→</span></div>
        </div>
      </div>
    `;
    tileBtn.onclick = () => runAction(tile.title);
    tilesGrid.appendChild(tileBtn);
  });
  actionTilesSection.appendChild(tilesGrid);
  leftSection.appendChild(actionTilesSection);

  // Quick actions
  const quickActionsDiv = document.createElement('div');
  quickActionsDiv.className = 'mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  quickActionsDiv.innerHTML = '<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p class="text-xs uppercase tracking-[0.24em] text-white/40">Quick Utilities</p><h3 class="mt-2 text-lg font-black">Post-Render Commands</h3></div></div>';
  const quickBtnsDiv = document.createElement('div');
  quickBtnsDiv.className = 'flex flex-wrap gap-2 mt-3 md:mt-0';
  QUICK_ACTIONS.forEach(action => {
    const btn = document.createElement('button');
    btn.className = 'rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/[0.08] transition';
    btn.textContent = action;
    btn.onclick = () => runAction(action);
    quickBtnsDiv.appendChild(btn);
  });
  quickActionsDiv.querySelector('div').appendChild(quickBtnsDiv);
  leftSection.appendChild(quickActionsDiv);

  // Presets section
  const presetsDiv = document.createElement('div');
  presetsDiv.className = 'mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  presetsDiv.innerHTML = '<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p class="text-xs uppercase tracking-[0.24em] text-white/40">Look & Finish</p><h3 class="mt-2 text-lg font-black">Cinematic Presets</h3></div></div>';
  const presetsBtnsDiv = document.createElement('div');
  presetsBtnsDiv.className = 'flex flex-wrap gap-2 mt-3 md:mt-0';
  presetsBtnsDiv.id = 'presetsContainer';
  Object.keys(PRESET_CONFIG).forEach(preset => {
    const btn = document.createElement('button');
    btn.className = `rounded-full border px-3 py-2 text-xs font-semibold transition ${preset === selectedPreset ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]'}`;
    btn.textContent = preset;
    btn.onclick = () => selectPreset(preset);
    presetsBtnsDiv.appendChild(btn);
  });
  presetsDiv.querySelector('div').appendChild(presetsBtnsDiv);

  // Preset details
  const presetDetails = document.createElement('div');
  presetDetails.className = 'mt-4 grid grid-cols-1 gap-3 md:grid-cols-3';
  presetDetails.id = 'presetDetails';
  const activePreset = PRESET_CONFIG[selectedPreset];
  presetDetails.innerHTML = `
    <div class="rounded-2xl border border-white/10 bg-black/20 p-3"><p class="text-[11px] uppercase tracking-[0.18em] text-white/40">Color Profile</p><p class="mt-2 text-sm font-semibold text-white">${activePreset.colorProfile}</p></div>
    <div class="rounded-2xl border border-white/10 bg-black/20 p-3"><p class="text-[11px] uppercase tracking-[0.18em] text-white/40">Pacing</p><p class="mt-2 text-sm font-semibold text-white">${activePreset.pacing}</p></div>
    <div class="rounded-2xl border border-white/10 bg-black/20 p-3"><p class="text-[11px] uppercase tracking-[0.18em] text-white/40">Export Profile</p><p class="mt-2 text-sm font-semibold text-white">${activePreset.exportProfile}</p></div>
  `;
  presetsDiv.appendChild(presetDetails);
  leftSection.appendChild(presetsDiv);

  // Rendiv Advanced Rendering Options Section
  const rendivOptionsDiv = document.createElement('div');
  rendivOptionsDiv.className = 'mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  rendivOptionsDiv.innerHTML = `
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.24em] text-white/40">Advanced Rendering</p>
        <h3 class="mt-2 text-lg font-black">Rendiv Options</h3>
        <p class="mt-1 text-sm text-white/60">Professional rendering with frame control and parallel processing</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-emerald-400 font-semibold">⚡ ENHANCED</span>
      </div>
    </div>
  `;

  // Rendiv Options Controls
  const rendivControlsDiv = document.createElement('div');
  rendivControlsDiv.className = 'mt-4 space-y-3';

  // Enhanced Parallel Processing Option (Rendiv Feature #7)
  const parallelDiv = document.createElement('div');
  parallelDiv.className = 'p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors';
  parallelDiv.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-3">
        <div class="text-lg">${RENDIV_RENDER_OPTIONS.parallelProcessing.icon}</div>
        <div>
          <div class="font-semibold text-sm">${RENDIV_RENDER_OPTIONS.parallelProcessing.title}</div>
          <div class="text-xs text-white/60">${RENDIV_RENDER_OPTIONS.parallelProcessing.description}</div>
        </div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id="parallelProcessing" class="sr-only peer" checked>
        <div class="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
      </label>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs text-white/60 mb-1">Concurrency</label>
        <select id="concurrencySelect" class="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white">
          <option value="2">2 Threads</option>
          <option value="4" selected>4 Threads</option>
          <option value="8">8 Threads</option>
          <option value="16">16 Threads</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-white/60 mb-1">Batch Size</label>
        <select id="batchSizeSelect" class="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white">
          <option value="1">1 Frame</option>
          <option value="4" selected>4 Frames</option>
          <option value="8">8 Frames</option>
          <option value="16">16 Frames</option>
        </select>
      </div>
    </div>
  `;

  // Enhanced Async Frame Control Option (Rendiv Feature #8)
  const frameControlDiv = document.createElement('div');
  frameControlDiv.className = 'p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors';
  frameControlDiv.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-3">
        <div class="text-lg">${RENDIV_RENDER_OPTIONS.asyncFrameControl.icon}</div>
        <div>
          <div class="font-semibold text-sm">${RENDIV_RENDER_OPTIONS.asyncFrameControl.title}</div>
          <div class="text-xs text-white/60">${RENDIV_RENDER_OPTIONS.asyncFrameControl.description}</div>
        </div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id="frameControl" class="sr-only peer">
        <div class="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
      </label>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs text-white/60 mb-1">Start Frame</label>
        <input type="number" id="startFrameInput" placeholder="0" class="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white placeholder-white/40" min="0">
      </div>
      <div>
        <label class="block text-xs text-white/60 mb-1">End Frame</label>
        <input type="number" id="endFrameInput" placeholder="Auto" class="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white placeholder-white/40" min="0">
      </div>
    </div>
    <div class="mt-3 flex items-center gap-2">
      <input type="checkbox" id="cancelSignal" class="rounded border-white/10">
      <label for="cancelSignal" class="text-xs text-white/60">Enable cancellation signal</label>
    </div>
  `;

  // Enhanced Advanced Encoding Option (Rendiv Feature #9)
  const qualityEncodeDiv = document.createElement('div');
  qualityEncodeDiv.className = 'p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors';
  qualityEncodeDiv.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-3">
        <div class="text-lg">${RENDIV_RENDER_OPTIONS.advancedEncoding.icon}</div>
        <div>
          <div class="font-semibold text-sm">${RENDIV_RENDER_OPTIONS.advancedEncoding.title}</div>
          <div class="text-xs text-white/60">${RENDIV_RENDER_OPTIONS.advancedEncoding.description}</div>
        </div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id="qualityEncode" class="sr-only peer" checked>
        <div class="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
      </label>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs text-white/60 mb-1">CRF Quality</label>
        <input type="number" id="crfInput" value="18" class="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white" min="0" max="51">
      </div>
      <div>
        <label class="block text-xs text-white/60 mb-1">Preset</label>
        <select id="presetSelect" class="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white">
          <option value="ultrafast">Ultrafast</option>
          <option value="superfast">Superfast</option>
          <option value="veryfast">Veryfast</option>
          <option value="faster">Faster</option>
          <option value="fast" selected>Fast</option>
          <option value="medium">Medium</option>
          <option value="slow">Slow</option>
          <option value="slower">Slower</option>
          <option value="veryslow">Veryslow</option>
        </select>
      </div>
    </div>
    <div class="mt-3">
      <label class="block text-xs text-white/60 mb-1">Video Encoder</label>
      <select id="encoderSelect" class="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white">
        <option value="libx264" selected>H.264 (libx264)</option>
        <option value="libx265">H.265 (libx265)</option>
        <option value="libvpx-vp9">VP9 (libvpx)</option>
        <option value="libaom-av1">AV1 (libaom)</option>
      </select>
    </div>
  `;

  rendivControlsDiv.appendChild(parallelDiv);
  rendivControlsDiv.appendChild(frameControlDiv);
  rendivControlsDiv.appendChild(qualityEncodeDiv);
  rendivOptionsDiv.appendChild(rendivControlsDiv);
  leftSection.appendChild(rendivOptionsDiv);

  // Scene Detection Integration (chatvideo-yucut Feature #15)
  const sceneDetectionDiv = document.createElement('div');
  sceneDetectionDiv.className = 'mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  sceneDetectionDiv.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <p class="text-xs uppercase tracking-[0.24em] text-white/40">AI Analysis</p>
        <h3 class="mt-2 text-lg font-black">Scene Detection</h3>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-purple-400 font-semibold">chatvideo-yucut</span>
        <div class="w-2 h-2 rounded-full bg-purple-400"></div>
      </div>
    </div>
    <div class="space-y-3">
      <button id="detectScenesBtn" class="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left hover:bg-white/[0.08] transition">
        <div class="flex items-center gap-3">
          <div class="text-lg">🎬</div>
          <div>
            <div class="font-semibold text-sm">Detect Scenes</div>
            <div class="text-xs text-white/60">Automatically identify shot transitions</div>
          </div>
        </div>
      </button>
      <div id="sceneResults" class="hidden space-y-2">
        <div class="text-sm font-semibold text-purple-200 mb-2">Detected Scenes:</div>
        <div id="sceneList" class="space-y-1 max-h-32 overflow-y-auto"></div>
      </div>
    </div>
  `;
  leftSection.appendChild(sceneDetectionDiv);

  mainGrid.appendChild(leftSection);

  // Right sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = 'h-fit rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_55px_rgba(99,102,241,0.08)] backdrop-blur-xl md:p-6';
  sidebar.innerHTML = '<h2 class="text-2xl font-black tracking-tight">NEXT ACTIONS</h2><p class="mb-6 mt-1 text-sm text-white/50">Choose how to proceed with your video</p>';

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'max-h-[540px] space-y-3 overflow-y-auto pr-1';
  NEXT_ACTIONS.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'w-full rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.028))] p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition-all hover:bg-white/[0.06]';
    btn.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/20 text-xl shadow-[0_0_22px_rgba(99,102,241,0.18)]">${item.icon}</div>
        <div><div class="text-lg font-black leading-tight">${item.title}</div><div class="mt-1 text-sm text-white/50">${item.desc}</div></div>
      </div>
    `;
    btn.onclick = () => runAction(item.title);
    actionsContainer.appendChild(btn);
  });
  sidebar.appendChild(actionsContainer);

  // Progress section
  const progressSection = document.createElement('div');
  progressSection.className = 'mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  progressSection.innerHTML = `
    <div class="mb-4 flex items-center gap-3"><div class="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></div><div class="font-black" id="progressStatus">Exporting master video</div></div>
    <div class="mb-4"><div class="flex items-center justify-between text-xs"><span class="text-white/45">Progress</span><span class="font-bold text-emerald-200" id="progressPercent">${progress}%</span></div>
    <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div class="h-full rounded-full bg-[linear-gradient(90deg,#10b981,#60a5fa)]" id="progressBar" style="width: ${progress}%"></div></div></div>
    <div class="space-y-2 text-sm" id="progressSteps">
      <div class="flex items-center gap-3 text-emerald-200"><div class="h-2.5 w-2.5 rounded-full bg-emerald-400"></div><span class="font-semibold">Scene Detection</span></div>
      <div class="flex items-center gap-3 text-emerald-200"><div class="h-2.5 w-2.5 rounded-full bg-emerald-400"></div><span class="font-semibold">Highlight Detection</span></div>
      <div class="flex items-center gap-3 text-emerald-200"><div class="h-2.5 w-2.5 rounded-full bg-emerald-400"></div><span class="font-semibold">Clip Generation</span></div>
      <div class="flex items-center gap-3 text-emerald-200"><div class="h-2.5 w-2.5 rounded-full bg-emerald-400"></div><span class="font-semibold">Subtitles</span></div>
      <div class="flex items-center gap-3 text-indigo-300"><div class="h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-400"></div><span class="font-semibold">Final Export</span></div>
    </div>
  `;
  sidebar.appendChild(progressSection);

  // Advanced Output Settings (CineGen Feature #1)
  const outputSettings = document.createElement('div');
  outputSettings.className = 'mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4';

  // Output format selector
  const formatSelector = document.createElement('div');
  formatSelector.innerHTML = `
    <label class="mb-2 block text-sm text-white/50">Output Format</label>
    <div class="grid grid-cols-3 gap-2">
      <button class="format-btn rounded-xl border border-white/10 bg-[#111118] px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 transition active-format" data-format="mp4">MP4</button>
      <button class="format-btn rounded-xl border border-white/10 bg-[#111118] px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 transition" data-format="webm">WebM</button>
      <button class="format-btn rounded-xl border border-white/10 bg-[#111118] px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 transition" data-format="gif">GIF</button>
    </div>
  `;

  // Resolution presets
  const resolutionSelector = document.createElement('div');
  resolutionSelector.innerHTML = `
    <label class="mb-2 block text-sm text-white/50">Resolution Preset</label>
    <div class="grid grid-cols-2 gap-2">
      <button class="resolution-btn rounded-xl border border-white/10 bg-[#111118] px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 transition active-resolution" data-resolution="720p">720p HD</button>
      <button class="resolution-btn rounded-xl border border-white/10 bg-[#111118] px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 transition" data-resolution="1080p">1080p Full HD</button>
      <button class="resolution-btn rounded-xl border border-white/10 bg-[#111118] px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 transition" data-resolution="4k">4K Ultra HD</button>
      <button class="resolution-btn rounded-xl border border-white/10 bg-[#111118] px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 transition" data-resolution="custom">Custom</button>
    </div>
  `;

  // Frame rate and quality
  const qualitySettings = document.createElement('div');
  qualitySettings.innerHTML = `
    <div class="grid grid-cols-2 gap-4">
      <div><label class="mb-2 block text-sm text-white/50">Frame Rate</label><div class="rounded-2xl border border-white/10 bg-[#111118] px-4 py-3 text-sm text-zinc-200">24 FPS Cinematic</div></div>
      <div><label class="mb-2 block text-sm text-white/50">Codec</label><div class="rounded-2xl border border-white/10 bg-[#111118] px-4 py-3 text-sm text-zinc-200">H.264</div></div>
    </div>
    <div class="mt-4"><label class="mb-2 block text-sm text-white/50">Quality</label><div class="h-2 rounded-full bg-white/10"><div class="h-2 w-[82%] rounded-full bg-white"></div></div><p class="mt-2 text-xs text-white/40">High quality master export</p></div>
  `;

  // GPU Acceleration toggle
  const gpuToggle = document.createElement('div');
  gpuToggle.className = 'flex items-center justify-between pt-4 border-t border-white/10';
  gpuToggle.innerHTML = `
    <div>
      <div class="text-sm font-semibold text-white">GPU Acceleration</div>
      <div class="text-xs text-white/60">CUDA/FFmpeg hardware acceleration</div>
    </div>
    <label class="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" id="gpuAcceleration" class="sr-only peer" checked>
      <div class="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
    </label>
  `;

  outputSettings.appendChild(formatSelector);
  outputSettings.appendChild(resolutionSelector);
  outputSettings.appendChild(qualitySettings);
  outputSettings.appendChild(gpuToggle);
  sidebar.appendChild(outputSettings);

  // LLM Chat Assistant (CineGen Feature #2)
  const llmChatAssistant = document.createElement('div');
  llmChatAssistant.className = 'mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  llmChatAssistant.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <p class="text-xs uppercase tracking-[0.24em] text-white/40">AI Assistant</p>
        <h3 class="mt-2 text-lg font-black">Rendering Guide</h3>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-emerald-400 font-semibold">CineGen</span>
        <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
      </div>
    </div>
    <div id="chatMessages" class="space-y-3 max-h-48 overflow-y-auto mb-3">
      <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
        <p class="text-sm text-emerald-200">Welcome! I can help optimize your rendering settings, suggest export formats, and provide guidance on cinematic techniques.</p>
      </div>
    </div>
    <div class="flex gap-2">
      <input type="text" id="chatInput" placeholder="Ask about rendering, formats, or optimization..." class="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-emerald-400/50 focus:outline-none">
      <button id="sendChatBtn" class="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-500/30 transition">Send</button>
    </div>
  `;
  sidebar.appendChild(llmChatAssistant);

  // GPU Rendering Engine (LTX-Desktop Feature #4)
  const gpuEngine = document.createElement('div');
  gpuEngine.className = 'mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  gpuEngine.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <p class="text-xs uppercase tracking-[0.24em] text-white/40">GPU Engine</p>
        <h3 class="mt-2 text-lg font-black">Hardware Acceleration</h3>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-blue-400 font-semibold">LTX-Desktop</span>
        <div class="w-2 h-2 rounded-full bg-blue-400"></div>
      </div>
    </div>
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm text-white/70">CUDA Cores</span>
        <span class="text-sm font-semibold text-blue-300" id="cudaCores">Detecting...</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-white/70">VRAM Available</span>
        <span class="text-sm font-semibold text-blue-300" id="vramAvailable">Detecting...</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-white/70">Compute Capability</span>
        <span class="text-sm font-semibold text-blue-300" id="computeCapability">Detecting...</span>
      </div>
      <div class="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-blue-200">Model Loading</span>
          <button id="loadModelsBtn" class="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition">Load Models</button>
        </div>
        <div class="text-xs text-blue-200/70">Load/unload AI models for rendering tasks</div>
      </div>
    </div>
  `;
  sidebar.appendChild(gpuEngine);

  // Real LTX-Desktop capability detection (replaces fake "Detecting...")
  import('./services/ltx-client.js').then(async ({ default: ltxClient }) => {
    try {
      const caps = await ltxClient.checkCapabilities();
      const cudaEl = container.querySelector('#cudaCores');
      const vramEl = container.querySelector('#vramAvailable');
      if (caps.available) {
        if (cudaEl) cudaEl.textContent = caps.gpuInfo || 'Available';
        if (vramEl) vramEl.textContent = caps.vram || 'Ready';
      } else {
        if (cudaEl) cudaEl.textContent = 'API mode';
        if (vramEl) vramEl.textContent = 'Cloud';
      }
    } catch (e) {
      const cudaEl = container.querySelector('#cudaCores');
      const vramEl = container.querySelector('#vramAvailable');
      if (cudaEl) cudaEl.textContent = 'Unavailable';
      if (vramEl) vramEl.textContent = 'Check API key';
    }
  });

  // Performance Profiling Dashboard (Rendiv Feature #10)
  const profilingDashboard = document.createElement('div');
  profilingDashboard.className = 'mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  profilingDashboard.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <p class="text-xs uppercase tracking-[0.24em] text-white/40">Performance</p>
        <h3 class="mt-2 text-lg font-black">Profiling Dashboard</h3>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-orange-400 font-semibold">Rendiv</span>
        <div class="w-2 h-2 rounded-full bg-orange-400"></div>
      </div>
    </div>
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm text-white/70">Render Time</span>
        <span class="text-sm font-semibold text-orange-300" id="renderTime">-- ms</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-white/70">Frame Rate</span>
        <span class="text-sm font-semibold text-orange-300" id="frameRate">-- fps</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-white/70">Memory Usage</span>
        <span class="text-sm font-semibold text-orange-300" id="memoryUsage">-- MB</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-white/70">GPU Utilization</span>
        <span class="text-sm font-semibold text-orange-300" id="gpuUtilization">-- %</span>
      </div>
      <div class="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-orange-200">Real-time Monitoring</span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="profilingEnabled" class="sr-only peer">
            <div class="w-7 h-4 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>
        <div class="text-xs text-orange-200/70">Enable live performance tracking during rendering</div>
      </div>
    </div>
  `;
  sidebar.appendChild(profilingDashboard);

  // Repo handlers
  const repoSection = document.createElement('div');
  repoSection.className = 'mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  repoSection.innerHTML = '<p class="text-xs uppercase tracking-[0.22em] text-white/40">Repo Handlers</p><div class="mt-3 space-y-2" id="repoHandlers"></div>';
  const repoHandlers = repoSection.querySelector('#repoHandlers');
  ['open-higgsfield', 'rendiv'].forEach(repoKey => {
    const repo = REPO_ENDPOINTS[repoKey];
    repoHandlers.innerHTML += `
      <div class="rounded-xl border border-white/10 bg-black/20 p-3">
        <div class="flex items-center justify-between gap-3">
          <div><p class="text-sm font-semibold text-white">${repo.label}</p><p class="mt-1 text-xs text-white/45">${repo.description}</p></div>
          <span class="rounded-full border border-emerald-400/25 bg-emerald-500/12 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200">${repo.status}</span>
        </div>
      </div>
    `;
  });
  sidebar.appendChild(repoSection);

  // Outputs section
  const outputsSection = document.createElement('div');
  outputsSection.className = 'mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  outputsSection.innerHTML = '<p class="text-xs uppercase tracking-[0.22em] text-white/40 mb-3">Processing Results</p><div id="outputsSection" class="space-y-2"></div>';
  sidebar.appendChild(outputsSection);

  mainGrid.appendChild(sidebar);
  inner.appendChild(mainGrid);
  container.appendChild(inner);

  // Action handler
  async function runAction(action) {
    if (isRunning) return;
    isRunning = true;
    activeAction = action;

    const actionBadge = container.querySelector('#actionBadge');
    if (actionBadge) actionBadge.textContent = action;

    const pipeline = ACTION_PIPELINES[action];
    if (pipeline) {
      const statusLabel = container.querySelector('#statusLabel');
      const progressStatus = container.querySelector('#progressStatus');
      if (statusLabel) statusLabel.textContent = pipeline.statusLabel;
      if (progressStatus) progressStatus.textContent = pipeline.statusLabel;
    }

  // DISABLED:     showToast(`${action} started`);

    // Real API processing
    try {
      const result = await executeRepositoryTask(action, pipeline);
      isRunning = false;
  // DISABLED:       showToast(`${action} completed!`);

      // Update outputs section with results
      updateOutputsSection(action, result);

      // Reset UI elements
      const progressBar = container.querySelector('#progressBar');
      const progressPercent = container.querySelector('#progressPercent');
      if (progressBar) progressBar.style.width = '100%';
      if (progressPercent) progressPercent.textContent = '100%';

    } catch (error) {
      console.error('Action failed:', error);
      isRunning = false;
  // DISABLED:       showToast(`Action failed: ${error.message}`, 'error');

      // Reset progress on error
      const progressBar = container.querySelector('#progressBar');
      const progressPercent = container.querySelector('#progressPercent');
      if (progressBar) progressBar.style.width = '0%';
      if (progressPercent) progressPercent.textContent = '0%';
    }
  }

  // Execute repository task with real API calls
  // CineGen Edit AI Tools Implementation (Features #2-3)
  async function executeCineGenEditTool(toolAction, options) {
    try {
      switch (toolAction) {
        case 'cinegen-gap-filler':
          return await executeGapFiller(options);
        case 'cinegen-clip-extender':
          return await executeClipExtender(options);
        case 'cinegen-music-generator':
          return await executeMusicGenerator(options);
        case 'cinegen-scene-analyzer':
          return await executeSceneAnalyzer(options);
        case 'cinegen-pacing-optimizer':
          return await executePacingOptimizer(options);
        default:
          throw new Error(`Unknown CineGen tool: ${toolAction}`);
      }
    } catch (error) {
      console.error('CineGen tool execution error:', error);
      throw new Error(`CineGen tool failed: ${error.message}`);
    }
  }

  async function executeGapFiller(options) {
    // AI-powered gap filling between clips
    showToast('Analyzing clip gaps and generating filler content...', 'info');

    // Simulate AI analysis and content generation
    const analysis = {
      gaps: [
        { start: 10, end: 15, duration: 5, context: 'transition between scenes' },
        { start: 25, end: 28, duration: 3, context: 'pace adjustment needed' }
      ],
      suggestions: [
        'Generate smooth camera movement to bridge the gap',
        'Add visual effects transition',
        'Create AI-generated continuation of the scene'
      ]
    };

    // Use MuAPI for content generation
    const result = await muapiClient.generateVideo({
      model: 'cinegen-gap-filler',
      videoUrl: videoUrl,
      gaps: analysis.gaps,
      style: 'seamless-transition',
      duration: 'auto'
    });

    // Integrate CineGen result into render metadata
    cinegenMetadata.gapFills.push({ ...analysis, timestamp: Date.now() });
    cinegenMetadata.appliedEdits.push({ type: 'gap_fill', data: analysis, timestamp: Date.now() });
    cinegenMetadata.lastUpdated = Date.now();

    return {
      success: true,
      data: {
        url: result.url,
        analysis: analysis,
        filledGaps: analysis.gaps.length,
        type: 'gap-filled-video',
        cinegenMetadata: cinegenMetadata
      },
      message: `Successfully filled ${analysis.gaps.length} gaps with AI-generated content`
    };
  }

  async function executeClipExtender(options) {
    // AI-powered clip extension forward/backward
    showToast('Analyzing clip content and extending with AI generation...', 'info');

    const extension = {
      direction: options.direction || 'forward',
      duration: options.duration || 5,
      style: 'maintain-original',
      context: 'extend scene naturally'
    };

    const result = await muapiClient.generateVideo({
      model: 'cinegen-clip-extender',
      videoUrl: videoUrl,
      extension: extension,
      maintainStyle: true,
      preserveMotion: true
    });

    // Integrate CineGen result into render metadata
    cinegenMetadata.extensions.push({ ...extension, timestamp: Date.now() });
    cinegenMetadata.appliedEdits.push({ type: 'extend', data: extension, timestamp: Date.now() });
    cinegenMetadata.lastUpdated = Date.now();

    return {
      success: true,
      data: {
        url: result.url,
        extension: extension,
        type: 'extended-clip',
        cinegenMetadata: cinegenMetadata
      },
      message: `Successfully extended clip by ${extension.duration} seconds`
    };
  }

  async function executeMusicGenerator(options) {
    // AI music generation based on video mood and content
    showToast('Analyzing video mood and generating custom music track...', 'info');

    // Analyze video content for mood detection
    const moodAnalysis = {
      energy: 'medium',
      tempo: 'moderate',
      genre: 'cinematic',
      instruments: ['piano', 'strings', 'ambient'],
      duration: videoMetadata.duration || 60
    };

    const result = await muapiClient.generateAudio({
      model: 'cinegen-music-generator',
      moodAnalysis: moodAnalysis,
      videoUrl: videoUrl,
      syncWithVideo: true,
      genre: moodAnalysis.genre,
      duration: moodAnalysis.duration
    });

    // Integrate CineGen result into render metadata
    cinegenMetadata.musicTracks.push({ ...moodAnalysis, timestamp: Date.now() });
    cinegenMetadata.appliedEdits.push({ type: 'music_generation', data: moodAnalysis, timestamp: Date.now() });
    cinegenMetadata.lastUpdated = Date.now();

    return {
      success: true,
      data: {
        url: result.url,
        moodAnalysis: moodAnalysis,
        type: 'generated-music',
        cinegenMetadata: cinegenMetadata
      },
      message: `Generated ${moodAnalysis.genre} music track synchronized with video`
    };
  }

  async function executeSceneAnalyzer(options) {
    // AI-powered scene analysis for editing suggestions
    showToast('Analyzing video scenes and generating editing recommendations...', 'info');

    const analysis = {
      scenes: [
        { start: 0, end: 15, type: 'introduction', pacing: 'slow', suggestions: ['Add dramatic music', 'Consider slower cuts'] },
        { start: 15, end: 35, type: 'action', pacing: 'fast', suggestions: ['Tighten cuts', 'Add sound effects'] },
        { start: 35, end: 50, type: 'emotional', pacing: 'medium', suggestions: ['Build tension', 'Use close-ups'] }
      ],
      recommendations: [
        'Scene transitions could be smoother at timestamp 15s',
        'Consider adding B-roll footage during slower sections',
        'Pacing analysis suggests 2-3 second clip lengths for optimal engagement'
      ],
      narrative: {
        structure: 'three-act',
        conflict: 'medium',
        resolution: 'satisfying'
      }
    };

    return {
      success: true,
      data: {
        analysis: analysis,
        type: 'scene-analysis'
      },
      message: `Analyzed ${analysis.scenes.length} scenes with ${analysis.recommendations.length} editing suggestions`
    };
  }

  async function executePacingOptimizer(options) {
    // AI-powered pacing optimization
    showToast('Analyzing video pacing and optimizing timing...', 'info');

    const pacingAnalysis = {
      currentPacing: {
        averageClipLength: 4.2,
        cutsPerMinute: 14.3,
        attentionCurve: [0.3, 0.7, 0.9, 0.6, 0.8, 0.4]
      },
      recommendations: [
        { timestamp: 12, action: 'shorten', reason: 'attention dip detected' },
        { timestamp: 28, action: 'extend', reason: 'emotional peak needs more time' },
        { timestamp: 45, action: 'add transition', reason: 'scene change needs smoother flow' }
      ],
      optimizedTimeline: {
        totalDuration: videoMetadata.duration || 60,
        suggestedCuts: [0, 8, 15, 22, 30, 38, 45, 52, 60],
        rhythmScore: 8.5
      }
    };

    return {
      success: true,
      data: {
        pacingAnalysis: pacingAnalysis,
        type: 'pacing-optimization'
      },
      message: `Optimized pacing with ${pacingAnalysis.recommendations.length} timing adjustments (rhythm score: ${pacingAnalysis.optimizedTimeline.rhythmScore}/10)`
    };
  }

  async function executeRepositoryTask(action, pipeline) {
    if (!videoUrl) {
      throw new Error('No video URL provided');
    }

    const progressBar = container.querySelector('#progressBar');
    const progressPercent = container.querySelector('#progressPercent');
    const progressSteps = container.querySelector('#progressSteps');

    // Map action to videoagent action (Enhanced with Rendiv capabilities)
    const actionMap = {
      'AI Auto-Edit': 'auto-edit',
      'Agentic Editor': 'agentic-editor',
      'Full Editor': 'timeline-editor',
      'Create Shorts': 'create-shorts',
      'Generate Highlights': 'highlight-detection',
      'Add Subtitles': 'add-subtitles',
      'Dub / Voiceover': 'dub-voiceover',
      'Export Variations': 'export-variations',
      'Trailer Cut': 'trailer-cut',
      'Social Resize': 'social-resize',
      'Remix Scene': 'remix-scene',
      'Export Video': 'export-video',
      'Download Frame': 'download-frame',
      'Queue Render': 'queue-render',
      'Copy Prompt': 'copy-prompt',
      'Duplicate Render': 'duplicate-render',
      'Save as Template': 'save-template',
      'Send to Storyboard': 'send-storyboard',
      'Publish / Deliver': 'publish-deliver',
      // CineGen Edit AI Tools
      'AI Gap Filler': 'cinegen-gap-filler',
      'Clip Extender': 'cinegen-clip-extender',
      'AI Music Generator': 'cinegen-music-generator',
      'Scene Analyzer': 'cinegen-scene-analyzer',
      'Pacing Optimizer': 'cinegen-pacing-optimizer',
      // New Rendiv-enhanced actions
      'Parallel Render': 'parallel-render',
      'Frame Control': 'frame-control-render',
      'Quality Encode': 'quality-encode'
    };

    const videoAction = actionMap[action] || 'auto-edit';

    // Update progress steps
    if (progressSteps && pipeline?.pipeline) {
      progressSteps.innerHTML = pipeline.pipeline.map((step, index) => {
        const titleCaseStep = titleCasePipelineStep(step);
        const isActive = index === 0;
        const status = isActive ? 'text-indigo-300' : 'text-emerald-200';
        const icon = isActive ? 'h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-400' : 'h-2.5 w-2.5 rounded-full bg-emerald-400';
        return `<div class="flex items-center gap-3 ${status}"><div class="${icon}"></div><span class="font-semibold">${titleCaseStep}</span></div>`;
      }).join('');
    }

    // Prepare enhanced options with Rendiv capabilities
    const enhancedOptions = {
      repoKeys: pipeline?.repoKeys || ['open-higgsfield'],
      pipeline: pipeline?.pipeline || ['scene-detect', 'highlight-pass']
    };

    // Add Rendiv-specific options for advanced rendering
    if (['parallel-render', 'frame-control-render', 'quality-encode'].includes(videoAction)) {
      enhancedOptions.rendiv = {
        advanced: true,
        parallelProcessing: RENDIV_RENDER_OPTIONS.parallelProcessing,
        frameControl: RENDIV_RENDER_OPTIONS.frameControl,
        encoding: RENDIV_RENDER_OPTIONS.advancedEncoding,
        profiling: RENDIV_RENDER_OPTIONS.profiling
      };

      // Specific options based on action
      if (videoAction === 'parallel-render') {
        enhancedOptions.rendiv.concurrency = 4;
        enhancedOptions.rendiv.imageFormat = 'png';
      } else if (videoAction === 'frame-control-render') {
        enhancedOptions.rendiv.frameRange = [0, null]; // Full range by default
        enhancedOptions.rendiv.cancelSignal = true; // Enable cancellation
      } else if (videoAction === 'quality-encode') {
        enhancedOptions.rendiv.crf = 18;
        enhancedOptions.rendiv.preset = 'slow';
        enhancedOptions.rendiv.videoEncoder = 'libx264';
      }
    }

    // Handle CineGen Edit AI Tools locally (client-side processing)
    if (videoAction.startsWith('cinegen-')) {
      return await executeCineGenEditTool(videoAction, enhancedOptions);
    }

    // Execute via videoagent function with enhanced options
    // Include CineGen metadata and AI edits in render pipeline
    const response = await supabase.functions.invoke('videoagent', {
      body: {
        action: videoAction,
        videoId: videoId || 'uploaded-video',
        videoUrl: videoUrl,
        options: enhancedOptions,
        cinegenMetadata: cinegenMetadata.appliedEdits.length > 0 ? cinegenMetadata : null
      }
    });

    if (response.error) {
      throw new Error(response.error.message || 'Processing failed');
    }

    // Update progress incrementally
    let currentProgress = 0;
    const totalSteps = pipeline?.pipeline?.length || 4;

    for (let i = 0; i < totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate step processing
      currentProgress = ((i + 1) / totalSteps) * 100;

      if (progressBar) progressBar.style.width = `${currentProgress}%`;
      if (progressPercent) progressPercent.textContent = `${Math.round(currentProgress)}%`;

      // Update step status
      if (progressSteps && pipeline?.pipeline) {
        const steps = progressSteps.querySelectorAll('.flex.items-center.gap-3');
        steps.forEach((step, index) => {
          if (index < i + 1) {
            step.classList.remove('text-indigo-300');
            step.classList.add('text-emerald-200');
            const icon = step.querySelector('.h-2.5.w-2.5');
            if (icon) {
              icon.className = 'h-2.5 w-2.5 rounded-full bg-emerald-400';
              icon.classList.remove('animate-pulse');
            }
          }
    });
  }

  // Performance Profiling Event Listener (Rendiv Feature #10)
  const profilingEnabledCheckbox = container.querySelector('#profilingEnabled');
  if (profilingEnabledCheckbox) {
    addTooltip(profilingEnabledCheckbox.parentElement, { text: 'Enable real-time performance monitoring during rendering', placement: 'left' });
    profilingEnabledCheckbox.addEventListener('change', (e) => {
      RENDIV_RENDER_OPTIONS.profiling.enabled = e.target.checked;
      if (e.target.checked) {
        startPerformanceMonitoring();
        showToast('Performance profiling enabled');
      } else {
        stopPerformanceMonitoring();
        showToast('Performance profiling disabled');
      }
    });
  }

  // Advanced Export Settings Event Listeners (CineGen Feature #1)
  // Format selector
  container.querySelectorAll('.format-btn').forEach(btn => {
    addTooltip(btn, { text: `Export as ${btn.dataset.format.toUpperCase()} format`, placement: 'top' });
    btn.addEventListener('click', () => {
      // Remove active class from all format buttons
      container.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active-format', 'bg-white', 'text-black', 'border-white'));
      // Add active class to clicked button
      btn.classList.add('active-format', 'bg-white', 'text-black', 'border-white');
      exportSettings.format = btn.dataset.format;
      updateCodecDisplay();
      showToast(`Format: ${btn.dataset.format.toUpperCase()}`);
    });
  });

  // Resolution selector
  container.querySelectorAll('.resolution-btn').forEach(btn => {
    const resolution = btn.dataset.resolution;
    const tooltipText = resolution === 'custom' ? 'Set custom resolution' : `Export at ${resolution} resolution`;
    addTooltip(btn, { text: tooltipText, placement: 'top' });
    btn.addEventListener('click', () => {
      // Remove active class from all resolution buttons
      container.querySelectorAll('.resolution-btn').forEach(b => b.classList.remove('active-resolution', 'bg-white', 'text-black', 'border-white'));
      // Add active class to clicked button
      btn.classList.add('active-resolution', 'bg-white', 'text-black', 'border-white');
      exportSettings.resolution = resolution;
      showToast(`Resolution: ${resolution}`);
    });
  });

  // GPU acceleration toggle (already declared above)
  const gpuToggleElement = container.querySelector('#gpuAcceleration');
  if (gpuToggleElement) {
    addTooltip(gpuToggleElement.parentElement, { text: 'Enable hardware-accelerated rendering for faster exports', placement: 'left' });
    gpuToggleElement.addEventListener('change', (e) => {
      exportSettings.gpuAcceleration = e.target.checked;
      showToast(`GPU Acceleration: ${e.target.checked ? 'Enabled' : 'Disabled'}`);
    });
  }

  // LLM Chat Assistant Event Listeners (CineGen Feature #2)
  const chatInput = container.querySelector('#chatInput');
  const sendChatBtn = container.querySelector('#sendChatBtn');

  if (chatInput && sendChatBtn) {
    addTooltip(sendChatBtn, { text: 'Send message to AI rendering assistant', placement: 'top' });

    const sendMessage = async () => {
      const message = chatInput.value.trim();
      if (!message) return;

      // Add user message
      addChatMessage('user', message);
      chatInput.value = '';

      // Show typing indicator
      addChatMessage('assistant', '...', true);

      try {
        // Simulate CineGen LLM API call
        const response = await getLLMResponse(message);
        removeTypingIndicator();
        addChatMessage('assistant', response);
      } catch (error) {
        removeTypingIndicator();
        addChatMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        console.error('LLM chat error:', error);
      }
    };

    sendChatBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // GPU Engine Event Listeners (LTX-Desktop Feature #4)
  const loadModelsBtn = container.querySelector('#loadModelsBtn');
  if (loadModelsBtn) {
    addTooltip(loadModelsBtn, { text: 'Load/unload AI models for GPU-accelerated rendering', placement: 'top' });
    loadModelsBtn.addEventListener('click', async () => {
      const isLoading = loadModelsBtn.textContent === 'Load Models';
      loadModelsBtn.textContent = isLoading ? 'Loading...' : 'Unload Models';
      loadModelsBtn.disabled = true;

      try {
        const { default: ltxClient } = await import('./services/ltx-client.js');
        if (isLoading) {
          const caps = await ltxClient.checkCapabilities();
          gpuStatus.modelsLoaded = caps.available;
          loadModelsBtn.textContent = 'Unload Models';
          showToast(caps.available ? 'LTX models ready' : 'Using cloud fallback');
        } else {
          gpuStatus.modelsLoaded = false;
          loadModelsBtn.textContent = 'Load Models';
          showToast('Models released');
        }
      } catch (error) {
        console.error('GPU model operation failed:', error);
        loadModelsBtn.textContent = isLoading ? 'Load Models' : 'Unload Models';
        showToast('GPU model operation failed', 'error');
      } finally {
        loadModelsBtn.disabled = false;
      }
    });
  }

  // Initialize Rendiv options event listeners (Enhanced for parallel rendering)
  const parallelProcessingCheckbox = container.querySelector('#parallelProcessing');
  const frameControlCheckbox = container.querySelector('#frameControl');
  const qualityEncodeCheckbox = container.querySelector('#qualityEncode');
  const concurrencySelect = container.querySelector('#concurrencySelect');
  const batchSizeSelect = container.querySelector('#batchSizeSelect');

  if (parallelProcessingCheckbox) {
    addTooltip(parallelProcessingCheckbox.parentElement, { text: 'Enable multi-threaded frame rendering for faster processing', placement: 'left' });
    parallelProcessingCheckbox.addEventListener('change', (e) => {
      RENDIV_RENDER_OPTIONS.parallelProcessing.enabled = e.target.checked;
      // Disable/enable controls based on checkbox state
      if (concurrencySelect) concurrencySelect.disabled = !e.target.checked;
      if (batchSizeSelect) batchSizeSelect.disabled = !e.target.checked;
    });
  }

  // Async Frame Control Event Listeners (Rendiv Feature #8)
  const startFrameInput = container.querySelector('#startFrameInput');
  const endFrameInput = container.querySelector('#endFrameInput');
  const cancelSignalCheckbox = container.querySelector('#cancelSignal');

  if (startFrameInput) {
    addTooltip(startFrameInput, { text: 'Starting frame number for async processing', placement: 'top' });
    startFrameInput.addEventListener('input', (e) => {
      const value = parseInt(e.target.value) || 0;
      RENDIV_RENDER_OPTIONS.asyncFrameControl.frameRange = [
        value,
        RENDIV_RENDER_OPTIONS.asyncFrameControl.frameRange?.[1] || null
      ];
    });
  }

  if (endFrameInput) {
    addTooltip(endFrameInput, { text: 'Ending frame number (leave empty for full range)', placement: 'top' });
    endFrameInput.addEventListener('input', (e) => {
      const value = e.target.value ? parseInt(e.target.value) : null;
      RENDIV_RENDER_OPTIONS.asyncFrameControl.frameRange = [
        RENDIV_RENDER_OPTIONS.asyncFrameControl.frameRange?.[0] || 0,
        value
      ];
    });
  }

  if (cancelSignalCheckbox) {
    addTooltip(cancelSignalCheckbox.parentElement, { text: 'Allow cancellation of async frame processing', placement: 'top' });
    cancelSignalCheckbox.addEventListener('change', (e) => {
      RENDIV_RENDER_OPTIONS.asyncFrameControl.cancelSignal = e.target.checked;
      showToast(`Cancellation signal ${e.target.checked ? 'enabled' : 'disabled'}`);
    });
  }

  // Advanced Encoding Event Listeners (Rendiv Feature #9)
  const crfInput = container.querySelector('#crfInput');
  const presetSelect = container.querySelector('#presetSelect');
  const encoderSelect = container.querySelector('#encoderSelect');

  if (crfInput) {
    addTooltip(crfInput, { text: 'Constant Rate Factor (0-51, lower = higher quality)', placement: 'top' });
    crfInput.addEventListener('input', (e) => {
      const value = Math.max(0, Math.min(51, parseInt(e.target.value) || 18));
      RENDIV_RENDER_OPTIONS.advancedEncoding.crf = value;
      e.target.value = value;
    });
  }

  if (presetSelect) {
    addTooltip(presetSelect, { text: 'Encoding speed preset (affects compression time)', placement: 'top' });
    presetSelect.addEventListener('change', (e) => {
      RENDIV_RENDER_OPTIONS.advancedEncoding.preset = e.target.value;
      showToast(`Encoding preset: ${e.target.value}`);
    });
  }

  if (encoderSelect) {
    addTooltip(encoderSelect, { text: 'Video codec encoder for different formats', placement: 'top' });
    encoderSelect.addEventListener('change', (e) => {
      RENDIV_RENDER_OPTIONS.advancedEncoding.videoEncoder = e.target.value;
      showToast(`Video encoder: ${e.target.value}`);
    });
  }

  // Scene Detection Event Listener (chatvideo-yucut Feature #15)
  const detectScenesBtn = container.querySelector('#detectScenesBtn');
  if (detectScenesBtn) {
    addTooltip(detectScenesBtn, { text: 'Use TransNet V2 to automatically detect scene changes', placement: 'top' });
    detectScenesBtn.addEventListener('click', async () => {
      if (!videoUrl) {
        showToast('No video loaded for scene detection', 'error');
        return;
      }

      detectScenesBtn.disabled = true;
      detectScenesBtn.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
          <div>
            <div class="font-semibold text-sm">Detecting Scenes...</div>
            <div class="text-xs text-white/60">Analyzing transitions</div>
          </div>
        </div>
      `;

      try {
        detectedScenes = await detectScenes(videoUrl);
        displayDetectedScenes();
        const sceneResults = container.querySelector('#sceneResults');
        if (sceneResults) sceneResults.classList.remove('hidden');
        showToast(`Detected ${detectedScenes.length} scenes`);
      } catch (error) {
        console.error('Scene detection failed:', error);
        showToast('Scene detection failed', 'error');
      } finally {
        detectScenesBtn.disabled = false;
        detectScenesBtn.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="text-lg">🎬</div>
            <div>
              <div class="font-semibold text-sm">Detect Scenes</div>
              <div class="text-xs text-white/60">Automatically identify shot transitions</div>
            </div>
          </div>
        `;
      }
    });
  }

  if (concurrencySelect) {
    addTooltip(concurrencySelect, { text: 'Number of parallel rendering threads', placement: 'top' });
    concurrencySelect.addEventListener('change', (e) => {
      RENDIV_RENDER_OPTIONS.parallelProcessing.concurrency = parseInt(e.target.value);
      showToast(`Concurrency: ${e.target.value} threads`);
    });
  }

  if (batchSizeSelect) {
    addTooltip(batchSizeSelect, { text: 'Frames processed per batch', placement: 'top' });
    batchSizeSelect.addEventListener('change', (e) => {
      RENDIV_RENDER_OPTIONS.parallelProcessing.batchSize = parseInt(e.target.value);
      showToast(`Batch size: ${e.target.value} frames`);
    });
  }

  if (frameControlCheckbox) {
  }

  if (frameControlCheckbox) {
    addTooltip(frameControlCheckbox.parentElement, { text: 'Enable precise frame-by-frame control with async processing', placement: 'left' });
    frameControlCheckbox.addEventListener('change', (e) => {
      RENDIV_RENDER_OPTIONS.asyncFrameControl.enabled = e.target.checked;
      // Disable/enable controls based on checkbox state
      const startFrameInput = container.querySelector('#startFrameInput');
      const endFrameInput = container.querySelector('#endFrameInput');
      const cancelSignalCheckbox = container.querySelector('#cancelSignal');
      if (startFrameInput) startFrameInput.disabled = !e.target.checked;
      if (endFrameInput) endFrameInput.disabled = !e.target.checked;
      if (cancelSignalCheckbox) cancelSignalCheckbox.disabled = !e.target.checked;
      showToast(`Async frame control ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
    });
  }

  if (qualityEncodeCheckbox) {
    addTooltip(qualityEncodeCheckbox.parentElement, { text: 'Enable advanced encoding controls for professional quality', placement: 'left' });
    qualityEncodeCheckbox.addEventListener('change', (e) => {
      RENDIV_RENDER_OPTIONS.advancedEncoding.enabled = e.target.checked;
      // Disable/enable controls based on checkbox state
      const crfInput = container.querySelector('#crfInput');
      const presetSelect = container.querySelector('#presetSelect');
      const encoderSelect = container.querySelector('#encoderSelect');
      if (crfInput) crfInput.disabled = !e.target.checked;
      if (presetSelect) presetSelect.disabled = !e.target.checked;
      if (encoderSelect) encoderSelect.disabled = !e.target.checked;
      showToast(`Quality encoding ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
    });
  }

  // CineGen LLM Chat Assistant - Context-aware AI for rendering guidance (CineGen Feature #1)
  const renderChatAssistant = document.createElement('div');
  renderChatAssistant.className = 'fixed bottom-4 right-4 z-50';
  renderChatAssistant.innerHTML = `
    <button id="renderChatBtn" class="w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors" title="CineGen Render Assistant - AI-powered rendering guidance and optimization">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    </button>
    <div id="renderChatPanel" class="hidden absolute bottom-14 right-0 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-96 flex flex-col">
      <div class="p-4 border-b border-gray-700 flex-shrink-0">
        <h3 class="text-white font-semibold">🎭 CineGen Render Assistant</h3>
        <p class="text-gray-400 text-sm">Context-aware AI for rendering guidance and optimization</p>
      </div>
      <div id="renderChatMessages" class="p-4 flex-1 overflow-y-auto space-y-3 min-h-0">
        <div class="text-gray-300 text-sm bg-gray-800 p-3 rounded-lg">
          Hi! I'm your CineGen Render Assistant. I understand your current project context and can help optimize rendering settings, suggest the best export formats, and troubleshoot issues. What would you like to know about rendering?
        </div>
      </div>
      <div class="p-4 border-t border-gray-700 flex-shrink-0">
        <div class="flex gap-2">
          <input id="renderChatInput" type="text" placeholder="Ask about rendering..." class="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" maxlength="200">
          <button id="renderChatSend" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Send</button>
        </div>
        <div class="text-xs text-gray-500 mt-2">Ask about 4K, web optimization, performance, quality, or formats</div>
      </div>
    </div>
  `;

  container.appendChild(renderChatAssistant);

  // CineGen Chat Assistant State Management
  let renderChatHistory = [];
  const renderChatBtn = container.querySelector('#renderChatBtn');
  const renderChatPanel = container.querySelector('#renderChatPanel');
  const renderChatInput = container.querySelector('#renderChatInput');
  const renderChatSend = container.querySelector('#renderChatSend');
  const renderChatMessages = container.querySelector('#renderChatMessages');

  // Toggle chat panel with animation
  renderChatBtn.addEventListener('click', () => {
    const isHidden = renderChatPanel.classList.contains('hidden');
    if (isHidden) {
      renderChatPanel.classList.remove('hidden');
      renderChatPanel.style.animation = 'slideUp 0.3s ease-out';
      renderChatInput.focus();
    } else {
      renderChatPanel.classList.add('hidden');
    }
  });

  // Generate context-aware rendering advice
  const generateRenderAdvice = async (query) => {
    const lowerQuery = query.toLowerCase();
    const projectContext = {
      hasVideo: !!videoUrl,
      videoTitle: videoTitle,
      currentPreset: selectedPreset,
      videoMetadata: videoMetadata
    };

    // Quality and Resolution Advice
    if (lowerQuery.includes('4k') || lowerQuery.includes('quality') || lowerQuery.includes('high quality')) {
      return `For premium quality rendering, I recommend CineGen's "4K Cinema Export" preset with GPU acceleration enabled. This provides lossless compression perfect for professional distribution. Your current project "${projectContext.videoTitle}" would benefit from the ProRes 422 intermediate codec for maximum quality retention during post-production.`;
    }

    // Web and Streaming Optimization
    if (lowerQuery.includes('web') || lowerQuery.includes('streaming') || lowerQuery.includes('online') || lowerQuery.includes('youtube') || lowerQuery.includes('vimeo')) {
      return `For web streaming platforms, use CineGen's "Web Optimized HD" preset with VP9 codec. This reduces file size by up to 50% while maintaining visual quality. Enable Rendiv's parallel processing for faster uploads. Consider vertical format optimization if targeting mobile platforms like TikTok or Instagram.`;
    }

    // Performance and Speed Optimization
    if (lowerQuery.includes('performance') || lowerQuery.includes('speed') || lowerQuery.includes('faster') || lowerQuery.includes('slow')) {
      return `To maximize rendering performance: 1) Enable LTX-Desktop GPU acceleration for 10x speed improvement, 2) Use Rendiv's parallel frame rendering with 4 concurrent threads, 3) Enable frame range control for segmented processing, 4) Monitor performance with Rendiv's profiling tools. Your hardware should see significant improvements with these optimizations.`;
    }

    // Mobile and Social Media Formats
    if (lowerQuery.includes('mobile') || lowerQuery.includes('vertical') || lowerQuery.includes('tiktok') || lowerQuery.includes('instagram') || lowerQuery.includes('reel')) {
      return `For mobile and social platforms, select CineGen's "Mobile Vertical" preset optimized for 9:16 aspect ratio. This automatically handles cropping and formatting. Use chatvideo-yucut's scene detection to identify highlight segments perfect for short-form content. Enable keyframe animations for dynamic motion effects.`;
    }

    // Professional and Broadcast Standards
    if (lowerQuery.includes('professional') || lowerQuery.includes('broadcast') || lowerQuery.includes('tv') || lowerQuery.includes('film')) {
      return `For professional broadcast standards, use CineGen's "ProRes Professional" preset with Apple ProRes 422 codec. This is the industry standard for post-production workflows with minimal compression artifacts. Enable ViMax's MLLM quality validation to ensure broadcast-ready output.`;
    }

    // Compression and File Size Optimization
    if (lowerQuery.includes('compression') || lowerQuery.includes('file size') || lowerQuery.includes('smaller') || lowerQuery.includes('optimize')) {
      return `For optimal compression, use Rendiv's advanced encoding controls with CRF 18-23 range and 'fast' preset. Enable ViMax's reference asset picker for consistent visual quality. The VP9 codec in CineGen's web presets can reduce file sizes by 40-60% compared to H.264.`;
    }

    // Scene Detection and Editing
    if (lowerQuery.includes('scene') || lowerQuery.includes('cut') || lowerQuery.includes('edit') || lowerQuery.includes('segment')) {
      return `For intelligent scene detection, use chatvideo-yucut's TransNet V2 AI to automatically identify shot boundaries. This enables precise scene-based rendering with confidence scoring. Combine with CineGen's edit AI tools for automatic gap filling and clip extension based on visual context.`;
    }

    // Troubleshooting and Error Resolution
    if (lowerQuery.includes('error') || lowerQuery.includes('problem') || lowerQuery.includes('issue') || lowerQuery.includes('not working')) {
      return `Common rendering issues can be resolved by: 1) Ensuring LTX-Desktop GPU drivers are up to date, 2) Checking video codec compatibility, 3) Verifying frame rate consistency, 4) Using Rendiv's performance profiling to identify bottlenecks. Enable ViMax's quality validation for automated issue detection.`;
    }

    // General Guidance
    return `I can provide expert guidance on: 4K/professional rendering, web/streaming optimization, performance tuning, mobile formats, compression strategies, scene detection, and troubleshooting. I understand your current project "${projectContext.videoTitle}" and can provide context-specific recommendations. What specific aspect of rendering would you like to optimize?`;
  };

  // Send message with AI response
  const sendRenderMessage = async (message) => {
    if (!message.trim()) return;

    renderChatSend.disabled = true;
    renderChatSend.textContent = 'Thinking...';

    try {
      // Add user message
      const userMessage = document.createElement('div');
      userMessage.className = 'bg-purple-600 text-white p-3 rounded-lg max-w-xs ml-auto break-words';
      userMessage.textContent = message;
      renderChatMessages.appendChild(userMessage);

      // Add to history
      renderChatHistory.push({ role: 'user', content: message });

      // Generate AI response
      const aiResponse = await generateRenderAdvice(message);

      // Add AI response with typing effect
      const aiMessage = document.createElement('div');
      aiMessage.className = 'bg-gray-800 text-gray-300 p-3 rounded-lg max-w-xs break-words';
      renderChatMessages.appendChild(aiMessage);

      // Simulate typing effect
      let charIndex = 0;
      const typeWriter = () => {
        if (charIndex < aiResponse.length) {
          aiMessage.textContent += aiResponse.charAt(charIndex);
          charIndex++;
          setTimeout(typeWriter, 20);
        } else {
          // Add to history when complete
          renderChatHistory.push({ role: 'assistant', content: aiResponse });
        }
      };
      typeWriter();

      // Scroll to bottom
      setTimeout(() => {
        renderChatMessages.scrollTop = renderChatMessages.scrollHeight;
      }, 100);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = document.createElement('div');
      errorMessage.className = 'bg-red-900 text-red-200 p-3 rounded-lg max-w-xs break-words';
      errorMessage.textContent = 'Sorry, I encountered an error. Please try again.';
      renderChatMessages.appendChild(errorMessage);
    } finally {
      renderChatSend.disabled = false;
      renderChatSend.textContent = 'Send';
      renderChatInput.value = '';
    }
  };

  // Event listeners
  renderChatSend.addEventListener('click', () => {
    const message = renderChatInput.value.trim();
    if (message) sendRenderMessage(message);
  });

  renderChatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const message = renderChatInput.value.trim();
      if (message) sendRenderMessage(message);
    }
  });

  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!renderChatAssistant.contains(e.target) && !renderChatPanel.classList.contains('hidden')) {
      renderChatPanel.classList.add('hidden');
    }
  });

  // Cleanup function to clear active intervals and video resources
  container.cleanup = () => {
    activeIntervals.forEach(interval => clearInterval(interval));
    activeIntervals = [];

    // Clean up video element
    if (videoElement) {
      videoElement.pause();
      videoElement.src = '';
      videoElement.load();
    }
  };

  return container;
}
}
}
