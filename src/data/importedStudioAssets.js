// Marketing Studio Asset Manifest
// Source: packages/studio/src/components/MarketingStudio.jsx from Open-Generative-AI

export const MARKETING_STUDIO_ASSETS = {
  avatar: [
    { id: "aa252283-8591-4d14-91a8-41ce54187992", name: "Priya", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Priya.webp" },
    { id: "ba6c9b18-f79c-4dab-9649-88a181d0a038", name: "Elena", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Elena.webp" },
    { id: "30e2cadd-987c-4a7a-81c3-094d4fb3a65e", name: "Kai", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Kai.webp" },
    { id: "fbed59e1-4b8d-4625-9140-ef2044e0be72", name: "Sora", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Sora.webp" },
    { id: "bcd9e6ee-c000-48e6-9f4b-a20fc2a674f7", name: "Minji", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Minji.webp" },
    { id: "1da384ed-3856-45e4-bf4c-a496c7aa95ff", name: "Margot", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Margot.webp" },
    { id: "b799c8f5-fb6e-4905-b33b-cdefac153ec3", name: "Niko", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Niko.webp" },
    { id: "b6971dd4-55fa-4e64-b318-392b16504284", name: "Jin", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Jin.webp" }
  ],
  ugc: [
    { id: 1, name: "UGC", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/ugc.mp4" },
    { id: 2, name: "Tutorial", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/ugc_how_to.mp4" },
    { id: 3, name: "Unboxing", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/ugc_unboxing.mp4" },
    { id: 4, name: "Hyper Motion", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/hyper-motion-mini.mp4" },
    { id: 5, name: "Product Review", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/product_review.mp4" },
    { id: 6, name: "TV Spot", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/tv-spot-mini.mp4" }
  ]
};

export const WORKFLOW_STUDIO_ASSETS = {
  templates: [
    { id: "text-to-image-flow", name: "Text to Image Flow", description: "Generate images from text prompts" },
    { id: "image-to-video-flow", name: "Image to Video Flow", description: "Animate images into videos" },
    { id: "batch-processing", name: "Batch Processing", description: "Process multiple inputs at once" },
    { id: "storyboard-generator", name: "Storyboard Generator", description: "Create storyboards from concepts" }
  ],
  nodeSchemas: {}
};

export const AGENT_STUDIO_ASSETS = {
  roles: [
    { id: "creative-director", name: "Creative Director Agent", icon: "🎨", description: "Plan cinematic creative direction" },
    { id: "prompt-engineer", name: "Prompt Engineer Agent", icon: "📝", description: "Optimize prompts for AI models" },
    { id: "video-planning", name: "Video Planning Agent", icon: "🎬", description: "Plan video scenes and storyboards" },
    { id: "storyboard", name: "Storyboard Agent", icon: "📋", description: "Create visual storyboards" },
    { id: "marketing", name: "Marketing Agent", icon: "📈", description: "Generate marketing content" },
    { id: "design", name: "Design Agent", icon: "✨", description: "Create UI designs and layouts" },
    { id: "workflow", name: "Workflow Agent", icon: "🔗", description: "Build AI workflows" },
    { id: "render", name: "Render Assistant", icon: "📤", description: "Optimize render settings" }
  ],
  tools: [
    "generate-image", "generate-video", "create-storyboard", "rewrite-prompt",
    "build-workflow", "landing-copy", "analyze-brand", "camera-movement",
    "suggest-effects", "send-render", "send-director", "save-library"
  ]
};

export const DESIGN_AGENT_ASSETS = {
  categories: [
    { id: "posters-flyers", name: "Posters/Flyers", icon: "🖼️" },
    { id: "social-posts", name: "Social Posts", icon: "📱" },
    { id: "logos", name: "Logos", icon: "🔤" },
    { id: "brand-identity", name: "Brand Identity Boards", icon: "🎨" },
    { id: "ui-mockups", name: "UI Mockups/App Screens", icon: "💻" },
    { id: "product-mockups", name: "Product Mockups/Lifestyle", icon: "🛍️" },
    { id: "illustrations", name: "Illustrations", icon: "🎨" },
    { id: "youtube-thumbnails", name: "YouTube Thumbnails", icon: "▶️" },
    { id: "print", name: "Print", icon: "🖨️" },
    { id: "packaging-merch", name: "Packaging/Merch", icon: "📦" },
    { id: "motion-ads", name: "Motion Ads/Social Video", icon: "🎥" },
    { id: "animated-logos", name: "Animated Logos", icon: "🔤" },
    { id: "spokesperson", name: "Spokesperson/Talking Head", icon: "👤" }
  ],
  styles: [
    { id: "luxury-saas", name: "Luxury SaaS", description: "Premium, sophisticated design" },
    { id: "dark-glassmorphism", name: "Dark Glassmorphism", description: "Modern glass-like effects" },
    { id: "cinematic-ai", name: "Cinematic AI", description: "Movie-style visuals" },
    { id: "futuristic-tech", name: "Futuristic Tech", description: "Sci-fi inspired" },
    { id: "clean-minimal", name: "Clean Minimal", description: "Simple, uncluttered" },
    { id: "bold-drm", name: "Bold Direct Response", description: "High-converting designs" },
    { id: "premium-agency", name: "Premium Agency", description: "Professional studio look" },
    { id: "neon-creator", name: "Neon Creator Studio", description: "Glowing, vibrant" }
  ]
};

export const MARKETING_STUDIO_OPTIONS = {
  ratio: ["9:16", "3:4", "4:3", "16:9", "1:1"],
  res: ["720p", "1080p"],
  duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
};

export function getDefaultAvatar() {
  return MARKETING_STUDIO_ASSETS.avatar[0];
}

export function getAvatarByName(name) {
  return MARKETING_STUDIO_ASSETS.avatar.find(a => a.name === name) || getDefaultAvatar();
}

export function getVideoFormatByName(name) {
  return MARKETING_STUDIO_ASSETS.ugc.find(u => u.name === name) || MARKETING_STUDIO_ASSETS.ugc[0];
}

export function getDefaultWorkflowTemplate() {
  return WORKFLOW_STUDIO_ASSETS.templates[0];
}

export function getAgentRoleById(id) {
  return AGENT_STUDIO_ASSETS.roles.find(r => r.id === id) || AGENT_STUDIO_ASSETS.roles[0];
}

export function getDesignCategoryById(id) {
  return DESIGN_AGENT_ASSETS.categories.find(c => c.id === id) || DESIGN_AGENT_ASSETS.categories[0];
}

export function getDesignStyleById(id) {
  return DESIGN_AGENT_ASSETS.styles.find(s => s.id === id) || DESIGN_AGENT_ASSETS.styles[0];
}
