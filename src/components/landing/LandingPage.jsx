// AI Video Agency Studio Landing Page
// Optimized with lazy loading for sections

import { LandingHeader } from './common/Header.jsx';

// All 33 AI Creative Apps - moved to separate module for lazy loading
const ALL_APPS = [
  { id: 'image', title: 'Image', description: 'Generate high-quality AI images for ads, thumbnails, product visuals, social media, websites, and client campaigns.', link: '/image' },
  { id: 'video', title: 'Video', description: 'Create text-to-video, image-to-video, video-to-video, and cinematic motion content for social, ads, and branded campaigns.', link: '/video' },
  { id: 'cinema', title: 'Cinema Studio', description: 'Direct AI-generated scenes using cinematic camera language, lenses, moods, lighting, motion, shot types, and visual styles.', link: '/cinema' },
  { id: 'character', title: 'Character', description: 'Create consistent AI characters, branded personas, story characters, spokespersons, creators, and campaign personalities.', link: '/character' },
  { id: 'ai-vfx', title: 'AI-VFX', description: 'Generate advanced AI visual effects such as explosions, lightning, fire, energy effects, disintegration, destruction, and cinematic transformations.', link: '/ai-vfx' },
  { id: 'influencer', title: 'Influencer', description: 'Create AI influencer visuals, social content concepts, creator-style campaigns, fashion shots, lifestyle scenes, and branded posts.', link: '/influencer' },
  { id: 'storyboard', title: 'Storyboard', description: 'Plan campaigns, commercials, short films, social videos, and client projects using AI-assisted scene and shot planning.', link: '/storyboard' },
  { id: 'effects', title: 'Effects', description: 'Apply creative effects, transformations, motion styles, cinematic treatments, and stylized visual looks.', link: '/effects' },
  { id: 'vfx', title: 'VFX', description: 'Create high-impact visual effects for trailers, ads, social videos, fantasy scenes, action sequences, and cinematic content.', link: '/vfx' },
  { id: 'edit', title: 'Edit', description: 'Edit, revise, enhance, repurpose, and improve visual assets so users can move from raw AI output to polished delivery.', link: '/edit' },
  { id: 'upscale', title: 'Upscale', description: 'Improve image and video quality with AI upscaling for sharper, cleaner, more professional-looking assets.', link: '/upscale' },
  { id: 'audio', title: 'Audio', description: 'Generate, enhance, transform, or prepare audio assets for videos, voiceovers, ads, explainers, and AI content.', link: '/audio' },
  { id: 'avatar', title: 'Avatar', description: 'Create AI avatar-based content, virtual presenters, branded spokespersons, personality-driven videos, and talking visuals.', link: '/avatar' },
  { id: 'training', title: 'Training', description: 'Teach users how to use the platform, create sellable assets, package services, and build an AI video agency.', link: '/training' },
  { id: 'videotools', title: 'Video Tools', description: 'Access utility tools for enhancing, converting, modifying, preparing, and improving video assets.', link: '/videotools' },
  { id: 'render', title: 'Render', description: 'Preview, organize, export, and prepare final outputs for download, editing, delivery, or client presentation.', link: '/render' },
  { id: 'video-agent', title: 'Video Agent', description: 'Use AI agents to assist with video creation, editing decisions, creative direction, workflow steps, and content generation.', link: '/video-agent' },
  { id: 'director', title: 'Director', description: 'Turn prompts, concepts, scripts, and creative ideas into directed cinematic scenes and structured video plans.', link: '/director' },
  { id: 'timeline', title: 'Timeline', description: 'Arrange scenes, assets, clips, shots, captions, audio, and creative elements inside a structured video timeline.', link: '/timeline' },
  { id: 'runway-motion', title: 'Motion', description: 'Generate camera movement, scene motion, product motion, character motion, and cinematic animation effects.', link: '/runway-motion' },
  { id: 'tiktok-carousel', title: 'TikTok', description: 'Create TikTok-style videos, hooks, short-form content, viral concepts, creator clips, and social-ready vertical assets.', link: '/tiktok-carousel' },
  { id: 'advanced-dubbing', title: 'Dubbing', description: 'Translate, localize, and dub video content for different languages, audiences, campaigns, and global delivery.', link: '/advanced-dubbing' },
  { id: 'chat', title: 'Chat', description: 'Use AI chat assistance to brainstorm, write prompts, plan campaigns, generate ideas, and guide the creative workflow.', link: '/chat' },
  { id: 'commercial', title: 'Commercial', description: 'Create product commercials, brand ads, local business promos, ecommerce videos, launch videos, and agency-ready ad concepts.', link: '/commercial' },
  { id: 'templates', title: 'Templates', description: 'Start faster with prebuilt creative templates for ads, thumbnails, products, social posts, cinematic shots, VFX, and more.', link: '/templates' },
  { id: 'explore', title: 'Explore', description: 'Browse creative ideas, examples, presets, templates, use cases, visual styles, and production inspiration.', link: '/explore' },
  { id: 'library', title: 'Library', description: 'Store, organize, reuse, and manage generated assets, projects, videos, images, templates, and campaign materials.', link: '/library' },
  { id: 'community', title: 'Community', description: 'Showcase examples, discover creative workflows, highlight user creations, and build a community around AI video creation.', link: '/community' },
  { id: 'assist', title: 'Assist', description: 'Use guided AI help for prompts, workflows, studio selection, creative improvement, and project completion.', link: '/assist' },
  { id: 'workflows', title: 'Workflows', description: 'Run repeatable AI creative workflows for generating, editing, enhancing, rendering, and packaging content faster.', link: '/workflows' },
  { id: 'agents', title: 'Agents', description: 'Use specialized AI agents for creative direction, editing, storyboarding, video creation, prompt improvement, and production planning.', link: '/agents' },
  { id: 'mcp-cli', title: 'MCP & CLI', description: 'Control advanced workflows, connect tools, automate tasks, and extend the platform with agent-ready command and integration support.', link: '/mcp-cli' }
];

