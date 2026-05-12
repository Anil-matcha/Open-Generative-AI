import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';

const EFFECT_TABS = [
  { label: 'Image Effects', count: '150+' },
  { label: 'Nano Banana', count: '50+' },
  { label: 'Kontext Effects', count: '75+' },
  { label: 'Video Effects', count: '100+' },
];

const FEATURES = [
  { icon: '✨', title: '350+ Effects', description: 'Access a massive library of visual effects for images and videos' },
  { icon: '🎬', title: 'Video Support', description: 'Apply effects to both static images and video content' },
  { icon: '⚡', title: 'Real-time Preview', description: 'See your effects instantly before applying' },
  { icon: '🎨', title: 'Customizable', description: 'Fine-tune each effect to match your vision' },
];

const EXAMPLE_EFFECTS = [
  { name: 'Cyberpunk Neon', category: 'Image Effects' },
  { name: 'Vintage Film Grain', category: 'Image Effects' },
  { name: 'Motion Blur', category: 'Video Effects' },
  { name: 'Glitch Effect', category: 'Video Effects' },
];

export function EffectsPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center overflow-hidden bg-app-bg relative p-4 md:p-6';

  // Hero
  const hero = createHeroSection('effects', 'h-64 md:h-80 lg:h-96 mb-4');
  if (hero) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `<h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-1">Vibe Motion</h1><p class="text-white/60 text-sm font-medium mb-3">Apply stunning visual effects to your photos and videos</p><button class="start-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">Browse Effects</button>`;
    hero.appendChild(heroContent);
    container.appendChild(hero);
  }

  // Features section
  const featuresSection = document.createElement('div');
  featuresSection.className = 'w-full max-w-5xl mb-8';
  featuresSection.innerHTML = `
    <h2 class="text-xl font-bold text-white mb-2">Unlimited Creativity</h2>
    <p class="text-sm text-secondary mb-6">Powerful effects for every type of content</p>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      ${FEATURES.map(f => `
        <div class="feature-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300 cursor-pointer">
          <div class="text-2xl mb-3">${f.icon}</div>
          <h3 class="text-sm font-bold text-white mb-1">${f.title}</h3>
          <p class="text-xs text-secondary">${f.description}</p>
        </div>
      `).join('')}
    </div>
  `;
  container.appendChild(featuresSection);

  // Effect categories section
  const categoriesSection = document.createElement('div');
  categoriesSection.className = 'w-full max-w-5xl mb-8';
  categoriesSection.innerHTML = `
    <h2 class="text-xl font-bold text-white mb-2">Effect Categories</h2>
    <p class="text-sm text-secondary mb-6">Explore effects by category</p>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      ${EFFECT_TABS.map(tab => `
        <div class="category-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300 text-center cursor-pointer">
          <h3 class="text-sm font-bold text-white mb-1">${tab.label}</h3>
          <span class="text-xs text-primary font-medium">${tab.count} Effects</span>
        </div>
      `).join('')}
    </div>
  `;
  container.appendChild(categoriesSection);

  // Popular effects section
  const effectsSection = document.createElement('div');
  effectsSection.className = 'w-full max-w-5xl mb-8';
  effectsSection.innerHTML = `
    <h2 class="text-xl font-bold text-white mb-2">Popular Effects</h2>
    <p class="text-sm text-secondary mb-6">Most used effects by our community</p>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      ${EXAMPLE_EFFECTS.map(e => `
        <div class="effect-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300 cursor-pointer">
          <div class="h-24 rounded-lg bg-primary/10 mb-3 flex items-center justify-center">
            <span class="text-2xl">✨</span>
          </div>
          <span class="text-sm font-bold text-white">${e.name}</span>
          <span class="text-xs text-secondary block">${e.category}</span>
        </div>
      `).join('')}
    </div>
  `;
  container.appendChild(effectsSection);

  // CTA section
  const ctaSection = document.createElement('div');
  ctaSection.className = 'w-full max-w-5xl mb-8';
  ctaSection.innerHTML = `
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-8 md:p-12 shadow-3xl text-center">
      <h2 class="text-xl md:text-2xl font-bold text-white mb-2">Explore Effects</h2>
      <p class="text-sm text-secondary mb-6">Apply stunning visual effects to your content</p>
      <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">Get Started Free</button>
    </div>
  `;
  container.appendChild(ctaSection);

  // Event handlers
  const startBtn = container.querySelector('.start-btn');
  if (startBtn) startBtn.onclick = () => navigate('effects');
  container.querySelector('.cta-btn').onclick = () => navigate('effects');

  return container;
}
