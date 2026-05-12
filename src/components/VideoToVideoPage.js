import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';

const VIDEO_TO_VIDEO_MODELS = [
  { name: 'AI Video Style Transfer', description: 'Apply artistic styles to your videos', category: 'AI Tools' },
  { name: 'AI Video Color Grading', description: 'Professional color grading for videos', category: 'AI Tools' },
  { name: 'AI Video Slow Motion', description: 'Create smooth slow motion effects', category: 'AI Tools' },
  { name: 'AI Video Speed Ramping', description: 'Dynamic speed changes', category: 'AI Tools' },
];

const EXAMPLE_PROMPTS = [
  { prompt: 'Transform to anime/cartoon style', model: 'AI Video Style Transfer' },
  { prompt: 'Apply cinematic color grading with teal and orange tones', model: 'AI Video Color Grading' },
  { prompt: 'Convert to dramatic slow motion at 60fps', model: 'AI Video Slow Motion' },
];

const FEATURES = [
  { icon: '🎨', title: 'Style Transfer', description: 'Apply artistic styles and effects to existing videos' },
  { icon: '🎞️', title: 'Speed Control', description: 'Create slow motion or speed up your footage' },
  { icon: '🎬', title: 'Professional Grading', description: 'Cinematic color grading and LUTs' },
  { icon: '⚡', title: 'Real-time Preview', description: 'See changes instantly before rendering' },
];

export function VideoToVideoPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center overflow-hidden bg-app-bg relative p-4 md:p-6';

  // ==========================================
  // 1. HERO SECTION
  // ==========================================
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-8 md:mb-12 animate-fade-in-up w-full max-w-5xl';
  const heroBanner = createHeroSection('video', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">Video to Video</h1>
      <p class="text-white/60 text-sm font-medium">Transform and enhance your videos with AI-powered editing tools</p>
    `;
    heroBanner.appendChild(heroContent);
    hero.appendChild(heroBanner);
  }
  container.appendChild(hero);

  // ==========================================
  // 2. MAIN CONTENT
  // ==========================================
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'w-full max-w-5xl relative z-40 animate-fade-in-up';
  contentWrapper.style.animationDelay = '0.1s';

  contentWrapper.innerHTML = `
    <!-- Features Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Transform Your Footage</h2>
      <p class="text-sm text-muted mb-4">Professional video transformation tools at your fingertips</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${FEATURES.map(f => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300">
            <div class="text-3xl mb-3">${f.icon}</div>
            <h3 class="text-sm font-black text-white mb-1">${f.title}</h3>
            <p class="text-xs text-muted">${f.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Tools Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Available Tools</h2>
      <p class="text-sm text-muted mb-4">Powerful video transformation tools</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${VIDEO_TO_VIDEO_MODELS.map(m => `
          <button class="model-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300 text-left" data-model="${m.name}">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-black text-white truncate mr-2">${m.name}</span>
              <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full flex-shrink-0">${m.category}</span>
            </div>
            <p class="text-xs text-muted">${m.description}</p>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Example Prompts Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Example Transformations</h2>
      <p class="text-sm text-muted mb-4">Get inspired by these video transformations</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${EXAMPLE_PROMPTS.map((p, i) => `
          <div class="prompt-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 cursor-pointer transition-all duration-300">
            <div class="flex items-center justify-between mb-3">
              <span class="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">${p.model}</span>
              <button class="text-xs text-muted hover:text-white transition-colors try-btn">Try this →</button>
            </div>
            <p class="text-sm text-gray-300 leading-relaxed">${p.prompt}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- CTA Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl text-center">
      <h2 class="text-2xl md:text-3xl font-black text-white mb-2">Transform Your Videos</h2>
      <p class="text-sm text-muted mb-6 max-w-md mx-auto">Start editing your videos with powerful AI tools</p>
      <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">Get Started Free</button>
    </div>
  `;

  container.appendChild(contentWrapper);

  // ==========================================
  // 3. EVENT LISTENERS
  // ==========================================
  container.querySelector('.start-btn')?.addEventListener('click', () => navigate('video'));
  container.querySelector('.cta-btn').addEventListener('click', () => navigate('video'));

  container.querySelectorAll('.model-card').forEach(card => {
    card.addEventListener('click', () => {
      const modelName = card.dataset.model;
      localStorage.setItem('prefill_model', modelName);
      navigate('video');
    });
  });

  container.querySelectorAll('.prompt-card').forEach((card, i) => {
    card.addEventListener('click', () => {
      const prompt = EXAMPLE_PROMPTS[i];
      localStorage.setItem('prefill_prompt', prompt.prompt);
      localStorage.setItem('prefill_model', prompt.model);
      navigate('video');
    });
  });

  container.querySelectorAll('.prompt-card .try-btn').forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const prompt = EXAMPLE_PROMPTS[i];
      localStorage.setItem('prefill_prompt', prompt.prompt);
      localStorage.setItem('prefill_model', prompt.model);
      navigate('video');
    });
  });

  return container;
}
