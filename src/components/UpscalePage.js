import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';

const UPSCALE_METHODS = [
  { name: 'AI Upscaler', description: 'General-purpose AI upscaling with 2x/4x factor', factors: ['2x', '4x'] },
  { name: 'Topaz Upscale', description: 'Premium Topaz-quality enhancement', factors: ['2x', '4x', '8x'] },
  { name: 'Seed Upscale', description: 'SeedVR2 high-fidelity upscaling', factors: ['2x', '4x'] },
];

const FEATURES = [
  { icon: '🔍', title: '2x - 8x Upscale', description: 'Increase image resolution up to 8 times original size' },
  { icon: '✨', title: 'AI Enhanced', description: 'Smart detail enhancement during upscaling' },
  { icon: '🎨', title: 'Quality Preserved', description: 'Maintain and enhance image quality and details' },
  { icon: '⚡', title: 'Fast Processing', description: 'Quick and efficient upscaling with AI' },
];

export function UpscalePage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center overflow-hidden bg-app-bg relative p-4 md:p-6';

  // Hero
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-8 md:mb-12 animate-fade-in-up transition-all duration-700 w-full';
  const heroBanner = createHeroSection('upscale', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">Upscale</h1>
      <p class="text-white/60 text-sm font-medium">Enhance and upscale images with AI-powered methods</p>
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
    <div class="flex justify-center mb-8 md:mb-12">
      <button class="start-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
        Upscale Images
        <svg class="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
      </button>
    </div>

    <!-- Features -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Super Resolution</h2>
      <p class="text-sm text-muted mb-6">Upscale your images without quality loss</p>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${FEATURES.map(f => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <div class="text-2xl mb-2">${f.icon}</div>
            <h3 class="text-sm font-bold text-white mb-1">${f.title}</h3>
            <p class="text-muted text-xs">${f.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Upscale Methods -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Upscale Methods</h2>
      <p class="text-sm text-muted mb-6">Choose the best method for your needs</p>
      <div class="grid md:grid-cols-3 gap-4">
        ${UPSCALE_METHODS.map(m => `
          <div class="method-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <h3 class="text-base font-bold text-white mb-1">${m.name}</h3>
            <p class="text-muted text-xs mb-3">${m.description}</p>
            <div class="flex gap-2">
              ${m.factors.map(f => `
                <span class="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">${f}</span>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Upscale Factors -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Upscale Factors</h2>
      <p class="text-sm text-muted mb-6">Increase resolution up to 8x</p>
      <div class="flex flex-wrap justify-center gap-4">
        <div class="factor-card bg-white/5 border border-white/10 rounded-xl px-6 py-3 hover:border-primary/20 transition-all duration-300 text-center cursor-pointer">
          <span class="text-2xl font-black text-white">2x</span>
          <span class="text-muted text-xs block mt-1">Standard</span>
        </div>
        <div class="factor-card bg-white/5 border border-white/10 rounded-xl px-6 py-3 hover:border-primary/20 transition-all duration-300 text-center cursor-pointer">
          <span class="text-2xl font-black text-white">4x</span>
          <span class="text-muted text-xs block mt-1">High Quality</span>
        </div>
        <div class="factor-card bg-white/5 border border-white/10 rounded-xl px-6 py-3 hover:border-primary/20 transition-all duration-300 text-center cursor-pointer">
          <span class="text-2xl font-black text-white">8x</span>
          <span class="text-muted text-xs block mt-1">Maximum</span>
        </div>
      </div>
    </div>

    <!-- Final CTA -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl text-center">
      <h2 class="text-2xl font-black text-white mb-2">Upscale Your Images</h2>
      <p class="text-white/60 text-sm mb-6 max-w-md mx-auto">Enhance resolution with AI-powered upscaling</p>
      <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
        Get Started Free
      </button>
    </div>
  `;

  container.appendChild(contentWrapper);

  container.querySelector('.start-btn').onclick = () => navigate('upscale');
  container.querySelector('.cta-btn').onclick = () => navigate('upscale');

  return container;
}
