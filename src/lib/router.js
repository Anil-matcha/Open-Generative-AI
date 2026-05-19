/* global history */

const ROUTE_MAP = {
  'Explore': 'explore',
  'Image': 'image',
  'Video': 'video',
  'Storyboard': 'storyboard',
  'Edit': 'edit',
  'Character': 'character',

  'Vibe Motion': 'effects',
  'VFX': 'vfx',
  'AI-VFX': 'ai-vfx',
  'Cinema Studio': 'cinema',
  'AI Influencer': 'influencer',
  'Apps': 'apps',
  'Templates': 'templates',
  'Assist': 'assist',
  'Community': 'community',
  'Avatar': 'avatar',
  'Audio': 'audio',
  'Workflows': 'workflows',
  'Agents': 'agents',
  'MCP & CLI': 'mcp-cli',
  'Video Outreach': 'video-outreach',
  'Assistant': 'assistant',
  'Studio': 'studio',
};

export function getRouteForItem(item) {
  return ROUTE_MAP[item] || item.toLowerCase().replace(/\s+/g, '-');
}

const pageLoaders = {
  image: () => import('../components/ImageStudio.js').then(m => m.ImageStudio()),
  video: () => import('../components/VideoStudio.js').then(m => m.VideoStudio()),
  cinema: () => import('../components/CinemaStudio.js').then(m => m.CinemaStudio()),
  apps: () => import('../components/AppsHub.js').then(m => m.AppsHub()),
  templates: () => import('../components/TemplatesPage.js').then(m => m.TemplatesPage()),
  effects: () => import('../components/EffectsStudio.js').then(m => m.EffectsStudio()),
  vfx: () => import('../components/EffectsStudio.js').then(m => m.EffectsStudio()),
  'ai-vfx': () => import('../components/AIVFXStudio.js').then(m => m.AIVFXStudio()),
  edit: () => import('../components/EditStudio.js').then(m => m.EditStudio()),
  upscale: () => import('../components/UpscaleStudio.js').then(m => m.UpscaleStudio()),
  library: () => import('../components/LibraryPage.js').then(m => m.LibraryPage()),
  character: () => import('../components/CharacterStudio.js').then(m => m.CharacterStudio()),
  influencer: () => import('../components/InfluencerStudio.js').then(m => m.InfluencerStudio()),
  commercial: () => import('../components/CommercialStudio.js').then(m => m.CommercialStudio()),
  explore: () => import('../components/ExplorePage.js').then(m => m.ExplorePage()),
  avatar: () => import('../components/AvatarStudio.js').then(m => m.AvatarStudio()),
  audio: () => import('../components/AudioStudio.js').then(m => m.AudioStudio()),
  training: () => import('../components/TrainingStudio.js').then(m => m.TrainingStudio()),
  videotools: () => import('../components/VideoToolsStudio.js').then(m => m.VideoToolsStudio()),
  chat: () => import('../components/ChatStudio.js').then(m => m.ChatStudio()),
  lipsync: () => import('../components/LipSyncStudio.js').then(m => m.LipSyncStudio()),
  workflows: () => import('../components/WorkflowBuilderApp.js').then(m => m.WorkflowBuilderApp()),
  'workflows/editor': () => import('../components/WorkflowBuilderApp.js').then(m => m.WorkflowBuilderApp()),
  'workflows/history': () => import('../components/WorkflowBuilderApp.js').then(m => m.WorkflowBuilderApp()),
  'workflows/settings': () => import('../components/WorkflowBuilderApp.js').then(m => m.WorkflowBuilderApp()),
  agents: () => import('../components/AgentStudio.js').then(m => m.AgentStudio()),
  assistant: () => import('../components/AssistantStudio.js').then(m => m.AssistantStudio()),
  studio: () => import('../components/StudioApp.js').then(m => m.StudioApp()),
  'workflow-builder': () => import('../components/WorkflowBuilderApp.js').then(m => m.WorkflowBuilderApp()),
  'ai-agent': () => import('../components/AIAgentApp.js').then(m => m.AIAgentApp()),
  'design-agent': () => import('../components/DesignAgentApp.js').then(m => m.DesignAgentApp()),
  'marketing-studio': () => import('../components/MarketingStudioApp.js').then(m => m.MarketingStudioApp()),
  'apps-studio': () => import('../components/AppsStudioApp.js').then(m => m.AppsStudioApp()),
  'mcp-cli': () => import('../components/McpCliStudio.js').then(m => m.McpCliStudio()),
  'video-outreach': () => import('../components/VideoOutreachStudio.js').then(m => m.VideoOutreachStudio()),

  assist: () => import('../components/AssistPage.js').then(m => m.AssistPage()),
  community: () => import('../components/CommunityPage.js').then(m => m.CommunityPage()),
  storyboard: () => import('../components/StoryboardStudio.js').then(m => m.StoryboardStudio()),
  'text-to-image': () => import('../components/TextToImagePage.js').then(m => m.TextToImagePage()),
  'image-to-image': () => import('../components/ImageToImagePage.js').then(m => m.ImageToImagePage()),
  'text-to-video': () => import('../components/TextToVideoPage.js').then(m => m.TextToVideoPage()),
  'image-to-video': () => import('../components/ImageToVideoPage.js').then(m => m.ImageToVideoPage()),
  'video-to-video': () => import('../components/VideoToVideoPage.js').then(m => m.VideoToVideoPage()),
  'video-watermark': () => import('../components/VideoWatermarkPage.js').then(m => m.VideoWatermarkPage()),
  'storyboard-page': () => import('../components/StoryboardPage.js').then(m => m.StoryboardPage()),
  'character-page': () => import('../components/CharacterPage.js').then(m => m.CharacterPage()),
  'effects-page': () => import('../components/EffectsPage.js').then(m => m.EffectsPage()),
  'cinema-page': () => import('../components/CinemaPage.js').then(m => m.CinemaPage()),
  'influencer-page': () => import('../components/InfluencerPage.js').then(m => m.InfluencerPage()),
  'commercial-page': () => import('../components/CommercialPage.js').then(m => m.CommercialPage()),
  'upscale-page': () => import('../components/UpscalePage.js').then(m => m.UpscalePage()),
  render: () => import('../components/RenderPage.js').then(m => m.RenderPage()),
  'video-agent': () => import('../components/VideoAgentPage.js').then(m => m.VideoAgentPage()),
  director: () => import('../components/DirectorPage.js').then(m => m.DirectorPage()),
  timeline: () => import('../components/PlaceholderPage.js').then(m => () => m.PlaceholderPage('Timeline')),
  'timeline-test': () => import('../components/TimelineTestPage.jsx').then(m => m.TimelineTestPage),
  'remix-go': () => import('../apps/remix-go/index.js').then(m => m.RemixGoApp()),
  'ai-video-outreach': () => import('../components/AIVideoOutreachPage.js').then(m => m.AIVideoOutreachPage()),
  'ai-headshot': () => import('../components/HeadshotStudio.js').then(m => m.HeadshotStudio()),
  'runway-motion': () => import('../components/RunwayMotionStudio.js').then(m => m.RunwayMotionStudio()),
  'tiktok-carousel': () => import('../components/TikTokCarouselStudio.js').then(m => m.TikTokCarouselStudio()),
  'advanced-dubbing': () => import('../components/AdvancedDubbingStudio.js').then(m => m.AdvancedDubbingStudio()),
  documentation: () => import('../components/DocumentationPage.js').then(m => m.DocumentationPage()),
  landing: () => import('../components/landing/LandingPage.jsx').then(m => m.LandingPage()),
  signin: () => import('../components/landing/SignInPage.jsx').then(m => m.SignInPage()),
  headshots: () => import('../components/HeadshotStudio.js').then(m => m.HeadshotStudio()),
  'headshots-generate': () => import('../components/HeadshotStudio.js').then(m => m.HeadshotStudio()),
  'headshots-history': () => import('../components/HeadshotStudio.js').then(m => m.HeadshotStudio()),
  'headshots-settings': () => import('../components/HeadshotStudio.js').then(m => m.HeadshotStudio()),
  personalizer: () => import('../components/PlaceholderPage.js').then(m => () => m.PlaceholderPage('Personalizer')),
  'pomelli-studio': () => import('../components/PomelliStudio.js').then(m => m.PomelliStudio()),
  'workflow-studio': () => import('../components/WorkflowStudioApp.js').then(m => m.WorkflowStudioApp()),
  'agents/create': () => import('../components/AIAgentApp.js').then(m => m.AIAgentApp()),
  'agents/edit': () => import('../components/AIAgentApp.js').then(m => m.AIAgentApp()),
};

