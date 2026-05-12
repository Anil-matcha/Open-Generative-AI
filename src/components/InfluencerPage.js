import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';

const STYLE_PRESETS = ['Realistic', 'DigitalCam', 'Quiet luxury', 'FashionShow', '90s Grain', 'Sunset beach', 'Amalfi Summer', 'Bimbocore', 'Vintage PhotoBooth', 'Gorpcore'];
const FORMAT_PRESETS = ['Instagram Post', 'Story / Reel', 'YouTube Thumb', 'Pinterest Pin'];

const FEATURES = [
  { icon: '📱', title: '20+ Fashion Presets', description: 'Professional styles from quiet luxury to Y2K aesthetics' },
  { icon: '📐', title: 'Format Templates', description: 'Optimized for all social media platforms' },
  { icon: '✨', title: 'AI-Powered', description: 'Transform your photos with professional editing' },
  { icon: '🌟', title: 'Influencer Ready', description: 'Create scroll-stopping content instantly' },
];

export function InfluencerPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center overflow-hidden bg-app-bg relative p-4 md:p-6';

  // Hero
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-8 md:mb-12 animate-fade-in-up transition-all duration-700 w-full';
  const heroBanner = createHeroSection('influencer', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">AI Influencer</h1>
      <p class="text-white/60 text-sm font-medium">Generate scroll-stopping social content with 20+ fashion presets</p>
    `;
    heroBanner.appendChild(heroContent);
    hero.appendChild(heroBanner);
  }
  container.appendChild(hero);

  // Main content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'w-full relative z-40 animate-fade-in-up';
  contentWrapper.style.animationDelay = '0.1s';

  contentWrapper.innerHTML = `
    <!-- Start Creating CTA -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
      <button class="start-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
        Create Content
      </button>
    </div>

    <!-- Features -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-lg font-black text-white mb-1">Influencer-Ready Content</h2>
      <p class="text-sm text-muted mb-4">Create viral content for all platforms</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${FEATURES.map(f => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <div class="text-2xl mb-2">${f.icon}</div>
            <h3 class="text-sm font-bold text-white mb-1">${f.title}</h3>
            <p class="text-xs text-muted">${f.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Style Presets -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-lg font-black text-white mb-1">Style Presets</h2>
      <p class="text-sm text-muted mb-4">Choose from 20+ professional styles</p>
      <div class="flex flex-wrap gap-2">
        ${STYLE_PRESETS.map(style => `
          <span class="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-medium hover:border-primary/20 transition-all cursor-pointer">${style}</span>
        `).join('')}
      </div>
    </div>

    <!-- Format Support -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-lg font-black text-white mb-1">Format Support</h2>
      <p class="text-sm text-muted mb-4">Optimized for all platforms</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${FORMAT_PRESETS.map(fmt => `
          <div class="format-card bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center cursor-pointer hover:border-primary/20 transition-all">
            <span class="text-sm font-bold text-white">${fmt}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- CTA -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl text-center mb-6">
      <h2 class="text-xl md:text-2xl font-black text-white mb-2">Go Viral</h2>
      <p class="text-sm text-muted mb-6">Create influencer content that stops the scroll</p>
      <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
        Get Started Free
      </button>
    </div>
  `;

  container.appendChild(contentWrapper);

  container.querySelector('.start-btn').onclick = () => navigate('influencer');
  container.querySelector('.cta-btn').onclick = () => navigate('influencer');

  return container;
}
