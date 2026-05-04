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
  
  // Core tools (excluding timeline, which is featured separately)
  const coreFeatures = ALL_FEATURES.slice(1, 9); // 8 items: cinema, director, ai-vfx, image, video, storyboard, edit, audio
  
  // Featured: Timeline Editor (top promotion)
  const featuredTimeline = [ALL_FEATURES[0]];
  
  // Remaining tools (excluding timeline which is featured)
  const otherFeatures = ALL_FEATURES.slice(9); // from effects onward
  
  const hero = Hero();
  const coreGrid = FeatureGrid({ features: coreFeatures, sectionTitle: 'Create videos in one click', sectionDescription: 'From viral effects to polished commercials, no editing needed', viewAllLink: '/apps', viewAllCount: ALL_FEATURES.length });
  const featured = FeatureGrid({ features: featuredTimeline, sectionTitle: 'THE ULTIMATE VIDEO EDITOR', sectionDescription: 'Professional timeline editing with AI-powered automation', viewAllLink: '/timeline' });
  const otherGrid = FeatureGrid({ features: otherFeatures, sectionTitle: 'Explore more features', sectionDescription: 'All the tools you need to create stunning content', viewAllLink: '/apps', viewAllCount: otherFeatures.length });
  
  container.append(hero, coreGrid, featured, otherGrid);
  
  return container;
}
