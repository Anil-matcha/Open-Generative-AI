import { describe, it, expect } from 'vitest';

const MODULE_LOAD_TIMEOUT = 10000;
const HEAVY_LOAD_TIMEOUT = 60000;

// Route to component path mapping from router.js pageLoaders
const ROUTE_COMPONENTS = {
  // Core studio routes
  image: '../../src/components/ImageStudio.js',
  video: '../../src/components/VideoStudio.js',
  cinema: '../../src/components/CinemaStudio.js',
  apps: '../../src/components/AppsHub.js',
  templates: '../../src/components/TemplatesPage.js',
  effects: '../../src/components/EffectsStudio.js',
  vfx: '../../src/components/EffectsStudio.js',
  'ai-vfx': '../../src/components/AIVFXStudio.js',
  edit: '../../src/components/EditStudio.js',
  upscale: '../../src/components/UpscaleStudio.js',
  library: '../../src/components/LibraryPage.js',
  character: '../../src/components/CharacterStudio.js',
  influencer: '../../src/components/InfluencerStudio.js',
  commercial: '../../src/components/CommercialStudio.js',
  explore: '../../src/components/ExplorePage.js',
  avatar: '../../src/components/AvatarStudio.js',
  audio: '../../src/components/AudioStudio.js',
  training: '../../src/components/TrainingStudio.js',
  videotools: '../../src/components/VideoToolsStudio.js',
  chat: '../../src/components/ChatStudio.js',
  lipsync: '../../src/components/LipSyncStudio.js',
  
  // Workflow routes
  workflows: '../../src/components/VibeWorkflowPage.js',
  'workflows/editor': '../../src/components/VibeWorkflowPage.js',
  'workflows/history': '../../src/components/VibeWorkflowPage.js',
  'workflows/settings': '../../src/components/VibeWorkflowPage.js',
  
  // Agent and tool routes
  agents: '../../src/components/AgentStudio.js',
  'mcp-cli': '../../src/components/McpCliStudio.js',
  'video-outreach': '../../src/components/VideoOutreachStudio.js',
  
  // Utility routes
  assist: '../../src/components/AssistPage.js',
  community: '../../src/components/CommunityPage.js',
  storyboard: '../../src/components/StoryboardStudio.js',
  
  // Template/AI generation routes
  'text-to-image': '../../src/components/TextToImagePage.js',
  'image-to-image': '../../src/components/ImageToImagePage.js',
  'text-to-video': '../../src/components/TextToVideoPage.js',
  'image-to-video': '../../src/components/ImageToVideoPage.js',
  'video-to-video': '../../src/components/VideoToVideoPage.js',
  'video-watermark': '../../src/components/VideoWatermarkPage.js',
  
  // Page routes
  'storyboard-page': '../../src/components/StoryboardPage.js',
  'character-page': '../../src/components/CharacterPage.js',
  'effects-page': '../../src/components/EffectsPage.js',
  'cinema-page': '../../src/components/CinemaPage.js',
  'influencer-page': '../../src/components/InfluencerPage.js',
  'commercial-page': '../../src/components/CommercialPage.js',
  'upscale-page': '../../src/components/UpscalePage.js',
  
  // Rendering and agent routes
  render: '../../src/components/RenderPage.js',
  'video-agent': '../../src/components/VideoAgentPage.js',
  director: '../../src/components/DirectorPage.js',
  
  // Timeline routes (heavy imports - need extra timeout)
  timeline: '../../src/components/TimelineEditorPage.jsx',
  'timeline-test': '../../src/components/TimelineTestPage.jsx',
  
  // Additional routes
  'remix-go': '../../src/components/RemixGoPage.js',
  'ai-video-outreach': '../../src/components/AIVideoOutreachPage.js',
  'ai-headshot': '../../src/components/AIHeadshotPage.js',
  'runway-motion': '../../src/components/RunwayMotionStudio.js',
  'tiktok-carousel': '../../src/components/TikTokCarouselStudio.js',
  'advanced-dubbing': '../../src/components/AdvancedDubbingStudio.js',
  
  // Landing and headshots
  landing: '../../src/components/landing/LandingPage.jsx',
  headshots: '../../src/components/HeadshotStudioPage.js',
  'headshots-generate': '../../src/components/HeadshotStudioPage.js',
  'headshots-history': '../../src/components/HeadshotStudioPage.js',
  'headshots-settings': '../../src/components/HeadshotStudioPage.js',
};

// Heavy routes that need extended timeout due to deep dependency chains
const HEAVY_ROUTES = ['timeline', 'timeline-test', 'image', 'video', 'cinema', 'vfx', 'ai-vfx', 'render', 'director', 'video-agent'];

