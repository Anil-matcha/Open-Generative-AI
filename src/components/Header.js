import { getRouteForItem } from '../lib/router.js';
import { securityService } from '../lib/services/SecurityService.js';

export function Header(navigate) {
  const header = document.createElement('header');
  header.className = 'w-full flex flex-col z-50 sticky top-0';

  const navBar = document.createElement('div');
  navBar.className = 'w-full h-14 bg-app-bg flex items-center justify-between px-4 md:px-6 border-b border-white/5 backdrop-blur-md';

  const leftPart = document.createElement('div');
  leftPart.className = 'flex items-center gap-6';

  const logoContainer = document.createElement('div');
  logoContainer.className = 'cursor-pointer hover:scale-110 transition-transform';
  logoContainer.innerHTML = `
    <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-lg">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="black"/>
        <path d="M2 17L12 22L22 17" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  `;
  logoContainer.onclick = () => navigate('apps');

  const menu = document.createElement('nav');
  menu.className = 'hidden lg:flex items-center gap-5 text-[13px] font-bold text-secondary';
  const items = ['Explore', 'Image', 'Video', 'Tools', 'Storyboard', 'Edit', 'Character', 'Vibe Motion', 'Cinema Studio', 'AI Influencer', 'Apps', 'Templates', 'Assist', 'Community'];

  const links = {};

  const imageDropdownItems = [
    { label: 'Text to Image', route: 'text-to-image' },
    { label: 'Image to Image', route: 'image-to-image' },
  ];

  const videoDropdownItems = [
    { label: 'Text to Video', route: 'text-to-video' },
    { label: 'Image to Video', route: 'image-to-video' },
    { label: 'Video to Video', route: 'video-to-video' },
    { label: 'Watermark Remover', route: 'video-watermark' },
  ];

  const createDropdown = (items, parent) => {
    const dropdown = document.createElement('div');
    dropdown.className = 'absolute top-full left-0 mt-2 w-56 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-2';
    dropdown.innerHTML = items.map(d => `<a class="block px-4 py-2 text-sm text-secondary hover:text-white hover:bg-white/5 cursor-pointer">${d.label}</a>`).join('');
    items.forEach((d, i) => {
      dropdown.children[i].onclick = () => navigate(d.route);
    });
    parent.appendChild(dropdown);
  };

  const toolsDropdownItems = [
    { label: 'Storyboard', route: 'storyboard-page' },
    { label: 'Character', route: 'character-page' },
    { label: 'Vibe Motion', route: 'effects-page' },
    { label: 'Cinema Studio', route: 'cinema-page' },
    { label: 'AI Influencer', route: 'influencer-page' },
    { label: 'Commercial', route: 'commercial-page' },
    { label: 'Upscale', route: 'upscale-page' },
  ];

  items.forEach(item => {
    const link = document.createElement('a');
    link.textContent = item;
    link.className = 'hover:text-white transition-all cursor-pointer relative group whitespace-nowrap';
    if (item === 'Image') link.classList.add('text-white');

    links[getRouteForItem(item)] = link;

    if (item === 'Image') {
      link.classList.remove('text-white');
      link.classList.add('text-white', 'dropdown-trigger');
      link.onclick = () => navigate('text-to-image');
      
      const dropdown = document.createElement('div');
      dropdown.className = 'absolute top-full left-0 mt-2 w-48 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50';
      dropdown.innerHTML = imageDropdownItems.map(d => `<a class="block px-4 py-2 text-sm text-secondary hover:text-white hover:bg-white/5 cursor-pointer">${d.label}</a>`).join('');
      
      imageDropdownItems.forEach((d, i) => {
        dropdown.children[i].onclick = () => navigate(d.route);
      });
      
      link.appendChild(dropdown);
    }

    if (item === 'Video') {
      link.classList.remove('text-white');
      link.classList.add('text-white', 'dropdown-trigger');
      link.onclick = () => navigate('text-to-video');
      
      const dropdown = document.createElement('div');
      dropdown.className = 'absolute top-full left-0 mt-2 w-48 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50';
      dropdown.innerHTML = videoDropdownItems.map(d => `<a class="block px-4 py-2 text-sm text-secondary hover:text-white hover:bg-white/5 cursor-pointer">${d.label}</a>`).join('');
      
      videoDropdownItems.forEach((d, i) => {
        dropdown.children[i].onclick = () => navigate(d.route);
      });
      
      link.appendChild(dropdown);
    }

    if (item === 'Tools') {
      link.classList.add('dropdown-trigger');
      createDropdown(toolsDropdownItems, link);
    }

    if (item === 'Storyboard') {
      link.onclick = () => navigate('storyboard-page');
    } else if (item === 'Character') {
      link.onclick = () => navigate('character-page');
    } else if (item === 'Vibe Motion') {
      link.onclick = () => navigate('effects-page');
    } else if (item === 'Cinema Studio') {
      link.onclick = () => navigate('cinema-page');
    } else if (item === 'AI Influencer') {
      link.onclick = () => navigate('influencer-page');
    } else if (item === 'Image' || item === 'Video' || item === 'Tools') {
      // Already handled above
    } else {
      link.onclick = () => {
        const route = getRouteForItem(item);
        navigate(route);
      };
    }

    menu.appendChild(link);
  });

  leftPart.appendChild(logoContainer);
  leftPart.appendChild(menu);

  const mobileMenuBtn = document.createElement('button');
  mobileMenuBtn.className = 'lg:hidden p-2 text-secondary hover:text-white transition-colors';
  mobileMenuBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';

  const mobileMenu = document.createElement('div');
  mobileMenu.className = 'lg:hidden fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center gap-4 opacity-0 pointer-events-none transition-opacity duration-300';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'absolute top-4 right-4 p-2 text-white';
  closeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  closeBtn.onclick = () => {
    mobileMenu.classList.add('opacity-0', 'pointer-events-none');
    mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
  };
  mobileMenu.appendChild(closeBtn);

  items.forEach(item => {
    const link = document.createElement('a');
    link.textContent = item;
    link.className = 'text-xl font-bold text-secondary hover:text-white transition-colors cursor-pointer';
    
    if (item === 'Image' || item === 'Video' || item === 'Tools') {
      const targetRoute = item === 'Image' ? 'text-to-image' : item === 'Video' ? 'text-to-video' : 'storyboard-page';
      link.onclick = () => {
        navigate(targetRoute);
        mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
      };
      mobileMenu.appendChild(link);
      
      const dropdownItems = item === 'Image' ? imageDropdownItems : item === 'Video' ? videoDropdownItems : toolsDropdownItems;
      dropdownItems.forEach(d => {
        const subLink = document.createElement('a');
        subLink.textContent = '→ ' + d.label;
        subLink.className = 'text-lg font-bold text-muted hover:text-white transition-colors cursor-pointer';
        subLink.onclick = () => {
          navigate(d.route);
          mobileMenu.classList.add('opacity-0', 'pointer-events-none');
          mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
        };
        mobileMenu.appendChild(subLink);
      });
    } else if (item === 'Storyboard') {
      link.onclick = () => {
        navigate('storyboard-page');
        mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
      };
      mobileMenu.appendChild(link);
    } else if (item === 'Character') {
      link.onclick = () => {
        navigate('character-page');
        mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
      };
      mobileMenu.appendChild(link);
    } else if (item === 'Vibe Motion') {
      link.onclick = () => {
        navigate('effects-page');
        mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
      };
      mobileMenu.appendChild(link);
    } else if (item === 'Cinema Studio') {
      link.onclick = () => {
        navigate('cinema-page');
        mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
      };
      mobileMenu.appendChild(link);
    } else if (item === 'AI Influencer') {
      link.onclick = () => {
        navigate('influencer-page');
        mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
      };
      mobileMenu.appendChild(link);
    } else {
      link.onclick = () => {
        navigate(getRouteForItem(item));
        mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
      };
      mobileMenu.appendChild(link);
    }
  });

  mobileMenuBtn.onclick = () => {
    mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
    mobileMenu.classList.add('opacity-100', 'pointer-events-auto');
  };

  const existingMobileMenu = document.querySelector('[data-mobile-menu]');
  if (existingMobileMenu) existingMobileMenu.remove();
  mobileMenu.setAttribute('data-mobile-menu', '');
  document.body.appendChild(mobileMenu);

  const rightPart = document.createElement('div');
  rightPart.className = 'flex items-center gap-3';

  const keyBtn = document.createElement('button');
  keyBtn.className = 'p-2 text-secondary hover:text-white transition-colors';
  keyBtn.title = 'Update API Key';
  keyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.25-2.25"/></svg>';
  keyBtn.onclick = () => {
    securityService.clearStoredKey();
    window.location.reload();
  };

  rightPart.appendChild(mobileMenuBtn);
  rightPart.appendChild(keyBtn);

  navBar.appendChild(leftPart);
  navBar.appendChild(rightPart);
  header.appendChild(navBar);

  header.addEventListener('route-changed', (e) => {
    const page = e.detail.page;
    const imageRoutes = ['image', 'text-to-image', 'image-to-image'];
    const videoRoutes = ['video', 'text-to-video', 'image-to-video', 'video-to-video', 'video-watermark'];
    const toolsRoutes = ['storyboard-page', 'character-page', 'effects-page', 'cinema-page', 'influencer-page', 'commercial-page', 'upscale-page'];
    
    Object.entries(links).forEach(([route, el]) => {
      if (route === page || (page.startsWith('template/') && route === 'templates')) {
        el.classList.add('text-white');
        el.classList.remove('text-secondary');
      } else if (imageRoutes.includes(page) && route === 'Image') {
        el.classList.add('text-white');
        el.classList.remove('text-secondary');
      } else if (videoRoutes.includes(page) && route === 'Video') {
        el.classList.add('text-white');
        el.classList.remove('text-secondary');
      } else if (toolsRoutes.includes(page) && route === 'Tools') {
        el.classList.add('text-white');
        el.classList.remove('text-secondary');
      } else if (page === 'storyboard-page' && route === 'Storyboard') {
        el.classList.add('text-white');
        el.classList.remove('text-secondary');
      } else if (page === 'character-page' && route === 'Character') {
        el.classList.add('text-white');
        el.classList.remove('text-secondary');
      } else if (page === 'effects-page' && route === 'Vibe Motion') {
        el.classList.add('text-white');
        el.classList.remove('text-secondary');
      } else if (page === 'cinema-page' && route === 'Cinema Studio') {
        el.classList.add('text-white');
        el.classList.remove('text-secondary');
      } else if (page === 'influencer-page' && route === 'AI Influencer') {
        el.classList.add('text-white');
        el.classList.remove('text-secondary');
      } else if (route !== 'Image' && route !== 'Video' && route !== 'Tools') {
        el.classList.remove('text-white');
        el.classList.add('text-secondary');
      }
    });
  });

  return header;
}
