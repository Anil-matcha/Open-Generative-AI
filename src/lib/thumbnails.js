const STUDIO_THUMBNAILS = {
  image: '/thumbnails/studios/image.webp',
  video: '/thumbnails/studios/video.webp',
  cinema: '/thumbnails/studios/cinema.webp',
  storyboard: '/thumbnails/studios/storyboard.webp',
  effects: '/thumbnails/studios/effects.webp',
  edit: '/thumbnails/studios/edit.webp',
  upscale: '/thumbnails/studios/upscale.webp',
  character: '/thumbnails/studios/character.webp',
  commercial: '/thumbnails/studios/commercial.webp',
  audio: '/thumbnails/studios/audio.webp',
  avatar: '/thumbnails/studios/avatar.webp',
  training: '/thumbnails/studios/training.webp',
  videotools: '/thumbnails/studios/videotools.webp',
  chat: '/thumbnails/studios/chat.webp',
  'advanced-dubbing': '/thumbnails/studios/advanced-dubbing.webp',
  'ai-vfx': '/thumbnails/studios/ai-vfx.webp',
  'runway-motion': '/thumbnails/studios/runway-motion.webp',
  'tiktok-carousel': '/thumbnails/studios/tiktok-carousel.webp',
  studio: '/thumbnails/studios/studio.png',
  'unified-studio': '/thumbnails/studios/studio.png',
  'workflow-builder': '/thumbnails/studios/workflow-builder.png',
  'ai-agent': '/thumbnails/studios/ai-agent.png',
  'design-agent': '/thumbnails/studios/design-agent.png',
  'marketing-studio': '/thumbnails/studios/marketing-studio.png',
  'apps-studio': '/thumbnails/studios/apps-studio.png',
  'pomelli': '/thumbnails/studios/pomelli.webp.svg',
  'remix-go': '/thumbnails/studios/remix-go.webp',
  'vibe-workflow': '/thumbnails/studios/vibe-workflow.webp',
  'ai-headshot-generator': '/thumbnails/studios/headshots.webp',
  'ai-headshot-studio': '/thumbnails/studios/headshots.webp',
};

const TOOL_THUMBNAILS = {
  'ai-object-eraser': '/thumbnails/tools/remove-object.webp',
  'ai-background-remover': '/thumbnails/tools/remove-bg.webp',
  'ai-image-extension': '/thumbnails/tools/extend.webp',
  'seedream-5.0-edit': '/thumbnails/tools/ai-edit.webp',
  'ideogram-v3-reframe': '/thumbnails/tools/reframe.webp',
  'ai-dress-change': '/thumbnails/tools/dress-change.webp',
  'ai-skin-enhancer': '/thumbnails/tools/skin-enhance.webp',
  'ai-color-photo': '/thumbnails/tools/colorize.webp',
  'add-image-watermark': '/thumbnails/tools/watermark.webp',
};

const CATEGORY_THUMBNAILS = {
  'Social Media': '/thumbnails/categories/social.webp',
  'Style Transfer': '/thumbnails/categories/style.webp',
  'Entertainment': '/thumbnails/categories/entertainment.webp',
  'Commercial': '/thumbnails/categories/commercial.webp',
  'VFX & Action': '/thumbnails/categories/vfx.webp',
  'Portrait & Creator': '/thumbnails/categories/portrait.webp',
  'Decade & Era': '/thumbnails/categories/decade.webp',
  'Camera & Cinematic': '/thumbnails/categories/camera.webp',
};

const PAGE_THUMBNAILS = {
  community: '/thumbnails/pages/community.webp',
  library: '/thumbnails/pages/library.webp',
  assist: '/thumbnails/pages/assist.webp',
  placeholder: '/thumbnails/pages/placeholder.webp',
};

