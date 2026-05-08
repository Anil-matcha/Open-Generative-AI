import { HeaderMegaMenu } from './HeaderMegaMenu.js';
import { SettingsModal } from './SettingsModal.js';

// Get current page from router or URL
function getCurrentPage() {
    return window.__currentPage || 'image';
}

export function Header(navigate) {
    const header = document.createElement('header');
    header.className = 'w-full flex flex-col z-50 sticky top-0';

    // 2. Main Navigation Bar
    const navBar = document.createElement('div');
    navBar.className = 'w-full h-16 bg-black flex items-center justify-between px-4 md:px-6 border-b border-white/5 backdrop-blur-md bg-opacity-95';

    const leftPart = document.createElement('div');
    leftPart.className = 'flex items-center gap-6';

    // Logo
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

    // Mega Menu for Apps
    const megaMenu = HeaderMegaMenu({ navigate, currentPage: getCurrentPage() });

    // Top-level navigation items (core apps)
    const menu = document.createElement('nav');
    menu.className = 'hidden lg:flex items-center gap-6 text-[13px] font-bold text-secondary overflow-x-auto';
    const topLevelItems = [
        { label: 'Image', route: 'image' },
        { label: 'Video', route: 'video' },
        { label: 'Cinema', route: 'cinema' },
        { label: 'Library', route: 'library' },
        { label: 'Templates', route: 'templates' },
        { label: 'Explore', route: 'explore' },
        { label: 'Assist', route: 'assist' }
    ];

    const updateActiveStates = (currentRoute) => {
        Array.from(menu.children).forEach(child => {
            if (child.dataset && child.dataset.route) {
                const isActive = child.dataset.route === currentRoute;
                child.classList.toggle('text-white', isActive);
                // Update dot indicator
                const dot = child.querySelector('.nav-dot');
                if (dot) dot.style.display = isActive ? 'block' : 'none';
            }
        });
    };

    topLevelItems.forEach(item => {
        const link = document.createElement('a');
        link.textContent = item.label;
        link.dataset.route = item.route;
        link.className = 'hover:text-white transition-all cursor-pointer relative group text-secondary';

        // Active Indicator dot
        const dot = document.createElement('div');
        dot.className = 'nav-dot absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full';
        dot.style.display = 'none';
        link.appendChild(dot);

        link.onclick = () => {
            updateActiveStates(item.route);
            navigate(item.route);
        };

        menu.appendChild(link);
    });

    leftPart.appendChild(logoContainer);
    leftPart.appendChild(megaMenu);
    leftPart.appendChild(menu);

    const rightPart = document.createElement('div');
    rightPart.className = 'flex items-center gap-4';

    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-[13px] font-bold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors';
    settingsBtn.title = 'Settings — API key, local models, preferences';
    settingsBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span>Settings</span>
    `;
    settingsBtn.onclick = () => {
        document.body.appendChild(SettingsModal());
    };

    rightPart.appendChild(settingsBtn);

    navBar.appendChild(leftPart);
    navBar.appendChild(rightPart);

    header.appendChild(navBar);

    // Return header with update method
    return {
        element: header,
        updateActiveStates: (currentRoute) => {
            Array.from(menu.children).forEach(child => {
                if (child.dataset && child.dataset.route) {
                    const isActive = child.dataset.route === currentRoute;
                    child.classList.toggle('text-white', isActive);
                    const dot = child.querySelector('.nav-dot');
                    if (dot) dot.style.display = isActive ? 'block' : 'none';
                }
            });
        }
    };
}
