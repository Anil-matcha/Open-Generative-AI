export function HeaderMegaMenu({ navigate, currentPage }) {
  const container = document.createElement('div');
  container.className = 'relative';

  // Mega menu state
  let isOpen = false;
  let searchQuery = '';

  // Navigation groups
  const groups = {
    core: {
      label: 'Core Studios',
      items: [
        { id: 'image', label: 'Image Studio', description: 'Generate images with AI', badge: '20+ models' },
        { id: 'video', label: 'Video Studio', description: 'Create AI videos', badge: '15+ models' },
        { id: 'cinema', label: 'Cinema Studio', description: 'Cinematic shots', badge: '6 cameras' },
        { id: 'character', label: 'Character', description: 'Consistent characters', badge: 'Face ID' },
        { id: 'commercial', label: 'Commercial', description: 'Ads & commercials' },
        { id: 'workflows', label: 'Workflows', description: 'Flow-based workflows' },
        { id: 'agents', label: 'Agents', description: 'AI agents' },
        { id: 'mcp-cli', label: 'MCP & CLI', description: 'MCP & CLI tools' },
      ]
    },
    tools: {
      label: 'Tools & Editors',
      items: [
        { id: 'storyboard', label: 'Storyboard', description: 'Multi-frame sequences' },
        { id: 'effects', label: 'Effects', description: '350+ visual effects' },
        { id: 'edit', label: 'Edit', description: 'Remove, reframe' },
        { id: 'upscale', label: 'Upscale', description: 'AI upscale & enhance' },
        { id: 'vfx', label: 'VFX', description: 'VFX transformations' },
        { id: 'ai-vfx', label: 'AI-VFX', description: '80+ effects' },
      ]
    },
    ai: {
      label: 'AI Apps',
      items: [
        { id: 'audio', label: 'Audio', description: 'Music & speech', badge: 'AI Audio' },
        { id: 'avatar', label: 'Avatar', description: 'AI avatars & lip sync', badge: 'NEW' },
        { id: 'training', label: 'Training', description: 'Train LoRA models', badge: 'NEW' },
        { id: 'video-tools', label: 'Video Tools', description: 'Upscale, edit, translate' },
        { id: 'chat', label: 'Chat', description: 'AI-powered text generation' },
        { id: 'runway-motion', label: 'Motion Controls', description: 'Advanced camera movements', badge: 'NEW' },
        { id: 'tiktok-carousel', label: 'TikTok Carousel', description: 'Create carousels', badge: 'NEW' },
        { id: 'advanced-dubbing', label: 'Advanced Dubbing', description: 'Professional translation', badge: 'NEW' },
      ]
    },
    more: {
      label: 'More',
      items: [
        { id: 'influencer', label: 'Influencer', description: 'Social media content' },
        { id: 'render', label: 'Render', description: 'Rendering & export' },
        { id: 'video-agent', label: 'Video Agent', description: 'AI video assistance' },
        { id: 'director', label: 'Director', description: 'Automated production' },
        { id: 'timeline', label: 'Timeline', description: 'Multi-track editing' },
        { id: 'remix-go', label: 'Remix Go', description: 'Advanced video editor' },
      ]
    }
  };

  const quickLinks = [
    { id: 'templates', label: 'Templates' },
    { id: 'explore', label: 'Explore' },
    { id: 'library', label: 'Library' },
    { id: 'community', label: 'Community' },
    { id: 'assist', label: 'Assist' },
  ];

  // Toggle mega menu
  const toggleMenu = () => {
    isOpen = !isOpen;
    render();
  };

  // Close on click outside
  const handleClickOutside = (e) => {
    if (!container.contains(e.target) && isOpen) {
      isOpen = false;
      render();
    }
  };

  // Navigate to app
  const handleNavigate = (route) => {
    navigate(route);
    isOpen = false;
    render();
  };

  // Simple search filter
  const filterItems = (items, query) => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      item.label.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    );
  };

  // Get recent apps from localStorage
  const getRecentApps = () => {
    try {
      const recent = JSON.parse(localStorage.getItem('recent_tools') || '[]');
      return recent.slice(0, 4).map(id => {
        const allItems = Object.values(groups).flatMap(g => g.items);
        return allItems.find(item => item.id === id);
      }).filter(Boolean);
    } catch {
      return [];
    }
  };

  // Create app card element
  const createAppCard = (app) => {
    const card = document.createElement('button');
    card.className = `flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors text-left w-full ${currentPage === app.id ? 'bg-primary/10' : ''}`;
    card.onclick = () => handleNavigate(app.id);

    const iconSpan = document.createElement('span');
    iconSpan.className = 'w-8 h-8 flex items-center justify-center bg-white/5 rounded-md flex-shrink-0';
    iconSpan.innerHTML = getIconForApp(app.id);

    const textDiv = document.createElement('div');
    textDiv.className = 'flex-1 min-w-0';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'text-sm font-bold text-white flex items-center gap-1';
    labelDiv.textContent = app.label;

    if (app.badge) {
      const badge = document.createElement('span');
      badge.className = 'px-1.5 py-0.5 text-[9px] font-bold bg-primary/20 text-primary rounded';
      badge.textContent = app.badge;
      labelDiv.appendChild(badge);
    }

    const descDiv = document.createElement('div');
    descDiv.className = 'text-xs text-secondary truncate';
    descDiv.textContent = app.description;

    textDiv.appendChild(labelDiv);
    textDiv.appendChild(descDiv);
    card.appendChild(iconSpan);
    card.appendChild(textDiv);

    return card;
  };

  // Get SVG icon for app
  const getIconForApp = (id) => {
    const iconMap = {
      'image': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
      'video': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
      'cinema': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
      'character': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      'default': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>'
    };
    return iconMap[id] || iconMap['default'];
  };

  // Create section element
  const createSection = (title, icon, items) => {
    if (items.length === 0) return document.createDocumentFragment();

    const section = document.createElement('div');
    section.className = 'mb-4';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'text-xs font-bold text-secondary uppercase tracking-wider mb-2';
    titleDiv.textContent = `${icon} ${title}`;

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 md:grid-cols-4 gap-2';

    items.forEach(app => grid.appendChild(createAppCard(app)));

    section.appendChild(titleDiv);
    section.appendChild(grid);

    return section;
  };

  // Main render
  const render = () => {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'relative';
    wrapper.dataset.megaMenu = '';

    // Trigger Button
    const triggerBtn = document.createElement('button');
    triggerBtn.className = `flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-bold ${isOpen ? 'text-white bg-white/10' : 'text-secondary hover:text-white hover:bg-white/5'} transition-all`;
    triggerBtn.onclick = toggleMenu;
    triggerBtn.innerHTML = `
      Apps
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4.5L6 7.5L9 4.5"/></svg>
    `;

    wrapper.appendChild(triggerBtn);

    // Dropdown
    if (isOpen) {
      const dropdown = document.createElement('div');
      dropdown.className = 'absolute top-full left-0 mt-2 w-screen max-w-4xl bg-[#0a0b0f] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden';
      dropdown.style.boxShadow = '0 0 20px rgba(217, 255, 0, 0.1)';

      // Search
      const searchDiv = document.createElement('div');
      searchDiv.className = 'p-4 border-b border-white/5';
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search apps...';
      searchInput.value = searchQuery;
      searchInput.className = 'w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary/50';
      searchInput.oninput = (e) => {
        searchQuery = e.target.value;
        render();
      };
      searchDiv.appendChild(searchInput);
      dropdown.appendChild(searchDiv);

      // Scrollable content
      const scrollDiv = document.createElement('div');
      scrollDiv.className = 'p-4 max-h-96 overflow-y-auto custom-scrollbar';

      const recentApps = getRecentApps();
      const filteredCore = filterItems(groups.core.items, searchQuery);
      const filteredTools = filterItems(groups.tools.items, searchQuery);
      const filteredAI = filterItems(groups.ai.items, searchQuery);
      const filteredMore = filterItems(groups.more.items, searchQuery);

      const totalVisible = filteredCore.length + filteredTools.length + filteredAI.length + filteredMore.length;

      if (searchQuery) {
        const countDiv = document.createElement('div');
        countDiv.className = 'text-xs text-secondary mb-2';
        countDiv.textContent = `Showing ${totalVisible} of ${Object.values(groups).flatMap(g => g.items).length} apps`;
        scrollDiv.appendChild(countDiv);
      }

      // Recent Apps
      if (recentApps.length > 0 && !searchQuery) {
        const recentDiv = document.createElement('div');
        recentDiv.className = 'mb-4 p-4 border-b border-white/5';
        const recentTitle = document.createElement('div');
        recentTitle.className = 'text-xs font-bold text-secondary uppercase tracking-wider mb-2';
        recentTitle.textContent = 'Recent';
        recentDiv.appendChild(recentTitle);

        const recentFlex = document.createElement('div');
        recentFlex.className = 'flex gap-2';
        recentApps.forEach(app => {
          const btn = document.createElement('button');
          btn.className = 'flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm text-white';
          btn.onclick = () => handleNavigate(app.id);
          btn.innerHTML = `<span class="w-5 h-5 flex items-center justify-center">${getIconForApp(app.id)}</span><span>${app.label}</span>`;
          recentFlex.appendChild(btn);
        });
        recentDiv.appendChild(recentFlex);
        scrollDiv.appendChild(recentDiv);
      }

      // Sections
      scrollDiv.appendChild(createSection(groups.core.label, '🎬', filteredCore));
      scrollDiv.appendChild(createSection(groups.tools.label, '🛠️', filteredTools));
      scrollDiv.appendChild(createSection(groups.ai.label, '🤖', filteredAI));
      scrollDiv.appendChild(createSection(groups.more.label, '📚', filteredMore));

      dropdown.appendChild(scrollDiv);

      // Quick Links & View All
      const footerDiv = document.createElement('div');
      footerDiv.className = 'p-4 border-t border-white/5 flex items-center justify-between';

      const linksDiv = document.createElement('div');
      linksDiv.className = 'flex gap-2';
      quickLinks.forEach(link => {
        const btn = document.createElement('button');
        btn.className = 'px-3 py-1 text-xs font-bold text-secondary hover:text-white transition-colors';
        btn.textContent = link.label;
        btn.onclick = () => handleNavigate(link.id);
        linksDiv.appendChild(btn);
      });
      footerDiv.appendChild(linksDiv);

      const viewAllBtn = document.createElement('button');
      viewAllBtn.className = 'px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors';
      viewAllBtn.onclick = () => window.open('#/apps', '_blank');
      viewAllBtn.textContent = 'View All Apps →';
      footerDiv.appendChild(viewAllBtn);

      dropdown.appendChild(footerDiv);

      // Animate in
      dropdown.style.animation = 'megaMenuFadeIn 0.2s ease-out';

      wrapper.appendChild(dropdown);
    }

    container.appendChild(wrapper);

    // Add click outside listener
    setTimeout(() => {
      document.removeEventListener('click', handleClickOutside);
      document.addEventListener('click', handleClickOutside);
    }, 0);
  };

  render();
  return container;
}
