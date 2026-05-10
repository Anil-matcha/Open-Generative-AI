import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';

const WATERMARK_TOOLS = [
  { name: 'AI Video Watermark Remover', description: 'Remove watermarks from videos using AI', category: 'Watermark' },
  { name: 'AI Video Object Remover', description: 'Remove unwanted objects from videos', category: 'Removal' },
  { name: 'AI Video Logo Remover', description: 'Remove logos and branding from videos', category: 'Removal' },
];

const FEATURES = [
  { icon: '🧹', title: 'Smart Removal', description: 'AI-powered watermark and object removal with seamless results' },
  { icon: '🎯', title: 'Precise Editing', description: 'Remove unwanted elements while preserving video quality' },
  { icon: '⚡', title: 'Fast Processing', description: 'Quick and efficient video processing with AI' },
  { icon: '🎬', title: 'Professional Results', description: 'Clean, broadcast-quality output every time' },
];

const STEPS = [
  { number: '01', title: 'Upload Video', description: 'Simply upload your video with watermark or unwanted content' },
  { number: '02', title: 'AI Processing', description: 'Our AI analyzes and intelligently removes the watermark' },
  { number: '03', title: 'Download', description: 'Download your clean, watermark-free video instantly' },
];

export function VideoWatermarkPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden';

  // Hero
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-8 md:mb-12 animate-fade-in-up transition-all duration-700 w-full max-w-5xl';
  const heroBanner = createHeroSection('video', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">Video Watermark Remover</h1>
      <p class="text-white/60 text-sm font-medium">Remove watermarks, logos, and unwanted elements from your videos with AI</p>
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
        Remove Watermarks Free
        <svg class="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
      </button>
    </div>

    <!-- Features -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Powerful Removal Tools</h2>
      <p class="text-sm text-muted mb-6">Everything you need to clean up your videos</p>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${FEATURES.map(f => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300">
            <div class="text-2xl mb-2">${f.icon}</div>
            <h3 class="text-sm font-bold text-white mb-1">${f.title}</h3>
            <p class="text-muted text-xs">${f.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- How It Works -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">How It Works</h2>
      <p class="text-sm text-muted mb-6">Remove watermarks in three simple steps</p>
      <div class="grid md:grid-cols-3 gap-4">
        ${STEPS.map(s => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <div class="text-5xl font-bold text-primary/30 mb-2">${s.number}</div>
            <h3 class="text-base font-bold text-white mb-1">${s.title}</h3>
            <p class="text-muted text-xs">${s.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Available Tools -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Available Tools</h2>
      <p class="text-sm text-muted mb-6">Professional video cleaning tools</p>
      <div class="grid md:grid-cols-3 gap-4">
        ${WATERMARK_TOOLS.map(m => `
          <button class="model-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300 text-left cursor-pointer" data-model="${m.name}">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-bold text-white">${m.name}</span>
              <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">${m.category}</span>
            </div>
            <p class="text-muted text-xs">${m.description}</p>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Final CTA -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl text-center">
      <h2 class="text-2xl font-black text-white mb-2">Clean Your Videos Today</h2>
      <p class="text-white/60 text-sm mb-6 max-w-md mx-auto">Remove watermarks and unwanted content with powerful AI</p>
      <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
        Get Started Free
      </button>
    </div>
  `;

  container.appendChild(contentWrapper);

  // Event Listeners
  container.querySelector('.start-btn').onclick = () => navigate('video');
  container.querySelector('.cta-btn').onclick = () => navigate('video');

  container.querySelectorAll('.model-card').forEach(card => {
    card.onclick = () => {
      const modelName = card.dataset.model;
      localStorage.setItem('prefill_model', modelName);
      navigate('video');
    };
  });

  return container;
}
