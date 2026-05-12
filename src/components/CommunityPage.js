import { getPageThumbnail, createThumbnailImg } from '../lib/thumbnails.js';

export function CommunityPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col overflow-hidden bg-app-bg';

  const inner = document.createElement('div');
  inner.className = 'w-full px-4 md:px-8 py-8 md:py-12';

  const heroBlock = document.createElement('div');
  heroBlock.className = 'mb-10 animate-fade-in-up';
  const communityThumb = getPageThumbnail('community');
  if (communityThumb) {
    const bannerWrapper = document.createElement('div');
    bannerWrapper.className = 'relative w-full h-40 md:h-56 rounded-2xl overflow-hidden mb-6';
    bannerWrapper.innerHTML = '<div class="thumb-skeleton absolute inset-0"></div>';
    const img = createThumbnailImg(communityThumb, 'Community', 'w-full h-full object-cover');
    bannerWrapper.appendChild(img);
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent';
    bannerWrapper.appendChild(overlay);
    const textOverlay = document.createElement('div');
    textOverlay.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    textOverlay.innerHTML = '<h1 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">Community</h1><p class="text-white/60 text-sm md:text-base max-w-xl">Connect, share, and collaborate with fellow creators</p>';
    bannerWrapper.appendChild(textOverlay);
    heroBlock.appendChild(bannerWrapper);
  }
  inner.appendChild(heroBlock);

  const linksSection = document.createElement('div');
  linksSection.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 animate-fade-in-up';
  linksSection.style.animationDelay = '0.1s';

  const links = [
    { name: 'GitHub', description: 'Star and contribute to the open-source project', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>', color: 'bg-white/10 text-white', href: '#' },
    { name: 'Discord', description: 'Join the community chat and get help', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>', color: 'bg-[#5865F2]/10 text-[#5865F2]', href: '#' },
    { name: 'Twitter / X', description: 'Follow for updates and featured creations', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>', color: 'bg-white/10 text-white', href: '#' },
    { name: 'Share Creation', description: 'Submit your best AI generations to be featured', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>', color: 'bg-primary/10 text-primary', href: '#' },
  ];

  links.forEach(link => {
    const card = document.createElement('a');
    card.href = link.href;
    card.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5 flex items-start gap-4 hover:bg-white/[0.06] hover:border-white/10 transition-all group';
    card.innerHTML = `
      <div class="w-12 h-12 rounded-xl ${link.color} border border-white/10 flex items-center justify-center shrink-0">${link.icon}</div>
      <div>
        <div class="text-sm font-bold text-white group-hover:text-primary transition-colors">${link.name}</div>
        <div class="text-xs text-muted mt-0.5">${link.description}</div>
      </div>
    `;
    linksSection.appendChild(card);
  });
  inner.appendChild(linksSection);

  const statsSection = document.createElement('div');
  statsSection.className = 'animate-fade-in-up';
  statsSection.style.animationDelay = '0.2s';
  statsSection.innerHTML = `
    <h2 class="text-lg font-bold text-white mb-4">Platform Stats</h2>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
        <div class="text-2xl font-black text-primary">52</div>
        <div class="text-xs text-muted mt-1">Template Apps</div>
      </div>
      <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
        <div class="text-2xl font-black text-primary">350+</div>
        <div class="text-xs text-muted mt-1">Visual Effects</div>
      </div>
      <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
        <div class="text-2xl font-black text-primary">225+</div>
        <div class="text-xs text-muted mt-1">AI Models</div>
      </div>
      <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
        <div class="text-2xl font-black text-primary">9</div>
        <div class="text-xs text-muted mt-1">Editing Tools</div>
      </div>
    </div>
  `;
  inner.appendChild(statsSection);

  container.appendChild(inner);
  return container;
}
