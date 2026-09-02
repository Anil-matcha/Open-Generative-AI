export const STUDIO_NAVIGATION = Object.freeze([
    { id: 'home', label: 'Home', path: '/studio/home', section: 'primary' },
    { id: 'selena', label: 'Selena', path: '/studio/selena', section: 'agent' },
    { id: 'image', label: 'Image', path: '/studio/tools/image', section: 'tools' },
    { id: 'video', label: 'Video', path: '/studio/tools/video', section: 'tools' },
    { id: 'audio', label: 'Audio & Voice', path: '/studio/tools/audio', section: 'tools' },
    { id: 'avatar', label: 'Avatar', path: '/studio/tools/avatar', section: 'tools', secondary: true },
    { id: 'music', label: 'Music', path: '/studio/tools/music', section: 'tools', secondary: true },
    { id: 'video-advanced', label: 'Video Advanced', path: '/studio/tools/video-advanced', section: 'tools', secondary: true },
    { id: 'graphics', label: 'Graphics', path: '/studio/tools/graphics', section: 'tools' },
    { id: 'lipsync', label: 'Lip Sync', path: '/studio/tools/lip-sync', section: 'tools', secondary: true },
    { id: 'motion', label: 'Motion Graphics', path: '/studio/tools/motion', section: 'tools', secondary: true },
    { id: 'transform', label: 'Transform', path: '/studio/tools/transform', section: 'tools', secondary: true },
    { id: 'smart-clip', label: 'Smart Clip', path: '/studio/tools/smart-clip', section: 'tools', secondary: true },
    { id: 'generator', label: 'AI Generator', path: '/studio/apps/generator', section: 'apps' },
    { id: 'influencer', label: 'AI Influencer', path: '/studio/apps/influencer', section: 'apps' },
    { id: 'graphic-studio', label: 'Graphic Studio', path: '/studio/apps/graphic-studio', section: 'apps' },
    { id: 'scene-builder', label: 'Scene Builder', path: '/studio/apps/scene-builder', section: 'apps' },
    { id: 'music-video', label: 'Music Video', path: '/studio/apps/music-video', section: 'apps' },
    { id: 'marketing', label: 'Marketing Studio', path: '/studio/apps/marketing', section: 'apps' },
    { id: 'edit-studio', label: 'Edit Studio', path: '/studio/apps/edit-studio', section: 'apps' },
    { id: 'agent-team', label: 'Agent Team', path: '/studio/apps/agent-team', section: 'apps' },
    { id: 'workflows', label: 'Workflows', path: '/studio/workflows', section: 'primary' },
    { id: 'projects', label: 'Projects', path: '/studio/projects', section: 'primary' },
    { id: 'assets', label: 'Assets', path: '/studio/assets', section: 'primary' },
    { id: 'publish', label: 'Publish', path: '/studio/publish', section: 'primary' },
    { id: 'agent-blueprints', label: 'Agent Blueprints', path: '/studio/advanced/agents', section: 'advanced' },
    { id: 'marketplace', label: 'Marketplace', path: '/studio/advanced/marketplace', section: 'advanced' },
    { id: 'provider-settings', label: 'Provider Settings', path: '/studio/advanced/providers', section: 'advanced' },
]);

const ROUTE_ALIASES = Object.freeze({
    '': 'home',
    creator: 'selena',
    storyboard: 'scene-builder',
    image: 'image',
    video: 'video',
    audio: 'audio',
    cinema: 'video-advanced',
    layers: 'graphic-studio',
    'design-agent': 'graphic-studio',
    agents: 'agent-blueprints',
    apps: 'marketplace',
    'ai-influencer': 'influencer',
    'music-video': 'music-video',
    clipping: 'smart-clip',
    'vibe-motion': 'motion',
    lipsync: 'lipsync',
    'body-swap': 'transform',
    marketing: 'marketing',
});

export function resolveStudioDestination(segments = []) {
    const parts = Array.isArray(segments) ? segments.filter(Boolean) : [];
    if (parts[0] === 'advanced' && parts[1] === 'agents') return 'agent-blueprints';
    if (parts[0] === 'advanced' && parts[1] === 'marketplace') return 'marketplace';
    if (parts[0] === 'advanced' && parts[1] === 'providers') return 'provider-settings';
    if (parts[0] === 'tools') return STUDIO_NAVIGATION.some((item) => item.id === parts[1]) ? parts[1] : 'image';
    if (parts[0] === 'apps') return STUDIO_NAVIGATION.some((item) => item.id === parts[1]) ? parts[1] : 'generator';
    if (['home', 'selena', 'workflows', 'projects', 'assets', 'publish'].includes(parts[0])) return parts[0];
    return ROUTE_ALIASES[parts[0] || ''] || 'home';
}

export function studioDestination(id) {
    return STUDIO_NAVIGATION.find((item) => item.id === id) || STUDIO_NAVIGATION[0];
}

export function agentBlueprintPath(suffix = '') {
    const normalized = String(suffix || '').replace(/^\/+/, '');
    return `/studio/advanced/agents${normalized ? `/${normalized}` : ''}`;
}