let currentPage = null;
let contentArea = null;
let onNavigateCallback = null;
let isNavigating = false;

/**
 * Clean up components in content area before navigation
 */
function cleanupContentArea() {
  if (!contentArea) return;
  
  // Find all elements with cleanup methods and call them
  const elementsWithCleanup = contentArea.querySelectorAll('*');
  elementsWithCleanup.forEach(element => {
    if (element._cleanup && typeof element._cleanup === 'function') {
      try {
        element._cleanup();
      } catch (error) {
        console.warn('[Router] Cleanup error:', error);
      }
    }
  });
  
  // Also check the content area itself
  if (contentArea._cleanup && typeof contentArea._cleanup === 'function') {
    try {
      contentArea._cleanup();
    } catch (error) {
      console.warn('[Router] Content area cleanup error:', error);
    }
  }
}

export function initRouter(container, callback) {
  contentArea = container;
  onNavigateCallback = callback;
  
  // Handle hash changes (for navigation via URL)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/')) {
      const page = hash.slice(2).split('?')[0];
      const params = {};
      const queryString = hash.split('?')[1];
      if (queryString) {
        queryString.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        });
      }
      navigate(page, params);
    }
  });
}

export async function navigate(page, params = {}) {
  if (!contentArea) return;

  // Prevent concurrent navigation to avoid infinite loops
  if (isNavigating) {
    console.warn('[Router] Navigation already in progress, skipping...');
    return;
  }

  isNavigating = true;
  currentPage = page;

  // Update URL with params so components can read them via URLSearchParams
  const searchParams = new URLSearchParams(params).toString();
  const newUrl = searchParams ? `/?${searchParams}#/${page}` : `/#/${page}`;
  history.pushState({}, '', newUrl);

  contentArea.innerHTML = '';

  const loading = document.createElement('div');
  loading.className = 'w-full h-full flex items-center justify-center';
  loading.innerHTML = '<div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>';
  contentArea.appendChild(loading);

  try {
    let element;

    if (page.startsWith('effects/template/')) {
      const templateId = page.replace('effects/template/', '');
      const mod = await import('../components/TemplateStudio.js');
      element = mod.TemplateStudio(templateId);
    } else if (page.startsWith('template/')) {
      const templateId = page.replace('template/', '');
      const mod = await import('../components/TemplateStudio.js');
      element = mod.TemplateStudio(templateId);
    } else if (page.startsWith('workflows/')) {
      const mod = await import('../components/WorkflowBuilderApp.js');
      element = mod.WorkflowBuilderApp();
    } else if (page.startsWith('agents/')) {
      const mod = await import('../components/AIAgentApp.js');
      element = mod.AIAgentApp();
    } else if (pageLoaders[page]) {
      element = await pageLoaders[page]();
    } else {
      const mod = await import('../components/PlaceholderPage.js');
      element = mod.PlaceholderPage(page);
    }

    if (currentPage !== page) {
      isNavigating = false;
      return;
    }

    // Clean up previous component before replacing
    cleanupContentArea();
    
    contentArea.innerHTML = '';
    contentArea.appendChild(element);
  } catch (err) {
    console.error(`[Router] Failed to load page: ${page}`, err);
    // Clean up before showing error
    cleanupContentArea();
    
    contentArea.innerHTML = '';
    const errEl = document.createElement('div');
    errEl.className = 'w-full h-full flex items-center justify-center text-red-400 text-sm';
    errEl.textContent = `Failed to load ${page}: ${err.message}`;
    contentArea.appendChild(errEl);
  } finally {
    isNavigating = false;
  }

  if (onNavigateCallback) onNavigateCallback(page);
}

export function getCurrentPage() {
  return currentPage;
}