// Unique component paths from routes
const COMPONENT_PATHS = [
  '../../src/components/ImageStudio.js',
  '../../src/components/VideoStudio.js',
  '../../src/components/CinemaStudio.js',
  '../../src/components/AppsHub.js',
  '../../src/components/TemplatesPage.js',
  '../../src/components/EffectsStudio.js',
  '../../src/components/AIVFXStudio.js',
  '../../src/components/EditStudio.js',
  '../../src/components/UpscaleStudio.js',
  '../../src/components/LibraryPage.js',
  '../../src/components/CharacterStudio.js',
  '../../src/components/InfluencerStudio.js',
  '../../src/components/CommercialStudio.js',
  '../../src/components/ExplorePage.js',
  '../../src/components/AvatarStudio.js',
  '../../src/components/AudioStudio.js',
  '../../src/components/TrainingStudio.js',
  '../../src/components/VideoToolsStudio.js',
  '../../src/components/ChatStudio.js',
  '../../src/components/LipSyncStudio.js',
  '../../src/components/VibeWorkflowPage.js',
  '../../src/components/AgentStudio.js',
  '../../src/components/McpCliStudio.js',
  '../../src/components/VideoOutreachStudio.js',
  '../../src/components/AssistPage.js',
  '../../src/components/CommunityPage.js',
  '../../src/components/StoryboardStudio.js',
  '../../src/components/TextToImagePage.js',
  '../../src/components/ImageToImagePage.js',
  '../../src/components/TextToVideoPage.js',
  '../../src/components/ImageToVideoPage.js',
  '../../src/components/VideoToVideoPage.js',
  '../../src/components/VideoWatermarkPage.js',
  '../../src/components/StoryboardPage.js',
  '../../src/components/CharacterPage.js',
  '../../src/components/EffectsPage.js',
  '../../src/components/CinemaPage.js',
  '../../src/components/InfluencerPage.js',
  '../../src/components/CommercialPage.js',
  '../../src/components/UpscalePage.js',
  '../../src/components/RenderPage.js',
  '../../src/components/VideoAgentPage.js',
  '../../src/components/DirectorPage.js',
  '../../src/components/TimelineEditorPage.jsx',
  '../../src/components/TimelineTestPage.jsx',
  '../../src/components/RemixGoPage.js',
  '../../src/components/AIVideoOutreachPage.js',
  '../../src/components/AIHeadshotPage.js',
  '../../src/components/RunwayMotionStudio.js',
  '../../src/components/TikTokCarouselStudio.js',
  '../../src/components/AdvancedDubbingStudio.js',
  '../../src/components/landing/LandingPage.jsx',
  '../../src/components/HeadshotStudioPage.js',
];

// Lib modules from main.js
const LIB_MODULES = [
  '../../src/lib/router.js',
  '../../src/lib/performance.js',
  '../../src/lib/enhanced-performance-monitor.js',
  '../../src/lib/memory-leak-detector.js',
  '../../src/lib/media-loader.js',
  '../../src/lib/performance-budget.js',
  '../../src/lib/analytics.js',
  '../../src/lib/loading.js',
  '../../src/lib/editor/generationService.js',
  '../../src/lib/auth-hardening.js',
  '../../src/lib/environment-config.js',
  '../../src/lib/performance-hardening.js',
  '../../src/lib/error-handling.js',
  '../../src/lib/security/index.js',
  '../../src/lib/security.js',
  '../../src/lib/muapiEnhanced.js',
  '../../src/lib/muapiConfig.js',
  '../../src/lib/error-reporter.js',
  '../../src/lib/error-boundary.js',
  '../../src/lib/health-check.js',
];

// Workspace apps
const APPS = [
  'apps/ai-headshot-generator',
  'apps/marketing-studio',
  'apps/agents',
  'apps/vibe-workflow',
  'apps/open-pomelli',
  'apps/vibe-workflow/client',
  'apps/remix-go',
  'apps/director/frontend',
  'apps/ai-vfx',
  'apps/ai-storyboarder/frontend',
];

describe('Module Loading Tests', () => {
  describe('Routes', () => {
    for (const [route, path] of Object.entries(ROUTE_COMPONENTS)) {
      const isHeavy = HEAVY_ROUTES.includes(route);
      it(`should load route "${route}" from ${path}`, async () => {
        await expect(
          import(path).then(m => {
            expect(m).toBeDefined();
            return m;
          })
        ).resolves.toBeDefined();
      }, isHeavy ? HEAVY_LOAD_TIMEOUT : MODULE_LOAD_TIMEOUT);
    }
  });

  describe('Components', () => {
    for (const path of COMPONENT_PATHS) {
      const isHeavy = ['../../src/components/ImageStudio.js', '../../src/components/VideoStudio.js', '../../src/components/CinemaStudio.js', '../../src/components/TimelineEditorPage.jsx', '../../src/components/TimelineTestPage.jsx'].includes(path);
      it(`should load component ${path}`, async () => {
        await expect(
          import(path).then(m => {
            expect(m).toBeDefined();
            return m;
          })
        ).resolves.toBeDefined();
      }, isHeavy ? HEAVY_LOAD_TIMEOUT : MODULE_LOAD_TIMEOUT);
    }
  });

  describe('Lib Modules', () => {
    for (const path of LIB_MODULES) {
      it(`should load lib module ${path}`, async () => {
        await expect(
          import(path).then(m => {
            expect(m).toBeDefined();
            return m;
          })
        ).resolves.toBeDefined();
      }, MODULE_LOAD_TIMEOUT);
    }
  });

  describe('Workspace Apps', () => {
    for (const appPath of APPS) {
      it(`should have valid package.json for ${appPath}`, async () => {
        const packageJson = await import(`../../${appPath}/package.json`, {
          assert: { type: 'json' }
        }).then(m => m.default || m);
        
        expect(packageJson).toBeDefined();
        expect(packageJson.name).toBeDefined();
        expect(typeof packageJson.name).toBe('string');
      });
    }
  });

  describe('Module', () => {
    it('should have valid package.json for modules/layout', async () => {
      const packageJson = await import('../../modules/layout/package.json', {
        assert: { type: 'json' }
      }).then(m => m.default || m);
      
      expect(packageJson).toBeDefined();
      expect(packageJson.name).toBeDefined();
      expect(typeof packageJson.name).toBe('string');
    });
  });
});
