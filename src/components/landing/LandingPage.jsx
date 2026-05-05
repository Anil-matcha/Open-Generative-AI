// AI Video Agency Studio Landing Page
// Complete platform showcase with 33 apps and 60+ features

import { HeroSection } from './sections/HeroSection.jsx';
import { HookSection } from './sections/HookSection.jsx';
import { ScrollingAppStrip } from './sections/ScrollingAppStrip.jsx';
import { SixEnginesSection } from './sections/SixEnginesSection.jsx';
import { AppsGridSection } from './sections/AppsGridSection.jsx';
import { DemosSection } from './sections/DemosSection.jsx';
import { FeaturesSection } from './sections/FeaturesSection.jsx';
import { ProblemSection } from './sections/ProblemSection.jsx';
import { WorkflowSection } from './sections/WorkflowSection.jsx';
import { ComparisonSection } from './sections/ComparisonSection.jsx';
import { ValueStackSection } from './sections/ValueStackSection.jsx';
import { AgencySection } from './sections/AgencySection.jsx';
import { OfferSection } from './sections/OfferSection.jsx';
import { FinalCTASection } from './sections/FinalCTASection.jsx';

// All 33 AI Creative Apps with detailed descriptions
const ALL_APPS = [
  {
    id: 'image',
    title: 'Image',
    description: 'Generate high-quality AI images for ads, thumbnails, product visuals, social media, websites, and client campaigns.',
    link: '/image'
  },
  {
    id: 'video',
    title: 'Video',
    description: 'Create text-to-video, image-to-video, video-to-video, and cinematic motion content for social, ads, and branded campaigns.',
    link: '/video'
  },
  {
    id: 'cinema',
    title: 'Cinema Studio',
    description: 'Direct AI-generated scenes using cinematic camera language, lenses, moods, lighting, motion, shot types, and visual styles.',
    link: '/cinema'
  },
  {
    id: 'character',
    title: 'Character',
    description: 'Create consistent AI characters, branded personas, story characters, spokespersons, creators, and campaign personalities.',
    link: '/character'
  },
  {
    id: 'ai-vfx',
    title: 'AI-VFX',
    description: 'Generate advanced AI visual effects such as explosions, lightning, fire, energy effects, disintegration, destruction, and cinematic transformations.',
    link: '/ai-vfx'
  },
  {
    id: 'influencer',
    title: 'Influencer',
    description: 'Create AI influencer visuals, social content concepts, creator-style campaigns, fashion shots, lifestyle scenes, and branded posts.',
    link: '/influencer'
  },
  {
    id: 'storyboard',
    title: 'Storyboard',
    description: 'Plan campaigns, commercials, short films, social videos, and client projects using AI-assisted scene and shot planning.',
    link: '/storyboard'
  },
  {
    id: 'effects',
    title: 'Effects',
    description: 'Apply creative effects, transformations, motion styles, cinematic treatments, and stylized visual looks.',
    link: '/effects'
  },
  {
    id: 'vfx',
    title: 'VFX',
    description: 'Create high-impact visual effects for trailers, ads, social videos, fantasy scenes, action sequences, and cinematic content.',
    link: '/vfx'
  },
  {
    id: 'edit',
    title: 'Edit',
    description: 'Edit, revise, enhance, repurpose, and improve visual assets so users can move from raw AI output to polished delivery.',
    link: '/edit'
  },
  {
    id: 'upscale',
    title: 'Upscale',
    description: 'Improve image and video quality with AI upscaling for sharper, cleaner, more professional-looking assets.',
    link: '/upscale'
  },
  {
    id: 'audio',
    title: 'Audio',
    description: 'Generate, enhance, transform, or prepare audio assets for videos, voiceovers, ads, explainers, and AI content.',
    link: '/audio'
  },
  {
    id: 'avatar',
    title: 'Avatar',
    description: 'Create AI avatar-based content, virtual presenters, branded spokespersons, personality-driven videos, and talking visuals.',
    link: '/avatar'
  },
  {
    id: 'training',
    title: 'Training',
    description: 'Teach users how to use the platform, create sellable assets, package services, and build an AI video agency.',
    link: '/training'
  },
  {
    id: 'videotools',
    title: 'Video Tools',
    description: 'Access utility tools for enhancing, converting, modifying, preparing, and improving video assets.',
    link: '/videotools'
  },
  {
    id: 'render',
    title: 'Render',
    description: 'Preview, organize, export, and prepare final outputs for download, editing, delivery, or client presentation.',
    link: '/render'
  },
  {
    id: 'video-agent',
    title: 'Video Agent',
    description: 'Use AI agents to assist with video creation, editing decisions, creative direction, workflow steps, and content generation.',
    link: '/video-agent'
  },
  {
    id: 'director',
    title: 'Director',
    description: 'Turn prompts, concepts, scripts, and creative ideas into directed cinematic scenes and structured video plans.',
    link: '/director'
  },
  {
    id: 'timeline',
    title: 'Timeline',
    description: 'Arrange scenes, assets, clips, shots, captions, audio, and creative elements inside a structured video timeline.',
    link: '/timeline'
  },
  {
    id: 'motion',
    title: 'Motion',
    description: 'Generate camera movement, scene motion, product motion, character motion, and cinematic animation effects.',
    link: '/runway-motion'
  },
  {
    id: 'tiktok',
    title: 'TikTok',
    description: 'Create TikTok-style videos, hooks, short-form content, viral concepts, creator clips, and social-ready vertical assets.',
    link: '/tiktok-carousel'
  },
  {
    id: 'dubbing',
    title: 'Dubbing',
    description: 'Translate, localize, and dub video content for different languages, audiences, campaigns, and global delivery.',
    link: '/advanced-dubbing'
  },
  {
    id: 'chat',
    title: 'Chat',
    description: 'Use AI chat assistance to brainstorm, write prompts, plan campaigns, generate ideas, and guide the creative workflow.',
    link: '/chat'
  },
  {
    id: 'commercial',
    title: 'Commercial',
    description: 'Create product commercials, brand ads, local business promos, ecommerce videos, launch videos, and agency-ready ad concepts.',
    link: '/commercial'
  },
  {
    id: 'templates',
    title: 'Templates',
    description: 'Start faster with prebuilt creative templates for ads, thumbnails, products, social posts, cinematic shots, VFX, and more.',
    link: '/templates'
  },
  {
    id: 'explore',
    title: 'Explore',
    description: 'Browse creative ideas, examples, presets, templates, use cases, visual styles, and production inspiration.',
    link: '/explore'
  },
  {
    id: 'library',
    title: 'Library',
    description: 'Store, organize, reuse, and manage generated assets, projects, videos, images, templates, and campaign materials.',
    link: '/library'
  },
  {
    id: 'community',
    title: 'Community',
    description: 'Showcase examples, discover creative workflows, highlight user creations, and build a community around AI video creation.',
    link: '/community'
  },
  {
    id: 'assist',
    title: 'Assist',
    description: 'Use guided AI help for prompts, workflows, studio selection, creative improvement, and project completion.',
    link: '/assist'
  },
  {
    id: 'lip-sync',
    title: 'Lip Sync',
    description: 'Create talking photos, avatar videos, spokesperson content, character dialogue, and synced voice-to-face animations.',
    link: '/lipsync'
  },
  {
    id: 'workflows',
    title: 'Workflows',
    description: 'Run repeatable AI creative workflows for generating, editing, enhancing, rendering, and packaging content faster.',
    link: '/workflows'
  },
  {
    id: 'agents',
    title: 'Agents',
    description: 'Use specialized AI agents for creative direction, editing, storyboarding, video creation, prompt improvement, and production planning.',
    link: '/agents'
  },
  {
    id: 'mcp-cli',
    title: 'MCP & CLI',
    description: 'Control advanced workflows, connect tools, automate tasks, and extend the platform with agent-ready command and integration support.',
    link: '/mcp-cli'
  }
];