// Lazy-loaded sections (loaded when scrolled into view)
const lazySectionConfigs = [
  { path: './sections/HeroSection.jsx', id: 'hero' },
  { path: './sections/ScrollingAppStrip.jsx', id: 'scrolling' },
  { path: './sections/HookSection.jsx', id: 'hook' },
  { path: './sections/SixEnginesSection.jsx', id: 'engines' },
  { path: './sections/AppsGridSection.jsx', id: 'apps' },
  { path: './sections/DemosSection.jsx', id: 'demos' },
  { path: './sections/FeaturesSection.jsx', id: 'features' },
  { path: './sections/ProblemSection.jsx', id: 'problem' },
  { path: './sections/WorkflowSection.jsx', id: 'workflow' },
  { path: './sections/ComparisonSection.jsx', id: 'comparison' },
  { path: './sections/ValueStackSection.jsx', id: 'value' },
  { path: './sections/AgencySection.jsx', id: 'agency' },
  { path: './sections/OfferSection.jsx', id: 'offer' },
  { path: './sections/FinalCTASection.jsx', id: 'cta' }
];

// Section loader using Intersection Observer for lazy loading
function createLazySection(importFn, sectionId, props = {}) {
  const placeholder = document.createElement('div');
  placeholder.id = `section-${sectionId}`;
  placeholder.className = 'min-h-[200px] flex items-center justify-center';
  placeholder.innerHTML = '<div class="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"></div>';
  
  // Use Intersection Observer to load when visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        observer.unobserve(placeholder);
        importFn().then(module => {
          let section;
          // Handle different export patterns
          if (module.default) {
            section = props.apps ? module.default({ apps: props.apps }) : module.default(props);
          } else if (module.AppsGridSection) {
            section = module.AppsGridSection({ apps: ALL_APPS });
          } else {
            const fnName = Object.keys(module).find(k => k.includes('Section') || k.includes('Page'));
            section = fnName ? module[fnName](props) : module[Object.keys(module)[0]](props);
          }
          placeholder.replaceWith(section);
        }).catch(err => {
          console.error(`Failed to load section ${sectionId}:`, err);
          placeholder.innerHTML = `<div class="text-red-400">Failed to load section</div>`;
        });
      }
    });
  }, { rootMargin: '100px' });
  
  observer.observe(placeholder);
  return placeholder;
}

export default function LandingPage() {
  const container = document.createElement('div');
  container.className = 'landing-page min-h-screen bg-[#020205]';
  container.setAttribute('lang', document.documentElement.lang || 'en');
  container.setAttribute('dir', document.documentElement.dir || 'ltr');

  try {
    // Landing Header - prepend to ensure it's always the first element (above icons/hero)
    import('./common/Header.jsx').then(({ LandingHeader }) => {
      const headerEl = LandingHeader();
      container.prepend(headerEl);
    });

    // Lazy-loaded sections (loaded when scrolled into view)
    const scrollingStrip = createLazySection(() => import('./sections/ScrollingAppStrip.jsx'), 'scrolling');
    const hookSection = createLazySection(() => import('./sections/HookSection.jsx'), 'hook');
    const sixEngines = createLazySection(() => import('./sections/SixEnginesSection.jsx'), 'engines');
    const appsGrid = createLazySection(() => import('./sections/AppsGridSection.jsx'), 'apps', { apps: ALL_APPS });
    const demos = createLazySection(() => import('./sections/DemosSection.jsx'), 'demos');
    const features = createLazySection(() => import('./sections/FeaturesSection.jsx'), 'features');
    const problem = createLazySection(() => import('./sections/ProblemSection.jsx'), 'problem');
    const workflow = createLazySection(() => import('./sections/WorkflowSection.jsx'), 'workflow');
    const comparison = createLazySection(() => import('./sections/ComparisonSection.jsx'), 'comparison');
    const valueStack = createLazySection(() => import('./sections/ValueStackSection.jsx'), 'value');
    const agency = createLazySection(() => import('./sections/AgencySection.jsx'), 'agency');
    const offer = createLazySection(() => import('./sections/OfferSection.jsx'), 'offer');
    const finalCTA = createLazySection(() => import('./sections/FinalCTASection.jsx'), 'cta');

    // Append placeholders in order
    container.appendChild(scrollingStrip);
    container.appendChild(hookSection);
    container.appendChild(sixEngines);
    container.appendChild(appsGrid);
    container.appendChild(demos);
    container.appendChild(features);
    container.appendChild(problem);
    container.appendChild(workflow);
    container.appendChild(comparison);
    container.appendChild(valueStack);
    container.appendChild(agency);
    container.appendChild(offer);
    container.appendChild(finalCTA);

  } catch (error) {
    console.error('Error rendering landing page:', error);
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