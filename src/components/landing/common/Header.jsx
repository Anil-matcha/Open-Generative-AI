// Landing Page Header - Cinematic Command Center style
import { navigate } from "../../../lib/router.js";

export function LandingHeader() {
  const header = document.createElement('header');
  header.className = 'sticky top-0 z-50 w-full h-16 backdrop-blur-md bg-[#0a0b0f] border-b border-white/10';
  
  // Navigation links mapping
  const navItems = [
    { label: 'Explore', href: '/explore' },
    { label: 'Image', href: '/image' },
    { label: 'Video', href: '/video' },
    { label: 'Audio', href: '/audio' },
    { label: 'Collab', href: '/generate' },
    { label: 'Canvas', href: '/canvas', isNew: true },
    { label: 'Edit', href: '/edit' },
    { label: 'Character', href: '/character' },
    { label: 'Marketing Studio', href: '/marketing-studio/product', isNew: true },
    { label: 'Cinema Studio', href: '/cinema-studio' },
    { label: 'Originals', href: '/original-series' },
    { label: 'MCP', href: '/mcp', isNew: true },
    { label: 'Apps', href: '/apps' },
    { label: 'Assist', href: '/chat' },
    { label: 'Community', href: '/community' },
  ];

  const navLinks = navItems.map(item => `
    <a href="${item.href}" 
       class="py-1 px-3 text-[#e4e4e7] font-medium transition hover:text-[#22d3ee] text-sm"
       ${item.isNew ? 'data-new="true"' : ''}>
      ${item.label}${item.isNew ? '<span class="ml-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-cyan-400/20 text-cyan-400 px-1.5 py-0.5">New</span>' : ''}
    </a>
  `).join('');

  header.innerHTML = `
    <nav class="grid grid-cols-[1fr_auto_1fr] md:grid-cols-[auto_1fr_auto] pr-4 h-full items-center relative container">
      <!-- Logo -->
      <a href="/" class="shrink-0 flex items-center gap-2 mr-2 transition hover:text-[#22d3ee] active:opacity-60">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center border border-cyan-400/30 bg-cyan-400/10" style="box-shadow: 0 0 16px rgba(56,189,248,0.12);">
          <svg width="24" height="24" viewBox="0 0 80 80" fill="none">
            <rect width="80" height="80" rx="16" fill="#22d3ee"/>
            <path d="M64.2786 39.6003L64.2323 39.0943C63.7939 34.2383 60.6336 25.102 51.8677 25.102C45.3627 25.102 40.4487 31.5229 36.112 37.1838C32.6515 41.7173 29.6533 45.6063 26.3542 45.6063C25.4773 45.5146 24.3472 45.0772 23.6555 44.0877C23.0326 43.1898 22.8712 42.0393 23.1939 40.6585C23.7011 38.4722 26.6081 36.447 29.6758 34.2838C31.3594 33.1333 33.09 31.9135 34.2895 30.7399C37.75 27.4031 39.5031 24.9866 39.5031 21.0976C39.5031 17.2087 37.3579 15.2751 35.5585 14.4465C31.9598 12.79 26.6775 13.7564 23.3096 16.6565C22.8024 17.117 22.2946 17.5537 21.833 17.968C18.442 20.9828 16.1586 23.0312 10.9219 21.4657V27.7712C17.8653 30.8322 23.7018 24.9866 25.9164 22.2943C27.6232 20.5223 29.4225 19.4866 30.7609 19.4866H30.8304C31.4302 19.5097 31.9374 19.7399 32.307 20.1542C32.9068 20.8449 33.1376 21.6504 33.0219 22.5476C32.7679 24.4351 30.8072 26.6437 27.2085 29.0602C22.9869 31.891 15.9284 36.6317 15.3743 42.5921C14.959 46.8729 17.1736 51.1531 20.6341 52.8096C28.7077 56.63 33.6216 50.0481 38.8345 43.0981C42.8253 37.736 46.6085 32.6504 51.8684 32.6504C56.5972 32.6504 58.3502 36.5624 58.3502 39.0251V39.5086L57.8887 39.6003C46.424 41.6256 40.1723 52.3498 40.1723 57.2976C40.1723 62.2454 44.3708 66.48 49.538 66.48C55.5821 66.48 63.0559 61.3251 64.2555 46.8267L64.3017 46.2977H69.0769V39.601H64.2786V39.6003ZM58.0269 47.0332C57.1044 55.709 52.652 59.7596 49.9533 59.7596C48.7306 59.7596 47.0238 58.7469 47.0238 56.8602C47.0238 54.7432 50.1841 48.3223 57.2889 46.4125L58.1194 46.2053L58.0269 47.0339V47.0332Z" fill="#020205"/>
          </svg>
        </div>
        <span class="hidden md:block text-lg font-bold text-white">Timeline Editor</span>
      </a>
      
      <!-- Navigation -->
      <div id="header__menu_list" class="hidden md:grid grid-flow-col-dense items-center auto-cols-min overflow-x-auto hide-scrollbar gap-1">
        ${navLinks}
      </div>
      
      <!-- Right actions -->
      <div class="shrink-0 flex items-center gap-3">
        <button id="sign-in-btn" class="px-4 py-2 text-sm text-[#e4e4e7] hover:text-[#22d3ee] transition font-medium" style="border-radius: 0;">
          Sign In
        </button>
        <button id="get-started-btn" class="px-4 py-2 text-sm bg-cyan-400 text-[#020205] hover:bg-cyan-300 transition font-medium" style="border-radius: 0; letter-spacing: 0.05em; text-transform: uppercase;">
          Get Started
        </button>
      </div>
    </nav>
  `;

  return header;
}