// 60+ AI Features organized by category
const FEATURE_CATEGORIES = {
  creation: {
    title: 'AI Creation Features',
    features: [
      'Text-to-image generation',
      'Image-to-image generation',
      'Text-to-video generation',
      'Image-to-video generation',
      'Video-to-video transformation',
      'AI prompt enhancement',
      'Cinematic prompt rewriting',
      'Multi-model creative generation',
      'Aspect ratio selection',
      'Style preset selection'
    ]
  },
  cinema: {
    title: 'Cinema & Visual Direction Features',
    features: [
      'Cinematic camera presets',
      'Lens style controls',
      'Focal length controls',
      'Aperture controls',
      'Shot type selection',
      'Lighting mood controls',
      'Scene composition guidance',
      'Camera movement prompts',
      'Film-style visual direction',
      'Director-style scene planning'
    ]
  },
  character: {
    title: 'Character & Avatar Features',
    features: [
      'Consistent character creation',
      'AI avatar generation',
      'Talking avatar creation',
      'AI influencer content',
      'Character transformation effects',
      'Fashion-style creator shots',
      'Profile image generation',
      'Persona-based visual content',
      'Brand mascot creation',
      'Virtual spokesperson content'
    ]
  },
  vfx: {
    title: 'VFX & Effects Features',
    features: [
      'Explosion effects',
      'Fire effects',
      'Lightning effects',
      'Tornado effects',
      'Disintegration effects',
      'Energy effects',
      'Action scene effects',
      'Motion effects',
      'Style transfer effects',
      'Cinematic transformation effects'
    ]
  },
  editing: {
    title: 'Editing & Enhancement Features',
    features: [
      'AI video editing assistance',
      'Timeline editing',
      'Scene arrangement',
      'Clip organization',
      'Asset previewing',
      'Render management',
      'AI upscaling',
      'Video enhancement',
      'Image enhancement',
      'Output export workflow'
    ]
  },
  commercial: {
    title: 'Commercial & Agency Features',
    features: [
      'Product commercial generation',
      'Ecommerce ad creative generation',
      'Local business promo creation',
      'Social media video creation',
      'TikTok content generation',
      'YouTube thumbnail creation',
      'Short-form ad creation',
      'Campaign storyboard creation',
      'Client asset library',
      'Agency service packaging'
    ]
  }
};

