import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';

const SCENE_PRESETS = ['Studio white', 'Luxury marble', 'Outdoor natural', 'Lifestyle kitchen', 'Neon showroom', 'Wooden table', 'Minimalist', 'Beach sand', 'Office desk'];
const FORMAT_PRESETS = ['Ad Banner', 'Social Post', 'Story', 'Billboard'];

const FEATURES = [
  { icon: '🛍️', title: 'Product Photography', description: 'AI-powered product shots with professional lighting' },
  { icon: '📢', title: 'Ad Creation', description: 'Create compelling advertisements instantly' },
  { icon: '🎨', title: 'Scene Presets', description: '9+ professional scene backgrounds and settings' },
  { icon: '📐', title: 'Multi-Format', description: 'Export for all advertising platforms' },
];

export function CommercialPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center overflow-hidden bg-app-bg relative p-4 md:p-6';

  // Hero section
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-8 md:mb-12 animate-fade-in-up transition-all duration-700 w-full max-w-5xl';
  const heroBanner = createHeroSection('commercial', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">Commercial</h1>
      <p class="text-white/60 text-sm font-medium">AI product photography, ads, and commercial content</p>
    `;
    heroBanner.appendChild(heroContent);
    hero.appendChild(heroBanner);
  }
  container.appendChild(hero);

  // Main content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'w-full max-w-5xl relative z-40 animate-fade-in-up';
  contentWrapper.style.animationDelay = '0.1s';

  contentWrapper.innerHTML = `
    <!-- CTA Button -->
    <div class="flex justify-center mb-8">
      <button class="start-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
        Create Ads
      </button>
    </div>

    <!-- Features -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Professional Results</h2>
      <p class="text-sm text-muted mb-6">Create commercial content that converts</p>
      <div class="grid md:grid-cols-2 gap-4">
        ${FEATURES.map(f => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all">
            <div class="text-2xl mb-2">${f.icon}</div>
            <h3 class="text-base font-black text-white mb-1">${f.title}</h3>
            <p class="text-muted text-sm">${f.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Scene Presets -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Scene Presets</h2>
      <p class="text-sm text-muted mb-6">Professional backgrounds for any product</p>
      <div class="flex flex-wrap gap-3">
        ${SCENE_PRESETS.map(scene => `
          <span class="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-medium hover:border-primary/20 transition-all cursor-pointer">${scene}</span>
        `).join('')}
      </div>
    </div>

    <!-- Export Formats -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Export Formats</h2>
      <p class="text-sm text-muted mb-6">Optimized for all advertising platforms</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${FORMAT_PRESETS.map(fmt => `
          <div class="format-card bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center cursor-pointer hover:border-primary/20 transition-all">
            <span class="text-sm font-black text-white">${fmt}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- CTA Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl text-center">
      <h2 class="text-2xl font-black text-white mb-2">Create Commercials</h2>
      <p class="text-white/60 text-sm mb-6">Professional product photography at scale</p>
      <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
        Get Started Free
      </button>
    </div>
  `;

  container.appendChild(contentWrapper);

  container.querySelector('.start-btn').onclick = () => navigate('commercial');
  container.querySelector('.cta-btn').onclick = () => navigate('commercial');

  return container;
}
