// Landing Page - Content sections only
import { Hero } from './sections/Hero.jsx';
import { LandingHeader } from './common/Header.jsx';
import { FeatureGrid } from './common/FeatureGrid.jsx';

const ALL_FEATURES = [
  { id: 'timeline', title: 'Timeline Editor', description: 'Professional NLE with tracks, clips, keyframes, real-time playback.', icon: '⏱️', link: '/timeline' },
  { id: 'cinema', title: 'Cinema Studio', description: 'Cinematic video generator with professional presets and LUTs.', icon: '🎬', link: '/cinema' },
  { id: 'director', title: 'Director', description: 'AI-powered film direction with scene composition and shot planning.', icon: '🎥', link: '/director' },
  { id: 'ai-vfx', title: 'AI-VFX', description: 'Visual effects powered by AI - explosions, particles, simulations.', icon: '✨', link: '/ai-vfx' },
  { id: 'image', title: 'Image Studio', description: 'AI image generation with 20+ models including Flux, SDXL, GPT Image.', icon: '🖼️', link: '/image' },
  { id: 'video', title: 'Video Studio', description: 'Text-to-video and image-to-video generation with motion control.', icon: '🎬', link: '/video' },
  { id: 'storyboard', title: 'Storyboard', description: 'Visual scene planning with drag-and-drop shot arrangement.', icon: '📋', link: '/storyboard' },
  { id: 'edit', title: 'Edit Studio', description: 'Precision video editing with trimming, splitting, and transitions.', icon: '✂️', link: '/edit' },
  { id: 'audio', title: 'Audio Studio', description: 'Multi-track audio mixing, effects, and voiceover tools.', icon: '🎵', link: '/audio' },
  { id: 'effects', title: 'Effects Studio', description: '100+ visual effects library with real-time preview.', icon: '🎭', link: '/effects' },
  { id: 'avatar', title: 'Avatar Studio', description: 'Create AI avatars and digital personalities.', icon: '👤', link: '/avatar' },
  { id: 'upscale', title: 'Upscale Studio', description: 'Enhance media quality with AI upscaling and restoration.', icon: '🔍', link: '/upscale' },
  { id: 'character', title: 'Character Studio', description: 'Character creation and animation with AI.', icon: '🧑', link: '/character' },
  { id: 'influencer', title: 'AI Influencer', description: 'Generate influencer-style content and virtual personas.', icon: '🌟', link: '/influencer' },
  { id: 'templates', title: 'Templates', description: 'Pre-built sequences and motion graphics templates.', icon: '📁', link: '/templates' },
  { id: 'training', title: 'Training Studio', description: 'Train custom AI models on your own data.', icon: '🏋️', link: '/training' },
  { id: 'videotools', title: 'Video Tools', description: 'Utility tools for video processing and manipulation.', icon: '🔧', link: '/videotools' },
  { id: 'chat', title: 'Chat / Assist', description: 'AI assistant for content creation and editing help.', icon: '💬', link: '/chat' },
  { id: 'remix-go', title: 'Remix Go', description: 'Quick mobile-friendly video remixing and editing.', icon: '📱', link: '/remix-go' },
  { id: 'commercial', title: 'Commercial Studio', description: 'Business-focused video creation for ads and marketing.', icon: '💼', link: '/commercial' },
  { id: 'render', title: 'Render Farm', description: 'Cloud-based video rendering with GPU acceleration.', icon: '🚀', link: '/render' },
  { id: 'video-agent', title: 'Video Agent', description: 'Autonomous AI agent for automated video creation.', icon: '🤖', link: '/video-agent' },
  { id: 'library', title: 'Media Library', description: 'Asset management and media browser.', icon: '📚', link: '/library' },
];

export default function LandingPage() {
  const container = document.createElement('div');
  container.className = 'landing-page';
  container.setAttribute('lang', document.documentElement.lang || 'en');
  container.setAttribute('dir', document.documentElement.dir || 'ltr');

  // Validate and sanitize features data
  const safeFeatures = Array.isArray(ALL_FEATURES) ? ALL_FEATURES.filter(f =>
    f && typeof f === 'object' && (f.title || f.id)
  ) : [];

  if (safeFeatures.length === 0) {
    console.warn('No valid features found for landing page');
    // Return minimal landing page
    container.innerHTML = `
      <section class="relative py-32 px-4 text-center">
        <div class="container mx-auto max-w-3xl">
          <h1 class="text-4xl md:text-6xl text-white mb-6">Welcome to Open Generative AI</h1>
          <p class="text-xl text-gray-400">Features loading...</p>
        </div>
      </section>
    `;
    return container;
  }

  // Core tools (excluding timeline, which is featured separately)
  const coreFeatures = safeFeatures.slice(1, Math.min(9, safeFeatures.length));

  // Featured: Timeline Editor (top promotion) - handle missing timeline
  const featuredTimeline = safeFeatures[0] ? [safeFeatures[0]] : [];

  // Remaining tools (excluding timeline which is featured)
  const otherFeatures = safeFeatures.slice(9);

  try {
    const hero = Hero();
    const coreGrid = FeatureGrid({
      features: coreFeatures,
      sectionTitle: 'Create videos in one click',
      sectionDescription: 'From viral effects to polished commercials, no editing needed',
      viewAllLink: '/apps',
      viewAllCount: safeFeatures.length,
      backgroundClass: 'bg-gradient-to-b from-cyan-400/5 via-transparent to-emerald-400/5'
    });
    const featured = featuredTimeline.length > 0 ? FeatureGrid({
      features: featuredTimeline,
      sectionTitle: 'THE ULTIMATE VIDEO EDITOR',
      sectionDescription: 'Professional timeline editing with AI-powered automation',
      viewAllLink: '/timeline',
      backgroundClass: 'bg-gradient-to-r from-cyan-400/10 via-transparent to-cyan-400/5'
    }) : null;

    const otherGrid = otherFeatures.length > 0 ? FeatureGrid({
      features: otherFeatures,
      sectionTitle: 'Explore more features',
      sectionDescription: 'All the tools you need to create stunning content',
      viewAllLink: '/apps',
      viewAllCount: otherFeatures.length,
      backgroundClass: 'bg-gradient-to-b from-emerald-400/5 via-transparent to-transparent'
    }) : null;

    // Append sections, filtering out nulls
    [hero, coreGrid, featured, otherGrid].filter(Boolean).forEach(section => {
      container.appendChild(section);
    });

  } catch (error) {
    console.error('Error rendering landing page:', error);
    // Fallback minimal page
    container.innerHTML = `
      <section class="relative py-32 px-4 text-center bg-gray-900">
        <div class="container mx-auto max-w-3xl">
          <h1 class="text-4xl md:text-6xl text-white mb-6">Welcome to Open Generative AI</h1>
          <p class="text-xl text-gray-400 mb-8">Something went wrong loading the page.</p>
          <button onclick="window.location.reload()" class="px-6 py-3 bg-cyan-400 text-black font-semibold rounded hover:bg-cyan-300 transition">
            Try Again
          </button>
        </div>
      </section>
    `;
  }

  return container;
}
