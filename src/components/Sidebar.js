export function Sidebar(navigate) {
  const element = document.createElement('aside');
  element.className = 'hidden md:flex flex-col items-center py-4 z-40 border-r border-white/5 bg-panel-bg overflow-y-auto custom-scrollbar';
  element.style.width = '68px';

  const navItems = [
    { id: 'apps', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>', label: 'Apps', tooltip: 'Apps — Browse and launch all available AI creative tools and applications' },
    { id: 'workflows', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="5" y2="16"/><line x1="12" y1="8" x2="19" y2="16"/><line x1="5" y1="19" x2="19" y2="19"/></svg>', label: 'Workflows', tooltip: 'Workflows — Create and manage automated multi-step creative pipelines' },
    { id: 'image', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>', label: 'Image', tooltip: 'Image — Generate, edit, and enhance images using AI-powered tools' },
    { id: 'video', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>', label: 'Video', tooltip: 'Video — Create, edit, and produce AI-generated or imported video content' },
    { id: 'cinema', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>', label: 'Cinema', tooltip: 'Cinema — Access cinematic film templates and movie-style production tools' },
    { id: 'headshots', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a4 4 0 110 8 4 4 0 010-8z"/><path d="M4 21v-1a8 8 0 0116 0v1"/><rect x="16" y="14" width="6" height="6" rx="1"/></svg>', label: 'Headshots', tooltip: 'Headshots — Generate professional AI headshots from your photos' },
    { id: 'ai-headshot', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 11v2"/><path d="M8 14c1 1 4 1 8 0"/></svg>', label: 'AI Headshot', tooltip: 'AI Headshot — Create studio-quality portrait photos using advanced AI models' },
    { id: 'character', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', label: 'Character', tooltip: 'Character — Design and manage AI characters for your creative projects' },
    { id: 'ai-vfx', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>', label: 'AI-VFX', tooltip: 'AI-VFX — Add AI-generated visual effects and compositing to your media' },
    { id: 'influencer', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6v12a3 3 0 103 3V6a3 3 0 10-3 3z"/></svg>', label: 'Influencer', tooltip: 'Influencer — Create influencer-style content and social media campaigns' },
    { id: 'storyboard', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="6" height="8" rx="1"/><rect x="9" y="3" width="6" height="8" rx="1"/><rect x="16" y="3" width="6" height="8" rx="1"/><rect x="2" y="13" width="6" height="8" rx="1"/><rect x="9" y="13" width="6" height="8" rx="1"/><rect x="16" y="13" width="6" height="8" rx="1"/></svg>', label: 'Storyboard', tooltip: 'Storyboard — Plan and visualize your video scenes with AI-assisted storyboarding' },
    { id: 'effects', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', label: 'Effects', tooltip: 'Effects — Browse and apply creative visual effects and filters to your projects' },
    { id: 'vfx', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>', label: 'VFX', tooltip: 'VFX — Access professional visual effects tools for video and image compositing' },
    { id: 'edit', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>', label: 'Edit', tooltip: 'Edit — Open the editor to modify and refine your media assets and projects' },
    { id: 'upscale', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>', label: 'Upscale', tooltip: 'Upscale — Increase image and video resolution using AI super-resolution' },
    { id: 'audio', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>', label: 'Audio', tooltip: 'Audio — Add, edit, and mix audio tracks, music, and sound effects' },
    { id: 'avatar', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 11v2"/><path d="M8 14c1 1 4 1 8 0"/></svg>', label: 'Avatar', tooltip: 'Avatar — Create and customize AI-powered digital avatars and personas' },
    { id: 'training', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>', label: 'Training', tooltip: 'Training — Train custom AI models on your own data and style preferences' },
    { id: 'videotools', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3V9z"/></svg>', label: 'Video Tools', tooltip: 'Video Tools — Access specialized utilities for video processing and enhancement' },
    { id: 'render', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="3" x2="19" y2="21"/></svg>', label: 'Render', tooltip: 'Render — Export and render your final projects in various formats and qualities' },
    { id: 'video-agent', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/><path d="M8 15h8"/><path d="M12 2v2"/></svg>', label: 'Video Agent', tooltip: 'Video Agent — Use AI to automatically generate and edit video content' },
    { id: 'video-outreach', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 4L2 12l7 3 3 7 10-18z"/><path d="M22 4L9 15"/></svg>', label: 'Outreach', tooltip: 'Outreach — Create and manage video outreach campaigns for audience engagement' },
    { id: 'director', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6l4-4h4l4 4"/><path d="M2 6h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>', label: 'Director', tooltip: 'Director — Access director-mode tools for cinematic scene composition and planning' },
    { id: 'timeline', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/><circle cx="6" cy="6" r="1.5" fill="currentColor"/><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="6" cy="18" r="1.5" fill="currentColor"/></svg>', label: 'Timeline', tooltip: 'Timeline — Open the multi-track timeline editor for arranging and sequencing media' },
    { id: 'runway-motion', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/><path d="M12 13l1.5 2.5"/></svg>', label: 'Motion', tooltip: 'Motion — Generate motion graphics and animated content from images and video' },
    { id: 'tiktok-carousel', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="6" y="6" width="12" height="12" rx="1"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="15" cy="15" r="1"/></svg>', label: 'TikTok', tooltip: 'TikTok — Create short-form vertical videos optimized for TikTok and Reels' },
    { id: 'advanced-dubbing', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 9l12-2"/><path d="M9 13l12-2"/></svg>', label: 'Dubbing', tooltip: 'Dubbing — Add AI-generated voiceovers and dubbed audio in multiple languages' },
    { id: 'chat', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>', label: 'Chat', tooltip: 'Chat — Chat with AI assistants to brainstorm ideas and get creative help' },
    { id: 'commercial', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>', label: 'Commercial', tooltip: 'Commercial — Create professional commercial and advertisement content with AI' },
    { id: 'templates', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>', label: 'Templates', tooltip: 'Templates — Browse and use pre-built project templates to jumpstart your work' },
    { id: 'explore', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>', label: 'Explore', tooltip: 'Explore — Discover trending creations, inspiration, and community showcases' },
    { id: 'library', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>', label: 'Library', tooltip: 'Library — Access your media library of uploaded and generated assets' },
    { id: 'community', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>', label: 'Community', tooltip: 'Community — Connect with other creators, share work, and collaborate' },
    { id: 'marketing-studio', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5h18v14H3z"/><path d="M7 9h10"/><path d="M7 13h6"/></svg>', label: 'Marketing', tooltip: 'Marketing — Create marketing materials, ads, and promotional content with AI' },
    { id: 'assist', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l1.09 3.26L16 6l-2.91.74L12 10l-1.09-3.26L8 6l2.91-.74L12 2z"/><path d="M5 15l.54 1.63L7 17.17l-1.46.37L5 19.17l-.54-1.63L3 17.17l1.46-.37L5 15z"/><path d="M19 11l.54 1.63L21 13.17l-1.46.37L19 15.17l-.54-1.63L17 13.17l1.46-.37L19 11z"/></svg>', label: 'Assist', tooltip: 'Assist — Get AI-powered suggestions and automated help for your creative tasks' },
    { id: 'commits', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="M8 3v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V3"/><path d="M14 9h-4"/><path d="M14 12h-2"/><path d="M14 15h-4"/></svg>', label: 'Commits (0)', tooltip: 'Commits — View version history and saved snapshots of your project' },
    { id: 'remix-go', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3V9z"/><circle cx="16" cy="14" r="2"/></svg>', label: 'Remix Go', tooltip: 'Remix Go — Quickly remix and iterate on existing projects and templates' },
    { id: 'ai-vfx', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/><circle cx="12" cy="8" r="1"/><path d="M12 14v4"/></svg>', label: 'AI-VFX', tooltip: 'AI-VFX — Generate cinematic visual effects using AI-powered tools' },
    { id: 'sendspark', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/><circle cx="12" cy="19" r="1"/><circle cx="7" cy="4" r="1"/><circle cx="17" cy="4" r="1"/></svg>', label: 'Sendspark', tooltip: 'Sendspark — Create personalized video messages for outreach and engagement' },
  ];

  const bottomItems = [
    { id: 'settings', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>', label: 'Settings', tooltip: 'Settings — Configure application preferences, account, and workspace options' },
  ];

  const buttons = {};

  const createButton = (item) => {
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center gap-0.5 mb-1 cursor-pointer group w-full px-2';
    container.setAttribute('data-tooltip', item.tooltip);

    const iconBtn = document.createElement('button');
    iconBtn.innerHTML = item.icon;
    iconBtn.className = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-transparent text-secondary group-hover:bg-white/5 group-hover:text-white';
    iconBtn.setAttribute('data-tooltip', item.tooltip);

    const label = document.createElement('span');
    label.textContent = item.label;
    label.className = 'text-[9px] font-bold uppercase tracking-wider text-secondary group-hover:text-white transition-colors';

    if (item.id === 'image') {
      iconBtn.style.color = 'var(--color-primary)';
      iconBtn.classList.add('bg-primary/10');
      label.style.color = 'var(--color-primary)';
    }

    container.onclick = () => {
      if (item.id === 'settings') {
        const event = new CustomEvent('navigate', { detail: { page: 'settings' } });
        window.dispatchEvent(event);
        return;
      }
      navigate(item.id);
    };

    // Add data attributes for testing
    container.setAttribute('data-route', item.id);

    container.appendChild(iconBtn);
    container.appendChild(label);
    buttons[item.id] = { iconBtn, label };
    return container;
  };

  const navContainer = document.createElement('div');
  navContainer.className = 'flex flex-col flex-1 w-full items-center pt-2 gap-1';
  navItems.forEach(item => navContainer.appendChild(createButton(item)));
  element.appendChild(navContainer);

  const bottomContainer = document.createElement('div');
  bottomContainer.className = 'flex flex-col w-full items-center mt-auto';
  bottomItems.forEach(item => bottomContainer.appendChild(createButton(item)));
  element.appendChild(bottomContainer);

  element.addEventListener('route-changed', (e) => {
    const page = e.detail.page;
    const mappedPage = page.startsWith('template/') ? 'apps' : page;

    Object.entries(buttons).forEach(([id, { iconBtn, label }]) => {
      if (id === mappedPage) {
        iconBtn.style.color = 'var(--color-primary)';
        iconBtn.classList.add('bg-primary/10');
        label.style.color = 'var(--color-primary)';
      } else {
        iconBtn.style.color = '';
        iconBtn.classList.remove('bg-primary/10');
        label.style.color = '';
      }
    });
  });

  return element;
}