const HERO_THUMBNAILS = {
  'image': '/thumbnails/heroes/image.webp',
  'video': '/thumbnails/heroes/video.webp',
  'cinema': '/thumbnails/heroes/cinema.webp',
  'storyboard': '/thumbnails/heroes/storyboard.webp',
  'effects': '/thumbnails/heroes/effects.webp',
  'edit': '/thumbnails/heroes/edit.webp',
  'upscale': '/thumbnails/heroes/upscale.webp',
  'character': '/thumbnails/heroes/character.webp',
  'commercial': '/thumbnails/heroes/commercial.webp',
  'influencer': '/thumbnails/heroes/influencer.webp',
  'audio': null,
  'avatar': null,
  'training': null,
  'videotools': null,
  'render': null,
  'chat': null,
  'ai-vfx': '/thumbnails/heroes/ai-vfx.webp',
  'video-agent': '/thumbnails/heroes/videoagent.webp',
  'advanced-dubbing': '/thumbnails/heroes/advanced-dubbing.webp',
  'runway-motion': '/thumbnails/heroes/runway-motion.webp',
  'tiktok-carousel': '/thumbnails/heroes/tiktok-carousel.webp',
  'templates': null,
  'headshots': '/thumbnails/heroes/headshots.webp',
  'apps': '/thumbnails/heroes/apps.webp',
  'explore': '/thumbnails/heroes/explore.webp',
  'ai-video-outreach': '/thumbnails/heroes/ai-video-outreach.webp.png',
  'video-outreach': null,
  'timeline': null,
  'lipsync': null,
  'director': null,
  'marketing-studio': '/thumbnails/heroes/marketing-studio.webp',
  'remix-go': null,
  'pomelli': '/thumbnails/heroes/pomelli.webp.svg',
};

export function getStudioThumbnail(studioId) {
  return STUDIO_THUMBNAILS[studioId] || null;
}

export function getHeroThumbnail(studioId) {
  return HERO_THUMBNAILS[studioId] || null;
}

export function getToolThumbnail(toolId) {
  return TOOL_THUMBNAILS[toolId] || null;
}

export function getCategoryThumbnail(categoryName) {
  return CATEGORY_THUMBNAILS[categoryName] || null;
}

export function getPageThumbnail(pageId) {
  return PAGE_THUMBNAILS[pageId] || null;
}

export function getTemplateThumbnail(templateId) {
  // First try .webp, then fall back to .webp.png (some generated images are PNG format)
  return `/thumbnails/templates/${templateId}.webp`;
}

export function getTemplateThumbnailWithFallback(templateId) {
  // For cinematic templates that may have .webp.png extension
  const webpPath = `/thumbnails/templates/${templateId}.webp`;
  const pngPath = `/thumbnails/templates/${templateId}.webp.png`;
  return { webpPath, pngPath };
}

export function createThumbnailImg(src, alt, className = '') {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  img.className = className;
  img.onerror = () => {
    // Try fallback for template thumbnails (some are .webp.png format)
    if (src.includes('/thumbnails/templates/') && src.endsWith('.webp')) {
      img.src = src + '.png';
      img.onerror = () => {
        img.style.display = 'none';
        const parent = img.parentElement;
        if (parent) parent.classList.add('thumb-fallback');
      };
    } else if ((src.includes('/thumbnails/heroes/') || src.includes('/thumbnails/pages/') || src.includes('/thumbnails/videoagent/')) && src.endsWith('.webp')) {
      // Try fallback for hero, page, videoagent thumbnails (generated as .webp.png)
      img.src = src + '.png';
      img.onerror = () => {
        img.style.display = 'none';
        const parent = img.parentElement;
        if (parent) parent.classList.add('thumb-fallback');
      };
    } else if (src.includes('/thumbnails/studios/') && (src.endsWith('.webp') || src.endsWith('.svg'))) {
      if (src.endsWith('.webp')) {
        img.src = src + '.png';
        img.onerror = () => {
          img.style.display = 'none';
          const parent = img.parentElement;
          if (parent) parent.classList.add('thumb-fallback');
        };
      } else if (src.endsWith('.svg')) {
        img.onerror = () => {
          img.style.display = 'none';
          const parent = img.parentElement;
          if (parent) parent.classList.add('thumb-fallback');
        };
      } else {
        img.style.display = 'none';
        const parent = img.parentElement;
        if (parent) parent.classList.add('thumb-fallback');
      }
    } else {
      img.style.display = 'none';
      const parent = img.parentElement;
      if (parent) parent.classList.add('thumb-fallback');
    }
  };
  img.onload = () => {
    const skeleton = img.parentElement?.querySelector('.thumb-skeleton');
    if (skeleton) skeleton.remove();
  };
  return img;
}

export function createHeroSection(studioId, className = '') {
  const src = getHeroThumbnail(studioId);
  if (!src) return null;
  const wrapper = document.createElement('div');
  wrapper.className = `hero-banner relative w-full overflow-hidden rounded-2xl ${className}`;
  wrapper.innerHTML = '<div class="thumb-skeleton absolute inset-0"></div>';
  const img = createThumbnailImg(src, `${studioId} studio`, 'w-full h-full object-cover');
  wrapper.appendChild(img);
  const overlay = document.createElement('div');
  overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent';
  wrapper.appendChild(overlay);
  return wrapper;
}

// Default thumbnail fallback helper
export function getDefaultThumbnail() {
  return '/thumbnails/studios/studio.webp.svg';
}
