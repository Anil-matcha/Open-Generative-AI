import { t } from '../lib/i18n.js';

export function Sidebar() {
  const element = document.createElement('aside');
  element.className = 'glass-panel';
  element.style.width = '72px';
  element.style.height = '100%';
  element.style.display = 'flex';
  element.style.flexDirection = 'column';
  element.style.alignItems = 'center';
  element.style.padding = '1.5rem 0';
  element.style.zIndex = '50';
  element.style.background = 'var(--bg-panel)';

  // Logo
  const logo = document.createElement('div');
  logo.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/><path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  logo.className = 'mb-10 text-primary';
  element.appendChild(logo);

  const navItems = [
    { id: 'image', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>', label: t('sidebar.canvas') },
    { id: 'video', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>', label: t('sidebar.video') },
    { id: 'library', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>', label: t('sidebar.library') },
  ];

  const bottomItems = [
    { id: 'settings', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', label: t('sidebar.settings') }
  ];

  let activeTab = 'image';

  const createButton = (item) => {
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center gap-1 mb-6 cursor-pointer group';

    const iconBtn = document.createElement('button');
    iconBtn.innerHTML = item.icon;
    iconBtn.className = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-transparent text-secondary group-hover:bg-white/5 group-hover:text-white';

    const label = document.createElement('span');
    label.textContent = item.label;
    label.className = 'text-[9px] font-bold uppercase tracking-widest text-secondary group-hover:text-white transition-colors';

    if (activeTab === item.id && item.id !== 'settings') {
      iconBtn.classList.add('active-nav-btn');
      iconBtn.style.color = 'var(--color-primary)';
      label.style.color = 'var(--color-primary)';
    }

    container.onclick = () => {
      const event = new CustomEvent('navigate', { detail: { page: item.id } });
      window.dispatchEvent(event);

      if (item.id !== 'settings') {
        activeTab = item.id;
        element.querySelectorAll('.active-nav-btn').forEach(btn => {
          btn.classList.remove('active-nav-btn');
          btn.style.color = 'var(--text-secondary)';
          btn.nextSibling.style.color = 'var(--text-secondary)';
        });
        iconBtn.classList.add('active-nav-btn');
        iconBtn.style.color = 'var(--color-primary)';
        label.style.color = 'var(--color-primary)';
      }
    };

    container.appendChild(iconBtn);
    container.appendChild(label);
    return container;
  };

  const navContainer = document.createElement('div');
  navContainer.className = 'flex flex-col flex-1 w-full items-center';
  navItems.forEach(item => navContainer.appendChild(createButton(item)));
  element.appendChild(navContainer);

  const bottomContainer = document.createElement('div');
  bottomContainer.className = 'flex flex-col w-full items-center mt-auto';
  bottomItems.forEach(item => bottomContainer.appendChild(createButton(item)));
  element.appendChild(bottomContainer);

  return element;
}

