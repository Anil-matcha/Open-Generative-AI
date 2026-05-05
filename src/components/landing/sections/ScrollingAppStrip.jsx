// Scrolling App Strip - Enhanced with parallax and interactive hover effects

export function ScrollingAppStrip() {
  const section = document.createElement('section');
  section.className = 'py-8 bg-[#020205] border-y border-white/5 overflow-hidden relative';
  section.setAttribute('aria-label', 'Available AI Apps');

  const apps = [
    { name: 'Image', icon: '🖼️', color: 'cyan' },
    { name: 'Video', icon: '🎬', color: 'purple' },
    { name: 'Cinema Studio', icon: '🎥', color: 'cyan' },
    { name: 'Character', icon: '🧑', color: 'emerald' },
    { name: 'AI-VFX', icon: '✨', color: 'pink' },
    { name: 'Influencer', icon: '🌟', color: 'yellow' },
    { name: 'Storyboard', icon: '📋', color: 'purple' },
    { name: 'Effects', icon: '🎭', color: 'cyan' },
    { name: 'VFX', icon: '💥', color: 'pink' },
    { name: 'Edit', icon: '✂️', color: 'emerald' },
    { name: 'Upscale', icon: '🔍', color: 'cyan' },
    { name: 'Audio', icon: '🎵', color: 'purple' },
    { name: 'Avatar', icon: '👤', color: 'yellow' },
    { name: 'Training', icon: '🏋️', color: 'emerald' },
    { name: 'Video Tools', icon: '🔧', color: 'cyan' },
    { name: 'Render', icon: '🚀', color: 'pink' },
    { name: 'Video Agent', icon: '🤖', color: 'purple' },
    { name: 'Director', icon: '🎬', color: 'cyan' },
    { name: 'Timeline', icon: '⏱️', color: 'emerald' },
    { name: 'Motion', icon: '🎪', color: 'pink' },
    { name: 'TikTok', icon: '📱', color: 'yellow' },
    { name: 'Dubbing', icon: '🎙️', color: 'purple' },
    { name: 'Chat', icon: '💬', color: 'cyan' },
    { name: 'Commercial', icon: '💼', color: 'emerald' },
    { name: 'Templates', icon: '📁', color: 'pink' },
    { name: 'Explore', icon: '🔍', color: 'yellow' },
    { name: 'Library', icon: '📚', color: 'cyan' },
    { name: 'Community', icon: '👥', color: 'purple' },
    { name: 'Assist', icon: '🧠', color: 'emerald' },
    { name: 'Lip Sync', icon: '🎭', color: 'pink' },
    { name: 'Workflows', icon: '⚙️', color: 'cyan' },
    { name: 'Agents', icon: '🤖', color: 'yellow' },
    { name: 'MCP & CLI', icon: '💻', color: 'purple' }
  ];

  // Duplicate for seamless loop
  const allApps = [...apps, ...apps];

  section.innerHTML = `
    <div class="relative">
      <!-- Gradient overlays -->
      <div class="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#020205] to-transparent z-20 pointer-events-none"></div>
      <div class="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#020205] to-transparent z-20 pointer-events-none"></div>
      
      <!-- Scrolling strip container -->
      <div class="app-strip-wrapper overflow-hidden py-2">
        <div class="app-strip flex gap-4 animate-scroll">
          ${allApps.map((app, i) => `
            <div 
              class="app-chip flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full whitespace-nowrap cursor-pointer hover:scale-105 transition-transform duration-200 group"
              data-app="${app.name}"
            >
              <span class="w-2 h-2 rounded-full bg-${app.color}-400 group-hover:w-3 group-hover:h-3 transition-all duration-200"></span>
              <span class="text-sm text-gray-300 group-hover:text-white transition-colors duration-200">${app.name}</span>
              <span class="text-sm opacity-50 group-hover:opacity-100 transition-opacity duration-200">${app.icon}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Second row - reverse direction -->
      <div class="app-strip-wrapper-reverse overflow-hidden py-2 mt-2">
        <div class="app-strip-reverse flex gap-4 animate-scroll-reverse">
          ${allApps.slice().reverse().map((app, i) => `
            <div class="app-chip flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full whitespace-nowrap cursor-pointer hover:scale-105 transition-transform duration-200 group">
              <span class="w-2 h-2 rounded-full bg-${app.color}-400 group-hover:w-3 group-hover:h-3 transition-all duration-200"></span>
              <span class="text-sm text-gray-300 group-hover:text-white transition-colors duration-200">${app.name}</span>
              <span class="text-sm opacity-50 group-hover:opacity-100 transition-opacity duration-200">${app.icon}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <style>
      @keyframes scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      @keyframes scroll-reverse {
        0% { transform: translateX(-50%); }
        100% { transform: translateX(0); }
      }
      .animate-scroll {
        animation: scroll 40s linear infinite;
      }
      .animate-scroll-reverse {
        animation: scroll-reverse 45s linear infinite;
      }
      .app-chip:hover {
        border-color: rgba(34, 211, 238, 0.5);
        background-color: rgba(34, 211, 238, 0.1);
      }
      @media (prefers-reduced-motion: reduce) {
        .animate-scroll, .animate-scroll-reverse { animation: none; }
        .app-strip, .app-strip-reverse { flex-wrap: wrap; justify-content: center; }
        .app-chip:hover { transform: none; }
      }
    </style>
  `;

  // Add click interaction
  setTimeout(() => {
    section.querySelectorAll('.app-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const appName = chip.dataset.app;
        // Could navigate to app page
        console.log(`Clicked on ${appName}`);
      });
    });
  }, 100);

  return section;
}