// Six Creative Engines
const CREATIVE_ENGINES = {
  create: {
    title: 'Create',
    description: 'Start from scratch with AI-powered generation',
    apps: ['Image', 'Video', 'Cinema Studio', 'Character', 'Influencer', 'Commercial'],
    color: 'from-cyan-500/20 to-cyan-400/20'
  },
  enhance: {
    title: 'Enhance',
    description: 'Transform and improve existing content',
    apps: ['Effects', 'VFX', 'AI-VFX', 'Motion', 'Upscale', 'Edit'],
    color: 'from-emerald-500/20 to-emerald-400/20'
  },
  produce: {
    title: 'Produce',
    description: 'Plan, structure, and assemble projects',
    apps: ['Storyboard', 'Director', 'Timeline', 'Render', 'Video Tools', 'Audio'],
    color: 'from-purple-500/20 to-purple-400/20'
  },
  localize: {
    title: 'Localize',
    description: 'Adapt content for global audiences',
    apps: ['Dubbing', 'Lip Sync', 'Avatar', 'TikTok', 'Social Content'],
    color: 'from-pink-500/20 to-pink-400/20'
  },
  automate: {
    title: 'Automate',
    description: 'Streamline workflows with AI assistance',
    apps: ['Video Agent', 'Agents', 'Workflows', 'Assist', 'Chat', 'MCP & CLI'],
    color: 'from-yellow-500/20 to-yellow-400/20'
  },
  scale: {
    title: 'Scale',
    description: 'Manage, reuse, and grow your creative assets',
    apps: ['Templates', 'Explore', 'Library', 'Community', 'Training'],
    color: 'from-indigo-500/20 to-indigo-400/20'
  }
};

export default function LandingPage() {
  const container = document.createElement('div');
  container.className = 'landing-page min-h-screen bg-[#020205]';
  container.setAttribute('lang', document.documentElement.lang || 'en');
  container.setAttribute('dir', document.documentElement.dir || 'ltr');

  try {
    // Hero Section (main headline)
    const heroSection = HeroSection();
    container.appendChild(heroSection);

    // Scrolling App Strip
    const scrollingStrip = ScrollingAppStrip();
    container.appendChild(scrollingStrip);

    // Hook Section (direct-response messaging)
    const hookSection = HookSection();
    container.appendChild(hookSection);

    // Six Creative Engines Section
    const sixEnginesSection = SixEnginesSection();
    container.appendChild(sixEnginesSection);

    // Apps Grid Section (33 apps)
    const appsSection = AppsGridSection({ apps: ALL_APPS });
    container.appendChild(appsSection);

    // Demos Section (interactive demos)
    const demosSection = DemosSection();
    container.appendChild(demosSection);

    // Features Section (60+ features)
    const featuresSection = FeaturesSection({ categories: FEATURE_CATEGORIES });
    container.appendChild(featuresSection);

    // Problem Section
    const problemSection = ProblemSection();
    container.appendChild(problemSection);

    // Workflow Section
    const workflowSection = WorkflowSection();
    container.appendChild(workflowSection);

    // Comparison Section
    const comparisonSection = ComparisonSection();
    container.appendChild(comparisonSection);

    // Value Stack Section
    const valueStackSection = ValueStackSection();
    container.appendChild(valueStackSection);

    // Agency Section
    const agencySection = AgencySection();
    container.appendChild(agencySection);

    // Offer Section
    const offerSection = OfferSection();
    container.appendChild(offerSection);

    // Final CTA Section
    const finalCTASection = FinalCTASection();
    container.appendChild(finalCTASection);

    // Add scroll-triggered animations
    initializeScrollAnimations(container);

  } catch (error) {
    console.error('Error rendering AI Video Agency Studio landing page:', error);
    // Fallback minimal page
    container.innerHTML = `
      <section class="relative py-32 px-4 text-center bg-[#020205] min-h-screen flex items-center justify-center">
        <div class="container mx-auto max-w-3xl">
          <h1 class="text-4xl md:text-6xl text-white mb-6">AI Video Agency Studio</h1>
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

// Initialize scroll-triggered animations using Intersection Observer
function initializeScrollAnimations(container) {
  // Delay to ensure DOM is ready
  setTimeout(() => {
    const animatedElements = container.querySelectorAll('.engine-card, .feature-category, .app-card');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach((el, index) => {
      el.style.animationDelay = `${index * 50}ms`;
      observer.observe(el);
    });
  }, 100);
}
